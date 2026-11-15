import type Database from "better-sqlite3";

// Avoid importing getDb at module top from paths that db.ts itself imports.
function db() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/db").getDb() as import("better-sqlite3").Database;
}

type MetricSeed = {
  product: "CFD" | "CRYPTO";
  metric_key: string;
  metric_label: string;
  value: number;
  unit: string;
  target?: number;
  status: "OK" | "WARN" | "BREACH";
  notes?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const TEMPLATE: MetricSeed[] = [
  { product: "CFD", metric_key: "book_pnl_usd", metric_label: "Book P&L", value: -420000, unit: "USD", status: "WARN", notes: "US session volatility" },
  { product: "CFD", metric_key: "equity_drawdown_pct", metric_label: "Equity drawdown", value: 3.4, unit: "%", target: 3, status: "WARN" },
  { product: "CFD", metric_key: "hedge_coverage_pct", metric_label: "Hedge coverage", value: 82, unit: "%", target: 85, status: "WARN" },
  { product: "CFD", metric_key: "lp_reject_pct", metric_label: "LP reject rate", value: 0.8, unit: "%", target: 2, status: "OK" },
  { product: "CFD", metric_key: "margin_gt90_count", metric_label: "Accounts >90% margin", value: 128, unit: "count", target: 50, status: "BREACH" },
  { product: "CFD", metric_key: "copy_top_provider_pct", metric_label: "Top copy provider share", value: 31, unit: "%", target: 25, status: "BREACH" },
  { product: "CFD", metric_key: "xau247_net_lots", metric_label: "XAUUSD247 net lots", value: 4200, unit: "lots", target: 10000, status: "OK" },
  { product: "CFD", metric_key: "alerts_open", metric_label: "Open CFD alerts", value: 4, unit: "count", status: "WARN" },
  { product: "CFD", metric_key: "ai_skill_match_pct", metric_label: "AI skill-match rate", value: 67, unit: "%", target: 50, status: "OK" },
  { product: "CFD", metric_key: "human_pending", metric_label: "Pending interventions", value: 3, unit: "count", status: "WARN" },
  { product: "CRYPTO", metric_key: "hot_wallet_float_pct", metric_label: "Hot wallet float", value: 18.2, unit: "%", target: 15, status: "WARN" },
  { product: "CRYPTO", metric_key: "liq_backlog", metric_label: "Liquidation backlog", value: 12, unit: "orders", target: 50, status: "OK" },
  { product: "CRYPTO", metric_key: "withdrawal_queue", metric_label: "Withdrawal queue", value: 37, unit: "count", status: "OK" },
  { product: "CRYPTO", metric_key: "spot_volume_usd", metric_label: "Spot volume", value: 12800000, unit: "USD", status: "OK" },
  { product: "CRYPTO", metric_key: "book_pnl_usd", metric_label: "Exchange P&L", value: 86000, unit: "USD", status: "OK" },
  { product: "CRYPTO", metric_key: "alerts_open", metric_label: "Open crypto alerts", value: 1, unit: "count", status: "OK" },
  { product: "CRYPTO", metric_key: "ai_skill_match_pct", metric_label: "AI skill-match rate", value: 100, unit: "%", target: 50, status: "OK" },
  { product: "CRYPTO", metric_key: "human_pending", metric_label: "Pending interventions", value: 1, unit: "count", status: "OK" },
];

export function seedDailyPerformance(db: Database.Database) {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM daily_performance`).get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare(
    `INSERT INTO daily_performance
      (report_date, product, metric_key, metric_label, value, unit, target, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (let day = 0; day < 7; day++) {
    const date = daysAgo(day);
    for (const m of TEMPLATE) {
      const drift = (Math.random() - 0.5) * (Math.abs(m.value) * 0.08 + 1);
      const value = Math.round((m.value + (day === 0 ? 0 : drift)) * 100) / 100;
      insert.run(
        date,
        m.product,
        m.metric_key,
        m.metric_label,
        value,
        m.unit,
        m.target ?? null,
        day === 0 ? m.status : "OK",
        m.notes ?? null
      );
    }
  }
}

/** Refresh today's metrics from live platform state. */
export function refreshTodayPerformance() {
  const database = db();
  const date = today();
  const upsert = database.prepare(
    `INSERT INTO daily_performance
      (report_date, product, metric_key, metric_label, value, unit, target, status, notes)
     VALUES (@report_date, @product, @metric_key, @metric_label, @value, @unit, @target, @status, @notes)
     ON CONFLICT(report_date, product, metric_key) DO UPDATE SET
       value = excluded.value,
       status = excluded.status,
       notes = excluded.notes,
       metric_label = excluded.metric_label,
       unit = excluded.unit,
       target = excluded.target`
  );

  const openCfd = (
    database
      .prepare(
        `SELECT COUNT(*) AS c FROM monitor_alerts a
         JOIN monitor_indicators i ON i.id = a.indicator_id
         WHERE a.status IN ('OPEN','ACKNOWLEDGED','ESCALATED') AND i.product = 'CFD'`
      )
      .get() as { c: number }
  ).c;
  const openCrypto = (
    database
      .prepare(
        `SELECT COUNT(*) AS c FROM monitor_alerts a
         JOIN monitor_indicators i ON i.id = a.indicator_id
         WHERE a.status IN ('OPEN','ACKNOWLEDGED','ESCALATED') AND i.product = 'Crypto'`
      )
      .get() as { c: number }
  ).c;

  const pending = (
    database.prepare(`SELECT COUNT(*) AS c FROM interventions WHERE status = 'PENDING'`).get() as { c: number }
  ).c;
  const analyses = database
    .prepare(`SELECT mode, COUNT(*) AS c FROM ai_analyses GROUP BY mode`)
    .all() as Array<{ mode: string; c: number }>;
  const skill = analyses.find((a) => a.mode === "SKILL_MATCH")?.c ?? 0;
  const rag = analyses.find((a) => a.mode === "RAG_REASONING")?.c ?? 0;
  const skillPct = skill + rag === 0 ? 0 : Math.round((skill / (skill + rag)) * 100);

  const ind = (monitorId: string) =>
    database.prepare(`SELECT last_value, status FROM monitor_indicators WHERE monitor_id = ?`).get(monitorId) as
      | { last_value: number; status: string }
      | undefined;

  const rows: Array<Record<string, unknown>> = [
    { report_date: date, product: "CFD", metric_key: "alerts_open", metric_label: "Open CFD alerts", value: openCfd, unit: "count", target: null, status: openCfd > 3 ? "WARN" : "OK", notes: "Live" },
    { report_date: date, product: "CRYPTO", metric_key: "alerts_open", metric_label: "Open crypto alerts", value: openCrypto, unit: "count", target: null, status: openCrypto > 2 ? "WARN" : "OK", notes: "Live" },
    { report_date: date, product: "CFD", metric_key: "human_pending", metric_label: "Pending interventions", value: pending, unit: "count", target: 0, status: pending > 0 ? "WARN" : "OK", notes: "Live" },
    { report_date: date, product: "CRYPTO", metric_key: "human_pending", metric_label: "Pending interventions", value: pending, unit: "count", target: 0, status: pending > 0 ? "WARN" : "OK", notes: "Shared queue" },
    { report_date: date, product: "CFD", metric_key: "ai_skill_match_pct", metric_label: "AI skill-match rate", value: skillPct, unit: "%", target: 50, status: skillPct >= 50 ? "OK" : "WARN", notes: "Live" },
    { report_date: date, product: "CRYPTO", metric_key: "ai_skill_match_pct", metric_label: "AI skill-match rate", value: skillPct, unit: "%", target: 50, status: skillPct >= 50 ? "OK" : "WARN", notes: "Live" },
  ];

  const map: Array<[string, string, string, string, number | null]> = [
    ["CFD", "M2-EQ-001", "equity_drawdown_pct", "Equity drawdown", 3],
    ["CFD", "M2-HEDGE-007", "hedge_coverage_pct", "Hedge coverage", 85],
    ["CFD", "M2-MRG-014", "margin_gt90_count", "Accounts >90% margin", 50],
    ["CFD", "M2-COPY-009", "copy_top_provider_pct", "Top copy provider share", 25],
    ["CFD", "M2-XAU-247", "xau247_net_lots", "XAUUSD247 net lots", 10000],
    ["CFD", "M2-LP-022", "lp_reject_pct", "LP reject rate", 2],
    ["CRYPTO", "M2-CRYPTO-WALLET", "hot_wallet_float_pct", "Hot wallet float", 15],
    ["CRYPTO", "M2-CRYPTO-LIQ", "liq_backlog", "Liquidation backlog", 50],
  ];

  for (const [product, mid, key, label, target] of map) {
    const v = ind(mid);
    if (!v) continue;
    rows.push({
      report_date: date,
      product,
      metric_key: key,
      metric_label: label,
      value: v.last_value,
      unit: key.includes("pct") ? "%" : key.includes("lots") ? "lots" : key.includes("count") || key.includes("backlog") ? (key.includes("backlog") ? "orders" : "count") : "",
      target,
      status: v.status === "HEALTHY" ? "OK" : v.status,
      notes: "From Monitor indicator",
    });
  }

  const tx = database.transaction(() => {
    for (const r of rows) upsert.run(r);
  });
  tx();

  // lazy spine log to avoid circular import at module init
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/lib/ai/spine").logSpineEvent({
      stage: "DASHBOARD",
      title: `Daily performance refreshed for ${date}`,
      product: "CFD+CRYPTO",
      ref_type: "daily_performance",
      ref_id: date,
      detail: { metrics: rows.length },
      actor: "dashboard-engine",
    });
  } catch {
    /* ignore */
  }

  return { date, metrics: rows.length };
}

export function getDailyDashboard(reportDate?: string) {
  const database = db();
  seedDailyPerformance(database);
  const date = reportDate || today();
  refreshTodayPerformance();

  const metrics = database
    .prepare(`SELECT * FROM daily_performance WHERE report_date = ? ORDER BY product, metric_key`)
    .all(date) as Array<{
    product: string;
    metric_key: string;
    metric_label: string;
    value: number;
    unit: string | null;
    target: number | null;
    status: string;
    notes: string | null;
  }>;

  const history = database
    .prepare(
      `SELECT report_date, product, metric_key, value, status
       FROM daily_performance
       WHERE report_date >= date(?, '-6 days')
       ORDER BY report_date, product`
    )
    .all(date) as Array<{
    report_date: string;
    product: string;
    metric_key: string;
    value: number;
    status: string;
  }>;

  const cfd = metrics.filter((m) => m.product === "CFD");
  const crypto = metrics.filter((m) => m.product === "CRYPTO");

  return {
    report_date: date,
    cfd,
    crypto,
    history,
    summary: {
      cfd_warn: cfd.filter((m) => m.status === "WARN").length,
      cfd_breach: cfd.filter((m) => m.status === "BREACH").length,
      crypto_warn: crypto.filter((m) => m.status === "WARN").length,
      crypto_breach: crypto.filter((m) => m.status === "BREACH").length,
    },
  };
}
