import type Database from "better-sqlite3";

/** Insert browseable AI RCA packs so messenger “Open in admin” has a real destination. */
export function seedAiAnalysesIfEmpty(db: Database.Database) {
  const count = (db.prepare(`SELECT COUNT(*) AS c FROM ai_analyses`).get() as { c: number }).c;
  if (count > 0) return;

  const alerts = db
    .prepare(
      `SELECT a.id, a.alert_id, a.severity, a.title, a.message, a.observed_value, a.status,
              i.monitor_id, i.name AS indicator_name, i.unit, i.threshold_warn, i.threshold_breach
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ORDER BY a.id
       LIMIT 5`
    )
    .all() as Array<{
    id: number;
    alert_id: string;
    severity: string;
    title: string;
    message: string;
    observed_value: number | null;
    status: string;
    monitor_id: string;
    indicator_name: string;
    unit: string | null;
    threshold_warn: number | null;
    threshold_breach: number | null;
  }>;
  if (!alerts.length) return;

  const insertAnalysis = db.prepare(
    `INSERT INTO ai_analyses
      (analysis_id, alert_id, indicator_monitor_id, mode, confidence, skill_id, summary, explanations_json,
       actions_taken_json, status, needs_human, completed_at, challenged, challenge_verdict)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
  );
  const insertEvidence = db.prepare(
    `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertChallenge = db.prepare(
    `INSERT INTO ai_analysis_challenges
      (analysis_id, challenge_id, model_name, verdict, confidence, summary, critique_json, improvements_json,
       alternatives_json, primary_mode, alert_severity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  alerts.forEach((alert, idx) => {
    const analysisCode = `AIA-DEMO-${String(idx + 1).padStart(3, "0")}`;
    const isBreach = alert.severity === "BREACH" || alert.severity === "CRITICAL";
    const mode = "RAG_REASONING";
    const confidence = isBreach ? 0.78 : 0.64;
    const verdict = isBreach ? (idx === 0 ? "AGREE" : "PARTIAL") : null;
    const explanations = [
      {
        hypothesis: `${alert.title} is a Credit & Client / book-risk pattern at ${alert.indicator_name}`,
        likelihood: isBreach ? "HIGH" : "MEDIUM",
        confidence,
        rationale: `${alert.message} Observed ${alert.observed_value ?? "n/a"}${alert.unit ?? ""} vs warn ${alert.threshold_warn} / breach ${alert.threshold_breach}. Session-open concentration is consistent with prior US-open playbooks.`,
      },
      {
        hypothesis: "Control action should stay gated until Risk Desk confirms cohort and symbol set",
        likelihood: "MEDIUM",
        confidence: 0.55,
        rationale: "Prototype recommends page-on-call + evidence pack; irreversible controls (block, halt, leverage cut) remain checker-gated.",
      },
    ];
    const actions = [
      {
        action: "lark_notify",
        status: "EXECUTED_MOCK",
        description: "Posted RCA draft to Risk Control Desk (demo messenger / mock Lark).",
      },
      {
        action: "flag_for_human_review",
        status: "AWAITING_HUMAN",
        description: "Risk Owner must accept or challenge this RCA before live controls.",
      },
    ];
    const info = insertAnalysis.run(
      analysisCode,
      alert.id,
      alert.monitor_id,
      mode,
      confidence,
      `${alert.title}: ${alert.message} Primary RCA generated from Monitor 2.0 + RAG playbook. Human review required.`,
      JSON.stringify(explanations),
      JSON.stringify(actions),
      "NEEDS_HUMAN",
      1,
      verdict ? 1 : 0,
      verdict
    );
    const analysisDbId = Number(info.lastInsertRowid);

    insertEvidence.run(
      analysisDbId,
      "MONITOR",
      alert.alert_id,
      `${alert.indicator_name} (${alert.monitor_id})`,
      `${alert.message} Observed=${alert.observed_value ?? "n/a"}${alert.unit ?? ""}`,
      null,
      1.0
    );
    insertEvidence.run(
      analysisDbId,
      "RAG",
      "PLAYBOOK-US-OPEN",
      "US-open utilisation playbook",
      "Prior breaches in the first 30 minutes of US cash open were driven by clustered retail margin and copy-equity concentration.",
      null,
      0.82
    );
    insertEvidence.run(
      analysisDbId,
      "BOOK",
      alert.monitor_id,
      "Book / cohort snapshot",
      "Demo slice of affected accounts and notionals attached for Risk Desk review (prototype).",
      null,
      0.74
    );

    if (verdict) {
      insertChallenge.run(
        analysisDbId,
        `CHL-DEMO-${String(idx + 1).padStart(3, "0")}`,
        "crmp-challenger-demo",
        verdict,
        verdict === "AGREE" ? 0.81 : 0.66,
        verdict === "AGREE"
          ? "Second AI agrees with Credit & Client Risk as the primary domain; keep irreversible controls checker-gated."
          : "Second AI agrees on the breach but wants a tighter symbol/cohort slice before any halt.",
        JSON.stringify([
          {
            point: "Primary RCA cites session-open clustering; confirm it is not a stale-quote print.",
            severity: "WARN",
          },
        ]),
        JSON.stringify([
          {
            area: "EVIDENCE",
            recommendation: "Attach top-10 account notionals and copy-graph hops before leverage cuts.",
            priority: "HIGH",
          },
        ]),
        JSON.stringify([
          {
            hypothesis: "LP reject / hedge-coverage contribution",
            rationale: "If oneZero reject rate is also elevated, split the ticket to LP_HEDGE.",
            confidence: 0.34,
          },
        ]),
        mode,
        alert.severity
      );
    }
  });
}
