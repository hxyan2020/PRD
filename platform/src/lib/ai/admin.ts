import { randomBytes } from "crypto";
import { getDb, writeAudit } from "@/lib/db";
import { reindexRagFts } from "@/lib/ai/seed-rag";

export const AI_PARAM_KEYS = [
  "ai.rca_enabled",
  "ai.auto_on_alarm",
  "ai.skill_certainty_only",
  "ai.min_confidence",
  "ai.rag_top_k",
  "ai.second_opinion_severity",
  "ai.primary.vendor",
  "ai.line1.model",
  "ai.line2.model",
  "ai.challenger.mode",
  "ai.token.alert_daily",
  "ai.token.soft_only",
  "ai.maker_checker_required",
  "detectors.auto_raise_alarms",
] as const;

type Actor = { id: number; name: string; role_code: string };

function newId(prefix: string) {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function seedAiAdminIfEmpty(db = getDb()) {
  const upsert = db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO NOTHING`
  );
  upsert.run("ai.min_confidence", "0.55", "Minimum confidence before auto-complete without human gate");
  upsert.run("ai.rag_top_k", "6", "Top-K RAG documents retrieved per RCA");
  upsert.run("ai.second_opinion_severity", "BREACH", "Severities that trigger a second AI challenger (CRITICAL/BREACH)");
  upsert.run(
    "ai.primary.vendor",
    "claude",
    "Prototype LLM vendor switch: claude | gpt | gemini (self-host evaluation later; no live call yet)"
  );
  upsert.run(
    "ai.line1.model",
    "claude-3-7-sonnet",
    "First-line model label — claude-3-7-sonnet | gpt-4o | gemini-2-0-flash (prototype; heuristic RCA still)"
  );
  upsert.run(
    "ai.line2.model",
    "gpt-4o",
    "Second-line / challenger model label (prototype; heuristic challenger still)"
  );
  upsert.run(
    "ai.challenger.mode",
    "heuristic",
    "Challenger mode: heuristic (today) | vendor (independent model) | subagent (primary sub-agent validator)"
  );
  upsert.run(
    "ai.token.alert_daily",
    "500000",
    "Soft daily token threshold — page AI + Infra when exceeded (prototype flag)"
  );
  upsert.run(
    "ai.token.soft_only",
    "true",
    "When true, token/spend alerts never hard-stop RCA or CS analyze"
  );
  upsert.run("ai.maker_checker_required", "true", "Skill/RAG/param changes require maker ≠ checker approval");

  const trainCount = (db.prepare(`SELECT COUNT(*) AS c FROM ai_training_runs`).get() as { c: number }).c;
  if (trainCount === 0) {
    const ins = db.prepare(
      `INSERT INTO ai_training_runs
       (run_id, name, model_name, dataset_label, status, accuracy, precision_score, recall_score, f1_score, samples, notes, started_at, completed_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    ins.run(
      "TRN-2026-09-A",
      "Skill matcher v1.2 recalibration",
      "crmp-skill-matcher-v1",
      "CFD+Crypto alarms Jul–Sep 2026",
      "COMPLETED",
      0.91,
      0.88,
      0.93,
      0.9,
      1840,
      "Improved copy-concentration and hot-wallet skill precision.",
      "2026-09-12 02:10:00",
      "2026-09-12 06:40:00",
      5
    );
    ins.run(
      "TRN-2026-09-B",
      "RAG embed refresh",
      "crmp-rag-retriever-v2",
      "Vantage corpus + macro events",
      "COMPLETED",
      0.84,
      0.81,
      0.86,
      0.83,
      920,
      "Reindexed FTS + keyword hybrid weights.",
      "2026-09-20 01:00:00",
      "2026-09-20 03:15:00",
      5
    );
    ins.run(
      "TRN-2026-10-SHADOW",
      "Shadow challenger model",
      "crmp-challenger-v0",
      "BREACH/CRITICAL analyses only",
      "RUNNING",
      null,
      null,
      null,
      null,
      210,
      "Second-opinion model shadowing production RCA.",
      "2026-10-01 08:00:00",
      null,
      5
    );
  }

  const snapCount = (db.prepare(`SELECT COUNT(*) AS c FROM ai_accuracy_snapshots`).get() as { c: number }).c;
  if (snapCount === 0) {
    const ins = db.prepare(
      `INSERT INTO ai_accuracy_snapshots
       (snapshot_date, skill_match_rate, human_agree_rate, feedback_correct_rate, analyses_total, interventions_approved, interventions_rejected, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    ins.run("2026-09-28", 0.62, 0.78, 0.74, 42, 11, 3, "Pre-US session week");
    ins.run("2026-09-29", 0.65, 0.8, 0.76, 48, 13, 4, null);
    ins.run("2026-09-30", 0.64, 0.77, 0.75, 51, 12, 5, null);
    ins.run("2026-10-01", 0.67, 0.82, 0.79, 56, 14, 4, "Live snapshot seed");
  }

  // Seed a couple of pending change requests for demo if none pending
  const pending = (db.prepare(`SELECT COUNT(*) AS c FROM ai_change_requests WHERE status='PENDING'`).get() as {
    c: number;
  }).c;
  if (pending === 0) {
    const aiEngineer = db.prepare(`SELECT id FROM users WHERE email=?`).get("ai.engineer@vantagemarkets.com") as
      | { id: number }
      | undefined;
    const makerId = aiEngineer?.id ?? 5;
    db.prepare(
      `INSERT INTO ai_change_requests
       (request_id, entity_type, action, title, summary, payload_json, before_json, status, proposed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
    ).run(
      newId("CR"),
      "PARAM",
      "UPDATE",
      "Raise AI min confidence to 0.60",
      "Maker proposes tightening auto-complete threshold to reduce false completes.",
      JSON.stringify({ key: "ai.min_confidence", value: "0.60" }),
      JSON.stringify({ key: "ai.min_confidence", value: "0.55" }),
      makerId
    );
    db.prepare(
      `INSERT INTO ai_change_requests
       (request_id, entity_type, action, title, summary, payload_json, before_json, status, proposed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
    ).run(
      newId("CR"),
      "SKILL",
      "CREATE",
      "New skill: stale quote halt assist",
      "Propose playbook for DET-STALE-FEED / M2-FEED-003 with human gate before symbol halt.",
      JSON.stringify({
        code: "SKILL-STALE-FEED-HALT",
        name: "Stale quote symbol halt assist",
        description: "When stale quote count breaches, notify infra and require human before suggesting symbol halt.",
        indicator_patterns: ["M2-FEED-003"],
        conditions: { severity_in: ["BREACH", "WARN"], min_observed: 3 },
        owner_department: "SYSTEM",
        auto_execute: true,
        steps: [
          { action: "lark_notify", description: "Notify Trading Infra P1", params: { channel: "oc_trading_infra" } },
          {
            action: "suggest_symbol_halt",
            description: "Suggest temporary halt on stale symbols",
            requires_human: true,
          },
        ],
      }),
      null,
      makerId
    );
  }
}

export function listAiParams() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT key, value, description, updated_at, updated_by
       FROM platform_settings
       WHERE key LIKE 'ai.%' OR key = 'detectors.auto_raise_alarms'
       ORDER BY key`
    )
    .all() as Array<{
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
    updated_by: number | null;
  }>;
  return rows;
}

export function getAiAdminOverview() {
  const db = getDb();
  const analyses = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN mode='SKILL_MATCH' THEN 1 ELSE 0 END) AS skill_matches,
         SUM(CASE WHEN mode='RAG_REASONING' THEN 1 ELSE 0 END) AS rag_reasoning,
         SUM(CASE WHEN challenged=1 THEN 1 ELSE 0 END) AS challenged,
         SUM(CASE WHEN needs_human=1 THEN 1 ELSE 0 END) AS needs_human,
         AVG(confidence) AS avg_confidence
       FROM ai_analyses`
    )
    .get() as {
    total: number;
    skill_matches: number;
    rag_reasoning: number;
    challenged: number;
    needs_human: number;
    avg_confidence: number | null;
  };

  const challengeVerdicts = db
    .prepare(
      `SELECT
         SUM(CASE WHEN verdict='AGREE' THEN 1 ELSE 0 END) AS agree,
         SUM(CASE WHEN verdict='PARTIAL' THEN 1 ELSE 0 END) AS partial,
         SUM(CASE WHEN verdict='DISAGREE' THEN 1 ELSE 0 END) AS disagree,
         COUNT(*) AS total
       FROM ai_analysis_challenges`
    )
    .get() as { agree: number; partial: number; disagree: number; total: number };

  const settingRow = (key: string, fallback: string) => {
    const row = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? fallback;
  };
  const lineSettings = {
    primary_vendor: settingRow("ai.primary.vendor", "claude"),
    line1_model: settingRow("ai.line1.model", "claude-3-7-sonnet"),
    line2_model: settingRow("ai.line2.model", "gpt-4o"),
    challenger_mode: settingRow("ai.challenger.mode", "heuristic"),
    token_alert_daily: settingRow("ai.token.alert_daily", "500000"),
    token_soft_only: settingRow("ai.token.soft_only", "true"),
    second_opinion_severity: settingRow("ai.second_opinion_severity", "BREACH"),
  };

  const interventions = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) AS approved,
         SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending
       FROM interventions`
    )
    .get() as { approved: number; rejected: number; pending: number };

  const feedback = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN label='CORRECT' THEN 1 ELSE 0 END) AS correct,
         SUM(CASE WHEN label='INCORRECT' THEN 1 ELSE 0 END) AS incorrect,
         SUM(CASE WHEN label='PARTIAL' THEN 1 ELSE 0 END) AS partial
       FROM ai_feedback`
    )
    .get() as { total: number; correct: number; incorrect: number; partial: number };

  const pendingChanges = (
    db.prepare(`SELECT COUNT(*) AS c FROM ai_change_requests WHERE status='PENDING'`).get() as { c: number }
  ).c;

  const decided = (interventions.approved || 0) + (interventions.rejected || 0);
  const humanAgreeRate = decided ? (interventions.approved || 0) / decided : 0;
  const skillMatchRate = analyses.total ? (analyses.skill_matches || 0) / analyses.total : 0;
  const feedbackCorrectRate = feedback.total ? (feedback.correct || 0) / feedback.total : 0;

  // Keep today's snapshot fresh from live metrics
  db.prepare(
    `INSERT INTO ai_accuracy_snapshots
     (snapshot_date, skill_match_rate, human_agree_rate, feedback_correct_rate, analyses_total, interventions_approved, interventions_rejected, notes)
     VALUES (date('now'), ?, ?, ?, ?, ?, ?, 'Live')
     ON CONFLICT(snapshot_date) DO UPDATE SET
       skill_match_rate=excluded.skill_match_rate,
       human_agree_rate=excluded.human_agree_rate,
       feedback_correct_rate=excluded.feedback_correct_rate,
       analyses_total=excluded.analyses_total,
       interventions_approved=excluded.interventions_approved,
       interventions_rejected=excluded.interventions_rejected,
       notes='Live'`
  ).run(
    Math.round(skillMatchRate * 1000) / 1000,
    Math.round(humanAgreeRate * 1000) / 1000,
    Math.round(feedbackCorrectRate * 1000) / 1000,
    analyses.total || 0,
    interventions.approved || 0,
    interventions.rejected || 0
  );

  const history = db
    .prepare(
      `SELECT * FROM ai_accuracy_snapshots ORDER BY snapshot_date DESC LIMIT 14`
    )
    .all();

  const recentAnalyses = db
    .prepare(
      `SELECT a.id, a.analysis_id, a.indicator_monitor_id, a.mode, a.confidence, a.status, a.needs_human, a.created_at, a.summary,
              (SELECT label FROM ai_feedback f WHERE f.analysis_id=a.id ORDER BY f.id DESC LIMIT 1) AS latest_feedback
       FROM ai_analyses a
       ORDER BY a.id DESC LIMIT 40`
    )
    .all();

  const challengedCount = analyses.challenged || challengeVerdicts.total || 0;
  const challengeRate = analyses.total ? challengedCount / analyses.total : 0;

  return {
    kpis: {
      analyses_total: analyses.total || 0,
      skill_match_rate: skillMatchRate,
      skill_match_count: analyses.skill_matches || 0,
      rag_count: analyses.rag_reasoning || 0,
      avg_confidence: analyses.avg_confidence ?? 0,
      needs_human: analyses.needs_human || 0,
      interventions_pending: interventions.pending || 0,
      human_agree_rate: humanAgreeRate,
      feedback_correct_rate: feedbackCorrectRate,
      feedback_total: feedback.total || 0,
      pending_change_requests: pendingChanges,
      challenged_count: challengedCount,
      challenge_rate: challengeRate,
      challenge_agree: challengeVerdicts.agree || 0,
      challenge_partial: challengeVerdicts.partial || 0,
      challenge_disagree: challengeVerdicts.disagree || 0,
    },
    line_settings: lineSettings,
    accuracy_history: history,
    recent_analyses: recentAnalyses,
    feedback_breakdown: feedback,
  };
}

export function listChangeRequests(status?: string) {
  const db = getDb();
  let sql = `
    SELECT c.*,
           pu.name AS proposed_by_name,
           du.name AS decided_by_name
    FROM ai_change_requests c
    JOIN users pu ON pu.id = c.proposed_by
    LEFT JOIN users du ON du.id = c.decided_by
  `;
  const params: string[] = [];
  if (status) {
    sql += ` WHERE c.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY CASE c.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END, c.id DESC`;
  return db.prepare(sql).all(...params);
}

export function proposeChange(input: {
  actor: Actor;
  entity_type: string;
  action: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  before?: Record<string, unknown> | null;
}) {
  const db = getDb();
  const requestId = newId("CR");
  const info = db
    .prepare(
      `INSERT INTO ai_change_requests
       (request_id, entity_type, action, title, summary, payload_json, before_json, status, proposed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
    )
    .run(
      requestId,
      input.entity_type,
      input.action,
      input.title,
      input.summary,
      JSON.stringify(input.payload),
      input.before ? JSON.stringify(input.before) : null,
      input.actor.id
    );

  writeAudit(input.actor, "AI_CHANGE_PROPOSED", "ai_change_request", requestId, {
    entity_type: input.entity_type,
    action: input.action,
    title: input.title,
  });

  return { id: Number(info.lastInsertRowid), request_id: requestId };
}

function applyChange(entityType: string, action: string, payload: Record<string, unknown>) {
  const db = getDb();
  if (entityType === "PARAM" && action === "UPDATE") {
    const key = String(payload.key || "");
    const value = String(payload.value ?? "");
    if (!key.startsWith("ai.") && key !== "detectors.auto_raise_alarms") {
      throw new Error("Only AI-related settings can be changed here");
    }
    db.prepare(
      `UPDATE platform_settings SET value = ?, updated_at = datetime('now') WHERE key = ?`
    ).run(value, key);
    return { applied: "param", key, value };
  }

  if (entityType === "SKILL" && action === "CREATE") {
    const code = String(payload.code || "");
    if (!code) throw new Error("Skill code required");
    db.prepare(
      `INSERT INTO ai_skills
       (code, name, description, indicator_patterns_json, conditions_json, certainty_required, steps_json, auto_execute, owner_department, status)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 'ACTIVE')`
    ).run(
      code,
      String(payload.name || code),
      String(payload.description || ""),
      JSON.stringify(payload.indicator_patterns || []),
      JSON.stringify(payload.conditions || {}),
      JSON.stringify(payload.steps || []),
      payload.auto_execute === false ? 0 : 1,
      String(payload.owner_department || "AI")
    );
    return { applied: "skill_create", code };
  }

  if (entityType === "SKILL" && action === "UPDATE") {
    const id = Number(payload.id);
    if (!id) throw new Error("Skill id required");
    const fields: string[] = [];
    const values: unknown[] = [];
    if (payload.name != null) {
      fields.push("name = ?");
      values.push(String(payload.name));
    }
    if (payload.description != null) {
      fields.push("description = ?");
      values.push(String(payload.description));
    }
    if (payload.indicator_patterns != null) {
      fields.push("indicator_patterns_json = ?");
      values.push(JSON.stringify(payload.indicator_patterns));
    }
    if (payload.conditions != null) {
      fields.push("conditions_json = ?");
      values.push(JSON.stringify(payload.conditions));
    }
    if (payload.steps != null) {
      fields.push("steps_json = ?");
      values.push(JSON.stringify(payload.steps));
    }
    if (payload.auto_execute != null) {
      fields.push("auto_execute = ?");
      values.push(payload.auto_execute ? 1 : 0);
    }
    if (payload.status != null) {
      fields.push("status = ?");
      values.push(String(payload.status));
    }
    if (!fields.length) throw new Error("No skill fields to update");
    values.push(id);
    db.prepare(`UPDATE ai_skills SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return { applied: "skill_update", id };
  }

  if (entityType === "SKILL" && action === "DISABLE") {
    const id = Number(payload.id);
    db.prepare(`UPDATE ai_skills SET status='DISABLED' WHERE id = ?`).run(id);
    return { applied: "skill_disable", id };
  }

  if (entityType === "RAG" && action === "CREATE") {
    const docKey = String(payload.doc_key || "");
    if (!docKey) throw new Error("doc_key required");
    const info = db
      .prepare(
        `INSERT INTO rag_documents (doc_key, title, category, product_scope, content, source_ref, tags_json, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`
      )
      .run(
        docKey,
        String(payload.title || docKey),
        String(payload.category || "RISK_POLICY"),
        String(payload.product_scope || "CFD+CRYPTO"),
        String(payload.content || ""),
        payload.source_ref ? String(payload.source_ref) : null,
        JSON.stringify(payload.tags || [])
      );
    reindexRagFts(db);
    return { applied: "rag_create", id: Number(info.lastInsertRowid) };
  }

  if (entityType === "RAG" && action === "UPDATE") {
    const id = Number(payload.id);
    if (payload.content != null) {
      db.prepare(
        `UPDATE rag_documents SET content = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?`
      ).run(String(payload.content), id);
    }
    if (payload.status != null) {
      db.prepare(`UPDATE rag_documents SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
        String(payload.status),
        id
      );
    }
    reindexRagFts(db);
    return { applied: "rag_update", id };
  }

  if (entityType === "RAG" && action === "RETIRE") {
    const id = Number(payload.id);
    db.prepare(`UPDATE rag_documents SET status='RETIRED', updated_at = datetime('now') WHERE id = ?`).run(id);
    reindexRagFts(db);
    return { applied: "rag_retire", id };
  }

  if (entityType === "TRAINING" && action === "CREATE") {
    const runId = newId("TRN");
    db.prepare(
      `INSERT INTO ai_training_runs
       (run_id, name, model_name, dataset_label, status, samples, notes, started_at, created_by)
       VALUES (?, ?, ?, ?, 'QUEUED', ?, ?, datetime('now'), ?)`
    ).run(
      runId,
      String(payload.name || "Ad-hoc training"),
      String(payload.model_name || "crmp-skill-matcher-v1"),
      String(payload.dataset_label || "live-window"),
      Number(payload.samples || 0),
      payload.notes ? String(payload.notes) : null,
      Number(payload.created_by || 0) || null
    );
    return { applied: "training_create", run_id: runId };
  }

  throw new Error(`Unsupported change ${entityType}/${action}`);
}

export function decideChangeRequest(input: {
  id: number;
  decision: "APPROVED" | "REJECTED";
  note?: string;
  actor: Actor;
}) {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM ai_change_requests WHERE id = ?`)
    .get(input.id) as
    | {
        id: number;
        request_id: string;
        entity_type: string;
        action: string;
        status: string;
        proposed_by: number;
        payload_json: string;
      }
    | undefined;

  if (!row) throw new Error("Change request not found");
  if (row.status !== "PENDING") throw new Error(`Already ${row.status}`);

  const makerChecker =
    (
      db.prepare(`SELECT value FROM platform_settings WHERE key='ai.maker_checker_required'`).get() as
        | { value: string }
        | undefined
    )?.value !== "false";

  if (makerChecker && row.proposed_by === input.actor.id) {
    throw new Error("Maker/checker: proposer cannot approve their own change");
  }

  let applied: Record<string, unknown> | null = null;
  if (input.decision === "APPROVED") {
    const payload = JSON.parse(row.payload_json || "{}") as Record<string, unknown>;
    applied = applyChange(row.entity_type, row.action, payload);
  }

  db.prepare(
    `UPDATE ai_change_requests
     SET status = ?, decided_by = ?, decided_at = datetime('now'), decision_note = ?
     WHERE id = ?`
  ).run(input.decision, input.actor.id, input.note ?? null, input.id);

  writeAudit(input.actor, `AI_CHANGE_${input.decision}`, "ai_change_request", row.request_id, {
    applied,
    note: input.note,
  });

  return { ok: true, status: input.decision, applied };
}

export function listTrainingRuns() {
  return getDb()
    .prepare(
      `SELECT t.*, u.name AS created_by_name
       FROM ai_training_runs t
       LEFT JOIN users u ON u.id = t.created_by
       ORDER BY t.id DESC`
    )
    .all();
}

export function listSkillsForAdmin() {
  return getDb().prepare(`SELECT * FROM ai_skills ORDER BY status, code`).all();
}

export function listRagForAdmin() {
  return getDb()
    .prepare(
      `SELECT id, doc_key, title, category, product_scope, status, version, updated_at,
              substr(content, 1, 180) AS excerpt
       FROM rag_documents
       ORDER BY updated_at DESC`
    )
    .all();
}

export function submitFeedback(input: {
  analysisId: number;
  label: "CORRECT" | "INCORRECT" | "PARTIAL";
  note?: string;
  actor: Actor;
}) {
  const db = getDb();
  const exists = db.prepare(`SELECT id FROM ai_analyses WHERE id = ?`).get(input.analysisId);
  if (!exists) throw new Error("Analysis not found");
  const info = db
    .prepare(
      `INSERT INTO ai_feedback (analysis_id, label, note, rated_by) VALUES (?, ?, ?, ?)`
    )
    .run(input.analysisId, input.label, input.note ?? null, input.actor.id);
  writeAudit(input.actor, "AI_FEEDBACK", "ai_analysis", String(input.analysisId), {
    label: input.label,
    note: input.note,
  });
  return { id: Number(info.lastInsertRowid) };
}

export function queueTrainingRun(input: {
  actor: Actor;
  name: string;
  model_name: string;
  dataset_label: string;
  notes?: string;
}) {
  // Training create goes through maker/checker when required
  return proposeChange({
    actor: input.actor,
    entity_type: "TRAINING",
    action: "CREATE",
    title: `Queue training: ${input.name}`,
    summary: `Model ${input.model_name} on dataset ${input.dataset_label}`,
    payload: {
      name: input.name,
      model_name: input.model_name,
      dataset_label: input.dataset_label,
      notes: input.notes,
      created_by: input.actor.id,
      samples: 0,
    },
  });
}
