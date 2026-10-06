import { PLATFORM_URLS } from "../docs/urls";
import { retrieveDeskCorpus } from "./rag-corpus";

type UiLocale = "en" | "zh-Hant";

export type DeskChatMessage = { role: "user" | "assistant"; content: string };

export type DeskChatSource = { title: string; href?: string };

export type DeskChatResult = {
  reply: string;
  sources: DeskChatSource[];
  suggestions: string[];
};

type Intent = "where" | "live" | "how" | "who" | "purpose" | "built" | "domain" | "explain";

type Knowledge = {
  keys: string[];
  href?: string;
  boost?: Intent[];
  en: { title: string; body: string };
  zh: { title: string; body: string };
};

const KNOWLEDGE: Knowledge[] = [
  {
    keys: [
      "crmp",
      "centralised risk",
      "centralized risk",
      "this admin",
      "this platform",
      "purpose",
      "what is this",
      "why this",
      "control plane",
      "用途",
      "目的",
      "這個後台",
      "這個平台",
      "什麼是",
    ],
    href: "/admin",
    boost: ["purpose"],
    en: {
      title: "Purpose of CRMP Admin",
      body: "CRMP (Centralised Risk Management Platform) is the control plane for a forex CFD broker and a crypto exchange risk desk. It turns Monitor 2.0 alarms into explainable RCA, challenges BREACH/CRITICAL packs with a second AI, lets operators act in messenger, enforces maker/checker, keeps AI off halt/close-only, and leaves one spine + audit trail. It consumes Monitor 2.0; it does not replace it. This build is a UAT prototype — Lark, LP/wallet writes and SSO are mocked.",
    },
    zh: {
      title: "CRMP 管理後台的用途",
      body: "CRMP（中央風險管理平台）是外匯 CFD 券商與加密交易所風控台的控制面。它把 Monitor 2.0 警報變成可解釋根因、對 BREACH／CRITICAL 做第二 AI 挑戰、讓值班在 Messenger 處置、執行 Maker／Checker、禁止 AI 碰停商品／只平倉，並留下一條脊柱＋稽核。它消費 Monitor 2.0，不取代它。本建置是 UAT 原型 — Lark、LP／錢包寫入與 SSO 皆為模擬。",
    },
  },
  {
    keys: [
      "what has been built",
      "what's built",
      "what was built",
      "shipped",
      "admin map",
      "feature catalogue",
      "feature catalog",
      "left nav",
      "已建",
      "做了什麼",
      "有哪些功能",
      "建了",
      "已上線",
    ],
    href: "/admin",
    boost: ["built"],
    en: {
      title: "What has been built",
      body: "Shipped: Admin Home, Daily Performance, Monitor 2.0 + Alerts + Detectors, Market Intel, Risk Log, Risk Domains, AI Analyses + challenger + how-to-improve chatbot, Skills / Knowledge Tree / RAG, AI Admin maker-checker, Human Intervention, Demo Messenger (thinking animation), Escalation + Lark registry, Spine + Audit, org + users, Data Sources, grouped Settings, AI access blocklist, EN/繁中 chrome, selection chatbot, docs (TSD/PRD/User Guide/UAT/Ecosystem/Roadmap/URLs), GitHub Pages snapshot. Not live: real Lark cards (RM-01), Monitor write-back (RM-02), billed LLM (RM-03), independent challenger vendor (RM-04), SSO (RM-05), Postgres (RM-06), real halt/leverage/LP/withdrawal adapters (RM-09).",
    },
    zh: {
      title: "目前已建置",
      body: "已上線：管理首頁、每日績效、Monitor 2.0＋警報＋偵測器、市場情報、風險日誌、風險領域、AI 分析＋挑戰者＋如何改進聊天、技能／知識樹／RAG、AI 管理雙人、人工干預、示範 Messenger（思考動畫）、升級＋Lark 登錄、脊柱＋稽核、組織與使用者、資料來源、分組設定、AI 存取禁區、EN／繁中、劃選聊天機器人、全套文件、GitHub Pages 快照。未上線：真實 Lark 卡片（RM-01）、Monitor 回寫（RM-02）、計費 LLM（RM-03）、獨立挑戰者供應商（RM-04）、SSO（RM-05）、Postgres（RM-06）、真實停商品／槓桿／LP／出金適配（RM-09）。",
    },
  },
  {
    keys: [
      "forex",
      "fx broker",
      "cfd broker",
      "cfd risk",
      "broker risk",
      "外匯",
      "差價合約",
      "券商風控",
    ],
    href: "/admin/risk-domains",
    boost: ["domain"],
    en: {
      title: "Forex CFD broker risk",
      body: "The CFD book splits A-book (hedge to LPs) and B-book (internalise). Watch market/pricing (VaR, gaps, stale quotes, slippage), credit (margin, stop-out, NBP, copy cascade, latency arb), LP/hedge coverage, product groups (leverage, swaps, XAUUSD247), fraud/bonus, funding, and entity leverage. Typical containments — human-gated here: group leverage cut, symbol halt/close-only, pre-widen, pause copies, LP disable, A-book increase. Check the economic calendar ±60 minutes before calling flow toxic.",
    },
    zh: {
      title: "外匯 CFD 券商風險",
      body: "CFD 帳簿分 A-book（對沖給 LP）與 B-book（內盤）。盯市場／定價（VaR、缺口、過期報價、滑點）、信用（保證金、強平、負餘額、跟單連鎖、延遲套利）、LP／對沖覆蓋、商品組別（槓桿、隔夜、XAUUSD247）、優惠濫用、資金與實體槓桿。常見處置在此一律人工關卡：收組別槓桿、停商品／只平倉、預先擴點、暫停跟單、停 LP、提高 A-book。先查經濟日曆 ±60 分鐘再判斷是否有毒單。",
    },
  },
  {
    keys: [
      "crypto exchange",
      "perpetual",
      "perps",
      "matching engine",
      "adl",
      "加密交易所",
      "永續",
      "合約交易所",
    ],
    href: "/admin/risk-domains",
    boost: ["domain"],
    en: {
      title: "Crypto exchange risk",
      body: "Exchange stack ≠ crypto CFDs: matching integrity, mark-price oracles, liquidation engine, insurance fund, ADL, hot/warm/cold wallets, deposit/withdrawal rails, OI concentration. Indicators: M2-CRYPTO-WALLET (hot float 15%/25%), M2-CRYPTO-LIQ (backlog 50/200), M2-CRYPTO-ORACLE (lag 1s/2s), M2-CRYPTO-INS (fund DD 4%/8%), M2-CRYPTO-OI (top OI 20%/35%). Pause large withdrawals or new high-leverage perps only via a human gate. Channel oc_crypto_exchange_risk.",
    },
    zh: {
      title: "加密交易所風險",
      body: "交易所棧 ≠ 加密 CFD：撮合公正、標記價預言機、強平引擎、保險基金、ADL、熱／溫／冷錢包、充提通道、持倉集中度。指標：熱錢包浮額 15%／25%、強平積壓 50／200、預言機延遲 1s／2s、保險基金回撤 4%／8%、龍頭 OI 20%／35%。暫停大額出金或新高槓桿永續必須走人工關卡。頻道 oc_crypto_exchange_risk。",
    },
  },
  {
    keys: ["risk domain", "risk-domains", "MARKET_PRICING", "CREDIT_CLIENT", "CRYPTO_EXCHANGE", "風險領域"],
    href: "/admin/risk-domains",
    en: {
      title: "Risk domains",
      body: "Ten domains: Market & Pricing, Credit & Client, Liquidity & Hedge, Product & Trading Conditions, Operational & Process, Fraud/Abuse/Conduct, Platform & Technology, Regulatory/Entity/Capital, Model & AI, Crypto Exchange Stack. Owner BUs are Risk Control, Operations, AI or System. Open Risk Domains for the catalogue; Knowledge Tree maps domain → skill → RAG. Open Departments / Roles for the full RACI charter (owns, accountable, does-not, escalation).",
    },
    zh: {
      title: "風險領域",
      body: "十個領域：市場與定價、信用與客戶、流動性與對沖、商品與交易條件、營運流程、欺詐／濫用／行為、平台技術、監管／實體／資本、模型與 AI、加密交易所棧。負責 BU 為風控、營運、AI 或系統。目錄在「風險領域」；知識樹把領域 → 技能 → RAG 連起來。完整 RACI 章程（擁有、課責、不做、升級）在「部門」／「角色」。",
    },
  },
  {
    keys: [
      "department",
      "departments",
      "bu charter",
      "raci",
      "who owns",
      "risk owner",
      "ops lead",
      "role intro",
      "responsibilit",
      "部門",
      "職責",
      "誰負責",
      "角色",
    ],
    href: "/admin/departments",
    boost: ["who"],
    en: {
      title: "BU and role charters",
      body: "Four BUs. Risk Control owns limit policy, CFD book risk, crypto wallet-float/liquidation policy, and the human gate for halt/leverage/LP/withdrawal pause. Operations owns funding exceptions, EOD recon, tickets and client contact — it executes Risk decisions. AI owns detectors, RCA, RAG, challenger; it never executes halt/close-only. System owns servers, oneZero bridges, LP endpoints, wallets infra, kill-switches and audit. Roles: RISK_OWNER is checker on live detectors and high-severity interventions; RISK_ANALYST investigates and proposes; OPS_LEAD owns ops SLA; AI_ENGINEER is maker not sole checker; SYSTEM_ADMIN executes switches Risk armed; VIEWER is read-only; SUPER_ADMIN is break-glass. Full owns / does / does-not / escalation lists are on Departments and Roles.",
    },
    zh: {
      title: "BU 與角色章程",
      body: "四個 BU。風險控管擁有限額政策、CFD 帳簿風險、加密錢包浮額／強平政策，以及停商品／槓桿／LP／暫停出金之人工關卡。營運擁有資金例外、日終對帳、工單與客戶聯繫 — 執行風控決策。AI 擁有偵測器、根因、RAG、挑戰者；永不執行停商品／只平倉。系統擁有伺服器、oneZero 橋接、LP 端點、錢包基礎設施、緊急開關與稽核。角色：RISK_OWNER 是正式偵測器與高嚴重度干預之 Checker；RISK_ANALYST 調查並提案；OPS_LEAD 負責營運 SLA；AI_ENGINEER 是 Maker 而非唯一 Checker；SYSTEM_ADMIN 執行風控已啟動之開關；VIEWER 唯讀；SUPER_ADMIN 為緊急權限。完整擁有／日常／不做／升級清單在「部門」與「角色」。",
    },
  },
  {
    keys: ["monitor 2.0", "monitor-2", "m2-", "indicator", "監控"],
    href: "/admin/monitor-2",
    en: {
      title: "Monitor 2.0",
      body: "Monitor 2.0 is the upstream indicator catalogue (e.g. M2-MRG-014, M2-COPY-009, M2-MKT-INTEL, M2-CRYPTO-WALLET). In this prototype the catalogue is seeded SQLite — Sync / Ack update local rows only. Live webhook + ticket write-back is roadmap RM-02.",
    },
    zh: {
      title: "Monitor 2.0",
      body: "Monitor 2.0 是上游指標目錄（如 M2-MRG-014、M2-COPY-009、M2-MKT-INTEL、M2-CRYPTO-WALLET）。本原型是種子 SQLite — 同步／Ack 只改本機列。真實 webhook＋工單回寫是路線圖 RM-02。",
    },
  },
  {
    keys: ["lark", "messenger", "oc_risk", "webhook", "卡片", "互動"],
    href: "/admin/messenger",
    en: {
      title: "Demo Messenger / Lark",
      body: "Demo Messenger is an in-app Lark lookalike. Channel webhooks are mock URLs; POST /api/lark test_notify returns mock: true and writes audit only. Production interactive cards are RM-01. Ack / Escalate / maker-confirm already work locally. AI-style buttons play a thinking process then a Thought card.",
    },
    zh: {
      title: "示範 Messenger／Lark",
      body: "示範 Messenger 是站內 Lark 風格收件匣。頻道 Webhook 是模擬網址；POST /api/lark test_notify 回 mock: true 只寫稽核。正式互動卡片是 RM-01。Ack／升級／Maker 確認已可在本機走通。AI 風格按鈕會先播思考過程再收成 Thought 卡。",
    },
  },
  {
    keys: [
      "cs desk",
      "cs/tr",
      "customer service",
      "c1",
      "live chat",
      "follow-up email",
      "id verification",
      "trading support",
      "客服",
      "核身",
      "成交",
    ],
    href: "/admin/cs-desk",
    en: {
      title: "CS / TR Desk",
      body: "Customer Service is the 24/7 frontline for C1 live chat, the website form and official mailboxes. POST /api/cs/intake (header x-cs-intake-token: demo-c1) creates a request. If AI is unclear or needs ID, it emails the client and waits for a reply (max 3 loops). Trading-execution cases (fills, slippage, MT4/MT5) go to TR. Book-risk complaints escalate onto Demo Messenger / Human Intervention. Do not close ID-verify while a follow-up is WAITING.",
    },
    zh: {
      title: "CS／TR 台",
      body: "客服是 24/7 第一線：C1 即時聊天、網站表單與官方信箱。POST /api/cs/intake（標頭 x-cs-intake-token: demo-c1）會開案。AI 若不清楚或需核身，會自動寄信並等待客戶回覆（最多三輪）。成交／滑點／MT4／MT5 案件分流至 TR。帳簿風險投訴升級到示範 Messenger／人工干預。追問信仍為 WAITING 時不可結案。",
    },
  },
  {
    keys: ["executed_mock", "executed_after_approval", "intervention", "halt", "dry-run", "干預", "停商品"],
    href: "/admin/interventions",
    en: {
      title: "Human intervention (mocked writes)",
      body: "Approve on Human Intervention logs spine/audit and marks EXECUTED_AFTER_APPROVAL — it does not call LP disable, symbol halt, group leverage or withdrawal pause. Non-human skill steps are EXECUTED_MOCK. Live adapters are RM-09 (UAT out of scope).",
    },
    zh: {
      title: "人工干預（模擬寫入）",
      body: "人工干預頁核准只寫脊柱／稽核並標 EXECUTED_AFTER_APPROVAL — 不會真的停 LP、停商品、收槓桿或暫停出金。非人工技能步驟是 EXECUTED_MOCK。真實適配是 RM-09（本輪 UAT 範圍外）。",
    },
  },
  {
    keys: ["challenger", "second-ai", "second ai", "second_opinion", "agree", "disagree", "partial", "挑戰"],
    href: "/admin/alerts",
    en: {
      title: "Second-AI challenger",
      body: "BREACH/CRITICAL analyses open a challenger panel (setting ai.second_opinion_severity, default BREACH). Today it is a second heuristic in lib/ai/challenger.ts — same repo, not a second vendor. Verdicts AGREE / PARTIAL / DISAGREE. Independent model is RM-04.",
    },
    zh: {
      title: "第二 AI 挑戰者",
      body: "BREACH／CRITICAL 分析會開挑戰者面板（設定 ai.second_opinion_severity，預設 BREACH）。今日是 lib/ai/challenger.ts 的第二套啟發式 — 同一程式庫，不是第二供應商。裁決 AGREE／PARTIAL／DISAGREE。獨立模型是 RM-04。",
    },
  },
  {
    keys: ["rca", "matchskill", "skill", "playbook", "root cause", "根因", "技能"],
    href: "/admin/skills",
    en: {
      title: "Primary RCA (heuristic skill / RAG)",
      body: "Primary analysis matches a skill playbook (matchSkill) or retrieves RAG. There is no live LLM on this path. Confidence can hit 1.0 on a wording match. LLM + tools + eval harness is RM-03. Skills are SKILL.md-style playbooks — open Enter for the full page.",
    },
    zh: {
      title: "主 RCA（啟發式技能／RAG）",
      body: "主分析匹配技能劇本（matchSkill）或檢索 RAG。這條路徑沒有線上 LLM。用詞命中時信心可到 1.0。LLM＋工具＋評測架是 RM-03。技能是 SKILL.md 風格 — 點「進入」看完整頁。",
    },
  },
  {
    keys: ["maker", "checker", "dual", "soD", "ai admin", "change request", "雙人"],
    href: "/admin/ai-admin",
    en: {
      title: "Maker / checker",
      body: "AI Admin change requests need a maker and a different checker. In the prototype this is an in-app flag, not IdP identity (SSO is RM-05). The AI service role must never receive halt / close-only permissions — see AI Access Security.",
    },
    zh: {
      title: "Maker／Checker",
      body: "AI 管理的變更單需要 Maker 與另一位 Checker。原型裡這是應用內旗標，不是 IdP 身分（SSO 是 RM-05）。AI 服務角色永不可有停商品／只平倉權限 — 見 AI 存取安全。",
    },
  },
  {
    keys: ["risk123", "yan123", "sso", "scim", "persona", "login", "登入", "密碼"],
    href: "/admin/users",
    en: {
      title: "Demo login (not SSO)",
      body: "Login is cookie + demo passwords (risk123 personas, yan123 for demo platform owner). Corporate SSO + SCIM is RM-05 and out of this UAT window. Sign-in stays in this browser after refresh.",
    },
    zh: {
      title: "示範登入（不是 SSO）",
      body: "登入是 Cookie＋示範密碼（角色 risk123，示範平台負責人 yan123）。企業 SSO＋SCIM 是 RM-05，本輪 UAT 範圍外。重新整理後工作階段仍留在這個瀏覽器。",
    },
  },
  {
    keys: ["sqlite", "postgres", "vantage_risk.db", "better-sqlite3", "multi-instance", "備份"],
    href: "/admin/docs/urls",
    en: {
      title: "SQLite prototype store",
      body: "Persistence is one file: platform/data/vantage_risk.db (better-sqlite3). GitHub Pages cannot write it. Postgres + multi-instance is RM-06.",
    },
    zh: {
      title: "SQLite 原型庫",
      body: "持久化是單一檔 platform/data/vantage_risk.db（better-sqlite3）。GitHub Pages 不能寫庫。Postgres＋多實例是 RM-06。",
    },
  },
  {
    keys: ["shadow", "skill_certainty", "suggest", "auto-execute", "影子"],
    href: "/admin/dashboard",
    en: {
      title: "Shadow vs execute",
      body: "ai.skill_certainty_only defaults true. There is not yet a single Shadow banner (RM-11). Treat EXECUTED_MOCK as a log, not live containment.",
    },
    zh: {
      title: "影子 vs 執行",
      body: "ai.skill_certainty_only 預設 true。還沒有單一「影子」橫幅（RM-11）。請把 EXECUTED_MOCK 當成日誌，不是真實防損。",
    },
  },
  {
    keys: ["market intel", "m2-mkt-intel", "event_templates", "cpi", "情報"],
    href: "/admin/market-intel",
    en: {
      title: "Market intelligence scanner",
      body: "A 5-minute heuristic rotates EVENT_TEMPLATES. Findings can be synthetic. Indicator M2-MKT-INTEL counts hits. Licensed scored feeds are RM-15. Cards carry region flags, impact (not violation), timestamp, and the source article URL — not a channel homepage.",
    },
    zh: {
      title: "市場情報掃描",
      body: "每五分鐘啟發式輪轉 EVENT_TEMPLATES。發現可以是合成的。指標 M2-MKT-INTEL 計命中。授權評分饋送是 RM-15。卡片帶地區國旗、影響（不是違規）、時間戳與來源文章網址，不是頻道首頁。",
    },
  },
  {
    keys: ["roadmap", "rm-0", "rm-1", "改進", "路線圖"],
    href: "/admin/docs/roadmap",
    en: {
      title: "Improvement roadmap",
      body: "Docs → Improvement Roadmap lists RM-01…15. Each card has Today / Build / Done when / skip risk. RM-05 (SSO) and RM-09 (live writes) are tagged UAT out of scope.",
    },
    zh: {
      title: "改進路線圖",
      body: "文件 → 改進路線圖列出 RM-01…15。每張卡有今日／要做／完成標準／不做風險。RM-05（SSO）與 RM-09（真實寫入）標為本輪 UAT 範圍外。",
    },
  },
  {
    keys: ["spine", "audit", "脊柱", "稽核", "脊柱日誌"],
    href: "/admin",
    en: {
      title: "Home spine & audit",
      body: "Spine Log tab was removed. Stage ticket counts live on Admin Home (DETECT→…→DASHBOARD). Risk incidents are tracked under Realtime Alerts and Risk Log Analytics. Audit Log is the immutable mutation trail.",
    },
    zh: {
      title: "首頁脊柱與稽核",
      body: "脊柱日誌分頁已移除。各階段工單數在管理首頁脊柱（DETECT→…→DASHBOARD）。風險事件請看即時警報與風險日誌分析。稽核日誌是不可變變更軌跡。",
    },
  },
  {
    keys: ["a-book", "b-book", "abook", "hedge", "lp reject", "m2-lp", "m2-hedge", "m2-abook"],
    href: "/admin/skills",
    boost: ["domain"],
    en: {
      title: "A-book / B-book / LP",
      body: "Hedge coverage warn <85% / breach <70% (M2-HEDGE-007). LP reject warn 2% / breach 5% (M2-LP-022). A-book volume ratio warn 40% / breach 30% (M2-ABOOK-008) — falling A-book means more inventory retained. Skills may suggest A-book increase or LP disable; those queue as human gates and do not move the trading book in this prototype.",
    },
    zh: {
      title: "A-book／B-book／LP",
      body: "對沖覆蓋警告 <85%、違規 <70%（M2-HEDGE-007）。LP 拒單警告 2%／違規 5%（M2-LP-022）。A-book 成交佔比警告 40%／違規 30%（M2-ABOOK-008）— A-book 下降代表內盤庫存變多。技能可能建議提高 A-book 或停 LP；本原型只進人工關卡，不會真的動帳簿。",
    },
  },
  {
    keys: ["copy", "copier", "signal provider", "concentration", "跟單", "m2-copy"],
    href: "/admin/skills",
    boost: ["domain"],
    en: {
      title: "Copy-trading concentration",
      body: "M2-COPY-009 tracks top provider concentration (warn 15% / breach 25%). Known controls: per-provider copier caps, pause new copies, dual-control before lifting caps. Cascade risk if one provider holds too much copy equity — often linked to M2-MRG-014 margin spikes.",
    },
    zh: {
      title: "跟單集中度",
      body: "M2-COPY-009 追蹤龍頭提供者集中度（警告 15%／違規 25%）。已知控制：每提供者跟單上限、暫停新跟單、提高上限需雙人控制。單一提供者佔比過高會連鎖 — 常與 M2-MRG-014 保證金高峰連動。",
    },
  },
  {
    keys: ["hot wallet", "float", "withdrawal", "custody", "熱錢包", "m2-crypto-wallet"],
    href: "/admin/monitor-2",
    boost: ["domain"],
    en: {
      title: "Crypto hot-wallet float",
      body: "Hot float = hot balances / total custody. Warn ~15%, breach ~25% (M2-CRYPTO-WALLET). Remediation: cold sweep, pause large withdrawals — always a human gate in CRMP. Pair with M2-CRYPTO-DEP and M2-WD-015 if queues build.",
    },
    zh: {
      title: "加密熱錢包浮額",
      body: "熱錢包浮額＝熱錢包／總保管。警告約 15%，違規約 25%（M2-CRYPTO-WALLET）。劇本處置：冷掃、暫停大額出金 — 在 CRMP 一律走人工關卡。排隊升高時一併看 M2-CRYPTO-DEP 與 M2-WD-015。",
    },
  },
  {
    keys: ["margin", "stop-out", "stopout", "stop out", "m2-mrg", "m2-stop", "保證金", "強平"],
    href: "/admin/skills",
    boost: ["domain"],
    en: {
      title: "Margin and stop-out",
      body: "Raw/Pro ECN typical margin call 50% / stop-out 20%; STP stop-out often 50%. M2-MRG-014 = accounts >90% util (warn 50 / breach 100). M2-STOP-018 = stop-outs / 5m (warn 20 / breach 40). Playbook: confirm feed not stale, check copy overlap, check LP rejects; if news window ±60m monitor + notify; if toxic cluster, human-gated group leverage cut. Skill SKILL-MARGIN-SPIKE.",
    },
    zh: {
      title: "保證金與強平",
      body: "Raw／Pro ECN 典型追繳 50%／強平 20%；STP 強平常為 50%。M2-MRG-014＝帳戶 >90% 使用率（警告 50／違規 100）。M2-STOP-018＝每 5 分鐘強平數（警告 20／違規 40）。劇本：確認報價未過期、查跟單重疊、查 LP 拒單；若在新聞窗 ±60 分則監控＋通知；若是有毒群集則人工收組別槓桿。技能 SKILL-MARGIN-SPIKE。",
    },
  },
  {
    keys: ["xauusd247", "xauusd", "gold 24", "weekend gold", "m2-xau", "黃金"],
    href: "/admin/monitor-2",
    boost: ["domain"],
    en: {
      title: "XAUUSD247",
      body: "24/7 gold CFD (1 oz lots) including weekends. Exposure caps 15k net / 30k gross lots per login → close-only. M2-XAU-247 warn 10k / breach 15k net lots. Weekend cashback can raise gap and NBP risk. Entity availability is jurisdiction-dependent.",
    },
    zh: {
      title: "XAUUSD247",
      body: "含週末的 24/7 黃金 CFD（1 盎司手）。每登錄淨 1.5 萬／總 3 萬手上限 → 只平倉。M2-XAU-247 警告 1 萬／違規 1.5 萬淨手。週末回贈會抬高缺口與負餘額風險。商品是否開放依實體司法轄區。",
    },
  },
  {
    keys: ["liquidation", "insurance fund", "oracle", "open interest", "m2-crypto-liq", "m2-crypto-ins", "m2-crypto-oi", "m2-crypto-oracle", "清算", "保險基金", "預言機"],
    href: "/admin/monitor-2",
    boost: ["domain"],
    en: {
      title: "Crypto liq / oracle / OI",
      body: "Liquidation backlog M2-CRYPTO-LIQ warn 50 / breach 200 orders — residual hits the insurance fund (M2-CRYPTO-INS DD warn 4% / breach 8%) then ADL. Mark-price oracle lag M2-CRYPTO-ORACLE warn 1s / breach 2s can liquidate the wrong side — freeze to close-only. Top account OI share M2-CRYPTO-OI warn 20% / breach 35%. Pause new high-leverage perps is human-gated.",
    },
    zh: {
      title: "加密強平／預言機／持倉",
      body: "強平積壓 M2-CRYPTO-LIQ 警告 50／違規 200 筆 — 殘值進保險基金（日回撤 4%／8%）再 ADL。標記價預言機延遲 1s／2s 可能錯邊強平 — 凍結為只平倉。龍頭帳戶 OI 佔比 20%／35%。暫停新高槓桿永續走人工關卡。",
    },
  },
  {
    keys: ["negative balance", "nbp", "m2-nbp", "gap exposure", "m2-gap", "m2-var", "負餘額", "缺口"],
    href: "/admin/skills",
    boost: ["domain"],
    en: {
      title: "NBP, gaps and VaR",
      body: "NBP writes client equity to zero after a gap the stop missed — house takes the loss. M2-NBP-016 warn 2 / breach 5 accounts. ≥5 is usually systemic (feed/gap/liq), not one VIP. M2-GAP-012 estimated gap USD warn $1m / breach $2m. 1-day VaR util M2-EQ-001 company DD warn 3% / breach 5%; M2-VAR-002 warn 85% / breach 95%. Apply entity NBP policy then close-only until marks validate.",
    },
    zh: {
      title: "負餘額、缺口與 VaR",
      body: "負餘額保護在缺口無法成交止損後把客戶權益補回零 — 損失由公司承擔。M2-NBP-016 警告 2／違規 5 戶。≥5 通常是系統性（報價／缺口／強平），不是單一 VIP。缺口曝險警告 100 萬／違規 200 萬美元。公司權益回撤 3%／5%；1 日 VaR 使用率 85%／95%。先套實體 NBP 政策，再只平倉直到標記價確認。",
    },
  },
  {
    keys: ["stale quote", "slippage", "latency arb", "m2-feed", "m2-slip", "m2-arb", "過期報價", "滑點"],
    href: "/admin/monitor-2",
    boost: ["domain"],
    en: {
      title: "Stale quotes and slippage",
      body: "M2-FEED-003 stale symbols warn 3 / breach 10. M2-SLIP-021 avg client slippage on majors warn 2 / breach 3.5 pips. M2-ARB-026 latency-arb toxicity warn 0.5 / breach 0.7. If slippage is high and LP rejects are quiet, the desk is over-internalising; if both rise, the bridge is sick. Pull to close-only / widen / switch LP — human gate for halt.",
    },
    zh: {
      title: "過期報價與滑點",
      body: "M2-FEED-003 過期商品警告 3／違規 10。主要貨幣平均滑點 2／3.5 pips。延遲套利毒性 0.5／0.7。滑點高而 LP 拒單安靜＝內盤過多；兩者同升＝橋接有病。拉到只平倉／擴點／換 LP — 停牌走人工關卡。",
    },
  },
  {
    keys: ["wash", "collusion", "bonus", "multi-account", "m2-fraud", "m2-wash", "m2-bonus", "對倒", "濫用"],
    href: "/admin/monitor-2",
    boost: ["domain"],
    en: {
      title: "Fraud, bonus and wash",
      body: "M2-FRAUD-011 multi-account cluster warn 0.7 / breach 0.85. M2-BONUS-013 bonus-to-cash 24h warn $75k / breach $150k. M2-WASH-020 wash/collusion warn 0.55 / breach 0.75 (CFD + crypto matching). Freeze bonus payout and link KYC — do not auto-ban without Ops Lead.",
    },
    zh: {
      title: "欺詐、優惠與對倒",
      body: "多帳戶群集分數警告 0.7／違規 0.85。優惠兌現 24h 警告 7.5 萬／違規 15 萬美元。對倒／串謀 0.55／0.75（CFD＋加密撮合）。凍結優惠發放並串 KYC — 未經營運主管不要自動封禁。",
    },
  },
  {
    keys: ["segregation", "client money", "capital buffer", "m2-seg", "m2-cap", "客戶資金", "資本"],
    href: "/admin/risk-domains",
    boost: ["domain"],
    en: {
      title: "Client money and capital",
      body: "M2-SEG-025 segregation gap warn $50k / breach $250k is an Ops+Risk P1 even if trading P&L is fine. M2-CAP-024 entity capital buffer warn 20% / breach 15%. Crypto hot-wallet float is theft severity; CFD segregation is a regulatory construct — do not treat them as the same control.",
    },
    zh: {
      title: "客戶資金與資本",
      body: "客戶資金隔離缺口警告 5 萬／違規 25 萬美元，即使交易損益正常也是營運＋風控 P1。實體資本緩衝 20%／15%。加密熱錢包浮額是失竊嚴重度；CFD 隔離是監管概念 — 不要當成同一套控制。",
    },
  },
  {
    keys: ["group leverage", "leverage cap", "close-only", "entity", "asic", "fca", "vfsc", "槓桿", "組別"],
    href: "/admin/settings",
    boost: ["domain"],
    en: {
      title: "Leverage, groups and entities",
      body: "Retail caps differ by entity (FCA/ASIC often 1:30 majors / 1:20 gold / 1:2 crypto CFDs; VFSC/CIMA may be 1:500). Trading groups bind leverage, margin and swaps. Any suggestion to raise leverage must check entity + retail vs professional. Group leverage cuts and symbol halt are human-gated and mocked until RM-09.",
    },
    zh: {
      title: "槓桿、組別與實體",
      body: "零售上限依實體而異（FCA／ASIC 主要貨幣常 1:30、黃金 1:20、加密 CFD 1:2；VFSC／CIMA 可到 1:500）。交易組別綁槓桿、保證金與隔夜。任何上調槓桿建議都必須核實體＋零售／專業。收組別槓桿與停商品在 RM-09 之前都是人工關卡＋模擬寫入。",
    },
  },
  {
    keys: ["繁中", "zh-hant", "i18n", "translation", "locale"],
    href: "/admin/settings",
    en: {
      title: "Language (EN / 繁中)",
      body: "EN / 繁中 is stored in cookie crmp_ui_lang. Chrome (titles, buttons, badges) is translated. IDs, emails and permission codes stay Latin on purpose. Remaining narrative strings are RM-08.",
    },
    zh: {
      title: "語言（EN／繁中）",
      body: "EN／繁中存在 Cookie crmp_ui_lang。Chrome（標題、按鈕、徽章）已翻譯。編號、電子郵件、權限碼刻意維持拉丁字母。剩餘敘事字串是 RM-08。",
    },
  },
  {
    keys: ["demo platform owner", "haixiang.yan", "平台負責人"],
    href: "/admin/users",
    en: {
      title: "Demo platform owner",
      body: "The named owner of this desk and docs is demo platform owner (haixiang.yan@hytechc.com), password yan123. GitHub/Cursor login is an alias. This is a demo persona, not corporate SSO.",
    },
    zh: {
      title: "示範平台負責人",
      body: "本後台與文件的具名負責人是示範平台負責人（haixiang.yan@hytechc.com），密碼 yan123。GitHub／Cursor 登入是別名。這是示範角色，不是企業 SSO。",
    },
  },
  {
    keys: ["uat", "pass", "fail", "waive", "驗收"],
    href: "/admin/docs/uat",
    en: {
      title: "UAT checklist",
      body: "Docs → UAT is the Risk Owner script (UAT-01…). Exit: all Critical Pass; at most 2 High waivers with written acceptance. Do not Fail the prototype for missing live Lark writes or Okta.",
    },
    zh: {
      title: "UAT 清單",
      body: "文件 → UAT 是風險負責人劇本（UAT-01…）。退出：Critical 全過；High 豁免≤2 且書面接受。不要因為沒有真實 Lark 寫入或 Okta 就判原型 Fail。",
    },
  },
  {
    keys: ["blocklist", "ai access", "human-only", "close-only", "禁區"],
    href: "/admin/security/ai-access",
    en: {
      title: "AI access security",
      body: "The AI service role is blocked from halt / close-only / webhook secrets / the SQLite file. This selection chatbot is read-only: it explains, it cannot approve an intervention.",
    },
    zh: {
      title: "AI 存取安全",
      body: "AI 服務角色被擋住停商品／只平倉／Webhook 密鑰／SQLite 檔。這個劃選聊天機器人是唯讀：它解釋，不能核准干預。",
    },
  },
  {
    keys: ["prd", "tsd", "user guide", "docs", "文件", "需求", "規格"],
    href: "/admin/docs/prd",
    en: {
      title: "Docs in this admin",
      body: "TSD (architecture), PRD (product contract for every screen), User Guide (operator how-to), UAT (Risk Owner cases), Ecosystem adoption, Improvement Roadmap (RM-01…15), URL catalog. Open Docs in the left pane.",
    },
    zh: {
      title: "後台文件",
      body: "TSD（架構）、PRD（每一畫面的產品契約）、使用手冊（值班操作）、UAT（風險負責人案例）、生態導入、改進路線圖（RM-01…15）、網址目錄。左側「文件」打開。",
    },
  },
];

function pageHint(path: string, zh: boolean): { title: string; href: string; blurb: string } | null {
  const item =
    PLATFORM_URLS.filter((u) => u.path.startsWith("/admin"))
      .sort((a, b) => b.path.length - a.path.length)
      .find((u) => path === u.path || path.startsWith(`${u.path}/`)) ??
    PLATFORM_URLS.find((u) => u.path === "/admin");
  if (!item) return null;
  const blurb = zh
    ? `你正在「${item.title}」（${item.path}）。劃選的文字會用這一頁與 CRMP 風控知識解釋。`
    : `You are on ${item.title} (${item.path}). The selection is explained with this page’s context and CRMP risk knowledge.`;
  return { title: item.title, href: item.path, blurb };
}

function scoreEntry(hay: string, pagePath: string, entry: Knowledge, intent: Intent): number {
  let s = 0;
  for (const k of entry.keys) {
    const key = k.toLowerCase();
    if (key.length <= 3) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(hay)) s += 1;
    } else if (hay.includes(key)) {
      s += key.length > 8 ? 2 : 1;
    }
  }
  if (s > 0 && entry.href && (pagePath === entry.href || pagePath.startsWith(`${entry.href}/`))) s += 0.4;
  if (s > 0 && entry.boost?.includes(intent)) s += 3;
  return s;
}

function detectIntent(q: string): Intent {
  const x = q.toLowerCase();
  if (/(where|which page|href|去哪|哪一頁|連結)/i.test(x)) return "where";
  if (/(live|real|mock|demo|production|正式|模擬|示範|真的會)/i.test(x)) return "live";
  if (
    /(what has been built|what's built|what was built|what('s| is) shipped|feature (list|catalogue|catalog)|admin map|left[- ]nav|已建|做了什麼|有哪些功能|建了什麼|已上線)/i.test(
      x
    )
  ) {
    return "built";
  }
  if (
    /(purpose|what is (this|crmp|the admin|the platform)|why (this|crmp)|what does (this|the) admin|centralised risk|centralized risk|用途|目的|這個後台|這個平台|什麼是 crmp|為何有)/i.test(
      x
    )
  ) {
    return "purpose";
  }
  if (
    /(forex|fx\b|cfd|crypto exchange|perpetual|\bperp|liquidation|insurance fund|hot wallet|margin|stop-?out|a-book|b-book|copy trad|oracle|open interest|\bnbp\b|negative balance|segregation|\bvar\b|slippage|wash trad|leverage|lp reject|hedge coverage|外匯|差價合約|加密交易所|保證金|強平|熱錢包|風控|風險管理)/i.test(
      x
    )
  ) {
    return "domain";
  }
  if (/(how do i|how can i|how to|which button|click|step-by-step|步驟|怎麼點|如何操作)/i.test(x)) return "how";
  if (/(who owns|who is the owner|which role|raci|which bu|which department|誰負責|哪個角色|哪個部門)/i.test(x)) return "who";
  return "explain";
}

function suggestionsFor(intent: Intent, zh: boolean): string[] {
  if (zh) {
    if (intent === "purpose") return ["目前後台建了什麼？", "外匯 CFD 風險怎麼管？", "加密交易所覆蓋哪些風險？"];
    if (intent === "built") return ["這是正式環境還是示範？", "警報到 Messenger 的脊柱怎麼走？", "RAG 知識庫在哪一頁？"];
    if (intent === "domain") return ["保證金／強平劇本是什麼？", "熱錢包浮額怎麼控？", "LP 拒單風暴怎麼處置？"];
    if (intent === "who") return ["風險負責人擁有什麼？", "AI 能不能停商品？", "營運與風控怎麼分工？"];
    return ["這是正式環境還是示範？", "這個後台的用途是什麼？", "外匯 CFD 與加密風控差在哪？"];
  }
  if (intent === "purpose") {
    return ["What has been built in this admin?", "How is forex CFD risk managed here?", "What crypto exchange risks are covered?"];
  }
  if (intent === "built") {
    return ["Is this live or a demo mock?", "Walk the alarm → RCA → messenger spine", "Where is the RAG knowledge base?"];
  }
  if (intent === "domain") {
    return ["What is the margin / stop-out playbook?", "How is hot-wallet float controlled?", "What happens on an LP reject storm?"];
  }
  if (intent === "who") {
    return ["What does the Risk Owner own?", "Can AI halt a symbol?", "How do Ops and Risk split work?"];
  }
  return ["What is the purpose of this admin?", "What has been built so far?", "How do CFD vs crypto-exchange risks differ?"];
}

export function answerDeskChat(input: {
  selection: string;
  question: string;
  pagePath: string;
  locale: UiLocale;
  ragSnippets?: Array<{ title: string; content: string }>;
  history?: DeskChatMessage[];
}): DeskChatResult {
  const zh = input.locale === "zh-Hant";
  const selection = input.selection.trim().slice(0, 1200);
  const question = input.question.trim().slice(0, 1200);
  const pagePath = input.pagePath || "/admin";
  const hay = `${selection} ${question}`.toLowerCase();
  const intent = detectIntent(`${selection} ${question}`);
  const ranked = KNOWLEDGE.map((e) => ({ e, s: scoreEntry(hay, pagePath, e, intent) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const top = ranked.slice(0, 3).map((x) => x.e);
  const page = pageHint(pagePath, zh);
  const sources: DeskChatSource[] = [];
  const bits: string[] = [];

  if (selection) {
    const q = selection.length > 220 ? `${selection.slice(0, 220)}…` : selection;
    bits.push(zh ? `你劃選的是：\n「${q}」` : `You selected:\n“${q}”`);
  }

  if (intent === "live") {
    bits.push(
      zh
        ? "這是原型：Lark 是 mock webhook、Monitor 同步不外呼、干預核准是 EXECUTED_MOCK／EXECUTED_AFTER_APPROVAL。真實寫入（RM-09）與正式 IdP（RM-05）不在本輪 UAT。"
        : "This is a prototype: Lark webhooks are mock, Monitor sync does not call out, and intervention approve is EXECUTED_MOCK / EXECUTED_AFTER_APPROVAL. Live writes (RM-09) and production IdP (RM-05) are out of this UAT window."
    );
  }

  const grounded = Boolean(top.length || intent === "purpose" || intent === "built" || intent === "domain");

  if (top.length) {
    for (const e of top) {
      const copy = zh ? e.zh : e.en;
      bits.push(`**${copy.title}.** ${copy.body}`);
      if (e.href) sources.push({ title: copy.title, href: e.href });
    }
  } else if (!grounded) {
    bits.push(
      zh
        ? "我沒有對到具名指標或設定鍵。下面用這一頁與內建風控語料說明；也可以改劃選一個代碼（例如 M2-MRG-014、EXECUTED_MOCK、RM-01）或問「這個後台的用途／已建什麼／CFD 與加密風控」。"
        : "I did not match a named indicator or setting key. I will use this page plus the built-in risk corpus. You can also select a code (e.g. M2-MRG-014, EXECUTED_MOCK, RM-01) or ask what this admin is for, what has been built, or how CFD vs crypto-exchange risk works."
    );
  }

  let rag = input.ragSnippets;
  if (!rag?.length) {
    const local = retrieveDeskCorpus(`${selection} ${question}`.trim() || "crmp admin purpose", 2);
    rag = local.map((h) => ({ title: h.title, content: h.content }));
  }
  if (rag.length && (intent === "purpose" || intent === "built" || intent === "domain" || !top.length)) {
    const snip = rag[0];
    const text = snip.content.replace(/\s+/g, " ").slice(0, 420);
    bits.push(zh ? `知識庫摘錄（${snip.title}）：${text}` : `Knowledge excerpt (${snip.title}): ${text}`);
    if (!sources.some((s) => s.href === "/admin/rag")) sources.push({ title: snip.title, href: "/admin/rag" });
  }

  if (intent === "where" && (top[0]?.href || page)) {
    const href = top[0]?.href || page?.href;
    bits.push(zh ? `下一步：打開 ${href}。` : `Next: open ${href}.`);
  }

  if (intent === "how") {
    bits.push(
      zh
        ? "操作順序通常是：Monitor／警報 → AI 分析 → Messenger 卡片上 Ack 或升級 → 若需人工關卡則到人工干預核准（Maker）→ 必要時另一人 Checker。示範 Messenger 可在本頁完成這些按鈕。"
        : "Typical path: Monitor/alert → AI analysis → Ack or Escalate on the Messenger card → Human Intervention if gated (maker) → a different checker if required. Demo Messenger can complete those buttons on this desk."
    );
    sources.push({ title: zh ? "示範 Messenger" : "Demo Messenger", href: "/admin/messenger" });
  }

  if (intent === "who") {
    bits.push(
      zh
        ? "示範平台負責人：demo platform owner（haixiang.yan@hytechc.com／yan123）。風險負責人：risk.owner@vantagemarkets.com／risk123。Checker 應是另一個角色，不要同一人自核。"
        : "Demo platform owner: demo platform owner (haixiang.yan@hytechc.com / yan123). Risk Owner: risk.owner@vantagemarkets.com / risk123. Checker should be a different persona — do not self-approve."
    );
    sources.push({ title: zh ? "使用者" : "Users", href: "/admin/users" });
  }

  if (page) {
    bits.push(page.blurb);
    if (!sources.some((s) => s.href === page.href)) sources.push({ title: page.title, href: page.href });
  }

  bits.push(
    zh
      ? "我是 CRMP 劃選助理，具備此後台用途／已建功能，以及外匯 CFD 券商與加密交易所風控語料。只能解釋，不能核准干預或改設定。"
      : "I am the CRMP selection assistant. I know this admin’s purpose and what has been built, plus forex CFD broker and crypto-exchange risk-management practice. I explain only — I cannot approve interventions or change settings."
  );

  return { reply: bits.join("\n\n"), sources: sources.slice(0, 6), suggestions: suggestionsFor(intent, zh) };
}
