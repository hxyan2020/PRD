import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { logSpineEvent } from "@/lib/ai/spine";

export type ChallengeImprovement = {
  area: "HYPOTHESIS" | "EVIDENCE" | "ACTION" | "CONFIDENCE" | "ESCALATION" | "DATA_GAP";
  recommendation: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type ChallengeCritique = {
  point: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  related_hypothesis?: string;
};

export type ChallengeResult = {
  challenge_id: string;
  model_name: string;
  verdict: "AGREE" | "PARTIAL" | "DISAGREE";
  confidence: number;
  summary: string;
  critiques: ChallengeCritique[];
  improvements: ChallengeImprovement[];
  alternative_hypotheses: Array<{ hypothesis: string; rationale: string; confidence: number }>;
};

const SEV_RANK: Record<string, number> = {
  INFO: 0,
  WARN: 1,
  BREACH: 2,
  CRITICAL: 3,
};

export function ensureChallengerSchema(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL UNIQUE,
      challenge_id TEXT NOT NULL UNIQUE,
      model_name TEXT NOT NULL,
      verdict TEXT NOT NULL,
      confidence REAL NOT NULL,
      summary TEXT NOT NULL,
      critique_json TEXT NOT NULL DEFAULT '[]',
      improvements_json TEXT NOT NULL DEFAULT '[]',
      alternatives_json TEXT NOT NULL DEFAULT '[]',
      primary_mode TEXT,
      alert_severity TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
    );
  `);
  const cols = db.prepare(`PRAGMA table_info(ai_analyses)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "challenged")) {
    db.exec(`ALTER TABLE ai_analyses ADD COLUMN challenged INTEGER NOT NULL DEFAULT 0`);
  }
  if (!cols.some((c) => c.name === "challenge_verdict")) {
    db.exec(`ALTER TABLE ai_analyses ADD COLUMN challenge_verdict TEXT`);
  }
}

function minSeverityThreshold(db: Database.Database): string {
  const row = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'ai.second_opinion_severity'`)
    .get() as { value: string } | undefined;
  const v = (row?.value || "BREACH").toUpperCase();
  if (v.includes("CRITICAL") && !v.includes("BREACH")) return "CRITICAL";
  if (v.includes("WARN")) return "WARN";
  return "BREACH";
}

export function shouldRunSecondOpinion(severity: string, db: Database.Database = getDb()): boolean {
  const min = minSeverityThreshold(db);
  return (SEV_RANK[severity] ?? 0) >= (SEV_RANK[min] ?? 2);
}

/**
 * Independent challenger model — deliberately uses a different decision path than the primary RCA:
 * - does not trust skill auto-certainty at face value
 * - looks for missing macro/feed/LP co-signals
 * - proposes alternative hypotheses and concrete improvements
 */
export function runChallengerReview(input: {
  analysisDbId: number;
  analysisId: string;
  primaryMode: string;
  primarySummary: string;
  primaryConfidence: number;
  explanations: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  evidenceTypes: string[];
  alertSeverity: string;
  monitorId: string;
  product: string;
  domain: string;
  observed: number | null;
}): ChallengeResult {
  const critiques: ChallengeCritique[] = [];
  const improvements: ChallengeImprovement[] = [];
  const alternatives: ChallengeResult["alternative_hypotheses"] = [];

  const hypText = input.explanations.map((e) => String(e.hypothesis || "")).join(" | ").toLowerCase();
  const hasMacro = input.evidenceTypes.includes("EXTERNAL") || /macro|fomc|cpi|nfp|opec/.test(hypText);
  const hasFeed = /stale|feed|quote/.test(hypText) || input.monitorId.includes("FEED");
  const hasLp = /lp|reject|hedge|bridge/.test(hypText) || input.monitorId.includes("LP") || input.monitorId.includes("HEDGE");
  const hasHumanGate = input.actions.some(
    (a) => a.status === "AWAITING_HUMAN" || a.requires_human === true || String(a.action).includes("human")
  );

  // Challenge 1: skill overconfidence
  if (input.primaryMode === "SKILL_MATCH" && input.primaryConfidence >= 0.99) {
    critiques.push({
      point: "Primary path claims certainty (skill match @ 1.0). Challenger requires co-signal check before treating playbook as complete root cause.",
      severity: "WARN",
      related_hypothesis: String(input.explanations[0]?.hypothesis || "skill match"),
    });
    improvements.push({
      area: "CONFIDENCE",
      recommendation: "Cap reported confidence at ≤0.90 until feed/LP/macro co-signals are explicitly confirmed or ruled out.",
      priority: "HIGH",
    });
  }

  // Challenge 2: missing macro for market-moving severity
  if ((input.alertSeverity === "BREACH" || input.alertSeverity === "CRITICAL") && !hasMacro) {
    critiques.push({
      point: "High-severity book event without macro/external evidence — primary may be overfitting to internal indicator alone.",
      severity: "WARN",
    });
    improvements.push({
      area: "EVIDENCE",
      recommendation: "Pull Market Intelligence + macro calendar into evidence vault before closing RCA.",
      priority: "HIGH",
    });
    alternatives.push({
      hypothesis: "External macro / geo headline contribution (not yet evidenced)",
      rationale: "Independent challenger notes absent EXTERNAL evidence on a high-severity alert — historically co-moves with LP stress.",
      confidence: 0.55,
    });
  }

  // Challenge 3: credit spike without pricing integrity check
  if (/MRG|STOP|COPY|EQ/.test(input.monitorId) && !hasFeed) {
    critiques.push({
      point: "Credit/equity stress analysed without stale-feed differential diagnosis — false liquidations possible.",
      severity: input.alertSeverity === "CRITICAL" ? "CRITICAL" : "WARN",
    });
    improvements.push({
      area: "HYPOTHESIS",
      recommendation: "Add explicit 'rule-out stale quotes (M2-FEED-003)' step before leverage/liquidation interventions.",
      priority: "HIGH",
    });
    alternatives.push({
      hypothesis: "Pricing integrity / stale quote artefact inflating margin utilisation",
      rationale: "Challenger model prioritises feed integrity before client-credit contagion narrative.",
      confidence: 0.48,
    });
  }

  // Challenge 4: hedge/LP blind spot
  if (/EQ|MRG|XAU|VAR/.test(input.monitorId) && !hasLp) {
    critiques.push({
      point: "Inventory / PnL stress without LP reject or hedge-coverage check in primary narrative.",
      severity: "INFO",
    });
    improvements.push({
      area: "EVIDENCE",
      recommendation: "Cross-read M2-LP-022 and M2-HEDGE-007 in the same RCA pack.",
      priority: "MEDIUM",
    });
  }

  // Challenge 5: actions without human gate on CRITICAL
  if (input.alertSeverity === "CRITICAL" && !hasHumanGate) {
    critiques.push({
      point: "CRITICAL severity path lacks an explicit human gate in proposed actions.",
      severity: "CRITICAL",
    });
    improvements.push({
      area: "ACTION",
      recommendation: "Force flag_for_human_review before any LP disable, symbol halt, or leverage cut.",
      priority: "HIGH",
    });
  }

  // Challenge 6: RAG thinness
  if (input.primaryMode === "RAG_REASONING" && input.explanations.length < 2) {
    critiques.push({
      point: "RAG path produced a thin explanation set — high risk of incomplete RCA.",
      severity: "WARN",
    });
    improvements.push({
      area: "DATA_GAP",
      recommendation: "Expand RAG retrieve top-K and attach at least one internal policy + one external event, or escalate as UNKNOWN.",
      priority: "MEDIUM",
    });
  }

  // Challenge 7: market intel indicator
  if (input.monitorId === "M2-MKT-INTEL") {
    improvements.push({
      area: "ESCALATION",
      recommendation: "Map intel products to open inventory and pre-widen before generic equity playbooks.",
      priority: "HIGH",
    });
  }

  if (!critiques.length) {
    critiques.push({
      point: "No material contradiction found; primary narrative is directionally consistent with available evidence.",
      severity: "INFO",
    });
  }

  if (!improvements.length) {
    improvements.push({
      area: "EVIDENCE",
      recommendation: "Keep dual-model audit trail attached; re-run challenger if new evidence arrives within 15m.",
      priority: "LOW",
    });
  }

  // Always add one constructive alternative for high severity
  if (input.alertSeverity === "BREACH" || input.alertSeverity === "CRITICAL") {
    if (!alternatives.length) {
      alternatives.push({
        hypothesis: "Multi-factor stress (credit + liquidity + external) rather than single-cause skill narrative",
        rationale: "Challenger defaults to multi-factor framing on BREACH/CRITICAL to avoid premature closure.",
        confidence: 0.42,
      });
    }
    improvements.push({
      area: "ACTION",
      recommendation: "Present primary + challenger pack side-by-side to Risk Owner before irreversible controls.",
      priority: "HIGH",
    });
  }

  const disagreeScore =
    critiques.filter((c) => c.severity === "CRITICAL").length * 2 +
    critiques.filter((c) => c.severity === "WARN").length;
  let verdict: ChallengeResult["verdict"] = "AGREE";
  if (disagreeScore >= 3) verdict = "DISAGREE";
  else if (disagreeScore >= 1 || alternatives.length > 0) verdict = "PARTIAL";

  const confidence =
    verdict === "AGREE" ? 0.78 : verdict === "PARTIAL" ? 0.66 : 0.58;

  const modelRow = getDb()
    .prepare(`SELECT value FROM platform_settings WHERE key = 'ai.line2.model'`)
    .get() as { value: string } | undefined;
  const modelName = modelRow?.value || "crmp-challenger-v0";

  const summary =
    verdict === "AGREE"
      ? `Challenger (${modelName}) broadly agrees with primary ${input.primaryMode} RCA; minor hardening suggested.`
      : verdict === "PARTIAL"
        ? `Challenger partially challenges primary RCA — ${improvements.filter((i) => i.priority === "HIGH").length} high-priority improvement(s) recommended before acting.`
        : `Challenger disagrees with treating primary RCA as sufficient for ${input.alertSeverity}; alternative hypotheses and gates required.`;

  return {
    challenge_id: `CHL-${randomBytes(3).toString("hex").toUpperCase()}`,
    model_name: modelName,
    verdict,
    confidence,
    summary,
    critiques,
    improvements,
    alternative_hypotheses: alternatives,
  };
}

export function persistChallenge(
  analysisDbId: number,
  result: ChallengeResult,
  meta: { primaryMode: string; alertSeverity: string; product?: string; analysisId?: string }
) {
  const db = getDb();
  ensureChallengerSchema(db);

  db.prepare(
    `INSERT INTO ai_analysis_challenges
      (analysis_id, challenge_id, model_name, verdict, confidence, summary, critique_json, improvements_json, alternatives_json, primary_mode, alert_severity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(analysis_id) DO UPDATE SET
       challenge_id = excluded.challenge_id,
       model_name = excluded.model_name,
       verdict = excluded.verdict,
       confidence = excluded.confidence,
       summary = excluded.summary,
       critique_json = excluded.critique_json,
       improvements_json = excluded.improvements_json,
       alternatives_json = excluded.alternatives_json,
       primary_mode = excluded.primary_mode,
       alert_severity = excluded.alert_severity,
       created_at = datetime('now')`
  ).run(
    analysisDbId,
    result.challenge_id,
    result.model_name,
    result.verdict,
    result.confidence,
    result.summary,
    JSON.stringify(result.critiques),
    JSON.stringify(result.improvements),
    JSON.stringify(result.alternative_hypotheses),
    meta.primaryMode,
    meta.alertSeverity
  );

  db.prepare(`UPDATE ai_analyses SET challenged = 1, challenge_verdict = ? WHERE id = ?`).run(
    result.verdict,
    analysisDbId
  );

  // Attach challenger output as evidence
  db.prepare(
    `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
     VALUES (?, 'CHALLENGER', ?, ?, ?, NULL, ?)`
  ).run(
    analysisDbId,
    result.challenge_id,
    `Second AI challenge — ${result.verdict}`,
    `${result.summary}\n\nImprovements:\n${result.improvements.map((i) => `• [${i.priority}] ${i.area}: ${i.recommendation}`).join("\n")}`,
    result.confidence
  );

  if (result.verdict !== "AGREE") {
    db.prepare(`UPDATE ai_analyses SET needs_human = 1 WHERE id = ?`).run(analysisDbId);
  }

  writeAudit({ name: "AI Challenger" }, "AI_SECOND_OPINION", "ai_analysis", meta.analysisId || String(analysisDbId), {
    challenge_id: result.challenge_id,
    verdict: result.verdict,
    improvements: result.improvements.length,
  });

  logSpineEvent({
    stage: "AI_RCA",
    title: `Second AI challenge ${result.verdict} (${result.challenge_id})`,
    product: meta.product || "CFD+CRYPTO",
    ref_type: "analysis",
    ref_id: meta.analysisId || String(analysisDbId),
    severity: result.verdict === "DISAGREE" ? "BREACH" : "WARN",
    detail: {
      model: result.model_name,
      verdict: result.verdict,
      improvements: result.improvements.length,
      critiques: result.critiques.length,
    },
    actor: "ai-challenger",
  });

  return result;
}

export function challengeAnalysisIfNeeded(
  analysisDbId: number,
  opts: { force?: boolean } = {}
): ChallengeResult | null {
  const db = getDb();
  ensureChallengerSchema(db);

  const existingChallenge = getChallengeForAnalysis(analysisDbId);
  if (existingChallenge && !opts.force) {
    return {
      challenge_id: existingChallenge.challenge_id,
      model_name: existingChallenge.model_name,
      verdict: existingChallenge.verdict as ChallengeResult["verdict"],
      confidence: existingChallenge.confidence,
      summary: existingChallenge.summary,
      critiques: JSON.parse(existingChallenge.critique_json || "[]"),
      improvements: JSON.parse(existingChallenge.improvements_json || "[]"),
      alternative_hypotheses: JSON.parse(existingChallenge.alternatives_json || "[]"),
    };
  }

  const row = db
    .prepare(
      `SELECT a.*, al.severity AS alert_severity, i.product, i.domain_code, i.monitor_id, al.observed_value
       FROM ai_analyses a
       JOIN monitor_alerts al ON al.id = a.alert_id
       JOIN monitor_indicators i ON i.id = al.indicator_id
       WHERE a.id = ?`
    )
    .get(analysisDbId) as
    | {
        id: number;
        analysis_id: string;
        mode: string;
        summary: string;
        confidence: number;
        explanations_json: string;
        actions_taken_json: string;
        alert_severity: string;
        product: string;
        domain_code: string;
        monitor_id: string;
        observed_value: number | null;
        challenged: number;
      }
    | undefined;

  if (!row) return null;
  if (!shouldRunSecondOpinion(row.alert_severity, db)) return null;

  const evidenceTypes = (
    db
      .prepare(`SELECT DISTINCT evidence_type AS t FROM ai_analysis_evidence WHERE analysis_id = ?`)
      .all(analysisDbId) as Array<{ t: string }>
  ).map((r) => r.t);

  const result = runChallengerReview({
    analysisDbId: row.id,
    analysisId: row.analysis_id,
    primaryMode: row.mode,
    primarySummary: row.summary,
    primaryConfidence: row.confidence,
    explanations: JSON.parse(row.explanations_json || "[]"),
    actions: JSON.parse(row.actions_taken_json || "[]"),
    evidenceTypes,
    alertSeverity: row.alert_severity,
    monitorId: row.monitor_id,
    product: row.product,
    domain: row.domain_code,
    observed: row.observed_value,
  });

  return persistChallenge(row.id, result, {
    primaryMode: row.mode,
    alertSeverity: row.alert_severity,
    product: row.product,
    analysisId: row.analysis_id,
  });
}

export function getChallengeForAnalysis(analysisDbId: number) {
  ensureChallengerSchema();
  return getDb()
    .prepare(`SELECT * FROM ai_analysis_challenges WHERE analysis_id = ?`)
    .get(analysisDbId) as
    | {
        id: number;
        challenge_id: string;
        model_name: string;
        verdict: string;
        confidence: number;
        summary: string;
        critique_json: string;
        improvements_json: string;
        alternatives_json: string;
        primary_mode: string | null;
        alert_severity: string | null;
        created_at: string;
      }
    | undefined;
}

/** Backfill challenger for existing high-severity analyses missing a challenge row. */
export function backfillChallenges(limit = 40) {
  ensureChallengerSchema();
  const db = getDb();
  const min = minSeverityThreshold(db);
  const rows = db
    .prepare(
      `SELECT a.id
       FROM ai_analyses a
       JOIN monitor_alerts al ON al.id = a.alert_id
       LEFT JOIN ai_analysis_challenges c ON c.analysis_id = a.id
       WHERE c.id IS NULL
         AND (
           (? = 'WARN' AND al.severity IN ('WARN','BREACH','CRITICAL'))
           OR (? = 'BREACH' AND al.severity IN ('BREACH','CRITICAL'))
           OR (? = 'CRITICAL' AND al.severity = 'CRITICAL')
         )
       ORDER BY a.id DESC
       LIMIT ?`
    )
    .all(min, min, min, limit) as Array<{ id: number }>;

  const out = [];
  for (const r of rows) {
    out.push(challengeAnalysisIfNeeded(r.id));
  }
  return out.filter(Boolean);
}
