import { EXTRA_UI, PHRASES_ZH, STAGE_LABELS, STATUS_LABELS } from "@/lib/i18n-extra";
import { DUMMY_PHRASE_FRAGMENTS } from "@/lib/i18n-phrases";

export type UiLocale = "en" | "zh-Hant";

export const UI_LOCALE_COOKIE = "crmp_ui_lang";

type Pair = { en: string; "zh-Hant": string };

export const NAV_I18N: Record<string, Pair> = {
  "/admin": { en: "Admin Home", "zh-Hant": "管理首頁" },
  "/admin/dashboard": { en: "Daily Performance", "zh-Hant": "每日績效" },
  "/admin/risk-log": { en: "Risk Log Analytics", "zh-Hant": "風險日誌分析" },
  "/admin/market-intel": { en: "Market Intelligence", "zh-Hant": "市場情報" },
  "/admin/detectors": { en: "Detectors", "zh-Hant": "偵測器" },
  "/admin/alerts": { en: "Realtime Alert & Tracker", "zh-Hant": "即時警報與追蹤" },
  "/admin/ai-analyses": { en: "Realtime Alert & Tracker", "zh-Hant": "即時警報與追蹤" },
  "/admin/ai-admin": { en: "AI Admin", "zh-Hant": "AI 管理" },
  "/admin/interventions": { en: "Human Intervention", "zh-Hant": "人工干預" },
  "/admin/spine": { en: "Spine (redirect)", "zh-Hant": "脊柱（轉址）" },
  "/admin/rag": { en: "RAG Knowledge Base", "zh-Hant": "RAG 知識庫" },
  "/admin/skills": { en: "AI Skills", "zh-Hant": "AI 技能" },
  "/admin/knowledge-tree": { en: "Knowledge Tree", "zh-Hant": "知識樹" },
  "/admin/docs/tsd": { en: "TSD", "zh-Hant": "技術規格 TSD" },
  "/admin/docs/prd": { en: "PRD", "zh-Hant": "產品需求 PRD" },
  "/admin/docs/user-guide": { en: "User Guide", "zh-Hant": "使用手冊" },
  "/admin/docs/uat": { en: "UAT Checklist", "zh-Hant": "UAT 清單" },
  "/admin/docs/ecosystem": { en: "Ecosystem Eval", "zh-Hant": "生態導入評估" },
  "/admin/docs/roadmap": { en: "Improvement Roadmap", "zh-Hant": "改進路線圖" },
  "/admin/docs/urls": { en: "URL Catalog", "zh-Hant": "網址目錄" },
  "/admin/docs/open-issues": { en: "Open Issues", "zh-Hant": "開放議題" },
  "/admin/docs/progress": { en: "Progress Tracker", "zh-Hant": "進度追蹤" },
  "/admin/messenger": { en: "Demo Messenger", "zh-Hant": "示範 Messenger" },
  "/cs": { en: "CS client portal", "zh-Hant": "CS 客戶入口" },
  "/login": { en: "Sign in", "zh-Hant": "登入" },
  "/admin/login": { en: "Sign in", "zh-Hant": "登入" },
  "/admin/cs-desk": { en: "CS / TR Desk", "zh-Hant": "CS／TR 台" },
  "/admin/cs-dashboard": { en: "CS / TR Dashboard", "zh-Hant": "CS／TR 儀表板" },
  "/admin/cs-log": { en: "CS / TR Log", "zh-Hant": "CS／TR 日誌" },
  "/admin/cs-data": { en: "CS / TR Data", "zh-Hant": "CS／TR 資料" },
  "/admin/security/ai-access": { en: "AI Access Security", "zh-Hant": "AI 存取安全" },
  "/admin/departments": { en: "BU and Teams", "zh-Hant": "BU 與團隊" },
  "/admin/teams": { en: "BU and Teams", "zh-Hant": "BU 與團隊" },
  "/admin/roles": { en: "Roles & Permissions", "zh-Hant": "角色與權限" },
  "/admin/users": { en: "Users", "zh-Hant": "使用者" },
  "/admin/risk-domains": { en: "Risk Domains", "zh-Hant": "風險領域" },
  "/admin/data-sources": { en: "Data Sources", "zh-Hant": "資料來源" },
  "/admin/monitor-2": { en: "Monitor 2.0", "zh-Hant": "Monitor 2.0" },
  "/admin/lark": { en: "Lark Integration", "zh-Hant": "Lark 整合" },
  "/admin/escalation": { en: "Escalation Routes", "zh-Hant": "升級路徑" },
  "/admin/audit": { en: "Audit Log", "zh-Hant": "稽核日誌" },
  "/admin/settings": { en: "Platform Settings", "zh-Hant": "平台設定" },
};

const PAGE_META: Record<string, { title: Pair; subtitle: Pair }> = {
  home: {
    title: {
      en: "Admin Dashboard",
      "zh-Hant": "管理儀表板",
    },
    subtitle: {
      en: "CRMP Plus — original risk spine plus 24/7 CS/TR. Click any card to open its page.",
      "zh-Hant": "CRMP Plus — 原風險脊柱加上 24/7 客服與交易台。點任何卡片即可開啟對應頁面。",
    },
  },
  login: {
    title: { en: "Sign in", "zh-Hant": "登入" },
    subtitle: {
      en: "Use demo platform owner or another demo role. The session stays in this browser after refresh.",
      "zh-Hant": "使用示範平台負責人或其他示範角色。重新整理後工作階段仍會保留。",
    },
  },
  dashboard: {
    title: { en: "Daily Performance Dashboard", "zh-Hant": "每日績效儀表板" },
    subtitle: {
      en: "CFD sphere vs Exchange sphere — last stage of the semi-automated spine.",
      "zh-Hant": "CFD 圈對交易所圈 — 半自動化脊柱最後一環。",
    },
  },
  "risk-log": {
    title: { en: "Risk Log & Alerts Analytics", "zh-Hant": "風險日誌與警報分析" },
    subtitle: {
      en: "Closed tickets land here with the same tracker pack as Realtime Alert — ticket-closed status, AI analysis, AI/BU action logs, mandated solution — plus 90-day historical charts (backfilled), category, handling time, loss vs prevented, and loophole areas.",
      "zh-Hant": "已關閉工單以與即時警報相同的追蹤包落地於此 — 工單已關閉狀態、AI 分析、AI／各 BU 動作紀錄、核定方案 — 另含 90 天歷史圖表（已回填）、類別、處理時間、損失 vs 防損與漏洞領域。",
    },
  },
  "market-intel": {
    title: { en: "Market Intelligence", "zh-Hant": "市場情報" },
    subtitle: {
      en: "Hour / 24h headlines plus a sentiment barometer for core Vantage instruments — then news, social and official channels that can move LP prices (M2-MKT-INTEL).",
      "zh-Hant": "一小時／24 小時頭條，加上 Vantage 主要商品情緒氣壓計 — 再掃描可能影響 LP 報價的新聞／社群／官方頻道（M2-MKT-INTEL）。",
    },
  },
  detectors: {
    title: { en: "Detectors", "zh-Hant": "偵測器" },
    subtitle: {
      en: "Merged into Monitor 2.0 — redirecting.",
      "zh-Hant": "已合併至 Monitor 2.0 — 重新導向中。",
    },
  },
  alerts: {
    title: { en: "Realtime Alert & Tracker", "zh-Hant": "即時警報與追蹤" },
    subtitle: {
      en: "Open queue only — includes AI pipeline controls (analyze open, simulate skill/RAG/CRITICAL, backfill 2nd AI). Expand a ticket for facts, AI RCA, improve review, POC and action log. Closed tickets live in Risk Log Analytics.",
      "zh-Hant": "僅顯示未結佇列 — 含 AI 管線控制（分析未結、模擬技能／RAG／危急、補跑第二 AI）。展開工單可看事實、AI 根因、改進審查、承辦與動作紀錄。已關閉工單在風險日誌分析。",
    },
  },
  "ai-analyses": {
    title: { en: "AI Analyses", "zh-Hant": "AI 分析" },
    subtitle: {
      en: "List merged into Realtime Alert & Tracker. This URL redirects. Detail packs remain at /admin/ai-analyses/[id].",
      "zh-Hant": "列表已合併到即時警報與追蹤。此網址會轉址。詳細證據包仍在 /admin/ai-analyses/[id]。",
    },
  },
  "ai-admin": {
    title: { en: "AI Admin", "zh-Hant": "AI 管理" },
    subtitle: {
      en: "First-line and second-line AI cards, parameters, training, accuracy, skills and RAG — maker/checker dual control; AI proposes RAG via propose_rag only.",
      "zh-Hant": "一線／二線 AI 卡片、參數、訓練、準確率、Skills 與 RAG — Maker／Checker 雙重控制；AI 僅能經 propose_rag 提案 RAG。",
    },
  },
  interventions: {
    title: { en: "Human Intervention", "zh-Hant": "人工干預" },
    subtitle: {
      en: "Approve or reject AI/skill human gates. Cards show ticket, timestamp, severity, action, and actioner email. Decisions go to spine + audit.",
      "zh-Hant": "核准或駁回 AI／Skill 人工關卡。卡片顯示工單、時間戳、嚴重度、動作與執行者信箱。決策寫入脊柱與稽核。",
    },
  },
  spine: {
    title: { en: "Spine (on Admin Home)", "zh-Hant": "脊柱（管理首頁）" },
    subtitle: {
      en: "Dedicated Spine Log tab removed — stage ticket counts live on Admin Home. Detect → Alarm → AI RCA → Skill → Human → Resolved → Dashboard.",
      "zh-Hant": "專屬脊柱日誌分頁已移除 — 階段工單計數在管理首頁。偵測 → 警報 → AI RCA → Skill → 人工 → 結案 → 儀表板。",
    },
  },
  rag: {
    title: { en: "RAG Knowledge Base", "zh-Hant": "RAG 知識庫" },
    subtitle: {
      en: "Business corpus + explicit AI human-gate: pages/functions AI cannot edit must escalate to authorised humans (rag.manage / maker-checker).",
      "zh-Hant": "業務語料＋明確 AI 人工關卡：AI 不可編輯的頁面／功能必須升級給具授權人類（rag.manage／Maker-Checker）。",
    },
  },
  skills: {
    title: { en: "AI Skills & Risk Scenarios", "zh-Hant": "AI 技能與風險情境" },
    subtitle: {
      en: "Indicator thresholds (and why), fault areas, escalation paths, BU correction actions, past detections — plus multi-indicator timeline chains. Click Enter on a card for the full SKILL.md playbook.",
      "zh-Hant": "指標門檻與理由、故障區域、升級路徑、BU 矯正、歷史偵測，以及多指標時間鏈。在卡片點「進入」可看完整 SKILL.md 劇本。",
    },
  },
  "knowledge-tree": {
    title: { en: "Knowledge Tree", "zh-Hant": "知識樹" },
    subtitle: {
      en: "How domains, skill playbooks, linked timelines and RAG documents connect — click a node to open the source.",
      "zh-Hant": "領域、技能劇本、連結時間鏈與 RAG 文件如何串接 — 點節點即可打開來源。",
    },
  },
  messenger: {
    title: { en: "Demo Messenger", "zh-Hant": "示範 Messenger" },
    subtitle: {
      en: "Prototype Lark-style inbox: one case, split chat windows per POC on the escalation path — bird-eye relay from desk to desk, plus evidence, chatbot, escalate, dismiss, close, and controls.",
      "zh-Hant": "原型 Lark 風格收件匣：同一案件依升級路徑承辦拆成多個聊天窗 — 鳥瞰台面轉遞，並含證據、聊天機器人、升級、排除、結案與控制動作。",
    },
  },
  "cs-desk": {
    title: { en: "CS / TR Desk", "zh-Hant": "CS／TR 台" },
    subtitle: {
      en: "24/7 Customer Service and Trading Support. Live C1 chat, web form and official email land here. If AI is unclear or needs ID, it emails the client and waits for a reply.",
      "zh-Hant": "24/7 客服與交易支援。C1 即時聊天、網頁表單與官方信箱在此匯入。AI 若不清楚或需核身，會自動寄信並等待客戶回覆。",
    },
  },
  "cs-dashboard": {
    title: { en: "CS / TR Dashboard", "zh-Hant": "CS／TR 儀表板" },
    subtitle: {
      en: "Dedicated CS/TR KPIs — totals, open vs resolved, WAITING auto-mail (cap 3), TR and Risk, by channel / status / skill / desk. Not Daily Performance and not Risk Log.",
      "zh-Hant": "專用 CS／TR 指標 — 總數、未結 vs 已結、WAITING 自動信（上限 3）、TR 與風控，依渠道／狀態／技能／台面。不是每日績效，也不是風險日誌。",
    },
  },
  "cs-log": {
    title: { en: "CS / TR Log", "zh-Hant": "CS／TR 日誌" },
    subtitle: {
      en: "Timeline of CS_* audit on cs_request plus resolved request packs. Separate from Risk Log Analytics and from the generic Audit Log tabs.",
      "zh-Hant": "cs_request 上 CS_* 稽核時間軸，加上已結案件包。獨立於風險日誌分析與通用稽核日誌分頁。",
    },
  },
  "cs-data": {
    title: { en: "CS / TR Data", "zh-Hant": "CS／TR 資料" },
    subtitle: {
      en: "BU and team roster, escalation hops, cs.* parameters, KYC vault, dealing tape and named mailboxes that the desk and dashboard consume.",
      "zh-Hant": "BU 與團隊名冊、升級關卡、cs.* 參數、核身庫、成交帶與具名信箱 — 台面與儀表板會讀這些資料。",
    },
  },
  "ai-access": {
    title: { en: "AI Access Blocklist", "zh-Hant": "AI 存取黑名單" },
    subtitle: {
      en: "Pages, functions, fields and data that must remain human-authorised only — blocked from AI agents for security.",
      "zh-Hant": "必須僅由人類授權之頁面、功能、欄位與資料 — 基於安全封鎖 AI 代理。",
    },
  },
  "monitor-2": {
    title: { en: "Monitor 2.0 Integration Hub", "zh-Hant": "Monitor 2.0 整合中心" },
    subtitle: {
      en: "Unified indicator + detector registry — thresholds, sampling runs, risk scenarios and combinations. Alerts live under Realtime Alert & Tracker.",
      "zh-Hant": "統一指標與偵測器登錄 — 門檻、採樣執行、風險情境與組合。警報請至「即時警報與追蹤」。",
    },
  },
  lark: {
    title: { en: "Lark Integration", "zh-Hant": "Lark 整合" },
    subtitle: {
      en: "Company messenger: alert and escalation cards (Ack / Escalate / Dismiss / Close) plus the channel registry for when live Lark is wired.",
      "zh-Hant": "企業即時通訊：警報與升級卡片（確認／升級／排除／結案），以及接上真實 Lark 時的頻道目錄。",
    },
  },
  escalation: {
    title: { en: "Escalation Routes", "zh-Hant": "升級路徑" },
    subtitle: {
      en: "Severity → team → SLA; catch-all ESC-DEFAULT; each skill binds one path. Used by Demo Messenger and Lark messenger cards.",
      "zh-Hant": "嚴重度 → 團隊 → SLA；兜底 ESC-DEFAULT；每個技能綁定一條路徑。供示範 Messenger 與 Lark 即時通訊卡片使用。",
    },
  },
  departments: {
    title: { en: "BU and Teams", "zh-Hant": "BU 與團隊" },
    subtitle: {
      en: "Business units with nested on-call teams — edit mission and rotation when authorised.",
      "zh-Hant": "業務單位與其嵌套值班團隊 — 授權後可編輯任務與輪值。",
    },
  },
  teams: {
    title: { en: "BU and Teams", "zh-Hant": "BU 與團隊" },
    subtitle: {
      en: "Redirects to the combined BU and Teams hub.",
      "zh-Hant": "轉址至合併的 BU 與團隊中心。",
    },
  },
  roles: {
    title: { en: "Roles & Permissions", "zh-Hant": "角色與權限" },
    subtitle: {
      en: "Editable RBAC matrix — name, description, BU, and permission pills (users.manage). AI cannot edit roles.",
      "zh-Hant": "可編輯 RBAC 矩陣 — 名稱、說明、BU 與權限標籤（需 users.manage）。AI 不可編輯角色。",
    },
  },
  users: {
    title: { en: "Users", "zh-Hant": "使用者" },
    subtitle: {
      en: "Directory of operators and demo personas, including demo platform owner.",
      "zh-Hant": "操作員與示範角色目錄，含示範平台負責人。",
    },
  },
  "risk-domains": {
    title: { en: "Risk Domains", "zh-Hant": "風險領域" },
    subtitle: {
      en: "CFD vs Exchange spheres with P0–P3 coloured scenarios, plain-English detail, and every scenario hooked to Monitor 2.0 indicators.",
      "zh-Hant": "CFD 對交易所兩圈：P0–P3 色標情境、白話說明，且每則情境皆掛上 Monitor 2.0 指標。",
    },
  },
  "data-sources": {
    title: { en: "Data Sources Repository", "zh-Hant": "資料來源庫" },
    subtitle: {
      en: "Canonical registry of internal platforms and external verification feeds.",
      "zh-Hant": "內部平台與外部驗證來源之標準登錄。",
    },
  },
  audit: {
    title: { en: "Audit Log", "zh-Hant": "稽核日誌" },
    subtitle: {
      en: "CRMP logs vs Vantage Markets Admin logs — Roll back restores before-state when captured.",
      "zh-Hant": "CRMP 日誌與 Vantage Markets 管理日誌 — 有變更前快照時可回滾。",
    },
  },
  settings: {
    title: { en: "Platform Settings", "zh-Hant": "平台設定" },
    subtitle: {
      en: "Parameters grouped by identity, monitoring, AI, messenger and escalation.",
      "zh-Hant": "參數依身分、監控、AI、Messenger 與升級分組。",
    },
  },
  urls: {
    title: { en: "URL Catalog", "zh-Hant": "網址目錄" },
    subtitle: {
      en: "Admin pages, public /cs portal, CS/TR desk, five SKILL.md playbooks, RAG leaves, APIs (incl. POST /api/cs/intake), SQLite path and core DB tables — plus frozen original CRMP Admin.",
      "zh-Hant": "管理頁、公開 /cs 入口、CS／TR 台、五本 SKILL.md、RAG 葉、API（含 POST /api/cs/intake）、SQLite 路徑與核心資料表 — 以及凍結的原 CRMP 管理後台。",
    },
  },
};

const UI: Record<string, Pair> = {
  "shell.brandEyebrow": { en: "Vantage Markets", "zh-Hant": "Vantage Markets" },
  "shell.brandTitle": { en: "CRMP Plus", "zh-Hant": "CRMP Plus" },
  "shell.brandSub": {
    en: "Original CRMP plus 24/7 CS and TR",
    "zh-Hant": "原 CRMP 加上 24/7 客服與交易台",
  },
  "shell.headerEyebrow": { en: "Upgraded Control Plane", "zh-Hant": "升級控制平面" },
  "shell.headerTitle": { en: "Risk · Ops · AI · System · CS · TR", "zh-Hant": "風險 · 營運 · AI · 系統 · 客服 · 交易" },
  "shell.messenger": { en: "Messenger", "zh-Hant": "即時通訊" },
  "shell.indicators": { en: "Indicators", "zh-Hant": "指標" },
  "shell.signOut": { en: "Sign out", "zh-Hant": "登出" },
  "shell.signIn": { en: "Sign in", "zh-Hant": "登入" },
  "shell.publicMode": { en: "Public prototype", "zh-Hant": "公開原型" },
  "shell.menu": { en: "Menu", "zh-Hant": "選單" },
  "shell.language": { en: "Language", "zh-Hant": "語言" },

  "home.stat.users": { en: "Users", "zh-Hant": "使用者" },
  "home.stat.usersHint": { en: "Across 6 departments", "zh-Hant": "橫跨 6 個部門" },
  "home.stat.teams": { en: "BU and Teams", "zh-Hant": "BU 與團隊" },
  "home.stat.teamsHint": { en: "On-call ready", "zh-Hant": "可值班" },
  "home.stat.sources": { en: "Data Sources", "zh-Hant": "資料來源" },
  "home.stat.sourcesHint": { en: "Internal + external registry", "zh-Hant": "內部＋外部登錄" },
  "home.stat.domains": { en: "Risk Domains", "zh-Hant": "風險領域" },
  "home.stat.domainsHint": { en: "CFD + Crypto Exchange", "zh-Hant": "CFD＋加密交易所" },
  "home.stat.openAlerts": { en: "Open Alerts", "zh-Hant": "未結警報" },
  "home.stat.openAlertsHint": { en: "Synced from Monitor 2.0", "zh-Hant": "自 Monitor 2.0 同步" },
  "home.stat.openTickets": { en: "Open Tickets", "zh-Hant": "未結工單" },
  "home.stat.openTicketsHint": { en: "Tracked cases", "zh-Hant": "追蹤中案件" },
  "home.stat.lark": { en: "Lark Channels", "zh-Hant": "Lark 頻道" },
  "home.stat.larkHint": { en: "Messenger routes", "zh-Hant": "通訊路由" },
  "home.stat.routes": { en: "Escalation Routes", "zh-Hant": "升級路徑" },
  "home.stat.routesHint": { en: "Severity → team → SLA", "zh-Hant": "嚴重度 → 團隊 → SLA" },
  "home.deptTitle": { en: "Department Division", "zh-Hant": "部門分工" },
  "home.deptSub": {
    en: "RACI charters for the CRMP spine — preview of what each BU owns; full detail on Departments.",
    "zh-Hant": "CRMP 脊柱之 RACI 章程 — 此處預覽各 BU 擁有項；完整細節在「部門」。",
  },
  "home.deptMore": {
    en: "+{n} more on Departments",
    "zh-Hant": "部門頁另有 {n} 項",
  },
  "home.recentAlerts": { en: "Recent Alerts", "zh-Hant": "最近警報" },
  "home.expandHint": {
    en: "Click a card to expand the full open ticket — admin URL, AI RCA, POC, gates, escalation and action log. Closed tickets are in Risk Log Analytics.",
    "zh-Hant": "點卡片即可展開完整未結工單 — 管理網址、AI 根因、承辦、關卡、升級路徑與動作紀錄。已關閉工單在風險日誌分析。",
  },
  "home.viewAll": { en: "View all", "zh-Hant": "查看全部" },
  "home.open": { en: "Open", "zh-Hant": "開啟" },
  "home.openPage": { en: "Open page", "zh-Hant": "開啟頁面" },
  "home.jumpTitle": { en: "Jump to a page", "zh-Hant": "跳至頁面" },
  "home.jumpSub": {
    en: "Shortcuts into the rest of the desk. Every tile is a link.",
    "zh-Hant": "通往其餘功能的捷徑。每塊磁磚都是連結。",
  },

  "msg.channels": { en: "Channels / threads", "zh-Hant": "頻道／執行緒" },
  "msg.sync": { en: "Sync alerts", "zh-Hant": "同步警報" },
  "msg.empty": { en: "No threads yet. Sync alerts.", "zh-Hant": "尚無執行緒。請同步警報。" },
  "msg.threads": { en: "Threads", "zh-Hant": "執行緒" },
  "msg.showEvidence": { en: "Show evidence", "zh-Hant": "顯示證據" },
  "msg.escalate": { en: "Escalate", "zh-Hant": "升級" },
  "msg.dismiss": { en: "Dismiss", "zh-Hant": "排除（誤報）" },
  "msg.close": { en: "Close (accept AI)", "zh-Hant": "結案（接受 AI）" },
  "msg.recommended": { en: "Recommended actions", "zh-Hant": "建議動作" },
  "msg.triagePrimary": { en: "Primary decision", "zh-Hant": "主要決策" },
  "msg.triageSecondary": { en: "Other triage", "zh-Hant": "其他分流" },
  "msg.groupCritical": { en: "Critical controls", "zh-Hant": "關鍵管制" },
  "msg.groupControl": { en: "Risk controls", "zh-Hant": "風險控制" },
  "msg.groupSoft": { en: "Market softeners", "zh-Hant": "市場緩和" },
  "msg.rankNote": {
    en: "Actions not available to your rank are hidden. When you need a hidden control, escalate — do not improvise outside the path.",
    "zh-Hant": "你職級無法使用的動作不會顯示。若需要被隱藏的管制，請升級——勿在路徑外自行操作。",
  },
  "msg.escalateHint": {
    en: "Use Escalate when the decision or control exceeds your rank.",
    "zh-Hant": "當決策或管制超出你的職級時，請使用「升級」。",
  },
  "msg.birdeye": { en: "Bird-eye · POC relay", "zh-Hant": "鳥瞰 · POC 轉遞" },
  "msg.pocActive": { en: "Live", "zh-Hant": "進行中" },
  "msg.pocRelayed": { en: "Relayed", "zh-Hant": "已轉交" },
  "msg.pocWaiting": { en: "Waiting", "zh-Hant": "等待中" },
  "msg.pocEmpty": {
    en: "No messages yet — waiting for the previous POC to escalate.",
    "zh-Hant": "尚無訊息 — 等待上一承辦升級轉入。",
  },
  "msg.noPocYet": { en: "On-call desk", "zh-Hant": "值班台" },
  "msg.confirm": { en: "Confirm:", "zh-Hant": "確認：" },
  "msg.checkerNeeded": { en: "Checker approval needed:", "zh-Hant": "需要 Checker 核准：" },
  "msg.doubleConfirm": { en: "Double-confirm…", "zh-Hant": "雙重確認…" },
  "msg.yesAdmin": { en: "Yes, send to Vantage admin", "zh-Hant": "是，送至 Vantage 管理後台" },
  "msg.noBack": { en: "No, go back", "zh-Hant": "否，返回" },
  "msg.cancel": { en: "Cancel", "zh-Hant": "取消" },
  "msg.checkerApprove": { en: "Checker approve (go live)", "zh-Hant": "Checker 核准（上線）" },
  "msg.openAdmin": { en: "Open admin", "zh-Hant": "開啟管理後台" },
  "msg.chatPlaceholder": {
    en: "Challenge the AI report or add info…",
    "zh-Hant": "挑戰 AI 報告或補充資訊…",
  },
  "msg.send": { en: "Send", "zh-Hant": "傳送" },
  "msg.thinking": { en: "CRMP is thinking", "zh-Hant": "CRMP 思考中" },
  "msg.thoughtFor": { en: "Thought for {s}s", "zh-Hant": "思考了 {s} 秒" },
  "msg.showThoughts": { en: "Show reasoning", "zh-Hant": "顯示推理過程" },
  "msg.hideThoughts": { en: "Hide reasoning", "zh-Hant": "隱藏推理過程" },
  "msg.select": { en: "Select a thread to open the demo messenger.", "zh-Hant": "選擇執行緒以開啟示範 Messenger。" },
  "msg.openInAdmin": { en: "Open in admin →", "zh-Hant": "在管理後台開啟 →" },
  "msg.actionDone": { en: "Action {action} completed", "zh-Hant": "動作 {action} 已完成" },
  "msg.synced": { en: "Synced {n} new alert(s) into messenger", "zh-Hant": "已同步 {n} 則新警報至 Messenger" },
  "msg.larkDemoHint": {
    en: "Lark-style demo inbox. Alerts and escalations also post interactive cards on Lark Integration. Open a thread to see POC chat windows along the path. Permanent URL:",
    "zh-Hant": "Lark 風格示範收件匣。警報與升級也會在 Lark 整合送出互動卡片。開啟執行緒即可依路徑承辦拆窗。永久網址：",
  },
  "msg.larkDemoHintShort": {
    en: "Lark-style demo inbox — POC chat windows along the escalation path.",
    "zh-Hant": "Lark 風格示範收件匣 — 升級路徑承辦聊天窗。",
  },
  "home.larkDemo": {
    en: "See alerts, AI reports and escalations in the Lark-style messenger demo.",
    "zh-Hant": "在 Lark 風格 Messenger 示範中查看警報、AI 報告與升級訊息。",
  },
  "home.larkDemoCta": { en: "Open messenger demo", "zh-Hant": "開啟 Messenger 示範" },
  "home.csDesk": {
    en: "C1 live chat, web form and official email — CS 24/7 and TR dealing in one desk.",
    "zh-Hant": "C1 即時聊天、網頁表單與官方信箱 — CS 24/7 與 TR 成交同一台面。",
  },
  "home.csDeskCta": { en: "Open CS / TR desk", "zh-Hant": "開啟 CS／TR 台" },
  "home.csDash": {
    en: "CS/TR KPIs — open, WAITING, TR, Risk. Not Daily Performance.",
    "zh-Hant": "CS／TR 指標 — 未結、WAITING、TR、風控。不是每日績效。",
  },
  "home.csDashCta": { en: "Open CS / TR dashboard", "zh-Hant": "開啟 CS／TR 儀表板" },
  "home.csLog": {
    en: "CS_* timeline and resolved packs. Not the Risk Log.",
    "zh-Hant": "CS_* 時間軸與已結包。不是風險日誌。",
  },
  "home.csLogCta": { en: "Open CS / TR log", "zh-Hant": "開啟 CS／TR 日誌" },
  "home.csData": {
    en: "BU, teams, escalation hops and cs.* parameters the desk actually uses.",
    "zh-Hant": "台面實際使用的 BU、團隊、升級關卡與 cs.* 參數。",
  },
  "home.csDataCta": { en: "Open CS / TR data", "zh-Hant": "開啟 CS／TR 資料" },
  "cs.pageHint": {
    en: "Connectors: public /cs portal and POST /api/cs/intake (C1 live chat, submission form, official email). Header x-cs-intake-token: demo-c1. Replies match CSR-XXXX / channel_ref / In-Reply-To. AI stamps a dedicated SKILL.md, emails when unclear or ID is needed, and waits — up to three loops. Once facts are complete it categorises, assigns severity, drafts a solution, and either replies or holds the draft for a POC.",
    "zh-Hant": "連接器：公開 /cs 入口與 POST /api/cs/intake（C1 即時聊天、提交表單、官方信箱）。標頭 x-cs-intake-token: demo-c1。回覆以 CSR-XXXX／channel_ref／In-Reply-To 對上原案。AI 蓋上專用 SKILL.md；不清楚或需核身會自動寄信等待 — 最多三輪。資料齊全後分類、給嚴重度、起草方案，並依敏感度直回或交 POC 審閱後寄出。",
  },
  "cs.inbox": { en: "CS / TR inbox", "zh-Hant": "CS／TR 收件匣" },
  "cs.inboxBack": { en: "Inbox", "zh-Hant": "收件匣" },
  "cs.empty": { en: "No requests yet. Simulate C1, a form, or an email.", "zh-Hant": "尚無請求。請模擬 C1、表單或信件。" },
  "cs.triage": { en: "AI triage", "zh-Hant": "AI 分流" },
  "cs.analyze": { en: "AI analyse + draft", "zh-Hant": "AI 分析＋草稿" },
  "cs.severity": { en: "Severity", "zh-Hant": "嚴重度" },
  "cs.sensAuto": { en: "AI may reply", "zh-Hant": "AI 可直回" },
  "cs.sensPoc": { en: "POC review", "zh-Hant": "POC 審閱" },
  "cs.analysis": { en: "AI solution & reply", "zh-Hant": "AI 方案與回覆" },
  "cs.solution": { en: "Solution", "zh-Hant": "方案" },
  "cs.draft": { en: "Draft to client", "zh-Hant": "擬回覆客戶" },
  "cs.poc": { en: "POC", "zh-Hant": "窗口" },
  "cs.pocExtraPh": {
    en: "Add detail before the reply goes to the client…",
    "zh-Hant": "寄出前補上細節…",
  },
  "cs.pocRelease": { en: "Review, add detail, send", "zh-Hant": "審閱、補註、寄出" },
  "cs.skill": { en: "Skill", "zh-Hant": "技能" },
  "cs.askMore": { en: "Email: need more detail", "zh-Hant": "寄信：請補充" },
  "cs.askId": { en: "Email: ID verification", "zh-Hant": "寄信：身分驗證" },
  "cs.assignTr": { en: "Assign to TR", "zh-Hant": "指派至 TR" },
  "cs.escalateRisk": { en: "Escalate to Risk", "zh-Hant": "升級至風控" },
  "cs.resolve": { en: "Resolve", "zh-Hant": "結案" },
  "cs.waitingReply": { en: "Waiting for the client to reply to auto-email", "zh-Hant": "等待客戶回覆自動信件" },
  "cs.simulateReply": { en: "Simulate client email reply", "zh-Hant": "模擬客戶回信" },
  "cs.replyPh": { en: "Reply as CS / TR…", "zh-Hant": "以 CS／TR 回覆…" },
  "cs.select": { en: "Select a request.", "zh-Hant": "請選擇一則請求。" },
  "cs.simulate": { en: "Realtime intake (demo)", "zh-Hant": "即時進件（示範）" },
  "cs.simulateHint": {
    en: "Posts through the same API C1, the website form and the mailbox gateway use.",
    "zh-Hant": "走與 C1、網站表單、信箱閘道相同的 API。",
  },
  "cs.simPh": {
    en: "Optional body — try a short “help me ???” to trigger follow-up, or mention MT5 fill/slippage for TR.",
    "zh-Hant": "可選內文 — 試短句「help me ???」觸發追問，或提到 MT5 成交／滑點以分流至 TR。",
  },
  "cs.simC1": { en: "Simulate C1 chat", "zh-Hant": "模擬 C1 聊天" },
  "cs.simForm": { en: "Simulate form", "zh-Hant": "模擬表單" },
  "cs.simEmail": { en: "Simulate official email", "zh-Hant": "模擬官方信件" },
  "cs.needOperate": { en: "Your rank cannot operate the CS/TR desk.", "zh-Hant": "你的職級無法操作 CS／TR 台。" },
  "cs.staticNote": {
    en: "Static snapshot — intake API is live on localhost. Seeded requests still show the three channels and the follow-up loop.",
    "zh-Hant": "靜態快照 — 進件 API 在本機即時。種子案件仍展示三個渠道與追問迴圈。",
  },
  "cs.dash.hint": {
    en: "This board is only CS/TR (cs_requests + wait loop). Daily Performance stays on /admin/dashboard. Closed risk tickets stay on Risk Log Analytics.",
    "zh-Hant": "此看板只含 CS／TR（cs_requests＋等待迴圈）。每日績效仍在 /admin/dashboard。已關閉風險工單仍在風險日誌分析。",
  },
  "cs.dash.open": { en: "Open CS / TR dashboard", "zh-Hant": "開啟 CS／TR 儀表板" },
  "cs.dash.total": { en: "Total requests", "zh-Hant": "請求總數" },
  "cs.dash.totalHint": { en: "All CS/TR tickets in the prototype store", "zh-Hant": "原型庫中全部 CS／TR 工單" },
  "cs.dash.openCount": { en: "Open", "zh-Hant": "未結" },
  "cs.dash.resolved": { en: "Resolved", "zh-Hant": "已結" },
  "cs.dash.waiting": { en: "WAITING mail", "zh-Hant": "WAITING 信件" },
  "cs.dash.waitingHint": { en: "Auto-email still waiting for a client reply", "zh-Hant": "自動信件仍在等客戶回覆" },
  "cs.dash.tr": { en: "TR / assigned", "zh-Hant": "TR／已派" },
  "cs.dash.trHint": { en: "Desk TR or status ASSIGNED_TR", "zh-Hant": "台面 TR 或狀態已派 TR" },
  "cs.dash.risk": { en: "Escalated Risk", "zh-Hant": "已升級風控" },
  "cs.dash.riskHint": { en: "Left CS/TR onto the risk spine", "zh-Hant": "已離開 CS／TR 進入風控脊柱" },
  "cs.dash.cap3": { en: "Follow-up cap", "zh-Hant": "追問上限" },
  "cs.dash.cap3Hint": { en: "followup_count ≥ cs.followup_cap (default 3) — CS Lead human", "zh-Hant": "追問次數 ≥ cs.followup_cap（預設 3）— 客服主管人工" },
  "cs.dash.idVerify": { en: "ID verify", "zh-Hant": "身分驗證" },
  "cs.dash.awaiting": { en: "Awaiting client", "zh-Hant": "待客戶" },
  "cs.dash.csDesk": { en: "CS desk", "zh-Hant": "CS 台" },
  "cs.dash.trDesk": { en: "TR desk", "zh-Hant": "TR 台" },
  "cs.dash.byChannel": { en: "By channel", "zh-Hant": "依渠道" },
  "cs.dash.byStatus": { en: "By status", "zh-Hant": "依狀態" },
  "cs.dash.bySkill": { en: "By skill", "zh-Hant": "依技能" },
  "cs.dash.byDesk": { en: "By desk", "zh-Hant": "依台面" },
  "cs.dash.byClarity": { en: "By AI clarity", "zh-Hant": "依 AI 清晰度" },
  "cs.dash.bySeverity": { en: "By severity", "zh-Hant": "依嚴重度" },
  "cs.dash.pocReview": { en: "POC review", "zh-Hant": "POC 審閱" },
  "cs.dash.pocHint": { en: "Sensitive drafts waiting for a named POC", "zh-Hant": "敏感草稿待具名 POC" },
  "cs.dash.aiReplied": { en: "AI replied", "zh-Hant": "AI 已回" },
  "cs.dash.aiHint": { en: "Low-sensitivity FAQ AI already emailed", "zh-Hant": "低敏感 FAQ 已由 AI 寄出" },
  "cs.dash.empty": { en: "No CS/TR rows yet.", "zh-Hant": "尚無 CS／TR 列。" },
  "cs.dash.waitingList": { en: "Waiting for client reply", "zh-Hant": "等待客戶回覆" },
  "cs.dash.waitingEmpty": { en: "No WAITING auto-mail right now.", "zh-Hant": "目前沒有 WAITING 自動信。" },
  "cs.dash.recent": { en: "Recently updated", "zh-Hant": "最近更新" },
  "cs.dash.colId": { en: "Request", "zh-Hant": "案件" },
  "cs.dash.colSubject": { en: "Subject", "zh-Hant": "主旨" },
  "cs.dash.colDesk": { en: "Desk", "zh-Hant": "台面" },
  "cs.log.hint": {
    en: "CS_* actions on cs_request, plus resolved packs. Risk Log Analytics still holds Monitor closed tickets. The Audit page still has CRMP / Vantage tabs.",
    "zh-Hant": "cs_request 上的 CS_* 動作，加上已結包。風險日誌分析仍放 Monitor 已關工單。稽核頁仍有 CRMP／Vantage 分頁。",
  },
  "cs.log.open": { en: "Open CS / TR log", "zh-Hant": "開啟 CS／TR 日誌" },
  "cs.data.open": { en: "Open CS / TR data", "zh-Hant": "開啟 CS／TR 資料" },
  "cs.data.hint": {
    en: "Supporting records for the CS/TR door: Customer Service and Trading BUs, CS 24/7 Desk, CS KYC Vault, TR Dealing Support, named POCs, ESC-CS-24-7 / ESC-CS-KYC / ESC-TR-DEAL / ESC-CS-RISK hops, and cs.* parameters (cap, SLA, token, mailboxes). Edit on BU and Teams, Escalation Routes, Platform Settings, Data Sources and Lark.",
    "zh-Hant": "CS／TR 大門的配套資料：客服與交易 BU、CS 24/7 台、CS 核身庫、TR 成交支援、具名 POC、ESC-CS-24-7／ESC-CS-KYC／ESC-TR-DEAL／ESC-CS-RISK 關卡，以及 cs.* 參數（上限、SLA、token、信箱）。請在 BU 與團隊、升級路徑、平台設定、資料來源與 Lark 編輯。",
  },
  "cs.data.linkOrg": { en: "BU and Teams", "zh-Hant": "BU 與團隊" },
  "cs.data.linkEsc": { en: "Escalation routes", "zh-Hant": "升級路徑" },
  "cs.data.linkSettings": { en: "cs.* settings", "zh-Hant": "cs.* 設定" },
  "cs.data.linkSources": { en: "Data sources", "zh-Hant": "資料來源" },
  "cs.data.linkLark": { en: "Lark channels", "zh-Hant": "Lark 頻道" },
  "cs.data.cap": { en: "Follow-up cap", "zh-Hant": "追問上限" },
  "cs.data.waitSla": { en: "Wait SLA", "zh-Hant": "等待 SLA" },
  "cs.data.kycSla": { en: "KYC SLA", "zh-Hant": "核身 SLA" },
  "cs.data.trSla": { en: "TR SLA", "zh-Hant": "TR SLA" },
  "cs.data.riskSla": { en: "Risk SLA", "zh-Hant": "風控 SLA" },
  "cs.data.token": { en: "Intake token", "zh-Hant": "進件 token" },
  "cs.data.autoMax": { en: "AI auto-reply max", "zh-Hant": "AI 直回上限" },
  "cs.data.sensitive": { en: "POC categories", "zh-Hant": "POC 類別" },
  "cs.data.bus": { en: "Business units", "zh-Hant": "事業單位" },
  "cs.data.teams": { en: "Teams", "zh-Hant": "團隊" },
  "cs.data.people": { en: "people", "zh-Hant": "人" },
  "cs.data.team": { en: "Team", "zh-Hant": "團隊" },
  "cs.data.bu": { en: "BU", "zh-Hant": "BU" },
  "cs.data.lark": { en: "Lark", "zh-Hant": "Lark" },
  "cs.data.rota": { en: "On-call", "zh-Hant": "值班" },
  "cs.data.pocs": { en: "POCs", "zh-Hant": "窗口" },
  "cs.data.routes": { en: "Escalation hops", "zh-Hant": "升級關卡" },
  "cs.data.mailboxes": { en: "Official mailboxes", "zh-Hant": "官方信箱" },
  "cs.data.support": { en: "Support", "zh-Hant": "客服" },
  "cs.data.complaints": { en: "Complaints", "zh-Hant": "投訴" },
  "cs.data.sources": { en: "Data sources", "zh-Hant": "資料來源" },
  "cs.data.buChip": { en: "BU", "zh-Hant": "BU" },
  "cs.log.timeline": { en: "CS / TR timeline", "zh-Hant": "CS／TR 時間軸" },
  "cs.log.empty": { en: "No CS_* events yet. Intake on the desk writes the first rows.", "zh-Hant": "尚無 CS_* 事件。台面進件會寫入第一列。" },
  "cs.log.searchPh": { en: "Filter actor, CSR-XXXX, or action…", "zh-Hant": "篩選操作者、CSR-XXXX 或動作…" },
  "cs.log.resolved": { en: "Resolved request packs", "zh-Hant": "已結案件包" },
  "cs.log.resolvedEmpty": { en: "No resolved CS/TR requests yet.", "zh-Hant": "尚無已結 CS／TR 請求。" },
  "cs.portalLink": { en: "Open client intake portal", "zh-Hant": "開啟客戶進件入口" },
  "cs.portal.title": { en: "Talk to CS / TR", "zh-Hant": "聯絡客服／交易台" },
  "cs.portal.blurb": {
    en: "Live C1 chat, the website form and official email all land on the same CRMP desk in realtime. If AI is unclear or needs ID, it emails you and waits until you reply.",
    "zh-Hant": "C1 即時聊天、網站表單與官方信箱都會即時進到同一 CRMP 台面。AI 若不清楚或需核身，會寄信給你並等到你回覆。",
  },
  "cs.portal.hint.C1_LIVE_CHAT": {
    en: "This is the platform live-chat widget. Follow-up messages in this tab stay on the same C1 thread.",
    "zh-Hant": "這是平台即時聊天視窗。此分頁後續訊息會留在同一個 C1 對話。",
  },
  "cs.portal.hint.WEB_FORM": {
    en: "Website / app submission form. Posts to POST /api/cs/intake with channel WEB_FORM.",
    "zh-Hant": "網站／App 提交表單。送到 POST /api/cs/intake，渠道 WEB_FORM。",
  },
  "cs.portal.hint.OFFICIAL_EMAIL": {
    en: "Official support mailbox. Put CSR-XXXX in the subject or In-Reply-To to continue a waiting auto-email.",
    "zh-Hant": "官方客服信箱。主旨或 In-Reply-To 填 CSR-XXXX 即可續辦等待中的自動信件。",
  },
  "cs.portal.name": { en: "Your name", "zh-Hant": "姓名" },
  "cs.portal.email": { en: "Email", "zh-Hant": "電子郵件" },
  "cs.portal.uid": { en: "Account UID (optional)", "zh-Hant": "帳戶 UID（選填）" },
  "cs.portal.subject": { en: "Subject", "zh-Hant": "主旨" },
  "cs.portal.subjectPh": {
    en: "Include request CSR-XXXX to reply to an auto-email",
    "zh-Hant": "回覆自動信件請在主旨加上案件 CSR-XXXX",
  },
  "cs.portal.inReply": { en: "In-Reply-To / ticket (optional)", "zh-Hant": "回覆對象／案件號（選填）" },
  "cs.portal.messagePh": {
    en: "What happened? Try a short “help me ???” to see the auto-email, or mention passport / cannot login for ID verify.",
    "zh-Hant": "發生什麼事？可試短句「help me ???」觸發自動信件，或提到護照／登不進去以核身。",
  },
  "cs.portal.chatEmpty": {
    en: "No messages yet. Type below — this is the live C1 channel.",
    "zh-Hant": "尚無訊息。在下方輸入 — 這就是 C1 即時渠道。",
  },
  "cs.portal.sendChat": { en: "Send chat", "zh-Hant": "送出聊天" },
  "cs.portal.submit": { en: "Submit request", "zh-Hant": "送出請求" },
  "cs.portal.received": { en: "Request {id} received on the CS/TR desk.", "zh-Hant": "案件 {id} 已進到 CS／TR 台。" },
  "cs.portal.mailed": {
    en: "Request {id} is waiting on you — AI sent an official email asking for more detail or ID.",
    "zh-Hant": "案件 {id} 正在等你 — AI 已寄出官方信件，請補充說明或核身資料。",
  },
  "cs.portal.replied": {
    en: "Reply on {id} received. The waiting auto-email is closed and AI will re-triage.",
    "zh-Hant": "案件 {id} 的回覆已收到。等待中的自動信件已關閉，AI 將重新分流。",
  },
  "cs.portal.failed": { en: "Could not reach the intake API. Use localhost:3000 for live posts.", "zh-Hant": "無法連到進件 API。即時送出請用 localhost:3000。" },
  "cs.portal.staticNote": {
    en: "Static snapshot — the three connectors still render here. Live POST /api/cs/intake runs on localhost.",
    "zh-Hant": "靜態快照 — 三個連接器仍會顯示。即時 POST /api/cs/intake 請在本機執行。",
  },
  "cs.portal.continued": { en: "Continued existing ticket", "zh-Hant": "續辦既有案件" },
  "cs.portal.resultHint": {
    en: "The CS/TR desk sees this in realtime. If status is AWAITING CLIENT or ID VERIFY, reply here or to the official email until AI has enough.",
    "zh-Hant": "CS／TR 台會即時看到此案件。若狀態為待客戶或身分驗證，請在此或回官方信件，直到 AI 資料齊全。",
  },
  "cs.portal.waitingMail": { en: "Automatic official email is waiting for your reply", "zh-Hant": "自動官方信件正在等你回覆" },
  "cs.portal.apiHint": {
    en: "C1, the form and the mailbox share this webhook (header x-cs-intake-token: demo-c1).",
    "zh-Hant": "C1、表單與信箱共用此 webhook（標頭 x-cs-intake-token: demo-c1）。",
  },
  "home.csPortal": {
    en: "Client-facing C1 chat, submission form and official mailbox — same intake API as the desk.",
    "zh-Hant": "客戶端 C1 聊天、提交表單與官方信箱 — 與台面同一進件 API。",
  },
  "home.csPortalCta": { en: "Open client portal", "zh-Hant": "開啟客戶入口" },
  "home.dummyTitle": { en: "Dummy spine run", "zh-Hant": "虛擬脊柱演練" },
  "home.dummyHint": {
    en: "Raise a dummy Monitor 2.0 alert (or a linked group). CRMP walks DETECT → AI (skill or RAG) → messenger → maker/checker → escalate → close, then highlights the cards and spine on this page. Audit and Risk Log keep the trail.",
    "zh-Hant": "發出一則虛擬 Monitor 2.0 警報（或一組連動警報）。CRMP 會走完 DETECT → AI（技能或 RAG）→ Messenger → Maker／Checker → 升級 → 結案，並在本頁標出卡片與脊柱。稽核與風險日誌會留下紀錄。",
  },
  "home.dummyOne": { en: "Dummy alert", "zh-Hant": "虛擬警報" },
  "home.dummyGroup": { en: "Dummy alert group", "zh-Hant": "虛擬警報組" },
  "home.dummyWorking": { en: "Walking the spine", "zh-Hant": "正在走脊柱" },
  "home.dummyDone": {
    en: "Dummy run closed {n} alert(s). Highlighted below and on the spine; check Messenger, Audit and Risk Log.",
    "zh-Hant": "虛擬演練已結案 {n} 則警報。已在下方與脊柱標出；請查看 Messenger、稽核與風險日誌。",
  },
  "home.dummyFailed": { en: "Dummy spine run failed", "zh-Hant": "虛擬脊柱演練失敗" },

  "login.title": {
    en: "Centralised Risk Management Platform",
    "zh-Hant": "集中式風險管理平台",
  },
  "login.blurb": {
    en: "Upgraded CRMP: Risk, Ops, AI, System, 24/7 CS and TR dealing — original risk spine plus C1/form/email intake, wired to Monitor 2.0 and Lark escalations across CFD and crypto.",
    "zh-Hant": "升級版 CRMP：風險、營運、AI、系統、24/7 客服與交易台 — 原風險脊柱加上 C1／表單／信箱進件，串接 Monitor 2.0 與 Lark 升級，涵蓋 CFD 與加密交易所。",
  },
  "login.signIn": { en: "Sign in to Admin", "zh-Hant": "登入管理後台" },
  "login.hint": {
    en: "Optional — the admin is public. Sign in as demo platform owner or another named role.",
    "zh-Hant": "可選 — 管理後台已公開。可以示範平台負責人或其他具名角色登入。",
  },
  "login.email": { en: "Email", "zh-Hant": "電子郵件" },
  "login.password": { en: "Password", "zh-Hant": "密碼" },
  "login.submit": { en: "Sign in", "zh-Hant": "登入" },
  "login.demoRoles": { en: "Quick fill demo role", "zh-Hant": "快速填入示範角色" },
  "login.failed": { en: "Login failed", "zh-Hant": "登入失敗" },

  "urls.pages": { en: "Admin / auth / CS pages", "zh-Hant": "管理／登入／CS 頁" },
  "urls.apis": { en: "API routes", "zh-Hant": "API 路由" },
  "urls.data": { en: "Data / tables", "zh-Hant": "資料／資料表" },
  "urls.inbox": { en: "Demo inbox", "zh-Hant": "示範收件匣" },
  "urls.csCount": { en: "CS / TR rows", "zh-Hant": "CS／TR 列" },
  "urls.messengerLabel": { en: "CRMP Plus Messenger", "zh-Hant": "CRMP Plus Messenger" },
  "urls.deskLabel": { en: "CS / TR Desk", "zh-Hant": "CS／TR 台" },
  "urls.dashLabel": { en: "CS / TR Dashboard", "zh-Hant": "CS／TR 儀表板" },
  "urls.logLabel": { en: "CS / TR Log", "zh-Hant": "CS／TR 日誌" },
  "urls.dataLabel": { en: "CS / TR Data", "zh-Hant": "CS／TR 資料" },
  "urls.portalLabel": { en: "CS client portal", "zh-Hant": "CS 客戶入口" },
  "urls.jumpCs": { en: "Jump to CS / TR section", "zh-Hant": "跳至 CS／TR 區段" },
  "urls.publicNote": {
    en: "All catalogued URLs are public in this prototype — no login required. Sign in only to act as a named persona. This upgraded platform lives at https://hxyan2020.github.io/PRD/crmp-plus/admin/. Original CRMP Admin remains frozen at https://hxyan2020.github.io/PRD/crmp-admin/admin/. Client intake is https://hxyan2020.github.io/PRD/crmp-plus/cs/.",
    "zh-Hant": "本原型目錄中的所有網址皆公開，無需登入。僅在要以具名角色操作時才需登入。本升級平台網址：https://hxyan2020.github.io/PRD/crmp-plus/admin/。原 CRMP 管理後台仍凍結於 https://hxyan2020.github.io/PRD/crmp-admin/admin/。客戶進件：https://hxyan2020.github.io/PRD/crmp-plus/cs/。",
  },
  "urls.plusLabel": { en: "CRMP Plus (this platform)", "zh-Hant": "CRMP Plus（本平台）" },
  "urls.frozenLabel": { en: "Original CRMP Admin (frozen)", "zh-Hant": "原 CRMP 管理後台（凍結）" },
  "urls.csCheat": {
    en: "CS/TR door: public /cs (C1 live chat, website form, official mailbox) posts POST /api/cs/intake. Replies with CSR-XXXX or channel_ref close WAITING auto-mail (cap from cs.followup_cap). After facts are collected AI categorises, assigns severity, drafts a solution, and either replies or holds for a named POC (cs.auto_reply_max_severity / cs.sensitive_categories). Operators work /admin/cs-desk. KPIs live on /admin/cs-dashboard; CS_* timeline on /admin/cs-log; BU/team/escalation/parameters on /admin/cs-data (not Daily Performance / Risk Log). GET /api/cs/intake lists connectors; GET /api/cs?view=data is the live contract. Five SKILL.md playbooks and cs-* RAG leaves sit in the CS / TR section.",
    "zh-Hant": "CS／TR 大門：公開 /cs（C1 即時聊天、網站表單、官方信箱）走 POST /api/cs/intake。回覆帶 CSR-XXXX 或 channel_ref 會關閉 WAITING 自動信（上限來自 cs.followup_cap）。資料齊全後 AI 分類、給嚴重度、起草方案，並依 cs.auto_reply_max_severity／cs.sensitive_categories 直回或交具名 POC。操作者在 /admin/cs-desk。指標在 /admin/cs-dashboard；CS_* 時間軸在 /admin/cs-log；BU／團隊／升級／參數在 /admin/cs-data（不是每日績效／風險日誌）。GET /api/cs/intake 列連接器；GET /api/cs?view=data 為即時契約。五本 SKILL.md 與 cs-* RAG 葉在 CS／TR 區段。",
  },
  "home.plusBanner": {
    en: "CRMP Plus is the upgraded platform: original CRMP risk spine plus 24/7 CS/TR. Future requirements apply only here. Original CRMP Admin stays at its own URL.",
    "zh-Hant": "CRMP Plus 是升級平台：原 CRMP 風險脊柱加上 24/7 客服與交易台。後續需求只加在這裡。原 CRMP 管理後台保留獨立網址。",
  },
  "urls.cheat": {
    en: "Demo Messenger actions: show_evidence · chat · escalate · dismiss · close · recommend → double-confirm → Vantage admin ref · checker_approve when required.",
    "zh-Hant": "示範 Messenger 動作：顯示證據 · 聊天 · 升級 · 排除 · 結案 · 建議 → 雙重確認 → Vantage 管理參照 · 必要時 Checker 核准。",
  },
  "common.openMessenger": { en: "Open Demo Messenger", "zh-Hant": "開啟示範 Messenger" },

  "skill.eyebrow": { en: "Risk scenarios", "zh-Hant": "風險情境" },
  "skill.boardIntro": {
    en: "Each skill is a SKILL.md-style playbook: when to use, when not to, prechecks, steps, evidence, stop conditions and success criteria. Cards stay compact — click Enter for the full page.",
    "zh-Hant": "每項技能皆為 SKILL.md 風格劇本：何時用、何時不用、前置檢查、步驟、證據、停止條件與成功標準。卡片保持精簡 — 點「進入」看完整頁。",
  },
  "skill.tabSkills": { en: "Single-indicator skills", "zh-Hant": "單指標技能" },
  "skill.tabChains": { en: "Linked timelines", "zh-Hant": "連結時間鏈" },
  "skill.search": { en: "Search indicator, fault area, scenario code…", "zh-Hant": "搜尋指標、故障區域、情境代碼…" },
  "skill.enter": { en: "Enter", "zh-Hant": "進入" },
  "skill.back": { en: "Back to skills", "zh-Hant": "返回技能列表" },
  "skill.tree": { en: "Knowledge tree", "zh-Hant": "知識樹" },
  "skill.manual": { en: "manual", "zh-Hant": "人工" },
  "skill.auto": { en: "auto-execute", "zh-Hant": "自動執行" },
  "skill.whenToUse": { en: "When to use", "zh-Hant": "何時使用" },
  "skill.whenNot": { en: "When not to use", "zh-Hant": "何時不要用" },
  "skill.inputs": { en: "Inputs", "zh-Hant": "輸入" },
  "skill.outputs": { en: "Outputs", "zh-Hant": "輸出" },
  "skill.prechecks": { en: "Prechecks", "zh-Hant": "前置檢查" },
  "skill.indicator": { en: "Indicator & thresholds", "zh-Hant": "指標與門檻" },
  "skill.faults": { en: "Fault areas", "zh-Hant": "故障區域" },
  "skill.escalation": { en: "Escalation", "zh-Hant": "升級" },
  "skill.steps": { en: "Playbook steps", "zh-Hant": "劇本步驟" },
  "skill.corrections": { en: "Correction actions by BU", "zh-Hant": "各 BU 矯正動作" },
  "skill.evidence": { en: "Evidence to collect", "zh-Hant": "應蒐集證據" },
  "skill.stop": { en: "Stop conditions", "zh-Hant": "停止條件" },
  "skill.success": { en: "Success criteria", "zh-Hant": "成功標準" },
  "skill.related": { en: "Related indicators", "zh-Hant": "相關指標" },
  "skill.examples": { en: "Worked examples", "zh-Hant": "已驗證案例" },
  "skill.humanGate": { en: "human gate", "zh-Hant": "人工關卡" },
  "skill.aiAnalyses": { en: "AI analyses", "zh-Hant": "AI 分析" },
  "skill.riskLog": { en: "Risk log", "zh-Hant": "風險日誌" },
  "skill.timeline": { en: "Indicator timeline", "zh-Hant": "指標時間軸" },
  "skill.causes": { en: "Likely causes", "zh-Hant": "可能原因" },
  "skill.linked": { en: "Linked skills", "zh-Hant": "連結技能" },

  "mi.eyebrow": { en: "LP price-moving intelligence", "zh-Hant": "會移動 LP 報價的情報" },
  "mi.intro": {
    en: "Scrapes news, social, official and exchange publications every 5 minutes for forex, index, commodity, futures and crypto. Findings push to Lark group oc_market_intelligence and feed indicator M2-MKT-INTEL.",
    "zh-Hant": "每五分鐘掃描新聞、社群、官方與交易所公告（外匯、指數、商品、期貨、加密）。發現推送至 Lark 群 oc_market_intelligence，並餵給指標 M2-MKT-INTEL。",
  },
  "mi.scan": { en: "Scan now", "zh-Hant": "立即掃描" },
  "mi.scanning": { en: "Scanning…", "zh-Hant": "掃描中…" },
  "mi.disable": { en: "Disable scheduler", "zh-Hant": "停用排程" },
  "mi.enable": { en: "Enable scheduler", "zh-Hant": "啟用排程" },
  "mi.playbook": { en: "Skill playbook", "zh-Hant": "技能劇本" },
  "mi.staticScan": {
    en: "GitHub Pages is a read-only snapshot, so live Scan cannot call /api. Demo scan recorded from seeded findings — run Scan on localhost:3000/admin/market-intel for a live pass.",
    "zh-Hant": "GitHub Pages 為唯讀快照，無法呼叫 /api 做即時掃描。已用種子發現記錄示範掃描 — 請在 localhost:3000/admin/market-intel 執行即時掃描。",
  },
  "mi.demoScan": {
    en: "Scan {scan_id}: {n} new finding(s) → {pushed} pushed to messenger. Public snapshot uses a local demo scan (GitHub Pages has no /api).",
    "zh-Hant": "掃描 {scan_id}：{n} 筆新發現 → {pushed} 筆已推送至 Messenger。公開快照使用本機示範掃描（GitHub Pages 沒有 /api）。",
  },
  "mi.findings": { en: "Findings (loaded)", "zh-Hant": "已載入發現" },
  "mi.highImpact": { en: "high-impact", "zh-Hant": "高影響" },
  "mi.sources": { en: "Sources", "zh-Hant": "來源" },
  "mi.schedOn": { en: "Scheduler ON", "zh-Hant": "排程開啟" },
  "mi.schedOff": { en: "Scheduler OFF", "zh-Hant": "排程關閉" },
  "mi.pushes": { en: "Messenger pushes", "zh-Hant": "Messenger 推送" },
  "mi.live": { en: "Live indicator", "zh-Hant": "即時指標" },
  "mi.tabFindings": { en: "Findings", "zh-Hant": "發現" },
  "mi.tabMessenger": { en: "Messenger outbox", "zh-Hant": "Messenger 寄件匣" },
  "mi.tabSources": { en: "Sources", "zh-Hant": "來源" },
  "mi.tabScans": { en: "Scan log", "zh-Hant": "掃描紀錄" },

  "tree.domains": { en: "Risk domains", "zh-Hant": "風險領域" },
  "tree.skills": { en: "Skill playbooks", "zh-Hant": "技能劇本" },
  "tree.chains": { en: "Linked timelines", "zh-Hant": "連結時間鏈" },
  "tree.rag": { en: "RAG corpus", "zh-Hant": "RAG 語料" },
  "tree.hint": {
    en: "This map is the knowledge tree: CRMP → risk domains → skill playbooks, with linked timelines and RAG documents on the side branches. Click a node to inspect it; Enter opens the source page.",
    "zh-Hant": "這張圖就是知識樹：CRMP → 風險領域 → 技能劇本，側枝為連結時間鏈與 RAG 文件。點節點可檢視；「進入」打開來源頁。",
  },
  "tree.map": { en: "Tree map", "zh-Hant": "樹狀圖" },
  "tree.outline": { en: "Outline", "zh-Hant": "大綱" },
  "tree.allProducts": { en: "All products", "zh-Hant": "全部產品" },
  "tree.clickNode": {
    en: "Click a domain to fan out its skills. Click a skill to inspect; Enter opens the SKILL.md playbook. Switch to Linked timelines or RAG corpus for the other trunks.",
    "zh-Hant": "點領域展開技能。點技能可檢視；「進入」打開 SKILL.md 劇本。切換「連結時間鏈」或「RAG 語料」看另外兩幹。",
  },
  "tree.enter": { en: "Enter", "zh-Hant": "進入" },
  "tree.enterPlaybook": { en: "Enter full playbook", "zh-Hant": "進入完整劇本" },
  "tree.inspector": { en: "Selected node", "zh-Hant": "選中節點" },
  "tree.inspectorEmpty": {
    en: "Click a skill, timeline or RAG category on the tree. The node details and links land here.",
    "zh-Hant": "在樹上點技能、時間鏈或 RAG 分類，詳情與連結會顯示於此。",
  },
  "tree.skillsInDomain": { en: "skills in this domain", "zh-Hant": "此領域技能" },
  "tree.openRag": { en: "Open RAG library", "zh-Hant": "開啟 RAG 知識庫" },
  "tree.openDoc": { en: "Open this document", "zh-Hant": "開啟此文件" },
  "tree.linkedDocs": { en: "Linked RAG docs", "zh-Hant": "連結 RAG 文件" },
  "tree.ragCatHint": {
    en: "Category nodes expand into document leaves. Click a document for tags and a deep link into the library.",
    "zh-Hant": "分類節點會展開為文件葉節點。點選文件可查看標籤並深連結至知識庫。",
  },
  "tree.linkedSkills": { en: "Linked skills", "zh-Hant": "連結技能" },
  "tree.hubSub": { en: "knowledge tree", "zh-Hant": "知識樹" },

  "nav.unread": { en: "unread", "zh-Hant": "未讀" },
  ...EXTRA_UI,
};

export function parseUiLocale(raw?: string | null): UiLocale {
  const v = (raw || "").toLowerCase();
  if (v === "zh-hant" || v === "zh-tw" || v === "zh" || v === "zh_hant") return "zh-Hant";
  return "en";
}

export function navLabel(href: string, locale: UiLocale, fallback: string) {
  return NAV_I18N[href]?.[locale] || fallback;
}

export function shellCopy(locale: UiLocale) {
  return {
    brandEyebrow: t("shell.brandEyebrow", locale),
    brandTitle: t("shell.brandTitle", locale),
    brandSub: t("shell.brandSub", locale),
    headerEyebrow: t("shell.headerEyebrow", locale),
    headerTitle: t("shell.headerTitle", locale),
    messenger: t("shell.messenger", locale),
    indicators: t("shell.indicators", locale),
    signOut: t("shell.signOut", locale),
    signIn: t("shell.signIn", locale),
    publicMode: t("shell.publicMode", locale),
    menu: t("shell.menu", locale),
    language: t("shell.language", locale),
    unread: t("nav.unread", locale),
  };
}

export function pageMeta(key: string, locale: UiLocale) {
  const m = PAGE_META[key];
  if (!m) return { title: key, subtitle: "" };
  return { title: m.title[locale], subtitle: m.subtitle[locale] };
}

export function t(key: string, locale: UiLocale, vars?: Record<string, string | number>) {
  let s = UI[key]?.[locale] || UI[key]?.en || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

export function actionLabel(href: string, locale: UiLocale) {
  return navLabel(href, locale, href);
}

export function deptLabelI18n(code: string | null | undefined, locale: UiLocale = "en") {
  if (!code) return "—";
  const key = `dept.${code}`;
  if (UI[key]) return t(key, locale);
  return code;
}

export function statusLabel(value: string, locale: UiLocale = "en") {
  const pair = STATUS_LABELS[value];
  if (!pair) return value;
  return pair[locale] || pair.en;
}

export function stageLabel(stage: string, locale: UiLocale = "en") {
  const pair = STAGE_LABELS[stage];
  if (!pair) return stage;
  return pair[locale] || pair.en;
}

/** Translate a known English operational phrase; unknown text is left as-is. */
export function phrase(text: string | null | undefined, locale: UiLocale = "en") {
  if (!text) return "";
  if (locale !== "zh-Hant") return text;
  if (PHRASES_ZH[text]) return PHRASES_ZH[text];
  let out = text;
  for (const en of DUMMY_PHRASE_FRAGMENTS) {
    const zh = PHRASES_ZH[en];
    if (zh && out.includes(en)) out = out.split(en).join(zh);
  }
  if (out !== text) return out;
  const detect = text.match(/^DUMMY detect (.+) → (.+)$/);
  if (detect) return `虛擬偵測 ${detect[1]} → ${detect[2]}`;
  const alarm = text.match(/^DUMMY alarm (.+) \((.+)\)$/);
  if (alarm) return `虛擬警報 ${alarm[1]}（${alarm[2]}）`;
  const closed = text.match(/^DUMMY closed (.+)$/);
  if (closed) return `虛擬結案 ${closed[1]}`;
  const board = text.match(/^DUMMY outcome rolled to desk board \((.+)\)$/);
  if (board) return `虛擬結果已入台面儀表板（${board[1]}）`;
  const pretty = text.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return PHRASES_ZH[pretty] || text;
}
