/** Open issues + progress tracker — source for /admin/docs/open-issues and /admin/docs/progress. */

export type IssueStatus =
  | "planned"
  | "started"
  | "wip"
  | "delayed"
  | "uat"
  | "go_live"
  | "bau";

export type IssueBu =
  | "AI"
  | "System"
  | "Risk Owner"
  | "Pricing"
  | "Ops"
  | "Monitor"
  | "Product"
  | "GRC"
  | "CS"
  | "TR"
  | "All";

export type IssueArea =
  | "AI"
  | "System"
  | "RO"
  | "Pricing"
  | "Ops"
  | "Monitor"
  | "Product"
  | "Platform"
  | "GRC"
  | "CS"
  | "TR";

export type IssueChecklistItem = {
  en: string;
  zh: string;
  done?: boolean;
};

export type IssueCopy = {
  title: string;
  detail: string;
  dependencies: string;
  /** Tentative ETA label, e.g. "2026-Q4" or "TBD — design" */
  eta: string;
};

export type OpenIssue = {
  id: string;
  area: IssueArea;
  bu: IssueBu;
  status: IssueStatus;
  /** Months from 2026-10 (index 0) toward end-2027 for progress board X/Y */
  startMonth: number;
  endMonth: number;
  priority: "P0" | "P1" | "P2" | "P3";
  en: IssueCopy;
  zh: IssueCopy;
  /** Detailed checklist lines shown on the interactive board */
  checklist: IssueChecklistItem[];
};

/** Timeline axis: Oct 2026 → Dec 2027 inclusive = 15 months (indices 0..14). */
export const PROGRESS_TIMELINE = {
  startLabel: "2026-10",
  endLabel: "2027-12",
  monthCount: 15,
  months: [
    "2026-10",
    "2026-11",
    "2026-12",
    "2027-01",
    "2027-02",
    "2027-03",
    "2027-04",
    "2027-05",
    "2027-06",
    "2027-07",
    "2027-08",
    "2027-09",
    "2027-10",
    "2027-11",
    "2027-12",
  ],
} as const;

export const ISSUE_STATUS_LABEL: Record<IssueStatus, { en: string; "zh-Hant": string }> = {
  planned: { en: "Planned", "zh-Hant": "已規劃" },
  started: { en: "Started", "zh-Hant": "已啟動" },
  wip: { en: "WIP", "zh-Hant": "進行中" },
  delayed: { en: "Delayed", "zh-Hant": "延期" },
  uat: { en: "UAT", "zh-Hant": "UAT" },
  go_live: { en: "Go live", "zh-Hant": "上線" },
  bau: { en: "BAU", "zh-Hant": "日常營運" },
};

/**
 * Tentative open issues. Assumptions (explicit):
 * - Monitor 2.0 is still adding indicators; CRMP is in initial design.
 * - Tech details and resource planning remain open.
 */
export const OPEN_ISSUES: OpenIssue[] = [
  {
    id: "OI-01",
    area: "Monitor",
    bu: "Monitor",
    status: "wip",
    startMonth: 0,
    endMonth: 8,
    priority: "P0",
    en: {
      title: "Monitor 2.0 indicator expansion",
      detail:
        "Upstream Monitor 2.0 continues to add CFD/crypto indicators. CRMP syncs; it does not own the registry. M2-* tooltip/deep-link contract is shipped; new indicators still arrive from Monitor.",
      dependencies: "Monitor 2.0 product roadmap; indicator naming convention; sync API contract",
      eta: "2027-Q2 (ongoing ingest)",
    },
    zh: {
      title: "Monitor 2.0 指標擴充",
      detail:
        "上游 Monitor 2.0 仍持續新增 CFD／加密指標。CRMP 僅同步，不擁有登錄表。M2-* 提示／深連結已交付；新指標仍由 Monitor 側進來。",
      dependencies: "Monitor 2.0 產品路線；指標命名慣例；同步 API 契約",
      eta: "2027-Q2（持續接入）",
    },
    checklist: [
      { en: "Publish additive M2-* naming + category map as Monitor adds indicators", zh: "隨 Monitor 加指標發布可加性的 M2-* 命名與類別對照" },
      { en: "Keep tooltip / deep-link contract stable for new codes on Monitor 2.0 + Realtime Alert", zh: "新代碼在 Monitor 2.0＋即時警報與追蹤的提示／深連結契約保持穩定" },
      { en: "Sync / run_detectors tolerate unknown additive fields without CRMP schema fork", zh: "同步／run_detectors 容忍未知加性欄位，不造成 CRMP schema 分叉" },
      { en: "Risk Domains P0–P3 scenarios map to new primary indicators", zh: "風險領域 P0–P3 情境對應新的主指標" },
      { en: "UAT pack updated when each Monitor indicator wave lands", zh: "每波 Monitor 指標落地時更新 UAT 包" },
    ],
  },
  {
    id: "OI-02",
    area: "Product",
    bu: "Product",
    status: "started",
    startMonth: 0,
    endMonth: 5,
    priority: "P0",
    en: {
      title: "CRMP control-plane — initial design freeze",
      detail:
        "CRMP production scope is still in initial design: spine stages, BU RACI, dual-control write path, BAU vs pilot surfaces. Prototype admin proves the desk; design freeze and RACI sign-off remain open.",
      dependencies: "Risk Owner + Platform Owner workshops; Ecosystem Eval phases A–B",
      eta: "2027-Q1 design freeze (tentative)",
    },
    zh: {
      title: "CRMP 控制面 — 初始設計凍結",
      detail:
        "CRMP 生產範圍仍處初始設計：脊柱階段、BU RACI、雙重控制寫路徑、日常／試點畫面。原型後台已證明台面；設計凍結與 RACI 簽核仍開放。",
      dependencies: "風險負責人＋平台負責人工作坊；生態評估 A–B 階段",
      eta: "2027-Q1 設計凍結（暫定）",
    },
    checklist: [
      { en: "Workshop: spine stages vs home ticket counts vs audit planes", zh: "工作坊：脊柱階段 vs 首頁計數 vs 稽核平面" },
      { en: "Draft BU RACI (AI / System / RO / Pricing / Ops / Monitor / GRC)", zh: "起草 BU RACI（AI／System／RO／Pricing／Ops／Monitor／GRC）" },
      { en: "Define dual-control write path (maker → checker → control bus)", zh: "定義雙重控制寫路徑（Maker→Checker→控制匯流排）" },
      { en: "Classify surfaces: BAU desk vs pilot-only vs human-only blocklist", zh: "畫面分級：日常台面／僅試點／僅限人類黑名單" },
      { en: "Design freeze signed by Risk Owner + Platform Owner", zh: "風險負責人＋平台負責人簽核設計凍結" },
    ],
  },
  {
    id: "OI-03",
    area: "System",
    bu: "System",
    status: "planned",
    startMonth: 1,
    endMonth: 6,
    priority: "P0",
    en: {
      title: "Tech architecture & resource plan",
      detail:
        "Production tech details (Postgres/HA, IdP, secrets, APM) and FTE/budget resource planning are still open. Ecosystem Eval has bands only — Finance and Eng Lead must re-estimate against SOWs.",
      dependencies: "OI-02 design freeze; infra capacity; Finance SOW",
      eta: "2027-Q1 planning pack",
    },
    zh: {
      title: "技術架構與資源規劃",
      detail:
        "生產技術細節（Postgres／HA、IdP、密鑰、APM）與 FTE／預算資源規劃仍開放。生態評估僅有區間 — 財務與工程負責人須依 SOW 重估。",
      dependencies: "OI-02 設計凍結；基礎設施容量；財務 SOW",
      eta: "2027-Q1 規劃包",
    },
    checklist: [
      { en: "Target architecture: Postgres + HA, secrets vault, env isolation", zh: "目標架構：Postgres＋HA、密鑰庫、環境隔離" },
      { en: "IdP / SCIM integration sketch (feeds OI-06)", zh: "IdP／SCIM 整合草圖（餵給 OI-06）" },
      { en: "APM + spine SLO sketch (latency, false-alarm, AI cost)", zh: "APM＋脊柱 SLO 草圖（延遲、誤報、AI 成本）" },
      { en: "FTE plan vs Ecosystem 7–11 steady-state band", zh: "FTE 計畫對照生態評估 7–11 穩態人力帶" },
      { en: "Budget re-estimate vs A–C $730k–$1.3M and Phase D run-rate", zh: "預算重估對照 A–C $730k–$1.3M 與階段 D 年費" },
      { en: "SOW package for Finance / vendor review", zh: "供財務／供應商審查的 SOW 包" },
    ],
  },
  {
    id: "OI-04",
    area: "AI",
    bu: "AI",
    status: "wip",
    startMonth: 0,
    endMonth: 7,
    priority: "P1",
    en: {
      title: "Production LLM RCA + independent challenger",
      detail:
        "Prototype uses heuristic skill/RAG + second-line challenger. Need vendor-separated LLM primary RCA, eval harness, cost/latency SLOs; keep RAG AI-write blocklist (propose_rag only).",
      dependencies: "Prompt vault; spend caps; RM-03/RM-04; RAG dual-control path",
      eta: "2027-Q3 UAT · go-live TBD",
    },
    zh: {
      title: "生產 LLM 根因＋獨立挑戰者",
      detail:
        "原型使用啟發式技能／RAG＋二線挑戰。需供應商分離的 LLM 主 RCA、評測架、成本／延遲 SLO；維持 RAG AI 寫入封鎖（僅 propose_rag）。",
      dependencies: "提示詞金庫；支出上限；RM-03／RM-04；RAG 雙重控制路徑",
      eta: "2027-Q3 UAT · 上線待定",
    },
    checklist: [
      { en: "Select primary LLM vendor + separate challenger vendor/prompt path", zh: "選定主 LLM 供應商＋獨立挑戰供應商／提示路徑" },
      { en: "Eval harness for BREACH/CRITICAL RCA quality gates", zh: "BREACH／CRITICAL RCA 品質閘道評測架" },
      { en: "Cost & latency SLOs with alerts (RM-14)", zh: "成本與延遲 SLO＋告警（RM-14）" },
      { en: "Preserve propose_rag human-gate / AI write blocklist", zh: "維持 propose_rag 人工閘道／AI 寫入黑名單" },
      { en: "Wire first/second-line AI Admin cards to production models", zh: "將一線／二線 AI 管理卡片接到生產模型" },
      { en: "Shadow mode acceptance before any write-path coupling", zh: "任何寫路徑耦合前完成影子模式接受" },
    ],
  },
  {
    id: "OI-05",
    area: "AI",
    bu: "AI",
    status: "started",
    startMonth: 0,
    endMonth: 4,
    priority: "P1",
    en: {
      title: "Knowledge tree + RAG corpus governance",
      detail:
        "Knowledge tree maps RAG documents as leaves with deep links. Open: corpus ownership SLAs, retire cadence, skill↔doc binds at scale, maker-checker throughput for propose_rag.",
      dependencies: "rag.manage staffing; skill catalog growth; Monitor tags",
      eta: "2027-Q1 BAU hygiene",
    },
    zh: {
      title: "知識樹＋RAG 語料治理",
      detail:
        "知識樹已將 RAG 文件對映為葉節點並可深連結。開放：語料擁有 SLA、退役節奏、規模化技能↔文件綁定、propose_rag Maker-Checker 吞吐。",
      dependencies: "rag.manage 人力；技能目錄成長；Monitor 標籤",
      eta: "2027-Q1 日常衛生",
    },
    checklist: [
      { en: "Name corpus owners per domain (CFD / crypto / ops)", zh: "按領域（CFD／加密／營運）指定語料負責人" },
      { en: "Retire / refresh cadence for stale RAG leaves", zh: "過期 RAG 葉的退役／刷新節奏" },
      { en: "Skill↔doc bind coverage targets as catalog grows", zh: "技能目錄成長時的技能↔文件綁定覆蓋目標" },
      { en: "Maker-checker SLA for propose_rag queue depth", zh: "propose_rag 佇列深度的 Maker-Checker SLA" },
      { en: "Tag corpus rows to Monitor M2-* where applicable", zh: "適用處將語料列標到 Monitor M2-*" },
    ],
  },
  {
    id: "OI-06",
    area: "System",
    bu: "System",
    status: "planned",
    startMonth: 2,
    endMonth: 8,
    priority: "P0",
    en: {
      title: "SSO / IdP + SCIM (replace demo personas)",
      detail:
        "Kill shared demo passwords. Corporate SSO + SCIM into users/roles; preserve maker≠checker SoD for AI Admin and interventions (actioner email already on samples).",
      dependencies: "Okta/Entra approval; OI-03 resource plan",
      eta: "2027-Q2 go live (tentative)",
    },
    zh: {
      title: "SSO／IdP＋SCIM（取代示範角色）",
      detail:
        "淘汰共用示範密碼。企業 SSO＋SCIM 進入使用者／角色；保留 AI 管理與干預的 Maker≠Checker 職責分離（樣本已顯示操作者信箱）。",
      dependencies: "Okta／Entra 核准；OI-03 資源規劃",
      eta: "2027-Q2 上線（暫定）",
    },
    checklist: [
      { en: "Choose IdP (Okta / Entra) and SCIM group → role map", zh: "選定 IdP（Okta／Entra）與 SCIM 群組→角色對照" },
      { en: "Remove shared demo passwords from staging/prod", zh: "從 staging／prod 移除共用示範密碼" },
      { en: "Enforce maker ≠ checker in IAM for AI Admin + interventions", zh: "在 IAM 強制 AI 管理＋干預的 Maker≠Checker" },
      { en: "Map BU and Teams to directory groups", zh: "將 BU 與團隊對映目錄群組" },
      { en: "UAT login personas against corporate IdP", zh: "以企業 IdP 驗收登入角色" },
    ],
  },
  {
    id: "OI-07",
    area: "Ops",
    bu: "Ops",
    status: "planned",
    startMonth: 3,
    endMonth: 10,
    priority: "P0",
    en: {
      title: "Real control adapters (halt / leverage / pause-copy)",
      detail:
        "Messenger recommended actions today create admin_ref + intervention samples. Production needs dry-run then checker against trading/LP bus, with global kill-switch. Gate on shadow false-alarm acceptance.",
      dependencies: "Trading control bus; OI-04 shadow quality; Escalation ESC-DEFAULT + skill binds",
      eta: "2027-Q4 go live (gated)",
    },
    zh: {
      title: "真實控制適配（停市／槓桿／暫停跟單）",
      detail:
        "Messenger 建議動作目前產生 admin_ref＋干預樣本。生產需 dry-run 再對交易／LP 匯流排做 Checker，並具全域緊急開關。影子誤報率未接受前不可啟用。",
      dependencies: "交易控制匯流排；OI-04 影子品質；升級 ESC-DEFAULT＋技能綁定",
      eta: "2027-Q4 上線（閘控）",
    },
    checklist: [
      { en: "Inventory controls: halt, leverage cut, widen, pause-copy, block account", zh: "盤點控制：停市、槓桿、擴點、暫停跟單、封鎖帳戶" },
      { en: "Dry-run adapter against staging control bus", zh: "對 staging 控制匯流排做 dry-run 適配" },
      { en: "Checker path for irreversible controls (SoD)", zh: "不可逆控制的 Checker 路徑（職責分離）" },
      { en: "Global + per-adapter kill-switches (ties OI-17)", zh: "全域＋逐適配緊急開關（銜接 OI-17）" },
      { en: "Runbooks for Ops liaison; shadow false-alarm gate from RO", zh: "營運窗口操作手冊；風險負責人影子誤報閘門" },
    ],
  },
  {
    id: "OI-08",
    area: "Ops",
    bu: "Ops",
    status: "planned",
    startMonth: 1,
    endMonth: 6,
    priority: "P1",
    en: {
      title: "Production Lark interactive cards",
      detail:
        "Replace Demo Messenger as the primary on-call surface. Card actions (Ack / Escalate / Approve) must call CRMP APIs; keep in-app messenger for UAT and fallback.",
      dependencies: "Lark app approval; bot vault credentials; escalation routes",
      eta: "2027-Q2 UAT",
    },
    zh: {
      title: "生產 Lark 互動卡片",
      detail:
        "以生產 Lark 取代示範 Messenger 作為值班主介面。卡片動作（確認／升級／核准）須呼叫 CRMP API；保留應用內 Messenger 供 UAT 與備援。",
      dependencies: "Lark 應用核准；機器人密鑰庫；升級路徑",
      eta: "2027-Q2 UAT",
    },
    checklist: [
      { en: "Lark app / bot approved; secrets in vault", zh: "Lark 應用／機器人核准；密鑰入庫" },
      { en: "Card actions: Ack / Escalate / Approve → CRMP APIs", zh: "卡片動作：確認／升級／核准 → CRMP API" },
      { en: "Route cards by ESC-DEFAULT + dimension coefficients", zh: "依 ESC-DEFAULT＋維度係數路由卡片" },
      { en: "Keep Demo Messenger for UAT / fallback", zh: "保留 Demo Messenger 供 UAT／備援" },
      { en: "Decide Lark vs Teams as corporate messenger (leadership)", zh: "高階決策：企業即時通訊選 Lark 或 Teams" },
    ],
  },
  {
    id: "OI-09",
    area: "RO",
    bu: "Risk Owner",
    status: "started",
    startMonth: 0,
    endMonth: 3,
    priority: "P1",
    en: {
      title: "Risk Owner UAT exit + policy thresholds",
      detail:
        "Interactive UAT pack (45+ cases) exists. Open: formal RO sign-off cadence, second-AI severity policy, acceptance of ESC-DEFAULT + coefficient skill binds.",
      dependencies: "UAT pack execution; BU and Teams RACI; AI Admin line1/line2 settings",
      eta: "2026-Q4 / 2027-Q1",
    },
    zh: {
      title: "風險負責人 UAT 出口＋政策門檻",
      detail:
        "互動式 UAT 包（45+ 案例）已存在。開放：正式 RO 簽核節奏、第二 AI 嚴重度政策、接受 ESC-DEFAULT＋係數技能綁定。",
      dependencies: "執行 UAT 包；BU 與團隊 RACI；AI 管理一線／二線設定",
      eta: "2026-Q4／2027-Q1",
    },
    checklist: [
      { en: "Execute interactive UAT-01…45 with evidence notes", zh: "執行互動式 UAT-01…45 並留證據註記" },
      { en: "Sign UAT exit criteria (pass thresholds)", zh: "簽核 UAT 退出標準（通過門檻）" },
      { en: "Set second-AI severity policy (default BREACH)", zh: "設定第二 AI 嚴重度政策（預設 BREACH）" },
      { en: "Accept ESC-DEFAULT catch-all + dimension coefficients", zh: "接受 ESC-DEFAULT 兜底＋維度係數" },
      { en: "Rehearse escalation Primary → Secondary → RO → Exec", zh: "演練升級 Primary→Secondary→RO→Exec" },
    ],
  },
  {
    id: "OI-10",
    area: "Pricing",
    bu: "Pricing",
    status: "planned",
    startMonth: 4,
    endMonth: 11,
    priority: "P2",
    en: {
      title: "LP / pricing feed contracts for market intel + margin",
      detail:
        "Market Intelligence and margin scenarios need licensed news and LP pricing contracts. Prototype uses heuristic scans and seeded M2-* — not vendor SLA.",
      dependencies: "Vendor RFPs; Monitor indicator IDs; Data Sources registry",
      eta: "2027-Q3 (tentative)",
    },
    zh: {
      title: "LP／定價饋送契約（市場情報＋保證金）",
      detail:
        "市場情報與保證金情境需要授權新聞與 LP 定價契約。原型使用啟發式掃描與種子 M2-* — 非供應商 SLA。",
      dependencies: "供應商 RFP；Monitor 指標 ID；資料來源登錄",
      eta: "2027-Q3（暫定）",
    },
    checklist: [
      { en: "RFP licensed news / market-intel vendors", zh: "對授權新聞／市場情報供應商發 RFP" },
      { en: "LP pricing feed contract for margin / widen scenarios", zh: "保證金／擴點情境的 LP 定價饋送契約" },
      { en: "Register feeds in Data Sources with owner + cadence", zh: "在資料來源登錄饋送（負責人＋節奏）" },
      { en: "Bind feed health to Monitor M2-* where applicable", zh: "適用處將饋送健康綁到 Monitor M2-*" },
      { en: "Scoring / false-positive policy with RO + AI", zh: "與 RO＋AI 訂定評分／誤報政策" },
    ],
  },
  {
    id: "OI-11",
    area: "Platform",
    bu: "System",
    status: "wip",
    startMonth: 0,
    endMonth: 2,
    priority: "P2",
    en: {
      title: "Admin UX polish — mobile + docs parity",
      detail:
        "Shipped: nav drawer, messenger list→thread, mobile cards (Monitor 2.0 / Escalation / Data Sources / Risk Log / Audit / Users / Open Issues / Progress / Lark / Market Intel sources+scans / AI Admin / URL Catalog); Realtime Alert filters 2-col; confirm-sheet primary full-width on phone. Open: remaining dense boards (e.g. RAG gate) as BAU.",
      dependencies: "Docs owners; FE capacity; i18n catalog",
      eta: "2026-Q4 BAU",
    },
    zh: {
      title: "管理後台 UX 打磨 — 行動＋文件對齊",
      detail:
        "已交付：導覽抽屜、Messenger 列表→執行緒、多頁手機卡片（含 Lark／情報／AI 管理／網址目錄）；即時警報篩選手機兩欄；確認表主按鈕全寬。開放：其餘密表（如 RAG 閘道）作日常。",
      dependencies: "文件負責人；前端產能；i18n 目錄",
      eta: "2026-Q4 日常",
    },
    checklist: [
      {
        en: "Nav drawer + messenger list→thread + mobile cards (Monitor / Escalation / Data Sources / Risk Log / Audit / Users / Open Issues / Progress)",
        zh: "導覽抽屜＋Messenger 列表→執行緒＋手機卡片（Monitor／升級／資料來源／風險日誌／稽核／使用者／開放議題／進度）",
        done: true,
      },
      {
        en: "Realtime Alert & Tracker filter toolbar 2-col on phone",
        zh: "即時警報與追蹤篩選手機兩欄",
        done: true,
      },
      {
        en: "Mobile cards for Lark / Market Intel sources+scans / AI Admin / URL Catalog",
        zh: "Lark／市場情報來源＋掃描／AI 管理／網址目錄手機卡片",
        done: true,
      },
      {
        en: "Confirm-sheet primary buttons full-width on phone (action-row)",
        zh: "確認表主按鈕手機全寬（action-row）",
        done: true,
      },
      { en: "Docs parity BAU with each nav ship", zh: "每次選單交付後的文件對齊日常" },
    ],
  },
  {
    id: "OI-12",
    area: "GRC",
    bu: "GRC",
    status: "planned",
    startMonth: 5,
    endMonth: 12,
    priority: "P1",
    en: {
      title: "Evidence retention, redaction & audit export",
      detail:
        "Evidence vault and intervention samples may hold account identifiers. Need retention jobs, redaction, auditor-ready export — beyond Audit Log plane split + Roll back + home spine counts.",
      dependencies: "Legal policy; OI-06 identity; Postgres migration",
      eta: "2027-Q4",
    },
    zh: {
      title: "證據保存、遮罩與稽核匯出",
      detail:
        "證據庫與干預樣本可能含帳戶識別。需保存工作、遮罩、稽核就緒匯出 — 超越稽核平面分流＋回滾＋首頁脊柱計數。",
      dependencies: "法務政策；OI-06 身分；Postgres 遷移",
      eta: "2027-Q4",
    },
    checklist: [
      {
        en: "Prototype audit plane split (CRMP / Vantage Markets Admin) + Roll back",
        zh: "原型稽核平面分流（CRMP／Vantage Markets 管理）＋回滾",
        done: true,
      },
      { en: "Legal retention + redaction policy for evidence excerpts", zh: "證據摘錄的法遵保存＋遮罩政策" },
      { en: "Scheduled retention / purge jobs", zh: "排程保存／清除作業" },
      { en: "Auditor-ready export pack (beyond UI tabs)", zh: "稽核就緒匯出包（超越 UI 分頁）" },
      { en: "Data residency statement for multi-entity", zh: "多法人資料駐留聲明" },
    ],
  },
  {
    id: "OI-13",
    area: "Monitor",
    bu: "Monitor",
    status: "delayed",
    startMonth: 2,
    endMonth: 9,
    priority: "P1",
    en: {
      title: "Bidirectional Monitor ticket write-back",
      detail:
        "Ack/dismiss/close on Realtime Alert & Tracker must PATCH upstream Monitor tickets. Today: local SQLite only (sync_monitor2 audits pulled_alerts: 5 — no live HTTP). Delayed pending API contract + resource plan.",
      dependencies: "Monitor write API; OI-01 indicator stability; OI-03",
      eta: "2027-Q3 (slipped from 2027-Q1)",
    },
    zh: {
      title: "Monitor 工單雙向回寫",
      detail:
        "在即時警報與追蹤 Ack／排除／結案須 PATCH 上游 Monitor 工單。今日只改本機 SQLite（sync_monitor2 稽核 pulled_alerts: 5 — 無真實 HTTP）。因 API 契約與資源規劃延期。",
      dependencies: "Monitor 寫入 API；OI-01 指標穩定；OI-03",
      eta: "2027-Q3（自 2027-Q1 延後）",
    },
    checklist: [
      { en: "Inbound webhook: Monitor warn/breach → CRMP upsert + AI RCA", zh: "入站 webhook：Monitor 警告／違規 → CRMP upsert＋AI RCA" },
      { en: "Outbound PATCH: Ack / dismiss / close / assignee → Monitor ticket", zh: "出站 PATCH：Ack／排除／結案／承辦人 → Monitor 工單" },
      { en: "Contract tests against Monitor sandbox", zh: "對 Monitor 沙盒做契約測試" },
      { en: "Replace sync_monitor2 fake pulled_alerts: 5 with live pull/push", zh: "以真實拉／推取代 sync_monitor2 假 pulled_alerts: 5" },
      { en: "No auto-close BREACH/CRITICAL from AI alone without RO policy", zh: "無 RO 政策前禁止 AI 單獨自動關閉 BREACH／CRITICAL" },
    ],
  },
  {
    id: "OI-14",
    area: "AI",
    bu: "AI",
    status: "uat",
    startMonth: 0,
    endMonth: 1,
    priority: "P2",
    en: {
      title: "Prototype AI desk features — UAT window",
      detail:
        "Shipped for UAT: Realtime Alert & Tracker, Detectors→Monitor 2.0, line1/2 AI Admin, grouped pipeline, propose_rag, ESC-DEFAULT, RAG leaves, MonitorCode, editable Roles, audit plane split + Roll back. Formal UAT sign-off still open (OI-09).",
      dependencies: "UAT-01…45; Risk Owner calendar",
      eta: "2026-10 / 2026-11 UAT",
    },
    zh: {
      title: "原型 AI 台面功能 — UAT 窗口",
      detail:
        "已交付供 UAT：即時警報與追蹤、偵測器→Monitor 2.0、一線／二線 AI 管理、分組管線、propose_rag、ESC-DEFAULT、RAG 葉、MonitorCode、可編輯角色、稽核平面分流＋回滾。正式 UAT 簽核仍開放（OI-09）。",
      dependencies: "UAT-01…45；風險負責人行程",
      eta: "2026-10／2026-11 UAT",
    },
    checklist: [
      {
        en: "Realtime Alert & Tracker + Detectors merged into Monitor 2.0",
        zh: "即時警報與追蹤＋偵測器併入 Monitor 2.0",
        done: true,
      },
      {
        en: "First/second-line AI Admin · grouped pipeline · intervention actioner email",
        zh: "一線／二線 AI 管理·分組管線·干預操作者信箱",
        done: true,
      },
      {
        en: "propose_rag · ESC-DEFAULT + coefficients · RAG leaves · MonitorCode",
        zh: "propose_rag·ESC-DEFAULT＋係數·RAG 葉·MonitorCode",
        done: true,
      },
      {
        en: "Editable Roles + audit plane split + Roll back",
        zh: "可編輯角色＋稽核平面分流＋回滾",
        done: true,
      },
      { en: "Formal UAT sign-off (OI-09)", zh: "正式 UAT 簽核（OI-09）" },
    ],
  },
  {
    id: "OI-15",
    area: "Product",
    bu: "All",
    status: "bau",
    startMonth: 0,
    endMonth: 14,
    priority: "P3",
    en: {
      title: "Docs & URL catalog keep pace with admin",
      detail:
        "BAU: User Guide, PRD, TSD, UAT, Roadmap, Ecosystem, Open Issues, Progress, URLs track nav reality (Realtime Alert & Tracker; Detectors→Monitor 2.0; AI Analyses redirect; no Spine Log; BU and Teams; audit tabs + Roll back).",
      dependencies: "Docs owner; each feature ship",
      eta: "Ongoing → 2027-12",
    },
    zh: {
      title: "文件與網址目錄跟上管理後台",
      detail:
        "日常：使用手冊、PRD、TSD、UAT、路線圖、生態、開放議題、進度、網址目錄追蹤導覽實況（即時警報與追蹤；偵測器→Monitor 2.0；AI 分析轉址；無脊柱日誌；BU 與團隊；稽核分頁＋回滾）。",
      dependencies: "文件負責人；各功能交付",
      eta: "持續 → 2027-12",
    },
    checklist: [
      { en: "Keep UG / PRD / TSD / UAT / Roadmap / Ecosystem aligned after each nav ship", zh: "每次選單交付後對齊 UG／PRD／TSD／UAT／路線圖／生態" },
      { en: "Refresh Open Issues + Progress when statuses/ETAs change", zh: "狀態／ETA 變更時更新開放議題＋進度" },
      { en: "URL catalog lists public + admin paths with correct permissions", zh: "網址目錄列出公開＋管理路徑與正確權限" },
      { en: "EN + zh-Hant parity for every docs page", zh: "每份文件頁 EN＋繁中對齊" },
    ],
  },
  {
    id: "OI-16",
    area: "System",
    bu: "System",
    status: "planned",
    startMonth: 4,
    endMonth: 10,
    priority: "P1",
    en: {
      title: "Observability — spine SLOs, AI latency, false-alarm rate",
      detail:
        "Prototype has console + home spine counts. Production needs APM/metrics for spine SLOs, AI latency/cost, false-alarm rate, and adapter health. Tech details still open under initial design.",
      dependencies: "OI-03 architecture; OI-04 model ops; SRE capacity",
      eta: "2027-Q3 (tentative)",
    },
    zh: {
      title: "可觀測性 — 脊柱 SLO、AI 延遲、誤報率",
      detail:
        "原型僅有 console＋首頁脊柱計數。生產需 APM／指標：脊柱 SLO、AI 延遲／成本、誤報率、適配健康。技術細節在初始設計下仍開放。",
      dependencies: "OI-03 架構；OI-04 模型營運；SRE 產能",
      eta: "2027-Q3（暫定）",
    },
    checklist: [
      { en: "Define spine stage latency SLOs", zh: "定義脊柱階段延遲 SLO" },
      { en: "Dashboards: AI RCA + challenger latency/cost", zh: "儀表板：AI RCA＋挑戰延遲／成本" },
      { en: "False-alarm / dismiss rate tracking for shadow mode", zh: "影子模式誤報／排除率追蹤" },
      { en: "Adapter health checks for Monitor + Lark + control bus", zh: "Monitor＋Lark＋控制匯流排適配健康檢查" },
      { en: "On-call runbook for CRMP control-plane pages", zh: "CRMP 控制面頁面值班手冊" },
    ],
  },
  {
    id: "OI-17",
    area: "Ops",
    bu: "Ops",
    status: "planned",
    startMonth: 6,
    endMonth: 12,
    priority: "P1",
    en: {
      title: "Global kill-switches (skills, intel push, write adapters)",
      detail:
        "Settings flags are partial today. Production needs instant disable for auto-skills, market-intel push, and each write adapter — rehearsed in UAT before Phase C.",
      dependencies: "OI-07 adapters; OI-08 Lark; Settings flags design",
      eta: "2027-Q4 (with write path)",
    },
    zh: {
      title: "全域緊急開關（技能、情報推送、寫入適配）",
      detail:
        "今日設定旗標僅部分。生產需可立即關閉自動技能、情報推送與各寫入適配 — 階段 C 前以 UAT 演練。",
      dependencies: "OI-07 適配；OI-08 Lark；設定旗標設計",
      eta: "2027-Q4（隨寫路徑）",
    },
    checklist: [
      { en: "Kill-switch matrix: auto-skills / intel push / each write adapter", zh: "緊急開關矩陣：自動技能／情報推送／各寫入適配" },
      { en: "UI + API to flip switches with audit row (Vantage plane)", zh: "UI＋API 切換開關並寫稽核列（Vantage 平面）" },
      { en: "UAT drill: disable and restore under RO observation", zh: "UAT 演練：在 RO 觀察下關閉與恢復" },
      { en: "Document who may flip switches (SoD)", zh: "文件化誰可切換開關（職責分離）" },
    ],
  },
  {
    id: "OI-18",
    area: "Product",
    bu: "Product",
    status: "planned",
    startMonth: 8,
    endMonth: 14,
    priority: "P2",
    en: {
      title: "Multi-entity / brand tenancy readiness",
      detail:
        "Prototype is single-tenant desk. Group rollout needs legal-entity isolation for alerts, RAG, skill packs, Lark routing, audit export — still open under initial design.",
      dependencies: "OI-02 design freeze; OI-06 IdP; Legal entity list",
      eta: "2027-Q4 → 2027-12 (tentative)",
    },
    zh: {
      title: "多法人／品牌租戶就緒",
      detail:
        "原型為單租戶台面。集團推廣需法人隔離：警報、RAG、技能包、Lark 路由、稽核匯出 — 初始設計下仍開放。",
      dependencies: "OI-02 設計凍結；OI-06 IdP；法人清單",
      eta: "2027-Q4 → 2027-12（暫定）",
    },
    checklist: [
      { en: "Define tenant = legal entity (or brand) model", zh: "定義租戶＝法人（或品牌）模型" },
      { en: "Isolate alerts / RAG / skills / Lark routes / audit export", zh: "隔離警報／RAG／技能／Lark 路由／稽核匯出" },
      { en: "Read-only cross-entity exec aggregation (if required)", zh: "只讀跨法人高階彙總（如需要）" },
      { en: "Two UAT seeds (e.g. VFSC vs FCA) when design allows", zh: "設計允許時兩套 UAT 種子（如 VFSC vs FCA）" },
    ],
  },
  {
    id: "OI-19",
    area: "CS",
    bu: "CS",
    status: "started",
    startMonth: 0,
    endMonth: 8,
    priority: "P1",
    en: {
      title: "Production C1 / form / mailbox connectors",
      detail:
        "Prototype CS/TR desk ingests C1 live chat, the website form and official mailboxes through POST /api/cs/intake with token demo-c1. Production needs signed C1 webhooks, form HMAC and a real mailbox gateway so no request lives only in a personal inbox.",
      dependencies: "C1 vendor contract; mailbox Graph/IMAP; OI-03 secrets vault",
      eta: "2027-Q2 (connectors) / prototype UAT now",
    },
    zh: {
      title: "正式 C1／表單／信箱連接器",
      detail:
        "原型 CS／TR 台以 POST /api/cs/intake（token demo-c1）接入 C1 即時聊天、網站表單與官方信箱。正式環境需要簽章 C1 webhook、表單 HMAC 與真實信箱閘道，避免請求只留在個人收件匣。",
      dependencies: "C1 供應商契約；信箱 Graph／IMAP；OI-03 密鑰庫",
      eta: "2027-Q2（連接器）／原型 UAT 現可測",
    },
    checklist: [
      { en: "Replace demo-c1 token with signed C1 webhook + replay protection", zh: "以簽章 C1 webhook＋防重放取代 demo-c1 token", done: false },
      { en: "Website / app form HMAC into the same intake API", zh: "網站／App 表單 HMAC 接入同一進件 API" },
      { en: "Mailbox gateway for support@ and complaints@ (Graph or IMAP)", zh: "support@ 與 complaints@ 信箱閘道（Graph 或 IMAP）" },
      { en: "No-silent-drop SLA on the CS/TR desk (channel stamp on every inbound)", zh: "CS／TR 台無靜默丟失 SLA（每筆進件含渠道戳記）" },
      { en: "Sandbox UAT against C1 staging (UAT-46)", zh: "對 C1 測試環境做沙盒 UAT（UAT-46）", done: true },
    ],
  },
  {
    id: "OI-20",
    area: "TR",
    bu: "TR",
    status: "planned",
    startMonth: 2,
    endMonth: 10,
    priority: "P1",
    en: {
      title: "CS/TR ID vault and dealing-tape reconstruct",
      detail:
        "AI already emails the client when the issue is unclear or ID is needed, waits for a reply (cap 3), routes fills/slippage to TR, and escalates book-risk to the messenger spine. Production still needs a KYC document vault (not mock selfie text) and oneZero/MT tape for TR — not a CS workaround.",
      dependencies: "OI-19 connectors; Client CRM/KYC; oneZero MT bridge; OI-07 control adapters for risk escalate",
      eta: "2027-Q3 (tentative)",
    },
    zh: {
      title: "CS／TR 核身庫與成交帶還原",
      detail:
        "AI 已能在案情不清或需核身時自動寄信、等待回覆（上限 3 封）、把成交／滑點派給 TR，並把帳簿風險升級到 Messenger 脊柱。正式環境仍需 KYC 證件庫（非模擬自拍文字）與 oneZero／MT 成交帶供 TR 使用 — 不可由 CS 權充。",
      dependencies: "OI-19 連接器；客戶 CRM／KYC；oneZero MT 橋；OI-07 風險升級適配",
      eta: "2027-Q3（暫定）",
    },
    checklist: [
      { en: "KYC document vault + UID match; ID-verify stays open until reply or CS Lead waiver", zh: "KYC 證件庫＋UID 核對；身分驗證須待回覆或 CS Lead 豁免才可關" },
      { en: "Auto follow-up mailer (unclear / need_id) with 3-mail cap in production", zh: "正式自動追問信（不清楚／需核身）含 3 封上限" },
      { en: "TR reconstruct fill vs LP from oneZero / MT4 / MT5 tape", zh: "TR 自 oneZero／MT4／MT5 成交帶還原成交 vs LP" },
      { en: "Escalate-to-risk writes a messenger thread + Human Intervention gate", zh: "升級風控寫入 Messenger 執行緒＋人工干預關卡" },
      { en: "CS Lead waiver audited on Vantage + CRMP planes", zh: "CS Lead 豁免寫入 Vantage＋CRMP 稽核平面" },
    ],
  },
];

export function openIssuesSummary() {
  const byStatus = {} as Record<IssueStatus, number>;
  for (const s of Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]) byStatus[s] = 0;
  for (const i of OPEN_ISSUES) byStatus[i.status] += 1;
  return { total: OPEN_ISSUES.length, byStatus };
}

export function openIssuesByBu() {
  const map = new Map<IssueBu, OpenIssue[]>();
  for (const i of OPEN_ISSUES) {
    const list = map.get(i.bu) ?? [];
    list.push(i);
    map.set(i.bu, list);
  }
  return map;
}
