/**
 * Canonical CRMP desk pack — 12 realistic risk scenarios.
 * Audience: 3 CFD broker admin · 3 CFD pricing · 3 CFD dealing · 3 perpetual exchange.
 * All bilingual (en / zh-Hant). Closed Risk Log must come from a real close walk, not seed.
 */

import type { DomainScenario } from "@/lib/ai/risk-domain-scenarios";

export type DeskAudience = "broker_admin" | "cfd_pricing" | "cfd_dealing" | "perp_exchange";

export type NoiseTechniqueId =
  | "threshold_optimisation"
  | "severity_optimisation"
  | "persistence"
  | "hysteresis"
  | "dedup"
  | "sequence"
  | "p0_bypass"
  | "shadow"
  | "batching"
  | "dynamic_multiplier"
  | "quality_gate"
  | "flapping_suppression"
  | "rate_limit"
  | "human_feedback_loop"
  | "backtest_shadow_approve";

export type DeskNoiseMethod = {
  code: string;
  en: string;
  zh: string;
  /** Technique tags — covers threshold / severity / persistence and more (not limited to those three). */
  techniques: NoiseTechniqueId[];
  knobs: Array<{ en: string; zh: string }>;
};

/** Catalogue of noise-reduction techniques used across the desk-12 pack (extensible — not a closed set). */
export const NOISE_TECHNIQUE_CATALOGUE: Array<{
  id: NoiseTechniqueId;
  en: string;
  zh: string;
  core?: boolean;
}> = [
  {
    id: "threshold_optimisation",
    core: true,
    en: "Threshold optimisation — warn/breach bands tuned to desk reality",
    zh: "閾值優化 — 依櫃台實況調整警告／違規帶",
  },
  {
    id: "severity_optimisation",
    core: true,
    en: "Severity optimisation — promote/demote WARN↔BREACH↔CRITICAL with context",
    zh: "嚴重度優化 — 依情境提升／降級 WARN↔BREACH↔CRITICAL",
  },
  {
    id: "persistence",
    core: true,
    en: "Persistence — require sustained breach across N windows before paging",
    zh: "持續性 — 需連續 N 個視窗違規才通知",
  },
  {
    id: "hysteresis",
    en: "Hysteresis — separate clear vs fire levels to stop chatter",
    zh: "滯後帶 — 分開觸發／解除水位，抑制抖動",
  },
  {
    id: "dedup",
    en: "Deduplication — merge sibling alerts under one parent",
    zh: "去重 — 將兄弟警報合併至同一父事件",
  },
  {
    id: "sequence",
    en: "SEQUENCE / AND gates — co-fire rules across indicators",
    zh: "SEQUENCE／AND 閘門 — 跨指標共觸發規則",
  },
  {
    id: "p0_bypass",
    en: "P0 bypass — never auto-suppress firm-critical paths",
    zh: "P0 旁路 — 禁止自動抑制公司級關鍵路徑",
  },
  {
    id: "shadow",
    en: "Shadow mode — score silently before WARN page",
    zh: "Shadow 模式 — 先靜默計分再 WARN 通知",
  },
  {
    id: "batching",
    en: "Batching — roll micro-events into a daily/config ticket",
    zh: "批次合併 — 將微事件收成每日／設定工單",
  },
  {
    id: "dynamic_multiplier",
    en: "Dynamic multiplier — raise bands in known news windows when rails healthy",
    zh: "動態倍數 — 通道健康時於已知新聞窗口提高閾值帶",
  },
  {
    id: "quality_gate",
    en: "Data-quality gate — drop null/stale timestamps before business rules",
    zh: "數據質量閘門 — 業務規則前丟棄空值／過期時間戳",
  },
  {
    id: "flapping_suppression",
    en: "Flapping suppression — ignore recover-within-window toggles",
    zh: "抖動抑制 — 忽略視窗內來回恢復的抖動",
  },
  {
    id: "rate_limit",
    en: "Notification rate-limit — cap pages per symbol/LP per minute",
    zh: "通知限速 — 限制每商品／LP 每分鐘通知數",
  },
  {
    id: "human_feedback_loop",
    en: "Human feedback loop — TP/FP/UNKNOWN labels drive offline retune",
    zh: "人工回饋迴路 — TP／FP／UNKNOWN 標註驅動離線調參",
  },
  {
    id: "backtest_shadow_approve",
    en: "Backtest → Shadow → Approve — never hot-edit production rules",
    zh: "回測 → Shadow → 核准 — 禁止熱改生產規則",
  },
];

/** Assert core trio is always present in the catalogue (threshold / severity / persistence). */
export function noiseCatalogueCoversCoreTrio(): boolean {
  const ids = new Set(NOISE_TECHNIQUE_CATALOGUE.map((t) => t.id));
  return (
    ids.has("threshold_optimisation") &&
    ids.has("severity_optimisation") &&
    ids.has("persistence")
  );
}

export type Desk12Scenario = DomainScenario & {
  audience: DeskAudience;
  alert_id: string;
  ticket_id: string;
  severity: "WARN" | "BREACH" | "CRITICAL";
  observed_value: number;
  symbol: string;
  venue: string;
  /** Noise-reduction play derived from this scenario */
  noise: DeskNoiseMethod;
  /** Skill + RAG hooks for AI RCA */
  skill_code: string;
  rag_topics: string[];
};

export const DESK_AUDIENCE_LABEL: Record<DeskAudience, { en: string; zh: string }> = {
  broker_admin: { en: "CFD broker admin", zh: "CFD Broker 管理風控" },
  cfd_pricing: { en: "CFD pricing", zh: "CFD Pricing 報價風控" },
  cfd_dealing: { en: "CFD dealing", zh: "CFD Dealing 報價／對沖風控" },
  perp_exchange: { en: "Perpetual exchange", zh: "永續合約交易所風控" },
};

/** Full-flow demo walk order (matches left-nav desk path). */
export const FULL_FLOW_STEPS: Array<{
  id: string;
  href: string;
  en: string;
  zh: string;
  hintEn: string;
  hintZh: string;
}> = [
  {
    id: "risk-domains",
    href: "/admin/risk-domains",
    en: "Risk Domains",
    zh: "風險領域",
    hintEn: "12 catalogue scenarios by audience",
    hintZh: "依受眾分類的 12 則目錄情境",
  },
  {
    id: "monitor-2",
    href: "/admin/monitor-2",
    en: "Known indicator definitions",
    zh: "已知指標定義",
    hintEn: "Primary + related Monitor 2.0 indicators",
    hintZh: "主指標與相關 Monitor 2.0 指標",
  },
  {
    id: "alerts",
    href: "/admin/alerts",
    en: "Monitor 2.0 Open Alerts",
    zh: "Monitor 2.0 未結警報",
    hintEn: "Open queue for the 12 desk alerts",
    hintZh: "12 則櫃台未結警報佇列",
  },
  {
    id: "discovery",
    href: "/admin/discovery",
    en: "Unknown Risk Discovery",
    zh: "未知風險探索",
    hintEn: "Candidates beyond the 12 known scenarios",
    hintZh: "12 則已知情境以外的候選",
  },
  {
    id: "indicator-aggregation",
    href: "/admin/indicator-aggregation",
    en: "Indicator Aggregation",
    zh: "指標聚合流程",
    hintEn: "L1→L2 on linked desk chains",
    hintZh: "連動櫃台鏈路的 L1→L2",
  },
  {
    id: "market-intel",
    href: "/admin/market-intel",
    en: "Market Intelligence",
    zh: "市場情報",
    hintEn: "Live HTTP poll of Reuters / Fed / Binance / …",
    hintZh: "對 Reuters／Fed／Binance 等做即時 HTTP 輪詢",
  },
  {
    id: "ai-incident",
    href: "/admin/ai-incident",
    en: "AI Root Cause Analysis",
    zh: "AI根因分析",
    hintEn: "LLM + Skill match + RAG (provider noted)",
    hintZh: "LLM＋技能匹配＋RAG（註明供應商）",
  },
  {
    id: "noise-reduction",
    href: "/admin/noise-reduction",
    en: "Noise reduction flow",
    zh: "降噪流程",
    hintEn: "12 scenario-derived noise methods",
    hintZh: "由 12 則情境衍生的降噪方法",
  },
  {
    id: "risk-log",
    href: "/admin/risk-log",
    en: "Closed Risk Log",
    zh: "已結風險日誌",
    hintEn: "Only after a real close walk — not seed-faked",
    hintZh: "需真實關單後才有 — 不做種子假裝",
  },
  {
    id: "dashboard",
    href: "/admin/dashboard",
    en: "Daily Performance",
    zh: "每日績效",
    hintEn: "Live refresh from open alerts + indicators",
    hintZh: "自未結警報與指標即時刷新",
  },
];

export const DESK_12_SCENARIOS: Desk12Scenario[] = [
  // —— CFD broker admin (3) ——
  {
    code: "SCN-ADM-SEG-GAP",
    audience: "broker_admin",
    alert_id: "ALT-ADM-SEG-GAP",
    ticket_id: "TKT-ADM-SEG-GAP",
    severity: "BREACH",
    observed_value: 318000,
    symbol: "CLIENT-MONEY",
    venue: "Vantage CFD · ASIC entity",
    skill_code: "SKILL-REG-SEGREGATION-GAP",
    rag_topics: ["client money segregation", "ASIC RG 212", "trust account recon"],
    name: {
      en: "Client-money segregation gap after weekend deposits",
      zh: "週末入金後客戶資金隔離缺口",
    },
    domain_code: "REG_CAPITAL",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "Monday 07:05 SGT recon shows trust-account ledger lagging retail MT5 equity by USD 318k after a weekend promo deposit wave. Segregation monitor M2-SEG-025 breaches while capital buffer M2-CAP-024 is still healthy — classic admin/ops risk, not a pricing fault.",
      zh: "週一 07:05 SGT 對帳顯示信託帳戶帳簿落後零售 MT5 權益約 31.8 萬美元（週末促銷入金潮）。隔離監控 M2-SEG-025 違規，而資本緩衝 M2-CAP-024 仍健康 — 典型管理／營運風險，非報價故障。",
    },
    participants: [
      { en: "Broker Admin / Finance Ops", zh: "Broker 管理／財務營運" },
      { en: "Risk Control (entity capital)", zh: "風險控管（實體資本）" },
      { en: "Compliance (client money)", zh: "合規（客戶資金）" },
    ],
    impacts: {
      en: "Regulatory breach risk, delayed withdrawals, possible temporary deposit freeze until recon closes.",
      zh: "監管違規風險、出金延遲；對帳關閉前可能暫凍結入金。",
    },
    primary_indicators: ["M2-SEG-025"],
    related_indicators: ["M2-CAP-024", "M2-FUND-010", "M2-RECON-BRK"],
    noise: {
      code: "NR-ADM-SEG-PERSIST",
      techniques: ["persistence", "hysteresis", "threshold_optimisation", "human_feedback_loop"],
      en: "Require 2 consecutive recon cycles above breach before paging Compliance",
      zh: "連續 2 輪對帳超違規才通知合規",
      knobs: [
        { en: "Persistence ≥ 2 recon cycles", zh: "持續性 ≥ 2 輪對帳" },
        { en: "Suppress if gap closing >40%/cycle", zh: "若缺口每輪收斂 >40% 則抑制" },
      ],
    },
  },
  {
    code: "SCN-ADM-IB-WASH",
    audience: "broker_admin",
    alert_id: "ALT-ADM-IB-WASH",
    ticket_id: "TKT-ADM-IB-WASH",
    severity: "BREACH",
    observed_value: 0.81,
    symbol: "IB-CLUSTER-4471",
    venue: "Vantage CFD · IB programme",
    skill_code: "SKILL-FRAUD-IB-WASH",
    rag_topics: ["IB rebate abuse", "wash trading", "multi-account collusion"],
    name: {
      en: "IB rebate + wash cluster on correlated MT5 logins",
      zh: "相關 MT5 登入上的 IB 返佣＋對倒集群",
    },
    domain_code: "FRAUD_CONDUCT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "IB payout anomaly score M2-IB-PAYOUT hits 0.81 while wash/collusion M2-WASH-020 co-moves on 14 accounts sharing device fingerprints and opposing XAUUSD tickets within 800ms. Admin fraud desk owns payout hold; dealing only confirms A-book fill integrity.",
      zh: "IB 異常分數 M2-IB-PAYOUT 達 0.81，同時 14 個共用裝置指紋帳戶在 800ms 內互作反向 XAUUSD 單，洗倉分數 M2-WASH-020 同步上升。管理反欺詐台負責凍結返佣；Dealing 僅確認 A-book 成交完整性。",
    },
    participants: [
      { en: "Broker Admin / Fraud Ops", zh: "Broker 管理／反欺詐營運" },
      { en: "AI Detection (cluster score)", zh: "AI 偵測（集群分數）" },
      { en: "Dealing (fill integrity check)", zh: "Dealing（成交完整性檢查）" },
    ],
    impacts: {
      en: "Rebate leakage, skewed volume KPIs, possible chargebacks if clients dispute forced closes.",
      zh: "返佣流失、成交量 KPI 失真；若強制平倉遭客訴可能引發退單。",
    },
    primary_indicators: ["M2-IB-PAYOUT", "M2-WASH-020"],
    related_indicators: ["M2-FRAUD-011", "M2-BONUS-013", "M2-CHARGEBACK"],
    noise: {
      code: "NR-ADM-IB-DEDUP",
      techniques: ["dedup", "severity_optimisation", "rate_limit", "batching"],
      en: "Deduplicate IB + wash alerts into one parent when same cluster_id",
      zh: "同一 cluster_id 時將 IB＋洗倉警報去重為單一父事件",
      knobs: [
        { en: "Cluster window 15m", zh: "集群視窗 15 分鐘" },
        { en: "Min accounts ≥ 8", zh: "最少帳戶數 ≥ 8" },
      ],
    },
  },
  {
    code: "SCN-ADM-WD-SURGE",
    audience: "broker_admin",
    alert_id: "ALT-ADM-WD-SURGE",
    ticket_id: "TKT-ADM-WD-SURGE",
    severity: "WARN",
    observed_value: 4_850_000,
    symbol: "WD-QUEUE",
    venue: "Vantage CFD · payments rail",
    skill_code: "SKILL-OPS-WITHDRAWAL-SURGE",
    rag_topics: ["withdrawal velocity", "funding exceptions", "payment ops SLA"],
    name: {
      en: "Withdrawal velocity surge after NFP social rumour",
      zh: "NFP 社群謠傳後出金速度暴衝",
    },
    domain_code: "OPS_PROCESS",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "M2-WD-015 prints USD 4.85m in 60 minutes (breach 5.0m warn 2.0m) while funding exceptions M2-FUND-010 climb. No pricing stale-feed — clients are pulling cash after a Telegram rumour about weekend gaps. Admin payment ops owns queue triage.",
      zh: "M2-WD-015 在 60 分鐘打出 485 萬美元（違規 500 萬／警告 200 萬），同時資金異常 M2-FUND-010 上升。並無報價過期 — 客戶因 Telegram 週末跳空謠言提現。管理支付營運負責佇列分流。",
    },
    participants: [
      { en: "Broker Admin / Payments", zh: "Broker 管理／支付" },
      { en: "Client Ops", zh: "客戶營運" },
      { en: "Risk Control (liquidity buffer)", zh: "風險控管（流動性緩衝）" },
    ],
    impacts: {
      en: "Liquidity buffer stress, SLA breaches on payouts, reputational noise if queues stall.",
      zh: "流動性緩衝承壓、出金 SLA 違約；佇列卡住時損害口碑。",
    },
    primary_indicators: ["M2-WD-015"],
    related_indicators: ["M2-FUND-010", "M2-COMPLAINT", "M2-CAP-024"],
    noise: {
      code: "NR-ADM-WD-THRESHOLD",
      techniques: ["dynamic_multiplier", "threshold_optimisation", "severity_optimisation", "quality_gate"],
      en: "Raise dynamic threshold 1.2× during known news windows if bank rails healthy",
      zh: "銀行通道健康時，已知新聞窗口動態閾值提高 1.2×",
      knobs: [
        { en: "News-window multiplier", zh: "新聞窗口倍數" },
        { en: "Rail-health gate", zh: "通道健康閘門" },
      ],
    },
  },

  // —— CFD pricing (3) ——
  {
    code: "SCN-PRC-STALE-XAU",
    audience: "cfd_pricing",
    alert_id: "ALT-INC-1028",
    ticket_id: "TKT-INC-1028",
    severity: "BREACH",
    observed_value: 5.2,
    symbol: "XAUUSD",
    venue: "LP-A · oneZero bridge",
    skill_code: "SKILL-PRICING-FEED-STALE",
    rag_topics: ["LP quote delay", "final quote freeze", "XAUUSD feed failover"],
    name: {
      en: "LP-A XAUUSD quote delay & final-quote freeze (INC-1028)",
      zh: "LP-A XAUUSD 報價延遲與最終報價凍結（INC-1028）",
    },
    domain_code: "MARKET_PRICING",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "Canonical pricing incident: LP-A XAUUSD quote age peaked ~4.8s; broker final quote freeze ~7.2s. M2-LP-022 reject rate and M2-FEED-003 stale symbols co-fire. Pricing owns feed diagnosis; dealing watches hedge rejects as companion.",
      zh: "標準報價事故：LP-A XAUUSD 報價年齡峰值約 4.8 秒；券商最終報價凍結約 7.2 秒。M2-LP-022 拒單率與 M2-FEED-003 過期商品同時觸發。Pricing 負責饋源診斷；Dealing 以對沖拒單為伴隨訊號。",
    },
    participants: [
      { en: "CFD Pricing / Feed Ops", zh: "CFD Pricing／饋源營運" },
      { en: "Trading Infra (bridge)", zh: "交易基礎設施（橋接）" },
      { en: "Dealing (hedge companion)", zh: "Dealing（對沖伴隨）" },
    ],
    impacts: {
      en: "Client fills on stale mid, negative slip complaints, possible symbol halt.",
      zh: "客戶以過期中價成交、負滑點投訴、可能觸發商品熔斷。",
    },
    primary_indicators: ["M2-LP-022", "M2-FEED-003"],
    related_indicators: ["M2-HEDGE-007", "M2-XAU-247", "M2-SLIP-021"],
    noise: {
      code: "NR-PRC-FEED-FLAP",
      techniques: ["persistence", "flapping_suppression", "hysteresis", "threshold_optimisation"],
      en: "Suppress flap if quote age recovers <1.5s within 8s persistence window",
      zh: "若報價年齡在 8 秒持續窗內恢復到 <1.5 秒則抑制抖動",
      knobs: [
        { en: "Persistence 8s", zh: "持續性 8 秒" },
        { en: "Recovery age <1.5s", zh: "恢復年齡 <1.5 秒" },
      ],
    },
  },
  {
    code: "SCN-PRC-SPREAD-SHOCK",
    audience: "cfd_pricing",
    alert_id: "ALT-PRC-SPREAD",
    ticket_id: "TKT-PRC-SPREAD",
    severity: "BREACH",
    observed_value: 3.4,
    symbol: "USDJPY",
    venue: "Tier-1 LP stack · London/NY overlap",
    skill_code: "SKILL-PRICING-SPREAD-SHOCK",
    rag_topics: ["news window spread", "session median ratio", "gross notional into NFP"],
    name: {
      en: "USDJPY spread shock into US CPI print",
      zh: "美國 CPI 公布前 USDJPY 點差衝擊",
    },
    domain_code: "PRODUCT_CONFIG",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Fifteen minutes before US CPI, M2-SPREAD-005 hits 3.4× session median on USDJPY while M2-NEWS-GROSS notional into the window exceeds USD 95m. Pricing widens protection band; risk watches equity drawdown companion.",
      zh: "美國 CPI 前 15 分鐘，USDJPY 的 M2-SPREAD-005 達場內中位數 3.4 倍，同時窗口名義本金 M2-NEWS-GROSS 超過 9500 萬美元。Pricing 擴大保護帶；風險台關注權益回撤伴隨。",
    },
    participants: [
      { en: "CFD Pricing", zh: "CFD Pricing" },
      { en: "Risk Control", zh: "風險控管" },
      { en: "Market Intelligence", zh: "市場情報" },
    ],
    impacts: {
      en: "Client reject spikes, gap exposure if protection band too slow, complaint velocity.",
      zh: "客戶拒單上升；保護帶過慢則跳空曝險；投訴速度上升。",
    },
    primary_indicators: ["M2-SPREAD-005", "M2-NEWS-GROSS"],
    related_indicators: ["M2-GAP-012", "M2-EQ-001", "M2-MKT-INTEL"],
    noise: {
      code: "NR-PRC-NEWS-BYPASS",
      techniques: ["p0_bypass", "severity_optimisation", "dynamic_multiplier", "quality_gate"],
      en: "P0 bypass: never auto-suppress spread alerts inside Tier-1 calendar ±10m",
      zh: "P0 旁路：一級財經日曆 ±10 分鐘內不得自動抑制點差警報",
      knobs: [
        { en: "Calendar gate", zh: "日曆閘門" },
        { en: "Min ratio still logged", zh: "仍記錄最低比率" },
      ],
    },
  },
  {
    code: "SCN-PRC-SWAP-FLIP",
    audience: "cfd_pricing",
    alert_id: "ALT-PRC-SWAP",
    ticket_id: "TKT-PRC-SWAP",
    severity: "WARN",
    observed_value: 11,
    symbol: "MULTI",
    venue: "CFD product book · daily swap publish",
    skill_code: "SKILL-PRICING-SWAP-MISCONFIG",
    rag_topics: ["swap vs benchmark", "DST roll", "triple-swap Wednesday"],
    name: {
      en: "Swap vs benchmark divergence after DST roll",
      zh: "夏令時間換日後掉期相對基準偏離",
    },
    domain_code: "PRODUCT_CONFIG",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "After US DST roll, M2-SWAP-027 shows 11 symbols with swap points off broker benchmark continuum (incl. XAUUSD247 and US30). Pricing config publish lagged; not a live quote outage.",
      zh: "美國夏令時間換日後，M2-SWAP-027 顯示 11 個商品掉期點偏離券商基準（含 XAUUSD247、US30）。屬 Pricing 設定發布延遲，非即時報價中斷。",
    },
    participants: [
      { en: "CFD Pricing / Product Config", zh: "CFD Pricing／產品設定" },
      { en: "Ops (swap publish)", zh: "營運（掉期發布）" },
    ],
    impacts: {
      en: "Overnight financing disputes, IB queries, manual swap adjustments.",
      zh: "隔夜融資爭議、IB 查詢、人工掉期調整。",
    },
    primary_indicators: ["M2-SWAP-027"],
    related_indicators: ["M2-XAU-247", "M2-RECON-BRK"],
    noise: {
      code: "NR-PRC-SWAP-BATCH",
      techniques: ["batching", "dedup", "threshold_optimisation", "backtest_shadow_approve"],
      en: "Batch per-symbol swap warnings into one daily config ticket",
      zh: "將逐商品掉期警告合併為每日一張設定工單",
      knobs: [
        { en: "Batch window 24h", zh: "合併視窗 24 小時" },
        { en: "Min symbols ≥ 5", zh: "最少商品數 ≥ 5" },
      ],
    },
  },

  // —— CFD dealing (3) ——
  {
    code: "SCN-DL-LP-REJECT",
    audience: "cfd_dealing",
    alert_id: "ALT-DL-LP-REJECT",
    ticket_id: "TKT-DL-LP-REJECT",
    severity: "CRITICAL",
    observed_value: 7.8,
    symbol: "EURUSD",
    venue: "LP-B/C · London open",
    skill_code: "SKILL-DEALING-LP-REJECT-STORM",
    rag_topics: ["LP reject storm", "A-book failover", "oneZero throttle"],
    name: {
      en: "LP reject storm on EURUSD at London open",
      zh: "倫敦開盤 EURUSD LP 拒單風暴",
    },
    domain_code: "LP_HEDGE",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "M2-LP-022 hits 7.8% rejects on LP-B within 3 minutes of London open; M2-ABOOK-008 A-book ratio collapses as failover fills. Dealing owns LP disable / reroute; pricing confirms quotes still firm.",
      zh: "倫敦開盤 3 分鐘內 LP-B 的 M2-LP-022 拒單率達 7.8%；備援成交使 M2-ABOOK-008 A-book 比率下滑。Dealing 負責停用／改道 LP；Pricing 確認報價仍穩。",
    },
    participants: [
      { en: "CFD Dealing", zh: "CFD Dealing" },
      { en: "Trading Infra", zh: "交易基礎設施" },
      { en: "CFD Pricing (quote firmness)", zh: "CFD Pricing（報價穩定性）" },
    ],
    impacts: {
      en: "Unhedged residual, inventory skew, possible B-book PnL shock.",
      zh: "未對沖殘差、庫存偏斜、可能衝擊 B-book 損益。",
    },
    primary_indicators: ["M2-LP-022"],
    related_indicators: ["M2-ABOOK-008", "M2-HEDGE-007", "M2-BRIDGE-LAT"],
    noise: {
      code: "NR-DL-REJECT-BURST",
      techniques: ["batching", "severity_optimisation", "p0_bypass", "rate_limit"],
      en: "Aggregate reject micro-bursts <30s into one L1 unless CRITICAL threshold crossed",
      zh: "將 <30 秒的拒單微爆發聚為單一 L1，除非已越 CRITICAL 閾值",
      knobs: [
        { en: "Burst window 30s", zh: "爆發視窗 30 秒" },
        { en: "Critical bypass", zh: "Critical 旁路" },
      ],
    },
  },
  {
    code: "SCN-DL-HEDGE-GAP",
    audience: "cfd_dealing",
    alert_id: "ALT-LP-HEDGE-GAP",
    ticket_id: "TKT-LP-HEDGE-GAP",
    severity: "WARN",
    observed_value: 78,
    symbol: "XAUUSD",
    venue: "CFD hedge book",
    skill_code: "SKILL-DEALING-HEDGE-COVERAGE",
    rag_topics: ["hedge coverage ratio", "LP throttle", "inventory skew"],
    name: {
      en: "Hedge coverage gap after LP throttle (companion INC-1028)",
      zh: "LP 限流後對沖覆蓋缺口（伴隨 INC-1028）",
    },
    domain_code: "LP_HEDGE",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "While pricing fights INC-1028 staleness, dealing sees M2-HEDGE-007 coverage slip to 78% (warn <85%) on the same XAUUSD book. Companion alert — not a duplicate pricing ticket.",
      zh: "Pricing 處理 INC-1028 過期時，Dealing 見同一 XAUUSD 帳簿 M2-HEDGE-007 覆蓋率滑至 78%（警告 <85%）。屬伴隨警報 — 非重複報價工單。",
    },
    participants: [
      { en: "CFD Dealing", zh: "CFD Dealing" },
      { en: "Risk Control", zh: "風險控管" },
    ],
    impacts: {
      en: "Residual market risk, overnight inventory, equity drawdown pressure.",
      zh: "殘餘市場風險、隔夜庫存、權益回撤壓力。",
    },
    primary_indicators: ["M2-HEDGE-007"],
    related_indicators: ["M2-LP-022", "M2-EQ-001", "M2-XAU-247"],
    noise: {
      code: "NR-DL-HEDGE-LINK",
      techniques: ["dedup", "sequence", "severity_optimisation", "persistence"],
      en: "Link hedge-gap WARN under parent INC-1028 L2 when same symbol+LP",
      zh: "同商品＋LP 時將對沖缺口 WARN 掛到 INC-1028 L2 父事件下",
      knobs: [
        { en: "Parent link rule", zh: "父事件連結規則" },
        { en: "Symbol+LP key", zh: "商品＋LP 鍵" },
      ],
    },
  },
  {
    code: "SCN-DL-TOXIC",
    audience: "cfd_dealing",
    alert_id: "ALT-DL-TOXIC",
    ticket_id: "TKT-DL-TOXIC",
    severity: "BREACH",
    observed_value: 0.73,
    symbol: "NAS100",
    venue: "CFD index book · US cash open",
    skill_code: "SKILL-DEALING-TOXIC-FLOW",
    rag_topics: ["latency arb", "toxic flow", "last-look / widen"],
    name: {
      en: "Latency-arb toxic flow on NAS100 at cash open",
      zh: "美股開盤 NAS100 延遲套利毒性流",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "M2-ARB-026 toxicity score 0.73 with concentrated taker flow beating LP mid by 8–12ms. Dealing applies last-look / symbol widen; credit reviews account tiers.",
      zh: "M2-ARB-026 毒性分數 0.73，集中吃單流領先 LP 中價 8–12ms。Dealing 啟用 last-look／擴大點差；信貸覆核帳戶分層。",
    },
    participants: [
      { en: "CFD Dealing", zh: "CFD Dealing" },
      { en: "Credit / Client Risk", zh: "信貸／客戶風險" },
      { en: "AI Detection", zh: "AI 偵測" },
    ],
    impacts: {
      en: "Adverse selection PnL, LP relationship strain, possible account restrictions.",
      zh: "逆向選擇損益、LP 關係承壓、可能限制帳戶。",
    },
    primary_indicators: ["M2-ARB-026"],
    related_indicators: ["M2-SLIP-021", "M2-BRIDGE-LAT", "M2-FRAUD-011"],
    noise: {
      code: "NR-DL-TOXIC-SCORE",
      techniques: ["shadow", "threshold_optimisation", "severity_optimisation", "human_feedback_loop"],
      en: "Shadow-mode score for 5m before WARN page unless score ≥0.70",
      zh: "分數未達 0.70 前先 Shadow 5 分鐘再 WARN 通知",
      knobs: [
        { en: "Shadow 5m", zh: "Shadow 5 分鐘" },
        { en: "Hard breach 0.70", zh: "硬違規 0.70" },
      ],
    },
  },

  // —— Perpetual exchange (3) ——
  {
    code: "SCN-PERP-ORACLE",
    audience: "perp_exchange",
    alert_id: "ALT-PERP-ORACLE",
    ticket_id: "TKT-PERP-ORACLE",
    severity: "BREACH",
    observed_value: 2.6,
    symbol: "BTCUSDT",
    venue: "Vantage Perp · mark oracle",
    skill_code: "SKILL-PERP-ORACLE-LAG",
    rag_topics: ["mark-index basis", "oracle lag", "perp funding"],
    name: {
      en: "BTCUSDT mark oracle lag with basis blowout",
      zh: "BTCUSDT 標記價格預言機延遲並基差擴大",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 0,
    product: "Crypto",
    how_it_works: {
      en: "M2-CRYPTO-ORACLE lag 2.6s while M2-PERP-BASIS spikes to 72 bps on BTCUSDT perpetual. Exchange risk owns mark freeze / index switch; not a CFD pricing ticket.",
      zh: "BTCUSDT 永續上 M2-CRYPTO-ORACLE 延遲 2.6 秒，同時 M2-PERP-BASIS 衝至 72 bps。交易所風險負責標記凍結／切指數；非 CFD 報價工單。",
    },
    participants: [
      { en: "Perp Exchange Risk", zh: "永續交易所風險" },
      { en: "Trading Infra (oracle)", zh: "交易基礎設施（預言機）" },
      { en: "Market Intelligence (CEX headlines)", zh: "市場情報（CEX 頭條）" },
    ],
    impacts: {
      en: "Wrong liquidations, insurance fund hits, basis arb inventory.",
      zh: "錯誤強平、保險基金受損、基差套利庫存。",
    },
    primary_indicators: ["M2-CRYPTO-ORACLE", "M2-PERP-BASIS"],
    related_indicators: ["M2-FUNDING-RATE", "M2-CRYPTO-LIQ", "M2-MKT-INTEL"],
    noise: {
      code: "NR-PERP-ORACLE-SEQ",
      techniques: ["sequence", "threshold_optimisation", "persistence", "quality_gate"],
      en: "SEQUENCE: only raise L2 when oracle lag AND basis both breach within 60s",
      zh: "SEQUENCE：60 秒內預言機延遲與基差同時違規才升 L2",
      knobs: [
        { en: "AND window 60s", zh: "AND 視窗 60 秒" },
        { en: "Solo L1 still logged", zh: "單獨 L1 仍入帳" },
      ],
    },
  },
  {
    code: "SCN-PERP-LIQ",
    audience: "perp_exchange",
    alert_id: "ALT-PERP-LIQ",
    ticket_id: "TKT-PERP-LIQ",
    severity: "CRITICAL",
    observed_value: 240,
    symbol: "ETHUSDT",
    venue: "Vantage Perp · liquidation engine",
    skill_code: "SKILL-PERP-LIQ-BACKLOG",
    rag_topics: ["liquidation backlog", "funding flip", "auto-deleveraging"],
    name: {
      en: "ETHUSDT liquidation backlog into funding flip",
      zh: "ETHUSDT 強平積壓碰上資金費翻轉",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 0,
    product: "Crypto",
    how_it_works: {
      en: "M2-CRYPTO-LIQ backlog 240 orders (breach 200) as M2-FUNDING-RATE flips through −0.52%/8h. Engine queue stalls; ADL candidates populate. Exchange risk + infra own throttle.",
      zh: "M2-CRYPTO-LIQ 積壓 240 筆（違規 200），同時 M2-FUNDING-RATE 翻至 −0.52%/8h。引擎佇列卡住並產生 ADL 候選。交易所風險＋基礎設施負責限流。",
    },
    participants: [
      { en: "Perp Exchange Risk", zh: "永續交易所風險" },
      { en: "Trading Infra", zh: "交易基礎設施" },
      { en: "Exec Risk Bridge (if ADL)", zh: "高管風險橋接（若 ADL）" },
    ],
    impacts: {
      en: "Socialised losses, insurance drain, client trust shock.",
      zh: "社會化虧損、保險金耗損、客戶信任衝擊。",
    },
    primary_indicators: ["M2-CRYPTO-LIQ", "M2-FUNDING-RATE"],
    related_indicators: ["M2-CRYPTO-INS", "M2-CRYPTO-OI", "M2-KILL-COUNT"],
    noise: {
      code: "NR-PERP-LIQ-P0",
      techniques: ["p0_bypass", "severity_optimisation", "rate_limit", "backtest_shadow_approve"],
      en: "Never shadow-suppress liquidation backlog once ≥ breach — P0 bypass",
      zh: "強平積壓一旦 ≥ 違規閾值禁止 Shadow 抑制 — P0 旁路",
      knobs: [
        { en: "P0 bypass locked", zh: "P0 旁路鎖定" },
        { en: "ADL page SLA 5m", zh: "ADL 通知 SLA 5 分鐘" },
      ],
    },
  },
  {
    code: "SCN-PERP-INS",
    audience: "perp_exchange",
    alert_id: "ALT-PERP-INS",
    ticket_id: "TKT-PERP-INS",
    severity: "BREACH",
    observed_value: 9.4,
    symbol: "BTCUSDT",
    venue: "Vantage Perp · insurance fund",
    skill_code: "SKILL-PERP-INSURANCE-DD",
    rag_topics: ["insurance fund drawdown", "OI concentration", "adversarial liquidation"],
    name: {
      en: "Insurance fund drawdown after concentrated OI liquidation",
      zh: "集中持倉強平後保險基金回撤",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 1,
    product: "Crypto",
    how_it_works: {
      en: "M2-CRYPTO-INS daily drawdown 9.4% (breach 8%) after a top account (M2-CRYPTO-OI 38%) is force-closed through thin book. Perp risk reviews OI caps and insurance top-up.",
      zh: "頭部帳戶（M2-CRYPTO-OI 38%）在薄冊強平後，M2-CRYPTO-INS 日回撤 9.4%（違規 8%）。永續風險覆核持倉上限與保險補資。",
    },
    participants: [
      { en: "Perp Exchange Risk", zh: "永續交易所風險" },
      { en: "Treasury / Insurance Ops", zh: "資金／保險營運" },
      { en: "Risk Control", zh: "風險控管" },
    ],
    impacts: {
      en: "Solvency optics, tighter OI caps, possible listing halt on thin alts.",
      zh: "清償能力觀感、收緊持倉上限、薄流動山寨幣可能暫停上市。",
    },
    primary_indicators: ["M2-CRYPTO-INS", "M2-CRYPTO-OI"],
    related_indicators: ["M2-CRYPTO-LIQ", "M2-STABLE-EXP", "M2-CRYPTO-WALLET"],
    noise: {
      code: "NR-PERP-INS-ROLL",
      techniques: ["threshold_optimisation", "sequence", "persistence", "hysteresis", "shadow"],
      en: "Use 1h rolling drawdown to cut overnight false spikes from mark prints",
      zh: "使用 1 小時滾動回撤，減少標記價造成的隔夜假尖峰",
      knobs: [
        { en: "Rolling 1h DD", zh: "1 小時滾動回撤" },
        { en: "OI co-fire required for P1 page", zh: "P1 通知需 OI 共觸發" },
      ],
    },
  },
];

export function desk12AsDomainScenarios(): DomainScenario[] {
  return DESK_12_SCENARIOS.map(
    ({
      code,
      name,
      domain_code,
      priority,
      product,
      how_it_works,
      participants,
      impacts,
      primary_indicators,
      related_indicators,
    }) => ({
      code,
      name,
      domain_code,
      priority,
      product,
      how_it_works,
      participants,
      impacts,
      primary_indicators,
      related_indicators,
    })
  );
}

export function desk12ByAudience(audience: DeskAudience): Desk12Scenario[] {
  return DESK_12_SCENARIOS.filter((s) => s.audience === audience);
}

export function desk12AlertIds(): string[] {
  return DESK_12_SCENARIOS.map((s) => s.alert_id);
}

export function desk12PrimaryMonitorIds(): string[] {
  const set = new Set<string>();
  for (const s of DESK_12_SCENARIOS) {
    for (const id of s.primary_indicators) set.add(id);
    for (const id of s.related_indicators) set.add(id);
  }
  return [...set];
}
