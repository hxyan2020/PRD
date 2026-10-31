/**
 * Finance / trading / forex-broker terminology for MatchingManagement.
 * Keys are the Chinese UI strings used in the admin replica.
 */

export type FinanceTerm = {
  zh: string
  /** Short English label (broker / exchange ops wording) */
  en: string
  explainZh: string
  explainEn: string
}

/** Curated bilingual glossary — prefer industry terms over literal translation. */
export const FINANCE_TERMS: Record<string, FinanceTerm> = {
  合约名称: {
    zh: '合约名称',
    en: 'Contract / Symbol',
    explainZh: '永续合约交易对标识，如 XAU_USD（黄金）/ BTC_USD（比特币）。建议分品种单独配置。',
    explainEn:
      'Perpetual contract symbol (e.g. XAU_USD gold, BTC_USD bitcoin). Configure pairs separately — volatility profiles differ.',
  },
  合约: {
    zh: '合约',
    en: 'Contract',
    explainZh: '交易标的；XAUUSD 为黄金永续，BTCUSD 为比特币永续。',
    explainEn: 'Underlying instrument. XAUUSD = gold perpetual; BTCUSD = bitcoin perpetual.',
  },
  合约展示名称: {
    zh: '合约展示名称',
    en: 'Display Name',
    explainZh: '面向操作人员显示的合约名称，可与内部合约代码不同。',
    explainEn: 'Operator-facing display name; may differ from the internal symbol code.',
  },
  持仓方向: {
    zh: '持仓方向',
    en: 'Position Side',
    explainZh: '多头（Long）或空头（Short）。永续合约支持双向持仓，类似外汇可买涨/买跌。',
    explainEn:
      'Long or Short. Perpetual futures are two-way, similar to FX buy/sell (bullish/bearish) exposure.',
  },
  持仓均价: {
    zh: '持仓均价',
    en: 'Avg Entry Price',
    explainZh: '当前持仓的加权平均开仓价（Average Entry），用于计算未实现盈亏。',
    explainEn:
      'Volume-weighted average entry price; basis for unrealized PnL (uPnL) vs mark price.',
  },
  '持仓仓位价值 (USD)': {
    zh: '持仓仓位价值 (USD)',
    en: 'Position Notional (USD)',
    explainZh: '仓位美元名义价值（Notional）= 数量 × 合约乘数 × 标记价等口径。',
    explainEn:
      'USD notional of the position (size × contract multiplier × mark, per venue convention).',
  },
  '持仓合约价值 (USD)': {
    zh: '持仓合约价值 (USD)',
    en: 'Position Notional (USD)',
    explainZh: '仓位美元名义价值（同持仓仓位价值 / Notional）。',
    explainEn: 'USD notional of the position (same as position value).',
  },
  '占用保证金 (USD)': {
    zh: '占用保证金 (USD)',
    en: 'Margin Used (USD)',
    explainZh:
      '该仓位占用的保证金（Initial/Maintenance Margin）。杠杆越高，相对名义价值占用越低。',
    explainEn:
      'USD margin allocated to this position. Higher leverage uses less margin relative to notional.',
  },
  占用保证金: {
    zh: '占用保证金',
    en: 'Margin Used',
    explainZh: '持仓与挂单锁定的保证金；不等于全部账户权益。',
    explainEn: 'Margin locked by positions and working orders — not the same as full equity.',
  },
  '未实现盈亏 (USD)': {
    zh: '未实现盈亏 (USD)',
    en: 'Unrealized PnL (USD)',
    explainZh: '按标记价（Mark Price）计算的浮动盈亏；平仓前不结算进钱包余额。',
    explainEn:
      'Mark-to-market floating PnL in USD; not settled into wallet balance until the position is closed.',
  },
  总未实现盈亏: {
    zh: '总未实现盈亏',
    en: 'Total Unrealized PnL',
    explainZh: '账户全部未平仓头寸的浮动盈亏合计，影响账户权益（Equity）。',
    explainEn: 'Sum of mark-to-market floating PnL on open positions; feeds account equity.',
  },
  总占用保证金: {
    zh: '总占用保证金',
    en: 'Total Margin Used',
    explainZh: '账户全部仓位与挂单冻结的保证金合计。',
    explainEn: 'Sum of margin locked by open positions and working orders.',
  },
  持仓总额: {
    zh: '持仓总额',
    en: 'Total Position Notional',
    explainZh: '账户所有未平仓合约的名义价值合计（Gross Notional）。',
    explainEn: 'Aggregate notional value of all open positions (gross notional).',
  },
  持仓名义价值: {
    zh: '持仓名义价值',
    en: 'Position Notional',
    explainZh: '按标记价格计算的持仓名义金额。',
    explainEn: 'Position notional marked to the mark price.',
  },
  账户ID: {
    zh: '账户ID',
    en: 'Account ID',
    explainZh: '接仓/交易账户唯一标识，用于定位仓位、流水与风险。',
    explainEn: 'Unique trading / takeover account id for positions, ledger and risk lookup.',
  },
  钱包余额: {
    zh: '钱包余额',
    en: 'Wallet Balance',
    explainZh:
      '已结算可用余额（不含未实现盈亏）。外汇/期货口径类似 Free Margin 中的现金部分。',
    explainEn:
      'Settled available cash (excludes unrealized PnL). Analogous to cash inside free margin.',
  },
  最大可转金额: {
    zh: '最大可转金额',
    en: 'Max Transferable',
    explainZh: '在不侵蚀最低安全保证金的前提下，当前可回笼或出金的最大金额。',
    explainEn:
      'Largest amount that can be recalled or withdrawn without breaching minimum safe margin.',
  },
  可转金额: {
    zh: '可转金额',
    en: 'Transferable Amount',
    explainZh: '可从账户转出的资金，不应侵蚀接仓安全缓冲。',
    explainEn: 'Funds that can leave the account without eroding the takeover safety buffer.',
  },
  自动注资水位线: {
    zh: '自动注资水位线',
    en: 'Auto Top-up Waterline',
    explainZh: 'DB 接仓账户余额低于该水位时，系统自动注资（Auto Top-up / Capital Injection）。',
    explainEn:
      'When the DB takeover (house) wallet falls below this waterline, the system auto top-ups capital.',
  },
  注资目标水位线: {
    zh: '注资目标水位线',
    en: 'Top-up Target Waterline',
    explainZh: '触发自动注资后，目标恢复到的钱包余额水位。',
    explainEn: 'Target wallet balance the auto top-up aims to restore after injection.',
  },
  账户权益: {
    zh: '账户权益',
    en: 'Account Equity',
    explainZh: '权益 Equity ≈ 钱包余额 + 未实现盈亏。强平与风控的核心指标（类比外汇 Equity）。',
    explainEn:
      'Equity ≈ wallet balance + unrealized PnL. Core input for liquidation (same idea as FX equity).',
  },
  账户MMR: {
    zh: '账户MMR',
    en: 'Account MMR',
    explainZh: '维持保证金率（Maintenance Margin Rate）；升高表示强平风险上升。无持仓时可能显示极大值。',
    explainEn:
      'Maintenance margin rate. Rising MMR means higher liquidation risk; may show a huge % with no positions.',
  },
  流水类型: {
    zh: '流水类型',
    en: 'Ledger Type',
    explainZh: '资金流水分类：注资/回笼、资金费用（Funding）、自动减仓（ADL）等。',
    explainEn: 'Fund-flow type: inject/recall, funding fee, auto-deleveraging (ADL), etc.',
  },
  流水ID: {
    zh: '流水ID',
    en: 'Ledger ID',
    explainZh: '单笔资金流水唯一编号，用于对账与审计。',
    explainEn: 'Unique fund-flow id for reconciliation and audit.',
  },
  '金额 (USD)': {
    zh: '金额 (USD)',
    en: 'Amount (USD)',
    explainZh: '流水变动金额（美元）；通常绿正（入账）红负（出账）。',
    explainEn: 'Signed USD ledger change; typically green credit / red debit.',
  },
  仓位模式: {
    zh: '仓位模式',
    en: 'Margin Mode',
    explainZh: '逐仓（Isolated）或全仓（Cross）；决定保证金是否共享及强平范围。',
    explainEn: 'Isolated vs cross margin — how margin is shared and liquidation scope.',
  },
  资金费率数值: {
    zh: '资金费率数值',
    en: 'Funding Rate',
    explainZh: '外部资金费率观测值。跨所比较前须统一结算周期（如 8h）。',
    explainEn:
      'Observed external funding rate. Normalize to the same settlement interval before comparing venues.',
  },
  '收取周期 (Hour)': {
    zh: '收取周期 (Hour)',
    en: 'Funding Interval (h)',
    explainZh: '资金费结算间隔（小时）。4h 与 8h 费率不可直接比较。',
    explainEn: 'Funding settlement interval in hours. Do not compare raw 4h vs 8h rates.',
  },
  对标交易所: {
    zh: '对标交易所',
    en: 'Benchmark Exchanges',
    explainZh: '用于价差/资金费率对比的外部交易所（Peers）。',
    explainEn: 'Peer venues used for spread and funding-rate comparison.',
  },
  对标交易所资金费率: {
    zh: '对标交易所资金费率',
    en: 'Peer Funding Rate',
    explainZh: '外部平台同期资金费率，用于检查内部费率偏离。',
    explainEn: 'Peer venue funding for the same period; used to spot internal rate skew.',
  },
  平台资金费率: {
    zh: '平台资金费率',
    en: 'Platform Funding Rate',
    explainZh: '本平台计算的资金费率；须与外部源做同周期比较。',
    explainEn: 'Internal platform funding rate; compare on the same interval as peers.',
  },
  监控阈值: {
    zh: '监控阈值',
    en: 'Alert Threshold',
    explainZh: '触发告警的偏离幅度（价差或费率差）。',
    explainEn: 'Deviation (spread or funding gap) that triggers an alert.',
  },
  监控频率: {
    zh: '监控频率',
    en: 'Poll Frequency',
    explainZh: '监控轮询间隔。资金费率常用 5 分钟，临近结算可提高频率。',
    explainEn: 'How often the monitor polls. Funding often uses 5m; tighten near settlement.',
  },
  监控周期: {
    zh: '监控周期',
    en: 'Observation Window',
    explainZh: '连续观察窗口，用于确认异常是否持续。',
    explainEn: 'Observation window used to confirm a sustained anomaly.',
  },
  监控费率上限: {
    zh: '监控费率上限',
    en: 'Funding Upper Bound',
    explainZh: '内部资金费率高于该值则告警。',
    explainEn: 'Alert when internal funding exceeds this upper bound.',
  },
  监控费率下限: {
    zh: '监控费率下限',
    en: 'Funding Lower Bound',
    explainZh: '内部资金费率低于该值则告警（通常为负）。',
    explainEn: 'Alert when internal funding falls below this lower bound (often negative).',
  },
  预警群: {
    zh: '预警群',
    en: 'Alert Webhook',
    explainZh: 'Lark 机器人 Webhook。按风险等级配置值班群，避免敏感信息外泄。',
    explainEn: 'Lark bot webhook. Route by severity; keep P0 on-call exclusive.',
  },
  告警群: {
    zh: '告警群',
    en: 'Alarm Webhook',
    explainZh: '接收告警的 Lark 机器人 Webhook；按事件等级路由。',
    explainEn: 'Lark bot webhook for alarms; route by event severity.',
  },
  告警方式: {
    zh: '告警方式',
    en: 'Alert Channel',
    explainZh: '告警推送渠道（如 Lark）。关键事件建议备用通知路径。',
    explainEn: 'Delivery channel (e.g. Lark). Critical events should have a backup path.',
  },
  告警类型: {
    zh: '告警类型',
    en: 'Alert Type',
    explainZh: '事件类别，用于区分 ADL、强平、资金不足等。',
    explainEn: 'Event category (ADL, liquidation, funding shortfall, etc.).',
  },
  告警值: {
    zh: '告警值',
    en: 'Alert Value',
    explainZh: '触发阈值或事件条件。',
    explainEn: 'Trigger threshold or event condition.',
  },
  告警时间: {
    zh: '告警时间',
    en: 'Alert Time',
    explainZh: '告警触发时间；建议同时展示 UTC 与本地时区。',
    explainEn: 'When the alert fired; prefer UTC plus local timezone.',
  },
  更新时间: {
    zh: '更新时间',
    en: 'Updated At',
    explainZh: '配置或记录最近修改时间，便于审计。',
    explainEn: 'Last update timestamp for audit.',
  },
  更新人: {
    zh: '更新人',
    en: 'Updated By',
    explainZh: '最近修改配置的操作者。',
    explainEn: 'Operator who last changed the config.',
  },
  状态: {
    zh: '状态',
    en: 'Status',
    explainZh: '规则当前是否启用（生效中 / 已停用）。',
    explainEn: 'Whether the rule is active or disabled.',
  },
  操作: {
    zh: '操作',
    en: 'Actions',
    explainZh: '编辑、启用或停用；演示页不影响生产。',
    explainEn: 'Edit, enable or disable; demo pages do not change production.',
  },
  操作人员: {
    zh: '操作人员',
    en: 'Operator',
    explainZh: '执行配置变更的人员，供审计追踪。',
    explainEn: 'Person who performed the change (audit trail).',
  },
  行情源: {
    zh: '行情源',
    en: 'Market Source',
    explainZh: '价格/资金费率外部数据源。优先多家独立、同口径、低延迟来源。',
    explainEn: 'External price/funding feed. Prefer independent, same-convention, low-latency venues.',
  },
  市场名称: {
    zh: '市场名称',
    en: 'Venue / Source ID',
    explainZh: '行情供应商唯一标识。黄金优先可验证现货/CFD 源；BTC 优先主流 CEX。',
    explainEn:
      'Unique market-data venue id. Gold: verifiable spot/CFD; BTC: major CEX books.',
  },
  显示名称: {
    zh: '显示名称',
    en: 'Display Name',
    explainZh: '行情源在后台展示的名称，便于值班识别。',
    explainEn: 'Back-office display name for the market source.',
  },
  基础币种: {
    zh: '基础币种',
    en: 'Base Currency',
    explainZh: '标的资产。黄金选 XAU，比特币选 BTC（外汇对中的 Base）。',
    explainEn: 'Base asset of the pair (FX base). Gold → XAU; bitcoin → BTC.',
  },
  基础货币: {
    zh: '基础货币',
    en: 'Base Currency',
    explainZh: '标的资产。黄金选 XAU，比特币选 BTC。',
    explainEn: 'Base asset. Gold → XAU; bitcoin → BTC.',
  },
  计价币种: {
    zh: '计价币种',
    en: 'Quote Currency',
    explainZh: '价格计价单位（Quote）。XAUUSD / BTCUSD 均为 USD。',
    explainEn: 'Quote currency of the pair. XAUUSD and BTCUSD both quote in USD.',
  },
  计价货币: {
    zh: '计价货币',
    en: 'Quote Currency',
    explainZh: '合约计价单位；本示例均为 USD。',
    explainEn: 'Contract quote currency; USD in these examples.',
  },
  价格精度: {
    zh: '价格精度',
    en: 'Price Precision / Tick',
    explainZh: '价格小数位，须与合约 tick size 一致。',
    explainEn: 'Decimal places for price; must match contract tick size.',
  },
  指数名称: {
    zh: '指数名称',
    en: 'Index Name',
    explainZh: '多源价格指数名称，供标记价格与风险引擎引用。',
    explainEn: 'Multi-source index name referenced by mark price and risk engines.',
  },
  最小行情源数: {
    zh: '最小行情源数',
    en: 'Min Healthy Sources',
    explainZh: '参与指数计算的最低健康源数量；不足时降级并告警。',
    explainEn: 'Minimum healthy feeds required for the index; degrade and alert if short.',
  },
  计算方式: {
    zh: '计算方式',
    en: 'Aggregation Method',
    explainZh: '多源指数聚合方法（中位数、截尾均值、成交量加权等）。',
    explainEn: 'How multi-source prices aggregate (median, trimmed mean, volume-weighted, etc.).',
  },
  中位数偏离控制开关: {
    zh: '中位数偏离控制开关',
    en: 'Median Deviation Guard',
    explainZh: '检测并剔除离群报价，防止污染指数。',
    explainEn: 'Detect and drop outlier quotes so they do not pollute the index.',
  },
  中位数偏离比例: {
    zh: '中位数偏离比例',
    en: 'Median Deviation Ratio',
    explainZh: '单源相对多源中位数允许的最大偏离。',
    explainEn: 'Max allowed deviation of one source vs the multi-source median.',
  },
  '费率收取周期(小时)': {
    zh: '费率收取周期(小时)',
    en: 'Funding Period (h)',
    explainZh: '资金费结算频率。跨平台比较时统一换算（如换算为 8h）。',
    explainEn: 'Funding settlement frequency. Normalize (e.g. to 8h) before cross-venue compare.',
  },
  费率浮动上限: {
    zh: '费率浮动上限',
    en: 'Funding Cap',
    explainZh: '单结算周期资金费率上限。',
    explainEn: 'Maximum funding rate allowed in one settlement period.',
  },
  费率浮动下限: {
    zh: '费率浮动下限',
    en: 'Funding Floor',
    explainZh: '单结算周期资金费率下限（可为负）。',
    explainEn: 'Minimum funding rate in one settlement period (may be negative).',
  },
  自动调整资金费率: {
    zh: '自动调整资金费率',
    en: 'Auto-Adjust Funding',
    explainZh: '是否按规则自动微调资金费率；建议先影子运行并设上下限。',
    explainEn: 'Whether funding auto-tunes by rule; prefer shadow mode with hard caps first.',
  },
  是否开启自动调整资金费率: {
    zh: '是否开启自动调整资金费率',
    en: 'Enable Auto Funding Adjust',
    explainZh: '启用自动调节；先观察并限定最大变化率。',
    explainEn: 'Turn on auto funding adjust; observe first and cap max change rate.',
  },
  爆仓预警: {
    zh: '爆仓预警',
    en: 'Liquidation Warning',
    explainZh: '持仓接近强平（Liquidation）的预警，建议与维持保证金覆盖率联动。',
    explainEn: 'Pre-liquidation warning; tie to maintenance margin coverage.',
  },
  '爆仓仓位价值（USD）': {
    zh: '爆仓仓位价值（USD）',
    en: 'Liquidated Notional (USD)',
    explainZh: '触发强平的仓位名义价值，非实际亏损额。',
    explainEn: 'Notional of the position that was liquidated — not the realized loss amount.',
  },
  '爆仓预警仓位价值阈值（USD）': {
    zh: '爆仓预警仓位价值阈值（USD）',
    en: 'Large Liq Warning Notional',
    explainZh: '尚未爆仓的大仓位风险预警名义阈值。',
    explainEn: 'Notional threshold for large-position pre-liquidation warnings.',
  },
  '仓位价值阈值（USD）': {
    zh: '仓位价值阈值（USD）',
    en: 'Notional Threshold (USD)',
    explainZh: '超过该名义仓位触发关注或告警。',
    explainEn: 'Notional size that triggers attention or an alert.',
  },
  爆仓预警MMR阈值: {
    zh: '爆仓预警MMR阈值',
    en: 'Liq Warning MMR',
    explainZh: '维持保证金率预警阈值；须确认平台公式与强平方向。',
    explainEn: 'MMR level that warns of liquidation risk; confirm venue formula.',
  },
  DB大额持仓预警: {
    zh: 'DB大额持仓预警',
    en: 'DB Large Position Alert',
    explainZh: 'DB 接仓持仓名义价值超限告警。',
    explainEn: 'Alert when DB takeover position notional exceeds the limit.',
  },
  DB长时间持仓预警: {
    zh: 'DB长时间持仓预警',
    en: 'DB Stale Position Alert',
    explainZh: '接仓后持仓未及时对冲或出清的时长告警。',
    explainEn: 'Alert when a takeover position stays open too long without hedge/exit.',
  },
  注资金额上限预警: {
    zh: '注资金额上限预警',
    en: 'Inject Cap Alert',
    explainZh: '单次注资超过批准限额即告警。',
    explainEn: 'Alert when a single capital injection exceeds the approved cap.',
  },
  DB心跳预警: {
    zh: 'DB心跳预警',
    en: 'DB Heartbeat Alert',
    explainZh: '接仓系统心跳异常，可能影响强平承接。',
    explainEn: 'Takeover-system heartbeat failure; may impair liquidation absorption.',
  },
  DB资金一级预警: {
    zh: 'DB资金一级预警',
    en: 'DB Capital L1 Alert',
    explainZh: '接仓资金低于预计极端需求缓冲时的一级预警。',
    explainEn: 'Level-1 alert when takeover capital falls below stress-buffer needs.',
  },
  DB资金二级预警: {
    zh: 'DB资金二级预警',
    en: 'DB Capital L2 Alert',
    explainZh: '接仓资金进一步不足时的升级告警。',
    explainEn: 'Escalated alert when takeover capital is critically low.',
  },
  DB账户权益预警: {
    zh: 'DB账户权益预警',
    en: 'DB Equity Alert',
    explainZh: '接仓账户权益下降触发风险处置。',
    explainEn: 'Risk action when DB takeover account equity drops.',
  },
  注资通知: {
    zh: '注资通知',
    en: 'Injection Notice',
    explainZh: '发生注资（Capital Injection）时的事件通知。',
    explainEn: 'Event notice when capital is injected into the takeover wallet.',
  },
  回拨通知: {
    zh: '回拨通知',
    en: 'Recall Notice',
    explainZh: '资金回笼/回拨（Capital Recall）事件通知。',
    explainEn: 'Event notice when capital is recalled from the takeover wallet.',
  },
  自动减仓: {
    zh: '自动减仓',
    en: 'ADL (Auto-Deleveraging)',
    explainZh: '自动减仓机制（ADL），在强平无法完全承接时减持对手方仓位。',
    explainEn: 'Auto-deleveraging: reduce counterparty positions when liquidation cannot fully absorb.',
  },
  资金费用: {
    zh: '资金费用',
    en: 'Funding Fee',
    explainZh: '永续合约资金费用结算（Funding Payment），多空之间定期交换。',
    explainEn: 'Perpetual funding payment exchanged periodically between longs and shorts.',
  },
  类型: {
    zh: '类型',
    en: 'Type',
    explainZh: '事件或配置类别，用于筛选与审计。',
    explainEn: 'Event or config category for filtering and audit.',
  },
  是否启用: {
    zh: '是否启用',
    en: 'Enabled',
    explainZh: '启停对应监控或算法；生产变更应遵循审批。',
    explainEn: 'Enable/disable the monitor or algorithm; production changes need approval.',
  },
  操作记录: {
    zh: '操作记录',
    en: 'Audit Log',
    explainZh: '配置修改历史：操作人、时间与前后值。',
    explainEn: 'Config change history: who, when, before/after values.',
  },
  'DB接仓账户管理': {
    zh: 'DB接仓账户管理',
    en: 'DB Takeover Account',
    explainZh: '做市/风控用的 DB 接仓（House / Takeover）账户管理页。',
    explainEn: 'House/takeover account used for market-making and liquidation absorption.',
  },
  'DB接仓账户资金流水': {
    zh: 'DB接仓账户资金流水',
    en: 'DB Takeover Ledger',
    explainZh: '接仓账户资金流水（Ledger）明细。',
    explainEn: 'Fund-flow ledger for the DB takeover account.',
  },
  'DB账户告警': {
    zh: 'DB账户告警',
    en: 'DB Account Alerts',
    explainZh: '接仓账户相关告警配置与记录。',
    explainEn: 'Alert configs and records for the DB takeover account.',
  },
  推荐参数列表: {
    zh: '推荐参数列表',
    en: 'Recommended Parameters',
    explainZh: 'XAU/BTC 等品种的推荐参数对照表。',
    explainEn: 'Recommended parameter sheet for pairs such as XAU/BTC.',
  },
  大额爆仓预警: {
    zh: '大额爆仓预警',
    en: 'Large Liquidation Warning',
    explainZh: '大额仓位接近或触发强平前的预警。',
    explainEn: 'Warning before a large position approaches or hits liquidation.',
  },
  大额爆仓后通知: {
    zh: '大额爆仓后通知',
    en: 'Post-Liquidation Notice',
    explainZh: '大额强平完成后的通知。',
    explainEn: 'Notification after a large liquidation has completed.',
  },
  ADL异常记录: {
    zh: 'ADL异常记录',
    en: 'ADL Abnormal Records',
    explainZh: '自动减仓异常事件记录。',
    explainEn: 'Records of abnormal auto-deleveraging events.',
  },
}

export function normalizeTermKey(label: string): string {
  return label
    .replace(/[＊*ⓘℹ️]/g, '')
    .replace(/[：:]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function resolveTermKey(label: string): string {
  const k = normalizeTermKey(label)
  if (FINANCE_TERMS[k]) return k
  const found = Object.keys(FINANCE_TERMS).find((x) => k.includes(x) || x.includes(k))
  return found || k
}

export function getFinanceTerm(label: string): FinanceTerm {
  const key = resolveTermKey(label)
  const hit = FINANCE_TERMS[key]
  if (hit) return hit
  return {
    zh: key,
    en: key,
    explainZh: `字段「${key}」用于交易/风控配置或展示；请核对业务定义、单位与计算口径。`,
    explainEn: `"${key}" — trading/risk field; confirm definition, unit, and calculation convention.`,
  }
}

export type UiLang = 'zh' | 'en' | 'both'

/** Visible label for UI chrome based on language mode. */
export function formatTermLabel(label: string, lang: UiLang): string {
  const t = getFinanceTerm(label)
  if (lang === 'en') return t.en
  if (lang === 'both') return `${t.en} / ${t.zh}`
  return t.zh
}
