import { LINKED_SCENARIOS, SKILL_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import { escalationRouteForSkill } from "@/lib/ai/skill-escalation-map";
import { CHAIN_ZH, SKILL_ZH } from "@/lib/ai/skill-zh";
import type { LinkedScenario, SkillScenario } from "@/lib/ai/scenario-types";
import { getIndicatorMeta } from "@/lib/monitor-indicator-meta";

export type RiskScenarioBucket = "admin_system" | "pricing" | "risk_ops" | "cs_tr";
export type RiskScenarioKind = "skill" | "chain" | "doc_extra";
export type RiskScenarioEdition = "plus" | "classic";
export type DocPriority = "P0" | "P1" | "P2" | "P3";

export type RiskScenarioDocRow = {
  id: string;
  kind: RiskScenarioKind;
  /** CRMP Plus includes CS/TR; classic matches frozen original admin scope. */
  editions: RiskScenarioEdition[];
  bucket: RiskScenarioBucket;
  domain: string;
  product: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  indicators: string[];
  dimensions: string;
  dimensions_zh: string;
  warn: string;
  breach: string;
  frequency_en: string;
  frequency_zh: string;
  severity: DocPriority;
  escalation_en: string;
  escalation_zh: string;
  investigation_en: string[];
  investigation_zh: string[];
  solution_en: string[];
  solution_zh: string[];
  skill_href?: string;
};

type DocExtra = {
  id: string;
  bucket: RiskScenarioBucket;
  domain: string;
  product: string;
  editions: RiskScenarioEdition[];
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  indicators: string[];
  dimensions: string;
  dimensions_zh: string;
  warn: string;
  breach: string;
  frequency_en: string;
  frequency_zh: string;
  severity: DocPriority;
  escalation_en: string;
  escalation_zh: string;
  investigation_en: string[];
  investigation_zh: string[];
  solution_en: string[];
  solution_zh: string[];
};

/** Expanded admin / pricing / ops scenarios beyond seeded SKILL.md playbooks. */
const DOC_EXTRA_SCENARIOS: DocExtra[] = [
  {
    id: "DOC-ADMIN-AI-CHALLENGER",
    bucket: "admin_system",
    domain: "MODEL_AI",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "Dual-AI challenger disagreement on high-severity RCA",
    name_zh: "高嚴重度 RCA 雙 AI 挑戰者意見分歧",
    description_en:
      "Primary RCA and second-AI challenger disagree on root cause or recommended control for a BREACH/CRITICAL ticket — operator must not auto-execute either side.",
    description_zh:
      "第一線 RCA 與第二 AI 挑戰者對根因或建議控制意見不一致；操作員不得自動執行任一方。",
    indicators: ["M2-MODEL-006", "ticket.severity", "challenger.disagreement"],
    dimensions: "on/off flag + model precision %",
    dimensions_zh: "開關旗標＋模型精準度％",
    warn: "Disagreement on BREACH",
    breach: "Disagreement on CRITICAL / custody / halt",
    frequency_en: "On each high-severity analysis",
    frequency_zh: "每次高嚴重度分析時",
    severity: "P1",
    escalation_en: "ESC-MODEL-DRIFT → AI Engineer (maker) → Risk Owner (checker) → oc_ai_quality",
    escalation_zh: "ESC-MODEL-DRIFT → AI 工程（Maker）→ 風險負責人（Checker）→ oc_ai_quality",
    investigation_en: [
      "Open both RCA and challenger cards side-by-side",
      "Diff evidence packs (Monitor ticks, LP rejects, calendar)",
      "Confirm neither side can arm halt/leverage/wallet controls",
    ],
    investigation_zh: ["並排開啟 RCA 與挑戰者卡片", "比對證據包（Monitor、LP 拒絕、日曆）", "確認雙方皆無法武裝停牌／槓桿／錢包控制"],
    solution_en: [
      "Human selects winning narrative or writes a third",
      "Queue human-gated control only after Risk Owner checker",
      "Log disagreement in spine + audit; feed training label",
    ],
    solution_zh: ["人工選定勝出敘事或撰寫第三版", "僅在風險負責人 Checker 後排隊人工關卡控制", "分歧寫入脊柱與稽核，回饋訓練標籤"],
  },
  {
    id: "DOC-ADMIN-SETTINGS-DRIFT",
    bucket: "admin_system",
    domain: "TECH_INFRA",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "Platform settings / kill-switch drift without dual control",
    name_zh: "平台設定／緊急開關在無雙人覆核下漂移",
    description_en:
      "Grouped platform_settings or kill-switch flags change outside maker/checker — risk of silent leverage pack, alert mute, or CS auto-reply cap changes.",
    description_zh: "分組平台設定或緊急開關在 Maker／Checker 外被改動，可能靜默改變槓桿包、警報靜音或客服自動回覆上限。",
    indicators: ["platform_settings.version", "audit.SETTINGS_UPDATE", "M2-KILL-COUNT"],
    dimensions: "on/off flags + version hash",
    dimensions_zh: "開關旗標＋版本雜湊",
    warn: "1 unapproved settings write / 24h",
    breach: "≥3 unapproved or any kill-switch without RISK_OWNER",
    frequency_en: "On every settings write + hourly reconcile",
    frequency_zh: "每次設定寫入＋每小時對帳",
    severity: "P0",
    escalation_en: "ESC-DEFAULT → System Admin → Risk Owner → oc_exec_risk_bridge",
    escalation_zh: "ESC-DEFAULT → 系統管理員 → 風險負責人 → oc_exec_risk_bridge",
    investigation_en: [
      "Diff platform_settings before/after in audit",
      "List actors and roles on SETTINGS_UPDATE",
      "Confirm AI service role is blocked from settings.manage",
    ],
    investigation_zh: ["比對稽核中的設定前後值", "列出 SETTINGS_UPDATE 的操作者與角色", "確認 AI 服務角色被封鎖 settings.manage"],
    solution_en: [
      "Roll back to last approved version",
      "Revoke elevated session if break-glass abused",
      "Require RISK_OWNER checker for kill-switch and leverage packs",
    ],
    solution_zh: ["回滾至上一核准版本", "若濫用破窗則撤銷高權限工作階段", "緊急開關與槓桿包需 RISK_OWNER Checker"],
  },
  {
    id: "DOC-ADMIN-AUDIT-GAP",
    bucket: "admin_system",
    domain: "TECH_INFRA",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "Spine / audit gap on intervention or messenger action",
    name_zh: "干預或 Messenger 動作出現脊柱／稽核缺口",
    description_en:
      "Human Intervention approve/reject or messenger Ack/Escalate completes without matching spine stage or audit_logs row — breaks the control plane trail.",
    description_zh: "人工干預核准／駁回或 Messenger Ack／升級完成，但缺少對應脊柱階段或稽核列，破壞控制面軌跡。",
    indicators: ["spine.stage_gap", "audit.missing_after_action"],
    dimensions: "count of orphan actions",
    dimensions_zh: "孤立動作筆數",
    warn: "1 orphan action / 1h",
    breach: "≥3 orphan or any EXECUTED without audit",
    frequency_en: "Every 1 min reconcile",
    frequency_zh: "每 1 分鐘對帳",
    severity: "P1",
    escalation_en: "System on-call → Risk Owner → AI (logging fix)",
    escalation_zh: "系統值班 → 風險負責人 → AI（日誌修復）",
    investigation_en: [
      "Replay last messenger card actions vs spine tickets",
      "Check writeAudit failures in server logs",
      "Verify SQLite vs static snapshot limitation on Pages",
    ],
    investigation_zh: ["重放最近 Messenger 動作與脊柱票", "檢查 writeAudit 失敗日誌", "確認 Pages 靜態快照與 SQLite 限制"],
    solution_en: [
      "Backfill audit from messenger event log",
      "Block further approvals until trail is healthy",
      "File RM-14 SLO if gap rate stays elevated",
    ],
    solution_zh: ["自 Messenger 事件日誌回填稽核", "軌跡恢復前封鎖後續核准", "缺口率持續偏高則開 RM-14 SLO"],
  },
  {
    id: "DOC-ADMIN-MONITOR-SYNC",
    bucket: "admin_system",
    domain: "TECH_INFRA",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "Monitor 2.0 ingest / data-source stale sync",
    name_zh: "Monitor 2.0 進件／資料來源同步過期",
    description_en:
      "Data Sources marked LIVE stop ticking or Monitor sync fails — detectors keep last values and risk a false calm.",
    description_zh: "標記為 LIVE 的資料來源停止跳動或 Monitor 同步失敗，偵測器沿用舊值造成假平靜。",
    indicators: ["data_sources.last_success_age", "M2-VENDOR-OUT", "M2-MODEL-006"],
    dimensions: "latency (minutes since last success) + vendor count",
    dimensions_zh: "延遲（距上次成功分鐘）＋供應商數",
    warn: "Source age ≥5 min",
    breach: "Source age ≥15 min or ≥2 critical vendors down",
    frequency_en: "Every 1 min",
    frequency_zh: "每 1 分鐘",
    severity: "P1",
    escalation_en: "ESC-FEED-STALE → Trading Infra → Risk → oc_trading_infra",
    escalation_zh: "ESC-FEED-STALE → 交易基建 → 風險 → oc_trading_infra",
    investigation_en: [
      "Open Data Sources registry last_success timestamps",
      "Compare Monitor Run-all last run vs wall clock",
      "Check whether GitHub Pages snapshot is expected to be static",
    ],
    investigation_zh: ["開啟資料來源登錄之 last_success", "比對 Monitor Run-all 與牆鐘", "確認 Pages 快照是否預期為靜態"],
    solution_en: [
      "Failover source or pause dependent detectors with banner",
      "Page vendor; do not treat quiet book as healthy",
      "Track RM-02 Monitor write-back for production",
    ],
    solution_zh: ["切換備援來源或暫停相依偵測器並掛橫幅", "呼叫供應商；勿把安靜帳簿當健康", "正式環境追蹤 RM-02 Monitor 回寫"],
  },
  {
    id: "DOC-ADMIN-RBAC-BREAKGLASS",
    bucket: "admin_system",
    domain: "TECH_INFRA",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "Privilege / break-glass misuse on human-only surfaces",
    name_zh: "人工專屬頁面的權限／破窗濫用",
    description_en:
      "SUPER_ADMIN or AI service principal attempts writes on AI-blocked pages (RAG write, halt, settings) or self-approves maker/checker.",
    description_zh: "超級管理員或 AI 服務主體嘗試寫入 AI 封鎖頁（RAG 寫入、停牌、設定），或 Maker／Checker 自核。",
    indicators: ["ai_access.block_hit", "audit.FORBIDDEN_WRITE", "maker_checker.self_approve"],
    dimensions: "on/off deny events + count / 24h",
    dimensions_zh: "拒絕事件開關＋每 24 小時筆數",
    warn: "≥3 block hits / 24h",
    breach: "Any successful bypass or self-approve on high-impact control",
    frequency_en: "Realtime on write path",
    frequency_zh: "寫入路徑即時",
    severity: "P0",
    escalation_en: "System Admin + Risk Owner + platform owner → oc_exec_risk_bridge",
    escalation_zh: "系統管理員＋風險負責人＋平台負責人 → oc_exec_risk_bridge",
    investigation_en: [
      "Read AI Access Security catalogue hits",
      "Confirm actor role vs permission matrix",
      "Check whether session was shared across maker and checker",
    ],
    investigation_zh: ["讀取 AI 存取安全目錄命中", "核對角色與權限矩陣", "確認 Maker／Checker 是否共用工作階段"],
    solution_en: [
      "Invalidate sessions; rotate demo passwords if leaked",
      "Keep AI on propose_rag only",
      "Enforce different personas for maker vs checker in UAT",
    ],
    solution_zh: ["使工作階段失效；若外洩則輪替示範密碼", "AI 僅能 propose_rag", "UAT 強制 Maker／Checker 不同角色"],
  },
  {
    id: "DOC-ADMIN-LARK-WEBHOOK",
    bucket: "admin_system",
    domain: "TECH_INFRA",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "Lark / messenger webhook delivery failure",
    name_zh: "Lark／Messenger webhook 投遞失敗",
    description_en:
      "Alert cards fail to reach the on-call channel — desk sees Demo Messenger only; SLA clocks still tick.",
    description_zh: "警報卡片無法到達值班頻道，台面僅見示範 Messenger，但 SLA 時鐘仍在走。",
    indicators: ["lark.delivery_fail_rate", "escalation.sla_breach_without_ack"],
    dimensions: "failure rate % + count / 15m",
    dimensions_zh: "失敗率％＋每 15 分鐘筆數",
    warn: "Fail rate ≥10% / 15m",
    breach: "Fail rate ≥50% or P0 card undelivered >5m",
    frequency_en: "Every 1 min",
    frequency_zh: "每 1 分鐘",
    severity: "P1",
    escalation_en: "ESC-DEFAULT → System → Risk Owner phone bridge (RM-01 live cards)",
    escalation_zh: "ESC-DEFAULT → 系統 → 風險負責人電話橋（RM-01 正式卡片）",
    investigation_en: [
      "Check Lark Integration registry mock vs live webhook",
      "Confirm Demo Messenger still has the card",
      "Page System; use voice bridge if CRITICAL",
    ],
    investigation_zh: ["檢查 Lark 整合登錄 mock 與正式 webhook", "確認示範 Messenger 仍有卡片", "CRITICAL 時呼叫系統並用語音橋"],
    solution_en: [
      "Failover to secondary channel",
      "Ack from Demo Messenger to stop duplicate pages",
      "Track RM-01 production Lark cards",
    ],
    solution_zh: ["切換備援頻道", "自示範 Messenger Ack 以避免重複呼叫", "追蹤 RM-01 正式 Lark 卡片"],
  },
  {
    id: "DOC-PRICING-MARKUP-BUG",
    bucket: "pricing",
    domain: "PRODUCT_CONFIG",
    product: "CFD",
    editions: ["plus", "classic"],
    name_en: "Spread markup / symbol session misconfiguration",
    name_zh: "點差加價／商品時段設定錯誤",
    description_en:
      "Trading-group spread markup or session calendar wrong after a product change — clients see toxic fills while house VaR looks calm.",
    description_zh: "商品變更後交易組點差加價或時段日曆錯誤，客戶成交有毒但公司 VaR 看似平靜。",
    indicators: ["M2-SPREAD-005", "M2-SLIP-021", "M2-SWAP-027", "M2-COMPLAINT"],
    dimensions: "spread multiple vs median + slippage pips + complaint count",
    dimensions_zh: "點差相對中位數倍數＋滑點 pips＋投訴數",
    warn: "Spread ≥2× median with slippage ≥2 pips",
    breach: "Spread ≥3.5× or clustered complaints ≥20 / 1h",
    frequency_en: "Every 1 min",
    frequency_zh: "每 1 分鐘",
    severity: "P1",
    escalation_en: "ESC-FEED-STALE → Pricing + Risk → TR if fill disputes",
    escalation_zh: "ESC-FEED-STALE → 報價＋風險 → 成交爭議交 TR",
    investigation_en: [
      "Diff group markup vs change ticket",
      "Correlate M2-SPREAD-005 with M2-SLIP-021 and LP rejects",
      "Check session calendar vs economic calendar",
    ],
    investigation_zh: ["比對組別加價與變更單", "關聯點差、滑點與 LP 拒絕", "核對時段日曆與經濟日曆"],
    solution_en: [
      "Revert markup; pre-widen intentionally if news",
      "Close-only on affected symbols if toxic (human gate)",
      "TR owns single-ticket goodwill — not CS FAQ auto-close",
    ],
    solution_zh: ["回滾加價；若為新聞則有意預先拉闊", "有毒時對商品 close-only（人工關卡）", "單票善意補償屬 TR，非 CS FAQ 自動結案"],
  },
  {
    id: "DOC-PRICING-ENTITY-PACK",
    bucket: "pricing",
    domain: "REG_CAPITAL",
    product: "CFD",
    editions: ["plus", "classic"],
    name_en: "Wrong-entity leverage / product pack applied",
    name_zh: "套用錯誤實體槓桿／商品包",
    description_en:
      "Offshore 1:500 pack applied to FCA/ASIC retail book (or reverse) after onboarding or mass group move.",
    description_zh: "開戶或大量組別遷移後，將離岸 1:500 包套到 FCA／ASIC 零售帳簿（或相反）。",
    indicators: ["M2-LEV-019", "entity.pack_mismatch", "M2-CAP-024"],
    dimensions: "on/off mismatch flag + new max-leverage account count",
    dimensions_zh: "錯配開關旗標＋新開最大槓桿帳戶數",
    warn: "≥10 mismatched packs / 24h",
    breach: "Any FCA/ASIC retail > entity cap or mass move ≥100",
    frequency_en: "Hourly + on group change",
    frequency_zh: "每小時＋組別變更時",
    severity: "P0",
    escalation_en: "ESC-MARGIN-BREACH → Risk Owner + Compliance → oc_exec_risk_bridge",
    escalation_zh: "ESC-MARGIN-BREACH → 風險負責人＋合規 → oc_exec_risk_bridge",
    investigation_en: [
      "Sample affected logins for entity + classification",
      "Freeze further group moves",
      "Quantify open risk under wrong pack",
    ],
    investigation_zh: ["抽樣受影響登入之實體與分類", "凍結後續組別遷移", "量化錯誤包下的未平倉風險"],
    solution_en: [
      "Move accounts to correct entity pack (human gate)",
      "Disable AI suggestions that raise leverage without entity check",
      "Log as skip-risk if Ack'd without entity confirmation",
    ],
    solution_zh: ["將帳戶移回正確實體包（人工關卡）", "禁止未查實體的 AI 升槓桿建議", "未確認實體即 Ack 記為跳過風險"],
  },
  {
    id: "DOC-OPS-EOD-RECON",
    bucket: "risk_ops",
    domain: "OPS_PROCESS",
    product: "CFD+Crypto",
    editions: ["plus", "classic"],
    name_en: "EOD funding recon break cluster",
    name_zh: "日終資金對帳破口叢集",
    description_en:
      "Multiple ledger vs bank/chain breaks open at EOD — may precede segregation gap or withdrawal delays.",
    description_zh: "日終多筆帳簿與銀行／鏈上破口同時開啟，可能領先客戶資金隔離缺口或出金延遲。",
    indicators: ["M2-RECON-BRK", "M2-SEG-025", "M2-FUND-010", "M2-WD-015"],
    dimensions: "open break count + USD gap",
    dimensions_zh: "未平破口筆數＋美元缺口",
    warn: "≥5 open breaks",
    breach: "≥15 opens or segregation warn concurrently",
    frequency_en: "Every 15 min + EOD job",
    frequency_zh: "每 15 分鐘＋日終作業",
    severity: "P1",
    escalation_en: "ESC-FUNDING → Ops Lead → Risk → Finance",
    escalation_zh: "ESC-FUNDING → 營運主管 → 風險 → 財務",
    investigation_en: [
      "Age and currency of each break",
      "Correlate with payment vendor outage",
      "Pause large withdrawals only via human gate if run risk",
    ],
    investigation_zh: ["各破口帳齡與幣別", "關聯支付供應商中斷", "若有擠兌風險僅能經人工關卡暫停大額出金"],
    solution_en: [
      "Ops clears breaks with bank evidence",
      "Risk watches M2-SEG-025 — AI must not be sole response",
      "Client comms via Ops, not Risk Lark spam",
    ],
    solution_zh: ["營運以銀行證據清算破口", "風險監看 M2-SEG-025 — AI 不得作為唯一回應", "客戶溝通由營運負責，勿洗版風險 Lark"],
  },
];

function bucketForDomain(domain: string): RiskScenarioBucket {
  if (domain === "CS_SERVICE" || domain === "TRADING_EXEC") return "cs_tr";
  if (domain === "TECH_INFRA" || domain === "MODEL_AI") return "admin_system";
  if (domain === "MARKET_PRICING" || domain === "PRODUCT_CONFIG") return "pricing";
  return "risk_ops";
}

function dimensionsFor(unit: string, comparator: string): { en: string; zh: string } {
  const u = (unit || "").toLowerCase();
  const cmp = comparator === "lte" ? "≤" : "≥";
  if (u.includes("%") || u.includes("ratio") || u.includes("score")) {
    return { en: `ratio/score (${cmp} threshold)`, zh: `比率／分數（${cmp} 門檻）` };
  }
  if (u.includes("usd") || u.includes("$")) {
    return { en: `monetary volume USD (${cmp})`, zh: `美元金額量（${cmp}）` };
  }
  if (u.includes("ms") || u.includes("sec") || u.includes("lag")) {
    return { en: `latency (${cmp})`, zh: `延遲（${cmp}）` };
  }
  if (u.includes("lot")) {
    return { en: `position volume lots (${cmp})`, zh: `部位量（手）（${cmp}）` };
  }
  if (u.includes("count") || u.includes("/5m") || u.includes("accounts") || /^[0-9]/.test(u) === false) {
    return { en: `count / volume (${cmp})`, zh: `筆數／量（${cmp}）` };
  }
  return { en: `measured value (${cmp} ${unit || "units"})`, zh: `量測值（${cmp} ${unit || "單位"}）` };
}

function severityForSkill(s: SkillScenario): DocPriority {
  const domain = s.indicator.domain;
  const sev = s.conditions.severity_in || [];
  if (domain === "REG_CAPITAL") return "P0";
  if (domain === "CRYPTO_EXCHANGE" && /WALLET|OI|INS|ORACLE/i.test(s.indicator.monitor_id)) return "P0";
  if (sev.includes("CRITICAL")) return "P0";
  if (domain === "CS_SERVICE" && s.code === "SKILL-CS-ESCALATE-RISK") return "P1";
  if (domain === "CS_SERVICE" || domain === "TRADING_EXEC") {
    if (s.code === "SKILL-CS-ACCOUNT-FAQ" || s.code === "SKILL-CS-CLARIFY") return "P3";
    return "P2";
  }
  if (domain === "MODEL_AI") return "P2";
  if (sev.includes("BREACH") || s.escalation.sla_minutes <= 15) return "P1";
  return "P2";
}

function severityForChain(c: LinkedScenario): DocPriority {
  if (c.severity === "CRITICAL") return "P0";
  if (c.domain === "REG_CAPITAL" || c.domain === "CRYPTO_EXCHANGE") return c.severity === "BREACH" ? "P0" : "P1";
  if (c.domain === "CS_SERVICE" || c.domain === "TRADING_EXEC") return "P2";
  if (c.severity === "BREACH") return "P1";
  return "P2";
}

function formatEscalation(s: SkillScenario): { en: string; zh: string } {
  const route = s.escalation.route_code || escalationRouteForSkill(s.code, { domain: s.indicator.domain });
  const hops = s.escalation.path
    .map((h) => `T+${h.after_minutes}m ${h.team}/${h.channel}: ${h.action}`)
    .join(" → ");
  const en = `${route} (SLA ${s.escalation.sla_minutes}m): ${hops || "desk default"}`;
  const zh = `${route}（SLA ${s.escalation.sla_minutes} 分）：${hops || "台面預設"}`;
  return { en, zh };
}

function skillRow(s: SkillScenario): RiskScenarioDocRow {
  const zh = SKILL_ZH[s.code];
  const dim = dimensionsFor(s.indicator.unit, s.indicator.comparator);
  const meta = getIndicatorMeta(s.indicator.monitor_id);
  const sev = severityForSkill(s);
  const esc = formatEscalation(s);
  const bucket = bucketForDomain(s.indicator.domain);
  const editions: RiskScenarioEdition[] = bucket === "cs_tr" ? ["plus"] : ["plus", "classic"];
  const related = s.related_indicators.filter(Boolean);
  const indicators = [s.indicator.monitor_id, ...related];
  const invEn =
    (s.prechecks?.length ? s.prechecks : []).concat(s.steps.map((st) => st.description)).slice(0, 8) ||
    [s.indicator.why];
  const invZh =
    (zh?.prechecks?.length ? zh.prechecks : zh?.steps?.length ? zh.steps : invEn).slice(0, 8);
  const solEn = s.corrections.map((c) => `${c.action} (${c.bu}): ${c.description}`).slice(0, 6);
  const solZh = (zh?.corrections?.length ? zh.corrections : solEn).slice(0, 6);

  return {
    id: s.code,
    kind: "skill",
    editions,
    bucket,
    domain: s.indicator.domain,
    product: s.indicator.product,
    name_en: s.name,
    name_zh: zh?.name || s.name,
    description_en: s.description,
    description_zh: zh?.description || s.description,
    indicators,
    dimensions: `${dim.en}; primary=${s.indicator.name}`,
    dimensions_zh: `${dim.zh}；主指標=${zh?.indicator_name || s.indicator.name}`,
    warn: `${s.indicator.comparator === "lte" ? "≤" : "≥"} ${s.indicator.warn} ${s.indicator.unit}`,
    breach: `${s.indicator.comparator === "lte" ? "≤" : "≥"} ${s.indicator.breach} ${s.indicator.unit}`,
    frequency_en: meta.frequency,
    frequency_zh: meta.frequency_zh,
    severity: sev,
    escalation_en: esc.en,
    escalation_zh: esc.zh,
    investigation_en: invEn,
    investigation_zh: invZh,
    solution_en: solEn.length ? solEn : s.steps.filter((x) => x.requires_human).map((x) => x.description),
    solution_zh: solZh.length ? solZh : solEn,
    skill_href: `/admin/skills/${s.code}`,
  };
}

function chainRow(c: LinkedScenario): RiskScenarioDocRow {
  const zh = CHAIN_ZH[c.code];
  const bucket = bucketForDomain(c.domain);
  const editions: RiskScenarioEdition[] = bucket === "cs_tr" ? ["plus"] : ["plus", "classic"];
  const indicators = [...new Set(c.sequence.map((e) => e.monitor_id))];
  const primary = indicators[0] || "MULTI";
  const meta = getIndicatorMeta(primary);
  const hops = c.escalation_plan
    .map((h) => `T+${h.after_minutes}m ${h.team}/${h.channel}: ${h.action}`)
    .join(" → ");
  const invEn = c.sequence.map(
    (e) => `T+${e.t_minutes}m ${e.monitor_id} ${e.severity}: ${e.signal}`
  );
  const solEn = c.corrections.map((x) => `${x.action} (${x.bu}): ${x.description}`);

  return {
    id: c.code,
    kind: "chain",
    editions,
    bucket,
    domain: c.domain,
    product: c.product,
    name_en: c.name,
    name_zh: zh?.name || c.name,
    description_en: c.description,
    description_zh: zh?.description || c.description,
    indicators,
    dimensions: "multi-indicator correlation (sequence / co-fire)",
    dimensions_zh: "多指標相關（時序／共鳴）",
    warn: c.severity === "WARN" ? "Chain WARN path active" : "See first WARN in timeline",
    breach: c.severity === "WARN" ? "n/a (WARN chain)" : `${c.severity} chain armed`,
    frequency_en: meta.frequency,
    frequency_zh: meta.frequency_zh,
    severity: severityForChain(c),
    escalation_en: hops || `Linked skills: ${c.linked_skills.join(", ")}`,
    escalation_zh: hops || `連結技能：${c.linked_skills.join(", ")}`,
    investigation_en: invEn.concat(c.causes.map((x) => `Cause: ${x}`)).slice(0, 10),
    investigation_zh: invEn.concat(c.causes.map((x) => `原因：${x}`)).slice(0, 10),
    solution_en: solEn.slice(0, 6),
    solution_zh: solEn.slice(0, 6),
    skill_href: c.linked_skills[0] ? `/admin/skills/${c.linked_skills[0]}` : "/admin/skills",
  };
}

function extraRow(e: DocExtra): RiskScenarioDocRow {
  return {
    id: e.id,
    kind: "doc_extra",
    editions: e.editions,
    bucket: e.bucket,
    domain: e.domain,
    product: e.product,
    name_en: e.name_en,
    name_zh: e.name_zh,
    description_en: e.description_en,
    description_zh: e.description_zh,
    indicators: e.indicators,
    dimensions: e.dimensions,
    dimensions_zh: e.dimensions_zh,
    warn: e.warn,
    breach: e.breach,
    frequency_en: e.frequency_en,
    frequency_zh: e.frequency_zh,
    severity: e.severity,
    escalation_en: e.escalation_en,
    escalation_zh: e.escalation_zh,
    investigation_en: e.investigation_en,
    investigation_zh: e.investigation_zh,
    solution_en: e.solution_en,
    solution_zh: e.solution_zh,
  };
}

let _cache: RiskScenarioDocRow[] | null = null;

export function allRiskScenarioRows(): RiskScenarioDocRow[] {
  if (_cache) return _cache;
  _cache = [
    ...SKILL_SCENARIOS.map(skillRow),
    ...LINKED_SCENARIOS.map(chainRow),
    ...DOC_EXTRA_SCENARIOS.map(extraRow),
  ];
  return _cache;
}

export function riskScenarioRowsForEdition(edition: RiskScenarioEdition): RiskScenarioDocRow[] {
  return allRiskScenarioRows().filter((r) => r.editions.includes(edition));
}

export function riskScenarioSummary(edition: RiskScenarioEdition = "plus") {
  const rows = riskScenarioRowsForEdition(edition);
  const byBucket = { admin_system: 0, pricing: 0, risk_ops: 0, cs_tr: 0 };
  const bySev = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const byKind = { skill: 0, chain: 0, doc_extra: 0 };
  for (const r of rows) {
    byBucket[r.bucket]++;
    bySev[r.severity]++;
    byKind[r.kind]++;
  }
  return { total: rows.length, byBucket, bySev, byKind };
}
