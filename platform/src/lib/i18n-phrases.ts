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
  CS_SERVICE: "客服 24/7",
  "Customer Service 24/7": "客服 24/7",
  "C1 live chat, web form and official mailbox intake; clarify / ID / FAQ playbooks. Does not arm trading controls.":
    "C1 即時聊天、網頁表單與官方信箱進件；釐清／核身／FAQ 劇本。不啟動交易管制。",
  TRADING_EXEC: "交易成交（TR）",
  "Trading Execution (TR)": "交易成交（TR）",
  "Fill, slippage, stop-out and MT4/MT5 tape review routed from CS. Hands book-risk to the Risk spine.":
    "由 CS 分流的成交、滑點、強平與 MT4／MT5 成交帶覆核。帳簿風險交風控脊柱。",
  "CS clarify thin or unclear client request": "CS 釐清過短或不清楚的客戶請求",
  "CS identity verification before account action": "CS 帳戶操作前身分驗證",
  "CS account / product FAQ (swap, hours, UID)": "CS 帳戶／產品 FAQ（隔夜利息、時段、UID）",
  "TR dealing — fill, slippage, stop-out, MT4/MT5": "TR 成交 — 成交、滑點、強平、MT4／MT5",
  "CS/TR escalate book-risk onto the Risk spine": "CS／TR 將帳簿風險升級至風控脊柱",
  "Unclear C1 → ID verify → TR tape → Risk spine": "不清楚 C1 → 核身 → TR 成交帶 → 風控脊柱",
  "Unclear CS requests waiting (open)": "待釐清 CS 請求（未結）",
  "ID-verify CS queue (open)": "CS 核身佇列（未結）",
  "Open CS FAQ / product questions": "未結 CS FAQ／產品詢問",
  "TR dealing queue (assigned)": "TR 成交佇列（已派）",
  "CS/TR escalations onto Risk (open)": "CS／TR 升級風控（未結）",
  "CS 24/7 → Risk Desk": "CS 24/7 → 風控台",
  "TR dealing tape": "TR 成交帶",
  CS_POLICY: "客服政策",
  "CS / TR 24/7 intake — C1, form, official email": "CS／TR 24/7 進件 — C1、表單、官方信箱",
  "CS identity verification before account action": "CS 帳戶操作前身分驗證",
  "Overnight swap, weekend triple, and product hours FAQ": "隔夜利息、週末三倍與產品時段 FAQ",
  "TR dealing handoff — fills, slippage, stop-outs": "TR 成交交接 — 成交、滑點、強平",
  "When CS/TR must escalate onto the Risk spine": "CS／TR 何時必須升級至風控脊柱",
  "CS/TR dedicated SKILL.md playbooks and Knowledge Tree": "CS／TR 專用 SKILL.md 劇本與知識樹",
  send_clarify_email: "寄釐清信",
  hold_until_reply: "等到回覆",
  cs_lead_human: "CS Lead 人工",
  send_id_email: "寄核身信",
  hold_id_verify: "維持身分驗證",
  fraud_cluster_check: "詐欺叢集檢查",
  answer_from_rag: "以 RAG 作答",
  propose_rag_update: "提議更新 RAG",
  retrieve_rag: "檢索 RAG",
  assign_tr: "指派至 TR",
  reconstruct_tape: "重建成交帶",
  check_slip_monitors: "核對滑點監控",
  escalate_risk: "升級風控",
  open_spine: "開啟脊柱",
  "Crypto Exchange Stack": "加密交易所堆疊",
  "Matching, liquidations, wallet float, market integrity.": "撮合、強平、錢包浮額、市場完整性。",
  "Margin, stop-out, concentration, toxic flow, copy-trade cascade.":
    "保證金、強平、集中度、有毒流量、跟單連鎖。",
  SYSTEMIC_FIRM: "全公司系統性",
  "Firm-wide Systemic & Contagion": "全公司系統性與傳染",
  "Cross-book equity, VaR, kill-switches and news-window contagion that can hit CFD and exchange together.":
    "跨帳簿權益、VaR、熔斷與新聞窗口傳染，可同時打到 CFD 與交易所。",
  THIRD_PARTY_VENDOR: "第三方與供應商",
  "Third-party & Vendor Dependency": "第三方與供應商依賴",
  "LP, bridge, data vendor, payment and IB rails that fail outside Vantage-owned stack.":
    "LP、橋接、資料商、支付與 IB 等落在 Vantage 自有堆疊之外的故障。",
  REPUTATION_COMMS: "聲譽與客戶通訊",
  "Reputation & Client Communications": "聲譽與客戶通訊",
  "Complaint velocity, chargeback optics and trust damage during incidents.":
    "事故期間的投訴速度、退單觀感與信任損害。",
  "Cross-book Contagion Score": "跨帳簿傳染分數",
  "Critical Vendor Degraded Count": "關鍵供應商降級數",
  "Client Complaint Velocity (24h)": "客戶投訴速度（24 小時）",
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
  "Default catch-all (exotic / unmatched)": "預設兜底（異常／未匹配）",
  exotic_or_unmatched: "異常／未匹配",
  create_ticket: "建立工單",
  ai_rca: "AI 根因分析",
  page_oncall: "叫應值班",
  disable_detector_shadow: "停用影子偵測器",
  suggest_disable_lp: "建議停用 LP",
  lark_notify: "Lark 通知",

  // Lark purposes
  "Primary risk escalations and interventions": "主要風險升級與干預",
  "Funding, recon and client ops incidents": "資金、對帳與客戶營運事件",
  "Model alerts and RCA draft reviews": "模型警報與根因草稿覆核",
  "Bridge/server/LP P1 pages": "橋接／伺服器／LP 一級叫應",
  "Wallet, liquidation and market integrity": "錢包、強平與市場完整性",
  "CRITICAL only — exec visibility": "僅危急 — 高管可見",
  "AI Detection Alerts": "AI 偵測警報",
  "Executive Risk Bridge": "風險執行橋",

  // Intervention demo samples + messenger actors
  "Public visitor": "公開訪客",
  "Evidence Vault": "證據庫",
  "Escalation Engine": "升級引擎",
  "Action Advisor": "動作顧問",
  "CRMP Chatbot": "CRMP 聊天機器人",
  "Margin utilisation spike — Risk Owner must accept RCA before live controls.":
    "保證金使用率暴衝 — 風險負責人須接受 RCA 後才可下實控。",
  "Approve or reject leverage / close-only controls after margin cascade RCA.":
    "保證金連鎖 RCA 後，核准或駁回槓桿／只平倉控制。",
  "Copy concentration BREACH — pause new copiers pending Risk Owner gate.":
    "跟單集中度違規 — 暫停新跟單，待風險負責人關卡。",
  "Pause new copy joins on the top signal provider until concentration falls below warn.":
    "暫停頭部訊號提供者的新跟單，直至集中度低於警告。",
  "Copy provider concentration breach": "跟單提供者集中度違規",
  "Leverage cut executed after human approval.": "人工核准後已執行槓桿下調。",
  "Cut max leverage for accounts above 90% utilisation on XAUUSD / majors.":
    "對 XAUUSD／主要商品上使用率 >90% 帳戶調降最大槓桿。",
  "Approved after confirming LP reject rate was healthy; cut max leverage on stressed cohort.":
    "已確認 LP 拒單率健康後核准；下調受壓族群最大槓桿。",
  "Symbol halt rejected after feed-quality check.": "饋送品質檢查後駁回商品停牌。",
  "Halt new exposure on symbol until feed integrity restored.": "饋送完整性恢復前，停止該商品新曝險。",
  "Rejected — stale quote print on M2-FEED-003, not book risk. Keep symbol open.":
    "駁回 — M2-FEED-003 為過期報價，非帳簿風險。維持商品開放。",
  "Stale / crossed quotes": "過期／交叉報價",
  "LP route disabled after dual-control approval.": "雙重控管核准後已停用 LP 路徑。",
  "Disable stressed LP route and fail over hedge capacity.": "停用受壓 LP 路徑並容錯切換對沖產能。",
  "Approved temporary LP disable after oneZero reject spike; System on-call notified.":
    "oneZero 拒單暴衝後核准暫時停用 LP；已通知系統值班。",
  "LP reject rate breach": "LP 拒單率違規",
  "See conditions JSON": "見條件 JSON",

  // Audit / spine
  SEED_DATABASE: "種子資料庫",
  ACK_ALERT: "確認警報",
  UPDATE_SETTING: "更新設定",
  TOGGLE_ESCALATION_ROUTE: "切換升級路徑",
  UPDATE_ESCALATION_ROUTE: "更新升級路徑",
  INTERVENTION_DECIDE: "干預決策",
  UPDATE_USER: "更新使用者",
  UPDATE_ROLE: "更新角色",
  LARK_TEST_NOTIFY: "Lark 測試通知",
  MARKET_INTEL_LARK_PUSH: "市場情報 Lark 推送",
  MARKET_INTEL_SCAN: "市場情報掃描",
  BU_POC_INCIDENT_RESPONSE: "BU POC 事故回應",
  PULL_TRANSACTION_DATA: "拉取交易資料",
  RESTRICT_USER_RIGHTS: "限制使用者權限",
  UPDATE_TEAM: "更新團隊",
  UPDATE_THRESHOLDS: "更新門檻",
  PAUSE_INDICATOR: "暫停指標",
  RESUME_INDICATOR: "恢復指標",
  TOGGLE_LARK_CHANNEL: "切換 Lark 頻道",
  CREATE_LARK_CHANNEL: "建立 Lark 頻道",
  UPDATE_DATA_SOURCE: "更新資料來源",
  CREATE_DATA_SOURCE: "建立資料來源",
  RAG_UPDATE: "更新 RAG",
  RAG_CREATE: "建立 RAG",
  RAG_REINDEX: "重建 RAG 索引",
  DOC_UPDATE: "更新文件",
  DOC_RESET: "重設文件",
  ALARM_RAISED: "觸發警報",
  DUMMY_SPINE_RUN: "虛擬脊柱演練",
  AI_ANALYSIS_SKILL: "AI 分析技能",
  AI_SECOND_OPINION: "AI 第二意見",
  MESSENGER_ESCALATE: "Messenger 升級",
  MESSENGER_DISMISS: "Messenger 關閉",
  MESSENGER_CLOSE: "Messenger 結案",
  MESSENGER_CHAT: "Messenger 對話",
  MESSENGER_SHOW_EVIDENCE: "Messenger 顯示證據",
  MESSENGER_CONFIRM_ACTION: "Messenger 確認動作",
  MESSENGER_CHECKER_APPROVE: "Messenger Checker 核准",
  CREATE_USER: "建立使用者",
  CREATE_ESCALATION_ROUTE: "建立升級路徑",
  LOGIN: "登入",
  LOGOUT: "登出",
  ROLLBACK_SETTING: "回滾設定",
  ROLLBACK_USER: "回滾使用者",
  ROLLBACK_ROLE: "回滾角色",
  ROLLBACK_ESCALATION_TOGGLE: "回滾升級切換",
  ROLLBACK_ESCALATION_UPDATE: "回滾升級更新",
  ROLLBACK_THRESHOLDS: "回滾門檻",
  ROLLBACK_INDICATOR_PAUSE: "回滾指標暫停",
  ROLLBACK_LARK_TOGGLE: "回滾 Lark 切換",
  ROLLBACK_DATA_SOURCE: "回滾資料來源",
  ROLLBACK_TEAM: "回滾團隊",
  ROLLBACK_RAG: "回滾 RAG",
  monitor_alert: "監控警報",
  platform_settings: "平台設定",
  platform: "平台",
  escalation_route: "升級路徑",
  intervention: "干預",
  user: "使用者",
  role: "角色",
  lark_channel: "Lark 頻道",
  vantage_admin: "Vantage 管理",
  transaction: "交易",
  data_source: "資料來源",
  team: "團隊",
  department: "部門",
  rag_document: "RAG 文件",
  rag: "RAG",
  admin_doc: "管理文件",
  messenger_thread: "Messenger 執行緒",
  skill: "技能",
  ai_analysis: "AI 分析",
  alert: "警報",
  monitor_indicator: "監控指標",
  market_intel_finding: "市場情報發現",
  market_intel_scan: "市場情報掃描",
  dummy_spine: "虛擬脊柱",
  "dummy_spine failed": "虛擬脊柱演練失敗",
  "Home dummy": "首頁虛擬演練",
  "home-dummy": "首頁虛擬演練",
  "DUMMY · Copy concentration breach": "虛擬 · 跟單集中度違規",
  "DUMMY · Equity drawdown warn": "虛擬 · 權益回撤警告",
  "DUMMY · Margin utilisation CRITICAL": "虛擬 · 保證金使用率危急",
  "Home dummy: top signal provider now at 33% of copy equity after a viral strategy share. Walk the full spine to closure.":
    "首頁虛擬演練：龍頭信號提供者跟單權益佔比因策略爆紅升至 33%。走完整條脊柱至結案。",
  "Home dummy: company CFD book drawdown rising through the US session after CPI volatility. RAG path + human review.":
    "首頁虛擬演練：CPI 波動後，公司 CFD 帳簿回撤在美盤上升。RAG 路徑＋人工覆核。",
  "Home dummy: book-wide margin utilisation spiked and LP rejects are rising. Dual-AI RCA and maker/checker required.":
    "首頁虛擬演練：全帳簿保證金使用率驟升，LP 拒單增加。需雙 AI 根因與 Maker／Checker。",
  "Dummy home run: accepting the AI pack and walking maker/checker through to closure.":
    "虛擬首頁演練：接受 AI 包，並以 Maker／Checker 走完至結案。",
  "Dummy home run — Risk Owner auto-approved after messenger maker/checker.":
    "虛擬首頁演練 — 風險負責人已在 Messenger Maker／Checker 後自動核准。",
  "Dummy spine produced no alerts": "虛擬脊柱演練未產生警報",
  "Relayed from": "已從",
  " received (POC ": " 已接收（承辦 ",
  "Continue the case in this window. Path:": "請在此窗繼續覆核。升級鏈：",
  "Path posted to": "路徑已貼至",
  "Dummy run": "虛擬演練",
  "Control-plane overview, dummy spine buttons (single alert or linked group walk DETECT→close), stats, expandable alert tracker, and home spine with stage ticket counts (Spine Log tab removed)":
    "控制平面總覽、虛擬脊柱按鈕（單則或連動組走完 DETECT→結案）、統計、可展開警報追蹤，以及首頁脊柱階段工單數（脊柱日誌分頁已移除）",
  "Alert + AI report inbox; chat windows split by POC on the escalation path (bird-eye relay); evidence, chat, escalate, dismiss, close, controls":
    "警報＋AI 報告收件匣；依升級路徑承辦拆聊天窗（鳥瞰轉遞）；證據、聊天、升級、排除、結案、控制",
  "GET analyses · POST analyze/simulate/dummy_spine (home dummy alert or group, auto-walk to closure)/backfill challenges":
    "GET 分析 · POST 分析／模擬／dummy_spine（首頁虛擬警報或組、自動走至結案）／補跑挑戰",

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
  // BU duty dropdown details
  "Risk Control writes the actual limits clients and the firm can take — how much gold, FX, crypto, or copy-trading exposure is allowed on each legal entity. When a limit is hit, this team decides whether that is a warning, a hard stop, or a named person who may override. Other BUs follow that matrix; they do not invent their own caps.": "風險控管寫下客戶與公司真正能承擔的限額——每個法律實體允許多少黃金、外匯、加密或跟單曝險。觸及限額時，由本團隊決定是警告、硬停，或指定可覆寫的人。其他 BU 遵守此矩陣，不得自訂上限。",
  "This is the live CFD trading book. Risk Control watches P&L, client margin, whether we are hedging to liquidity providers or keeping risk in-house, and whether an LP is rejecting or filling poorly. If the book is too big, too one-sided, or credit is blowing out, this BU calls the containment (cut exposure, change hedge mix) — after a human gate on high-impact moves.": "這是即時 CFD 交易帳簿。風險控管盯損益、客戶保證金、是對沖給 LP 還是內盤留風險，以及 LP 是否拒單或成交品質差。帳簿過大、過度單邊或信貸失控時，本 BU 下令收斂（減曝險、改對沖組合）——高影響動作仍須人工關卡。",
  "On the crypto exchange, Risk Control sets how much client crypto may sit in the hot wallet, how long the liquidation engine may lag, how stale a mark-price oracle may be, how far the insurance fund may draw down, and how concentrated open interest may get. They own the policy and the go / no-go. System runs the wallets and matching engine; Risk does not patch servers.": "在加密交易所，風險控管規定客戶加密貨幣可留在熱錢包的量、強平引擎可落後多久、標記價預言機可過期多久、保險基金可回撤多深、持倉可多集中。政策與放行／禁止由他們拍板。系統跑錢包與撮合；風控不修伺服器。",
  "AI and detectors may recommend “stop this symbol”, “cut this group’s leverage”, “turn off this LP”, or “pause large withdrawals”. Risk Control is the human who says yes or no. Until this BU (or dual control) signs, those actions stay mocked or queued. This is the core of “AI recommends, humans decide”.": "AI 與偵測器可能建議「停這個商品」、「收這個組別槓桿」、「關掉這個 LP」或「暫停大額出金」。說是或否的人是風險控管。在本 BU（或雙重控制）簽核前，這些動作維持模擬或佇列。這就是「AI 建議、人類決定」。",
  "Each morning this BU owns the daily risk numbers and which domain (market, credit, crypto, fraud, …) sits with whom. After an incident they write down what risk is still left and who accepted it. If the dashboard is late or a domain has no owner, that is a Risk Control miss.": "每天早上本 BU 擁有當日風險數字，以及各領域（市場、信貸、加密、詐欺…）歸誰。事故後寫下還剩什麼風險、誰接受了。儀表板遲到或領域沒有負責人，就是風險控管失職。",
  "When one signal provider’s copiers all get hurt together, when flow looks like latency arbitrage, when clients go negative-balance, or when a few names hold too much of the book, Risk Control runs the playbook: pause copies, tighten groups, freeze accounts, or force de-risk. Operations may talk to the client; Risk decides the trading restriction.": "當一個訊號提供者的跟單者一起受傷、流量像延遲套利、客戶出現負餘額，或少數帳戶占帳簿過重時，風險控管跑劇本：暫停跟單、收緊組別、凍結帳戶或強制降險。營運可對客；交易限制由風控決定。",
  "This BU owns which alert severity goes to which Lark / messenger desk, how fast, and who is on call. If a CRITICAL never pages the Risk Control Desk, or crypto wallet alarms skip Crypto Exchange Risk, that routing mistake belongs here — not to Operations or AI.": "本 BU 規定哪種嚴重度進哪個 Lark／Messenger 台、多快、誰值班。若 CRITICAL 從不叫風險控管台，或加密錢包警報跳過加密交易所風險，路由錯誤屬這裡——不是營運或 AI。",
  "On a BREACH or CRITICAL, Risk Control chairs the war-room. They keep the incident open until someone named has written “we accept what is left”. They cannot close a CRITICAL just because the alarm went quiet.": "BREACH 或 CRITICAL 時，風險控管主持戰情室。事件維持開啟，直到具名人寫下「剩下的風險我們接受」。不能只因警報安靜就關掉 CRITICAL。",
  "If leverage, spreads, or which products a client type may trade will change, Risk Control signs that policy. System may flip the switch; Operations may tell the client; this BU is accountable for the risk of the change.": "若槓桿、點差或某類客戶可交易的商品會變，由風險控管簽該政策。系統可切開關、營運可告知客戶；變更的風險課責在本 BU。",
  "Every domain marked RISK_CONTROL (market/pricing, credit, LP hedge, crypto stack, and so on) must have a named person in this BU. If a domain is “owned by Risk” on paper but nobody is on call, this team is accountable.": "每個標記 RISK_CONTROL 的領域（市場／定價、信貸、LP 對沖、加密棧等）在本 BU 都必須有具名人。紙上「風控擁有」卻沒人值班，課責仍在本隊。",
  "After the dust settles, Risk Control writes what happened, what we still sit with, and what we will do differently. That memo is meant to land in the RAG knowledge base so the next RCA does not start from zero.": "塵埃落定後，風險控管寫下發生了什麼、還坐著什麼風險、下次要改什麼。這份備忘應進 RAG，讓下一次根因分析不必從零開始。",
  "Ops holds the funding queue. When a withdrawal pause or deposit exception is really a credit, fraud, or AML problem, Risk Control joins — they decide whether trading should freeze, not how to post the bank file.": "資金佇列在營運。當暫停出金或入金例外其實是信貸、詐欺或 AML 問題時，風險控管加入——他們決定要不要凍交易，不是怎麼送銀行檔。",
  "AI builds detectors and drafts root-cause. Risk Control is the checker when a detector goes live, and they challenge RCA when the second AI disagrees. They do not train the model; they decide whether to trust it on the book.": "AI 建偵測器並草擬根因。偵測器正式上線時風險控管當 Checker；第二 AI 不同意時他們挑戰根因。他們不訓練模型；他們決定帳簿上能不能信它。",
  "System keeps servers, bridges, and wallets up. Risk Control says which kill-switches exist and when they may be armed. If a feed is stale or an LP is down, System diagnoses infra; Risk decides whether the book must be de-risked in the meantime.": "系統維持伺服器、橋接與錢包。風險控管規定有哪些緊急開關、何時可啟動。饋送過期或 LP 掛了，系統診斷基礎設施；風控決定這段時間帳簿要不要先降險。",
  "The crypto desk sits in this BU. They work with System on engine/oracle/wallet incidents, but Risk Control still owns float policy and whether to pause withdrawals or new high-leverage perps.": "加密台隸屬本 BU。引擎／預言機／錢包事故與系統共事，但浮額政策、以及要不要暫停出金或新高槓桿永續，仍是風險控管的。",
  "Risk Control does not work the funding ticket pile or tick off end-of-day recon breaks. That is Operations. Risk only steps in when the case becomes credit, fraud, or a trading freeze.": "風險控管不處理資金工單堆，也不勾日終對帳差異。那是營運。只有案件變成信貸、詐欺或凍交易時風控才介入。",
  "This BU does not train models or press “promote detector” as the person who built it. AI Engineer is the maker; Risk Owner is the checker on live. Risk can block a bad promotion; they should not be both maker and checker.": "本 BU 不以「我建的」身分訓練模型或按「晉升偵測器」。Maker 是 AI 工程師；正式上線的 Checker 是風險負責人。風控可擋壞的晉升，不該身兼 Maker 與 Checker。",
  "Risk Control does not SSH to boxes, patch oneZero, or rotate wallet keys. If infra is broken they escalate to System and, if the book is at risk, they still decide trading containment.": "風險控管不去 SSH 主機、不修 oneZero、不輪換錢包金鑰。基礎設施壞了就升級系統；若帳簿已有風險，交易收斂仍由他們決定。",
  "Turning on market-intel scans, messenger features, or unrelated flags is System / Super Admin. Risk only owns the risk thresholds (warn/breach levels, auto-analyse on alarm) that sit in their RACI.": "開啟市場情報掃描、Messenger 功能或其他無關旗標屬系統／超級管理員。風控只擁有 RACI 裡的風險門檻（警告／違規、警報自動分析）。",
  "If the problem crosses legal entities or looks like a capital / licence limit, Risk Control does not absorb it alone. They escalate to Super Admin / the named platform owner so entity segregation and capital sit with someone who can speak for the firm.": "問題跨法律實體或像資本／牌照上限時，風險控管不獨自吞下。升級至超級管理員／具名平台負責人，讓實體隔離與資本由能代表公司的人承接。",
  "CRMP cannot sign a licence issue. When client-money segregation or a regulator limit is in play, Risk Control pages legal/compliance outside this admin and records that they did.": "CRMP 不能簽牌照問題。客戶資金隔離或監管上限在場時，風險控管在此後台外呼叫法遵，並留下紀錄。",
  "Operations works every stuck deposit and withdrawal — bank, card, and crypto on-chain. They chase missing hashes, wrong amounts, and compliance holds. They do not invent a freeze: if Risk has not paused withdrawals, Ops keeps the queue moving; if Risk has paused, Ops executes that pause on the cases.": "營運處理每一筆卡住的入金與出金——銀行、卡、加密鏈上。追遺失雜湊、金額不符、合規扣留。他們不自創凍結：風控沒暫停出金，營運就推進佇列；風控已暫停，營運就在案件上執行暫停。",
  "At end of day this BU ties client balances, bank Nostro/Vostro, and bonus wallets together. A break means money does not match. Ops owns finding and fixing the break before the daily dashboard is trusted. Risk does not do this recon.": "日終本 BU 把客戶餘額、銀行 Nostro／Vostro 與贈金錢包對在一起。對不上就是差異。儀表板被信任前，找與修差異屬營運。風控不做這份對帳。",
  "Ops is who the client hears from. They pick up tickets, write what was said, and leave notes the audit trail can replay. They must not tell a client “your symbol is halted” or “your withdrawal is paused” until Risk has actually signed that decision.": "客戶聽到的是營運。他們接工單、寫下說過什麼、留下稽核可重播的筆記。在風控真正簽核前，不得告訴客戶「你的商品已停」或「你的出金已暫停」。",
  "When a promotion or bonus is live, Ops credits and later claws back if Risk or fraud flags the account. They run the bonus ledger. They do not decide that flow was toxic — that is Risk / AI — but they execute the clawback once told.": "促銷或贈金上線時，營運入帳；風控或詐欺標記帳戶後再追回。他們管贈金帳。流量是不是有毒由風控／AI 判斷——營運是一經告知就執行追回。",
  "If Risk has approved “pause this rail / these accounts”, Ops owns the runbook: which queue, which template, who calls the bank. They do not start a freeze on their own for market-risk reasons.": "若風控已核准「暫停這條通道／這些帳戶」，營運擁有手冊：哪個佇列、哪個範本、誰打給銀行。不得因市場風險自己開凍結。",
  "Once Risk has halted a symbol or paused withdrawals, Ops updates the client-facing status and handles the inbox. They are the messenger, not the decision maker.": "風控停商品或暫停出金後，營運更新對客狀態、處理收件匣。他們是傳訊者，不是決策者。",
  "If recon is incomplete, the daily risk dashboard can lie. Ops is accountable for finishing or clearly flagging breaks before that publish. Risk reads the dashboard; Ops makes the money numbers tie.": "對帳沒做完，每日風險儀表板會說謊。發布前做完或清楚標出差異，課責在營運。風控讀儀表板；把錢對平的是營運。",
  "Funding tickets have clocks. Ops owns hitting those SLAs — first response, chase, close — unless the case has been handed to Risk as credit/fraud.": "資金工單有時鐘。第一回應、追蹤、結案的 SLA 屬營運——除非案件已當信貸／詐欺交給風控。",
  "Wrong or early client messages create complaints and false hope. Ops is accountable that what the client is told matches a signed Risk/Ops decision, not a rumour from an AI card.": "錯的或過早的客戶訊息會製造客訴與空歡喜。客戶聽到的必須對應已簽核的風控／營運決策，不是 AI 卡片上的傳聞，課責在營運。",
  "Ops can propose “this withdrawal looks wrong”. Risk Control decides whether it is a credit freeze or a trading restriction. Together they dual-control when money and book risk mix.": "營運可以提案「這筆出金不對勁」。是否信貸凍結或交易限制由風險控管決定。錢與帳簿風險混在一起時雙方雙重控制。",
  "When the payment gateway, wallet daemon, or bank file is down, Ops opens the incident with System. Ops owns the client cases stuck in the queue; System owns the pipe.": "支付閘道、錢包常駐程式或銀行檔掛了，營運與系統開事故。卡在佇列的客戶案件屬營運；管線屬系統。",
  "AI flags multi-account or bonus abuse. Ops attaches the payment and contact evidence so the skill is not guessing. Ops does not tune the detector.": "AI 標記多帳戶或贈金濫用。營運附上支付與聯繫證據，技能才不是猜的。營運不調偵測器。",
  "If clients go negative because a deposit was late or a withdrawal bounced, Ops works with Credit & Client Risk so the funding delay is visible in the credit picture, not hidden as “just ops”.": "若因入金晚到或出金退回而負餘額，營運與信貸與客戶風險協作，讓資金延遲出現在信貸圖像裡，而不是藏成「只是營運」。",
  "Ops does not set how much leverage a group gets, whether a symbol is halted, which LP is on, or how much crypto sits in hot wallets. Asking them to “just halt it” is out of scope.": "營運不決定組別槓桿、商品停不停、哪個 LP 開著、熱錢包可放多少加密。叫他們「先停掉」不在範圍內。",
  "Ops Lead can approve ops-severity cases. They cannot be the sole yes on halt, LP disable, or a large withdrawal pause. That is Risk Owner / dual control.": "營運主管可核准營運嚴重度案件。停商品、停 LP 或大額出金暫停不能只靠他們點是。那是風險負責人／雙重控制。",
  "Ops does not edit playbooks or knowledge articles as owner. They can send evidence and comments; AI Engineer maintains the corpus.": "營運不以負責人編輯劇本或知識文章。可送證據與意見；語料由 AI 工程師維護。",
  "Ops does not create admin users or change how the audit log is stored. That is System / Super Admin.": "營運不建立管理使用者，也不改稽核日誌怎麼存。那是系統／超級管理員。",
  "The analyst tries Ops Lead first. If the case is really “this client is a credit hole / fraud ring / moving the book”, it leaves Ops and goes to Risk Owner. Do not sit on it in the funding queue.": "分析師先找營運主管。若案件其實是「這客戶是信貸破洞／詐欺圈／在搬帳簿」，就離開營運去風險負責人。不要繼續擱在資金佇列。",
  "If the rail or wallet is the problem, escalate to System Admin, not to Risk. Risk cannot restart a daemon. Ops still keeps clients updated.": "通道或錢包才是問題時，升級系統管理員，不是風控。風控重啟不了常駐程式。營運仍要更新客戶。",
  "AI writes and tends the detectors that notice odd P&L, toxic flow, copy-trading pile-ups, and crypto liquidation backlogs. They own the catalogue and shadow runs. They do not flip trading switches when a detector fires.": "AI 撰寫並照料那些察覺異常損益、有毒流量、跟單堆疊、加密強平積壓的偵測器。目錄與影子執行屬他們。偵測器觸發時他們不扳交易開關。",
  "When Monitor alarms, this BU drafts the root-cause story with links to evidence, RAG docs, and the spine. Operators should be able to see why the AI said what it said. If the narrative is empty or unlinked, that is an AI miss.": "Monitor 告警時，本 BU 草擬根因故事，連到證據、RAG 與脊柱。值班應看得出 AI 為何這麼說。敘事空白或沒連結，就是 AI 失職。",
  "AI watches whether detectors cry wolf or go quiet. Rising false positives or drift is their problem to surface — to Risk as checker if a live detector must be pulled back.": "AI 盯偵測器是亂叫還是突然安靜。誤報上升或漂移要由他們提出——若正式偵測器該撤回，風控當 Checker。",
  "AI Engineer proposes “this detector is good enough to go live”. They are the maker. Risk Owner (a different person) must check. AI must not promote itself to live and then act on the book.": "AI 工程師提案「這偵測器夠好、可上線」。他們是 Maker。必須由另一人（風險負責人）Checker。AI 不得自己晉升自己再對帳簿動手。",
  "Playbooks, the knowledge tree, and the RAG library are this BU’s garden. Stale docs, broken links, or a skill that no longer matches the book are theirs to fix. Other BUs consume this; they do not own the corpus.": "劇本、知識樹、RAG 庫是本 BU 的園子。過期文件、壞連結、不再符合帳簿的技能由他們修。其他 BU 使用，不擁有語料。",
  "On BREACH/CRITICAL a second opinion runs. AI owns that challenger setting (today a second heuristic in this repo). They do not pretend it is a separate vendor — that is still on the roadmap.": "BREACH／CRITICAL 會跑第二意見。挑戰者設定屬 AI（今日是本庫第二套啟發式）。他們不假裝那是獨立供應商——那仍在路線圖。",
  "AI proposes which pages, buttons, and fields the AI service must never touch (halt, close-only, secrets, the database file). Super Admin / Risk keep the policy; AI does not grant itself those rights.": "AI 建議哪些頁、鈕、欄位是 AI 服務永不可碰的（停商品、只平倉、密鑰、資料庫檔）。政策由超級管理員／風控守；AI 不幫自己授權。",
  "If an analysis fired automatically, someone must be able to open it and see evidence. AI is accountable when the spine shows a black box.": "自動觸發的分析必須打得開、看得到證據。脊柱出現黑箱，課責在 AI。",
  "Changes to models, skills, or AI settings need a maker and a different checker. AI is accountable for not self-approving. The checker is typically Risk Owner or another human, not the same engineer.": "改模型、技能或 AI 設定需要 Maker 與另一位 Checker。AI 課責於不得自行核准。Checker 通常是風險負責人或另一個人，不是同一工程師。",
  "The bot identity must stay read-and-recommend. If someone assigns it halt rights, that is a control failure this BU must flag and refuse.": "機器人身分必須停在讀取與建議。若有人給它停商品權限，這是控制失敗，本 BU 必須標記並拒絕。",
  "AI brings the draft. Risk Control says whether it may go live or whether a halt/leverage idea may even be queued for a human. Neither side skips the other.": "AI 交出草稿。能否上線、停商品／槓桿點子能不能進人工佇列，由風險控管說。兩邊都不能跳過對方。",
  "Fraud and bonus skills need real case notes and payment evidence. Ops supplies them; AI turns them into better detectors, not the other way around.": "詐欺與贈金技能需要真實案件筆記與支付證據。營運提供；AI 拿去把偵測器變好，不是反過來。",
  "If a source is stale, detectors lie. AI flags freshness; System fixes connectors. AI does not own credentials.": "來源過期，偵測器就說謊。AI 標記新鮮度；系統修連接器。憑證不歸 AI。",
  "When the skill is not sure, RCA falls back to RAG. AI still writes the pack; the owning BU still decides what to do. AI does not treat a low-certainty pack as an order.": "技能不確定時，根因回退 RAG。AI 仍寫分析包；負責 BU 仍決定怎麼做。低確定性的包不是命令。",
  "AI never has the last word on halt, freeze, clawback, or kill-switch. That sits with the domain owner. Approve on Human Intervention is a human page.": "停商品、凍結、追回、緊急開關的最後一句話永不歸 AI。那在領域負責人。人工干預頁的核准是人類頁。",
  "AI may suggest a threshold is noisy. It does not change live Monitor 2.0 warn/breach numbers. The owner BU and System do that.": "AI 可建議門檻太吵。它不改正式 Monitor 2.0 的警告／違規數字。那是負責 BU 與系統的事。",
  "AI does not create users or hold break-glass. That is System / Super Admin, and SSO is still on the roadmap.": "AI 不建立使用者、不持有緊急權限。那是系統／超級管理員，SSO 仍在路線圖。",
  "The chatbot in this admin explains. It does not email clients or close funding tickets. Ops owns that work.": "此後台聊天機器人是解釋用。它不寄信給客戶、不關資金工單。那是營運的工作。",
  "Anything that would change the live book or a live detector goes to Risk Owner. AI stops at recommend.": "會改即時帳簿或正式偵測器的事，都到風險負責人。AI 停在建議。",
  "If RAG, detectors, or a source pipeline is down, AI on-call pages System Admin. They do not try to “fix prod” by editing settings as a lone maker.": "RAG、偵測器或來源管線掛了，AI 值班叫系統管理員。他們不以單獨 Maker 改設定來「修正式環境」。",
  "System keeps MT4/MT5, the oneZero bridge, and LP connections alive and failsover when they are not. If quotes are stale because the feed process died, that is System. Whether the book must then be halted is Risk.": "系統維持 MT4／MT5、oneZero 橋接與 LP 連線，掛了就備援。因饋送行程死掉而報價過期，屬系統。要不要因此停帳簿，屬風控。",
  "System owns how config is changed and which kill-switches exist as engineering. Risk says when a risk switch may be armed. System executes. They do not pick new leverage as a “config tweak”.": "設定怎麼改、工程上有哪些緊急開關，屬系統。風險開關何時可啟動，風控說。系統執行。他們不以「改個設定」自己挑新槓桿。",
  "Indicators, RAG documents, and evidence have to arrive. System owns the pipes, credentials, and refresh. AI consumes them; System does not write RCA.": "指標、RAG 文件、證據必須送到。管線、憑證、刷新屬系統。AI 消費；系統不寫根因。",
  "Who can log in, how sessions live, and that the audit trail cannot be quietly edited — that is System. They do not assign Risk Owner as a business decision; they implement the directory Super Admin / Risk asked for.": "誰能登入、工作階段怎麼活、稽核軌跡不能被悄悄改——屬系統。他們不把「派誰當風險負責人」當業務決策；他們實作超級管理員／風控要求的目錄。",
  "The Data Sources page is System’s inventory: URLs, keys, cadence, status. AI and Market Intel read from it. Credentials do not live in a detector config owned by AI.": "資料來源頁是系統的清單：網址、金鑰、節奏、狀態。AI 與市場情報從這裡讀。憑證不住在 AI 擁有的偵測器設定裡。",
  "System runs the wallet software and key ceremony plumbing. How much float is allowed in hot vs cold is Risk policy. System can say “the daemon is down”; they cannot say “raise the hot-wallet cap”.": "系統跑錢包軟體與金鑰儀式管線。熱／冷錢包允許多少浮額是風控政策。系統可以說「常駐程式掛了」；不能說「把熱錢包上限調高」。",
  "If the admin, Monitor sync, or messenger routing is down, System is accountable. Other BUs cannot do their RACI without the plane.": "後台、Monitor 同步或通訊路由掛了，課責在系統。其他 BU 沒有控制面就做不了 RACI。",
  "The person who can change platform settings should not be the only person who can intervene on the book. System is accountable that those permissions stay split unless Super Admin has declared break-glass.": "能改平台設定的人，不該是唯一能對帳簿干預的人。除非超級管理員宣告緊急，這些權限必須分開，課責在系統。",
  "A kill-switch with no spine/audit line is a control failure. System must log the execution even when Risk armed it.": "緊急開關沒有脊柱／稽核列就是控制失敗。即使是風控啟動的，系統也必須留下執行紀錄。",
  "System builds the switch. Risk Control names who may arm it and when. Neither side ships a silent switch.": "系統做開關。風險控管點名誰可啟動、何時可啟動。兩邊都不准上線沉默開關。",
  "AI needs fresh data. System and AI agree SLAs; System repairs connectors; AI does not hold production keys.": "AI 需要新鮮資料。系統與 AI 談 SLA；系統修連接器；正式金鑰不在 AI 手上。",
  "When rails or files break, System and Ops sit together: System on the pipe, Ops on the cases. Risk joins only if credit or book risk appears.": "通道或檔案壞了，系統與營運一起坐：系統管線、營運案件。只有出現信貸或帳簿風險時風控才加入。",
  "Break-glass and periodic privilege reviews are Super Admin with System. System implements; Super Admin authorises.": "緊急權限與定期權限審閱是超級管理員與系統。系統實作；超級管理員授權。",
  "System does not set exposure caps or accept residual market risk. “The server is fine so the book must be fine” is not their call.": "系統不定曝險上限，也不接受剩餘市場風險。「伺服器沒掛所以帳簿沒問題」不是他們能下的判斷。",
  "System does not work funding tickets or sign EOD recon. They restore the rail so Ops can.": "系統不處理資金工單、不簽日終對帳。他們把通道修回來讓營運能做。",
  "System does not train detectors or write root-cause prose. They keep GPUs/pipes up if asked; quality of RCA is AI’s.": "系統不訓練偵測器、不寫根因文章。需要時維持 GPU／管線；根因品質屬 AI。",
  "After an outage, System can say “we’re back”. They cannot sign “the book risk is acceptable now”. That is Risk Owner.": "中斷恢復後，系統可以說「回來了」。他們不能簽「現在帳簿風險可接受」。那是風險負責人。",
  "Lost data, broken privileges, or several systems down at once go to Super Admin. System does not quietly rebuild access.": "資料遺失、權限壞掉、或多個系統同時掛了，到超級管理員。系統不悄悄重建存取。",
  "If a dead bridge or wallet means the book or client crypto is at risk, System pages Risk Owner immediately so trading/wallet policy can change while infra is still being fixed.": "橋接或錢包死掉代表帳簿或客戶加密貨幣有險時，系統立刻叫風險負責人，好在基礎設施還在修時就能改交易／錢包政策。",
  PROPOSE_ONLY: "僅可提案",
  BLOCKED: "已封鎖",
  READ: "可讀",
  PAGE: "頁面",
  FUNCTION: "功能",
  FIELD: "欄位",
  DATA: "資料",

  // CS / TR desk
  CS_LEAD: "客服主管",
  "CS Lead": "客服主管",
  CS_AGENT: "客服專員",
  "CS Agent": "客服專員",
  TR_LEAD: "交易主管",
  "TR Lead": "交易主管",
  TR_DEALER: "交易員",
  "TR Dealer": "交易員",
  "Customer Service (CS)": "客服（CS）",
  "Trading (TR)": "交易（TR）",
  "CS 24/7 Desk": "CS 24/7 台",
  "TR Dealing Support": "TR 成交支援",
  "CS C1 Live": "CS C1 即時",
  "C1 live chat": "C1 即時聊天",
  "Submission form": "提交表單",
  "Official email": "官方信箱",
  "C1 Live Chat Gateway": "C1 即時聊天閘道",
  "Website CS submission form": "網站客服提交表單",
  "Official support mailbox": "官方客服信箱",
  CS_INTAKE: "CS 進件",
  CS_FOLLOWUP_EMAIL: "CS 追問信",
  CS_CLIENT_REPLY: "CS 客戶回覆",
  CS_AGENT_REPLY: "CS 專員回覆",
  CS_ASSIGN_TR: "CS 指派 TR",
  CS_ESCALATE_RISK: "CS 升級風控",
  CS_RESOLVE: "CS 結案",
  cs_request: "CS 請求",
  "24/7 frontline for live C1 chat, web submission forms and official mailboxes. Answers client questions and complaints, requests missing facts or ID by AI-drafted email until the client replies, and routes trading-execution cases to TR.":
    "C1 即時聊天、網頁提交表單與官方信箱的 24/7 第一線。回答客戶問題與投訴，以 AI 擬稿信件索取缺漏事實或身分直到客戶回覆，並把成交案件分流至 TR。",
  "C1 live chat, web form and official-email intake into CRMP":
    "C1 即時聊天、網頁表單與官方信箱進件至 CRMP",
  "CS owns the three public doors: platform live chat C1, the website submission form, and the official support mailboxes. Every inbound item must become a CRMP request with a channel stamp so nothing lives only in a personal inbox.":
    "CS 擁有三扇公開門：平台即時聊天 C1、網站提交表單、官方客服信箱。每筆進件都必須成為帶渠道戳記的 CRMP 請求，避免只留在個人收件匣。",
  "24/7 first response on questions and complaints": "問題與投訴的 24/7 第一回應",
  "CS is who the client hears from first, around the clock. They answer product, funding-status and complaint questions. They do not set trading policy or halt symbols.":
    "客戶全天候第一個聽到的是 CS。他們回答產品、資金狀態與投訴。他們不制定交易政策、不停商品。",
  "AI follow-up loop when the issue is unclear or identity must be verified":
    "案情不清或需核身時的 AI 追問迴圈",
  "If AI cannot tell what the client needs, or KYC/ID is required, CS lets AI send an automatic email asking for the missing info and keeps the case AWAITING_CLIENT until the client replies. The loop repeats until the request is clear or ID is on file.":
    "若 AI 無法判斷客戶需求，或需要 KYC／身分，CS 讓 AI 自動寄信索取缺漏資料，案件維持待客戶直到回覆。迴圈重複至案情清楚或身分已建檔。",
  "No silent drop of C1, form or mailbox requests": "C1、表單或信箱請求不可靜默丟失",
  "If a live-chat, form or mailbox item never appears on the CS/TR desk, that miss belongs to CS intake, not to Risk.":
    "若即時聊天、表單或信箱從未出現在 CS／TR 台，責任在 CS 進件，不在風控。",
  "Identity-verification emails actually go out and are closed only after a reply":
    "核身信件確實寄出，且僅在回覆後才可關案",
  "CS may not close an ID-verify case because the client went quiet for an hour. The follow-up stays open until a reply lands or a named lead writes a waiver.":
    "CS 不可因客戶一小時沒回就關掉核身案件。追問維持開啟直到回覆到達或具名主管寫豁免。",
  "Trading (TR) — order, fill, slippage and platform-trading complaints":
    "交易（TR）— 訂單、成交、滑點與平台交易投訴",
  "CS takes the first message; TR owns execution facts. CS assigns to TR instead of guessing fills.":
    "CS 接第一則訊息；TR 擁有成交事實。CS 指派給 TR，不臆測成交。",
  "Operations — funding status after a Risk or Ops decision":
    "營運 — 風控或營運決策後的資金狀態",
  "CS tells the client the status; Ops and Risk still decide pauses and recon.":
    "CS 告知客戶狀態；暫停與對帳仍由營運與風控決定。",
  "Risk Control — fraud, credit or book-risk complaints":
    "風險控管 — 詐欺、信貸或帳簿風險投訴",
  "CS escalates into the existing messenger/risk spine when a complaint is really a risk event.":
    "當投訴其實是風險事件時，CS 升級到既有 Messenger／風控脊柱。",
  "Changing leverage, halting symbols, or pausing withdrawals (Risk)":
    "變更槓桿、停商品或暫停出金（風控）",
  "CS does not arm trading controls. They record the client ask and escalate.":
    "CS 不啟動交易管制。他們記錄客戶要求並升級。",
  "Reconstructing LP fills or oneZero tickets (TR / System)":
    "還原 LP 成交或 oneZero 工單（TR／系統）",
  "CS does not read the dealing tape. That is TR, with System on infra.":
    "CS 不讀成交帶。那是 TR，基礎設施歸系統。",
  "TR_LEAD on execution / order / slippage cases": "成交／訂單／滑點案件升級至 TR_LEAD",
  "Anything about fills, MT4/MT5 orders or dealing goes to Trading Support, not a CS workaround.":
    "凡成交、MT4／MT5 訂單或做市皆交交易支援，不是 CS 權充。",
  "RISK_OWNER when a complaint is credit, fraud or book risk":
    "投訴為信貸、詐欺或帳簿風險時升級至 RISK_OWNER",
  "CS does not freeze accounts. They escalate onto the CRMP risk spine.":
    "CS 不凍結帳戶。他們升級到 CRMP 風險脊柱。",
  "Dealing and execution support. Takes CS-routed cases about orders, fills, slippage, stop-out and platform trading; confirms facts with the book; does not replace Risk on limit policy.":
    "做市與成交支援。承接 CS 分流的訂單、成交、滑點、強平與平台交易案件；與帳簿核對事實；不取代風控的限額政策。",
  "Order, fill, slippage, stop-out and MT4/MT5 execution complaints":
    "訂單、成交、滑點、強平與 MT4／MT5 成交投訴",
  "TR reconstructs what the client traded and what the book did. CS collected the story; TR owns the tape.":
    "TR 還原客戶交易與帳簿作為。CS 收集故事；TR 擁有成交帶。",
  "Trading-desk replies on C1 and email once CS has assigned the case":
    "CS 指派後，交易台在 C1 與信件上回覆",
  "After CS (or AI routing) stamps a request as Trading, TR is the voice on that thread — including follow-up mail if more trade details are missing.":
    "CS（或 AI 分流）把請求標為交易後，該執行緒由 TR 發聲 — 若仍缺交易細節亦可追問信。",
  "Honest execution facts before any goodwill or adjustment":
    "任何善意或調整前須有誠實的成交事實",
  "TR must write what filled, at what price, versus the LP — before CS promises a refund. Goodwill still needs Risk/Ops if it moves money.":
    "TR 必須寫清成交什麼、什麼價格、對比 LP — 才可由 CS 承諾退款。動用資金的善意仍需風控／營運。",
  "CS — first intake and ID/unclear follow-up loop": "CS — 第一進件與核身／不清楚追問迴圈",
  "TR does not man C1 24/7. CS keeps the door; TR joins when the case is trading.":
    "TR 不值班 C1 24/7。CS 守門；案件屬交易時 TR 加入。",
  "Risk Control — toxic flow, stop-out storms, dealing adjustments that change residual risk":
    "風險控管 — 有毒流量、強平風暴、改變剩餘風險的做市調整",
  "If the complaint is really a book-risk event, TR escalates to Risk; they do not quietly widen spreads as a favour.":
    "若投訴其實是帳簿風險，TR 升級風控；不可私下當人情加寬點差。",
  "System — platform, bridge and quote-feed incidents that look like bad fills":
    "系統 — 看起來像錯價成交的平台、橋接與報價饋送事件",
  "Stale quotes and bridge rejects are System to diagnose; TR explains the client impact.":
    "過期報價與橋接拒單由系統診斷；TR 說明客戶影響。",
  "24/7 C1 staffing and generic product FAQs (CS)": "24/7 C1 人力與一般產品 FAQ（CS）",
  "TR is not the all-hours help desk.": "TR 不是全天候客服台。",
  "Limit policy, halt, leverage cut (Risk Control)": "限額政策、停商品、收槓桿（風險控管）",
  "TR may recommend; Risk decides.": "TR 可建議；風控決定。",
  "RISK_OWNER on dealing adjustments, toxic flow or stop-out storms":
    "做市調整、有毒流量或強平風暴升級至 RISK_OWNER",
  "Anything that changes residual book risk leaves TR.": "凡改變剩餘帳簿風險者離開 TR。",
  "SYSTEM_ADMIN when fills look like feed or bridge failure":
    "成交看似饋送或橋接故障時升級至 SYSTEM_ADMIN",
  "TR does not restart daemons.": "TR 不重啟常駐程式。",
  "Leads the 24/7 CS desk. Owns C1 / form / mailbox intake quality, the AI follow-up loop, and when a case leaves CS for TR or Risk.":
    "領導 24/7 CS 台。擁有 C1／表單／信箱進件品質、AI 追問迴圈，以及案件何時離開 CS 給 TR 或風控。",
  "CS 24/7 Desk on-call rota": "CS 24/7 台值班表",
  "Follow-up email waivers when a client never replies": "客戶始終未回時的追問信豁免",
  "C1 live-chat and official-mailbox channel health": "C1 即時聊天與官方信箱渠道健康",
  "Watch the CS/TR intake board, re-assign to TR, escalate to Risk":
    "監看 CS／TR 進件板、改派 TR、升級風控",
  "Approve closing an ID-verify case only after a reply or a written waiver":
    "僅在回覆或書面豁免後核准關閉核身案件",
  "Coach agents on not promising trading controls CS cannot arm":
    "教導專員不承諾 CS 無法啟動的交易管制",
  "Set leverage, halt symbols, or pause withdrawals": "設定槓桿、停商品或暫停出金",
  "Rewrite dealing tape as a goodwill fill without TR/Risk":
    "未經 TR／風控把成交帶改寫成善意成交",
  "TR_LEAD on execution cases": "成交案件升級至 TR_LEAD",
  "RISK_OWNER on fraud / credit / book-risk complaints":
    "詐欺／信貸／帳簿風險投訴升級至 RISK_OWNER",
  "24/7 agent on C1 live chat, forms and mail. Uses AI to request missing facts or ID until the client replies.":
    "C1 即時聊天、表單與信件的 24/7 專員。以 AI 索取缺漏事實或身分直到客戶回覆。",
  "First response on assigned CS requests": "已指派 CS 請求的第一回應",
  "Triggering the AI follow-up email when the issue is unclear or ID is needed":
    "案情不清或需核身時觸發 AI 追問信",
  "Answer product questions and complaints in CRMP": "在 CRMP 回答產品問題與投訴",
  "Send / resend AI follow-up mail and record client replies":
    "寄出／重寄 AI 追問信並記錄客戶回覆",
  "Assign trading-execution cases to TR": "把成交案件指派給 TR",
  "Close ID-verify without a client reply (unless CS Lead waives)":
    "客戶未回就關閉核身（除非 CS Lead 豁免）",
  "Change trading conditions": "變更交易條件",
  "CS_LEAD when the client is abusive, VIP, or the loop exceeded three mails":
    "客戶辱罵、VIP 或迴圈超過三封時升級至 CS_LEAD",
  "TR_DEALER when the case is fills / orders / slippage":
    "案件為成交／訂單／滑點時升級至 TR_DEALER",
  "Leads Trading Support. Owns execution-complaint quality and whether a dealing adjustment needs Risk.":
    "領導交易支援。擁有成交投訴品質，以及做市調整是否需風控。",
  "TR Dealing Support rota": "TR 成交支援值班表",
  "Sign-off that execution facts are complete before goodwill talk":
    "善意討論前簽署成交事實已完整",
  "Take CS-assigned trading cases": "承接 CS 指派的交易案件",
  "Ask AI for more trade details by email if the ticket is still unclear":
    "工單仍不清楚時請 AI 以信件索取更多交易細節",
  "Escalate toxic flow / stop-out storms to Risk": "有毒流量／強平風暴升級風控",
  "Staff C1 24/7": "值班 C1 24/7",
  "Arm halt or leverage controls": "啟動停商品或槓桿管制",
  "RISK_OWNER on book-risk dealing issues": "帳簿風險做市問題升級至 RISK_OWNER",
  "SYSTEM_ADMIN on feed/bridge failures that look like bad fills":
    "看似錯價成交的饋送／橋接故障升級至 SYSTEM_ADMIN",
  "Execution analyst. Reconstructs orders and fills for cases CS routed to Trading.":
    "成交分析師。還原 CS 分流至交易的訂單與成交。",
  "Assigned TR request threads": "已指派 TR 請求執行緒",
  "Write fill vs LP facts on the CS/TR desk": "在 CS／TR 台寫成交 vs LP 事實",
  "Request missing ticket numbers / screenshots via the AI email loop":
    "經 AI 信件迴圈索取缺漏工單號／截圖",
  "Promise refunds": "承諾退款",
  "Restart trading servers": "重啟交易伺服器",
  "TR_LEAD before any dealing adjustment": "任何做市調整前升級至 TR_LEAD",
  "CS_AGENT to hand back generic product FAQs": "一般產品 FAQ 交回 CS_AGENT",
  "Swap on XAUUSD overnight": "XAUUSD 隔夜利息",
  "Something wrong with my account": "我的帳戶有問題",
  "Slippage on EURUSD market order": "EURUSD 市價單滑點",
  "Please verify my account — cannot withdraw": "請核對我的帳戶 — 無法出金",
  "24/7 C1 live chat, web form and official mailbox intake; AI follow-up until the client replies.":
    "24/7 C1 即時聊天、網頁表單與官方信箱進件；AI 追問直到客戶回覆。",
  "Order, fill, slippage and MT4/MT5 execution complaints routed from CS.":
    "由 CS 分流的訂單、成交、滑點與 MT4／MT5 成交投訴。",
  "24/7 C1 live chat bridge into CRMP": "24/7 C1 即時聊天橋接至 CRMP",
  "Trading execution complaints from CS": "來自 CS 的成交投訴",
  "Platform 24/7 live chat (C1) webhook into the CS/TR desk.":
    "平台 24/7 即時聊天（C1）webhook 進入 CS／TR 台。",
  "Website / app contact form posts into the CS/TR desk.":
    "網站／App 聯絡表單進件至 CS／TR 台。",
  "Official support and complaints mailboxes ingested as CS requests.":
    "官方客服與投訴信箱匯入為 CS 請求。",
  "24/7 CS + Trading intake: C1 live chat, web form and official email via POST /api/cs/intake; AI emails the client when unclear or ID is needed and waits for a reply (max 3)":
    "24/7 CS＋交易進件：C1 即時聊天、網頁表單與官方信箱經 POST /api/cs/intake；AI 在不清楚或需核身時寄信並等待回覆（最多 3 封）",
  "GET inbox · POST triage / followup / client_reply / reply / assign_tr / escalate_risk / resolve / simulate_c1|form|email":
    "GET 收件匣 · POST 分流／追問／客戶回覆／回覆／指派 TR／升級風控／結案／模擬 C1｜表單｜信件",
  "Realtime C1 live chat, web form and official-email ingest — session, mock_webhook, or header x-cs-intake-token: demo-c1":
    "即時 C1 聊天、網頁表單與官方信箱進件 — 工作階段、mock_webhook 或標頭 x-cs-intake-token: demo-c1",
  "CS/TR intake channels, requests, transcript, auto-email follow-ups waiting for client reply":
    "CS／TR 進件渠道、請求、逐字稿、等待客戶回覆的自動追問信",
  "20-issue checklist by BU (AI, System, RO, Pricing, Ops, Monitor, GRC, Product, CS, TR) — ETA, dependencies, detailed ticks; includes C1/form/mailbox connectors and CS/TR ID vault":
    "依 BU 的 20 項議題清單（AI、系統、RO、定價、營運、Monitor、GRC、產品、CS、TR）— ETA、依賴、細項勾選；含 C1／表單／信箱連接器與 CS／TR 核身庫",
  "Combined hub: Risk / Ops / AI / System / CS / TR BUs with nested on-call teams (editable mission / rotation); former Departments + Teams":
    "合併中心：風險／營運／AI／系統／CS／TR BU 與嵌套值班團隊（可編輯任務／輪值）；原部門＋團隊",
  "Client-facing C1 live chat, website form and official email into POST /api/cs/intake; replies with CSR-XXXX close the auto-email wait loop":
    "客戶端 C1 即時聊天、網站表單與官方信箱進 POST /api/cs/intake；回覆帶 CSR-XXXX 會關閉自動信件等待迴圈",
  "Client-facing C1 live chat, submission form and official mailbox — same POST /api/cs/intake as the desk":
    "客戶端 C1 即時聊天、提交表單與官方信箱 — 與台面同一 POST /api/cs/intake",
  "24/7 CS + Trading intake: public /cs portal plus C1 live chat, web form and official email via POST /api/cs/intake; replies match CSR-XXXX / channel_ref; AI stamps dedicated SKILL.md playbooks, emails when unclear or ID is needed and waits for a reply (max 3)":
    "24/7 CS＋交易進件：公開 /cs 入口加上 C1 即時聊天、網頁表單與官方信箱經 POST /api/cs/intake；回覆以 CSR-XXXX／channel_ref 對案；AI 蓋專用 SKILL.md，不清楚或需核身時寄信並等待回覆（最多 3 封）",
  "GET connector catalog / ticket status · POST C1 live chat, web form and official-email ingest or continue (request_id / in_reply_to / channel_ref / CSR-XXXX) — session, mock_webhook, portal, or header x-cs-intake-token: demo-c1":
    "GET 連接器目錄／案件狀態 · POST C1 即時聊天、網頁表單與官方信箱進件或續辦（request_id／in_reply_to／channel_ref／CSR-XXXX）— 工作階段、mock_webhook、portal 或標頭 x-cs-intake-token: demo-c1",
  "CRMP Plus CS client portal": "CRMP Plus CS 客戶入口",
  "CS client portal": "CS 客戶入口",
  "Operator handbook (EN/ZH) — every left-nav page plus 24/7 CS/TR: /cs portal, C1/form/mailbox, auto-email wait loop, dedicated skills":
    "操作手冊（英／繁中）— 左側每一頁加上 24/7 CS／TR：/cs 入口、C1／表單／信箱、自動信件等待迴圈、專用技能",
  "Permanent client door: C1 live chat, website form and official mailbox — same POST /api/cs/intake as the desk":
    "永久客戶大門：C1 即時聊天、網站表單與官方信箱 — 與台面同一 POST /api/cs/intake",
  "Public C1 live chat, website submission form and official email into POST /api/cs/intake; CSR-XXXX / channel_ref replies close the auto-email wait loop (max 3)":
    "公開 C1 即時聊天、網站提交表單與官方信箱進 POST /api/cs/intake；CSR-XXXX／channel_ref 回覆關閉自動信件等待迴圈（最多 3 封）",
  "Operator inbox: triage, auto-email follow-up, client-reply wait loop, TR handoff, risk escalate; AI stamps SKILL-CS-* / SKILL-TR-* playbooks":
    "操作收件匣：分流、自動追問信、客戶回覆等待迴圈、TR 交接、升級風控；AI 蓋 SKILL-CS-*／SKILL-TR-* 劇本",
  "Skill: CS clarify": "技能：CS 釐清",
  "Skill: CS ID verify": "技能：CS 核身",
  "Skill: CS account FAQ": "技能：CS 帳戶 FAQ",
  "Skill: TR execution": "技能：TR 成交",
  "Skill: CS escalate risk": "技能：CS 升級風控",
  "Dedicated SKILL.md — AI emails one missing-info question and waits for the client reply":
    "專用 SKILL.md — AI 寄一封缺資料問題並等待客戶回覆",
  "Dedicated SKILL.md — ID / KYC follow-up via official mailbox; never store ID images in the request":
    "專用 SKILL.md — 經官方信箱核身／KYC；切勿把證件圖存進案件",
  "Dedicated SKILL.md — swap, margin, deposits, login; CS can auto-reply from RAG":
    "專用 SKILL.md — 隔夜利息、保證金、入金、登入；CS 可從 RAG 自動回",
  "Dedicated SKILL.md — fills, slippage, rejects; CS hands to TR dealing, never reprices":
    "專用 SKILL.md — 成交、滑點、拒單；CS 交 TR 成交台，絕不改價",
  "Dedicated SKILL.md — suspected fraud / A-book / liquidity → Risk + Demo Messenger":
    "專用 SKILL.md — 疑詐欺／A-book／流動性 → 風控＋示範 Messenger",
  "RAG: 24/7 intake": "RAG：24/7 進件",
  "RAG: ID verify policy": "RAG：核身政策",
  "RAG: swap FAQ": "RAG：隔夜利息 FAQ",
  "RAG: TR dealing handoff": "RAG：TR 成交交接",
  "RAG: escalate to risk": "RAG：升級風控",
  "RAG: CS skill playbooks": "RAG：CS 技能劇本",
  "Policy leaf: C1 / form / mailbox door, CSR-XXXX matching, wait-loop cap":
    "政策葉：C1／表單／信箱大門、CSR-XXXX 對案、等待迴圈上限",
  "Policy leaf: identity follow-up, vault, never store ID images on the ticket":
    "政策葉：身分追問、核身庫，切勿把證件圖存進工單",
  "Policy leaf: overnight swap / financing answers CS may auto-send":
    "政策葉：隔夜利息／融資答案，CS 可自動寄出",
  "Policy leaf: when CS assigns TR; execution team owns fills":
    "政策葉：CS 何時指派 TR；成交由成交台負責",
  "Policy leaf: CS → Risk via ESC-CS-RISK and Demo Messenger":
    "政策葉：CS 經 ESC-CS-RISK 與示範 Messenger 升級風控",
  "Index leaf: the five dedicated CS/TR SKILL.md codes and routes":
    "索引葉：五本專用 CS／TR SKILL.md 代碼與路徑",
  "Control-plane overview, dummy spine, stats, CS/TR desk + client-portal shortcuts, expandable alert tracker, home spine with stage ticket counts (Spine Log tab removed)":
    "控制面總覽、虛擬脊柱、統計、CS／TR 台＋客戶入口捷徑、可展開警報追蹤、首頁脊柱階段工單計數（已移除脊柱日誌分頁）",
  "CFD + Crypto domains with P0–P3 scenarios linked to Monitor 2.0 (M2-* chips); knowledge tree also maps CS_SERVICE / TRADING_EXEC":
    "CFD＋加密領域、P0–P3 情境掛 Monitor 2.0（M2-* 晶片）；知識樹亦對應 CS_SERVICE／TRADING_EXEC",
  "Internal + external evidence corpus (incl. cs-* / tr-* CS/TR policy leaves) — AI write blocked (human-gate: pages AI cannot edit escalate to human / propose_rag maker-checker)":
    "內外部證據語料（含 cs-*／tr-* CS／TR 政策葉）— 禁止 AI 寫入（人工閘道：AI 不能改的頁升級人工／propose_rag 雙人）",
  "Playbooks & enriched risk scenarios — Enter opens the full SKILL.md page; includes SKILL-CS-CLARIFY / ID-VERIFY / ACCOUNT-FAQ, SKILL-TR-EXECUTION, SKILL-CS-ESCALATE-RISK; each skill binds one escalation path (ESC-DEFAULT fallback)":
    "劇本與豐富風險情境 — 進入打開完整 SKILL.md；含 SKILL-CS-CLARIFY／ID-VERIFY／ACCOUNT-FAQ、SKILL-TR-EXECUTION、SKILL-CS-ESCALATE-RISK；每技能綁一條升級路徑（ESC-DEFAULT 後援）",
  "Full when-to-use / prechecks / evidence / stop / success playbook for one skill — CS/TR codes listed under CS / TR":
    "單一技能的何時用／預檢／證據／停止／成功劇本 — CS／TR 代碼列於 CS／TR 區",
  "Alert + AI report inbox; chat windows split by POC on the escalation path (bird-eye relay); evidence, chat, escalate, dismiss, close, controls; CS risk cases land here via SKILL-CS-ESCALATE-RISK":
    "警報＋AI 報告收件匣；聊天窗依升級路徑 POC 分窗（鳥瞰轉傳）；證據、聊天、升級、排除、結案、控制；CS 風控案經 SKILL-CS-ESCALATE-RISK 落入此處",
  "Channel registry & mock notify — includes oc_cs_c1 (C1 live chat) and oc_tr_dealing (TR dealing)":
    "頻道登錄與模擬通知 — 含 oc_cs_c1（C1 即時聊天）與 oc_tr_dealing（TR 成交）",
  "Dimension-defined paths × coefficients; ESC-DEFAULT catch-all plus ESC-CS-24-7, ESC-TR-DEAL, ESC-CS-RISK for CS/TR skills":
    "維度定義路徑 × 係數；ESC-DEFAULT 兜底，加上 CS／TR 技能的 ESC-CS-24-7、ESC-TR-DEAL、ESC-CS-RISK",
  "Combined hub: Risk / Ops / AI / System / CS / TR BUs with nested on-call teams (CS L1, TR dealing, KYC vault); editable mission / rotation":
    "合併中心：風險／營運／AI／系統／CS／TR BU 與嵌套值班團隊（CS L1、TR 成交、KYC 庫）；可編輯任務／輪值",
  "Internal/external source registry — includes C1 live-chat gateway, website CS form and official support mailbox":
    "內外部來源登錄 — 含 C1 即時聊天閘道、網站 CS 表單與官方客服信箱",
  "Two tabs — CRMP logs (alerts/AI/skills/escalation/interventions/messenger/CS_*) and Vantage Markets Admin logs; Roll back via before-state snapshot":
    "兩個分頁 — CRMP 日誌（警報／AI／技能／升級／介入／Messenger／CS_*）與 Vantage Markets 管理日誌；有變更前快照可回滾",
  "Technical Specification Design (EN/ZH) — §17.5–17.10 schema, intake, wait loop, /cs portal, URL catalog, FR-37…43":
    "技術規格設計（英／繁中）— §17.5–17.10 綱要、進件、等待迴圈、/cs 入口、網址目錄、FR-37…43",
  "Product Requirements (EN/ZH) — G13 + FR-37…43: /cs portal, C1/form/mailbox, wait loop, dedicated skills, catalog":
    "產品需求（英／繁中）— G13＋FR-37…43：/cs 入口、C1／表單／信箱、等待迴圈、專用技能、目錄",
  "Risk Owner UAT pack — UAT-46…50 cover C1/form/mailbox, wait loop, dedicated skills, knowledge tree, ID vault":
    "風險負責人 UAT 包 — UAT-46…50 涵蓋 C1／表單／信箱、等待迴圈、專用技能、知識樹、核身庫",
  "This page — all admin/API/DB paths plus the CS/TR section (/cs, desk, five skills, RAG leaves, intake API)":
    "本頁 — 全部管理／API／資料表路徑，加上 CS／TR 區段（/cs、台面、五本技能、RAG 葉、進件 API）",
  "GET inbox · POST triage / followup / client_reply / reply / assign_tr / escalate_risk / resolve / simulate_c1|form|email — operator actions; public ingest is POST /api/cs/intake":
    "GET 收件匣 · POST 分流／追問／客戶回覆／回覆／指派 TR／升級風控／結案／模擬 C1｜表單｜信件 — 操作動作；公開進件為 POST /api/cs/intake",
  "GET connector catalog · POST C1 live chat, web form and official-email ingest or continue (request_id / in_reply_to / channel_ref / CSR-XXXX) — session, mock_webhook, portal, or header x-cs-intake-token: demo-c1":
    "GET 連接器目錄 · POST C1 即時聊天、網頁表單與官方信箱進件或續辦（request_id／in_reply_to／channel_ref／CSR-XXXX）— 工作階段、mock_webhook、portal 或標頭 x-cs-intake-token: demo-c1",
  "CS intake ticket status": "CS 進件案件狀態",
  "GET public status for one CSR-XXXX (no PII) — /cs portal and mailbox gateway poll this while the wait loop is open":
    "GET 單一 CSR-XXXX 公開狀態（無個資）— /cs 入口與信箱閘道在等待迴圈開啟時輪詢",
  "Seeded C1 live chat, website form and official mailbox connectors (channel_code, kind, address)":
    "種子 C1 即時聊天、網站表單與官方信箱連接器（channel_code、kind、address）",
  "Client tickets CSR-XXXX — channel_ref, skill_code, wait_loop_open, followup_count, assigned_bu, status":
    "客戶工單 CSR-XXXX — channel_ref、skill_code、wait_loop_open、followup_count、assigned_bu、status",
  "Transcript: client / AI / CS / TR / system lines on each request":
    "逐字稿：每則請求的客戶／AI／CS／TR／系統列",
  "Auto-email wait-loop rows — waiting_reply until In-Reply-To / CSR-XXXX / channel_ref closes them (max 3)":
    "自動信件等待迴圈列 — waiting_reply 直到 In-Reply-To／CSR-XXXX／channel_ref 關閉（最多 3 封）",
  "cs_channels": "cs_channels（C1／表單／信箱）",
  "cs_requests": "cs_requests（CSR-XXXX 工單）",
  "cs_messages": "cs_messages（逐字稿）",
  "cs_followups": "cs_followups（自動追問信）",
  "CRMP Plus CS / TR Desk": "CRMP Plus CS／TR 台",
  "CS / TR Desk": "CS／TR 台",
  "CS / TR Desk API": "CS／TR 台 API",
  "CS intake webhook": "CS 進件 webhook",
};

/** Longest-first English fragments rewritten inside mixed dummy / log strings. */
export const DUMMY_PHRASE_FRAGMENTS = [
  "Home dummy: top signal provider now at 33% of copy equity after a viral strategy share. Walk the full spine to closure.",
  "Home dummy: company CFD book drawdown rising through the US session after CPI volatility. RAG path + human review.",
  "Home dummy: book-wide margin utilisation spiked and LP rejects are rising. Dual-AI RCA and maker/checker required.",
  "Dummy home run — Risk Owner auto-approved after messenger maker/checker.",
  "Dummy home run: accepting the AI pack and walking maker/checker through to closure.",
  "DUMMY · Copy concentration breach",
  "DUMMY · Equity drawdown warn",
  "DUMMY · Margin utilisation CRITICAL",
  "Dummy spine produced no alerts",
  "dummy_spine failed",
  "Control-plane overview, dummy spine buttons (single alert or linked group walk DETECT→close), stats, expandable alert tracker, and home spine with stage ticket counts (Spine Log tab removed)",
  "GET analyses · POST analyze/simulate/dummy_spine (home dummy alert or group, auto-walk to closure)/backfill challenges",
  "Alert + AI report inbox; chat windows split by POC on the escalation path (bird-eye relay); evidence, chat, escalate, dismiss, close, controls",
  "Home dummy",
  "home-dummy",
] as const;
