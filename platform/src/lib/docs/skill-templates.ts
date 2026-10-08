/**
 * Copy-paste templates for authoring new AI skills / linked chains.
 * Wire into: risk-scenarios-*.ts, skill-zh.ts, skill-escalation-map.ts, skill-rag-map.ts,
 * then seed via skills.ts / restart so /admin/skills and Knowledge Tree pick them up.
 */

export type SkillTemplateKind =
  | "skeleton"
  | "credit"
  | "lp_hedge"
  | "crypto"
  | "pricing_feed"
  | "fraud"
  | "admin_model"
  | "ops_funding"
  | "cs_intake"
  | "tr_execution"
  | "linked_chain";

export type SkillTemplate = {
  id: string;
  kind: SkillTemplateKind;
  title_en: string;
  title_zh: string;
  blurb_en: string;
  blurb_zh: string;
  /** Where to paste in the codebase */
  files: string[];
  /** TypeScript object ready to customize */
  body_ts: string;
  /** Optional Traditional Chinese overlay stub */
  zh_ts?: string;
  /** Escalation route bind snippet */
  route_ts?: string;
  /** SKILL_RAG_DOCS bind snippet */
  rag_bind_ts?: string;
};

const PLACEHOLDERS = `// Replace every YOUR_* / M2-YOUR-* / ESC-YOUR-* before shipping.
// Domains: CREDIT_CLIENT | LP_HEDGE | MARKET_PRICING | CRYPTO_EXCHANGE | FRAUD_CONDUCT |
//          PRODUCT_CONFIG | MODEL_AI | OPS_PROCESS | REG_CAPITAL | TECH_INFRA | CS_SERVICE | TRADING_EXEC
// Product: "CFD" | "Crypto" | "CFD+Crypto"
// BU on corrections: RISK_CONTROL | OPERATIONS | AI | SYSTEM | EXEC | CUSTOMER_SERVICE | TRADING`;

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: "TPL-SKILL-SKELETON",
    kind: "skeleton",
    title_en: "Minimal skill skeleton",
    title_zh: "最小技能骨架",
    blurb_en: "Bare SkillScenario — fill every YOUR_* field. Use when inventing a new monitor family.",
    blurb_zh: "最精簡 SkillScenario — 填滿所有 YOUR_*。新監控家族時用。",
    files: [
      "platform/src/lib/ai/risk-scenarios-extra.ts (or new file re-exported from catalog)",
      "platform/src/lib/ai/skill-zh.ts",
      "platform/src/lib/ai/skill-escalation-map.ts",
      "platform/src/lib/ai/skill-rag-map.ts",
    ],
    body_ts: `${PLACEHOLDERS}

import type { SkillScenario } from "@/lib/ai/scenario-types";

export const YOUR_SKILL: SkillScenario = {
  code: "SKILL-YOUR-CODE",
  name: "YOUR short English name (threshold in title)",
  description: "One sentence: what happened / risk if ignored.",
  indicator: {
    monitor_id: "M2-YOUR-001",
    name: "YOUR indicator display name",
    product: "CFD",
    domain: "CREDIT_CLIENT",
    warn: 0,
    breach: 0,
    unit: "count", // or %, USD, ms, score, lots…
    comparator: "gte", // or "lte"
    why: "Why these warn/breach numbers exist for the desk.",
  },
  related_indicators: ["M2-RELATED-A", "M2-RELATED-B"],
  conditions: { severity_in: ["WARN", "BREACH", "CRITICAL"], min_observed: 0 },
  fault_areas: ["Fault hypothesis 1", "Fault hypothesis 2"],
  escalation: {
    sla_minutes: 15,
    route_code: "ESC-YOUR-ROUTE", // must exist or fall back via skill-escalation-map
    path: [
      { after_minutes: 0, team: "Credit Desk", channel: "oc_credit_client_risk", action: "Lark + ticket" },
      { after_minutes: 15, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "Secondary page" },
    ],
  },
  corrections: [
    { action: "your_check", bu: "RISK_CONTROL", description: "Non-destructive first check" },
    { action: "your_contain", bu: "RISK_CONTROL", description: "Containment", requires_human: true },
  ],
  past_cases: [
    {
      case_id: "CASE-YOUR-001",
      date: "2026-10-08",
      outcome: "PREVENTED / NEAR_MISS / ACCEPTED",
      summary: "What happened and what the desk did.",
    },
  ],
  owner_department: "RISK_CONTROL",
  owner_role: "Risk Owner / Credit Desk",
  auto_execute: false,
  when_to_use: ["Use when …"],
  when_not_to_use: ["Do not use when …", "Never auto-execute irreversible controls."],
  prechecks: ["Confirm monitor freshness", "Check economic calendar ±60m if market-linked"],
  evidence_to_collect: ["Monitor snapshot", "Messenger card", "Related indicator panel"],
  stop_conditions: ["Stop if metric falls below warn for 15m and no linked BREACH"],
  success_criteria: ["Named owner within SLA", "Human gate recorded if control armed"],
  steps: [
    { action: "lark_notify", description: "Notify owning desk", bu: "RISK_CONTROL" },
    { action: "investigate", description: "Run prechecks and collect evidence", bu: "RISK_CONTROL" },
    { action: "propose_control", description: "Queue human-gated control if needed", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    zh_ts: `import type { SkillZh } from "@/lib/ai/skill-zh";

export const YOUR_SKILL_ZH: SkillZh = {
  name: "你的繁中技能名稱（含門檻）",
  description: "一句話：發生什麼／忽略的風險。",
  why: "為何是這些預警／違規數字。",
  indicator_name: "指標顯示名稱",
  fault_areas: ["故障假設一", "故障假設二"],
  when_to_use: ["在……時使用"],
  when_not_to_use: ["在……時不要用", "不可自動執行不可逆控制"],
  prechecks: ["確認監控新鮮度"],
  evidence_to_collect: ["監控快照", "Messenger 卡片"],
  stop_conditions: ["指標回落預警下 15 分鐘且無連結違規則停止"],
  success_criteria: ["SLA 內具名負責人", "若武裝控制則有人工關卡紀錄"],
  corrections: ["非破壞性檢查", "人工關卡遏制"],
  steps: ["通知所屬台", "執行預檢與蒐證", "必要時排隊人工關卡控制"],
};
`,
    route_ts: `"SKILL-YOUR-CODE": "ESC-YOUR-ROUTE", // in SKILL_ESCALATION_ROUTE`,
    rag_bind_ts: `"SKILL-YOUR-CODE": ["your-rag-leaf", "escalation-spine"], // in SKILL_RAG_DOCS`,
  },
  {
    id: "TPL-SKILL-CREDIT",
    kind: "credit",
    title_en: "Credit / client cascade skill",
    title_zh: "信貸／客戶連鎖技能",
    blurb_en: "Margin, stop-out, NBP, copy — human-gated leverage / close-only. Pattern: SKILL-MARGIN-SPIKE.",
    blurb_zh: "保證金、強平、負餘額、跟單 — 人工關卡槓桿／僅平倉。範式：SKILL-MARGIN-SPIKE。",
    files: ["platform/src/lib/ai/risk-scenarios-extra.ts", "skill-zh.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_CREDIT: SkillScenario = {
  code: "SKILL-YOUR-CREDIT",
  name: "YOUR credit event (≥N accounts / util%)",
  description: "Credit cascade when many accounts share stress (margin / stop-out / NBP / copy).",
  indicator: {
    monitor_id: "M2-MRG-014",
    name: "Accounts >90% Margin Utilisation",
    product: "CFD",
    domain: "CREDIT_CLIENT",
    warn: 50,
    breach: 100,
    unit: "count",
    comparator: "gte",
    why: "Population stress moves equity and LP fills together; single VIP is not this skill.",
  },
  related_indicators: ["M2-COPY-009", "M2-STOP-018", "M2-NBP-016", "M2-FEED-003", "M2-EQ-001"],
  conditions: { severity_in: ["BREACH", "CRITICAL"], min_observed: 100 },
  fault_areas: [
    "Copy-provider leverage contagion",
    "Stale quotes faking util",
    "News window mistaken for toxic flow",
  ],
  escalation: {
    sla_minutes: 15,
    route_code: "ESC-MARGIN-BREACH",
    path: [
      { after_minutes: 0, team: "Credit Desk", channel: "oc_credit_client_risk", action: "Lark + ticket" },
      { after_minutes: 15, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "Secondary page" },
      { after_minutes: 30, team: "Exec Risk Bridge", channel: "oc_exec_risk_bridge", action: "If equity also WARN" },
    ],
  },
  corrections: [
    { action: "check_copy_overlap", bu: "RISK_CONTROL", description: "Map stressed UIDs to top providers" },
    { action: "group_leverage_tighten", bu: "RISK_CONTROL", description: "Temporary group leverage cut", requires_human: true },
    { action: "symbol_close_only", bu: "RISK_CONTROL", description: "Close-only on toxic symbols", requires_human: true },
  ],
  past_cases: [],
  owner_department: "RISK_CONTROL",
  owner_role: "Risk Owner / Credit Desk",
  when_to_use: ["Population util/stop-out BREACH", "Copy concentration co-moving"],
  when_not_to_use: ["Single VIP/contest", "Feed BREACH unresolved", "Pure macro ±60m without toxicity"],
  prechecks: ["Monitor freshness <2m", "M2-FEED-003", "M2-COPY-009", "Economic calendar"],
  evidence_to_collect: ["Util histogram", "Provider overlap", "Messenger + challenger"],
  stop_conditions: ["Below warn 15m", "Challenger DISAGREE without Risk Owner override"],
  success_criteria: ["Owner in 15m", "Human gate on any leverage/close-only"],
  steps: [
    { action: "lark_notify", description: "Notify Credit & Client Risk", bu: "RISK_CONTROL" },
    { action: "check_copy_overlap", description: "Provider overlap on stressed logins", bu: "RISK_CONTROL" },
    { action: "propose_leverage", description: "Queue human-gated group leverage cut", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    zh_ts: `"SKILL-YOUR-CREDIT": {
  name: "你的信貸事件（≥N 帳戶／使用率）",
  description: "多帳戶共同受壓時的信貸連鎖（保證金／強平／負餘額／跟單）。",
  why: "群體受壓會同時衝擊權益與 LP 成交；單一 VIP 不是本技能。",
},`,
    route_ts: `"SKILL-YOUR-CREDIT": "ESC-MARGIN-BREACH",`,
    rag_bind_ts: `"SKILL-YOUR-CREDIT": ["margin-stopout", "copy-trading", "macro-event-risk", "escalation-spine"],`,
  },
  {
    id: "TPL-SKILL-LP",
    kind: "lp_hedge",
    title_en: "LP / hedge / A-book skill",
    title_zh: "LP／對沖／A-book 技能",
    blurb_en: "Reject storms, hedge coverage, A-book ratio — System confirms before LP disable.",
    blurb_zh: "拒絕風暴、對沖覆蓋、A-book 比率 — 停用 LP 前需系統確認。",
    files: ["risk-scenarios-extra.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_LP: SkillScenario = {
  code: "SKILL-YOUR-LP",
  name: "YOUR LP reject / hedge coverage event",
  description: "Liquidity path stress: rejects up, coverage down, or A-book collapsing toward B-book.",
  indicator: {
    monitor_id: "M2-LP-022",
    name: "LP Reject Rate (oneZero)",
    product: "CFD",
    domain: "LP_HEDGE",
    warn: 2,
    breach: 5,
    unit: "%",
    comparator: "gte",
    why: "Reject storms force B-book gap risk; disable LP only with System confirmation unless CRITICAL.",
  },
  related_indicators: ["M2-HEDGE-007", "M2-ABOOK-008", "M2-BRIDGE-LAT", "M2-FEED-003"],
  conditions: { severity_in: ["BREACH", "CRITICAL"] },
  fault_areas: ["LP endpoint unhealthy", "Bridge latency", "Equinix / network"],
  escalation: {
    sla_minutes: 10,
    route_code: "ESC-LP-REJECT",
    path: [
      { after_minutes: 0, team: "Trading Infra", channel: "oc_trading_infra", action: "Bridge/LP health" },
      { after_minutes: 10, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "Trading impact" },
    ],
  },
  corrections: [
    { action: "check_bridge_health", bu: "SYSTEM", description: "oneZero / bridge checklist" },
    { action: "disable_lp_endpoint", bu: "SYSTEM", description: "Disable unhealthy LP", requires_human: true },
    { action: "increase_abook", bu: "RISK_CONTROL", description: "Queue A-book increase", requires_human: true },
  ],
  past_cases: [],
  owner_department: "SYSTEM",
  owner_role: "Trading Infra / Risk Owner",
  when_to_use: ["LP reject BREACH", "Hedge coverage < warn with rejects"],
  when_not_to_use: ["Single-ticket slippage (use TR)", "Disable LP without System unless CRITICAL"],
  prechecks: ["Bridge latency", "Which LP endpoint", "Symbol scope"],
  evidence_to_collect: ["Reject % by LP", "Coverage ratio", "Bridge p95"],
  stop_conditions: ["Rejects back under warn 10m after failover"],
  success_criteria: ["System owner named", "Any LP disable has dual control"],
  steps: [
    { action: "page_infra", description: "Page Trading Infra P1", bu: "SYSTEM" },
    { action: "isolate_lp", description: "Identify unhealthy endpoint", bu: "SYSTEM" },
    { action: "human_disable", description: "Human-gated LP disable / widen", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-YOUR-LP": "ESC-LP-REJECT",`,
    rag_bind_ts: `"SKILL-YOUR-LP": ["lp-hedge", "cfd-broker-rm", "escalation-spine"],`,
  },
  {
    id: "TPL-SKILL-CRYPTO",
    kind: "crypto",
    title_en: "Crypto exchange skill (wallet / liq / oracle)",
    title_zh: "加密交易所技能（錢包／強平／預言機）",
    blurb_en: "Hot float, liquidation backlog, oracle lag, OI — pause WD / high-lev perps only via human gate.",
    blurb_zh: "熱浮額、強平積壓、預言機延遲、OI — 暫停出金／高槓桿永續僅能人工關卡。",
    files: ["risk-scenarios-extra.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_CRYPTO: SkillScenario = {
  code: "SKILL-YOUR-CRYPTO",
  name: "YOUR crypto custody / liquidation / oracle event",
  description: "Exchange-stack stress distinct from CFD — wallets, mark oracle, liq engine, insurance, OI.",
  indicator: {
    monitor_id: "M2-CRYPTO-WALLET",
    name: "Hot Wallet Float Ratio",
    product: "Crypto",
    domain: "CRYPTO_EXCHANGE",
    warn: 15,
    breach: 25,
    unit: "%",
    comparator: "gte",
    why: "Elevated hot float increases theft severity; pause large WD only with human gate.",
  },
  related_indicators: ["M2-CRYPTO-LIQ", "M2-CRYPTO-ORACLE", "M2-CRYPTO-INS", "M2-CRYPTO-OI", "M2-WD-015"],
  conditions: { severity_in: ["BREACH", "CRITICAL"] },
  fault_areas: ["Cold sweep delayed", "Deposit spike before sweep", "Oracle lag liquidating wrong side"],
  escalation: {
    sla_minutes: 10,
    route_code: "ESC-WALLET-FLOAT",
    path: [
      { after_minutes: 0, team: "Crypto Risk", channel: "oc_crypto_exchange_risk", action: "War-room" },
      { after_minutes: 10, team: "System Admin", channel: "oc_trading_infra", action: "Wallet infra" },
    ],
  },
  corrections: [
    { action: "cold_sweep", bu: "SYSTEM", description: "Sweep hot → cold toward ≤12%", requires_human: true },
    { action: "pause_large_wd", bu: "RISK_CONTROL", description: "Pause large withdrawals", requires_human: true },
    { action: "pause_high_lev_perps", bu: "RISK_CONTROL", description: "Pause new high-leverage perps", requires_human: true },
  ],
  past_cases: [],
  owner_department: "RISK_CONTROL",
  owner_role: "Crypto Exchange Risk",
  when_to_use: ["Hot float / liq backlog / oracle lag BREACH"],
  when_not_to_use: ["CFD crypto CFD product (different domain)", "Auto-ADL from chat"],
  prechecks: ["Mark vs index vs last", "WD queue vs deposit spike", "Insurance DD"],
  evidence_to_collect: ["Float %", "Liq backlog", "Oracle lag", "Top OI account"],
  stop_conditions: ["Float < warn after sweep and WD calm"],
  success_criteria: ["Human gate on WD/perp pause", "No AI service role pause-WD"],
  steps: [
    { action: "notify_crypto", description: "Notify Crypto Risk + System", bu: "RISK_CONTROL" },
    { action: "confirm_oracle", description: "Confirm mark/oracle health", bu: "SYSTEM" },
    { action: "human_pause", description: "Human-gated WD / perp pause", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-YOUR-CRYPTO": "ESC-WALLET-FLOAT",`,
    rag_bind_ts: `"SKILL-YOUR-CRYPTO": ["crypto-wallet", "crypto-exchange-rm", "crypto-liquidation"],`,
  },
  {
    id: "TPL-SKILL-PRICING",
    kind: "pricing_feed",
    title_en: "Pricing / feed / slippage skill",
    title_zh: "報價／饋送／滑點技能",
    blurb_en: "Stale quotes, slippage, spread — fix feed before blaming toxic clients.",
    blurb_zh: "過期報價、滑點、點差 — 先修饋送再歸咎有毒客戶。",
    files: ["risk-scenarios-extra.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_PRICING: SkillScenario = {
  code: "SKILL-YOUR-PRICING",
  name: "YOUR stale feed / slippage / spread event",
  description: "Pricing path stress that can look like toxic flow if the quote is sick.",
  indicator: {
    monitor_id: "M2-FEED-003",
    name: "Stale Quote Symbols",
    product: "CFD",
    domain: "MARKET_PRICING",
    warn: 3,
    breach: 10,
    unit: "count",
    comparator: "gte",
    why: "Stale/crossed quotes enable latency arb; fix feed before punitive client actions.",
  },
  related_indicators: ["M2-SLIP-021", "M2-LP-022", "M2-SPREAD-005", "M2-BRIDGE-LAT"],
  conditions: { severity_in: ["WARN", "BREACH", "CRITICAL"] },
  fault_areas: ["Manager API vs LP divergence", "Bridge lag", "Session markup bug"],
  escalation: {
    sla_minutes: 10,
    route_code: "ESC-FEED-STALE",
    path: [
      { after_minutes: 0, team: "Trading Infra", channel: "oc_trading_infra", action: "Feed health" },
      { after_minutes: 10, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "Trading impact" },
    ],
  },
  corrections: [
    { action: "validate_feed", bu: "SYSTEM", description: "Compare Manager API vs LP" },
    { action: "symbol_close_only", bu: "RISK_CONTROL", description: "Close-only if toxic after feed OK", requires_human: true },
    { action: "pre_widen", bu: "RISK_CONTROL", description: "Pre-widen into news", requires_human: true },
  ],
  past_cases: [],
  owner_department: "SYSTEM",
  owner_role: "Trading Infra / Pricing",
  when_to_use: ["Stale symbols WARN+", "Slippage BREACH with healthy LP"],
  when_not_to_use: ["Pure news spread blowout", "Treat EA speed alone as fraud"],
  prechecks: ["Calendar ±60m", "LP rejects co-fire?", "Which symbols"],
  evidence_to_collect: ["Stale count", "Slip pips", "Spread vs median"],
  stop_conditions: ["Stale count < warn 10m"],
  success_criteria: ["Feed owner named", "No CS goodwill pip quotes"],
  steps: [
    { action: "page_infra", description: "Page Trading Infra", bu: "SYSTEM" },
    { action: "diff_feeds", description: "Diff Manager vs LP", bu: "SYSTEM" },
    { action: "human_widen", description: "Human-gated close-only / widen", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-YOUR-PRICING": "ESC-FEED-STALE",`,
    rag_bind_ts: `"SKILL-YOUR-PRICING": ["stale-quotes-slippage", "lp-hedge", "macro-event-risk"],`,
  },
  {
    id: "TPL-SKILL-FRAUD",
    kind: "fraud",
    title_en: "Fraud / bonus / wash skill",
    title_zh: "詐欺／贈金／對倒技能",
    blurb_en: "Multi-account, bonus burn, wash — Ops Lead for bans; freeze payout first.",
    blurb_zh: "多帳戶、贈金燃燒、對倒 — 封禁交營運主管；先凍結出金。",
    files: ["risk-scenarios-extra.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_FRAUD: SkillScenario = {
  code: "SKILL-YOUR-FRAUD",
  name: "YOUR multi-account / bonus / wash cluster",
  description: "Conduct risk: KYC/device cluster farming bonus or washing thin books.",
  indicator: {
    monitor_id: "M2-FRAUD-011",
    name: "Multi-account Cluster Score",
    product: "CFD+Crypto",
    domain: "FRAUD_CONDUCT",
    warn: 0.7,
    breach: 0.85,
    unit: "score",
    comparator: "gte",
    why: "Cluster abuse burns bonus and can harvest B-book; do not auto-ban.",
  },
  related_indicators: ["M2-BONUS-013", "M2-WASH-020", "M2-PAY-017", "M2-IB-PAYOUT"],
  conditions: { severity_in: ["WARN", "BREACH"] },
  fault_areas: ["Referral rings", "Cent scaling", "Copy + own accounts both sides"],
  escalation: {
    sla_minutes: 30,
    route_code: "ESC-MARGIN-BREACH",
    path: [
      { after_minutes: 0, team: "Ops Lead", channel: "oc_ops_funding", action: "Freeze payouts" },
      { after_minutes: 30, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "If book P&L hit" },
    ],
  },
  corrections: [
    { action: "freeze_bonus", bu: "OPERATIONS", description: "Freeze bonus conversion", requires_human: true },
    { action: "link_kyc_graph", bu: "OPERATIONS", description: "Link CRM KYC cluster" },
    { action: "ban_review", bu: "OPERATIONS", description: "Ban only with Ops Lead", requires_human: true },
  ],
  past_cases: [],
  owner_department: "OPERATIONS",
  owner_role: "Ops Lead",
  when_to_use: ["Cluster score WARN+", "Bonus BREACH inside cluster"],
  when_not_to_use: ["Auto-ban", "CS verbal 'it's me' without ID_VERIFY"],
  prechecks: ["UID graph", "Payment rail separate?", "Book P&L impact?"],
  evidence_to_collect: ["Cluster score", "Bonus USD", "Device/email overlap"],
  stop_conditions: ["Score < warn after freeze and no new UIDs"],
  success_criteria: ["Payout freeze logged", "No AI-only ban"],
  steps: [
    { action: "freeze", description: "Freeze bonus / payouts", requires_human: true, bu: "OPERATIONS" },
    { action: "graph", description: "Build KYC/device graph", bu: "OPERATIONS" },
    { action: "escalate_risk", description: "Escalate to Risk if book impact", bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-YOUR-FRAUD": "ESC-MARGIN-BREACH",`,
    rag_bind_ts: `"SKILL-YOUR-FRAUD": ["promos-abuse", "wash-collusion", "accounts-pricing"],`,
  },
  {
    id: "TPL-SKILL-ADMIN",
    kind: "admin_model",
    title_en: "Admin / model / detector skill",
    title_zh: "後台／模型／偵測器技能",
    blurb_en: "Detector drift, false calm, RAG propose — AI recommends; Risk Owner checkers.",
    blurb_zh: "偵測漂移、假平靜、RAG 提案 — AI 建議；風險負責人 Checker。",
    files: ["risk-scenarios-extra.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_ADMIN: SkillScenario = {
  code: "SKILL-YOUR-ADMIN",
  name: "YOUR detector drift / false-calm / RAG event",
  description: "Control-plane AI quality issue — do not trust quiet RCA when infra monitors breach.",
  indicator: {
    monitor_id: "M2-MODEL-006",
    name: "Detector Precision (7d rolling)",
    product: "CFD+Crypto",
    domain: "MODEL_AI",
    warn: 0.7,
    breach: 0.55,
    unit: "score",
    comparator: "lte",
    why: "Falling precision or false calm vs live LP/feed BREACH needs human review.",
  },
  related_indicators: ["M2-LP-022", "M2-FEED-003", "M2-VENDOR-OUT"],
  conditions: { severity_in: ["WARN", "BREACH"] },
  fault_areas: ["Label drift", "Shadow detectors muted", "RAG leaf poison"],
  escalation: {
    sla_minutes: 60,
    route_code: "ESC-MODEL-DRIFT",
    path: [
      { after_minutes: 0, team: "AI Engineer", channel: "oc_ai_quality", action: "Maker review" },
      { after_minutes: 60, team: "Risk Owner", channel: "oc_risk_control_desk", action: "Checker" },
    ],
  },
  corrections: [
    { action: "shadow_disable", bu: "AI", description: "Shadow-disable noisy detector" },
    { action: "propose_threshold", bu: "AI", description: "Propose threshold via AI Admin (maker)" },
    { action: "force_human_review", bu: "RISK_CONTROL", description: "Force SKILL-GENERIC-HUMAN-REVIEW", requires_human: true },
  ],
  past_cases: [],
  owner_department: "AI",
  owner_role: "AI Engineer (maker) / Risk Owner (checker)",
  when_to_use: ["Precision BREACH", "False calm with infra BREACH"],
  when_not_to_use: ["AI direct RAG write", "AI as sole live-promotion checker"],
  prechecks: ["Compare live infra monitors", "Pending propose_rag", "Challenger status"],
  evidence_to_collect: ["Precision 7d", "Disagreement pack", "RAG leaf diff"],
  stop_conditions: ["Precision recovers and infra quiet"],
  success_criteria: ["Maker ≠ checker", "No AI settings.manage"],
  steps: [
    { action: "banner", description: "Banner monitors degraded if infra BREACH", bu: "AI" },
    { action: "shadow", description: "Shadow noisy detectors", bu: "AI" },
    { action: "checker", description: "Risk Owner checker on promotions", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-YOUR-ADMIN": "ESC-MODEL-DRIFT",`,
    rag_bind_ts: `"SKILL-YOUR-ADMIN": ["crmp-admin-purpose", "ai-human-escalate", "crmp-built-surface"],`,
  },
  {
    id: "TPL-SKILL-OPS",
    kind: "ops_funding",
    title_en: "Ops / funding / recon skill",
    title_zh: "營運／資金／對帳技能",
    blurb_en: "Funding exceptions, recon breaks, segregation — Ops owns evidence; Risk watches trading impact.",
    blurb_zh: "資金例外、對帳破口、隔離 — 營運持證據；風險監看交易影響。",
    files: ["risk-scenarios-extra.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_OPS: SkillScenario = {
  code: "SKILL-YOUR-OPS",
  name: "YOUR funding / recon / segregation event",
  description: "Ops-process stress that can precede withdrawal delays or segregation gaps.",
  indicator: {
    monitor_id: "M2-RECON-BRK",
    name: "Reconciliation Breaks (open)",
    product: "CFD+Crypto",
    domain: "OPS_PROCESS",
    warn: 5,
    breach: 15,
    unit: "count",
    comparator: "gte",
    why: "Open breaks cluster before segregation or WD pain; AI pause-WD must not be sole response.",
  },
  related_indicators: ["M2-SEG-025", "M2-FUND-010", "M2-WD-015", "M2-CAP-024"],
  conditions: { severity_in: ["WARN", "BREACH"] },
  fault_areas: ["PSP outage", "Bank letter lag", "Chain deposit mismatch"],
  escalation: {
    sla_minutes: 30,
    route_code: "ESC-FUNDING",
    path: [
      { after_minutes: 0, team: "Ops Lead", channel: "oc_ops_funding", action: "Clear breaks" },
      { after_minutes: 30, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "If SEG/WD co-fire" },
    ],
  },
  corrections: [
    { action: "age_breaks", bu: "OPERATIONS", description: "Age/currency each break" },
    { action: "bank_evidence", bu: "OPERATIONS", description: "Collect bank/chain evidence" },
    { action: "pause_large_wd", bu: "RISK_CONTROL", description: "Human-gated pause if run risk", requires_human: true },
  ],
  past_cases: [],
  owner_department: "OPERATIONS",
  owner_role: "Ops Lead",
  when_to_use: ["Recon WARN+", "Segregation WARN with funding exceptions"],
  when_not_to_use: ["AI-only response to segregation BREACH"],
  prechecks: ["Vendor status", "Entity", "WD queue"],
  evidence_to_collect: ["Break list", "Segregation USD", "PSP status"],
  stop_conditions: ["Opens < warn and SEG quiet"],
  success_criteria: ["Ops evidence on spine", "Risk consulted if WD pause"],
  steps: [
    { action: "triage", description: "Triage breaks by age/currency", bu: "OPERATIONS" },
    { action: "evidence", description: "Bank/chain letters", bu: "OPERATIONS" },
    { action: "risk_gate", description: "Human WD pause if needed", requires_human: true, bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-YOUR-OPS": "ESC-FUNDING",`,
    rag_bind_ts: `"SKILL-YOUR-OPS": ["client-money-capital", "escalation-spine", "crmp-org-raci"],`,
  },
  {
    id: "TPL-SKILL-CS",
    kind: "cs_intake",
    title_en: "CS 24/7 intake skill (Plus only)",
    title_zh: "CS 24/7 進件技能（僅 Plus）",
    blurb_en: "Clarify / ID verify / FAQ — stamps skill_code; no trading controls. Not for frozen classic Admin.",
    blurb_zh: "澄清／核身／FAQ — 蓋 skill_code；不做交易控制。不適用凍結原版 Admin。",
    files: ["platform/src/lib/ai/risk-scenarios-cs.ts", "skill-zh.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_CS: SkillScenario = {
  code: "SKILL-CS-YOUR",
  name: "YOUR CS intake playbook",
  description: "24/7 client door skill — C1 / form / official email. Does not arm trading controls.",
  indicator: {
    monitor_id: "M2-CS-UNCLEAR",
    name: "CS unclear / waiting queue",
    product: "CFD+Crypto",
    domain: "CS_SERVICE",
    warn: 20,
    breach: 50,
    unit: "count",
    comparator: "gte",
    why: "Staffing/queue hook — not a substitute for C1 intake quality.",
  },
  related_indicators: ["M2-CS-ID", "M2-CS-FAQ", "M2-CS-ESC"],
  conditions: { severity_in: ["WARN", "BREACH"] },
  fault_areas: ["Thin intake text", "Missing UID", "Client not replying to EMAIL_OUT"],
  escalation: {
    sla_minutes: 60,
    route_code: "ESC-CS-24-7", // or ESC-CS-KYC / ESC-CS-RISK
    path: [
      { after_minutes: 0, team: "CS L1", channel: "oc_cs_c1", action: "Own ticket" },
      { after_minutes: 60, team: "CS Lead", channel: "oc_cs_c1", action: "Cap-3 follow-up" },
    ],
  },
  corrections: [
    { action: "ask_clarify", bu: "CUSTOMER_SERVICE", description: "EMAIL_OUT clarify (cap 3)" },
    { action: "request_id_pack", bu: "CUSTOMER_SERVICE", description: "ID pack if account mutation" },
    { action: "escalate_risk", bu: "RISK_CONTROL", description: "Only if book-risk", requires_human: true },
  ],
  past_cases: [],
  owner_department: "CUSTOMER_SERVICE",
  owner_role: "CS L1 / CS Lead",
  when_to_use: ["Unclear intake", "FAQ with RAG answer", "ID verify before WD/password"],
  when_not_to_use: ["Quote goodwill pips", "Arm halt/leverage", "Classic Admin (no CS/TR)"],
  prechecks: ["Channel connector", "request_id continuity", "Sensitive category?"],
  evidence_to_collect: ["Intake text", "EMAIL_OUT/IN", "skill_code stamp"],
  stop_conditions: ["AWAITING_CLIENT with cap reached → CS Lead"],
  success_criteria: ["skill_code on ticket", "No trading control from CS"],
  steps: [
    { action: "stamp", description: "Stamp skill_code on request", bu: "CUSTOMER_SERVICE" },
    { action: "reply", description: "Official EMAIL_OUT / C1 reply", bu: "CUSTOMER_SERVICE" },
    { action: "hand_off", description: "TR or Risk if needed", bu: "CUSTOMER_SERVICE" },
  ],
};
`,
    route_ts: `"SKILL-CS-YOUR": "ESC-CS-24-7",`,
    rag_bind_ts: `"SKILL-CS-YOUR": ["cs-24-7-intake", "cs-skill-playbooks", "your-cs-policy-leaf"],`,
  },
  {
    id: "TPL-SKILL-TR",
    kind: "tr_execution",
    title_en: "TR dealing / execution skill (Plus only)",
    title_zh: "TR 成交／執行技能（僅 Plus）",
    blurb_en: "Fills, slippage, MT4/MT5 tape — TR owns; CS must not quote goodwill pips.",
    blurb_zh: "成交、滑點、MT4/MT5 成交帶 — TR 負責；CS 不得報善意 pips。",
    files: ["risk-scenarios-cs.ts", "skill-escalation-map.ts", "skill-rag-map.ts"],
    body_ts: `import type { SkillScenario } from "@/lib/ai/scenario-types";

export const SKILL_YOUR_TR: SkillScenario = {
  code: "SKILL-TR-YOUR",
  name: "YOUR TR execution / slippage complaint",
  description: "Execution desk skill — collect ticket/symbol/time/button vs fill; no book halt from TR.",
  indicator: {
    monitor_id: "M2-TR-EXEC",
    name: "TR execution queue depth",
    product: "CFD",
    domain: "TRADING_EXEC",
    warn: 15,
    breach: 40,
    unit: "count",
    comparator: "gte",
    why: "Queue hook for dealing support staffing — single-ticket variance is tape review.",
  },
  related_indicators: ["M2-SLIP-021", "M2-LP-022", "M2-FEED-003", "M2-BRIDGE-LAT"],
  conditions: { severity_in: ["WARN", "BREACH"] },
  fault_areas: ["LP reject storm", "Stale feed", "Single-ticket variance"],
  escalation: {
    sla_minutes: 30,
    route_code: "ESC-TR-DEAL",
    path: [
      { after_minutes: 0, team: "TR Desk", channel: "oc_tr_dealing", action: "Tape review" },
      { after_minutes: 30, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "If book-wide" },
    ],
  },
  corrections: [
    { action: "collect_tape", bu: "TRADING", description: "MT4/MT5 ticket, UTC, button vs fill" },
    { action: "correlate_monitors", bu: "TRADING", description: "Slip / LP / feed / bridge" },
    { action: "escalate_risk", bu: "RISK_CONTROL", description: "Book-wide storm → Risk", requires_human: true },
  ],
  past_cases: [],
  owner_department: "TRADING",
  owner_role: "TR Dealing Support",
  when_to_use: ["Fill/slippage/MT complaint", "ASSIGNED_TR status"],
  when_not_to_use: ["CS FAQ close with pip goodwill", "TR halting symbols"],
  prechecks: ["Ticket id", "Symbol", "UTC time", "Claimed slip"],
  evidence_to_collect: ["Tape", "M2-SLIP-021 window", "LP rejects"],
  stop_conditions: ["Single ticket closed with TR note", "Escalated to Risk"],
  success_criteria: ["ASSIGNED_TR stamp", "No halt from TR"],
  steps: [
    { action: "assign", description: "Stamp ASSIGNED_TR", bu: "TRADING" },
    { action: "tape", description: "Review button vs fill", bu: "TRADING" },
    { action: "escalate", description: "SKILL-CS-ESCALATE-RISK if book-wide", bu: "RISK_CONTROL" },
  ],
};
`,
    route_ts: `"SKILL-TR-YOUR": "ESC-TR-DEAL",`,
    rag_bind_ts: `"SKILL-TR-YOUR": ["tr-dealing-handoff", "lp-hedge", "stale-quotes-slippage"],`,
  },
  {
    id: "TPL-CHAIN",
    kind: "linked_chain",
    title_en: "Linked multi-indicator chain",
    title_zh: "多指標連結鏈",
    blurb_en: "Timeline of co-firing monitors — shows on Knowledge Tree Chains trunk and Risk scenarios Correlation.",
    blurb_zh: "共鳴監控時序 — 出現在知識樹 Chains 主幹與風險情境相關型態。",
    files: ["risk-scenarios-extra.ts (LINKED)", "skill-zh.ts CHAIN_ZH"],
    body_ts: `import type { LinkedScenario } from "@/lib/ai/scenario-types";

export const CHAIN_YOUR: LinkedScenario = {
  code: "CHAIN-YOUR-NAME",
  name: "YOUR multi-indicator timeline name",
  description: "What the co-fire means for the desk (one incident, many monitors).",
  product: "CFD",
  domain: "CREDIT_CLIENT",
  severity: "BREACH",
  sequence: [
    { t_minutes: 0, monitor_id: "M2-COPY-009", severity: "WARN", signal: "Top provider concentration rising" },
    { t_minutes: 5, monitor_id: "M2-MRG-014", severity: "BREACH", signal: "Population util crosses breach" },
    { t_minutes: 12, monitor_id: "M2-STOP-018", severity: "BREACH", signal: "Stop-out velocity follows" },
    { t_minutes: 20, monitor_id: "M2-EQ-001", severity: "WARN", signal: "Equity drawdown reacts" },
  ],
  causes: ["Copy contagion", "News window", "Feed lag amplifying stops"],
  escalation_plan: [
    { after_minutes: 0, team: "Credit Desk", channel: "oc_credit_client_risk", action: "Activate primary skill" },
    { after_minutes: 15, team: "Risk Control Desk", channel: "oc_risk_control_desk", action: "War-room if equity WARN" },
  ],
  corrections: [
    { action: "run_primary_skill", bu: "RISK_CONTROL", description: "Enter SKILL-YOUR-CREDIT playbook" },
    { action: "human_contain", bu: "RISK_CONTROL", description: "Human-gated leverage / close-only", requires_human: true },
  ],
  linked_skills: ["SKILL-YOUR-CREDIT", "SKILL-COPY-CONCENTRATION"],
  past_cases: [],
};
`,
    zh_ts: `"CHAIN-YOUR-NAME": {
  name: "你的多指標時序名稱",
  description: "共鳴對台面的意義（單一事件、多監控）。",
},`,
  },
];

export function skillTemplatesByKind() {
  const map = new Map<SkillTemplateKind, SkillTemplate[]>();
  for (const t of SKILL_TEMPLATES) {
    const list = map.get(t.kind) || [];
    list.push(t);
    map.set(t.kind, list);
  }
  return map;
}
