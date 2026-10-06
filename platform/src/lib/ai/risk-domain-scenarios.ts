/**
 * Detailed risk scenarios for the Risk Domains catalogue.
 * Each scenario maps to one or more Monitor 2.0 indicators so every story
 * has a live telemetry hook under /admin/monitor-2.
 */

export type LocaleText = { en: string; zh: string };

export type DomainScenario = {
  code: string;
  name: LocaleText;
  domain_code: string;
  /** 0 = firm-critical, 1 = primary desk, 2 = secondary, 3 = watch / supporting */
  priority: 0 | 1 | 2 | 3;
  product: string;
  how_it_works: LocaleText;
  participants: LocaleText[];
  impacts: LocaleText;
  /** Primary Monitor 2.0 indicator(s) that must be watched for this scenario */
  primary_indicators: string[];
  related_indicators: string[];
};

/** Extra domains beyond the original 10 — upserted on boot. */
export const EXTRA_RISK_DOMAINS = [
  {
    code: "SYSTEMIC_FIRM",
    name: "Firm-wide Systemic & Contagion",
    description: "Cross-book equity, VaR, kill-switches and news-window contagion that can hit CFD and exchange together.",
    owner_department: "RISK_CONTROL",
    supporting_departments_json: '["AI","SYSTEM","OPERATIONS"]',
    product_coverage: "CFD + Crypto",
    priority: 0,
  },
  {
    code: "THIRD_PARTY_VENDOR",
    name: "Third-party & Vendor Dependency",
    description: "LP, bridge, data vendor, payment and IB rails that fail outside Vantage-owned stack.",
    owner_department: "SYSTEM",
    supporting_departments_json: '["RISK_CONTROL","OPERATIONS"]',
    product_coverage: "CFD + Crypto",
    priority: 3,
  },
  {
    code: "REPUTATION_COMMS",
    name: "Reputation & Client Communications",
    description: "Complaint velocity, chargeback optics and trust damage during incidents.",
    owner_department: "OPERATIONS",
    supporting_departments_json: '["RISK_CONTROL","OPERATIONS"]',
    product_coverage: "CFD + Crypto",
    priority: 3,
  },
  {
    code: "CS_SERVICE",
    name: "Customer Service 24/7",
    description: "C1 live chat, web form and official mailbox intake; clarify / ID / FAQ playbooks. Does not arm trading controls.",
    owner_department: "CUSTOMER_SERVICE",
    supporting_departments_json: '["TRADING","RISK_CONTROL","AI"]',
    product_coverage: "CFD + Crypto",
    priority: 2,
  },
  {
    code: "TRADING_EXEC",
    name: "Trading Execution (TR)",
    description: "Fill, slippage, stop-out and MT4/MT5 tape review routed from CS. Hands book-risk to the Risk spine.",
    owner_department: "TRADING",
    supporting_departments_json: '["CUSTOMER_SERVICE","RISK_CONTROL","SYSTEM"]',
    product_coverage: "CFD + Crypto",
    priority: 1,
  },
] as const;

/** Extra monitors required so new domains / scenarios are fully covered. */
export const EXTRA_MONITOR_SEED_ROWS = [
  {
    monitor_id: "M2-CROSS-BOOK",
    name: "Cross-book Contagion Score",
    domain_code: "SYSTEMIC_FIRM",
    product: "CFD+Crypto",
    warn: 0.55,
    breach: 0.75,
    unit: "score",
    status: "HEALTHY",
    last_value: 0.18,
    tickets: 0,
  },
  {
    monitor_id: "M2-VENDOR-OUT",
    name: "Critical Vendor Degraded Count",
    domain_code: "THIRD_PARTY_VENDOR",
    product: "CFD+Crypto",
    warn: 1,
    breach: 3,
    unit: "vendors",
    status: "HEALTHY",
    last_value: 0,
    tickets: 0,
  },
  {
    monitor_id: "M2-COMPLAINT",
    name: "Client Complaint Velocity (24h)",
    domain_code: "REPUTATION_COMMS",
    product: "CFD+Crypto",
    warn: 40,
    breach: 100,
    unit: "count/24h",
    status: "HEALTHY",
    last_value: 12,
    tickets: 0,
  },
  {
    monitor_id: "M2-CS-UNCLEAR",
    name: "Unclear CS requests waiting (open)",
    domain_code: "CS_SERVICE",
    product: "CFD+Crypto",
    warn: 8,
    breach: 20,
    unit: "tickets",
    status: "WARN",
    last_value: 9,
    tickets: 1,
  },
  {
    monitor_id: "M2-CS-ID",
    name: "ID-verify CS queue (open)",
    domain_code: "CS_SERVICE",
    product: "CFD+Crypto",
    warn: 5,
    breach: 12,
    unit: "tickets",
    status: "HEALTHY",
    last_value: 2,
    tickets: 1,
  },
  {
    monitor_id: "M2-CS-FAQ",
    name: "Open CS FAQ / product questions",
    domain_code: "CS_SERVICE",
    product: "CFD+Crypto",
    warn: 40,
    breach: 80,
    unit: "tickets",
    status: "HEALTHY",
    last_value: 11,
    tickets: 0,
  },
  {
    monitor_id: "M2-TR-EXEC",
    name: "TR dealing queue (assigned)",
    domain_code: "TRADING_EXEC",
    product: "CFD+Crypto",
    warn: 10,
    breach: 25,
    unit: "tickets",
    status: "HEALTHY",
    last_value: 4,
    tickets: 1,
  },
  {
    monitor_id: "M2-CS-ESC",
    name: "CS/TR escalations onto Risk (open)",
    domain_code: "CS_SERVICE",
    product: "CFD+Crypto",
    warn: 3,
    breach: 8,
    unit: "tickets",
    status: "HEALTHY",
    last_value: 1,
    tickets: 0,
  },
] as const;

export const DOMAIN_SCENARIOS: DomainScenario[] = [
  // —— SYSTEMIC (P0) ——
  {
    code: "SCN-CROSS-BOOK-CONTAGION",
    name: {
      en: "Cross-book contagion into firm equity",
      zh: "跨帳簿傳染打到公司權益",
    },
    domain_code: "SYSTEMIC_FIRM",
    priority: 0,
    product: "CFD + Crypto",
    how_it_works: {
      en: "A shock starts in one book (copy cascade, LP rejects, or crypto liquidation backlog) and the same underlying moves the CFD and exchange books together. Contagion score rises when multiple domains alarm within a short window while company equity drawdown and VaR utilisation climb.",
      zh: "衝擊從單一帳簿（跟單連鎖、LP 拒單或加密強平積壓）開始，同一標的同時推動 CFD 與交易所帳簿。當多個風險領域在短時間內同時告警，且公司權益回撤與 VaR 使用率上升時，傳染分數會升高。",
    },
    participants: [
      { en: "Risk Owner / Exec Risk Bridge", zh: "風險負責人／高管風險橋接" },
      { en: "Credit Desk + Crypto Risk", zh: "信貸台＋加密風險" },
      { en: "Trading Infra (kill-switch / bridge)", zh: "交易基礎設施（熔斷／橋接）" },
      { en: "AI Detection Lab (second opinion)", zh: "AI 偵測實驗室（第二意見）" },
    ],
    impacts: {
      en: "Firm-wide PnL hit, simultaneous SLA breaches, possible symbol halt, and executive visibility if equity drawdown crosses 5%.",
      zh: "全公司損益受損、多條 SLA 同時違規、可能觸發商品熔斷；若權益回撤超過 5% 需高管可視。",
    },
    primary_indicators: ["M2-CROSS-BOOK", "M2-EQ-001", "M2-VAR-002"],
    related_indicators: ["M2-NEWS-GROSS", "M2-KILL-COUNT", "M2-HEDGE-007", "M2-MRG-014"],
  },
  {
    code: "SCN-NEWS-WINDOW-GROSS",
    name: {
      en: "Tier-1 news window gross notional overload",
      zh: "一級新聞窗口名義部位過載",
    },
    domain_code: "SYSTEMIC_FIRM",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "Before NFP/FOMC/CPI, clients pile into majors and metals. Gross notional into the event window is tracked; if it is too large versus hedge capacity, a gap or reject storm can become a firm event rather than a desk event.",
      zh: "NFP／FOMC／CPI 前，客戶湧入主要貨幣對與貴金屬。系統追蹤進入事件窗口的總名義部位；若相對對沖容量過大，跳空或拒單風暴會從櫃台事件升級為全公司事件。",
    },
    participants: [
      { en: "Market Risk / Pricing Desk", zh: "市場風險／定價台" },
      { en: "LP & Hedge Desk", zh: "LP 與對沖台" },
      { en: "Risk Owner", zh: "風險負責人" },
    ],
    impacts: {
      en: "Gap losses, stop-out clustering, and forced widen/halt decisions under time pressure.",
      zh: "跳空損失、強平聚集，以及在時間壓力下被迫擴大點差或熔斷。",
    },
    primary_indicators: ["M2-NEWS-GROSS", "M2-EQ-001"],
    related_indicators: ["M2-GAP-012", "M2-HEDGE-007", "M2-FEED-003"],
  },

  // —— CREDIT_CLIENT ——
  {
    code: "SCN-MARGIN-UTIL-SPIKE",
    name: {
      en: "Margin utilisation spike (≥100 accounts >90%)",
      zh: "保證金使用率暴衝（≥100 帳戶 >90%）",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "Many retail accounts sit above 90% margin utilisation into a volatile session. Liquidation engines then fire in clusters; if those accounts also follow the same copy providers, the book moves as one position.",
      zh: "大量零售帳戶在波動盤前保證金使用率超過 90%。強平引擎會成群觸發；若這些帳戶還跟隨同一跟單提供者，整個帳簿會像單一部位移動。",
    },
    participants: [
      { en: "Credit & Client Risk analysts", zh: "信貸與客戶風險分析師" },
      { en: "Risk Owner (human gate on leverage)", zh: "風險負責人（槓桿人工關卡）" },
      { en: "Ops (account leverage freezes)", zh: "營運（帳戶槓桿凍結）" },
    ],
    impacts: {
      en: "Cascade stop-outs, company equity drawdown, LP reject pressure, and possible negative balances if marks lag.",
      zh: "連鎖強平、公司權益回撤、LP 拒單壓力；若報價落後還可能出現負餘額。",
    },
    primary_indicators: ["M2-MRG-014"],
    related_indicators: ["M2-COPY-009", "M2-STOP-018", "M2-NBP-016", "M2-EQ-001", "M2-FEED-003"],
  },
  {
    code: "SCN-COPY-CONCENTRATION",
    name: {
      en: "Copy provider concentration breach",
      zh: "跟單提供者集中度違規",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "One signal provider accumulates an outsized share of copier equity. When that provider turns, hundreds of followers hit margin and stop-out together, amplifying toxic flow against the house.",
      zh: "單一訊號提供者累積過高跟單權益占比。當該提供者轉向時，數百名跟隨者同時觸及保證金與強平，放大對公司不利的有毒流量。",
    },
    participants: [
      { en: "Credit Desk", zh: "信貸台" },
      { en: "Product / Copy programme owner", zh: "產品／跟單專案負責人" },
      { en: "Risk Owner (pause new copies)", zh: "風險負責人（暫停新跟單）" },
    ],
    impacts: {
      en: "Correlated PnL swings, margin spikes, and reputational damage if followers are force-closed.",
      zh: "高度相關的損益波動、保證金暴衝；若跟隨者被強制平倉還有聲譽損害。",
    },
    primary_indicators: ["M2-COPY-009"],
    related_indicators: ["M2-COPY-CHURN", "M2-MRG-014", "M2-ARB-026"],
  },
  {
    code: "SCN-STOPOUT-VELOCITY",
    name: {
      en: "Stop-out velocity surge (5-minute window)",
      zh: "強平速度暴衝（5 分鐘視窗）",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Stop-outs per five minutes jump well above normal. This is the early telemetry of a credit cascade — often before equity drawdown fully prints.",
      zh: "每五分鐘強平筆數遠高於常態。這是信貸連鎖的早期遙測，通常早於權益回撤完整顯現。",
    },
    participants: [
      { en: "Credit Desk", zh: "信貸台" },
      { en: "Trading Infra (engine health)", zh: "交易基礎設施（引擎健康）" },
    ],
    impacts: {
      en: "Liquidation slippage, temporary equity noise, and staffing pressure on the desk.",
      zh: "強平滑點、短暫權益噪音，以及櫃台人力壓力。",
    },
    primary_indicators: ["M2-STOP-018"],
    related_indicators: ["M2-MRG-014", "M2-NBP-016", "M2-SLIP-021"],
  },
  {
    code: "SCN-NEGATIVE-BALANCE",
    name: {
      en: "Negative balance protection breach",
      zh: "負餘額保護失守",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Accounts finish below zero after gaps or delayed stops. Negative-balance count is the hard evidence that protection or feed timing failed.",
      zh: "跳空或延遲止損後帳戶低於零。負餘額帳戶數是保護機制或報價時序失敗的硬證據。",
    },
    participants: [
      { en: "Credit Desk + Ops funding", zh: "信貸台＋營運資金" },
      { en: "Compliance (client money)", zh: "合規（客戶資金）" },
    ],
    impacts: {
      en: "Direct firm loss, client complaints, and possible regulatory capital impact.",
      zh: "公司直接損失、客戶投訴，以及可能的監管資本影響。",
    },
    primary_indicators: ["M2-NBP-016"],
    related_indicators: ["M2-GAP-012", "M2-FEED-003", "M2-SEG-025"],
  },
  {
    code: "SCN-LATENCY-ARB",
    name: {
      en: "Latency arbitrage / toxic flow",
      zh: "延遲套利／有毒流量",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "A toxicity score flags clients who systematically pick off stale or slow quotes. Left unchecked, they transfer LP and book losses onto the house.",
      zh: "毒性分數標記系統性吃掉過期或過慢報價的客戶。若不處理，會把 LP 與帳簿損失轉移到公司。",
    },
    participants: [
      { en: "Credit Desk / toxic-flow team", zh: "信貸台／有毒流量小組" },
      { en: "Pricing & LP desk", zh: "定價與 LP 台" },
    ],
    impacts: {
      en: "Chronic adverse selection, wider spreads for good clients, and LP relationship damage.",
      zh: "長期逆向選擇、優質客戶點差被迫擴大，並損害 LP 關係。",
    },
    primary_indicators: ["M2-ARB-026"],
    related_indicators: ["M2-SLIP-021", "M2-FEED-003", "M2-ABOOK-008"],
  },
  {
    code: "SCN-COPY-CHURN",
    name: {
      en: "Copy follower panic unwind",
      zh: "跟單跟隨者恐慌退出",
    },
    domain_code: "CREDIT_CLIENT",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "Followers exit a provider en masse within an hour. The unwind itself can move prices and margin utilisation even if the original concentration alert has not fired.",
      zh: "跟隨者在一小時內大量退出某提供者。即使原本的集中度警報尚未觸發，這波平倉本身也能推動價格與保證金使用率。",
    },
    participants: [
      { en: "Credit Desk", zh: "信貸台" },
      { en: "Client Ops / Comms", zh: "客戶營運／通訊" },
    ],
    impacts: {
      en: "Sudden inventory flip, slippage, and complaint spikes from forced exits.",
      zh: "庫存突然翻轉、滑點上升，以及強制退出引發的投訴暴增。",
    },
    primary_indicators: ["M2-COPY-CHURN"],
    related_indicators: ["M2-COPY-009", "M2-COMPLAINT", "M2-MRG-014"],
  },

  // —— MARKET_PRICING ——
  {
    code: "SCN-EQUITY-DRAWDOWN",
    name: {
      en: "Company equity drawdown",
      zh: "公司權益回撤",
    },
    domain_code: "MARKET_PRICING",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "Mark-to-market of the CFD book versus start-of-day equity. Warn at 3% and breach at 5% force a firm-level response, not only a symbol tweak.",
      zh: "CFD 帳簿相對日初權益的市價評估。3% 警告、5% 違規會強制升級為公司層級應變，而不只是調整單一商品。",
    },
    participants: [
      { en: "Market Risk Owner", zh: "市場風險負責人" },
      { en: "Exec Risk Bridge (on BREACH)", zh: "高管風險橋接（違規時）" },
      { en: "Hedge Desk", zh: "對沖台" },
    ],
    impacts: {
      en: "Capital buffer pressure, possible trading restrictions, and executive escalation.",
      zh: "資本緩衝受壓、可能限制交易，並升級至高管。",
    },
    primary_indicators: ["M2-EQ-001"],
    related_indicators: ["M2-VAR-002", "M2-CROSS-BOOK", "M2-HEDGE-007"],
  },
  {
    code: "SCN-STALE-FEED",
    name: {
      en: "Stale or crossed quote feed",
      zh: "過期或交叉報價饋送",
    },
    domain_code: "MARKET_PRICING",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Symbols stop updating or bid/ask cross. Clients may trade on wrong marks; stops fire late; margin utilisation can look artificial until the feed recovers.",
      zh: "商品停止更新或買賣價交叉。客戶可能按錯誤標記交易；止損失效延遲；在饋送恢復前，保證金使用率可能看起來異常。",
    },
    participants: [
      { en: "Pricing / Feed Ops", zh: "定價／饋送營運" },
      { en: "Trading Infra", zh: "交易基礎設施" },
      { en: "Risk Control (symbol halt)", zh: "風險控管（商品熔斷）" },
    ],
    impacts: {
      en: "Mispriced fills, false credit alarms, and client disputes.",
      zh: "錯誤成交價、虛假信貸警報，以及客戶爭議。",
    },
    primary_indicators: ["M2-FEED-003"],
    related_indicators: ["M2-SLIP-021", "M2-KILL-COUNT", "M2-MRG-014"],
  },
  {
    code: "SCN-SLIPPAGE-SPIKE",
    name: {
      en: "Client slippage spike on majors",
      zh: "主要商品客戶滑點暴衝",
    },
    domain_code: "MARKET_PRICING",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "Average client slippage on majors over 15 minutes jumps. Often a bridge, LP, or spread-config issue rather than a single VIP.",
      zh: "主要商品 15 分鐘平均客戶滑點急升。通常是橋接、LP 或點差設定問題，而非單一 VIP。",
    },
    participants: [
      { en: "Pricing Desk", zh: "定價台" },
      { en: "LP Desk", zh: "LP 台" },
      { en: "Client Ops (complaints)", zh: "客戶營運（投訴）" },
    ],
    impacts: {
      en: "Client trust damage, chargebacks, and LP cost if the house is on the wrong side.",
      zh: "客戶信任受損、退單增加；若公司站在錯誤一側還有 LP 成本。",
    },
    primary_indicators: ["M2-SLIP-021"],
    related_indicators: ["M2-BRIDGE-LAT", "M2-LP-022", "M2-SPREAD-005", "M2-COMPLAINT"],
  },
  {
    code: "SCN-VAR-CORR",
    name: {
      en: "VaR utilisation and correlation break",
      zh: "VaR 使用率與相關性破裂",
    },
    domain_code: "MARKET_PRICING",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "1-day VaR utilisation and correlation drift versus baseline show the book is riskier than the model assumed — hedges may be wrong-way.",
      zh: "一日 VaR 使用率與相對基準的相關性漂移顯示帳簿風險高於模型假設——對沖可能反向失效。",
    },
    participants: [
      { en: "Market Risk quant / desk", zh: "市場風險量化／櫃台" },
      { en: "AI model owners (if inputs drift)", zh: "AI 模型負責人（若輸入漂移）" },
    ],
    impacts: {
      en: "Undersized hedges, surprise PnL on stress days, and capital buffer strain.",
      zh: "對沖不足、壓力日意外損益，以及資本緩衝吃緊。",
    },
    primary_indicators: ["M2-VAR-002", "M2-CORR-004"],
    related_indicators: ["M2-EQ-001", "M2-HEDGE-007"],
  },
  {
    code: "SCN-MARKET-INTEL",
    name: {
      en: "High-impact market intelligence hit",
      zh: "高影響市場情報命中",
    },
    domain_code: "MARKET_PRICING",
    priority: 1,
    product: "CFD + Crypto",
    how_it_works: {
      en: "The 5-minute intel scanner flags central-bank, sanctions, or macro events that can gap prices. Desk prep (widen, inventory check) must happen before the print, not after.",
      zh: "五分鐘情報掃描標記央行、制裁或總經事件，可能造成價格跳空。櫃台準備（擴大點差、檢查庫存）必須在公布前完成，而非事後。",
    },
    participants: [
      { en: "Market Intelligence + Pricing", zh: "市場情報＋定價" },
      { en: "Risk Control Desk", zh: "風險控管台" },
      { en: "AI skill playbooks", zh: "AI 技能劇本" },
    ],
    impacts: {
      en: "Avoidable gap losses if ignored; over-reaction if treated as every headline.",
      zh: "忽略時可能產生可避免的跳空損失；若把每則標題都當警報則會過度反應。",
    },
    primary_indicators: ["M2-MKT-INTEL"],
    related_indicators: ["M2-NEWS-GROSS", "M2-FEED-003", "M2-GAP-012"],
  },

  // —— LP_HEDGE ——
  {
    code: "SCN-LP-REJECT-STORM",
    name: {
      en: "LP reject storm (oneZero / prime)",
      zh: "LP 拒單風暴（oneZero／prime）",
    },
    domain_code: "LP_HEDGE",
    priority: 0,
    product: "CFD",
    how_it_works: {
      en: "A liquidity provider starts rejecting hedges. Unhedged inventory piles up on the house book within minutes; coverage ratio falls and equity risk rises.",
      zh: "流動性提供者開始拒絕對沖。未對沖庫存在數分鐘內堆在公司帳簿；覆蓋率下降、權益風險上升。",
    },
    participants: [
      { en: "LP / Hedge Desk", zh: "LP／對沖台" },
      { en: "Trading Infra on-call", zh: "交易基礎設施值班" },
      { en: "Risk Owner (disable LP)", zh: "風險負責人（停用 LP）" },
    ],
    impacts: {
      en: "Open market risk, wider client spreads, and possible symbol halt.",
      zh: "敞口市場風險、客戶點差擴大，以及可能的商品熔斷。",
    },
    primary_indicators: ["M2-LP-022"],
    related_indicators: ["M2-HEDGE-007", "M2-ABOOK-008", "M2-BRIDGE-LAT", "M2-VENDOR-OUT"],
  },
  {
    code: "SCN-HEDGE-COVERAGE",
    name: {
      en: "Hedge coverage below target",
      zh: "對沖覆蓋低於目標",
    },
    domain_code: "LP_HEDGE",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Share of client risk that is actually hedged to LPs drops below warn (85%) or breach (70%). Can be rejects, intentional B-book, or bridge lag.",
      zh: "實際對沖到 LP 的客戶風險占比低於警告（85%）或違規（70%）。可能來自拒單、刻意 B-book，或橋接延遲。",
    },
    participants: [
      { en: "Hedge Desk", zh: "對沖台" },
      { en: "Risk Control", zh: "風險控管" },
    ],
    impacts: {
      en: "Directional firm risk and larger equity swings on the next move.",
      zh: "公司承擔方向性風險，下一波波動時權益擺幅更大。",
    },
    primary_indicators: ["M2-HEDGE-007"],
    related_indicators: ["M2-LP-022", "M2-ABOOK-008", "M2-EQ-001"],
  },
  {
    code: "SCN-ABOOK-RATIO",
    name: {
      en: "A-book volume ratio collapse",
      zh: "A-book 成交占比崩落",
    },
    domain_code: "LP_HEDGE",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "Session A-book ratio falls, meaning more flow stays B-booked. Useful as a control lever, dangerous if it happens unintentionally during toxic sessions.",
      zh: "盤中 A-book 占比下降，代表更多流量留在 B-book。作為控制槓桿有用；若在有毒盤中非預期發生則危險。",
    },
    participants: [
      { en: "Hedge / Book routing owners", zh: "對沖／帳簿路由負責人" },
      { en: "Credit Desk (toxicity context)", zh: "信貸台（毒性脈絡）" },
    ],
    impacts: {
      en: "Inventory risk concentration and surprise PnL versus intended routing policy.",
      zh: "庫存風險集中，以及相對既定路由政策的意外損益。",
    },
    primary_indicators: ["M2-ABOOK-008"],
    related_indicators: ["M2-HEDGE-007", "M2-ARB-026"],
  },

  // —— CRYPTO_EXCHANGE ——
  {
    code: "SCN-HOT-WALLET",
    name: {
      en: "Hot wallet float elevated",
      zh: "熱錢包浮額偏高",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 1,
    product: "Crypto",
    how_it_works: {
      en: "Too much client crypto sits in hot wallets versus cold custody. Raises theft and operational loss exposure until a cold sweep completes.",
      zh: "過多客戶加密資產留在熱錢包而非冷錢包。在完成冷轉之前，竊盜與營運損失曝險上升。",
    },
    participants: [
      { en: "Crypto custody / wallet team", zh: "加密託管／錢包團隊" },
      { en: "Crypto Exchange Risk", zh: "加密交易所風險" },
      { en: "System Admin (sweep ops)", zh: "系統管理員（掃倉作業）" },
    ],
    impacts: {
      en: "Custody loss risk, insurance stress, and regulatory scrutiny.",
      zh: "託管損失風險、保險壓力，以及監管關注。",
    },
    primary_indicators: ["M2-CRYPTO-WALLET"],
    related_indicators: ["M2-CRYPTO-DEP", "M2-STABLE-EXP", "M2-CRYPTO-INS"],
  },
  {
    code: "SCN-CRYPTO-LIQ",
    name: {
      en: "Liquidation engine backlog",
      zh: "強平引擎積壓",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 0,
    product: "Crypto",
    how_it_works: {
      en: "Forced orders queue faster than the matching engine can clear. Unliquidated positions keep losing money for the insurance fund and the house.",
      zh: "強制單排隊速度快於撮合引擎消化能力。未強平部位持續虧損，侵蝕保險基金與公司。",
    },
    participants: [
      { en: "Exchange matching / risk eng", zh: "交易所撮合／風險工程" },
      { en: "Crypto Risk Desk", zh: "加密風險台" },
    ],
    impacts: {
      en: "Insurance fund drawdown, socialised losses, and possible auto-deleveraging.",
      zh: "保險基金回撤、社會化損失，以及可能的自動減倉。",
    },
    primary_indicators: ["M2-CRYPTO-LIQ"],
    related_indicators: ["M2-CRYPTO-INS", "M2-CRYPTO-ORACLE", "M2-PERP-BASIS"],
  },
  {
    code: "SCN-ORACLE-BASIS",
    name: {
      en: "Mark oracle lag and perp basis blowout",
      zh: "標記預言機延遲與永續基差失控",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 1,
    product: "Crypto",
    how_it_works: {
      en: "Mark price lags index or perp basis widens. Liquidations and funding then fire on wrong levels, creating unfair client outcomes and house risk.",
      zh: "標記價落後指數或永續基差擴大。強平與資金費會在錯誤水位觸發，造成不公平客戶結果與公司風險。",
    },
    participants: [
      { en: "Exchange pricing / oracle owners", zh: "交易所定價／預言機負責人" },
      { en: "Crypto Risk", zh: "加密風險" },
    ],
    impacts: {
      en: "Wrong liquidations, funding disputes, and insurance fund hits.",
      zh: "錯誤強平、資金費爭議，以及保險基金受損。",
    },
    primary_indicators: ["M2-CRYPTO-ORACLE", "M2-PERP-BASIS"],
    related_indicators: ["M2-FUNDING-RATE", "M2-CRYPTO-LIQ"],
  },
  {
    code: "SCN-FUNDING-STABLE",
    name: {
      en: "Extreme funding and stablecoin depeg exposure",
      zh: "極端資金費與穩定幣脫鉤曝險",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 1,
    product: "Crypto",
    how_it_works: {
      en: "Perp funding goes extreme or stablecoin balances depeg. Clients scramble; the house inventory and deposit rails take the hit.",
      zh: "永續資金費走向極端或穩定幣餘額脫鉤。客戶搶進搶出；公司庫存與入金通道承受衝擊。",
    },
    participants: [
      { en: "Crypto Risk + Treasury", zh: "加密風險＋資金調度" },
      { en: "Ops deposits/withdrawals", zh: "營運出入金" },
    ],
    impacts: {
      en: "Inventory losses, deposit freezes, and client run risk.",
      zh: "庫存損失、入金凍結，以及客戶擠兌風險。",
    },
    primary_indicators: ["M2-FUNDING-RATE", "M2-STABLE-EXP"],
    related_indicators: ["M2-CRYPTO-DEP", "M2-CRYPTO-WALLET", "M2-WD-015"],
  },
  {
    code: "SCN-CRYPTO-OI-DEP",
    name: {
      en: "OI concentration and deposit spike",
      zh: "未平倉集中度與入金暴衝",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 2,
    product: "Crypto",
    how_it_works: {
      en: "One account dominates open interest on a contract, or deposits surge faster than AML/custody controls can review.",
      zh: "單一帳戶主導某合約未平倉，或入金速度快於 AML／託管控制可審核的節奏。",
    },
    participants: [
      { en: "Crypto Risk + Compliance", zh: "加密風險＋合規" },
      { en: "Custody Ops", zh: "託管營運" },
    ],
    impacts: {
      en: "Manipulation risk, custody overflow, and sudden liquidation cascades.",
      zh: "操縱風險、託管溢出，以及突然的強平連鎖。",
    },
    primary_indicators: ["M2-CRYPTO-OI", "M2-CRYPTO-DEP"],
    related_indicators: ["M2-CRYPTO-WALLET", "M2-WASH-020"],
  },
  {
    code: "SCN-CRYPTO-INSURANCE",
    name: {
      en: "Insurance fund daily drawdown",
      zh: "保險基金單日回撤",
    },
    domain_code: "CRYPTO_EXCHANGE",
    priority: 1,
    product: "Crypto",
    how_it_works: {
      en: "Insurance fund pays for bankrupt liquidations. A sharp daily drawdown means the engine or oracle path is losing money for the venue.",
      zh: "保險基金支付破產強平。單日急劇回撤代表引擎或預言機路徑正在為交易場所賠錢。",
    },
    participants: [
      { en: "Crypto Risk Owner", zh: "加密風險負責人" },
      { en: "Exchange engineering", zh: "交易所工程" },
    ],
    impacts: {
      en: "Socialised loss risk and confidence shock for market makers.",
      zh: "社會化損失風險，以及做市商信心衝擊。",
    },
    primary_indicators: ["M2-CRYPTO-INS"],
    related_indicators: ["M2-CRYPTO-LIQ", "M2-CRYPTO-ORACLE"],
  },

  // —— FRAUD_CONDUCT ——
  {
    code: "SCN-MULTI-ACCOUNT",
    name: {
      en: "Multi-account fraud cluster",
      zh: "多帳戶詐欺叢集",
    },
    domain_code: "FRAUD_CONDUCT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Graph/cluster scores link many accounts by device, funding, or behaviour. Often pairs with bonus abuse or wash patterns.",
      zh: "圖／叢集分數依裝置、資金或行為連結多個帳戶。常與獎金濫用或對敲模式並存。",
    },
    participants: [
      { en: "Fraud / Conduct desk", zh: "詐欺／操守台" },
      { en: "Ops KYC/AML", zh: "營運 KYC／AML" },
      { en: "AI detection", zh: "AI 偵測" },
    ],
    impacts: {
      en: "Bonus leakage, wash PnL, and regulatory conduct findings.",
      zh: "獎金流失、對敲損益，以及監管操守缺失。",
    },
    primary_indicators: ["M2-FRAUD-011"],
    related_indicators: ["M2-BONUS-013", "M2-WASH-020", "M2-PAY-017"],
  },
  {
    code: "SCN-PAYMENT-CHARGEBACK",
    name: {
      en: "Payment fraud and chargeback surge",
      zh: "支付詐欺與退單暴增",
    },
    domain_code: "FRAUD_CONDUCT",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "Payment fraud model score or 24h chargeback count rises. Often coordinated with withdrawals and IB rebate anomalies.",
      zh: "支付詐欺模型分數或 24 小時退單數上升。常與出金及 IB 返佣異常同步。",
    },
    participants: [
      { en: "Fraud + Payments Ops", zh: "詐欺＋支付營運" },
      { en: "Finance / Treasury", zh: "財務／資金調度" },
    ],
    impacts: {
      en: "Direct cash loss, card-scheme penalties, and banking partner risk.",
      zh: "直接現金損失、卡組織罰則，以及銀行合作夥伴風險。",
    },
    primary_indicators: ["M2-PAY-017", "M2-CHARGEBACK"],
    related_indicators: ["M2-WD-015", "M2-IB-PAYOUT", "M2-COMPLAINT"],
  },
  {
    code: "SCN-WASH-IB",
    name: {
      en: "Wash trading and IB rebate anomaly",
      zh: "對敲交易與 IB 返佣異常",
    },
    domain_code: "FRAUD_CONDUCT",
    priority: 2,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Wash/collusion scores and IB rebate anomaly scores flag synthetic volume used to farm rebates or manipulate marks.",
      zh: "對敲／串謀分數與 IB 返佣異常分數標記以套取返佣或操縱標記的虛假成交量。",
    },
    participants: [
      { en: "Fraud / IB Ops", zh: "詐欺／IB 營運" },
      { en: "Market integrity", zh: "市場誠信" },
    ],
    impacts: {
      en: "Rebate leakage, distorted volume metrics, and integrity findings.",
      zh: "返佣流失、扭曲的成交量指標，以及誠信缺失。",
    },
    primary_indicators: ["M2-WASH-020", "M2-IB-PAYOUT"],
    related_indicators: ["M2-FRAUD-011", "M2-BONUS-013"],
  },
  {
    code: "SCN-BONUS-BURN",
    name: {
      en: "Bonus converted to cash abuse",
      zh: "獎金兌現濫用",
    },
    domain_code: "FRAUD_CONDUCT",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "Promo credit is converted to withdrawable cash faster than policy allows, often via circular trading.",
      zh: "促銷額度以快於政策允許的速度轉成可出金現金，常見於循環交易。",
    },
    participants: [
      { en: "Fraud + Marketing Ops", zh: "詐欺＋行銷營運" },
      { en: "Risk Control", zh: "風險控管" },
    ],
    impacts: {
      en: "Marketing budget burn and credit risk if leverage sits on bonus equity.",
      zh: "行銷預算燒損；若槓桿建立在獎金權益上還有信貸風險。",
    },
    primary_indicators: ["M2-BONUS-013"],
    related_indicators: ["M2-FRAUD-011", "M2-LEV-019"],
  },

  // —— PRODUCT_CONFIG ——
  {
    code: "SCN-XAU247",
    name: {
      en: "XAUUSD247 net exposure overload",
      zh: "XAUUSD247 淨曝險過載",
    },
    domain_code: "PRODUCT_CONFIG",
    priority: 1,
    product: "CFD",
    how_it_works: {
      en: "247 metals product accumulates weekend gap risk. Net lots above warn/breach need hedge or limit action before the Sunday open.",
      zh: "247 貴金屬商品累積週末跳空風險。淨手數超過警告／違規時，需在週日開盤前對沖或限倉。",
    },
    participants: [
      { en: "Product Risk + Hedge Desk", zh: "產品風險＋對沖台" },
      { en: "Risk Owner", zh: "風險負責人" },
    ],
    impacts: {
      en: "Monday gap PnL and LP capacity stress on gold.",
      zh: "週一跳空損益，以及黃金 LP 容量壓力。",
    },
    primary_indicators: ["M2-XAU-247"],
    related_indicators: ["M2-GAP-012", "M2-HEDGE-007", "M2-LP-022"],
  },
  {
    code: "SCN-GAP-SPREAD-LEV",
    name: {
      en: "Gap exposure, spread anomaly, max leverage onboard",
      zh: "跳空曝險、點差異常、最高槓桿開戶",
    },
    domain_code: "PRODUCT_CONFIG",
    priority: 2,
    product: "CFD",
    how_it_works: {
      en: "Estimated gap dollars, spreads versus session median, and new accounts at max leverage show product conditions are too loose for the tape.",
      zh: "估計跳空金額、相對盤中中位點差，以及以最高槓桿開的新帳戶，顯示商品條件對當前行情過於寬鬆。",
    },
    participants: [
      { en: "Product Config owners", zh: "產品條件負責人" },
      { en: "Credit Desk", zh: "信貸台" },
    ],
    impacts: {
      en: "Weekend/news losses and a cohort of fragile new accounts.",
      zh: "週末／新聞損失，以及一批脆弱的新帳戶。",
    },
    primary_indicators: ["M2-GAP-012", "M2-SPREAD-005", "M2-LEV-019"],
    related_indicators: ["M2-SWAP-027", "M2-NEWS-GROSS"],
  },
  {
    code: "SCN-SWAP-MISCONFIG",
    name: {
      en: "Swap versus benchmark misconfiguration",
      zh: "隔夜利息相對基準設定錯誤",
    },
    domain_code: "PRODUCT_CONFIG",
    priority: 3,
    product: "CFD",
    how_it_works: {
      en: "Symbols with swap far from benchmark create arb or client disputes. Usually a config push error, not a market move.",
      zh: "隔夜利息遠離基準的商品會造成套利或客戶爭議。通常是設定推送錯誤，而非行情本身。",
    },
    participants: [
      { en: "Product Ops", zh: "產品營運" },
      { en: "Pricing Desk", zh: "定價台" },
    ],
    impacts: {
      en: "Client complaints, arb leakage, and messy rollback under dual control.",
      zh: "客戶投訴、套利流失，以及雙重控制下的混亂回滾。",
    },
    primary_indicators: ["M2-SWAP-027"],
    related_indicators: ["M2-SPREAD-005", "M2-COMPLAINT"],
  },

  // —— OPS_PROCESS ——
  {
    code: "SCN-FUNDING-WD",
    name: {
      en: "Funding exceptions and withdrawal velocity",
      zh: "資金異常與出金速度",
    },
    domain_code: "OPS_PROCESS",
    priority: 1,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Funding exceptions per hour or withdrawal USD per hour spike. Can be a run, a payments rail issue, or fraud cash-out.",
      zh: "每小時資金異常或每小時出金美元暴增。可能是擠兌、支付通道問題，或詐欺套現。",
    },
    participants: [
      { en: "Ops War Room", zh: "營運作戰室" },
      { en: "Fraud Desk", zh: "詐欺台" },
      { en: "Treasury", zh: "資金調度" },
    ],
    impacts: {
      en: "Liquidity strain, client money timing risk, and partner-bank pressure.",
      zh: "流動性吃緊、客戶資金時點風險，以及合作銀行壓力。",
    },
    primary_indicators: ["M2-FUND-010", "M2-WD-015"],
    related_indicators: ["M2-RECON-BRK", "M2-CHARGEBACK", "M2-SEG-025"],
  },
  {
    code: "SCN-RECON-BREAKS",
    name: {
      en: "Open reconciliation breaks",
      zh: "未結對帳差異",
    },
    domain_code: "OPS_PROCESS",
    priority: 2,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Ledger versus bank/wallet/LP statements disagree. Breaks that stay open hide true client money and PnL.",
      zh: "帳簿與銀行／錢包／LP 對帳單不一致。長期未結差異會掩蓋真實客戶資金與損益。",
    },
    participants: [
      { en: "Ops recon + Finance", zh: "營運對帳＋財務" },
      { en: "Risk Control (if capital)", zh: "風險控管（若涉及資本）" },
    ],
    impacts: {
      en: "Segregation gaps, delayed reporting, and audit findings.",
      zh: "隔離缺口、延遲申報，以及稽核缺失。",
    },
    primary_indicators: ["M2-RECON-BRK"],
    related_indicators: ["M2-SEG-025", "M2-CAP-024", "M2-FUND-010"],
  },

  // —— TECH_INFRA ——
  {
    code: "SCN-BRIDGE-API",
    name: {
      en: "Bridge latency and trading API errors",
      zh: "橋接延遲與交易 API 錯誤",
    },
    domain_code: "TECH_INFRA",
    priority: 1,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Bridge fill latency p95 or trading API error rate rises. Clients see rejects/slippage; hedges lag; false credit signals follow.",
      zh: "橋接成交延遲 p95 或交易 API 錯誤率上升。客戶看到拒單／滑點；對沖落後；接著出現虛假信貸訊號。",
    },
    participants: [
      { en: "Trading Infra on-call", zh: "交易基礎設施值班" },
      { en: "LP Desk", zh: "LP 台" },
      { en: "Risk Control", zh: "風險控管" },
    ],
    impacts: {
      en: "Execution quality collapse and cascading desk alarms.",
      zh: "成交品質崩壞，並引發櫃台警報連鎖。",
    },
    primary_indicators: ["M2-BRIDGE-LAT", "M2-API-023"],
    related_indicators: ["M2-LP-022", "M2-SLIP-021", "M2-MT-DISC", "M2-VENDOR-OUT"],
  },
  {
    code: "SCN-PLATFORM-KILL",
    name: {
      en: "Platform disconnects and active kill-switches",
      zh: "平台斷線與作用中熔斷",
    },
    domain_code: "TECH_INFRA",
    priority: 0,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Client platform disconnect rate or number of active symbol kill-switches rises. Trading may be unsafe or already halted on key names.",
      zh: "客戶平台斷線率或作用中商品熔斷數上升。交易可能不安全，或關鍵商品已暫停。",
    },
    participants: [
      { en: "System / Platform eng", zh: "系統／平台工程" },
      { en: "Risk Owner (halt policy)", zh: "風險負責人（熔斷政策）" },
      { en: "Client Ops / Comms", zh: "客戶營運／通訊" },
    ],
    impacts: {
      en: "Client outage, missed stops, and reputation damage.",
      zh: "客戶中斷、錯失止損，以及聲譽損害。",
    },
    primary_indicators: ["M2-MT-DISC", "M2-KILL-COUNT"],
    related_indicators: ["M2-API-023", "M2-COMPLAINT", "M2-FEED-003"],
  },

  // —— REG_CAPITAL ——
  {
    code: "SCN-CAPITAL-SEG",
    name: {
      en: "Entity capital buffer and client money segregation",
      zh: "實體資本緩衝與客戶資金隔離",
    },
    domain_code: "REG_CAPITAL",
    priority: 1,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Entity capital buffer ratio and segregation gap dollars track whether the firm can absorb loss and whether client money is correctly held.",
      zh: "實體資本緩衝比率與隔離缺口金額追蹤公司是否能吸收損失，以及客戶資金是否正確持有。",
    },
    participants: [
      { en: "Risk Control + Finance", zh: "風險控管＋財務" },
      { en: "Compliance / entity controllers", zh: "合規／實體控制人" },
    ],
    impacts: {
      en: "Regulatory breach, trading restrictions, and client-money findings.",
      zh: "監管違規、交易限制，以及客戶資金缺失。",
    },
    primary_indicators: ["M2-CAP-024", "M2-SEG-025"],
    related_indicators: ["M2-RECON-BRK", "M2-EQ-001"],
  },

  // —— MODEL_AI ——
  {
    code: "SCN-DETECTOR-DRIFT",
    name: {
      en: "Detector precision drift / false positives",
      zh: "偵測器精準度漂移／誤報",
    },
    domain_code: "MODEL_AI",
    priority: 2,
    product: "Platform",
    how_it_works: {
      en: "Rolling 7-day detector precision falls. Alarms become noisy or miss real events; humans stop trusting the AI layer.",
      zh: "七天滾動偵測精準度下降。警報變吵或漏掉真實事件；人員開始不信任 AI 層。",
    },
    participants: [
      { en: "AI Detection Lab", zh: "AI 偵測實驗室" },
      { en: "Risk Owner (shadow / disable)", zh: "風險負責人（陰影／停用）" },
      { en: "Second-line AI challenger", zh: "二線 AI 挑戰者" },
    ],
    impacts: {
      en: "Alert fatigue, missed breaches, and wrong automatic skills.",
      zh: "警報疲勞、漏掉違規，以及錯誤的自動技能。",
    },
    primary_indicators: ["M2-MODEL-006"],
    related_indicators: ["M2-CROSS-BOOK"],
  },

  // —— THIRD_PARTY ——
  {
    code: "SCN-VENDOR-DEGRADED",
    name: {
      en: "Critical vendor degraded or offline",
      zh: "關鍵供應商降級或離線",
    },
    domain_code: "THIRD_PARTY_VENDOR",
    priority: 3,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Count of critical vendors (LP, bridge, price feed, payment, cloud) in degraded state. Each vendor maps to downstream Monitor indicators.",
      zh: "處於降級狀態的關鍵供應商（LP、橋接、報價、支付、雲端）數量。每個供應商對應下游 Monitor 指標。",
    },
    participants: [
      { en: "System vendor owners", zh: "系統供應商負責人" },
      { en: "Risk Control (impact triage)", zh: "風險控管（影響分診）" },
      { en: "Ops (client messaging)", zh: "營運（客戶訊息）" },
    ],
    impacts: {
      en: "Partial outage, hedge failure, or payment freeze depending on which vendor fails.",
      zh: "視哪個供應商故障，可能造成局部中斷、對沖失敗或支付凍結。",
    },
    primary_indicators: ["M2-VENDOR-OUT"],
    related_indicators: ["M2-LP-022", "M2-BRIDGE-LAT", "M2-FEED-003", "M2-API-023", "M2-WD-015"],
  },

  // —— REPUTATION ——
  {
    code: "SCN-COMPLAINT-SPIKE",
    name: {
      en: "Client complaint velocity spike",
      zh: "客戶投訴速度暴衝",
    },
    domain_code: "REPUTATION_COMMS",
    priority: 3,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Complaint tickets per 24 hours jump after slippage, disconnects, or forced liquidations. This is the client-facing mirror of desk incidents.",
      zh: "滑點、斷線或強制平倉後，24 小時投訴單量急升。這是櫃台事故在客戶端的鏡像。",
    },
    participants: [
      { en: "Client Ops / Comms", zh: "客戶營運／通訊" },
      { en: "Risk Control (root cause)", zh: "風險控管（根因）" },
      { en: "Exec (if media / regulator)", zh: "高管（若涉媒體／監管）" },
    ],
    impacts: {
      en: "Trust damage, chargebacks, and regulator attention even when trading PnL is contained.",
      zh: "即使交易損益已受控，仍可能造成信任損害、退單與監管關注。",
    },
    primary_indicators: ["M2-COMPLAINT"],
    related_indicators: ["M2-CHARGEBACK", "M2-SLIP-021", "M2-MT-DISC", "M2-COPY-CHURN"],
  },

  // —— CS 24/7 / TR dealing ——
  {
    code: "SCN-CS-UNCLEAR-QUEUE",
    name: {
      en: "Overnight unclear C1 / form pile-up",
      zh: "夜間不清楚 C1／表單堆積",
    },
    domain_code: "CS_SERVICE",
    priority: 2,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Thin ‘help me ???’ chats land on C1. SKILL-CS-CLARIFY emails the client and holds AWAITING_CLIENT (cap 3). Queue depth is M2-CS-UNCLEAR — staffing, not a trading control.",
      zh: "過短的「help me ???」進 C1。SKILL-CS-CLARIFY 寄信並維持待客戶（上限 3）。佇列深度為 M2-CS-UNCLEAR — 人力指標，不是交易開關。",
    },
    participants: [
      { en: "CS 24/7 Agent", zh: "CS 24/7 專員" },
      { en: "CS Lead (after 3-mail cap)", zh: "CS 主管（3 封上限後）" },
    ],
    impacts: {
      en: "Invented answers, skipped KYC, or silent clients if AI guesses or auto-closes.",
      zh: "若 AI 臆測或自動結案，會捏造答案、跳過 KYC，或讓客戶石沉大海。",
    },
    primary_indicators: ["M2-CS-UNCLEAR"],
    related_indicators: ["M2-CS-ID", "M2-CS-FAQ", "M2-COMPLAINT"],
  },
  {
    code: "SCN-CS-ID-VERIFY",
    name: {
      en: "ID pack required before withdraw / reset",
      zh: "出金／重設前必須核身包",
    },
    domain_code: "CS_SERVICE",
    priority: 1,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Withdraw, password reset or UID change without passport + UID last four + selfie is an account-takeover path. SKILL-CS-ID-VERIFY holds ID_VERIFY until EMAIL_IN.",
      zh: "未取得護照＋UID 後四碼＋自拍就做出金、重設密碼或改 UID，是帳戶盜用路徑。SKILL-CS-ID-VERIFY 維持身分驗證直到 EMAIL_IN。",
    },
    participants: [
      { en: "CS Lead", zh: "CS 主管" },
      { en: "Risk Control (fraud cluster)", zh: "風險控管（詐欺叢集）" },
    ],
    impacts: {
      en: "Stolen-account withdrawals and skipped KYC if CS processes on a verbal ‘it’s me’.",
      zh: "若 CS 憑口頭「是我」就辦理，會變成盜用出金與跳過 KYC。",
    },
    primary_indicators: ["M2-CS-ID"],
    related_indicators: ["M2-FRAUD-011", "M2-WD-015", "M2-CS-ESC"],
  },
  {
    code: "SCN-TR-SLIPPAGE-QUEUE",
    name: {
      en: "Execution complaints flood TR after a vol spike",
      zh: "波動後成交投訴湧入 TR",
    },
    domain_code: "TRADING_EXEC",
    priority: 1,
    product: "CFD + Crypto",
    how_it_works: {
      en: "Fill/slippage/MT4/MT5 words stamp SKILL-TR-EXECUTION and ASSIGNED_TR. CS must not quote goodwill pips. Correlate M2-SLIP-021 / M2-LP-022; book-wide storms escalate via SKILL-CS-ESCALATE-RISK.",
      zh: "成交／滑點／MT4／MT5 字詞蓋 SKILL-TR-EXECUTION 與已派 TR。CS 不可報善意點數。對照 M2-SLIP-021／M2-LP-022；全市場風暴經 SKILL-CS-ESCALATE-RISK 升級。",
    },
    participants: [
      { en: "TR Dealer / TR Lead", zh: "TR 交易員／TR 主管" },
      { en: "CS 24/7 (handoff only)", zh: "CS 24/7（只交接）" },
      { en: "Risk Control if book-wide", zh: "全市場時風險控管" },
    ],
    impacts: {
      en: "Wrong pip adjustments, missed LP reject storms, and CS inventing fills.",
      zh: "錯誤點數補償、漏掉 LP 拒單風暴、CS 臆測成交。",
    },
    primary_indicators: ["M2-TR-EXEC", "M2-SLIP-021"],
    related_indicators: ["M2-LP-022", "M2-FEED-003", "M2-CS-ESC"],
  },
];

export function scenariosForDomain(domainCode: string): DomainScenario[] {
  return DOMAIN_SCENARIOS.filter((s) => s.domain_code === domainCode).sort(
    (a, b) => a.priority - b.priority || a.code.localeCompare(b.code)
  );
}

export function allPrimaryIndicatorIds(): string[] {
  const set = new Set<string>();
  for (const s of DOMAIN_SCENARIOS) {
    for (const id of s.primary_indicators) set.add(id);
    for (const id of s.related_indicators) set.add(id);
  }
  return [...set].sort();
}

/** Priority badge styles for P0–P3. */
export function priorityTone(priority: number): {
  label: string;
  className: string;
} {
  switch (priority) {
    case 0:
      return {
        label: "P0",
        className: "bg-rose-600 text-white border-rose-700",
      };
    case 1:
      return {
        label: "P1",
        className: "bg-orange-500 text-white border-orange-600",
      };
    case 2:
      return {
        label: "P2",
        className: "bg-amber-400 text-amber-950 border-amber-500",
      };
    default:
      return {
        label: `P${priority}`,
        className: "bg-slate-500 text-white border-slate-600",
      };
  }
}
