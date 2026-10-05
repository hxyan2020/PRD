import { randomBytes } from "crypto";
import { getDb, writeAudit } from "@/lib/db";
import { matchSkill } from "@/lib/ai/skills";
import { retrieveRag } from "@/lib/ai/rag";
import { logSpineEvent } from "@/lib/ai/spine";
import { syncInterventionsFromSkillRuns } from "@/lib/ai/intervention";
import {
  challengeAnalysisIfNeeded,
  ensureChallengerSchema,
  getChallengeForAnalysis,
} from "@/lib/ai/challenger";

type AlertRow = {
  id: number;
  alert_id: string;
  indicator_id: number;
  severity: string;
  title: string;
  message: string;
  observed_value: number | null;
  status: string;
};

type IndicatorRow = {
  id: number;
  monitor_id: string;
  name: string;
  domain_code: string;
  product: string;
  threshold_warn: number | null;
  threshold_breach: number | null;
  unit: string | null;
  last_value: number | null;
};

function newAnalysisId() {
  return `AIA-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function executeSkillSteps(
  analysisDbId: number,
  skillId: number,
  steps: Array<{ action: string; description: string; params?: Record<string, unknown>; requires_human?: boolean }>
) {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO ai_skill_runs (analysis_id, skill_id, step_index, action_code, status, detail_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const taken: Array<Record<string, unknown>> = [];

  steps.forEach((step, idx) => {
    const status = step.requires_human ? "AWAITING_HUMAN" : "EXECUTED_MOCK";
    const detail = {
      description: step.description,
      params: step.params ?? {},
      mock: true,
      note:
        status === "EXECUTED_MOCK"
          ? "Prototype executed action (logged only; wire to real controls in production)."
          : "Requires human approval before real execution.",
    };
    insert.run(analysisDbId, skillId, idx, step.action, status, JSON.stringify(detail));
    taken.push({ step: idx + 1, action: step.action, status, ...detail });
  });

  return taken;
}

function relatedMacroEvents(domain: string, product: string, title: string, message: string) {
  const db = getDb();
  const events = db
    .prepare(`SELECT * FROM external_macro_events ORDER BY event_time DESC`)
    .all() as Array<{
    id: number;
    event_code: string;
    title: string;
    event_time: string;
    impact: string;
    currencies_json: string;
    instruments_json: string;
    description: string;
    source_url: string | null;
  }>;

  const hay = `${domain} ${product} ${title} ${message}`.toLowerCase();
  return events
    .map((e) => {
      const instruments = JSON.parse(e.instruments_json) as string[];
      const currencies = JSON.parse(e.currencies_json) as string[];
      let score = 0;
      for (const i of instruments) if (hay.includes(i.toLowerCase()) || message.toLowerCase().includes(i.toLowerCase())) score += 0.35;
      for (const c of currencies) if (hay.includes(c.toLowerCase())) score += 0.15;
      if (hay.includes("margin") || hay.includes("drawdown") || hay.includes("gold") || hay.includes("equity")) {
        if (e.impact === "HIGH") score += 0.2;
      }
      if (hay.includes("crypto") || hay.includes("wallet")) {
        if (e.event_code.includes("BTC")) score += 0.4;
      }
      return { ...e, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function analyzeAlert(alertId: number, opts: { force?: boolean } = {}) {
  const db = getDb();
  const alert = db.prepare(`SELECT * FROM monitor_alerts WHERE id = ?`).get(alertId) as AlertRow | undefined;
  if (!alert) throw new Error(`Alert ${alertId} not found`);

  const existing = db
    .prepare(`SELECT id, analysis_id FROM ai_analyses WHERE alert_id = ? ORDER BY id DESC LIMIT 1`)
    .get(alertId) as { id: number; analysis_id: string } | undefined;
  if (existing && !opts.force) {
    return getAnalysisBundle(existing.id);
  }

  const indicator = db
    .prepare(`SELECT * FROM monitor_indicators WHERE id = ?`)
    .get(alert.indicator_id) as IndicatorRow;

  const skillMatch = matchSkill(db, indicator.monitor_id, alert.severity, alert.observed_value);
  const analysisId = newAnalysisId();

  if (skillMatch) {
    const steps = JSON.parse(String(skillMatch.skill.steps_json)) as Array<{
      action: string;
      description: string;
      params?: Record<string, unknown>;
      requires_human?: boolean;
    }>;

    const summary = `Known issue matched skill ${skillMatch.skill.code} with certainty. Executing playbook steps (prototype/mock).`;
    const explanations = [
      {
        hypothesis: String(skillMatch.skill.description),
        likelihood: "HIGH",
        confidence: 1,
        rationale: `Indicator ${indicator.monitor_id} + severity ${alert.severity} + observed ${alert.observed_value} satisfy all skill conditions.`,
      },
    ];

    const info = db
      .prepare(
        `INSERT INTO ai_analyses
          (analysis_id, alert_id, indicator_monitor_id, mode, confidence, skill_id, summary, explanations_json, actions_taken_json, status, needs_human, completed_at)
         VALUES (?, ?, ?, 'SKILL_MATCH', 1.0, ?, ?, ?, '[]', 'COMPLETED', 0, datetime('now'))`
      )
      .run(
        analysisId,
        alert.id,
        indicator.monitor_id,
        skillMatch.skill.id,
        summary,
        JSON.stringify(explanations)
      );
    const dbId = Number(info.lastInsertRowid);

    const actions = executeSkillSteps(dbId, Number(skillMatch.skill.id), steps);
    const needsHuman = actions.some((a) => a.status === "AWAITING_HUMAN") ? 1 : 0;
    db.prepare(`UPDATE ai_analyses SET actions_taken_json = ?, needs_human = ? WHERE id = ?`).run(
      JSON.stringify(actions),
      needsHuman,
      dbId
    );

    db.prepare(
      `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
       VALUES (?, 'SKILL', ?, ?, ?, NULL, 1.0)`
    ).run(dbId, String(skillMatch.skill.code), String(skillMatch.skill.name), String(skillMatch.skill.description));

    db.prepare(
      `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
       VALUES (?, 'MONITOR', ?, ?, ?, NULL, 1.0)`
    ).run(
      dbId,
      alert.alert_id,
      `${indicator.name} (${indicator.monitor_id})`,
      `${alert.message} Observed=${alert.observed_value}${indicator.unit ?? ""} thresholds warn/breach=${indicator.threshold_warn}/${indicator.threshold_breach}`
    );

    writeAudit({ name: "AI Engine" }, "AI_ANALYSIS_SKILL", "ai_analysis", analysisId, {
      alert_id: alert.alert_id,
      skill: skillMatch.skill.code,
    });

    logSpineEvent({
      stage: "AI_RCA",
      title: `Skill match ${skillMatch.skill.code} for ${alert.alert_id}`,
      product: indicator.product,
      ref_type: "analysis",
      ref_id: analysisId,
      severity: alert.severity,
      detail: { mode: "SKILL_MATCH", confidence: 1 },
      actor: "ai-engine",
    });
    logSpineEvent({
      stage: "SKILL_EXECUTE",
      title: `Executed ${actions.length} steps for ${skillMatch.skill.code}`,
      product: indicator.product,
      ref_type: "analysis",
      ref_id: analysisId,
      detail: { needs_human: needsHuman },
      actor: "ai-engine",
    });
    syncInterventionsFromSkillRuns();
    challengeAnalysisIfNeeded(dbId);

    return getAnalysisBundle(dbId);
  }

  // Uncertain / no skill → RAG + external macro reasoning
  const query = [
    indicator.name,
    indicator.domain_code,
    indicator.product,
    alert.title,
    alert.message,
    indicator.monitor_id,
  ].join(" ");

  const ragHits = retrieveRag(db, query, 5);
  const macros = relatedMacroEvents(indicator.domain_code, indicator.product, alert.title, alert.message);

  const explanations: Array<Record<string, unknown>> = [];

  if (macros.length) {
    const top = macros[0];
    explanations.push({
      hypothesis: `Macro / external market event contribution: ${top.title}`,
      likelihood: top.impact === "HIGH" ? "HIGH" : "MEDIUM",
      confidence: Math.min(0.85, 0.45 + top.score),
      rationale: `${top.description} Event time ${top.event_time}. Correlated instruments: ${(JSON.parse(top.instruments_json) as string[]).join(", ")}.`,
      external_ref: top.source_url,
    });
  }

  for (const hit of ragHits.slice(0, 3)) {
    explanations.push({
      hypothesis: `Internal policy / business context: ${hit.title}`,
      likelihood: hit.score > 0.5 ? "MEDIUM" : "LOW",
      confidence: Math.min(0.9, 0.35 + hit.score * 0.5),
      rationale: hit.content.slice(0, 420),
      rag_doc_key: hit.doc_key,
      source_ref: hit.source_ref,
    });
  }

  if (!explanations.length) {
    explanations.push({
      hypothesis: "Insufficient matched context — default to human investigation",
      likelihood: "UNKNOWN",
      confidence: 0.2,
      rationale: "No skill matched and RAG/external retrieval returned weak signals.",
    });
  }

  // Overall confidence = max explanation confidence, capped below 1.0 for RAG path
  const confidence = Math.min(0.92, Math.max(...explanations.map((e) => Number(e.confidence) || 0)));
  const summary = `No certain skill match for ${indicator.monitor_id}. Generated ${explanations.length} plausible explanation(s) from RAG + external macro evidence. Human review required (confidence ${confidence.toFixed(2)} < 1.00).`;

  const humanSkill = db
    .prepare(`SELECT id FROM ai_skills WHERE code = 'SKILL-GENERIC-HUMAN-REVIEW'`)
    .get() as { id: number } | undefined;

  const info = db
    .prepare(
      `INSERT INTO ai_analyses
        (analysis_id, alert_id, indicator_monitor_id, mode, confidence, skill_id, summary, explanations_json, actions_taken_json, status, needs_human, completed_at)
       VALUES (?, ?, ?, 'RAG_REASONING', ?, NULL, ?, ?, '[]', 'NEEDS_HUMAN', 1, datetime('now'))`
    )
    .run(analysisId, alert.id, indicator.monitor_id, confidence, summary, JSON.stringify(explanations));
  const dbId = Number(info.lastInsertRowid);

  const actions = humanSkill
    ? executeSkillSteps(dbId, humanSkill.id, [
        {
          action: "lark_notify",
          description: "Posted AI RCA draft to AI Detection Alerts Lark channel",
          params: { channel: "oc_ai_detection_lab" },
        },
        {
          action: "flag_for_human_review",
          description: "Analyst must confirm root cause before intervention",
          requires_human: true,
        },
      ])
    : [
        {
          action: "flag_for_human_review",
          status: "AWAITING_HUMAN",
          description: "Analyst must confirm root cause before intervention",
        },
      ];
  db.prepare(`UPDATE ai_analyses SET actions_taken_json = ? WHERE id = ?`).run(JSON.stringify(actions), dbId);

  const ev = db.prepare(
    `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  ev.run(
    dbId,
    "MONITOR",
    alert.alert_id,
    `${indicator.name} (${indicator.monitor_id})`,
    alert.message,
    null,
    1
  );

  for (const hit of ragHits) {
    ev.run(
      dbId,
      "INTERNAL_RAG",
      hit.doc_key,
      hit.title,
      hit.content.slice(0, 500),
      hit.source_ref,
      hit.score
    );
  }

  for (const m of macros) {
    ev.run(dbId, "EXTERNAL", m.event_code, m.title, m.description, m.source_url, m.score);
  }

  writeAudit({ name: "AI Engine" }, "AI_ANALYSIS_RAG", "ai_analysis", analysisId, {
    alert_id: alert.alert_id,
    confidence,
    rag_hits: ragHits.length,
    macro_hits: macros.length,
  });

  logSpineEvent({
    stage: "AI_RCA",
    title: `RAG reasoning for ${alert.alert_id} (confidence ${confidence.toFixed(2)})`,
    product: indicator.product,
    ref_type: "analysis",
    ref_id: analysisId,
    severity: alert.severity,
    detail: { mode: "RAG_REASONING", rag_hits: ragHits.length, macro_hits: macros.length },
    actor: "ai-engine",
  });
  syncInterventionsFromSkillRuns();
  challengeAnalysisIfNeeded(dbId);

  return getAnalysisBundle(dbId);
}

export function getAnalysisBundle(id: number) {
  const db = getDb();
  ensureChallengerSchema(db);
  // Lazy second-opinion for high-severity analyses created before challenger shipped
  challengeAnalysisIfNeeded(id);
  const analysis = db.prepare(`SELECT * FROM ai_analyses WHERE id = ?`).get(id);
  const evidence = db
    .prepare(`SELECT * FROM ai_analysis_evidence WHERE analysis_id = ? ORDER BY score DESC, id`)
    .all(id);
  const skillRuns = db
    .prepare(`SELECT * FROM ai_skill_runs WHERE analysis_id = ? ORDER BY step_index`)
    .all(id);
  const challenge = getChallengeForAnalysis(id) ?? null;
  return { analysis, evidence, skillRuns, challenge };
}

export function analyzeOpenAlerts(opts: { force?: boolean } = {}) {
  const db = getDb();
  const alerts = db
    .prepare(`SELECT id FROM monitor_alerts WHERE status IN ('OPEN','ACKNOWLEDGED','ESCALATED') ORDER BY id`)
    .all() as Array<{ id: number }>;
  const results = [];
  for (const a of alerts) {
    results.push(analyzeAlert(a.id, opts));
  }
  return results;
}

export function createAlarmAndAnalyze(input: {
  monitor_id: string;
  severity: string;
  title: string;
  message: string;
  observed_value: number;
}) {
  const db = getDb();
  const ind = db
    .prepare(`SELECT * FROM monitor_indicators WHERE monitor_id = ?`)
    .get(input.monitor_id) as IndicatorRow | undefined;
  if (!ind) throw new Error(`Unknown indicator ${input.monitor_id}`);

  const alertIdStr = `ALT-${Date.now().toString().slice(-6)}`;
  const info = db
    .prepare(
      `INSERT INTO monitor_alerts (alert_id, indicator_id, severity, title, message, observed_value, status, monitor20_ticket_id)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)`
    )
    .run(alertIdStr, ind.id, input.severity, input.title, input.message, input.observed_value, `TKT-${Date.now().toString().slice(-5)}`);

  db.prepare(
    `UPDATE monitor_indicators SET status = ?, last_value = ?, last_checked_at = datetime('now'), ticket_open_count = ticket_open_count + 1 WHERE id = ?`
  ).run(input.severity === "INFO" ? "HEALTHY" : input.severity, input.observed_value, ind.id);

  const alertDbId = Number(info.lastInsertRowid);
  writeAudit({ name: "Monitor 2.0" }, "ALARM_RAISED", "monitor_alert", alertIdStr, input);
  return { ...analyzeAlert(alertDbId, { force: true }), monitor_alert_id: alertIdStr };
}
