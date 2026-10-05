import { EXTRA_UI, PHRASES_ZH, STAGE_LABELS, STATUS_LABELS } from "@/lib/i18n-extra";

export type UiLocale = "en" | "zh-Hant";

export const UI_LOCALE_COOKIE = "crmp_ui_lang";

type Pair = { en: string; "zh-Hant": string };

const NAV_I18N: Record<string, Pair> = {
  "/admin": { en: "Admin Home", "zh-Hant": "管理首頁" },
  "/admin/dashboard": { en: "Daily Performance", "zh-Hant": "每日績效" },
  "/admin/risk-log": { en: "Risk Log Analytics", "zh-Hant": "風險日誌分析" },
  "/admin/market-intel": { en: "Market Intelligence", "zh-Hant": "市場情報" },
  "/admin/detectors": { en: "Detectors", "zh-Hant": "偵測器" },
  "/admin/alerts": { en: "Realtime Alert & Tracker", "zh-Hant": "即時警報與追蹤" },
  "/admin/ai-analyses": { en: "Realtime Alert & Tracker", "zh-Hant": "即時警報與追蹤" },
  "/admin/ai-admin": { en: "AI Admin", "zh-Hant": "AI 管理" },
  "/admin/interventions": { en: "Human Intervention", "zh-Hant": "人工干預" },
  "/admin/spine": { en: "Spine Log", "zh-Hant": "脊柱日誌" },
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
  "/admin/messenger": { en: "Demo Messenger", "zh-Hant": "示範 Messenger" },
  "/admin/security/ai-access": { en: "AI Access Security", "zh-Hant": "AI 存取安全" },
  "/admin/departments": { en: "Departments", "zh-Hant": "部門" },
  "/admin/teams": { en: "Teams", "zh-Hant": "團隊" },
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
      en: "Click any card to open its page — counts, alerts, the messenger demo, and the rest of the desk.",
      "zh-Hant": "點任何卡片即可開啟對應頁面 — 計數、警報、Messenger 示範與其他功能。",
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
      en: "Closed tickets land here with the same tracker pack as Realtime Alert — ticket-closed status, AI analysis, AI/BU action logs, mandated solution — plus category, handling time, loss vs prevented, and loophole areas.",
      "zh-Hant": "已關閉工單以與即時警報相同的追蹤包落地於此 — 工單已關閉狀態、AI 分析、AI／各 BU 動作紀錄、核定方案 — 另含類別、處理時間、損失 vs 防損與漏洞領域。",
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
      en: "Open queue only. Expand a ticket for facts, admin URL, AI RCA, severity, POC, pending admin or RO approval, escalation and action log. Closed tickets live in Risk Log Analytics.",
      "zh-Hant": "僅顯示未結佇列。展開工單可看事實、管理後台網址、AI 根因、嚴重度、承辦 POC、待管理員變更或 RO 核准、升級路徑與動作紀錄。已關閉工單在風險日誌分析。",
    },
  },
  "ai-analyses": {
    title: { en: "AI Analyses", "zh-Hant": "AI 分析" },
    subtitle: {
      en: "Auto-triggered when Monitor 2.0 indicators alarm. Skill path when certain; otherwise RAG. BREACH/CRITICAL also receive an independent second-AI challenge.",
      "zh-Hant": "Monitor 2.0 警報時自動觸發。確定時走 Skill，否則 RAG。BREACH／CRITICAL 另有獨立第二 AI 挑戰。",
    },
  },
  "ai-admin": {
    title: { en: "AI Admin", "zh-Hant": "AI 管理" },
    subtitle: {
      en: "Configure AI parameters, training, accuracy history, skills and RAG — with maker/checker dual control before changes apply.",
      "zh-Hant": "設定 AI 參數、訓練、準確率、Skills 與 RAG — 變更前需 Maker／Checker 雙重控制。",
    },
  },
  interventions: {
    title: { en: "Human Intervention", "zh-Hant": "人工干預" },
    subtitle: {
      en: "Approve or reject AI/skill actions awaiting human gates. Decisions are logged to the spine and audit trail.",
      "zh-Hant": "核准或駁回待人工關卡之 AI／Skill 動作。決策寫入脊柱與稽核軌跡。",
    },
  },
  spine: {
    title: { en: "Spine Log", "zh-Hant": "脊柱日誌" },
    subtitle: {
      en: "End-to-end pipeline trail: Detectors → Alarm → AI RCA → Skill execute → Human intervention → Resolved → Dashboard.",
      "zh-Hant": "端到端管線軌跡：偵測 → 警報 → AI RCA → Skill 執行 → 人工干預 → 結案 → 儀表板。",
    },
  },
  rag: {
    title: { en: "RAG Knowledge Base", "zh-Hant": "RAG 知識庫" },
    subtitle: {
      en: "Internal static business corpus for Vantage Markets — policies, products, entities, platforms.",
      "zh-Hant": "Vantage Markets 內部靜態業務語料 — 政策、產品、實體、平台。",
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
      en: "Prototype Lark-style inbox: alerts + AI reports with inline evidence, chatbot challenge, escalate, dismiss, close, and confirmed control actions into Vantage admin.",
      "zh-Hant": "原型 Lark 風格收件匣：警報＋AI 報告，內嵌證據、聊天挑戰、升級、排除、結案，以及確認後送至 Vantage 管理後台之控制動作。",
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
      en: "Company messenger for severity-routed escalations, on-call pages and dual-control approvals.",
      "zh-Hant": "依嚴重度路由升級、值班叫應與雙重控制核准之企業即時通訊。",
    },
  },
  escalation: {
    title: { en: "Escalation Routes", "zh-Hant": "升級路徑" },
    subtitle: {
      en: "Severity → team → SLA mapping used by Demo Messenger and Lark notify.",
      "zh-Hant": "嚴重度 → 團隊 → SLA 對映，供示範 Messenger 與 Lark 通知使用。",
    },
  },
  departments: {
    title: { en: "Departments", "zh-Hant": "部門" },
    subtitle: {
      en: "Click any duty to unfold what that BU actually does; click again to fold it.",
      "zh-Hant": "點任何職責展開該 BU 實際在做什麼；再點一次即可收合。",
    },
  },
  teams: {
    title: { en: "Teams", "zh-Hant": "團隊" },
    subtitle: {
      en: "On-call teams linked to Lark channels and escalation routes.",
      "zh-Hant": "連結 Lark 頻道與升級路徑之值班團隊。",
    },
  },
  roles: {
    title: { en: "Roles & Permissions", "zh-Hant": "角色與權限" },
    subtitle: {
      en: "RBAC matrix plus detailed owns / does / does-not / escalation for each CRMP role.",
      "zh-Hant": "RBAC 矩陣，並附各 CRMP 角色之擁有／日常／不做／升級細節。",
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
      en: "Two visual spheres: CFD book vs crypto Exchange — owner, supporting BUs and coverage.",
      "zh-Hant": "兩個視覺圈：CFD 帳簿對加密交易所 — 負責人、支援 BU 與覆蓋範圍。",
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
      en: "Immutable trail of admin and messenger mutations.",
      "zh-Hant": "管理與 Messenger 變更之不可變軌跡。",
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
      en: "Admin pages, APIs, local SQLite path, and core DB tables for the CRMP prototype.",
      "zh-Hant": "CRMP 原型之管理頁、API、本機 SQLite 路徑與核心資料表。",
    },
  },
};

const UI: Record<string, Pair> = {
  "shell.brandEyebrow": { en: "Vantage Markets", "zh-Hant": "Vantage Markets" },
  "shell.brandTitle": { en: "CRMP Admin", "zh-Hant": "CRMP 管理後台" },
  "shell.brandSub": {
    en: "Centralised Risk Management Platform",
    "zh-Hant": "集中式風險管理平台",
  },
  "shell.headerEyebrow": { en: "Admin Control Plane", "zh-Hant": "管理控制平面" },
  "shell.headerTitle": { en: "Risk · Ops · AI · System", "zh-Hant": "風險 · 營運 · AI · 系統" },
  "shell.messenger": { en: "Messenger", "zh-Hant": "即時通訊" },
  "shell.indicators": { en: "Indicators", "zh-Hant": "指標" },
  "shell.signOut": { en: "Sign out", "zh-Hant": "登出" },
  "shell.signIn": { en: "Sign in", "zh-Hant": "登入" },
  "shell.publicMode": { en: "Public prototype", "zh-Hant": "公開原型" },
  "shell.menu": { en: "Menu", "zh-Hant": "選單" },
  "shell.language": { en: "Language", "zh-Hant": "語言" },

  "home.stat.users": { en: "Users", "zh-Hant": "使用者" },
  "home.stat.usersHint": { en: "Across 4 departments", "zh-Hant": "橫跨 4 個部門" },
  "home.stat.teams": { en: "Teams", "zh-Hant": "團隊" },
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
    en: "Lark-style demo inbox (no live Lark API). Open a thread to see the Monitor alert, AI report, and escalation message. Permanent URL:",
    "zh-Hant": "Lark 風格示範收件匣（無需正式 Lark API）。開啟執行緒即可看到 Monitor 警報、AI 報告與升級訊息。永久網址：",
  },
  "msg.larkDemoHintShort": {
    en: "Lark-style demo inbox — open a thread for alerts, AI reports and escalations.",
    "zh-Hant": "Lark 風格示範收件匣 — 開啟執行緒查看警報、AI 報告與升級。",
  },
  "home.larkDemo": {
    en: "See alerts, AI reports and escalations in the Lark-style messenger demo.",
    "zh-Hant": "在 Lark 風格 Messenger 示範中查看警報、AI 報告與升級訊息。",
  },
  "home.larkDemoCta": { en: "Open messenger demo", "zh-Hant": "開啟 Messenger 示範" },

  "login.title": {
    en: "Centralised Risk Management Platform",
    "zh-Hant": "集中式風險管理平台",
  },
  "login.blurb": {
    en: "Admin control plane for Risk Control, Operations, AI and System — wired to Monitor 2.0 indicators and Lark escalations across CFD and crypto exchange products.",
    "zh-Hant": "風險控管、營運、AI 與系統之管理控制平面 — 串接 Monitor 2.0 指標與 Lark 升級，涵蓋 CFD 與加密交易所。",
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

  "urls.pages": { en: "Admin / auth pages", "zh-Hant": "管理／登入頁" },
  "urls.apis": { en: "API routes", "zh-Hant": "API 路由" },
  "urls.data": { en: "Data / tables", "zh-Hant": "資料／資料表" },
  "urls.inbox": { en: "Demo inbox", "zh-Hant": "示範收件匣" },
  "urls.publicNote": {
    en: "All catalogued URLs are public in this prototype — no login required. Sign in only to act as a named persona. Permanent GitHub Pages URL: https://hxyan2020.github.io/PRD/crmp-admin/admin/ — Lark messenger demo: https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/",
    "zh-Hant": "本原型目錄中的所有網址皆公開，無需登入。僅在要以具名角色操作時才需登入。永久 GitHub Pages 網址：https://hxyan2020.github.io/PRD/crmp-admin/admin/ — Lark Messenger 示範：https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/",
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
  const pretty = text.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return PHRASES_ZH[pretty] || text;
}
