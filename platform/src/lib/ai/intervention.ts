import { getDb, writeAudit } from "@/lib/db";
import { logSpineEvent } from "@/lib/ai/spine";

export function syncInterventionsFromSkillRuns() {
  const db = getDb();
  const pending = db
    .prepare(
      `SELECT r.id AS skill_run_id, r.analysis_id, r.action_code, a.analysis_id AS analysis_code, a.indicator_monitor_id
       FROM ai_skill_runs r
       JOIN ai_analyses a ON a.id = r.analysis_id
       WHERE r.status = 'AWAITING_HUMAN'
         AND NOT EXISTS (SELECT 1 FROM interventions i WHERE i.skill_run_id = r.id)`
    )
    .all() as Array<{
    skill_run_id: number;
    analysis_id: number;
    action_code: string;
    analysis_code: string;
    indicator_monitor_id: string;
  }>;

  const insert = db.prepare(
    `INSERT INTO interventions (skill_run_id, analysis_id, action_code, status)
     VALUES (?, ?, ?, 'PENDING')`
  );

  for (const p of pending) {
    insert.run(p.skill_run_id, p.analysis_id, p.action_code);
    logSpineEvent({
      stage: "HUMAN_INTERVENTION",
      title: `Intervention required: ${p.action_code}`,
      ref_type: "analysis",
      ref_id: p.analysis_code,
      severity: "WARN",
      detail: { skill_run_id: p.skill_run_id, indicator: p.indicator_monitor_id },
      actor: "ai-engine",
    });
  }
  return pending.length;
}

export function listInterventions(status?: string) {
  const db = getDb();
  syncInterventionsFromSkillRuns();
  let sql = `
    SELECT i.*,
           a.analysis_id AS analysis_code,
           a.indicator_monitor_id,
           a.mode,
           a.summary,
           r.detail_json AS skill_detail,
           r.step_index,
           u.name AS decided_by_name,
           al.title AS alert_title,
           al.severity AS alert_severity,
           m.name AS indicator_name,
           m.product AS product_hint
    FROM interventions i
    JOIN ai_analyses a ON a.id = i.analysis_id
    JOIN ai_skill_runs r ON r.id = i.skill_run_id
    JOIN monitor_alerts al ON al.id = a.alert_id
    JOIN monitor_indicators m ON m.id = al.indicator_id
    LEFT JOIN users u ON u.id = i.decided_by
  `;
  const params: string[] = [];
  if (status) {
    sql += ` WHERE i.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY
    CASE i.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
    i.id DESC`;
  return db.prepare(sql).all(...params);
}

export function decideIntervention(input: {
  interventionId: number;
  decision: "APPROVED" | "REJECTED";
  note?: string;
  actor: { id: number; name: string };
}) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT i.*, r.id AS run_id, a.analysis_id AS analysis_code, ind.product
       FROM interventions i
       JOIN ai_skill_runs r ON r.id = i.skill_run_id
       JOIN ai_analyses a ON a.id = i.analysis_id
       JOIN monitor_alerts al ON al.id = a.alert_id
       JOIN monitor_indicators ind ON ind.id = al.indicator_id
       WHERE i.id = ?`
    )
    .get(input.interventionId) as
    | {
        id: number;
        status: string;
        action_code: string;
        run_id: number;
        analysis_id: number;
        analysis_code: string;
        product: string;
      }
    | undefined;

  if (!row) throw new Error("Intervention not found");
  if (row.status !== "PENDING") throw new Error(`Already ${row.status}`);

  const runStatus = input.decision === "APPROVED" ? "EXECUTED_AFTER_APPROVAL" : "REJECTED_BY_HUMAN";

  db.prepare(
    `UPDATE interventions
     SET status = ?, decided_at = datetime('now'), decided_by = ?, decision_note = ?
     WHERE id = ?`
  ).run(input.decision, input.actor.id, input.note ?? null, input.interventionId);

  const prev = db.prepare(`SELECT detail_json FROM ai_skill_runs WHERE id = ?`).get(row.run_id) as {
    detail_json: string;
  };
  const detail = {
    ...(JSON.parse(prev?.detail_json || "{}") as Record<string, unknown>),
    human_decision: input.decision,
    decision_note: input.note ?? "",
  };
  db.prepare(
    `UPDATE ai_skill_runs
     SET status = ?, decided_by = ?, decided_at = datetime('now'), decision_note = ?, detail_json = ?
     WHERE id = ?`
  ).run(runStatus, input.actor.id, input.note ?? null, JSON.stringify(detail), row.run_id);

  // Refresh analysis actions_taken_json snapshot
  const runs = db
    .prepare(`SELECT action_code, status, detail_json, step_index FROM ai_skill_runs WHERE analysis_id = ? ORDER BY step_index`)
    .all(row.analysis_id) as Array<{ action_code: string; status: string; detail_json: string; step_index: number }>;
  const actions = runs.map((r) => ({
    step: r.step_index + 1,
    action: r.action_code,
    status: r.status,
    ...(JSON.parse(r.detail_json || "{}") as Record<string, unknown>),
  }));
  const stillWaiting = runs.some((r) => r.status === "AWAITING_HUMAN");
  db.prepare(
    `UPDATE ai_analyses
     SET actions_taken_json = ?,
         needs_human = ?,
         status = CASE WHEN ? = 0 THEN 'COMPLETED' ELSE status END
     WHERE id = ?`
  ).run(JSON.stringify(actions), stillWaiting ? 1 : 0, stillWaiting ? 1 : 0, row.analysis_id);

  logSpineEvent({
    stage: input.decision === "APPROVED" ? "HUMAN_INTERVENTION" : "HUMAN_INTERVENTION",
    title: `${input.decision}: ${row.action_code}`,
    product: row.product,
    ref_type: "intervention",
    ref_id: String(row.id),
    severity: input.decision === "APPROVED" ? "INFO" : "WARN",
    detail: { analysis: row.analysis_code, note: input.note },
    actor: input.actor.name,
  });

  if (!stillWaiting) {
    logSpineEvent({
      stage: "RESOLVED",
      title: `Analysis ${row.analysis_code} human gates cleared`,
      product: row.product,
      ref_type: "analysis",
      ref_id: row.analysis_code,
      actor: input.actor.name,
    });
  }

  writeAudit(input.actor, `INTERVENTION_${input.decision}`, "intervention", String(row.id), {
    action_code: row.action_code,
    note: input.note,
  });

  return { ok: true, status: input.decision, runStatus };
}
