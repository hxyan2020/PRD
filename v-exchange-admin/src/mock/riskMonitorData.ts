export const spreadMonitorConfigs = [
  { id: 1, type1: '标记价格', type2: '指数价格', alarmValue: '1%', period: '1 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:34', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
  { id: 2, type1: '最新成交价', type2: '标记价格', alarmValue: '1%', period: '5 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:39', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
  { id: 3, type1: '最新成交价', type2: '指数价格', alarmValue: '1%', period: '5 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:43', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
  { id: 4, type1: '买卖中间价', type2: '指数价格', alarmValue: '1%', period: '5 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:47', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
  { id: 5, type1: '卖一价格', type2: '指数价格', alarmValue: '1%', period: '5 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:51', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
  { id: 6, type1: '买一价格', type2: '指数价格', alarmValue: '1%', period: '5 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:55', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
  { id: 7, type1: '买一价格', type2: '卖一价格', alarmValue: '0.1%', period: '5 分钟', contracts: 1, updatedAt: '2026-09-22 18:14:59', updatedBy: 'natalie.chen@hytechc.com', status: '生效中' },
]

export const spreadAlertRecords = [
  { contract: 'XAU_USD', value: '0.1%', type1: '买一价格', price1: '4345.22', type2: '买一价格', price2: '4351.88', period: '5 分钟', time: '2026-09-22 00:50:01', channel: 'Lark' },
  { contract: 'XAU_USD', value: '0.1%', type1: '买一价格', price1: '4346.13', type2: '买一价格', price2: '4350.71', period: '5 分钟', time: '2026-09-22 00:45:01', channel: 'Lark' },
  { contract: 'BTC_USD', value: '0.08%', type1: '卖一价格', price1: '83382.50', type2: '指数价格', price2: '83390.10', period: '5 分钟', time: '2026-09-22 00:40:01', channel: 'Lark' },
]

export const noTradeConfigs = [
  { id: 1, alertType: '超时未成交', alertValue: '40 秒', status: '生效中' },
]

export const noTradeAlertRecords = [
  { contract: 'XAU_USD', type: '长时间无交易', value: '40 秒', time: '2026-10-29 22:03:08', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '40 秒', time: '2026-10-29 21:55:05', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '40 秒', time: '2026-10-29 21:41:38', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '40 秒', time: '2026-10-29 19:11:55', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '40 秒', time: '2026-10-29 18:04:00', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '30 秒', time: '2026-10-29 17:32:45', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '30 秒', time: '2026-10-29 17:31:15', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '30 秒', time: '2026-10-29 17:24:43', channel: 'Lark' },
  { contract: 'XAU_USD', type: '长时间无交易', value: '30 秒', time: '2026-10-29 17:21:11', channel: 'Lark' },
  { contract: 'BTC_USD', type: '长时间无交易', value: '40 秒', time: '2026-10-28 15:12:00', channel: 'Lark' },
]

export const depthAlertRecords = [
  { contract: 'XAU_USD', type: '深度告警', threshold: '0.1% < ~50,000 USD', time: '2026-09-22 07:38:16', channel: 'Lark' },
  { contract: 'XAU_USD', type: '档位告警', threshold: '<=25 档', time: '2026-09-22 07:38:16', channel: 'Lark' },
  { contract: 'BTC_USD', type: '档位告警', threshold: '<=25 档', time: '2026-09-22 07:40:01', channel: 'Lark' },
]

export const peerSpreadRecords = [
  { contract: 'XAU_USD', period: '5分钟', peer: 'Binance', priceType: '标记价', deviation: '0.5%', time: '2024-09-23 10:55:07', channel: 'Lark' },
  { contract: 'XAU_USD', period: '5分钟', peer: 'Bybit', priceType: '标记价', deviation: '0.5%', time: '2024-09-23 10:55:07', channel: 'Lark' },
  { contract: 'BTC_USD', period: '5分钟', peer: 'Binance', priceType: '指数价', deviation: '0.3%', time: '2024-09-23 10:55:07', channel: 'Lark' },
  { contract: 'BTC_USD', period: '5分钟', peer: 'OKX', priceType: '指数价', deviation: '0.3%', time: '2024-09-23 10:55:07', channel: 'Lark' },
]

export const riskFundList = [
  {
    id: 'btc',
    displayName: 'BTC_USD永续',
    contractName: 'BTC_USD',
    feeSummary: '0USD',
    available: '0USD',
    netValue: '0USD',
    collected: '0USD',
    canReclaim: true,
  },
  {
    id: 'xau',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    feeSummary: '0USD',
    available: '-0.07USD',
    netValue: '-0.07USD',
    collected: '0USD',
    canReclaim: false,
  },
]

export const riskFundDetails = [
  { id: '1009', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 1009, contractId: 1, changeType: '代管账户资金清空', amount: '0.00455688USD', createdAt: '2026-10-26 22:58:08' },
  { id: '1008', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 1008, contractId: 1, changeType: '代管账户资金清空', amount: '-0.00000576USD', createdAt: '2026-10-26 21:53:39' },
  { id: '1005', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 1005, contractId: 2, changeType: '代管账户资金清空', amount: '0.00000268USD', createdAt: '2026-10-26 11:17:08' },
  { id: '1004', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 1004, contractId: 1, changeType: '代管账户资金清空', amount: '0.00001231USD', createdAt: '2026-10-26 11:17:06' },
  { id: '1003', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 1003, contractId: 1, changeType: '代管账户资金清空', amount: '-0.00000551USD', createdAt: '2026-10-24 23:20:36' },
  { id: '1002', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 1002, contractId: 1, changeType: '代管账户资金清空', amount: '0.00000110USD', createdAt: '2026-10-20 12:01:00' },
  { id: '997', displayName: 'XAU_USD永续', contractName: 'XAU_USD', recordId: 997, contractId: 1, changeType: '代管账户资金清空', amount: '-0.00000088USD', createdAt: '2026-10-16 09:33:22' },
  { id: 'btc1', displayName: 'BTC_USD永续', contractName: 'BTC_USD', recordId: 2001, contractId: 10, changeType: '风险基金注入', amount: '1000.00USD', createdAt: '2026-10-15 10:00:00' },
]

export const marketPriceLimits = [
  {
    id: 'btc',
    displayName: 'BTC_USD永续',
    contractName: 'BTC_USD',
    gt20f: '20%',
    lt20f: '0.5%',
    defaultTier: 15,
    maxMarketTier: 20,
    maxDeviation: '0.1%',
    alertSwitch: '已开启/-- USD',
    updatedAt: '2024-09-15 22:11:10',
    operator: 'evan.bi@hytechc.com',
  },
  {
    id: 'xau',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    gt20f: '1%',
    lt20f: '0.5%',
    defaultTier: 15,
    maxMarketTier: 10,
    maxDeviation: '0.1%',
    alertSwitch: '已开启/-- USD',
    updatedAt: '2024-09-22 14:42:27',
    operator: 'vincent.you@hytechc.com',
  },
]

export const monitorTypeOptions = [
  '标记价格',
  '最新成交价',
  '买卖中间价',
  '卖一价格',
  '买一价格',
  '指数价格',
].map((v) => ({ value: v, label: v }))
