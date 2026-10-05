import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { logSpineEvent } from "@/lib/ai/spine";
import { INTERVENTION_DEMO_SAMPLES } from "@/lib/ai/intervention-samples";

/** Seed sample human interventions (PENDING + decided) when the queue is empty. */
export function seedInterventionsIfEmpty(db: Database.Database = getDb()) {
  const count = (db.prepare(`SELECT COUNT(*) AS c FROM interventions`).get() as { c: number }).c;
  if (count > 0) return;

  // Prefer materialising real AWAITING_HUMAN skill runs first
  const pendingRuns = db
    .prepare(
      `SELECT r.id AS skill_run_id, r.analysis_id, r.action_code
       FROM ai_skill_runs r
       WHERE r.status = 'AWAITING_HUMAN'
         AND NOT EXISTS (SELECT 1 FROM interventions i WHERE i.skill_run_id = r.id)
       LIMIT 8`
    )
    .all() as Array<{ skill_run_id: number; analysis_id: number; action_code: string }>;

  const insertInt = db.prepare(
    `INSERT INTO interventions (skill_run_id, analysis_id, action_code, status, requested_at, decided_at, decided_by, decision_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  if (pendingRuns.length > 0) {
    const owner = db.prepare(`SELECT id FROM users WHERE email=?`).get("risk.owner@vantagemarkets.com") as
      | { id: number }
      | undefined;
    const ownerId = owner?.id ?? 1;
    pendingRuns.forEach((r, idx) => {
      if (idx === 0) {
        insertInt.run(
          r.skill_run_id,
          r.analysis_id,
          r.action_code,
          "APPROVED",
          "2026-10-02 09:15:00",
          "2026-10-02 09:40:00",
          ownerId,
          "Seed sample: approved after desk review."
        );
        db.prepare(
          `UPDATE ai_skill_runs SET status='EXECUTED_AFTER_APPROVAL', decided_by=?, decided_at=?, decision_note=? WHERE id=?`
        ).run(ownerId, "2026-10-02 09:40:00", "Seed sample: approved after desk review.", r.skill_run_id);
      } else if (idx === 1) {
        insertInt.run(
          r.skill_run_id,
          r.analysis_id,
          r.action_code,
          "REJECTED",
          "2026-10-02 10:00:00",
          "2026-10-02 10:22:00",
          ownerId,
          "Seed sample: rejected — cohort slice incomplete."
        );
        db.prepare(
          `UPDATE ai_skill_runs SET status='REJECTED_BY_HUMAN', decided_by=?, decided_at=?, decision_note=? WHERE id=?`
        ).run(ownerId, "2026-10-02 10:22:00", "Seed sample: rejected — cohort slice incomplete.", r.skill_run_id);
      } else {
        insertInt.run(r.skill_run_id, r.analysis_id, r.action_code, "PENDING", "2026-10-03 08:00:00", null, null, null);
      }
    });
    return;
  }

  const analyses = db
    .prepare(
      `SELECT a.id, a.analysis_id, a.indicator_monitor_id, a.summary
       FROM ai_analyses a
       ORDER BY a.id DESC
       LIMIT 4`
    )
    .all() as Array<{ id: number; analysis_id: string; indicator_monitor_id: string; summary: string }>;
  if (!analyses.length) return;

  const skill = db.prepare(`SELECT id FROM ai_skills WHERE status='ACTIVE' ORDER BY id LIMIT 1`).get() as
    | { id: number }
    | undefined;
  if (!skill) return;

  const owner = db.prepare(`SELECT id FROM users WHERE email=?`).get("risk.owner@vantagemarkets.com") as
    | { id: number }
    | undefined;
  const analyst = db.prepare(`SELECT id FROM users WHERE email=?`).get("risk.analyst@vantagemarkets.com") as
    | { id: number }
    | undefined;
  const ownerId = owner?.id ?? 1;
  const analystId = analyst?.id ?? ownerId;

  const insertRun = db.prepare(
    `INSERT INTO ai_skill_runs (analysis_id, skill_id, step_index, action_code, status, detail_json, decided_by, decided_at, decision_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const samples: Array<{
    action: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    decidedBy: number | null;
    note: string | null;
    requestedAt: string;
    decidedAt: string | null;
    runStatus: string;
  }> = [
    {
      action: "flag_for_human_review",
      status: "PENDING",
      decidedBy: null,
      note: null,
      requestedAt: "2026-10-03 08:12:00",
      decidedAt: null,
      runStatus: "AWAITING_HUMAN",
    },
    {
      action: "suggest_leverage_cut",
      status: "PENDING",
      decidedBy: null,
      note: null,
      requestedAt: "2026-10-03 08:45:00",
      decidedAt: null,
      runStatus: "AWAITING_HUMAN",
    },
    {
      action: "pause_new_copies",
      status: "APPROVED",
      decidedBy: ownerId,
      note: "Seed sample: Risk Owner approved pause after copy cascade confirmation.",
      requestedAt: "2026-10-02 11:00:00",
      decidedAt: "2026-10-02 11:28:00",
      runStatus: "EXECUTED_AFTER_APPROVAL",
    },
    {
      action: "suggest_symbol_halt",
      status: "REJECTED",
      decidedBy: analystId,
      note: "Seed sample: rejected — feed stale print, not book risk.",
      requestedAt: "2026-10-01 16:20:00",
      decidedAt: "2026-10-01 16:55:00",
      runStatus: "REJECTED_BY_HUMAN",
    },
  ];

  analyses.forEach((a, idx) => {
    const sample = samples[idx] ?? samples[0];
    const detail = JSON.stringify({
      description: `Human gate for ${sample.action} on ${a.indicator_monitor_id}`,
      params: { analysis: a.analysis_id },
      mock: true,
      note: sample.status === "PENDING" ? "Requires human approval before real execution." : sample.note,
    });
    const runInfo = insertRun.run(
      a.id,
      skill.id,
      0,
      sample.action,
      sample.runStatus,
      detail,
      sample.decidedBy,
      sample.decidedAt,
      sample.note
    );
    insertInt.run(
      Number(runInfo.lastInsertRowid),
      a.id,
      sample.action,
      sample.status,
      sample.requestedAt,
      sample.decidedAt,
      sample.decidedBy,
      sample.note
    );
  });
}

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
  seedInterventionsIfEmpty(db);
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
           u.email AS decided_by_email,
           COALESCE(al.title, a.summary, i.action_code) AS alert_title,
           COALESCE(al.severity, 'WARN') AS alert_severity,
           COALESCE(al.alert_id, a.analysis_id) AS alert_id,
           COALESCE(t.ticket_id, al.monitor20_ticket_id, '—') AS ticket_id,
           m.name AS indicator_name,
           COALESCE(m.product, 'CFD') AS product_hint
    FROM interventions i
    JOIN ai_analyses a ON a.id = i.analysis_id
    JOIN ai_skill_runs r ON r.id = i.skill_run_id
    LEFT JOIN monitor_alerts al ON al.id = a.alert_id
    LEFT JOIN monitor_tickets t ON t.alert_id = al.id
    LEFT JOIN monitor_indicators m ON m.id = al.indicator_id
    LEFT JOIN users u ON u.id = i.decided_by
  `;
  const params: string[] = [];
  if (status) {
    sql += ` WHERE i.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY
    CASE i.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
    i.id DESC
    LIMIT 80`;
  const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
  if (rows.length > 0) return rows;

  // Static export / empty DB fallback — curated samples with ticket + actioner email
  if (status) return INTERVENTION_DEMO_SAMPLES.filter((s) => s.status === status);
  return INTERVENTION_DEMO_SAMPLES;
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
