/** Additional English → 繁中 overlays for seed data, indicators, hops, and org copy. */

export const PHRASES_ZH_MORE: Record<string, string> = {
  // Domain codes + catalogue names
  MARKET_PRICING: "市場與定價",
  "Market Pricing": "市場與定價",
  "Market & Pricing Risk": "市場與定價風險",
  "P&L, gaps, stale/crossed quotes, volatility and correlation.":
    "損益、缺口、過期／交叉報價、波動與相關性。",
  LP_HEDGE: "流動性與對沖",
  "Lp Hedge": "流動性與對沖",
  "Liquidity & Hedge Risk": "流動性與對沖風險",
  "LP health, bridge fills, A/B book coverage.": "LP 健康、橋接成交、A／B-book 覆蓋。",
  COPY: "跟單",
  FRAUD_CONDUCT: "詐欺與操守",
  "Fraud Conduct": "詐欺與操守",
  "Fraud, Abuse & Conduct": "詐欺、濫用與操守",
  "Multi-account, payment fraud, wash trading, collusion.": "多帳戶、支付詐欺、對敲與串通。",
  PRODUCT_CONFIG: "產品與交易條件",
  "Product Config": "產品與交易條件",
  "Product & Trading Conditions": "產品與交易條件",
  "Leverage, swaps, account-type mispricing, promo abuse.": "槓桿、隔夜利息、帳戶類型錯價、促銷濫用。",
  MODEL_AI: "模型與 AI",
  "Model Ai": "模型與 AI",
  "Model & AI Decision Risk": "模型與 AI 決策風險",
  "Detector drift, false positives, explainability gates.": "偵測器漂移、誤報、可解釋性關卡。",
  OPS_PROCESS: "營運流程",
  "Ops Process": "營運流程",
  "Operational & Process Risk": "營運與流程風險",
  "Funding, recon, overrides, incident runbooks.": "資金、對帳、覆寫、事故手冊。",
  REG_CAPITAL: "監管與資本",
  "Reg Capital": "監管與資本",
  "Regulatory, Entity & Capital": "監管、實體與資本",
  "Entity-aware limits, segregation, capital thresholds.": "依實體之限額、隔離與資本門檻。",
  TECH_INFRA: "平台與技術",
  "Tech Infra": "平台與技術",
  "Platform & Technology Risk": "平台與技術風險",
  "Servers, feeds, APIs, wallets, kill-switches.": "伺服器、饋送、API、錢包、緊急開關。",
  "Crypto Exchange Stack": "加密交易所堆疊",
  "Matching, liquidations, wallet float, market integrity.": "撮合、強平、錢包浮額、市場完整性。",
  "Margin, stop-out, concentration, toxic flow, copy-trade cascade.":
    "保證金、強平、集中度、有毒流量、跟單連鎖。",
  OTHER: "其他",
  "CFD + Crypto": "CFD＋加密",
  "CFD+Crypto": "CFD＋加密",
  "Crypto Exchange": "加密交易所",
  Platform: "平台",
  Crypto: "加密",
  CFD: "CFD",

  // Departments
  "Book owner for Vantage forex CFD (MT4/MT5 via oneZero) and the crypto-exchange stack. Sets limit policy, chairs war-rooms, and is the human gate for halt, close-only, leverage cut, LP disable and withdrawal pause. AI may recommend; this BU decides.":
    "Vantage 外匯 CFD（MT4／MT5，經 oneZero）與加密交易所棧之帳簿負責人。制定限額政策、主持戰情室，並為停商品／只平倉／收槓桿／停 LP／暫停出金之人工關卡。AI 可建議；此 BU 做決定。",
  "Runs the client-money and case spine: funding exceptions, EOD reconciliation, ticket triage, promo/bonus execution and client contact. Executes risk decisions; does not set limit policy or arm halt/leverage controls.":
    "負責客戶資金與案件脊柱：資金例外、日終對帳、工單分流、促銷／贈金執行與客戶聯繫。執行風險決策；不制定限額政策，也不啟動停商品／槓桿控制。",
  "Builds and maintains the detection, RCA and evidence layer: detectors, skill playbooks, RAG, challenger packs and alert-quality monitoring. Recommends only — never executes halt, close-only, leverage cut, LP disable or withdrawal pause.":
    "建立並維護偵測、根因與證據層：偵測器、技能劇本、RAG、挑戰包與警報品質監控。只建議 — 永不執行停商品、只平倉、收槓桿、停 LP 或暫停出金。",
  "Owns control-plane plumbing: trading servers, oneZero bridges, LP endpoints, wallets, config change-control, kill-switches, data pipelines, evidence vault, admin privileges and the audit store. Executes switches Risk has armed; does not set book-risk policy.":
    "負責控制面管線：交易伺服器、oneZero 橋接、LP 端點、錢包、設定變更控制、緊急開關、資料管線、證據庫、管理權限與稽核儲存。執行風控已啟動之開關；不制定帳簿風險政策。",

  "Limit policy, entity-aware exposure caps, and the breach-authority matrix (CFD + crypto)":
    "限額政策、依實體之曝險上限，以及違規授權矩陣（CFD＋加密）",
  "Market, credit, liquidity and LP-hedge risk on the live CFD book (A-book / B-book)":
    "即時 CFD 帳簿（A-book／B-book）之市場、信貸、流動性與 LP 對沖風險",
  "Crypto exchange: wallet-float policy, liquidation backlog, oracle lag, insurance-fund drawdown, OI concentration":
    "加密交易所：錢包浮額政策、強平積壓、預言機延遲、保險基金回撤、持倉集中度",
  "Human approval of halt / close-only / group leverage cut / LP disable / large-withdrawal pause":
    "停商品／只平倉／組別收槓桿／停 LP／大額出金暫停之人工核准",
  "Daily risk dashboard, risk-domain RACI, and residual-risk sign-off after incidents":
    "每日風險儀表板、風險領域 RACI，以及事故後剩餘風險簽核",
  "Copy-trade cascade, toxic-flow, NBP and concentration interventions":
    "跟單連鎖、有毒流量、負餘額與集中度干預",
  "Escalation routes into Risk Control Desk and Crypto Exchange Risk":
    "通往風險控管台與加密交易所風險之升級路徑",
  "War-room decisions on BREACH/CRITICAL until residual risk is accepted in writing":
    "BREACH／CRITICAL 戰情室決策，直至剩餘風險書面接受",
  "Policy changes that alter client trading conditions (leverage, spreads, product groups, entity packs)":
    "改變客戶交易條件之政策（槓桿、點差、商品組、實體包）",
  "Named owner on every risk domain tagged RISK_CONTROL": "所有標記 RISK_CONTROL 之風險領域具名負責人",
  "Post-incident risk memo and lessons fed into RAG": "事故後風險備忘與教訓寫入 RAG",
  "Operations — funding exceptions and withdrawal pauses that have credit, AML or fraud impact":
    "營運 — 具信貸、AML 或詐欺影響之資金例外與出金暫停",
  "AI — detector promotion (Risk is checker), RCA challenge, skill-playbook certainty":
    "AI — 偵測器晉升（風控為 Checker）、根因挑戰、技能劇本確定性",
  "System — kill-switches, feed health, LP/bridge failover, wallet infrastructure":
    "系統 — 緊急開關、饋送健康、LP／橋接備援、錢包基礎設施",
  "Crypto Exchange Risk team — matching-engine, oracle and hot-wallet incidents":
    "加密交易所風險團隊 — 撮合引擎、預言機與熱錢包事故",
  "Day-to-day deposit/withdrawal case work and EOD recon (Operations)":
    "日常入金／出金案件與日終對帳（營運）",
  "Training detectors or promoting shadow → live as maker (AI Engineer; Risk is checker)":
    "訓練偵測器或以 Maker 將影子晉升為正式（AI 工程師；風控為 Checker）",
  "Patching trading servers, bridges or wallets (System)": "修補交易伺服器、橋接或錢包（系統）",
  "Changing platform feature flags that are not risk thresholds this BU owns":
    "變更非本 BU 擁有之風險門檻的平台功能旗標",
  "SUPER_ADMIN / demo platform owner on multi-entity or capital-threshold events":
    "跨實體或資本門檻事件升級至 SUPER_ADMIN／示範平台負責人",
  "Legal/compliance (outside CRMP) when entity segregation or licence limits are at risk":
    "實體隔離或牌照限額受威脅時升級至法遵（CRMP 外）",

  "Deposit and withdrawal exception queues, including crypto on-chain rails":
    "入金／出金例外佇列，含加密鏈上通道",
  "EOD reconciliations, Nostro/Vostro breaks, and bonus-wallet mismatches":
    "日終對帳、Nostro／Vostro 差異與贈金錢包不符",
  "Ticket triage, client contact, and case notes that the spine can audit":
    "工單分流、客戶聯繫，以及脊柱可稽核之案件紀錄",
  "Promo / bonus ops execution and clawback after Risk or Fraud flags":
    "促銷／贈金作業執行，以及風控或詐欺標記後之追回",
  "Operational runbooks for funding freezes that Risk has already approved":
    "風控已核准之資金凍結營運手冊",
  "Client-facing status on halted symbols or paused withdrawals (after a Risk decision)":
    "停商品或暫停出金之客戶狀態（風控決策之後）",
  "Completeness of recon before the daily dashboard is published": "每日儀表板發布前對帳完整性",
  "SLA on funding tickets that sit on escalation routes": "位於升級路徑之資金工單 SLA",
  "Accurate client communication that does not pre-empt a Risk decision":
    "準確客戶溝通，且不搶先風控決策",
  "Risk Control — when a withdrawal pause or credit freeze is proposed":
    "風險控管 — 提案暫停出金或信貸凍結時",
  "System — payment-rail, wallet-ops and banking-file incidents":
    "系統 — 支付通道、錢包作業與銀行檔案事故",
  "AI — fraud/bonus detectors that need case evidence": "AI — 需要案件證據之詐欺／贈金偵測器",
  "Credit & Client Risk team — NBP clusters tied to funding delays":
    "信貸與客戶風險團隊 — 與資金延遲相關之負餘額叢集",
  "Setting leverage, halt, LP or wallet-float policy (Risk Control)":
    "制定槓桿、停商品、LP 或錢包浮額政策（風險控管）",
  "Approving high-severity interventions (Risk Owner / dual control)":
    "核准高嚴重度干預（風險負責人／雙重控制）",
  "Changing detectors, skills or the RAG corpus (AI)": "變更偵測器、技能或 RAG 語料（AI）",
  "Admin privilege and audit-store configuration (System)": "管理權限與稽核庫設定（系統）",
  "OPS_LEAD → RISK_OWNER when a funding case becomes credit, fraud or market risk":
    "資金案件變成信貸、詐欺或市場風險時：OPS_LEAD → RISK_OWNER",
  "SYSTEM_ADMIN when payment rails or wallets are down": "支付通道或錢包故障時升級至 SYSTEM_ADMIN",

  "Anomaly, toxic-flow, copy-cascade and crypto-liquidation detector catalogue":
    "異常、有毒流量、跟單連鎖與加密強平偵測器目錄",
  "AI RCA narratives with evidence links into RAG and the spine":
    "附 RAG 與脊柱證據連結之 AI 根因敘事",
  "Alert quality, false-positive rate, and model-drift monitoring":
    "警報品質、誤報率與模型漂移監控",
  "Shadow → live detector promotion as maker (Risk Owner is checker on live)":
    "以 Maker 將影子偵測器晉升為正式（正式上線由風險負責人 Checker）",
  "Skill playbooks (SKILL.md), Knowledge Tree mapping, and RAG document hygiene":
    "技能劇本（SKILL.md）、知識樹對映與 RAG 文件整潔",
  "Second-AI challenger configuration (in-repo heuristic today; independent vendor is RM-04)":
    "第二 AI 挑戰者設定（今日為庫內啟發式；獨立供應商為 RM-04）",
  "Human-only AI access blocklist recommendations (AI Access Security)":
    "僅限人工之 AI 存取封鎖清單建議（AI 存取安全）",
  "Explainability of every auto-triggered analysis on the spine": "脊柱上每筆自動分析之可解釋性",
  "Maker/checker dual control on AI Admin settings, training runs and skill edits":
    "AI 管理設定、訓練與技能編輯之 Maker／Checker 雙重控制",
  "That the AI service role never receives halt / close-only / secret permissions":
    "AI 服務角色永不可獲得停商品／只平倉／機密權限",
  "Risk Control — checker on live detector promotion and intervention recommendations":
    "風險控管 — 正式偵測器晉升與干預建議之 Checker",
  "Operations — case evidence that trains fraud/bonus skills":
    "營運 — 訓練詐欺／贈金技能之案件證據",
  "System — data-source health that feeds detectors and RAG":
    "系統 — 餵給偵測器與 RAG 之資料來源健康",
  "All BUs — when a skill certainty gate fails and RCA falls back to RAG":
    "全部 BU — 技能確定性關卡失敗而 RCA 回退 RAG 時",
  "Final intervention authority (Risk / Ops / System per domain RACI)":
    "最終干預權（依領域 RACI：風控／營運／系統）",
  "Changing production Monitor 2.0 upstream thresholds (owner BU + System)":
    "變更正式 Monitor 2.0 上游門檻（負責 BU＋系統）",
  "User directory, SSO and break-glass admin (System / Super Admin)":
    "使用者目錄、SSO 與緊急管理（系統／超級管理員）",
  "Client contact or funding-ticket ownership (Operations)": "客戶聯繫或資金工單權責（營運）",
  "RISK_OWNER when a detector should go live or a recommendation needs a human gate":
    "偵測器應上線或建議需人工關卡時升級至 RISK_OWNER",
  "AI Engineer on-call → SYSTEM_ADMIN on pipeline or source outages":
    "管線或來源中斷時：AI 工程師值班 → SYSTEM_ADMIN",

  "Trading server / oneZero bridge / LP endpoint health and failover":
    "交易伺服器／oneZero 橋接／LP 端點健康與備援",
  "Config change control, non-risk feature flags, and platform kill-switches":
    "設定變更控制、非風險功能旗標與平台緊急開關",
  "Data pipelines into Monitor, detectors, RAG and the evidence vault":
    "通往 Monitor、偵測器、RAG 與證據庫之資料管線",
  "Admin privileges, session store, and immutable audit logging":
    "管理權限、工作階段儲存與不可變稽核紀錄",
  "Data-source registry (internal + external) and connector credentials":
    "資料來源登錄（內部＋外部）與連接憑證",
  "Crypto wallet infrastructure (hot / warm / cold) — not float policy (Risk)":
    "加密錢包基礎設施（熱／溫／冷）— 浮額政策屬風控",
  "Availability of CRMP, Monitor sync, and messenger routes":
    "CRMP、Monitor 同步與通訊路由之可用性",
  "Segregation of duties between settings.manage and risk.intervene":
    "settings.manage 與 risk.intervene 之職責分離",
  "That every kill-switch execution is logged to spine + audit":
    "每次緊急開關執行皆寫入脊柱＋稽核",
  "Risk Control — which kill-switches exist and who may arm them":
    "風險控管 — 有哪些緊急開關、誰可啟動",
  "AI — source freshness and pipeline SLAs for detectors":
    "AI — 偵測器之來源新鮮度與管線 SLA",
  "Operations — payment-rail and banking-file incidents":
    "營運 — 支付通道與銀行檔案事故",
  "SUPER_ADMIN — break-glass access and privilege reviews":
    "SUPER_ADMIN — 緊急存取與權限審閱",
  "Limit policy and book-risk decisions (Risk Control)": "限額政策與帳簿風險決策（風險控管）",
  "Client case handling and recon ownership (Operations)": "客戶案件處理與對帳權責（營運）",
  "Model training and RCA narrative quality (AI)": "模型訓練與根因敘事品質（AI）",
  "Accepting residual market or credit risk after an incident": "事故後接受剩餘市場或信貸風險",
  "SUPER_ADMIN on privilege, data-loss or multi-system outage":
    "權限、資料遺失或多系統中斷時升級至 SUPER_ADMIN",
  "RISK_OWNER when infrastructure failure creates market or wallet risk":
    "基礎設施故障造成市場或錢包風險時升級至 RISK_OWNER",

  // Keep legacy short department copy so older snapshots still translate
  "Owns market, credit, liquidity and limit policy; decides escalations and interventions.":
    "負責市場、信貸、流動性與限額政策；決定升級與干預。",
  "Runs funding, reconciliation, client handling and case execution.":
    "負責資金、對帳、客戶處理與案件執行。",
  "Builds detectors, root-cause narratives and alert prioritisation models.":
    "建立偵測器、根因敘事與警報優先模型。",
  "Admin, infra, LP endpoints, bridges, trading servers and audit store.":
    "管理、基礎建設、LP 端點、橋接、交易伺服器與稽核儲存。",
  "Limit policy & breach authority": "限額政策與違規授權",
  "Market / credit / LP hedge risk": "市場／信貸／LP 對沖風險",
  "Human approval of high-severity actions": "高嚴重度動作之人工核准",
  "Daily risk dashboard ownership": "每日風險儀表板權責",
  "Deposit / withdrawal exceptions": "入金／出金例外",
  "EOD reconciliations": "日終對帳",
  "Ticket triage & client contact": "工單分流與客戶聯繫",
  "Promo / bonus ops execution": "促銷／贈金作業執行",
  "Anomaly & toxic-flow models": "異常與有毒流量模型",
  "AI RCA narratives with evidence links": "附證據連結之 AI 根因敘事",
  "Alert quality / model drift monitoring": "警報品質／模型漂移監控",
  "Shadow → live detector promotion": "影子 → 正式偵測器晉升",
  "Trading server / bridge / LP health": "交易伺服器／橋接／LP 健康",
  "Config change control & kill-switches": "設定變更控制與緊急開關",
  "Data pipelines & evidence vault": "資料管線與證據庫",
  "Admin privileges & audit logging": "管理權限與稽核紀錄",

  // Teams
  "Ops Funding & Recon": "營運資金與對帳",
  "AI Detection Lab": "AI 偵測實驗室",
  "Trading Infra & Bridges": "交易基礎設施與橋接",
  "Real-time book risk, limit breaches, hedge coverage, intervention authority.":
    "即時帳簿風險、限額違規、對沖覆蓋、干預授權。",
  "Margin, stop-out, concentration, toxic flow and copy-trade cascade monitoring.":
    "保證金、強平、集中度、有毒流量與跟單連鎖監控。",
  "Deposit/withdrawal exceptions, EOD recon breaks, client case handling.":
    "入金／出金例外、日終對帳差異、客戶案件處理。",
  "Detectors, RCA narratives, alert prioritisation and model quality.":
    "偵測器、根因敘事、警報優先與模型品質。",
  "Servers, oneZero bridges, LP endpoints, config control, kill-switches.":
    "伺服器、oneZero 橋接、LP 端點、設定控制、緊急開關。",
  "Wallet float, order book integrity, liquidation engine and market abuse.":
    "錢包浮額、訂單簿完整性、強平引擎與市場濫用。",
  "Primary → Secondary → Risk Owner": "主責 → 備援 → 風險負責人",
  "Analyst → Risk Owner": "分析師 → 風險負責人",
  "Ops Analyst → Ops Lead": "營運分析師 → 營運主管",
  "AI Engineer on-call": "AI 工程師值班",
  "System Admin → Infra Lead": "系統管理員 → 基礎設施主管",
  "Crypto Risk Analyst → Risk Owner": "加密風險分析師 → 風險負責人",
  Operations: "營運",
  System: "系統",
  Ops: "營運",
  "Infra + Credit": "基礎設施＋信貸",
  "Crypto Risk": "加密風險",

  // Roles
  SUPER_ADMIN: "超級管理員",
  "Super Admin": "超級管理員",
  "Cross-department platform administrator. Holds break-glass access to users, settings, detectors and AI Admin without a single-BU RACI constraint. Used for the demo platform owner and exceptional incidents — not for daily book risk.":
    "跨部門平台管理員。對使用者、設定、偵測器與 AI 管理持有緊急存取，不受單一 BU 之 RACI 約束。供示範平台負責人與例外事故使用 — 不是每日帳簿風險。",
  "User and role assignment, including emergency privilege": "使用者與角色指派，含緊急權限",
  "Platform-wide settings, feature flags and kill-switch configuration":
    "全平台設定、功能旗標與緊急開關配置",
  "Break-glass override of maker/checker after an incident is declared":
    "事故宣告後對 Maker／Checker 之緊急覆寫",
  "Audit-log retention and the admin-access security blocklist":
    "稽核日誌保留與管理存取安全封鎖清單",
  "Create, disable and reassign users across departments": "跨部門建立、停用與改派使用者",
  "Review any admin page; operate AI Admin when no departmental checker is available":
    "檢視任何管理頁；部門 Checker 不可用時操作 AI 管理",
  "Reset demo data and documentation overlays in this prototype":
    "在此原型重設示範資料與文件覆蓋",
  "Authorise System to execute a platform-wide kill-switch": "授權系統執行全平台緊急開關",
  "Own the daily CFD or crypto risk book (that is the Risk Owner)":
    "擁有每日 CFD 或加密風險帳簿（那是風險負責人）",
  "Replace departmental decision rights on client-facing interventions unless escalated":
    "在未升級前取代部門對客戶面干預之決策權",
  "Act as the default maker on detector training or shadow runs (AI Engineer)":
    "擔任偵測器訓練或影子執行之預設 Maker（AI 工程師）",
  "Named demo platform owner (haixiang.yan@hytechc.com) / board for capital or licence events":
    "資本或牌照事件升級至具名示範平台負責人（haixiang.yan@hytechc.com）／董事會",
  "Full platform administration across all departments.": "跨全部門的完整平台管理。",
  RISK_OWNER: "風險負責人",
  "Department owner for Risk Control. Accountable for limit policy, escalations, war-room, and the human gate on high-severity interventions across forex CFD and the crypto exchange.":
    "風險控管部門負責人。對外匯 CFD 與加密交易所之限額政策、升級、戰情室，以及高嚴重度干預之人工關卡課責。",
  "Limit policy, breach authority, and residual-risk acceptance":
    "限額政策、違規授權與剩餘風險接受",
  "Checker role on live detector promotion and risk-facing AI Admin settings":
    "正式偵測器晉升與風險向 AI 管理設定之 Checker",
  "Approve / reject Human Intervention for halt, leverage, LP disable and wallet pause":
    "核准／駁回停商品、槓桿、停 LP 與錢包暫停之人工干預",
  "Chair BREACH/CRITICAL war-rooms until residual risk is signed":
    "主持 BREACH／CRITICAL 戰情室直至剩餘風險簽核",
  "Tune risk thresholds this BU owns (not System-only flags)":
    "調整本 BU 擁有之風險門檻（非僅系統旗標）",
  "Assign Risk Analysts on-call and review the daily risk dashboard":
    "指派風險分析師值班並審閱每日風險儀表板",
  "Challenge AI RCA when the second-AI verdict is DISAGREE or PARTIAL":
    "第二 AI 裁決為 DISAGREE 或 PARTIAL 時挑戰 AI 根因",
  "Sign entity-aware leverage or product-group changes before they go live":
    "依實體之槓桿或商品組變更上線前簽核",
  "Process funding tickets or speak to clients as case owner (Operations)":
    "以案件負責人處理資金工單或對客（營運）",
  "Patch bridges, LPs or wallets (System)": "修補橋接、LP 或錢包（系統）",
  "Auto-execute halt / close-only — those stay human-gated, including for this role's own proposals when dual-control applies":
    "自動執行停商品／只平倉 — 即使是本角色提案，雙重控制時仍須人工關卡",
  "SUPER_ADMIN / demo platform owner on entity-capital, multi-entity or licence-limit events":
    "實體資本、跨實體或牌照限額事件升級至 SUPER_ADMIN／示範平台負責人",
  "Risk department owner — policy, escalations, interventions.": "風險部門負責人 — 政策、升級、干預。",
  RISK_ANALYST: "風險分析師",
  "Risk Analyst": "風險分析師",
  "First-line Risk Control operator. Monitors alerts, investigates with AI RCA and evidence, proposes actions, and pages the Risk Owner when a human gate is required.":
    "風險控管一線操作員。監控警報、以 AI 根因與證據調查、提案動作，並在需要人工關卡時呼叫風險負責人。",
  "Live alert queue for Risk Control domains during the shift":
    "值班期間風險控管領域之即時警報佇列",
  "Investigation packs: Monitor evidence, RAG, market intel, messenger thread":
    "調查包：Monitor 證據、RAG、市場情報、Messenger 執行緒",
  "Draft intervention recommendations (maker) for the Risk Owner to check":
    "草擬干預建議（Maker）供風險負責人 Checker",
  "Ack, annotate and escalate alerts on Demo Messenger":
    "在示範 Messenger 確認、註記並升級警報",
  "Run detectors in operate mode and attach evidence to the spine":
    "以操作模式執行偵測器並把證據附到脊柱",
  "Propose halt / leverage / LP / pause — never confirm high-severity actions alone":
    "提案停商品／槓桿／LP／暫停 — 絕不單獨確認高嚴重度動作",
  "Feed post-incident notes into the case thread for RAG later":
    "把事故後筆記寫進案件執行緒，供之後 RAG 使用",
  "Approve high-severity interventions or change limit policy": "核准高嚴重度干預或變更限額政策",
  "Manage users, platform settings, or AI Admin checker steps":
    "管理使用者、平台設定或 AI 管理 Checker 步驟",
  "Close a CRITICAL without Risk Owner (or dual-control) sign-off":
    "未經風險負責人（或雙重控制）簽核即關閉 CRITICAL",
  "RISK_OWNER (primary) → SUPER_ADMIN if the owner is unreachable past SLA":
    "RISK_OWNER（主責）→ 逾 SLA 無法聯繫時 SUPER_ADMIN",
  "Monitors alerts, investigates, proposes actions.": "監控警報、調查並提案動作。",
  OPS_LEAD: "營運主管",
  "Operations Lead": "營運主管",
  "Owns Operations queues: funding exceptions, EOD recon, ticket SLA, and client-facing execution of risk decisions. Checker for ops-side interventions; maker for case assignment.":
    "負責營運佇列：資金例外、日終對帳、工單 SLA，以及風險決策之對客執行。營運側干預之 Checker；案件指派之 Maker。",
  "Ops Funding & Recon team SLA and on-call roster": "營運資金與對帳團隊 SLA 與值班表",
  "Withdrawal / deposit exception policy inside rails Risk has not frozen":
    "風控尚未凍結通道內之出金／入金例外政策",
  "Client communication after a Risk decision (halted symbol, paused withdrawal)":
    "風控決策後之客戶溝通（停商品、暫停出金）",
  "Ops dashboard scope (dashboard.ops)": "營運儀表板範圍（dashboard.ops）",
  "Prioritise recon breaks before the daily dashboard is published":
    "每日儀表板發布前優先處理對帳差異",
  "Approve ops-severity interventions; escalate credit or fraud to Risk":
    "核准營運嚴重度干預；信貸或詐欺升級至風控",
  "Manage Lark channels used by Ops Funding & Recon": "管理營運資金與對帳使用之 Lark 頻道",
  "Dual-control with Risk when a funding freeze is credit-related":
    "資金凍結與信貸相關時與風控雙重控制",
  "Set leverage, halt, LP or wallet-float policy": "制定槓桿、停商品、LP 或錢包浮額政策",
  "Promote detectors or edit RAG as owner": "以負責人晉升偵測器或編輯 RAG",
  "Grant admin privileges or change platform kill-switches": "授予管理權限或變更平台緊急開關",
  "RISK_OWNER when a case becomes credit, fraud or market risk":
    "案件變成信貸、詐欺或市場風險時升級至 RISK_OWNER",
  "Owns ops queues, funding exceptions and reconciliations.": "負責營運佇列、資金例外與對帳。",
  OPS_ANALYST: "營運分析師",
  "Operations Analyst": "營運分析師",
  "Handles operational tickets and case work: funding exceptions, recon items, client contact, and evidence capture for AI fraud/bonus skills.":
    "處理營運工單與案件：資金例外、對帳項目、客戶聯繫，以及 AI 詐欺／贈金技能之證據擷取。",
  "Assigned tickets in Ops Funding & Recon": "營運資金與對帳之指派工單",
  "Case notes and client-contact logs that the spine can audit":
    "脊柱可稽核之案件紀錄與客戶聯繫日誌",
  "First-pass recon exception classification": "對帳例外之第一關分類",
  "Work the ops queue, update ticket status, notify via messenger":
    "處理營運佇列、更新工單狀態、經 Messenger 通知",
  "Collect payment-rail / on-chain evidence for AI and Risk":
    "為 AI 與風控蒐集支付通道／鏈上證據",
  "Execute a freeze or release only after the documented approval":
    "僅在有紀錄之核准後執行凍結或放行",
  "Close credit-impacted withdrawals without the Operations Lead":
    "未經營運主管即關閉有信貸影響之出金",
  "Change Monitor thresholds, detectors or platform settings":
    "變更 Monitor 門檻、偵測器或平台設定",
  "Tell a client a risk decision that Risk has not signed":
    "向客戶告知風控尚未簽核之風險決策",
  "OPS_LEAD → RISK_OWNER if the case is credit or fraud":
    "案件為信貸或詐欺時：OPS_LEAD → RISK_OWNER",
  "Handles tickets and operational case work.": "處理工單與營運案件。",
  AI_ENGINEER: "AI 工程師",
  "AI Engineer": "AI 工程師",
  "Maintains detectors, RCA models, skill playbooks, RAG pipelines and the challenger. Maker on AI Admin; cannot be the sole checker on live promotion.":
    "維護偵測器、根因模型、技能劇本、RAG 管線與挑戰者。AI 管理之 Maker；不可單獨擔任正式晉升之 Checker。",
  "Detector catalogue health, shadow runs, and drift monitors":
    "偵測器目錄健康、影子執行與漂移監控",
  "Skill playbook accuracy and Knowledge Tree links": "技能劇本準確度與知識樹連結",
  "RAG corpus freshness and source citations": "RAG 語料新鮮度與來源引用",
  "AI analysis pipeline as maker (auto-on-alarm, certainty gate, challenger settings)":
    "以 Maker 負責 AI 分析管線（警報自動觸發、確定性關卡、挑戰者設定）",
  "Propose AI Admin changes, training runs and skill edits":
    "提案 AI 管理變更、訓練執行與技能編輯",
  "Investigate false positives with the Risk Analyst": "與風險分析師調查誤報",
  "Keep human-only AI access blocklist recommendations current":
    "維持僅限人工之 AI 存取封鎖清單建議為最新",
  "Operate detectors and attach RCA evidence": "操作偵測器並附上根因證據",
  "Approve their own live detector promotion (Risk Owner or a different checker)":
    "核准自己的正式偵測器晉升（須風險負責人或另一位 Checker）",
  "Execute halt / leverage / LP / withdrawal actions": "執行停商品／槓桿／LP／出金動作",
  "Change platform-wide kill-switches (System)": "變更全平台緊急開關（系統）",
  "RISK_OWNER for live promotion and intervention recommendations":
    "正式晉升與干預建議升級至 RISK_OWNER",
  "SYSTEM_ADMIN for source or pipeline outages": "來源或管線中斷升級至 SYSTEM_ADMIN",
  "Maintains detectors, RCA models and evidence pipelines.": "維護偵測器、根因模型與證據管線。",
  SYSTEM_ADMIN: "系統管理員",
  "Infra, LP endpoints, bridges, servers, wallets, config change-control and platform configuration. Executes kill-switches that Risk has armed; does not set book-risk policy.":
    "基礎設施、LP 端點、橋接、伺服器、錢包、設定變更控制與平台配置。執行風控已啟動之緊急開關；不制定帳簿風險政策。",
  "Trading Infra & Bridges on-call": "交易基礎設施與橋接值班",
  "Data-source connectors, credentials and refresh cadence":
    "資料來源連接器、憑證與刷新節奏",
  "settings.manage for non-risk flags, sessions and the audit store":
    "非風險旗標、工作階段與稽核庫之 settings.manage",
  "User / team management within System (and support for other BUs)":
    "系統部門內使用者／團隊管理（並支援其他 BU）",
  "Patch, failover and health-check LP / bridge / wallet / server":
    "修補、備援與健康檢查 LP／橋接／錢包／伺服器",
  "Arm or execute a kill-switch when Risk (or Super Admin) has authorised it":
    "風控（或超級管理員）授權後啟動或執行緊急開關",
  "Register new internal and external sources": "登錄新的內部與外部來源",
  "Investigate tech-domain alerts (stale quotes from feed, API errors, wallet daemons)":
    "調查技術領域警報（饋送過期報價、API 錯誤、錢包常駐程式）",
  "Accept residual market or credit risk": "接受剩餘市場或信貸風險",
  "Train models or write RCA as owner": "以負責人訓練模型或撰寫根因",
  "Handle client funding cases": "處理客戶資金案件",
  "RISK_OWNER when infra failure creates book or wallet risk":
    "基礎設施故障造成帳簿或錢包風險時升級至 RISK_OWNER",
  "SUPER_ADMIN on privilege, data-loss or multi-system outage":
    "權限、資料遺失或多系統中斷時升級至 SUPER_ADMIN",
  "Infra, LP endpoints, bridges, servers and platform config.": "基礎設施、LP 端點、橋接、伺服器與平台設定。",
  VIEWER: "檢視者",
  Viewer: "檢視者",
  "Read-only observer of dashboards, org chart, source registry, analyses and docs. Cannot operate alerts, interventions, AI Admin or settings. Typical board / auditor persona.":
    "儀表板、組織圖、來源登錄、分析與文件之唯讀觀察者。不能操作警報、干預、AI 管理或設定。典型董事會／稽核角色。",
  "No operational RACI — may raise questions in messenger threads they can read":
    "無營運 RACI — 可在其能讀取之 Messenger 執行緒提問",
  "Open dashboards, docs, RAG, skills (read), alerts (read) and org pages":
    "開啟儀表板、文件、RAG、技能（讀）、警報（讀）與組織頁",
  "Follow the spine log and the audit trail they are permitted to see":
    "追蹤其獲准查看之脊柱日誌與稽核軌跡",
  "Ack, escalate, intervene, edit users, change settings, or run AI Admin":
    "確認、升級、干預、編輯使用者、變更設定或操作 AI 管理",
  "Be assigned as on-call or as maker/checker": "被指派值班或擔任 Maker／Checker",
  "Sponsoring BU owner (usually RISK_OWNER or SUPER_ADMIN) outside the product":
    "產品外之贊助 BU 負責人（通常為 RISK_OWNER 或 SUPER_ADMIN）",
  "Read-only access to dashboards, org chart and source registry.": "儀表板、組織與來源登錄之唯讀權限。",

  // Settings descriptions
  "Centralised Risk Management Platform": "集中式風險管理平台",
  "Named platform and documentation owner": "具名平台與文件負責人",
  "Platform owner contact": "平台負責人聯絡方式",
  "Owner of PRD, TSD, User Guide and UAT packs": "PRD、TSD、使用手冊與 UAT 包負責人",
  "Monitor 2.0 base URL": "Monitor 2.0 網址",
  "Bi-directional alert/ticket sync": "警報／工單雙向同步",
  "Lark app id (prototype)": "Lark 應用 ID（原型）",
  "Enable Lark notifications": "啟用 Lark 通知",
  "AI root-cause analysis on new breaches": "新違規時執行 AI 根因分析",
  "Auto-trigger AI analysis when Monitor indicators alarm": "Monitor 指標告警時自動觸發 AI 分析",
  "Auto-execute skills only when conditions match with certainty": "僅在條件確定匹配時自動執行技能",
  "Default SLA when route missing": "路徑未定義時的預設 SLA",
  "Products in scope": "涵蓋產品",
  "Minimum alert severity that triggers independent second AI challenger (WARN|BREACH|CRITICAL)":
    "觸發獨立第二 AI 挑戰者的最低警報嚴重度（警告｜違規｜危急）",
  "Detectors raise Monitor alarms when warn/breach": "偵測器在警告／違規時發出 Monitor 警報",
  "Enable 5-minute market intelligence scanner": "啟用五分鐘市場情報掃描",
  "Scan cadence in minutes": "掃描節奏（分鐘）",
  "Dedicated messenger group for intel pushes": "情報推送專用通訊群組",

  // Monitor indicators
  "Company Equity Drawdown": "公司權益回撤",
  "Accounts >90% Margin Utilisation": "保證金使用率 >90% 帳戶數",
  "LP Reject Rate (oneZero)": "LP 拒單率（oneZero）",
  "Hedge Coverage Ratio": "對沖覆蓋率",
  "XAUUSD247 Net Exposure": "XAUUSD247 淨曝險",
  "Hot Wallet Float Ratio": "熱錢包浮額比例",
  "Liquidation Engine Backlog": "強平引擎積壓",
  "Top Signal Provider Copier Concentration": "頭部訊號提供者跟單集中度",
  "Stale Quote Symbols": "過期報價商品數",
  "Multi-account Cluster Score": "多帳戶叢集分數",
  "Stop-out Count (5m window)": "強平筆數（5 分鐘）",
  "Negative Balance Account Count": "負餘額帳戶數",
  "Avg Client Slippage (majors, 15m)": "客戶平均滑點（主要商品，15 分鐘）",
  "Bridge Fill Latency p95": "橋接成交延遲 p95",
  "A-book Volume Ratio (session)": "A-book 成交量比例（時段）",
  "1-day VaR Utilisation": "1 日 VaR 使用率",
  "Corr Matrix Drift vs Baseline": "相關矩陣相對基準漂移",
  "Estimated Gap Exposure (USD)": "估計缺口曝險（美元）",
  "Spread vs Session Median Ratio": "點差相對時段中位數倍率",
  "New Accounts at Max Leverage (24h)": "新帳戶使用最高槓桿（24 小時）",
  "Bonus Converted to Cash (24h USD)": "贈金兌現（24 小時美元）",
  "Withdrawal Volume (1h USD)": "出金量（1 小時美元）",
  "Funding Exceptions (1h)": "資金例外（1 小時）",
  "Payment Fraud Model Score": "支付詐欺模型分數",
  "Wash/Collusion Detection Score": "對敲／串通偵測分數",
  "Trading API Error Rate (5m)": "交易 API 錯誤率（5 分鐘）",
  "Detector Precision (7d rolling)": "偵測器精確率（7 日滾動）",
  "Entity Capital Buffer Ratio": "實體資本緩衝比例",
  "Client Money Segregation Gap (USD)": "客戶資金隔離缺口（美元）",
  "Mark Price Oracle Lag": "標記價格 Oracle 延遲",
  "Insurance Fund Daily Drawdown": "保險基金日回撤",
  "Top Account OI Share (per contract)": "頭部帳戶持倉佔比（每合約）",
  "Crypto Deposits (1h USD)": "加密入金（1 小時美元）",
  "Latency Arb Toxicity Score": "延遲套利毒性分數",
  "Symbols with Swap vs Benchmark Δ": "隔夜利息相對基準偏離商品數",
  "Market Intelligence High-Impact Hits (5m)": "市場情報高影響命中（5 分鐘）",

  // Detectors
  "Accounts >90% margin utilisation": "保證金使用率 >90% 帳戶數",
  "Counts accounts near stop-out; spikes often during US open / macro.":
    "統計接近強平帳戶；美盤開盤／宏觀時段常暴衝。",
  "Copy provider concentration": "跟單提供者集中度",
  "Top signal provider share of copy equity.": "頭部訊號提供者佔跟單權益比例。",
  "Company equity drawdown": "公司權益回撤",
  "CFD book drawdown detector.": "CFD 帳簿回撤偵測器。",
  "Hedge coverage ratio": "對沖覆蓋率",
  "A-book hedge coverage vs target (lower is worse).": "A-book 對沖覆蓋相對目標（越低越差）。",
  "LP reject rate": "LP 拒單率",
  "oneZero / LP reject rate storm detector.": "oneZero／LP 拒單率風暴偵測器。",
  "XAUUSD247 net exposure": "XAUUSD247 淨曝險",
  "24/7 gold net lots vs product limits.": "24／7 黃金淨手数相對產品上限。",
  "Crypto hot wallet float": "加密熱錢包浮額",
  "Hot wallet float ratio vs custody policy.": "熱錢包浮額比例相對託管政策。",
  "Crypto liquidation backlog": "加密強平積壓",
  "Liquidation engine order backlog.": "強平引擎訂單積壓。",
  "Multi-account cluster score": "多帳戶叢集分數",
  "Promo / mule ring clustering score.": "促銷／車手環叢集分數。",
  "Stale quote symbols": "過期報價商品",
  "Count of symbols with stale LP/client quotes.": "LP／客戶報價過期之商品數。",
  "Market intelligence high-impact hits": "市場情報高影響命中",
  "Count of WARN+ market-intel findings in the latest 5-minute scan (news/social/official affecting LP prices).":
    "最近五分鐘掃描中警告以上市場情報發現數（影響 LP 報價之新聞／社群／官方）。",

  // Alerts / tickets
  "Margin utilisation spike": "保證金使用率暴衝",
  "128 accounts above 90% margin utilisation during US open.": "美盤開盤期間 128 個帳戶保證金使用率超過 90%。",
  "Copy-trade concentration": "跟單集中度",
  "Single signal provider accounts for 31% of copy equity.": "單一訊號提供者佔跟單權益 31%。",
  "Hot wallet float elevated": "熱錢包浮額偏高",
  "Hot wallet float at 18.2% of total custody.": "熱錢包浮額佔總託管 18.2%。",
  "Equity drawdown rising": "權益回撤上升",
  "Company CFD book drawdown at 3.4%.": "公司 CFD 帳簿回撤 3.4%。",
  "Hedge coverage below target": "對沖覆蓋低於目標",
  "Hedge coverage ratio at 82% (warn <85%).": "對沖覆蓋率 82%（警告 <85%）。",
  "Margin utilisation spike — US session": "保證金使用率暴衝 — 美盤",
  "Copy provider concentration >25%": "跟單提供者集中度 >25%",
  "CFD book drawdown warn": "CFD 帳簿回撤警告",
  "Hedge coverage warn": "對沖覆蓋警告",

  // Escalation routes
  "Margin breach → Risk Desk": "保證金違規 → 風險台",
  "LP reject storm": "LP 拒單風暴",
  "Hot wallet float": "熱錢包浮額",
  "Copy concentration": "跟單集中度",
  "Feed stale quotes": "過期報價饋送",
  "Funding exception surge": "資金例外暴增",
  "Model drift CRITICAL": "模型漂移危急",
  create_ticket: "建立工單",
  ai_rca: "AI 根因分析",
  page_oncall: "叫應值班",
  disable_detector_shadow: "停用影子偵測器",

  // Lark purposes
  "Primary risk escalations and interventions": "主要風險升級與干預",
  "Funding, recon and client ops incidents": "資金、對帳與客戶營運事件",
  "Model alerts and RCA draft reviews": "模型警報與根因草稿覆核",
  "Bridge/server/LP P1 pages": "橋接／伺服器／LP 一級叫應",
  "Wallet, liquidation and market integrity": "錢包、強平與市場完整性",
  "CRITICAL only — exec visibility": "僅危急 — 高管可見",
  "AI Detection Alerts": "AI 偵測警報",
  "Executive Risk Bridge": "風險執行橋",

  // Audit / spine
  SEED_DATABASE: "種子資料庫",
  ACK_ALERT: "確認警報",
  UPDATE_SETTING: "更新設定",
  monitor_alert: "監控警報",
  platform_settings: "平台設定",
  platform: "平台",

  // Source categories
  INTERNAL_PLATFORM: "內部平台",
  MESSAGING: "通訊",
  MARKET_DATA: "市場資料",
  LP_LIQUIDITY: "LP 流動性",
  NEWS_MACRO: "新聞宏觀",
  REGULATORY: "監管",
  REFERENCE: "參考",
  CRYPTO: "加密",
  SSO: "SSO",
  APP_SECRET: "應用密鑰",
  VPN: "VPN",
  API_KEY: "API 金鑰",
  INTERNAL: "內部",
  HSM: "HSM",
  NONE: "無",
  VENDOR: "供應商",
  "Real-time": "即時",
  "Event-driven": "事件驅動",
  "Tick / 1s": "Tick／1 秒",
  "1m": "1 分鐘",
  Tick: "Tick",
  "1s–1m": "1 秒–1 分鐘",
  "Daily + intraday": "每日＋盤中",
  Daily: "每日",
  Weekly: "每週",
  Hourly: "每小時",
  "On-demand": "隨選",
  Static: "靜態",
  "On change": "變更時",
  "Near real-time": "近即時",

  // Remaining hop actions / playbook phrases
  "Approve A-book force": "核准強制 A-book",
  "Join war-room if still rising": "若持續上升則加入戰情室",
  "If EQ also WARN": "若權益亦為警告",
  "Case queue": "案件佇列",
  "NBP write-off authority": "負餘額核銷授權",
  "Bridge/LP check": "橋接／LP 檢查",
  "Routing / A-book review": "路由／A-book 覆核",
  "If rejects also BREACH": "若拒單亦違規",
  "De-risk plan": "去風險計畫",
  "If ≥95%": "若 ≥95%",
  "Model review": "模型覆核",
  "Refresh corr inputs": "刷新相關輸入",
  "Gap pack review": "缺口包覆核",
  "Close-only / promo pause": "僅平倉／暫停促銷",
  "Pricing check": "定價檢查",
  "Product condition fix": "產品條件修正",
  "Onboarding review": "開戶覆核",
  "Leverage default cut": "預設槓桿下調",
  "Promo freeze review": "促銷凍結覆核",
  "Trading restriction": "交易限制",
  "Treasury + KYC triage": "資金＋KYC 分流",
  "If crypto float WARN": "若加密浮額為警告",
  "Throttle decision": "節流決策",
  "Exception triage": "例外分流",
  "If credit impacted": "若信貸受影響",
  "Payment hold": "支付暫扣",
  "Trading freeze review": "交易凍結覆核",
  "Conduct case": "操守案件",
  "Account freeze pack": "帳戶凍結包",
  "Inventory drift review": "庫存漂移覆核",
  "Activate SKILL-COPY-CONCENTRATION": "啟動跟單集中度技能",
  "Join margin spike playbook": "加入保證金暴衝劇本",
  "Approve pause copies + leverage tighten": "核准暫停跟單＋收緊槓桿",
  "If EQ ≥5%": "若權益 ≥5%",
  "Page + bridge checklist": "叫應＋橋接清單",
  "Coverage / A-book actions": "覆蓋／A-book 動作",
  "Approve LP disable": "核准停用 LP",
  "Feed failover": "饋送容錯切換",
  "Symbol halt candidates": "停商品候選",
  "Cold sweep": "冷錢包歸集",
  "Scale liq workers": "擴容強平 worker",
  "Withdrawal throttle / pause perps": "出金節流／暫停永續",
  "KYC linkage": "KYC 關聯",
  "Copier cap / pause": "跟單上限／暫停",
  "Close-only prepare": "準備僅平倉",
  "Pause gold promo": "暫停黃金促銷",
  "War-room mode": "戰情室模式",
  "Feed/LP + margin actions": "饋送／LP＋保證金動作",
  "If EQ breach": "若權益違規",
  "Notify Credit & Client Risk": "通知信貸與客戶風險",
  "Notify Crypto Risk + Infra": "通知加密風險＋基礎設施",
  "Notify Crypto Risk": "通知加密風險",
  "Notify Ops War Room": "通知營運戰情室",
  "Notify Trading Infra P1": "通知交易基礎設施 P1",
  "Notify Credit Desk": "通知信貸台",
  "Notify Ops + Risk": "通知營運＋風險",
  "Notify Risk + AI": "通知風險＋AI",
  "Notify Infra + Risk": "通知基礎設施＋風險",
  "Notify Ops + Credit": "通知營運＋信貸",
  "Page Trading Infra P1": "叫應交易基礎設施 P1",
  "Page Trading Infra": "叫應交易基礎設施",
  "Force A-book on top toxic symbols": "對頭部有毒商品強制 A-book",
  "Audit manual overrides": "稽核人工覆寫",
  "List active B-book overrides": "列出現行 B-book 覆寫",
  "Increase A-book on toxic symbols": "對有毒商品提高 A-book",
  "Analyst validates skew": "分析師驗證偏斜",
  "Propose A-book increase on toxic symbols": "提案對有毒商品提高 A-book",
  "Validate inventory skew": "驗證庫存偏斜",
  "Map stressed accounts to top signal providers": "對應受壓帳戶與頭部訊號提供者",
  "Temporary group leverage cut on toxic symbols": "對有毒商品暫時下調組別槓桿",
  "Freeze new account leverage upgrades": "凍結新帳戶槓桿上調",
  "Check margin spike vs top copy providers": "檢查保證金暴衝是否對應頭部跟單提供者",
  "Cap per-provider copier equity at 20%": "每提供者跟單權益上限 20%",
  "Pause new allocations to top provider": "暫停對頭部提供者新分配",
  "Check multi-account concentration among copiers": "檢查跟單者多帳戶集中度",
  "Propose 20% per-provider cap": "提案每提供者 20% 上限",
  "Pause new copies to top provider": "暫停對頭部提供者新跟單",
  "Risk Owner confirms before lifting cap": "解除上限前需風險負責人確認",
  "Sweep to target ≤12% float": "歸集至浮額 ≤12%",
  "Throttle large withdrawals until float normal": "浮額恢復前節流大額出金",
  "Recommend cold sweep to <12%": "建議冷錢包歸集至 <12%",
  "Approve withdrawal pause if float ≥25%": "若浮額 ≥25% 則核准暫停出金",
  "oneZero bridge health checklist": "oneZero 橋接健康清單",
  "Disable top rejecting LP endpoint": "停用拒單最高之 LP 端點",
  "Shift toxic symbols to alternate LP": "將有毒商品改道至備援 LP",
  "Bridge health checklist": "橋接健康清單",
  "Propose disable top rejecting LP": "提案停用拒單最高之 LP",
  "Freeze promo/bonus for cluster": "凍結叢集促銷／贈金",
  "Ops Lead reviews KYC before bans": "停用前由營運主管覆核 KYC",
  "Close-only on confirmed abuse accounts": "對確認濫用帳戶僅平倉",
  "KYC linkage before bans": "停用前先做 KYC 關聯",
  "Prepare close-only messaging": "準備僅平倉訊息",
  "Pause gold promo acquisition": "暫停黃金促銷獲客",
  "Prepare close-only for 15k approach": "接近 1.5 萬手時準備僅平倉",
  "Confirm weekend promo not amplifying exposure": "確認週末促銷未放大曝險",
  "Flatten top contributors": "平倉頭部貢獻部位",
  "Widen spreads on toxic symbols": "擴大有毒商品點差",
  "Confirm macro calendar contribution": "確認宏觀日曆貢獻",
  "Pull RAG + macro for equity DD drivers": "用 RAG＋宏觀核對權益回撤驅動",
  "Approve flatten / widen plan": "核准平倉／擴點差計畫",
  "Temporary halt on stale symbols": "暫時停止過期報價商品",
  "Failover to secondary feed": "容錯切換至備援饋送",
  "Attempt secondary feed failover": "嘗試備援饋送容錯",
  "Propose halt on stale symbols": "提案停止過期報價商品",
  "Autoscale liquidation workers": "自動擴容強平 worker",
  "Pause new high-leverage perps": "暫停新高槓桿永續",
  "Scale liquidation workers": "擴容強平 worker",
  "Pause new high-leverage perps if backlog ≥200": "積壓 ≥200 時暫停新高槓桿永續",
  "Confirm AI/RAG root-cause": "確認 AI／RAG 根因",
  "If pattern recurs, draft new skill via AI Admin": "若模式復發，經 AI 管理起草新技能",
  "Confirm AI/RAG root-cause before acting": "行動前確認 AI／RAG 根因",
  "Stop new allocations to top provider": "停止對頭部提供者新分配",
  "Cut leverage on provider symbols": "下調提供者商品槓桿",
  "Flatten residual inventory": "平倉剩餘庫存",
  "Disable failing LP": "停用故障 LP",
  "Reroute toxic symbols": "改道有毒商品",
  "Enable secondary LP": "啟用備援 LP",
  "Switch to secondary feed": "切換至備援饋送",
  "Halt stale symbols": "停止過期報價商品",
  "Pause auto-liq on affected symbols": "暫停受影響商品自動強平",
  "Sweep to ≤12%": "歸集至 ≤12%",
  "Throttle withdrawals": "節流出金",
  "Freeze promo payouts": "凍結促銷發放",
  "Pause provider copies": "暫停提供者跟單",
  "Close-only on confirmed sybils": "對確認女巫帳戶僅平倉",
  "Arm close-only": "備妥僅平倉",
  "Stop gold acquisition promo": "停止黃金獲客促銷",
  "Pre-hedge before Monday open": "週一開盤前預先對沖",
  "Session leverage cut on hottest symbols": "對最熱商品時段下調槓桿",
  "Widen spreads to slow new risk": "擴大點差以減緩新風險",
  "Review false liqs if feed also WARN": "若饋送亦為警告則覆核誤強平",
  "Correlate with M2-FEED-003 and M2-MRG-014": "與 M2-FEED-003、M2-MRG-014 交叉核對",
  "Approve session leverage cut": "核准時段槓桿下調",
  "Apply entity NBP rules": "套用實體負餘額規則",
  "Close-only until marks validated": "標記價驗證前僅平倉",
  "Rebuild account equity ledger": "重建帳戶權益帳本",
  "Export negative equity list": "匯出負權益清單",
  "Approve NBP application": "核准負餘額政策套用",
  "Bridge latency & session health": "橋接延遲與時段健康",
  "Shift majors to healthier LP": "將主要商品改道至較健康 LP",
  "Widen until fill quality recovers": "成交品質恢復前擴大點差",
  "Bridge + LP latency checklist": "橋接＋LP 延遲清單",
  "Approve reroute / widen": "核准改道／擴點差",
  "Controlled bridge worker recycle": "受控重啟橋接 worker",
  "Failover network path": "網路路徑容錯",
  "Throttle exotic symbols temporarily": "暫時節流冷門商品",
  "Attempt path failover": "嘗試路徑容錯",
  "Approve worker recycle if needed": "必要時核准 worker 重啟",
  "Flatten top VaR contributors": "平倉頭部 VaR 貢獻部位",
  "Temporary gross limit cut": "暫時下調總限額",
  "Rank positions by VaR contribution": "依 VaR 貢獻排序部位",
  "Approve flatten plan": "核准平倉計畫",
  "Recompute rolling correlations": "重算滾動相關",
  "Temporary VaR buffer +10%": "暫時提高 VaR 緩衝 10%",
  "Adjust hedge ratios": "調整對沖比例",
  "Kick rolling corr job": "啟動滾動相關作業",
  "Approve VaR buffer widen": "核准擴大 VaR 緩衝",
  "Arm close-only on gap symbols": "對缺口商品備妥僅平倉",
  "Pause acquisition promos": "暫停獲客促銷",
  "Pre-hedge metals/indices": "預先對沖金屬／指數",
  "Generate weekend gap pack": "產生週末缺口包",
  "Approve close-only / pre-hedge": "核准僅平倉／預先對沖",
  "Rollback last markup deploy": "回滾最近點差部署",
  "Restore standard spreads": "恢復標準點差",
  "Diff last markup deploy": "比對最近點差部署",
  "Approve rollback": "核准回滾",
  "Lower default leverage for new accounts": "下調新帳戶預設槓桿",
  "Tighten KYC velocity": "收緊 KYC 速度",
  "Pause max-leverage promo": "暫停最高槓桿促銷",
  "Score new cohort toxicity": "評分新客群毒性",
  "Approve default leverage cut": "核准預設槓桿下調",
  "Freeze bonus conversions": "凍結贈金兌現",
  "Increase turnover multiple": "提高流水倍數",
  "Close-only on abuse cluster": "對濫用叢集僅平倉",
  "Propose freeze": "提案凍結",
  "Throttle large withdrawals": "節流大額出金",
  "If crypto float elevated — opposite: ensure hot liquidity": "若加密浮額偏高 — 反向：確保熱錢包流動性",
  "Enhanced review on top outflows": "對頭部出金加強覆核",
  "Cluster by device/KYC": "依裝置／KYC 叢集",
  "Approve throttle": "核准節流",
  "Add recon staff / overtime": "增加對帳人力／加班",
  "Pause failing PSP channel": "暫停故障支付通道",
  "Enable stricter auto-match temporarily": "暫時啟用更嚴格自動配對",
  "Group by PSP/error code": "依支付商／錯誤碼分組",
  "Approve PSP pause": "核准暫停支付通道",
  "Hold deposits from scored cohort": "暫扣評分客群入金",
  "Force 3DS on channel": "通道強制 3DS",
  "Close-only until cleared": "解除前僅平倉",
  "Propose deposit hold": "提案暫扣入金",
  "Risk confirms trading freeze": "風險確認交易凍結",
  "Close-only / suspend suspects": "僅平倉／暫停嫌疑帳戶",
  "Build trade-match evidence pack": "建立成交配對證據包",
  "Escalate to compliance owner": "升級至合規負責人",
  "Generate match evidence": "產生配對證據",
  "Approve suspensions": "核准暫停帳戶",
  "Rollback last trading API deploy": "回滾最近交易 API 部署",
  "Notify Risk Control Desk": "通知風險控管台",
  "Force A-book on the top toxic symbols": "對頭部有毒商品強制 A-book",

  // Data source names (high-visibility)
  "Existing risk indicator monitoring — warnings, alerts, ticket tracking.":
    "既有風險指標監控 — 警告、警報、工單追蹤。",
  "Team messenger for escalation, on-call and incident rooms.": "升級、值班與事故室之團隊通訊。",
  "MT4 positions, equity, margin and deal stream.": "MT4 持倉、權益、保證金與成交串流。",
  "MT5 multi-asset positions and deals.": "MT5 多資產持倉與成交。",
  "Charts and reference pricing for verification.": "圖表與參考報價，供核對用。",
  "Server topology and latency health context.": "伺服器拓樸與延遲健康脈絡。",
  "LP aggregation, reject rates, fill quality.": "LP 聚合、拒單率、成交品質。",
  "Aggregated bank / non-bank LP quotes.": "銀行／非銀行 LP 彙總報價。",
  "Browser platform orders and sessions.": "瀏覽器平台訂單與工作階段。",
  "Mobile trading + copy-trade events.": "行動交易＋跟單事件。",
  "Signal providers, copiers, allocation graph.": "訊號提供者、跟單者、分配圖。",
  "Order book, trades, liquidations.": "訂單簿、成交、強平。",
  "Hot/cold wallet balances and withdrawal queues.": "熱／冷錢包餘額與出金佇列。",
  "External crypto reference prices.": "外部加密參考價格。",
  "External crypto liquidity / funding reference.": "外部加密流動性／資金費參考。",
  "Macro event calendar for gap risk.": "缺口風險之宏觀事件日曆。",
  "First-party calendar surfaced to clients.": "對客戶展示之第一方日曆。",
  "Market-moving news for event risk windows.": "事件風險時段之市場新聞。",
  "AU product / leverage rule changes.": "澳洲產品／槓桿規則變更。",
  "UK retail CFD rules and leverage caps.": "英國零售 CFD 規則與槓桿上限。",
  "Vanuatu entity regulatory notices.": "萬那杜實體監管公告。",
  "SA entity regulatory context.": "南非實體監管脈絡。",
  "Cayman entity regulatory context.": "開曼實體監管脈絡。",
  "Client classification, KYC status, sanctions flags.": "客戶分類、KYC 狀態、制裁標記。",
  "Outage / pricing complaint early warning.": "中斷／報價客訴預警。",
  "Internal/external support articles.": "內外部支援文章。",
  "Brand context — not a risk feed.": "品牌脈絡 — 非風險饋送。",
  "24/7 gold product rules, exposure limits.": "24／7 黃金產品規則與曝險上限。",

  // AI access security item names
  "Users administration": "使用者管理",
  "Roles & permissions": "角色與權限",
  "Platform settings": "平台設定",
  "Teams / on-call": "團隊／值班",
  "Departments RACI": "部門 RACI",
  "Lark integration (manage)": "Lark 整合（管理）",
  "Escalation routes": "升級路徑",
  "AI Admin — checker decisions": "AI 管理 — Checker 裁決",
  "Human Intervention decisions": "人工干預裁決",
  "Data sources (credentials)": "資料來源（憑證）",
  "AI access security blocklist": "AI 存取安全黑名單",
  "Create / update / disable users": "建立／更新／停用使用者",
  "Modify role permissions": "修改角色權限",
  "Write non-AI platform settings / secrets": "寫入非 AI 平台設定／密鑰",
  "Approve / reject AI change requests": "核准／駁回 AI 變更單",
  "Approve / reject / execute interventions": "核准／駁回／執行干預",
  "Disable LP endpoint / bridge failover": "停用 LP 端點／橋接容錯",
  "Halt / close-only symbols": "停商品／僅平倉",
  "Execute cold wallet sweep / withdrawal pause": "執行冷錢包歸集／暫停出金",
  "Block / restrict client accounts": "封鎖／限制客戶帳戶",
  "Create / toggle Lark channels & webhooks": "建立／切換 Lark 頻道與 Webhook",
  "Create / edit escalation routes": "建立／編輯升級路徑",
  "Raw database / shell / file access": "原始資料庫／shell／檔案存取",
  "Delete or tamper audit logs": "刪除或竄改稽核日誌",
  "Self-approve own change request": "自行核准自己的變更單",
  "Session cookies / tokens": "工作階段 Cookie／權杖",
  "Lark app credentials": "Lark 應用憑證",
  "Data source secrets": "資料來源密鑰",
  "Monitor 2.0 base URL + sync keys": "Monitor 2.0 網址＋同步金鑰",
  "Entity capital / segregation amounts": "實體資本／隔離金額",
  "Hot/cold wallet keys & addresses config": "熱／冷錢包金鑰與地址設定",
  "Full KYC / payment instrument PII": "完整 KYC／支付工具個資",
  "SQLite database file": "SQLite 資料庫檔",
  "Environment / .env / process env secrets": "環境／.env／行程密鑰",
  "Full audit log export": "完整稽核日誌匯出",
  "Read alarms & indicators": "讀取警報與指標",
  "Run RCA (skills / RAG)": "執行根因分析（技能／RAG）",
  "Propose AI config / skills / RAG": "提案 AI 設定／技能／RAG",
  "Recommend intervention steps": "建議干預步驟",
  "Push Market Intelligence cards": "推送市場情報卡片",
  "Write spine / analysis evidence": "寫入脊柱／分析證據",
  "Identity lifecycle — create/disable users, reset credentials, assign roles.":
    "身分生命週期 — 建立／停用使用者、重設憑證、指派角色。",
  "Privilege escalation surface — changing permissions_json can grant AI or others full control.":
    "權限提升面 — 改寫 permissions_json 可讓 AI 或其他人取得完整控制。",
  "Contains secrets, feature flags, and global kill-switches outside maker/checker.":
    "含密鑰、功能旗標與緊急開關，且不在 Maker／Checker 範圍內。",
  "On-call routing and Lark chat binding — AI rewriting teams can hijack escalations.":
    "值班路由與 Lark 綁定 — AI 改寫團隊可劫持升級。",
  "Org ownership model; changes alter accountability for risk decisions.":
    "組織權責模型；變更會改寫風險決策問責。",
  "Webhook URLs and channel enablement — AI must not exfiltrate or retarget messengers.":
    "Webhook 網址與頻道啟用 — AI 不得外洩或改道通訊。",
  "SLA / auto-action / human-gate routing — AI rewriting routes can skip checkers.":
    "SLA／自動動作／人工關卡路由 — AI 改寫路徑可跳過 Checker。",
  "Maker≠Checker dual control — AI (or the proposing maker) must never self-approve CRs.":
    "Maker≠Checker 雙重控制 — AI（或提案 Maker）不得自行核准變更單。",
  "Runtime approval of high-impact trading/custody actions — final gate is human only.":
    "高影響交易／託管動作之執行時核准 — 最終關卡僅限人類。",
  "API keys, app secrets, DB DSNs registered for connectors.": "連接器登錄之 API 金鑰、應用密鑰、資料庫 DSN。",
  "This policy page itself must not be editable by AI.": "本政策頁本身不得由 AI 編輯。",
  "Risk / Ops / AI / System — mandate, owns, accountable, collaborates, out of scope, escalation":
    "風險／營運／AI／系統 — 使命、擁有、課責、協作、範圍外與升級",
  "RBAC matrix plus owns / does / does-not / escalation charters":
    "RBAC 矩陣，並附擁有／日常／不做／升級章程",
  PROPOSE_ONLY: "僅可提案",
  BLOCKED: "已封鎖",
  READ: "可讀",
  PAGE: "頁面",
  FUNCTION: "功能",
  FIELD: "欄位",
  DATA: "資料",
};
