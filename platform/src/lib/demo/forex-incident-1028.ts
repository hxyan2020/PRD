/**
 * Single forex CFD use-case used across Messenger, Monitor labs, Aggregation,
 * Discovery demos, and docs. Keep IDs here so modules do not drift.
 */
export const FOREX_INCIDENT_1028 = {
  incident_id: "INC-1028",
  alert_id: "ALT-INC-1028",
  analysis_id: "AIA-INC-1028",
  thread_id: "THR-INC-1028",
  severity: "P2",
  severity_label: "Medium",
  lp: "LP-A",
  symbol: "XAUUSD",
  product: "CFD",
  desk: "Pricing Engine SG-02",
  occurred_at: "2026-10-16T00:01:00+08:00",
  title_en: "LP Quote Delay & Final Quote Staleness (XAUUSD)",
  title_zh: "LP 報價延遲與最終報價陳舊（XAUUSD）",
  summary_en:
    "LP-A XAUUSD quote age peaked at 4.8s; broker final quote freeze 7.2s. Evidence supports an upstream LP feed anomaly; fallback takeover and client/order impact remain unverified.",
  summary_zh:
    "LP-A 的 XAUUSD 報價年齡峰值 4.8 秒；券商最終報價凍結 7.2 秒。證據支持上游 LP 行情異常；備援接管與客戶／訂單影響尚未核實。",
  l1: [
    { code: "LP_QUOTE_DELAY", severity: "P3", monitor_id: "M2-LP-022" },
    { code: "FINAL_QUOTE_STALE", severity: "P2", monitor_id: "M2-FEED-003" },
    { code: "QUOTE_PUBLISH_LAG", severity: "P3", monitor_id: "M2-FEED-003" },
  ],
  l2: { code: "PRICING_FEED_PROPAGATION", severity: "P2" },
  /** Seeded Monitor 2.0 indicators that ground this story in SQLite. */
  monitors: ["M2-LP-022", "M2-FEED-003", "M2-XAU-247", "M2-HEDGE-007"] as const,
  primary_monitor_id: "M2-LP-022",
  related_monitors: ["M2-FEED-003", "M2-XAU-247", "M2-HEDGE-007"] as const,
  workspace_path: "/admin/ai-incident",
  aggregation_path: "/admin/indicator-aggregation",
  labs_path: "/admin/monitor-labs?tab=ai-incident",
  l2_labs_path: "/admin/monitor-labs?tab=l2-rca",
  messenger_hint: "INC-1028 · LP Quote Delay",
  domain_code: "LP_HEDGE",
  bu_roles: {
    admin: "Risk Owner / SUPER_ADMIN — approve L2, weights, promote discovery",
    pricing: "Pricing Engine SG-02 — quote age, LP feed, publish lag",
    dealing: "Dealing / LP desk — reject rate, hedge coverage, A-book tilt",
  },
} as const;

export type ForexIncident1028 = typeof FOREX_INCIDENT_1028;

export function forexIncidentLabel(locale: "en" | "zh-Hant" = "en") {
  const i = FOREX_INCIDENT_1028;
  if (locale === "zh-Hant") {
    return `${i.incident_id} · ${i.lp} · ${i.symbol} · ${i.title_zh}`;
  }
  return `${i.incident_id} · ${i.lp} · ${i.symbol} · ${i.title_en}`;
}

export function forexIncidentDeskLinks() {
  const i = FOREX_INCIDENT_1028;
  return [
    { href: "/admin/monitor-2", en: "Monitor 2.0 (M2-LP-022 / M2-FEED-003)", zh: "Monitor 2.0（M2-LP-022／M2-FEED-003）" },
    { href: `/admin/alerts?monitor_id=${i.primary_monitor_id}`, en: "Open Alerts", zh: "未結警報" },
    { href: i.aggregation_path, en: "Indicator Aggregation (L1→L2)", zh: "指標聚合（L1→L2）" },
    { href: i.l2_labs_path, en: "L2 → AI RCA lab", zh: "L2 → AI RCA 實驗室" },
    { href: i.workspace_path, en: "AI Incident Workspace", zh: "AI 事故工作台" },
    { href: "/admin/messenger", en: "Ops Inbox (INC-1028 thread)", zh: "值班收件匣（INC-1028 執行緒）" },
    { href: "/admin/docs/indicators-scenarios", en: "Indicators & scenarios catalog", zh: "指標與情境目錄" },
    { href: "/admin/docs/simulated-data", en: "Simulated Data / SQL", zh: "模擬資料／SQL" },
  ] as const;
}
