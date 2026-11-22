export type GuideSection = {
  id: string;
  titleEn: string;
  titleZh: string;
  bodyEn: string[];
  bodyZh: string[];
  bulletsEn?: string[];
  bulletsZh?: string[];
};

export type MetricRow = {
  metricEn: string;
  metricZh: string;
  whatEn: string;
  whatZh: string;
  howEn: string;
  howZh: string;
  targetEn: string;
  targetZh: string;
};

export type PhaseRow = {
  phaseEn: string;
  phaseZh: string;
  goalEn: string;
  goalZh: string;
  actionsEn: string[];
  actionsZh: string[];
};

export type TestModeRow = {
  modeEn: string;
  modeZh: string;
  providerEn: string;
  providerZh: string;
  testsEn: string;
  testsZh: string;
};

export const GUIDE_INTRO = {
  updatedAt: "2026-11-22",
  titleEn: "How CFD brokers test LP quality",
  titleZh: "CFD 经纪商如何测试 LP 质量",
  leadEn:
    "Advertised top-of-book spreads are not LP quality. Quality is what your clients receive when size, session, volatility and last-look behaviour collide. Vantage’s final methodology combines LP Demo/UAT environments with broker-owned backtests, live quote shadowing and small live fills — each solves a different problem; use both, preferably together.",
  leadZh:
    "宣传上的最优买卖价差并不等于 LP 质量。质量体现在订单规模、交易时段、波动与 last look 行为叠加时，客户实际拿到的成交结果。Vantage 最终方法论将 LP Demo/UAT 环境与经纪商自建历史回测、实时行情影子测试、小额实盘验证结合使用——二者解决不同问题，应并用，最好串联。",
};

/** Canonical quote-quality methodology: LP env + broker tests, combined. */
export const FINAL_METHODOLOGY = {
  id: "methodology",
  titleEn: "Final methodology — combine LP environments with broker tests",
  titleZh: "最终方法论 — LP 测试环境与经纪商自测并用",
  principleEn: [
    "LP Demo/UAT and broker-owned backtesting answer different questions. Institutional LPs often offer Demo/UAT, but not every LP does, and UAT liquidity, latency and fill quality are not guaranteed to match production.",
    "Prefer the combined pipeline for new symbols or new LPs. For an LP already live at Vantage where only a new product is added, reuse the existing connection: production market-data shadow first, then small live execution — full FIX/API re-certification is usually unnecessary.",
  ],
  principleZh: [
    "LP Demo/UAT 与经纪商自建回测解决的是不同问题。机构级 LP 通常可提供 Demo/UAT，但不保证每家都有，也不保证测试环境与生产在流动性、延迟和成交质量上一致。",
    "新品种或新 LP 优先走完整串联流水线。对 Vantage 而言，若 LP 已接入、只是新增商品：优先复用现有连接，取得新商品生产行情做影子测试，再做小额执行验证——通常不必每次重新做完整 LP 接口认证。",
  ],
  pipelineEn:
    "LP UAT → historical backtest → live quote shadow → small live validation → go-live",
  pipelineZh:
    "LP UAT → 历史数据回测 → 真实行情影子测试 → 小额实盘验证 → 上线",
  pipelineShortEn:
    "Already-connected LP + new product: production MD shadow → small live fills → go-live (skip full UAT re-cert unless connectivity changed)",
  pipelineShortZh:
    "已接入 LP + 新商品：生产行情影子 → 小额实盘 → 上线（连接未变则跳过完整 UAT 复认证）",
  caveatsEn: [
    "Historical backtest: good for quote quality and anomaly rules; cannot reliably replay true network latency, last look or rejects.",
    "LP UAT: mainly validates interface and trade workflow; not a proxy for production liquidity.",
    "Live shadow: best for comparing real quote stability, gaps and latency across LPs.",
    "Small live: final proof of fill rate, slippage, last look and hedge cost.",
  ],
  caveatsZh: [
    "历史回测：可测报价质量与异常检测规则，但无法可靠还原真实网络延迟、Last Look 和成交拒绝。",
    "LP UAT：主要验证接口与交易流程，不代表真实生产流动性。",
    "实时影子测试：最适合比较不同 LP 的实际报价稳定性、断流与延迟。",
    "小额实盘：最终验证真实成交率、滑点、Last Look 与对冲成本。",
  ],
};

export const TEST_MODES: TestModeRow[] = [
  {
    modeEn: "LP Demo / UAT",
    modeZh: "LP Demo / UAT",
    providerEn: "LP (not always available)",
    providerZh: "LP 提供（不一定都有）",
    testsEn: "FIX/API connect, MD subscribe, simulated orders, rejects, fault handling",
    testsZh: "FIX/API 连接、行情订阅、模拟下单、拒单、故障处理",
  },
  {
    modeEn: "Historical backtest",
    modeZh: "历史数据回测",
    providerEn: "Broker-owned",
    providerZh: "经纪商自己做",
    testsEn: "Spread, price deviation, jump anomalies, volatility, quote stability",
    testsZh: "价差、价格偏离、异常跳价、波动率、报价稳定性",
  },
  {
    modeEn: "Live quote shadow",
    modeZh: "实时行情影子测试",
    providerEn: "Broker on live LP MD",
    providerZh: "经纪商接入真实 LP 行情",
    testsEn: "Live latency, gaps/dropouts, quote quality, cross-LP comparison",
    testsZh: "实时延迟、断流、报价质量、不同 LP 表现对比",
  },
  {
    modeEn: "Small live fills",
    modeZh: "小额真实成交测试",
    providerEn: "Broker + LP jointly",
    providerZh: "经纪商与 LP 协作",
    testsEn: "Fill rate, slippage, last look, hedge cost",
    testsZh: "实际 Fill Rate、Slippage、Last Look、对冲成本",
  },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "principle",
    titleEn: "1. Start from your flow model, not a spread sheet",
    titleZh: "1. 从自身流量模型出发，而非价差表",
    bodyEn: [
      "Define what must be A-booked externally versus internalised. Map average ticket size, peak ticket size, session mix (Asia / London / NY), product set (FX, metals, indices, oil, crypto CFDs), and geography of clients. Instrument-specific liquidity beats “one LP for everything”.",
      "Decide whether you need a Prime of Prime, direct institutional venues, crypto exchange hedges, or a multi-LP aggregation hub. Credit, capital and tech capacity constrain that choice before any demo.",
    ],
    bodyZh: [
      "先界定哪些必须外部 A-book、哪些可内部化。梳理平均/峰值订单规模、时段结构（亚太/伦敦/纽约）、产品集（外汇、贵金属、指数、原油、加密 CFD）与客户地域。按品种选流动性，优于“一家 LP 打天下”。",
      "再决定需要主经纪商（PoP）、直连机构场所、加密交易所对冲，还是多 LP 聚合中枢。授信、资本与技术能力在演示前就构成约束。",
    ],
  },
  {
    id: "executable",
    titleEn: "2. Measure executable liquidity, not marketing quotes",
    titleZh: "2. 度量可成交流动性，而非营销报价",
    bodyEn: [
      "Request depth-by-level, fill ratios, reject rates, partial-fill behaviour, average and tail latency, and slippage distributions — including during economic releases. Evaluate both positive and negative slippage; persistent one-sided negative outcomes often signal latency, asymmetric last look, or bad routing.",
      "Test at the notional sizes your clients actually trade. A feed can look tight at micro size and gap when the ticket grows.",
    ],
    bodyZh: [
      "要求按档深度、成交率、拒单率、部分成交行为、平均与尾部延迟、滑点分布——并覆盖重要经济数据时段。正负滑点都要看；持续单边负滑点常指向延迟、不对称 last look 或路由问题。",
      "按客户真实成交名义规模测试。微单看起来很紧，大单可能立刻跳空。",
    ],
  },
  {
    id: "lastlook",
    titleEn: "3. Interrogate last look and fill policy",
    titleZh: "3. 核查 last look 与成交政策",
    bodyEn: [
      "Last look is not automatically unacceptable — it must be transparent. Ask whether it applies, on which instruments, for how long, and whether reject rates spike in fast markets.",
      "A slightly wider but reliably executable price can beat a teaser quote that rejects when clients need a fill. Capture reject reason codes from your own test flow, not only from the sales deck.",
    ],
    bodyZh: [
      "Last look 并非天然不可接受——但必须透明。问清是否启用、适用哪些品种、持有多久、快市拒单率是否飙升。",
      "略宽但稳定可成交的价格，往往优于客户急需成交时频繁拒单的“诱饵盘”。用自有测试流统计拒单原因码，而非只看销售材料。",
    ],
  },
  {
    id: "counterparty",
    titleEn: "4. Counterparty, credit and safeguarding diligence",
    titleZh: "4. 对手方、授信与资金安全尽调",
    bodyEn: [
      "Confirm the exact legal entity, regulator register entry, ownership, capitalisation and where the trading relationship is booked. Brand ≠ contracting entity.",
      "Model prefunding vs credit lines, margin-call timing, close-out rights, segregation of collateral, and default waterfalls. Weak credit terms can erase cheap spreads.",
    ],
    bodyZh: [
      "确认精确法律实体、监管登记、股权结构、资本实力及交易关系落在哪一实体。品牌 ≠ 签约主体。",
      "建模预存资金 vs 授信、追保时点、平仓权利、保证金隔离与违约清偿顺序。授信条款薄弱会抵消便宜价差。",
    ],
  },
  {
    id: "tech",
    titleEn: "5. Technology, connectivity and observability",
    titleZh: "5. 技术、连通性与可观测性",
    bodyEn: [
      "Measure quote-to-ack and order-to-fill latency from your real path (platform → bridge → LP → ER), including p95/p99 under load. Prefer clocks synchronised to the same time source.",
      "Test FIX conformance, sequence recovery, disconnect/reconnect, drop-copy, symbol mapping (digits, contract size), feed gaps, price freezes and failover. Dealing desks need real-time visibility into quotes, routes, rejects, markups and exposure.",
    ],
    bodyZh: [
      "在真实路径上测量报价到确认、订单到成交延迟（平台→桥→LP→成交回报），含负载下的 p95/p99。时钟尽量同源同步。",
      "测试 FIX 一致性、序号恢复、断线重连、drop copy、品种映射（小数位、合约规模）、行情空洞、价格冻结与故障切换。交易台需实时可见报价、路由、拒单、加点与敞口。",
    ],
  },
  {
    id: "stress",
    titleEn: "6. Stress across the sessions that hurt",
    titleZh: "6. 在“会疼”的时段做压力测试",
    bodyEn: [
      "Normal mid-day London books are not enough. Include NFP / central-bank decisions, cash-equity opens, rollover windows, thin Asia hours, crypto weekend gaps (for crypto hedges), and geopolitical spikes.",
      "Compare effective cost (spread + slippage + fees + financing) under each regime. The cheapest quiet-market LP often becomes the most expensive under stress.",
    ],
    bodyZh: [
      "仅测伦敦午间不够。应覆盖非农/央行决议、现货开盘、展期窗口、亚太清淡时段、加密周末跳空（若做加密对冲）与地缘冲击。",
      "在各市况下比较有效成本（价差+滑点+费用+融资）。平静市最便宜的 LP，压力下常变最贵。",
    ],
  },
  {
    id: "multi",
    titleEn: "7. Single LP vs multi-LP aggregation",
    titleZh: "7. 单 LP 与多 LP 聚合",
    bodyEn: [
      "Multi-LP setups need extra tests: SOR policies (best price, fastest fill, depth aggregation), partial-fill residual routing, cross-LP arbitrage artefacts, and automatic failover when one venue dies.",
      "Avoid single-source concentration without inventing needless complexity — primary + qualified secondary + clear switch rules is a practical pattern. Review by provider, asset class, symbol and client segment.",
    ],
    bodyZh: [
      "多 LP 需额外测试：智能路由策略（最优价、最快成交、深度聚合）、部分成交残量路由、跨 LP 套利伪影、单场所宕机时的自动切换。",
      "避免单源集中，也不要无谓复杂化——主源 + 合格备源 + 明确切换规则是务实模式。按提供商、资产类别、品种与客户分层复盘。",
    ],
  },
  {
    id: "ongoing",
    titleEn: "8. Continuous best-execution monitoring (post go-live)",
    titleZh: "8. 上线后的持续最佳执行监控",
    bodyEn: [
      "Industry execution-quality programmes (e.g. MiFID-style monitoring disclosed by CFD brokers) typically track real-time price updates, instrument-level spreads, speed, depth, price freezes, price jumps and slippage symmetry.",
      "Feed prices through near-real-time checks before clients see them; weekly-benchmark LP averages vs external sources; investigate asymmetric slippage by order type. Set SLAs for uptime, quote availability, fill ratio, latency, reject rate and escalation response — review monthly and after material market events.",
    ],
    bodyZh: [
      "行业执行质量方案（如 CFD 经纪商披露的类 MiFID 监控）通常跟踪实时价格更新、单品种价差、速度、深度、价格冻结、跳价与滑点对称性。",
      "客户可见前对 LP 报价做近实时校验；每周将 LP 均价与外部源对标；按订单类型排查不对称滑点。为可用性、报价可得性、成交率、延迟、拒单率与升级响应设 SLA——每月及重大市况后复盘。",
    ],
  },
];

export const METRICS: MetricRow[] = [
  {
    metricEn: "Effective spread / cost",
    metricZh: "有效价差 / 成本",
    whatEn: "All-in cost vs mid or vs external benchmark",
    whatZh: "相对中间价或外部基准的综合成本",
    howEn: "TCA on fills incl. commission, markup, financing",
    howZh: "对成交做 TCA，含佣金、加点、融资",
    targetEn: "Competitive vs peer set by symbol/session",
    targetZh: "按品种/时段相对同业有竞争力",
  },
  {
    metricEn: "Depth at ticket size",
    metricZh: "目标单量处深度",
    whatEn: "Volume available across levels at your sizes",
    whatZh: "在你常用规模下各档可成交量",
    howEn: "Snapshot + sweep tests at 1× / 5× / 20× avg ticket",
    howZh: "按平均单量 1×/5×/20× 做快照与扫单测试",
    targetEn: "Stable average fill price as size rises",
    targetZh: "规模上升时成交均价仍稳定",
  },
  {
    metricEn: "Fill ratio",
    metricZh: "成交率",
    whatEn: "% of orders fully filled",
    whatZh: "完全成交订单占比",
    howEn: "Stratify by symbol, size, session, volatility bucket",
    howZh: "按品种、规模、时段、波动分桶统计",
    targetEn: "High on liquid books; investigate drops in stress",
    targetZh: "流动品种保持高位；压力下下降需排查",
  },
  {
    metricEn: "Reject rate + reasons",
    metricZh: "拒单率 + 原因",
    whatEn: "Price / size / last-look / tech rejects",
    whatZh: "价格/规模/last look/技术拒单",
    howEn: "Classify FIX reject codes from live PoC",
    howZh: "用 PoC 实盘 FIX 拒单码分类",
    targetEn: "Transparent; no volatility spike surprises",
    targetZh: "透明；波动期无异常飙升",
  },
  {
    metricEn: "Slippage symmetry",
    metricZh: "滑点对称性",
    whatEn: "Balance of positive vs negative slippage",
    whatZh: "正负滑点是否平衡",
    howEn: "By order type (market, stop, limit) and LP",
    howZh: "按订单类型（市价/止损/限价）与 LP 统计",
    targetEn: "Near-symmetric; investigate bias",
    targetZh: "接近对称；有偏需调查",
  },
  {
    metricEn: "Latency (avg / p95 / p99)",
    metricZh: "延迟（均值 / p95 / p99）",
    whatEn: "Quote path + order round-trip from your colo",
    whatZh: "自你机房的报价路径与订单往返",
    howEn: "Synced clocks; load + peak message tests",
    howZh: "时钟同步；含负载与峰值报文测试",
    targetEn: "Stable under load; match flow sensitivity",
    targetZh: "负载下稳定；匹配流量敏感度",
  },
  {
    metricEn: "Quote integrity",
    metricZh: "报价完整性",
    whatEn: "Gaps, freezes, crossed markets, stale ticks",
    whatZh: "空洞、冻结、交叉盘、陈旧 tick",
    howEn: "Feed monitors vs external MD vendors",
    howZh: "行情监控并对外部行情商",
    targetEn: "Fast kill of broken prices; short freeze duration",
    targetZh: "坏价快速剔除；冻结时长短",
  },
  {
    metricEn: "Uptime / failover",
    metricZh: "可用性 / 故障切换",
    whatEn: "Session loss, sequence gaps, LP outage",
    whatZh: "会话丢失、序号缺口、LP 宕机",
    howEn: "Chaos tests: disconnect, kill primary, reconcile",
    howZh: "混沌测试：断线、砍主源、对账",
    targetEn: "Auto re-route; no silent risk drift",
    targetZh: "自动改道；无静默风险漂移",
  },
];

export const PHASES: PhaseRow[] = [
  {
    phaseEn: "0. Desk due diligence",
    phaseZh: "0. 桌面尽调",
    goalEn: "Kill non-viable counterparties before any lab time",
    goalZh: "在进实验室前淘汰不可行对手方",
    actionsEn: [
      "Legal entity + licence register check",
      "Instrument schedule (machine-readable)",
      "Last-look / order-handling policy in writing",
      "Credit, collateral, close-out terms",
      "Confirm whether Demo/UAT exists and how it differs from production",
    ],
    actionsZh: [
      "法律实体 + 牌照登记核查",
      "机读品种表",
      "书面 last look / 订单处理政策",
      "授信、保证金、平仓条款",
      "确认是否有 Demo/UAT 及其与生产差异",
    ],
  },
  {
    phaseEn: "1. LP Demo / UAT",
    phaseZh: "1. LP Demo / UAT",
    goalEn: "Validate interface and trade workflow (not production liquidity)",
    goalZh: "验证接口与交易流程（不代表生产流动性）",
    actionsEn: [
      "FIX/API connect + sequence recovery from your path",
      "Market-data subscribe / symbol map / digits / contract size",
      "Simulated orders, rejects, partial fills, disconnect/reconnect",
      "Fault handling and drop-copy if offered",
      "Skip or shorten if LP already certified and only a new symbol is added",
    ],
    actionsZh: [
      "自真实路径做 FIX/API 连接与序号恢复",
      "行情订阅 / 品种映射 / 小数位 / 合约规模",
      "模拟下单、拒单、部分成交、断线重连",
      "故障处理与 drop copy（如有）",
      "LP 已认证且仅新增品种时可跳过或缩短",
    ],
  },
  {
    phaseEn: "2. Historical broker backtest",
    phaseZh: "2. 经纪商历史数据回测",
    goalEn: "Score quote quality and anomaly rules offline",
    goalZh: "离线评估报价质量与异常规则",
    actionsEn: [
      "Replay / sample LP ticks for spread, deviation vs mid/benchmark",
      "Jump / freeze / stale-tick anomaly detectors",
      "Volatility regimes and quiet vs event windows",
      "Quote stability scores by session (Asia / London / NY)",
      "Do not treat results as proof of latency, last look or reject behaviour",
    ],
    actionsZh: [
      "回放/采样 LP tick：价差、相对中间价/基准偏离",
      "跳价 / 冻结 / 陈旧 tick 异常检测",
      "波动市况与平静 vs 事件窗口",
      "按时段（亚太/伦敦/纽约）的报价稳定性评分",
      "结果不得当作延迟、Last Look 或拒单的证明",
    ],
  },
  {
    phaseEn: "3. Live quote shadow",
    phaseZh: "3. 真实行情影子测试",
    goalEn: "Compare live quote stability, gaps and latency across LPs",
    goalZh: "比较各 LP 实时报价稳定性、断流与延迟",
    actionsEn: [
      "Subscribe production (or production-like) MD on the new symbol",
      "Measure live latency, gap/dropout rate, freeze duration",
      "Side-by-side LP quote quality for the same product",
      "For already-connected Vantage LPs: reuse the live session — prefer this before new UAT",
      "Gate client visibility until shadow pass criteria are met",
    ],
    actionsZh: [
      "为新品种订阅生产（或准生产）行情",
      "度量实时延迟、断流率、冻结时长",
      "同品种多 LP 并排对比报价质量",
      "对已接入的 Vantage LP：复用现有实盘会话——优先于重新 UAT",
      "影子测试达标前不对客户开放可见报价",
    ],
  },
  {
    phaseEn: "4. Small live fills + go-live",
    phaseZh: "4. 小额实盘 + 上线",
    goalEn: "Prove fill, slippage, last look and hedge cost before scale",
    goalZh: "放量前证明成交、滑点、Last Look 与对冲成本",
    actionsEn: [
      "Controlled small tickets across sessions / sizes with LP cooperation",
      "Capture fill rate, slippage symmetry, last-look rejects, hedge PnL",
      "News / open / thin-session stress windows on the new symbol",
      "Reconcile platform ↔ bridge ↔ LP; enable pre-client quote gates",
      "Monthly best-execution review; re-weight routing after events",
    ],
    actionsZh: [
      "与 LP 协作，跨时段/规模做受控小额成交",
      "记录成交率、滑点对称、last look 拒单、对冲盈亏",
      "新品种覆盖新闻/开盘/清淡时段压力窗口",
      "平台 ↔ 桥 ↔ LP 对账；启用客户可见前报价闸门",
      "月度最佳执行复盘；重大事件后重配路由",
    ],
  },
];

export const SCORECARD_HINTS = {
  titleEn: "Practical scorecard (weight to your book)",
  titleZh: "实务评分卡（按你的账本加权）",
  itemsEn: [
    "Executable cost at client ticket sizes (25–35%)",
    "Stress / news behaviour (15–25%)",
    "Fill & reject quality incl. last look (15–20%)",
    "Latency & tech resilience (10–15%)",
    "Credit / legal / safeguarding (10–15%)",
    "Coverage fit (symbols, sessions, crypto 24/7) (10%)",
    "Commercial total cost of ownership (5–10%)",
  ],
  itemsZh: [
    "客户真实单量下的可成交成本（25–35%）",
    "压力 / 新闻表现（15–25%）",
    "成交与拒单质量（含 last look）（15–20%）",
    "延迟与技术韧性（10–15%）",
    "授信 / 法律 / 资金安全（10–15%）",
    "覆盖契合度（品种、时段、加密 24/7）（10%）",
    "商业综合持有成本（5–10%）",
  ],
};

export const GUIDE_SOURCES: { title: string; url: string }[] = [
  {
    title: "Ripple Liquidity Hub docs — sandbox / UAT vs production behaviour",
    url: "https://docs.liquidity.ripple.com/",
  },
  {
    title: "Equidity — How to Select Liquidity Providers for CFDs",
    url: "https://equidity.com/blog/how-to-select-liquidity-providers",
  },
  {
    title: "Luramic — How to Choose a Liquidity Provider for Your Brokerage",
    url: "https://www.luramic.com/articles/2026/how-to-choose-liquidity-provider",
  },
  {
    title: "AMTS — Pre-Deployment Testing for Single vs Multiple LPs",
    url: "https://amts.solutions/en/articles/essential-pre-deployment-testing-for-single-vs-multiple-liquidity-providers/",
  },
  {
    title: "Brokerage Atlas — LP procurement evaluation toolkit (demo + integration tests)",
    url: "https://brokerageatlas.com/dispatches/lp-procurement-evaluation-toolkit-phase-4-2026/",
  },
  {
    title: "FxTrusts — How to evaluate a liquidity provider (RFP / PoC checklist)",
    url: "https://fxtrusts.com/solutions/liquidity",
  },
  {
    title: "Industry CFD execution-quality monitoring practices (price, speed, depth, freeze, slippage symmetry)",
    url: "https://cloud.xm-cdn.com/static/pdf/System-PDFs/XM-Summary-Statement-2022.pdf",
  },
];
