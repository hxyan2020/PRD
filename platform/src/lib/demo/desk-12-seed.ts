/**
 * Upsert the desk-12 open alerts/tickets and align monitor values.
 * Never auto-closes alerts — Closed Risk Log must come from a real close walk.
 */
import type Database from "better-sqlite3";
import { DESK_12_SCENARIOS, desk12AlertIds } from "@/lib/demo/desk-12-pack";

function indicatorId(db: Database.Database, monitorId: string): number | null {
  const row = db.prepare(`SELECT id FROM monitor_indicators WHERE monitor_id = ?`).get(monitorId) as
    | { id: number }
    | undefined;
  return row?.id ?? null;
}

function bumpMonitor(
  db: Database.Database,
  monitorId: string,
  lastValue: number,
  status: "WARN" | "BREACH" | "CRITICAL" | "HEALTHY"
) {
  db.prepare(
    `UPDATE monitor_indicators
     SET last_value = ?, status = ?, last_checked_at = datetime('now'),
         ticket_open_count = CASE WHEN ticket_open_count < 1 THEN 1 ELSE ticket_open_count END
     WHERE monitor_id = ?`
  ).run(lastValue, status === "CRITICAL" ? "BREACH" : status, monitorId);
}

/**
 * Retire legacy demo alerts that are not part of desk-12.
 * Use SUPERSEDED (hidden from open + closed trackers) — avoids FK deletes and fake CLOSED cards.
 */
function retireLegacyAlerts(db: Database.Database) {
  const keep = new Set(desk12AlertIds());
  const retireIds = ["ALT-1001", "ALT-1002", "ALT-1003", "ALT-1004", "ALT-1005", "ALT-STALE-FEED-LIQ", "ALT-XAU-WEEKEND"];
  const legacy = db
    .prepare(`SELECT id, alert_id FROM monitor_alerts`)
    .all() as Array<{ id: number; alert_id: string }>;

  const supersede = db.prepare(`UPDATE monitor_alerts SET status = 'SUPERSEDED' WHERE id = ?`);
  for (const a of legacy) {
    if (keep.has(a.alert_id)) continue;
    if (!retireIds.includes(a.alert_id)) continue;
    supersede.run(a.id);
    db.prepare(
      `UPDATE monitor_tickets SET status = 'SUPERSEDED'
       WHERE alert_id = ? AND status NOT IN ('SUPERSEDED')`
    ).run(a.id);
  }
}

export function ensureDesk12PackSeed(db: Database.Database) {
  const insertAlert = db.prepare(
    `INSERT INTO monitor_alerts (alert_id, indicator_id, severity, title, message, observed_value, status, monitor20_ticket_id)
     VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
     ON CONFLICT(alert_id) DO UPDATE SET
       indicator_id = excluded.indicator_id,
       severity = excluded.severity,
       title = excluded.title,
       message = excluded.message,
       observed_value = excluded.observed_value,
       monitor20_ticket_id = excluded.monitor20_ticket_id,
       status = CASE
         WHEN monitor_alerts.status IN ('CLOSED','RESOLVED') THEN monitor_alerts.status
         ELSE 'OPEN'
       END`
  );

  const insertTicket = db.prepare(
    `INSERT INTO monitor_tickets (ticket_id, alert_id, title, status, severity, assignee_user_id, department_code, lark_message_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(ticket_id) DO UPDATE SET
       title = excluded.title,
       severity = excluded.severity,
       department_code = excluded.department_code,
       lark_message_id = excluded.lark_message_id,
       status = CASE
         WHEN monitor_tickets.status IN ('RESOLVED','CLOSED') THEN monitor_tickets.status
         ELSE monitor_tickets.status
       END,
       updated_at = datetime('now'),
       resolved_at = monitor_tickets.resolved_at`
  );

  const findAlertDbId = db.prepare(`SELECT id FROM monitor_alerts WHERE alert_id = ?`);

  const tx = db.transaction(() => {
    for (const s of DESK_12_SCENARIOS) {
      const primary = s.primary_indicators[0];
      const indId = indicatorId(db, primary);
      if (!indId) continue;

      const title = `${s.code} · ${s.name.en}`;
      const message = `${s.how_it_works.en} [${s.venue} · ${s.symbol}] Skill=${s.skill_code}; RAG=${s.rag_topics.join(" | ")}`;

      insertAlert.run(s.alert_id, indId, s.severity, title, message, s.observed_value, s.ticket_id);

      const alertRow = findAlertDbId.get(s.alert_id) as { id: number } | undefined;
      if (!alertRow) continue;

      const dept =
        s.audience === "perp_exchange"
          ? "RISK_CONTROL"
          : s.audience === "broker_admin"
            ? "OPERATIONS"
            : s.audience === "cfd_pricing"
              ? "SYSTEM"
              : "RISK_CONTROL";

      insertTicket.run(
        s.ticket_id,
        alertRow.id,
        title,
        s.severity === "CRITICAL" ? "ESCALATED" : "OPEN",
        s.severity,
        2,
        dept,
        `om_lark_${s.alert_id}`
      );

      bumpMonitor(db, primary, s.observed_value, s.severity);
      for (const rel of s.related_indicators.slice(0, 2)) {
        // Soft warn on companions so Monitor 2.0 shows co-movement without inventing closed cases.
        const cur = db
          .prepare(`SELECT last_value, status FROM monitor_indicators WHERE monitor_id = ?`)
          .get(rel) as { last_value: number; status: string } | undefined;
        if (cur && cur.status === "HEALTHY") {
          bumpMonitor(db, rel, cur.last_value, "WARN");
        }
      }
    }

    retireLegacyAlerts(db);
  });
  tx();
}

/** Honest RCA packs for desk-12 opens + relabel/hide fake seeded demos. */
export function ensureDesk12Analyses(db: Database.Database) {
  // Relabel any seed packs that still look like live LLM output.
  db.prepare(
    `UPDATE ai_analyses
     SET summary = 'HEURISTIC_SEED · ' || summary
     WHERE (analysis_id LIKE 'AIA-DEMO-%' OR analysis_id = 'AIA-INC-1028')
       AND summary NOT LIKE 'HEURISTIC_%'
       AND summary NOT LIKE 'LIVE_LLM%'`
  ).run();

  // Detach analyses that point at SUPERSEDED legacy alerts so they don't surface as live AI.
  db.prepare(
    `UPDATE ai_analyses
     SET status = 'SUPERSEDED',
         summary = CASE
           WHEN summary LIKE 'HEURISTIC_%' THEN summary
           ELSE 'HEURISTIC_SEED · superseded with legacy alert'
         END
     WHERE alert_id IN (SELECT id FROM monitor_alerts WHERE status = 'SUPERSEDED')
       AND status != 'SUPERSEDED'`
  ).run();

  // Ensure each open desk-12 alert has a fresh heuristic analysis (skill match once skills exist).
  // Lazy require avoids cycle with analyze.ts → db.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { analyzeAlert } = require("@/lib/ai/analyze") as typeof import("@/lib/ai/analyze");
  const rows = db
    .prepare(
      `SELECT a.id, a.alert_id FROM monitor_alerts a
       WHERE a.alert_id IN (${DESK_12_SCENARIOS.map(() => "?").join(",")})
         AND a.status NOT IN ('SUPERSEDED','CLOSED','RESOLVED')`
    )
    .all(...DESK_12_SCENARIOS.map((s) => s.alert_id)) as Array<{ id: number; alert_id: string }>;

  for (const row of rows) {
    const existing = db
      .prepare(
        `SELECT id, status FROM ai_analyses WHERE alert_id = ? AND status != 'SUPERSEDED' ORDER BY id DESC LIMIT 1`
      )
      .get(row.id) as { id: number; status: string } | undefined;
    if (existing) continue;
    try {
      analyzeAlert(row.id, { force: true });
    } catch {
      /* keep boot resilient */
    }
  }
}
