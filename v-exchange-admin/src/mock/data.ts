export type ContractRecord = {
  id: number
  symbol: string
  displayNameZh: string
  displayNameEn: string
  relatedIndex: string
  leverage: string
  pricePrecision: string
  amountPrecision: string
  minTick: string
  orderMin: string
  orderMax: string
  takerFee: string
  makerFee: string
  status: '下架' | '启用中'
}

export const contractRecords: ContractRecord[] = [
  {
    id: 10,
    symbol: 'BTC_USD',
    displayNameZh: 'BTC_USD永续',
    displayNameEn: 'BTC_USD PERPETUAL',
    relatedIndex: 'BTCUSD',
    leverage: '1/200',
    pricePrecision: '1 (0.1)',
    amountPrecision: '0 (1)',
    minTick: '0.1',
    orderMin: '1',
    orderMax: '100000',
    takerFee: '0.03%',
    makerFee: '0.01%',
    status: '下架',
  },
  {
    id: 11,
    symbol: 'XAU_USD',
    displayNameZh: 'XAU_USD永续',
    displayNameEn: 'XAU_USD PERPETUAL',
    relatedIndex: 'XAUUSD',
    leverage: '1/100',
    pricePrecision: '2 (0.01)',
    amountPrecision: '0 (1)',
    minTick: '0.01',
    orderMin: '1',
    orderMax: '50000',
    takerFee: '0.03%',
    makerFee: '0.01%',
    status: '启用中',
  },
]

export type CoinIntroduceRecord = {
  contractName: string
  displayName: string
  currencyName: string
  updatedAt: string
}

export const coinIntroduceRecords: CoinIntroduceRecord[] = [
  {
    contractName: 'XAU_USD永续',
    displayName: '--',
    currencyName: 'XAU',
    updatedAt: '2024-05-22 17:12:01',
  },
]

export type MarketSourceRecord = {
  marketName: string
  displayName: string
  spreadMonitor: '是' | '否'
  description: string
  observationSeconds: number
  reenableSeconds: number
  enabled: boolean
}

export const marketSourceRecords: MarketSourceRecord[] = [
  {
    marketName: 'BINANCE',
    displayName: 'BINANCE',
    spreadMonitor: '是',
    description: 'BINANCE现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'OKEX',
    displayName: 'OKX',
    spreadMonitor: '是',
    description: 'OKEX现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'BITGET',
    displayName: 'BITGET',
    spreadMonitor: '是',
    description: 'BITGET现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'BYBIT',
    displayName: 'BYBIT',
    spreadMonitor: '是',
    description: 'BYBIT现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'BINANCE_INDEX',
    displayName: 'BINANCE_INDEX',
    spreadMonitor: '否',
    description: 'BINANCE指数价格订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'OKEX_INDEX',
    displayName: 'OKEX_INDEX',
    spreadMonitor: '否',
    description: 'OKEX指数价格订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'BITGET_INDEX',
    displayName: 'BITGET_INDEX',
    spreadMonitor: '否',
    description: 'BITGET指数价格订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'BYBIT_INDEX',
    displayName: 'BYBIT_INDEX',
    spreadMonitor: '否',
    description: 'BYBIT指数价格订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'LMAX',
    displayName: 'LMAX',
    spreadMonitor: '是',
    description: 'LMAX现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'COINBASE',
    displayName: 'COINBASE',
    spreadMonitor: '是',
    description: 'COINBASE现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'KRAKEN',
    displayName: 'KRAKEN',
    spreadMonitor: '是',
    description: 'KRAKEN现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
  },
  {
    marketName: 'HUOBI',
    displayName: 'HUOBI',
    spreadMonitor: '是',
    description: 'HUOBI现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'GATE',
    displayName: 'GATE',
    spreadMonitor: '是',
    description: 'GATE现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'KUCOIN',
    displayName: 'KUCOIN',
    spreadMonitor: '是',
    description: 'KUCOIN现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'MEXC',
    displayName: 'MEXC',
    spreadMonitor: '否',
    description: 'MEXC现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
  {
    marketName: 'FTX_INDEX',
    displayName: 'FTX_INDEX',
    spreadMonitor: '否',
    description: 'FTX指数价格订阅（归档）',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: false,
  },
  {
    marketName: 'DERIBIT',
    displayName: 'DERIBIT',
    spreadMonitor: '是',
    description: 'DERIBIT现货成交价订阅',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
  },
]

export type IndexPriceRecord = {
  indexName: string
  baseCoin: string
  quoteCoin: string
  pricePrecision: string
  minSourceCount: number
  priceSources: string
  whitelist: string
  calcMethod: string
  subscriptionCoin: string
  magnification: string
  enabled: boolean
}

export const indexPriceRecords: IndexPriceRecord[] = [
  {
    indexName: 'BTCUSD',
    baseCoin: 'BTC',
    quoteCoin: 'USD',
    pricePrecision: '1 (0.1)',
    minSourceCount: 2,
    priceSources: 'BINANCE, OKEX, BITGET, BYBIT, LMAX',
    whitelist: 'BINANCE, OKEX, BITGET',
    calcMethod: '交易量自动权重计算',
    subscriptionCoin: 'BTC',
    magnification: '--',
    enabled: false,
  },
  {
    indexName: 'XAUUSD',
    baseCoin: 'XAU',
    quoteCoin: 'USD',
    pricePrecision: '2 (0.01)',
    minSourceCount: 2,
    priceSources: 'BINANCE, OKEX, BITGET, BYBIT',
    whitelist: 'BINANCE, OKEX',
    calcMethod: '手动设置权重计算',
    subscriptionCoin: 'XAU',
    magnification: '--',
    enabled: true,
  },
]

export type FairPriceRecord = {
  contractName: string
  displayName: string
  basisMaPeriod: number
  spreadThreshold: string
  observeThreshold: number
  recoveryThreshold: number
  newAlgoStatus: '启用' | '禁用'
  adoptStatus: string
}

export const fairPriceRecords: FairPriceRecord[] = [
  {
    contractName: 'XAU_USD永续',
    displayName: '--',
    basisMaPeriod: 30,
    spreadThreshold: '3%',
    observeThreshold: 60,
    recoveryThreshold: 60,
    newAlgoStatus: '启用',
    adoptStatus: '新算法',
  },
  {
    contractName: 'BTC_USD永续',
    displayName: '--',
    basisMaPeriod: 300,
    spreadThreshold: '1%',
    observeThreshold: 120,
    recoveryThreshold: 60,
    newAlgoStatus: '启用',
    adoptStatus: '新算法',
  },
]

export type FundingRateRecord = {
  contract: string
  displayName: string
  periodHours: number
  firstCollectHour: number
  upperLimit: string
  lowerLimit: string
  marginImpact: string
  autoAdjust: boolean
  marketSource: string
  adjustFactorRange: string
  ratePrecision: string
  oldAlgoRate: string
  newAlgoRate: string
  settlementRate: string
  enabled: boolean
}

export const fundingRateRecords: FundingRateRecord[] = [
  {
    contract: 'BTC_USD永续',
    displayName: 'BTC_USD永续',
    periodHours: 8,
    firstCollectHour: 0,
    upperLimit: '0.3%',
    lowerLimit: '-0.3%',
    marginImpact: '50000 USDT',
    autoAdjust: false,
    marketSource: 'BINANCE',
    adjustFactorRange: '[0.8, 1.2]',
    ratePrecision: '6 (0.000001)',
    oldAlgoRate: '0.09%',
    newAlgoRate: '0.0095%',
    settlementRate: '--',
    enabled: true,
  },
  {
    contract: 'XAU_USD永续',
    displayName: 'XAU_USD永续',
    periodHours: 4,
    firstCollectHour: 20,
    upperLimit: '0.5%',
    lowerLimit: '-0.5%',
    marginImpact: '20000 USDT',
    autoAdjust: false,
    marketSource: 'OKEX',
    adjustFactorRange: '[0.8, 1.2]',
    ratePrecision: '6 (0.000001)',
    oldAlgoRate: '0%',
    newAlgoRate: '0.005%',
    settlementRate: '--',
    enabled: true,
  },
]

export const tradeAmountFactorConfig = {
  currentFactor: 1,
  targetFactor: 1,
  effectiveMode: 'smooth' as 'immediate' | 'smooth',
  adjustmentIntervalMinutes: 1,
  adjustmentAmplitude: 0.01,
}
