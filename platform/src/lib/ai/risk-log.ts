import type Database from "better-sqlite3";
import {
  ensureRiskLogHistory,
  ensureRiskLogHistorySchema,
  listRiskLogHistory,
  riskLogHistoryTotals,
} from "@/lib/ai/risk-log-history";

// Avoid circular import with db.ts (which calls ensure/seed from this module).
function db() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/db").getDb() as Database.Database;
}

export function ensureRiskLogSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alert_impacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL UNIQUE,
      outcome TEXT NOT NULL DEFAULT 'OPEN',
      estimated_loss_usd REAL NOT NULL DEFAULT 0,
      prevented_loss_usd REAL NOT NULL DEFAULT 0,
      exposure_usd REAL NOT NULL DEFAULT 0,
      loophole_tag TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (alert_id) REFERENCES monitor_alerts(id)
    );
  `);
  ensureRiskLogHistorySchema(db);
}

function minutesBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start.replace(" ", "T") + "Z");
  const b = Date.parse(end.replace(" ", "T") + "Z");
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round(((b - a) / 60000) * 10) / 10;
}

export function seedRiskLogIfEmpty(db: Database.Database) {
  // Enrich timing on seed alerts if still blank
  const openAlerts = db
    .prepare(`SELECT id, alert_id, created_at, acknowledged_at, status FROM monitor_alerts ORDER BY id`)
    .all() as Array<{
    id: number;
    alert_id: string;
    created_at: string;
    acknowledged_at: string | null;
    status: string;
  }>;

  const ack = db.prepare(
    `UPDATE monitor_alerts SET acknowledged_at = ?, acknowledged_by = ?, status = CASE WHEN status='OPEN' THEN 'ACKNOWLEDGED' ELSE status END WHERE id = ? AND acknowledged_at IS NULL`
  );
  const resolveTicket = db.prepare(
    `UPDATE monitor_tickets SET status = ?, resolved_at = ?, updated_at = ? WHERE alert_id = ? AND resolved_at IS NULL`
  );

  // Ack-only timing for realism. Do NOT auto-resolve — Closed Risk Log must come from a real close walk.
  const timing: Record<string, { ackMin: number; resolveMin?: number; by: number }> = {
    "ALT-INC-1028": { ackMin: 6, by: 2 },
    "ALT-LP-HEDGE-GAP": { ackMin: 10, by: 5 },
    "ALT-ADM-SEG-GAP": { ackMin: 11, by: 1 },
    "ALT-ADM-IB-WASH": { ackMin: 9, by: 2 },
    "ALT-ADM-WD-SURGE": { ackMin: 14, by: 3 },
    "ALT-PRC-SPREAD": { ackMin: 7, by: 5 },
    "ALT-PRC-SWAP": { ackMin: 20, by: 5 },
    "ALT-DL-LP-REJECT": { ackMin: 4, by: 2 },
    "ALT-DL-TOXIC": { ackMin: 8, by: 2 },
    "ALT-PERP-ORACLE": { ackMin: 5, by: 6 },
    "ALT-PERP-LIQ": { ackMin: 3, by: 6 },
    "ALT-PERP-INS": { ackMin: 12, by: 1 },
  };

  for (const a of openAlerts) {
    const t = timing[a.alert_id];
    if (!t) continue;
    const created = Date.parse(a.created_at.replace(" ", "T") + "Z");
    if (Number.isNaN(created)) continue;
    if (!a.acknowledged_at) {
      const ackAt = new Date(created + t.ackMin * 60000).toISOString().slice(0, 19).replace("T", " ");
      ack.run(ackAt, t.by, a.id);
    }
    if (t.resolveMin != null) {
      const resAt = new Date(created + t.resolveMin * 60000).toISOString().slice(0, 19).replace("T", " ");
      resolveTicket.run("RESOLVED", resAt, resAt, a.id);
    }
  }

  const impactCount = (db.prepare(`SELECT COUNT(*) AS c FROM alert_impacts`).get() as { c: number }).c;
  if (impactCount > 0) {
    // Still attach impacts for any new alerts missing them
    backfillImpactsForMissing(db);
    seedClosedActionLogs(db);
    return;
  }

  const byAlertId = db.prepare(`SELECT id, alert_id FROM monitor_alerts`).all() as Array<{
    id: number;
    alert_id: string;
  }>;
  const idOf = (code: string) => byAlertId.find((x) => x.alert_id === code)?.id;

  const ins = db.prepare(
    `INSERT INTO alert_impacts (alert_id, outcome, estimated_loss_usd, prevented_loss_usd, exposure_usd, loophole_tag, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  // Exposure estimates for open desk-12 alerts only — outcome stays OPEN until a real close walk.
  const seeds: Array<[string, string, number, number, number, string, string]> = [
    ["ALT-ADM-SEG-GAP", "OPEN", 0, 0, 318000, "client_money_seg", "Trust ledger lag vs MT5 equity — open until recon closes."],
    ["ALT-ADM-IB-WASH", "OPEN", 0, 0, 940000, "ib_wash", "IB rebate + wash cluster — payout hold pending RO."],
    ["ALT-ADM-WD-SURGE", "OPEN", 0, 0, 4850000, "withdrawal_velocity", "NFP rumour withdrawal surge — queue triage open."],
    ["ALT-INC-1028", "OPEN", 0, 0, 1800000, "pricing_feed_gap", "INC-1028 LP-A XAUUSD quote delay — still open on desk."],
    ["ALT-PRC-SPREAD", "OPEN", 0, 0, 95000000, "spread_shock", "USDJPY CPI spread shock — protection band open."],
    ["ALT-PRC-SWAP", "OPEN", 0, 0, 0, "swap_misconfig", "DST swap divergence — config publish open."],
    ["ALT-DL-LP-REJECT", "OPEN", 0, 0, 1200000, "lp_reject_storm", "EURUSD LP reject storm — dealing reroute open."],
    ["ALT-LP-HEDGE-GAP", "OPEN", 0, 0, 620000, "hedge_gap", "Hedge coverage companion to INC-1028 — open."],
    ["ALT-DL-TOXIC", "OPEN", 0, 0, 780000, "toxic_flow", "NAS100 latency-arb toxicity — last-look open."],
    ["ALT-PERP-ORACLE", "OPEN", 0, 0, 4100000, "oracle_lag", "BTCUSDT mark oracle lag — exchange risk open."],
    ["ALT-PERP-LIQ", "OPEN", 0, 0, 8900000, "liq_backlog", "ETHUSDT liquidation backlog — ADL watch open."],
    ["ALT-PERP-INS", "OPEN", 0, 0, 2200000, "insurance_dd", "Insurance fund drawdown after concentrated OI — open."],
  ];

  for (const [code, outcome, loss, prevented, exposure, tag, notes] of seeds) {
    const id = idOf(code);
    if (!id) continue;
    ins.run(id, outcome, loss, prevented, exposure, tag, notes);
  }

  backfillImpactsForMissing(db);
  seedClosedActionLogs(db);
}

function offsetFrom(base: string, minutes: number) {
  const t = Date.parse(base.replace(" ", "T") + "Z");
  if (!Number.isFinite(t)) return base;
  return new Date(t + minutes * 60000).toISOString().slice(0, 19).replace("T", " ");
}

/** Idempotent AI + BU action trail so closed risk-log cards have the same depth as realtime tracker packs. */
function seedClosedActionLogs(db: Database.Database) {
  const resolved = db
    .prepare(
      `SELECT a.id, a.alert_id, a.created_at, a.acknowledged_at, t.ticket_id, t.resolved_at,
              t.department_code, t.assignee_user_id, u.name AS assignee_name, u.role_code AS assignee_role,
              tm.name AS team_name, imp.notes AS impact_notes
       FROM monitor_tickets t
       JOIN monitor_alerts a ON a.id = t.alert_id
       LEFT JOIN users u ON u.id = t.assignee_user_id
       LEFT JOIN teams tm ON tm.id = u.team_id
       LEFT JOIN alert_impacts imp ON imp.alert_id = a.id
       WHERE t.status IN ('RESOLVED','CLOSED')`
    )
    .all() as Array<{
    id: number;
    alert_id: string;
    created_at: string;
    acknowledged_at: string | null;
    ticket_id: string;
    resolved_at: string | null;
    department_code: string | null;
    assignee_user_id: number | null;
    assignee_name: string | null;
    assignee_role: string | null;
    team_name: string | null;
    impact_notes: string | null;
  }>;

  const exists = db.prepare(`SELECT 1 AS ok FROM audit_logs WHERE action = 'CLOSE_TICKET' AND entity_id = ? LIMIT 1`);
  const ins = db.prepare(
    `INSERT INTO audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const ro = db
    .prepare(`SELECT id, name FROM users WHERE role_code = 'RISK_OWNER' AND status = 'ACTIVE' ORDER BY id LIMIT 1`)
    .get() as { id: number; name: string } | undefined;

  for (const row of resolved) {
    if (exists.get(row.alert_id)) continue;
    const ackAt = row.acknowledged_at || offsetFrom(row.created_at, 12);
    const closeAt = row.resolved_at || offsetFrom(row.created_at, 90);
    const rcaAt = offsetFrom(row.created_at, 20);
    const buAt = offsetFrom(row.created_at, 45);
    const poc = row.assignee_name || "Business unit POC";
    const dept = row.department_code || row.team_name || "RISK_CONTROL";
    const solution =
      row.impact_notes ||
      `${poc} mandated the desk control for ${row.alert_id} and closed ${row.ticket_id}.`;

    ins.run(
      5,
      "AI RCA",
      "AI_RCA_PUBLISHED",
      "ai_analysis",
      row.alert_id,
      JSON.stringify({
        note: `Root-cause pack published for ${row.ticket_id}. Recommended control sent to ${dept}.`,
        department: "AI",
      }),
      rcaAt
    );
    ins.run(
      row.assignee_user_id,
      poc,
      "BU_ACTION",
      "monitor_ticket",
      row.ticket_id,
      JSON.stringify({
        note: `${dept} executed the recommended control and logged the handling trail.`,
        department: dept,
      }),
      buAt
    );
    if (row.acknowledged_at) {
      ins.run(
        row.assignee_user_id,
        poc,
        "ACK_ALERT",
        "monitor_alert",
        row.alert_id,
        JSON.stringify({ note: `${poc} acknowledged the alarm on the desk.`, department: dept }),
        ackAt
      );
    }
    ins.run(
      row.assignee_user_id,
      poc,
      "CLOSE_TICKET",
      "monitor_alert",
      row.alert_id,
      JSON.stringify({ note: `Ticket ${row.ticket_id} closed.`, ticket: row.ticket_id, department: dept }),
      closeAt
    );
    ins.run(
      ro?.id ?? row.assignee_user_id,
      ro?.name || poc,
      "MANDATE_SOLUTION",
      "monitor_alert",
      row.alert_id,
      JSON.stringify({
        notes: solution,
        mandated_by: `${ro?.name || poc} / ${poc}`,
        department: dept,
        note: solution,
      }),
      closeAt
    );
  }
}

function backfillImpactsForMissing(db: Database.Database) {
  const missing = db
    .prepare(
      `SELECT a.id, a.severity, a.title, i.domain_code, i.product, i.monitor_id
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       WHERE NOT EXISTS (SELECT 1 FROM alert_impacts x WHERE x.alert_id = a.id)`
    )
    .all() as Array<{
    id: number;
    severity: string;
    title: string;
    domain_code: string;
    product: string;
    monitor_id: string;
  }>;

  const ins = db.prepare(
    `INSERT INTO alert_impacts (alert_id, outcome, estimated_loss_usd, prevented_loss_usd, exposure_usd, loophole_tag, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const m of missing) {
    const tag =
      m.domain_code === "CREDIT_CLIENT"
        ? "client_credit_gap"
        : m.domain_code === "CRYPTO_EXCHANGE"
          ? "exchange_ops_gap"
          : m.domain_code === "FRAUD_CONDUCT"
            ? "multi_account_abuse"
            : m.domain_code === "LP_HEDGE"
              ? "hedge_gap"
              : m.domain_code === "MARKET_PRICING"
                ? "pricing_feed_gap"
                : "process_gap";
    // Open alerts: exposure estimate only — never invent loss/prevented until a real close walk.
    const exposure =
      m.product === "Crypto" || m.product === "CRYPTO"
        ? m.severity === "CRITICAL"
          ? 2_000_000
          : 900_000
        : m.severity === "CRITICAL"
          ? 1_500_000
          : 600_000;
    ins.run(
      m.id,
      "OPEN",
      0,
      0,
      exposure,
      tag,
      `Open exposure estimate for ${m.monitor_id} / ${m.title} — loss/prevented filled only after real close.`
    );
  }
}

const CLOSED_ALERT_SQL = `(a.status IN ('CLOSED','RESOLVED') OR EXISTS (
  SELECT 1 FROM monitor_tickets t
  WHERE t.alert_id = a.id AND t.status IN ('RESOLVED','CLOSED')
)) AND a.status != 'SUPERSEDED'`;

export function getRiskLogDashboard() {
  const database = db();
  ensureRiskLogSchema(database);
  seedRiskLogIfEmpty(database);
  ensureRiskLogHistory(database);

  // Scrub invented loss/prevented on still-open impacts (legacy backfill).
  database
    .prepare(
      `UPDATE alert_impacts
       SET estimated_loss_usd = 0,
           prevented_loss_usd = 0,
           outcome = 'OPEN',
           notes = COALESCE(notes, '') || CASE WHEN notes LIKE '%real close%' THEN '' ELSE ' · scrubbed fake close money (open)' END
       WHERE outcome != 'OPEN'
         AND alert_id IN (
           SELECT a.id FROM monitor_alerts a
           WHERE a.status IN ('OPEN','ACKNOWLEDGED','ESCALATED')
             AND NOT EXISTS (
               SELECT 1 FROM monitor_tickets t
               WHERE t.alert_id = a.id AND t.status IN ('RESOLVED','CLOSED')
             )
         )`
    )
    .run();

  const byCategory = database
    .prepare(
      `SELECT i.domain_code AS category,
              COALESCE(d.name, i.domain_code) AS category_name,
              i.product,
              a.severity,
              COUNT(*) AS alert_count,
              0 AS open_count,
              ROUND(AVG(COALESCE(imp.estimated_loss_usd,0)), 0) AS avg_loss_usd,
              ROUND(SUM(COALESCE(imp.prevented_loss_usd,0)), 0) AS prevented_usd,
              ROUND(SUM(COALESCE(imp.estimated_loss_usd,0)), 0) AS loss_usd
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN risk_domains d ON d.code = i.domain_code
       LEFT JOIN alert_impacts imp ON imp.alert_id = a.id
       WHERE ${CLOSED_ALERT_SQL}
       GROUP BY i.domain_code, i.product, a.severity
       ORDER BY alert_count DESC, loss_usd DESC`
    )
    .all();

  const byDomain = database
    .prepare(
      `SELECT i.domain_code AS category,
              COALESCE(d.name, i.domain_code) AS category_name,
              COUNT(*) AS alert_count,
              SUM(CASE WHEN a.severity IN ('BREACH','CRITICAL') THEN 1 ELSE 0 END) AS breach_count,
              ROUND(100.0 * SUM(CASE WHEN a.severity IN ('BREACH','CRITICAL') THEN 1 ELSE 0 END) / COUNT(*), 1) AS breach_rate_pct,
              ROUND(SUM(COALESCE(imp.estimated_loss_usd,0)), 0) AS loss_usd,
              ROUND(SUM(COALESCE(imp.prevented_loss_usd,0)), 0) AS prevented_usd,
              ROUND(SUM(COALESCE(imp.exposure_usd,0)), 0) AS exposure_usd
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN risk_domains d ON d.code = i.domain_code
       LEFT JOIN alert_impacts imp ON imp.alert_id = a.id
       WHERE ${CLOSED_ALERT_SQL}
       GROUP BY i.domain_code
       ORDER BY breach_count DESC, alert_count DESC`
    )
    .all();

  const money = database
    .prepare(
      `SELECT
         ROUND(SUM(COALESCE(imp.estimated_loss_usd,0)), 0) AS total_loss_usd,
         ROUND(SUM(COALESCE(imp.prevented_loss_usd,0)), 0) AS total_prevented_usd,
         ROUND(SUM(COALESCE(imp.exposure_usd,0)), 0) AS total_exposure_usd,
         SUM(CASE WHEN imp.outcome='LOSS' THEN 1 ELSE 0 END) AS loss_events,
         SUM(CASE WHEN imp.outcome='PREVENTED' THEN 1 ELSE 0 END) AS prevented_events,
         SUM(CASE WHEN imp.outcome='NEAR_MISS' THEN 1 ELSE 0 END) AS near_miss_events,
         SUM(CASE WHEN imp.outcome='FALSE_POSITIVE' THEN 1 ELSE 0 END) AS false_positive_events,
         SUM(CASE WHEN imp.outcome='OPEN' THEN 1 ELSE 0 END) AS open_events
       FROM alert_impacts imp
       JOIN monitor_alerts a ON a.id = imp.alert_id
       WHERE ${CLOSED_ALERT_SQL}`
    )
    .get() as Record<string, number>;

  const chronological = database
    .prepare(
      `SELECT a.id,
              a.alert_id,
              a.created_at,
              a.acknowledged_at,
              a.severity,
              a.status,
              a.title,
              a.message,
              a.observed_value,
              i.name AS indicator_name,
              i.monitor_id,
              i.domain_code,
              i.product,
              COALESCE(d.name, i.domain_code) AS category_name,
              t.ticket_id,
              t.status AS ticket_status,
              t.created_at AS ticket_created_at,
              t.resolved_at AS ticket_resolved_at,
              t.department_code,
              imp.outcome,
              imp.estimated_loss_usd,
              imp.prevented_loss_usd,
              imp.exposure_usd,
              imp.loophole_tag,
              imp.notes AS impact_notes,
              (SELECT MIN(i2.requested_at) FROM interventions i2
                 JOIN ai_analyses an ON an.id = i2.analysis_id
                 WHERE an.alert_id = a.id) AS first_intervention_at,
              (SELECT MAX(i2.decided_at) FROM interventions i2
                 JOIN ai_analyses an ON an.id = i2.analysis_id
                 WHERE an.alert_id = a.id AND i2.decided_at IS NOT NULL) AS last_decision_at,
              er.sla_minutes
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN risk_domains d ON d.code = i.domain_code
       LEFT JOIN monitor_tickets t ON t.alert_id = a.id
       LEFT JOIN alert_impacts imp ON imp.alert_id = a.id
       LEFT JOIN escalation_routes er ON er.domain_code = i.domain_code AND er.severity = a.severity AND er.enabled = 1
       WHERE ${CLOSED_ALERT_SQL}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT 200`
    )
    .all() as Array<Record<string, unknown>>;

  const records = chronological.map((r) => {
    const ackMins = minutesBetween(String(r.created_at), r.acknowledged_at ? String(r.acknowledged_at) : null);
    const resolveMins = minutesBetween(
      String(r.ticket_created_at || r.created_at),
      r.ticket_resolved_at ? String(r.ticket_resolved_at) : null
    );
    const humanMins = minutesBetween(
      r.first_intervention_at ? String(r.first_intervention_at) : null,
      r.last_decision_at ? String(r.last_decision_at) : null
    );
    const sla = r.sla_minutes != null ? Number(r.sla_minutes) : null;
    const slaBreached = ackMins != null && sla != null ? ackMins > sla : false;
    return {
      ...r,
      ack_minutes: ackMins,
      resolve_minutes: resolveMins,
      human_handling_minutes: humanMins,
      sla_breached: slaBreached,
    };
  });

  const handling = {
    avg_ack_minutes: avg(records.map((r) => r.ack_minutes)),
    avg_resolve_minutes: avg(records.map((r) => r.resolve_minutes)),
    avg_human_handling_minutes: avg(records.map((r) => r.human_handling_minutes)),
    sla_breach_count: records.filter((r) => r.sla_breached).length,
    decided_interventions: (
      database.prepare(`SELECT COUNT(*) AS c FROM interventions WHERE status IN ('APPROVED','REJECTED')`).get() as {
        c: number;
      }
    ).c,
    pending_interventions: (
      database.prepare(`SELECT COUNT(*) AS c FROM interventions WHERE status='PENDING'`).get() as { c: number }
    ).c,
  };

  const loopholes = database
    .prepare(
      `SELECT
         COALESCE(imp.loophole_tag, 'unclassified') AS loophole_tag,
         i.domain_code,
         COALESCE(d.name, i.domain_code) AS category_name,
         i.product,
         COUNT(*) AS incidents,
         SUM(CASE WHEN a.severity IN ('BREACH','CRITICAL') THEN 1 ELSE 0 END) AS breach_incidents,
         ROUND(SUM(COALESCE(imp.estimated_loss_usd,0)), 0) AS loss_usd,
         ROUND(SUM(COALESCE(imp.prevented_loss_usd,0)), 0) AS prevented_usd,
         ROUND(AVG(
           CASE WHEN a.acknowledged_at IS NOT NULL
             THEN (julianday(a.acknowledged_at) - julianday(a.created_at)) * 24 * 60
             ELSE NULL END
         ), 1) AS avg_ack_minutes
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN risk_domains d ON d.code = i.domain_code
       LEFT JOIN alert_impacts imp ON imp.alert_id = a.id
       WHERE ${CLOSED_ALERT_SQL}
       GROUP BY COALESCE(imp.loophole_tag, 'unclassified'), i.domain_code, i.product
       ORDER BY breach_incidents DESC, incidents DESC, loss_usd DESC`
    )
    .all();

  const timeline = database
    .prepare(
      `SELECT 'ALERT' AS kind, a.created_at AS at, a.alert_id AS ref, a.title AS title, a.severity AS severity, i.domain_code AS category, i.product AS product
       FROM monitor_alerts a JOIN monitor_indicators i ON i.id = a.indicator_id
       UNION ALL
       SELECT 'INTERVENTION', COALESCE(i.decided_at, i.requested_at), CAST(i.id AS TEXT), i.action_code || ' ' || i.status, CASE i.status WHEN 'REJECTED' THEN 'WARN' WHEN 'APPROVED' THEN 'INFO' ELSE 'WARN' END, ind.domain_code, ind.product
       FROM interventions i
       JOIN ai_analyses an ON an.id = i.analysis_id
       JOIN monitor_alerts a ON a.id = an.alert_id
       JOIN monitor_indicators ind ON ind.id = a.indicator_id
       UNION ALL
       SELECT 'SPINE', s.created_at, s.event_id, s.title, COALESCE(s.severity,'INFO'), COALESCE(s.product,''), COALESCE(s.product,'')
       FROM spine_events s
       ORDER BY at DESC
       LIMIT 120`
    )
    .all();

  const history = listRiskLogHistory(database);
  const history_totals = riskLogHistoryTotals(history);

  const closedTotal = (
    database
      .prepare(`SELECT COUNT(*) AS c FROM monitor_alerts a WHERE ${CLOSED_ALERT_SQL}`)
      .get() as { c: number }
  ).c;

  const moneySafe = {
    total_loss_usd: Number(money?.total_loss_usd || 0),
    total_prevented_usd: Number(money?.total_prevented_usd || 0),
    total_exposure_usd: Number(money?.total_exposure_usd || 0),
    loss_events: Number(money?.loss_events || 0),
    prevented_events: Number(money?.prevented_events || 0),
    near_miss_events: Number(money?.near_miss_events || 0),
    false_positive_events: Number(money?.false_positive_events || 0),
    open_events: Number(money?.open_events || 0),
  };

  return {
    summary: {
      alerts_total: closedTotal,
      open_alerts: (
        database
          .prepare(
            `SELECT COUNT(*) AS c FROM monitor_alerts WHERE status IN ('OPEN','ACKNOWLEDGED','ESCALATED')`
          )
          .get() as { c: number }
      ).c,
      ...moneySafe,
      net_risk_usd: moneySafe.total_loss_usd - moneySafe.total_prevented_usd,
      ...handling,
    },
    by_category: byCategory,
    by_domain: byDomain,
    loopholes,
    records,
    timeline,
    history,
    history_totals,
  };
}

function avg(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
