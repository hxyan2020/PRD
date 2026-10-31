/**
 * Idempotent desk seed so Monitor / Open Alerts / Messenger / Risk Log
 * all surface the shared INC-1028 forex CFD pack (not only labs chrome).
 */
import type Database from "better-sqlite3";
import { FOREX_COMPANION_CASES, FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";

const fx = FOREX_INCIDENT_1028;

function indicatorRowId(db: Database.Database, monitorId: string): number | null {
  const row = db
    .prepare(`SELECT id FROM monitor_indicators WHERE monitor_id = ?`)
    .get(monitorId) as { id: number } | undefined;
  return row?.id ?? null;
}

function ensureAlert(
  db: Database.Database,
  opts: {
    alert_id: string;
    monitor_id: string;
    severity: string;
    title: string;
    message: string;
    observed_value: number;
    status: string;
    ticket_id: string;
    ticket_title: string;
    ticket_status: string;
    department_code?: string;
    assignee_user_id?: number | null;
  }
) {
  const indId = indicatorRowId(db, opts.monitor_id);
  if (!indId) return null;

  const existing = db
    .prepare(`SELECT id FROM monitor_alerts WHERE alert_id = ?`)
    .get(opts.alert_id) as { id: number } | undefined;

  let alertDbId: number;
  if (existing) {
    alertDbId = existing.id;
    db.prepare(
      `UPDATE monitor_alerts
       SET indicator_id = ?, severity = ?, title = ?, message = ?, observed_value = ?,
           status = CASE WHEN status = 'CLOSED' THEN status ELSE ? END,
           monitor20_ticket_id = COALESCE(monitor20_ticket_id, ?)
       WHERE id = ?`
    ).run(
      indId,
      opts.severity,
      opts.title,
      opts.message,
      opts.observed_value,
      opts.status,
      opts.ticket_id,
      alertDbId
    );
  } else {
    const info = db
      .prepare(
        `INSERT INTO monitor_alerts
          (alert_id, indicator_id, severity, title, message, observed_value, status, monitor20_ticket_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        opts.alert_id,
        indId,
        opts.severity,
        opts.title,
        opts.message,
        opts.observed_value,
        opts.status,
        opts.ticket_id
      );
    alertDbId = Number(info.lastInsertRowid);
  }

  const ticket = db
    .prepare(`SELECT id FROM monitor_tickets WHERE ticket_id = ? OR alert_id = ?`)
    .get(opts.ticket_id, alertDbId) as { id: number } | undefined;
  if (!ticket) {
    db.prepare(
      `INSERT INTO monitor_tickets
        (ticket_id, alert_id, title, status, severity, assignee_user_id, department_code, lark_message_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      opts.ticket_id,
      alertDbId,
      opts.ticket_title,
      opts.ticket_status,
      opts.severity,
      opts.assignee_user_id ?? 2,
      opts.department_code ?? "RISK_CONTROL",
      `om_lark_${opts.alert_id}`
    );
  }

  return alertDbId;
}

/** Align indicator live values with the INC-1028 / companion narrative. */
function alignPackMonitors(db: Database.Database) {
  const updates: Array<[string, string, number, number]> = [
    // monitor_id, status, last_value, tickets
    [fx.primary_monitor_id, "BREACH", 5.2, 1],
    ["M2-FEED-003", "WARN", 8, 1],
    ["M2-HEDGE-007", "WARN", 78, 1],
    ["M2-XAU-247", "WARN", 11800, 1],
  ];
  const stmt = db.prepare(
    `UPDATE monitor_indicators
     SET status = ?, last_value = ?, ticket_open_count = max(ticket_open_count, ?), last_checked_at = datetime('now')
     WHERE monitor_id = ?`
  );
  for (const [monitorId, status, lastValue, tickets] of updates) {
    stmt.run(status, lastValue, tickets, monitorId);
  }
}

/**
 * Seed open INC-1028 + open companions so Open Alerts / Monitor filter deep-links work.
 * Idempotent — safe on every getDb() boot.
 */
export function ensureForexPackDeskSeed(db: Database.Database) {
  alignPackMonitors(db);

  const primaryAlertId = ensureAlert(db, {
    alert_id: fx.alert_id,
    monitor_id: fx.primary_monitor_id,
    severity: "BREACH",
    title: `${fx.incident_id} · ${fx.title_en}`,
    message: fx.summary_en,
    observed_value: 5.2,
    status: "OPEN",
    ticket_id: "TKT-INC-1028",
    ticket_title: `${fx.incident_id} · ${fx.lp} ${fx.symbol} quote delay`,
    ticket_status: "ESCALATED",
    department_code: "RISK_CONTROL",
    assignee_user_id: 2,
  });

  // Companion opens — same book, different entry points.
  const hedge = FOREX_COMPANION_CASES.find((c) => c.id === "LP-HEDGE-GAP")!;
  ensureAlert(db, {
    alert_id: hedge.alert_id,
    monitor_id: "M2-HEDGE-007",
    severity: "WARN",
    title: hedge.title_en,
    message: `${hedge.id}: hedge coverage slipped while LP rejects rise on the ${fx.symbol} book (companion to ${fx.incident_id}).`,
    observed_value: 78,
    status: "OPEN",
    ticket_id: "TKT-LP-HEDGE-GAP",
    ticket_title: hedge.title_en,
    ticket_status: "OPEN",
  });

  const xau = FOREX_COMPANION_CASES.find((c) => c.id === "XAU-WEEKEND")!;
  ensureAlert(db, {
    alert_id: xau.alert_id,
    monitor_id: "M2-XAU-247",
    severity: "WARN",
    title: xau.title_en,
    message: `${xau.id}: weekend metals exposure climbing on ${fx.symbol}247 (same CFD book as ${fx.incident_id}).`,
    observed_value: 11800,
    status: "OPEN",
    ticket_id: "TKT-XAU-WEEKEND",
    ticket_title: xau.title_en,
    ticket_status: "OPEN",
  });

  // Closed trail for Risk Log — stale-feed companion resolved.
  const stale = FOREX_COMPANION_CASES.find((c) => c.id === "STALE-FEED-LIQ")!;
  const closedId = ensureAlert(db, {
    alert_id: stale.alert_id,
    monitor_id: "M2-FEED-003",
    severity: "BREACH",
    title: stale.title_en,
    message: `${stale.id}: stale feed contagion path closed after symbol halt + margin review (book shared with ${fx.incident_id}).`,
    observed_value: 11,
    status: "CLOSED",
    ticket_id: "TKT-STALE-FEED-LIQ",
    ticket_title: stale.title_en,
    ticket_status: "RESOLVED",
  });

  if (closedId != null) {
    db.prepare(
      `UPDATE monitor_tickets
       SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, datetime('now', '-2 hours')), updated_at = datetime('now')
       WHERE alert_id = ?`
    ).run(closedId);
    db.prepare(
      `UPDATE monitor_alerts
       SET status = 'CLOSED',
           acknowledged_at = COALESCE(acknowledged_at, datetime('now', '-3 hours')),
           acknowledged_by = COALESCE(acknowledged_by, 2)
       WHERE id = ?`
    ).run(closedId);
  }

  // Attach the canonical INC-1028 messenger thread to the live pack alert.
  // Do not rewrite DUMMY / discovery titles that merely mention INC-1028.
  if (primaryAlertId != null) {
    db.prepare(
      `UPDATE messenger_threads
       SET alert_id = ?, severity = 'BREACH', status = CASE WHEN status = 'CLOSED' THEN 'OPEN' ELSE status END
       WHERE thread_id = ?
          OR (
            title NOT LIKE 'DUMMY%'
            AND (
              title LIKE 'INC-1028 ·%'
              OR title LIKE '%LP Quote Delay & Final Quote Staleness%'
            )
          )`
    ).run(primaryAlertId, fx.thread_id);
  }
}
