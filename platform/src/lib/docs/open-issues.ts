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
  | "GRC";

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
        "Upstream Monitor 2.0 continues to add CFD/crypto indicators. CRMP must stay sync-compatible (codes, thresholds, ticket write-back) without forking the registry. Tooltip/deep-link contract for M2-* codes is shipped in admin; new indicators still arrive from Monitor.",
      dependencies: "Monitor 2.0 product roadmap; indicator naming convention; sync API contract",
      eta: "2027-Q2 (ongoing ingest)",
    },
    zh: {
      title: "Monitor 2.0 指標擴充",
      detail:
        "上游 Monitor 2.0 仍持續新增 CFD／加密指標。CRMP 須保持同步相容（代碼、門檻、工單回寫），不可分叉登錄表。管理後台已交付 M2-* 提示／深連結契約；新指標仍由 Monitor 側進來。",
      dependencies: "Monitor 2.0 產品路線；指標命名慣例；同步 API 契約",
      eta: "2027-Q2（持續接入）",
    },
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
        "CRMP is still in initial design for production scope: spine stages, BU RACI, dual-control write path, and which surfaces are BAU vs pilot. Prototype admin proves the desk; design freeze and RACI sign-off are open.",
      dependencies: "Risk Owner + Platform Owner workshops; Ecosystem Eval phases A–B",
      eta: "2027-Q1 design freeze (tentative)",
    },
    zh: {
      title: "CRMP 控制面 — 初始設計凍結",
      detail:
        "CRMP 生產範圍仍處初始設計：脊柱階段、BU RACI、雙重控制寫路徑、哪些畫面屬日常／試點。原型後台已證明台面；設計凍結與 RACI 簽核仍開放。",
      dependencies: "風險負責人＋平台負責人工作坊；生態評估 A–B 階段",
      eta: "2027-Q1 設計凍結（暫定）",
    },
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
        "Prototype uses heuristic skill/RAG + second-line challenger models (first-line / second-line AI Admin cards). Need vendor-separated LLM primary RCA, eval harness, cost/latency SLOs, and keep RAG AI-write blocklist (propose_rag only).",
      dependencies: "Prompt vault; spend caps; RM-03/RM-04; RAG dual-control path",
      eta: "2027-Q3 UAT · go-live TBD",
    },
    zh: {
      title: "生產 LLM 根因＋獨立挑戰者",
      detail:
        "原型使用啟發式技能／RAG＋二線挑戰模型（AI 管理一線／二線卡片）。需供應商分離的 LLM 主 RCA、評測架、成本／延遲 SLO，並維持 RAG AI 寫入封鎖（僅 propose_rag）。",
      dependencies: "提示詞金庫；支出上限；RM-03／RM-04；RAG 雙重控制路徑",
      eta: "2027-Q3 UAT · 上線待定",
    },
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
        "Knowledge tree now maps RAG documents as leaves with deep links. Open: corpus ownership SLAs, retire cadence, skill↔doc binds at scale, and maker-checker throughput for propose_rag.",
      dependencies: "rag.manage staffing; skill catalog growth; Monitor tags",
      eta: "2027-Q1 BAU hygiene",
    },
    zh: {
      title: "知識樹＋RAG 語料治理",
      detail:
        "知識樹已將 RAG 文件對映為葉節點並可深連結。開放項：語料擁有 SLA、退役節奏、規模化技能↔文件綁定，以及 propose_rag 的 Maker-Checker 吞吐。",
      dependencies: "rag.manage 人力；技能目錄成長；Monitor 標籤",
      eta: "2027-Q1 日常衛生",
    },
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
        "Kill shared demo passwords (risk123 etc.). Corporate SSO + SCIM into users/roles; preserve maker≠checker SoD for AI Admin and interventions (actioner email already shown on samples).",
      dependencies: "Okta/Entra approval; OI-03 resource plan",
      eta: "2027-Q2 go live (tentative)",
    },
    zh: {
      title: "SSO／IdP＋SCIM（取代示範角色）",
      detail:
        "淘汰共用示範密碼（risk123 等）。企業 SSO＋SCIM 進入使用者／角色；保留 AI 管理與干預的 Maker≠Checker 職責分離（樣本已顯示操作者信箱）。",
      dependencies: "Okta／Entra 核准；OI-03 資源規劃",
      eta: "2027-Q2 上線（暫定）",
    },
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
        "Messenger recommended actions today create admin_ref + intervention samples. Production needs dry-run then checker against Vantage trading/LP bus, with global kill-switch. Do not enable before shadow false-alarm rates accepted.",
      dependencies: "Trading control bus; OI-04 shadow quality; Escalation ESC-DEFAULT + skill binds",
      eta: "2027-Q4 go live (gated)",
    },
    zh: {
      title: "真實控制適配（停市／槓桿／暫停跟單）",
      detail:
        "Messenger 建議動作目前產生 admin_ref＋干預樣本。生產需先 dry-run 再對 Vantage 交易／LP 匯流排做 Checker，並具全域緊急開關。影子誤報率未接受前不可啟用。",
      dependencies: "交易控制匯流排；OI-04 影子品質；升級 ESC-DEFAULT＋技能綁定",
      eta: "2027-Q4 上線（閘控）",
    },
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
        "Interactive UAT pack (45+ cases) exists. Open: formal Risk Owner sign-off cadence, policy thresholds for second-AI severity, and acceptance of ESC-DEFAULT catch-all + coefficient skill binds.",
      dependencies: "UAT pack execution; BU and Teams RACI; AI Admin line1/line2 settings",
      eta: "2026-Q4 / 2027-Q1",
    },
    zh: {
      title: "風險負責人 UAT 出口＋政策門檻",
      detail:
        "互動式 UAT 包（45+ 案例）已存在。開放項：正式風險負責人簽核節奏、第二 AI 嚴重度政策門檻，以及接受 ESC-DEFAULT 兜底＋係數技能綁定。",
      dependencies: "執行 UAT 包；BU 與團隊 RACI；AI 管理一線／二線設定",
      eta: "2026-Q4／2027-Q1",
    },
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
        "Market Intelligence and margin scenarios need licensed/news and LP pricing contracts. Prototype uses heuristic scan templates and seeded M2-* indicators — not vendor SLA.",
      dependencies: "Vendor RFPs; Monitor indicator IDs; Data Sources registry",
      eta: "2027-Q3 (tentative)",
    },
    zh: {
      title: "LP／定價饋送契約（市場情報＋保證金）",
      detail:
        "市場情報與保證金情境需要授權新聞與 LP 定價契約。原型使用啟發式掃描模板與種子 M2-* 指標 — 非供應商 SLA。",
      dependencies: "供應商 RFP；Monitor 指標 ID；資料來源登錄",
      eta: "2027-Q3（暫定）",
    },
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
        "Nav drawer, table overflow, and docs (Open Issues / Progress Tracker) must stay aligned with shipped features: grouped AI pipeline, spine on home, BU and Teams hub, Risk Log 90d charts, P0–P3 domains.",
      dependencies: "Docs owners; FE capacity; i18n catalog",
      eta: "2026-Q4 BAU",
    },
    zh: {
      title: "管理後台 UX 打磨 — 行動＋文件對齊",
      detail:
        "導覽抽屜、表格溢出與文件（開放議題／進度追蹤）須與已交付功能對齊：分組 AI 管線、首頁脊柱、BU 與團隊中心、風險日誌 90 天圖、P0–P3 領域。",
      dependencies: "文件負責人；前端產能；i18n 目錄",
      eta: "2026-Q4 日常",
    },
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
        "Evidence vault and intervention samples may hold account identifiers. Need retention jobs, redaction policy, and auditor-ready export — beyond the current Audit Log (CRMP / Vantage Markets Admin plane split + Roll back) + home spine counts.",
      dependencies: "Legal policy; OI-06 identity; Postgres migration",
      eta: "2027-Q4",
    },
    zh: {
      title: "證據保存、遮罩與稽核匯出",
      detail:
        "證據庫與干預樣本可能含帳戶識別碼。需保存工作、遮罩政策與稽核就緒匯出 — 超越現行稽核日誌（CRMP／Vantage Markets 管理平面分流＋回滾）＋首頁脊柱計數。",
      dependencies: "法務政策；OI-06 身分；Postgres 遷移",
      eta: "2027-Q4",
    },
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
        "Dismiss/close in CRMP must update upstream Monitor tickets. Currently delayed pending Monitor API contract and resource plan (OI-01, OI-03).",
      dependencies: "Monitor write API; OI-01 indicator stability",
      eta: "2027-Q3 (slipped from 2027-Q1)",
    },
    zh: {
      title: "Monitor 工單雙向回寫",
      detail:
        "CRMP 排除／結案須更新上游 Monitor 工單。目前因 Monitor API 契約與資源規劃（OI-01、OI-03）延期。",
      dependencies: "Monitor 寫入 API；OI-01 指標穩定",
      eta: "2027-Q3（自 2027-Q1 延後）",
    },
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
        "Shipped for UAT: first/second-line AI Admin, grouped pipeline + rank note, intervention actioner email, RAG propose_rag human-gate, ESC-DEFAULT + dimension coefficients + skill binds, knowledge-tree RAG leaves, MonitorCode tooltips, editable Roles (/api/roles), audit plane split (CRMP / Vantage Markets Admin) + Roll back. Formal UAT sign-off still open (OI-09).",
      dependencies: "UAT-01…45; Risk Owner calendar",
      eta: "2026-10 / 2026-11 UAT",
    },
    zh: {
      title: "原型 AI 台面功能 — UAT 窗口",
      detail:
        "已交付供 UAT：一線／二線 AI 管理、分組管線＋排序說明、干預操作者信箱、RAG propose_rag 人工閘道、ESC-DEFAULT＋維度係數＋技能綁定、知識樹 RAG 葉、MonitorCode 提示、可編輯角色（/api/roles）、稽核平面分流（CRMP／Vantage Markets 管理）＋回滾。正式 UAT 簽核仍開放（OI-09）。",
      dependencies: "UAT-01…45；風險負責人行程",
      eta: "2026-10／2026-11 UAT",
    },
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
        "BAU: User Guide, PRD, TSD, UAT, Roadmap, Ecosystem, Open Issues, Progress Tracker, and URL catalog must track nav reality (Realtime Alert & Tracker naming; Detectors merged into Monitor 2.0; AI Analyses list redirect; no Spine Log tab; BU and Teams combined; Risk Domains P0–P3; Risk Log 90d; audit CRMP / Vantage Markets Admin tabs + Roll back; editable Roles).",
      dependencies: "Docs owner; each feature ship",
      eta: "Ongoing → 2027-12",
    },
    zh: {
      title: "文件與網址目錄跟上管理後台",
      detail:
        "日常：使用手冊、PRD、TSD、UAT、路線圖、生態、開放議題、進度追蹤與網址目錄須追蹤導覽實況（即時警報與追蹤命名；偵測器併入 Monitor 2.0；AI 分析列表轉址；無脊柱日誌分頁；BU 與團隊合併；風險領域 P0–P3；風險日誌 90 天；稽核 CRMP／Vantage Markets 管理分頁＋回滾；可編輯角色）。",
      dependencies: "文件負責人；各功能交付",
      eta: "持續 → 2027-12",
    },
  },
];

export function openIssuesSummary() {
  const byStatus = {} as Record<IssueStatus, number>;
  for (const s of Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]) byStatus[s] = 0;
  for (const i of OPEN_ISSUES) byStatus[i.status] += 1;
  return { total: OPEN_ISSUES.length, byStatus };
}
