import type Database from "better-sqlite3";

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

  // Deterministic handling windows for demo realism
  const timing: Record<string, { ackMin: number; resolveMin?: number; by: number }> = {
    "ALT-1001": { ackMin: 12, resolveMin: 95, by: 2 },
    "ALT-1002": { ackMin: 8, resolveMin: 140, by: 1 },
    "ALT-1003": { ackMin: 18, resolveMin: 210, by: 6 },
    "ALT-1004": { ackMin: 25, by: 1 },
    "ALT-1005": { ackMin: 15, resolveMin: 80, by: 2 },
  };

  for (const a of openAlerts) {
    const t = timing[a.alert_id];
    if (!t || a.acknowledged_at) continue;
    const created = Date.parse(a.created_at.replace(" ", "T") + "Z");
    if (Number.isNaN(created)) continue;
    const ackAt = new Date(created + t.ackMin * 60000).toISOString().slice(0, 19).replace("T", " ");
    ack.run(ackAt, t.by, a.id);
    if (t.resolveMin != null) {
      const resAt = new Date(created + t.resolveMin * 60000).toISOString().slice(0, 19).replace("T", " ");
      resolveTicket.run("RESOLVED", resAt, resAt, a.id);
    }
  }

  const impactCount = (db.prepare(`SELECT COUNT(*) AS c FROM alert_impacts`).get() as { c: number }).c;
  if (impactCount > 0) {
    // Still attach impacts for any new alerts missing them
    backfillImpactsForMissing(db);
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

  const seeds: Array<[string, string, number, number, number, string, string]> = [
    [
      "ALT-1001",
      "PREVENTED",
      42000,
      380000,
      2100000,
      "margin_cascade",
      "Group leverage tighten + copy overlap check prevented cascade liquidations into US open.",
    ],
    [
      "ALT-1002",
      "NEAR_MISS",
      95000,
      260000,
      1800000,
      "copy_concentration",
      "Top provider share hit 31%; pause new copies delayed — residual PnL drag.",
    ],
    [
      "ALT-1003",
      "PREVENTED",
      12000,
      520000,
      6400000,
      "hot_wallet_float",
      "Cold sweep + withdrawal throttle avoided custody exposure breach.",
    ],
    [
      "ALT-1004",
      "LOSS",
      180000,
      40000,
      900000,
      "equity_drawdown",
      "Book drawdown realised during volatile metals session before hedge rebalance.",
    ],
    [
      "ALT-1005",
      "PREVENTED",
      28000,
      210000,
      750000,
      "hedge_gap",
      "LP coverage restored after inventory skew validation.",
    ],
  ];

  for (const [code, outcome, loss, prevented, exposure, tag, notes] of seeds) {
    const id = idOf(code);
    if (!id) continue;
    ins.run(id, outcome, loss, prevented, exposure, tag, notes);
  }

  backfillImpactsForMissing(db);
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
    const severityMul = m.severity === "CRITICAL" ? 3 : m.severity === "BREACH" ? 2 : 1;
    const base = m.product === "Crypto" || m.product === "CRYPTO" ? 90000 : 60000;
    const exposure = base * 12 * severityMul;
    const prevented = Math.round(base * 4.5 * severityMul);
    const loss = Math.round(base * 0.35 * severityMul);
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
    const outcome =
      m.severity === "BREACH" || m.severity === "CRITICAL" ? "NEAR_MISS" : m.severity === "WARN" ? "OPEN" : "FALSE_POSITIVE";
    ins.run(
      m.id,
      outcome,
      loss,
      prevented,
      exposure,
      tag,
      `Auto-estimated impact for ${m.monitor_id} / ${m.title}`
    );
  }
}

export function getRiskLogDashboard() {
  const database = db();
  ensureRiskLogSchema(database);
  seedRiskLogIfEmpty(database);

  const byCategory = database
    .prepare(
      `SELECT i.domain_code AS category,
              COALESCE(d.name, i.domain_code) AS category_name,
              i.product,
              a.severity,
              COUNT(*) AS alert_count,
              SUM(CASE WHEN a.status IN ('OPEN','ACKNOWLEDGED','ESCALATED') THEN 1 ELSE 0 END) AS open_count,
              ROUND(AVG(COALESCE(imp.estimated_loss_usd,0)), 0) AS avg_loss_usd,
              ROUND(SUM(COALESCE(imp.prevented_loss_usd,0)), 0) AS prevented_usd,
              ROUND(SUM(COALESCE(imp.estimated_loss_usd,0)), 0) AS loss_usd
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN risk_domains d ON d.code = i.domain_code
       LEFT JOIN alert_impacts imp ON imp.alert_id = a.id
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
       GROUP BY i.domain_code
       ORDER BY breach_count DESC, alert_count DESC`
    )
    .all();

  const money = database
    .prepare(
      `SELECT
         ROUND(SUM(estimated_loss_usd), 0) AS total_loss_usd,
         ROUND(SUM(prevented_loss_usd), 0) AS total_prevented_usd,
         ROUND(SUM(exposure_usd), 0) AS total_exposure_usd,
         SUM(CASE WHEN outcome='LOSS' THEN 1 ELSE 0 END) AS loss_events,
         SUM(CASE WHEN outcome='PREVENTED' THEN 1 ELSE 0 END) AS prevented_events,
         SUM(CASE WHEN outcome='NEAR_MISS' THEN 1 ELSE 0 END) AS near_miss_events,
         SUM(CASE WHEN outcome='FALSE_POSITIVE' THEN 1 ELSE 0 END) AS false_positive_events,
         SUM(CASE WHEN outcome='OPEN' THEN 1 ELSE 0 END) AS open_events
       FROM alert_impacts`
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

  return {
    summary: {
      alerts_total: (
        database.prepare(`SELECT COUNT(*) AS c FROM monitor_alerts`).get() as { c: number }
      ).c,
      open_alerts: (
        database
          .prepare(`SELECT COUNT(*) AS c FROM monitor_alerts WHERE status IN ('OPEN','ACKNOWLEDGED','ESCALATED')`)
          .get() as { c: number }
      ).c,
      ...money,
      net_risk_usd: Number(money.total_loss_usd || 0) - Number(money.total_prevented_usd || 0),
      ...handling,
    },
    by_category: byCategory,
    by_domain: byDomain,
    loopholes,
    records,
    timeline,
  };
}

function avg(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
