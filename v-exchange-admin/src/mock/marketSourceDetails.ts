/** Per-market edit-form fields (行情源 / 修改指数市场). */

export type MarketSourceDetail = {
  marketName: string
  displayName: string
  observationSeconds: number
  reenableSeconds: number
  enabled: boolean
  spreadMonitor: boolean
  marketUrl: string
  volumeUrl: string
  forwardFundingUrl: string
  inverseFundingUrl: string
  latestPriceUrl: string
  indexPriceUrl: string
  fairPriceUrl: string
  description: string
}

const emptyUrls = {
  marketUrl: '',
  volumeUrl: '',
  forwardFundingUrl: '',
  inverseFundingUrl: '',
  latestPriceUrl: '',
  indexPriceUrl: '',
  fairPriceUrl: '',
}

export const marketSourceDetails: Record<string, MarketSourceDetail> = {
  BINANCE: {
    marketName: 'BINANCE',
    displayName: 'BINANCE',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    marketUrl: 'wss://stream.binance.com:9443/ws',
    volumeUrl: 'https://api.binance.com/api/v3/klines',
    forwardFundingUrl: 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=',
    inverseFundingUrl: 'https://dapi.binance.com/dapi/v1/premiumIndex?symbol=',
    latestPriceUrl: 'https://fapi.binance.com/fapi/v1/klines',
    indexPriceUrl: 'https://fapi.binance.com/fapi/v1/indexPriceKlines',
    fairPriceUrl: 'https://fapi.binance.com/fapi/v1/markPriceKlines',
    description: 'BINANCE现货成交价订阅',
  },
  OKEX: {
    marketName: 'OKEX',
    displayName: 'OKX',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    marketUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    description: 'OKEX现货成交价订阅',
  },
  BITGET: {
    marketName: 'BITGET',
    displayName: 'BITGET',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'BITGET现货成交价订阅',
  },
  BYBIT: {
    marketName: 'BYBIT',
    displayName: 'BYBIT',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'bybit 现货成交价订阅',
  },
  BINANCE_INDEX: {
    marketName: 'BINANCE_INDEX',
    displayName: 'BINANCE_INDEX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'BINANCE合约指数采集',
  },
  GATEIO_INDEX: {
    marketName: 'GATEIO_INDEX',
    displayName: 'GATEIO_INDEX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'GATEIO合约指数采集',
  },
  MEXC_INDEX: {
    marketName: 'MEXC_INDEX',
    displayName: 'MEXC_INDEX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'MEXC合约指数采集',
  },
  OKEX_INDEX: {
    marketName: 'OKEX_INDEX',
    displayName: 'OKX_INDEX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'OKEX合约指数采集',
  },
  BYBIT_INDEX: {
    marketName: 'BYBIT_INDEX',
    displayName: 'BYBIT_INDEX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'BYBIT合约指数采集',
  },
  BITGET_INDEX: {
    marketName: 'BITGET_INDEX',
    displayName: 'BITGET_INDEX',
    observationSeconds: 120,
    reenableSeconds: 30,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'BITGET合约指数采集',
  },
  LMAX: {
    marketName: 'LMAX',
    displayName: 'LMAX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'LMAX现货成交价订阅',
  },
  ISPRIME: {
    marketName: 'ISPRIME',
    displayName: 'ISPRIME',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'ISPRIME贵金属行情订阅',
  },
  STARPRIME: {
    marketName: 'STARPRIME',
    displayName: 'STARPRIME',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'STARPRIME贵金属行情订阅',
  },
  VELOCITY: {
    marketName: 'VELOCITY',
    displayName: 'VELOCITY',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'VELOCITY贵金属行情订阅',
  },
  RC_INDEX: {
    marketName: 'RC_INDEX',
    displayName: 'RC_INDEX',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: false,
    ...emptyUrls,
    description: 'RC内部指数采集',
  },
  FINALTO: {
    marketName: 'FINALTO',
    displayName: 'FINALTO',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'FINALTO行情订阅',
  },
  COINBASE: {
    marketName: 'COINBASE',
    displayName: 'COINBASE',
    observationSeconds: 120,
    reenableSeconds: 120,
    enabled: true,
    spreadMonitor: true,
    ...emptyUrls,
    description: 'COINBASE现货成交价订阅',
  },
}

/** Manual weight rows for XAUUSD (手动设置权重计算). */
export const xauManualWeights = [
  { source: 'BINANCE_INDEX', value: '0.40', weight: '0.004' },
  { source: 'OKEX_INDEX', value: '0.20', weight: '0.002' },
  { source: 'BYBIT_INDEX', value: '0.20', weight: '0.002' },
  { source: 'BITGET_INDEX', value: '0.20', weight: '0.002' },
  { source: 'LMAX', value: '3.00', weight: '0.03' },
  { source: 'ISPRIME', value: '3.00', weight: '0.03' },
  { source: 'STARPRIME', value: '1.50', weight: '0.015' },
  { source: 'VELOCITY', value: '1.50', weight: '0.015' },
  { source: 'RC_INDEX', value: '90.00', weight: '0.9' },
]

/** Volume auto-weight coefficients for BTCUSD. */
export const btcVolumeWeights = [
  { source: 'BINANCE', price: '--', coefficient: '2.00', weight: '--' },
  { source: 'OKEX', price: '--', coefficient: '1.00', weight: '--' },
  { source: 'BITGET', price: '--', coefficient: '1.00', weight: '--' },
  { source: 'BYBIT', price: '--', coefficient: '1.00', weight: '--' },
]

export const ALL_MARKET_SOURCE_NAMES = Object.keys(marketSourceDetails)
