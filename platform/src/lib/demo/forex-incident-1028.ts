/**
 * Shared forex CFD use-case pack for CRMP Admin.
 * Every module that demos broker risk should import from here so IDs / next-steps do not drift.
 */

export const FOREX_INCIDENT_1028 = {
  incident_id: "INC-1028",
  alert_id: "ALT-INC-1028",
  analysis_id: "AIA-INC-1028",
  thread_id: "THR-INC-1028",
  severity: "P2",
  severity_label: "Medium",
  severity_label_zh: "中",
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
  chain_code: "CHAIN-FEED-LIQUIDATION-ERROR",
  skill_codes: ["SKILL-LP-REJECT-STORM", "SKILL-STALE-FEED", "SKILL-HEDGE-COVERAGE"] as const,
  domain_scenarios: ["SCN-LP-REJECT-STORM", "SCN-STALE-FEED", "SCN-XAU247", "SCN-HEDGE-COVERAGE"] as const,
  workspace_path: "/admin/ai-incident",
  aggregation_path: "/admin/indicator-aggregation",
  labs_path: "/admin/monitor-labs?tab=ai-incident",
  l2_labs_path: "/admin/monitor-labs?tab=l2-rca",
  noise_labs_path: "/admin/monitor-labs?tab=noise-reduction",
  risk_log_path: "/admin/risk-log",
  discovery_path: "/admin/discovery",
  messenger_hint: "INC-1028 · LP Quote Delay",
  domain_code: "LP_HEDGE",
  bu_roles: {
    admin: {
      en: "Risk Owner / SUPER_ADMIN — approve L2, weights, promote discovery",
      zh: "風險負責人／SUPER_ADMIN — 核准 L2、權重、探索晉升",
    },
    pricing: {
      en: "Pricing Engine SG-02 — quote age, LP feed, publish lag",
      zh: "定價引擎 SG-02 — 報價年齡、LP 行情、發布延遲",
    },
    dealing: {
      en: "Dealing / LP desk — reject rate, hedge coverage, A-book tilt",
      zh: "交易／LP 台 — 拒絕率、對沖覆蓋、A-book 傾斜",
    },
  },
} as const;

/**
 * Companion CFD forex stories that share the same book / monitor set.
 * Same pack, different entry severity — keeps modules coherent.
 */
export const FOREX_COMPANION_CASES = [
  {
    id: "LP-HEDGE-GAP",
    chain_code: "CHAIN-LP-HEDGE-GAP",
    title_en: "LP reject storm → hedge coverage gap",
    title_zh: "LP 拒絕風暴 → 對沖覆蓋缺口",
    monitors: ["M2-LP-022", "M2-HEDGE-007"] as const,
    primary_monitor_id: "M2-LP-022",
    skill_codes: ["SKILL-LP-REJECT-STORM", "SKILL-HEDGE-COVERAGE"] as const,
    domain_scenarios: ["SCN-LP-REJECT-STORM", "SCN-HEDGE-COVERAGE"] as const,
  },
  {
    id: "XAU-WEEKEND",
    chain_code: "CHAIN-METALS-WEEKEND",
    title_en: "XAUUSD247 weekend exposure build-up",
    title_zh: "XAUUSD247 週末曝險累積",
    monitors: ["M2-XAU-247", "M2-HEDGE-007", "M2-LP-022"] as const,
    primary_monitor_id: "M2-XAU-247",
    skill_codes: ["SKILL-XAU247-EXPOSURE"] as const,
    domain_scenarios: ["SCN-XAU247"] as const,
  },
  {
    id: "STALE-FEED-LIQ",
    chain_code: "CHAIN-FEED-LIQUIDATION-ERROR",
    title_en: "Stale feed → liquidation / credit contagion",
    title_zh: "陳舊行情 → 強平／信用傳染",
    monitors: ["M2-FEED-003", "M2-MRG-014", "M2-EQ-001"] as const,
    primary_monitor_id: "M2-FEED-003",
    skill_codes: ["SKILL-STALE-FEED"] as const,
    domain_scenarios: ["SCN-STALE-FEED"] as const,
  },
] as const;

export type ForexIncident1028 = typeof FOREX_INCIDENT_1028;

export function forexIncidentLabel(locale: "en" | "zh-Hant" = "en") {
  const i = FOREX_INCIDENT_1028;
  if (locale === "zh-Hant") {
    return `${i.incident_id} · ${i.lp} · ${i.symbol} · ${i.title_zh}`;
  }
  return `${i.incident_id} · ${i.lp} · ${i.symbol} · ${i.title_en}`;
}

export function forexIncidentChip(locale: "en" | "zh-Hant" = "en") {
  const i = FOREX_INCIDENT_1028;
  if (locale === "zh-Hant") {
    return `${i.incident_id} · ${i.lp} · ${i.symbol} · ${i.severity}`;
  }
  return `${i.incident_id} · ${i.lp} · ${i.symbol} · ${i.severity}`;
}

export function forexIncidentDeskLinks() {
  const i = FOREX_INCIDENT_1028;
  return [
    {
      href: `/admin/monitor-2?monitor_id=${i.primary_monitor_id}`,
      en: "Monitor 2.0",
      zh: "Monitor 2.0",
    },
    {
      href: `/admin/alerts?monitor_id=${i.primary_monitor_id}`,
      en: "Open Alerts",
      zh: "未結警報",
    },
    { href: i.aggregation_path, en: "Aggregation L1→L2", zh: "指標聚合 L1→L2" },
    { href: i.discovery_path, en: "Unknown Risk Discovery", zh: "未知風險探索" },
    { href: i.l2_labs_path, en: "L2 → AI RCA lab", zh: "L2 → AI RCA 實驗室" },
    { href: i.workspace_path, en: "AI Incident Workspace", zh: "AI 事故工作台" },
    { href: i.noise_labs_path, en: "Noise Reduction lab", zh: "降噪實驗室" },
    { href: "/admin/messenger", en: "Ops Inbox (INC-1028)", zh: "值班收件匣（INC-1028）" },
    { href: i.risk_log_path, en: "Closed Risk Log", zh: "已結風險日誌" },
    { href: "/admin/docs/indicators-scenarios", en: "Indicators & scenarios", zh: "指標與情境" },
    { href: "/admin/docs/simulated-data", en: "Simulated Data / SQL", zh: "模擬資料／SQL" },
  ] as const;
}

/** Compact next-step strip used on most desk pages. */
export function forexPrimaryNextSteps() {
  const i = FOREX_INCIDENT_1028;
  return [
    { href: `/admin/monitor-2?monitor_id=${i.primary_monitor_id}`, en: "Monitor", zh: "監控" },
    { href: `/admin/alerts?monitor_id=${i.primary_monitor_id}`, en: "Alerts", zh: "警報" },
    { href: i.aggregation_path, en: "Aggregate", zh: "聚合" },
    { href: i.workspace_path, en: "AI RCA", zh: "AI 根因" },
    { href: "/admin/messenger", en: "Messenger", zh: "Messenger" },
    { href: i.risk_log_path, en: "Risk Log", zh: "風險日誌" },
  ] as const;
}

export function isForexPackMonitor(monitorId: string | null | undefined) {
  if (!monitorId) return false;
  return (FOREX_INCIDENT_1028.monitors as readonly string[]).includes(monitorId);
}
