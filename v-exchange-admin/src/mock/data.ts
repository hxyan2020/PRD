export interface ContractRecord {
  id: number;
  name: string;
  displayName: string;
  contractType: string;
  openType: string;
  targetCurrency: string;
  quoteCurrency: string;
  settlementCurrency: string;
  faceValue: string;
  direction: string;
  leverage: string;
  pricePrecision: string;
  qtyPrecision: string;
  amountPrecision: string;
  priceStep: string;
  qtyStep: string;
  minOrderQty: string;
  maxOrderQty: string;
  limitSheetMax: string;
  marketSheetMax: string;
  defaultTaker: string;
  defaultMaker: string;
  initialMargin: string;
  maintenanceMargin: string;
  excessMargin: string;
  assessmentArea: string;
  timedDelivery: string;
  pushEnabled: string;
  status: string;
}

export const contractList: ContractRecord[] = [
  {
    id: 10,
    name: 'BTC_USD',
    displayName: 'BTC_USD永续 / BTC_USD PERPETUAL',
    contractType: '全仓永续合约',
    openType: '全仓',
    targetCurrency: 'BTC',
    quoteCurrency: 'USD',
    settlementCurrency: 'USD',
    faceValue: '0.0001',
    direction: '双向',
    leverage: '1/200',
    pricePrecision: '2 (0.01)',
    qtyPrecision: '3 (0.001)',
    amountPrecision: '2 (0.01)',
    priceStep: '0.01',
    qtyStep: '1',
    minOrderQty: '1',
    maxOrderQty: '1000000',
    limitSheetMax: '100',
    marketSheetMax: '50',
    defaultTaker: '0.05%',
    defaultMaker: '0.02%',
    initialMargin: '0.5%',
    maintenanceMargin: '0.25%',
    excessMargin: '0.1%',
    assessmentArea: '否',
    timedDelivery: '否',
    pushEnabled: '是',
    status: '待开启',
  },
  {
    id: 11,
    name: 'XAU_USD',
    displayName: 'XAU_USD永续 / XAU',
    contractType: '全仓永续合约',
    openType: '全仓',
    targetCurrency: 'XAU',
    quoteCurrency: 'USD',
    settlementCurrency: 'USD',
    faceValue: '0.001',
    direction: '双向',
    leverage: '1/100',
    pricePrecision: '2 (0.01)',
    qtyPrecision: '2 (0.01)',
    amountPrecision: '2 (0.01)',
    priceStep: '0.01',
    qtyStep: '0.01',
    minOrderQty: '0.01',
    maxOrderQty: '500000',
    limitSheetMax: '100',
    marketSheetMax: '50',
    defaultTaker: '0.05%',
    defaultMaker: '0.02%',
    initialMargin: '1%',
    maintenanceMargin: '0.5%',
    excessMargin: '0.2%',
    assessmentArea: '否',
    timedDelivery: '否',
    pushEnabled: '是',
    status: '待开启',
  },
];

export interface CoinIntroduceRecord {
  contractName: string;
  contractDisplayName: string;
  currencyName: string;
  updateTime: string;
}

export const coinIntroduceList: CoinIntroduceRecord[] = [
  {
    contractName: 'XAU_USD永续',
    contractDisplayName: '--',
    currencyName: 'XAU',
    updateTime: '2024-09-22 17:12:01',
  },
];

export interface MarketSourceRecord {
  key: string;
  marketName: string;
  displayName: string;
  spreadMonitoring: string;
  description: string;
  observationPeriodSec: number;
  updateCycleSec: number;
  enabled: boolean;
}

export const marketSourceList: MarketSourceRecord[] = [
  { key: '1', marketName: 'BINANCE', displayName: 'BINANCE', spreadMonitoring: '是', description: 'BINANCE现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '2', marketName: 'OKEX', displayName: 'OKX', spreadMonitoring: '是', description: 'OKEX现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '3', marketName: 'BITGET', displayName: 'BITGET', spreadMonitoring: '是', description: 'BITGET现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '4', marketName: 'BYBIT', displayName: 'BYBIT', spreadMonitoring: '是', description: 'BYBIT现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '5', marketName: 'BINANCE_INDEX', displayName: 'BINANCE_INDEX', spreadMonitoring: '否', description: 'BINANCE指数价格订阅', observationPeriodSec: 120, updateCycleSec: 30, enabled: true },
  { key: '6', marketName: 'OKEX_INDEX', displayName: 'OKEX_INDEX', spreadMonitoring: '否', description: 'OKEX指数价格订阅', observationPeriodSec: 120, updateCycleSec: 30, enabled: true },
  { key: '7', marketName: 'BYBIT_INDEX', displayName: 'BYBIT_INDEX', spreadMonitoring: '否', description: 'BYBIT指数价格订阅', observationPeriodSec: 120, updateCycleSec: 30, enabled: true },
  { key: '8', marketName: 'BITGET_INDEX', displayName: 'BITGET_INDEX', spreadMonitoring: '否', description: 'BITGET指数价格订阅', observationPeriodSec: 120, updateCycleSec: 30, enabled: true },
  { key: '9', marketName: 'GATEIO_INDEX', displayName: 'GATEIO_INDEX', spreadMonitoring: '否', description: 'GATEIO指数价格订阅', observationPeriodSec: 120, updateCycleSec: 30, enabled: true },
  { key: '10', marketName: 'LMAX', displayName: 'LMAX', spreadMonitoring: '是', description: 'LMAX贵金属行情订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '11', marketName: 'ISPRIME', displayName: 'ISPRIME', spreadMonitoring: '是', description: 'ISPRIME贵金属行情订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '12', marketName: 'STARPRIME', displayName: 'STARPRIME', spreadMonitoring: '是', description: 'STARPRIME贵金属行情订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '13', marketName: 'VELOCITY', displayName: 'VELOCITY', spreadMonitoring: '是', description: 'VELOCITY贵金属行情订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '14', marketName: 'RC_INDEX', displayName: 'RC_INDEX', spreadMonitoring: '否', description: 'RC指数价格订阅', observationPeriodSec: 120, updateCycleSec: 30, enabled: true },
  { key: '15', marketName: 'GATEIO', displayName: 'GATEIO', spreadMonitoring: '是', description: 'GATEIO现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '16', marketName: 'HUOBI', displayName: 'HUOBI', spreadMonitoring: '是', description: 'HUOBI现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
  { key: '17', marketName: 'KUCOIN', displayName: 'KUCOIN', spreadMonitoring: '是', description: 'KUCOIN现货成交价订阅', observationPeriodSec: 120, updateCycleSec: 120, enabled: true },
];

export interface IndexPriceRecord {
  key: string;
  indexName: string;
  baseCurrency: string;
  quoteCurrency: string;
  pricePrecision: string;
  minMarketSources: number;
  marketSources: string[];
  volumeWhitelist: string[];
  calculationMethod: string;
  subscriptionCurrency: string;
  enabled: boolean;
  magnification: number;
}

export const indexPriceList: IndexPriceRecord[] = [
  {
    key: '1',
    indexName: 'BTCUSD',
    baseCurrency: 'BTC',
    quoteCurrency: 'USD',
    pricePrecision: '1 (0.1)',
    minMarketSources: 2,
    marketSources: ['BINANCE', 'OKEX', 'BITGET', 'BYBIT'],
    volumeWhitelist: ['BINANCE', 'OKEX'],
    calculationMethod: '交易量自动权重计算',
    subscriptionCurrency: 'BTC',
    enabled: true,
    magnification: 1,
  },
  {
    key: '2',
    indexName: 'XAUUSD',
    baseCurrency: 'XAU',
    quoteCurrency: 'USD',
    pricePrecision: '2 (0.01)',
    minMarketSources: 2,
    marketSources: ['LMAX', 'ISPRIME', 'STARPRIME', 'VELOCITY', 'RC_INDEX', 'BINANCE_INDEX', 'OKEX_INDEX', 'BYBIT_INDEX', 'BITGET_INDEX'],
    volumeWhitelist: ['LMAX', 'ISPRIME'],
    calculationMethod: '手动设置权重计算',
    subscriptionCurrency: 'XAU',
    enabled: true,
    magnification: 1,
  },
];

export interface FairPriceRecord {
  key: string;
  contractName: string;
  contractDisplayName: string;
  baselineMaPeriodSec: number;
  spreadThresholdRatio: string;
  observationThresholdSec: number;
  recoveryThresholdSec: number;
  newAlgorithmStatus: string;
  adoptionStatus: string;
}

export const fairPriceList: FairPriceRecord[] = [
  {
    key: '1',
    contractName: 'XAU_USD永续',
    contractDisplayName: '--',
    baselineMaPeriodSec: 30,
    spreadThresholdRatio: '3%',
    observationThresholdSec: 60,
    recoveryThresholdSec: 60,
    newAlgorithmStatus: '启用',
    adoptionStatus: '新算法',
  },
  {
    key: '2',
    contractName: 'BTC_USD永续',
    contractDisplayName: '--',
    baselineMaPeriodSec: 300,
    spreadThresholdRatio: '1%',
    observationThresholdSec: 120,
    recoveryThresholdSec: 60,
    newAlgorithmStatus: '启用',
    adoptionStatus: '新算法',
  },
];

export interface FundingRateRecord {
  key: string;
  contract: string;
  contractDisplayName: string;
  feeCycleHours: number;
  firstCollectionHour: number;
  floatUpper: string;
  floatLower: string;
  marginImpact: string;
  autoAdjust: boolean;
  marketSource: string;
  autoAdjustRange: string;
  ratePrecision: string;
  oldAlgorithmRate: string;
  newAlgorithmRate: string;
  settlementRate: string;
  enabled: boolean;
}

export const fundingRateList: FundingRateRecord[] = [
  {
    key: '1',
    contract: 'BTC_USD永续',
    contractDisplayName: 'BTC_USD永续',
    feeCycleHours: 8,
    firstCollectionHour: 0,
    floatUpper: '0.3%',
    floatLower: '-0.3%',
    marginImpact: '50000 USDT',
    autoAdjust: false,
    marketSource: '--',
    autoAdjustRange: '--',
    ratePrecision: '6 (0.000001)',
    oldAlgorithmRate: '0.09%',
    newAlgorithmRate: '0.0095%',
    settlementRate: '--',
    enabled: true,
  },
  {
    key: '2',
    contract: 'XAU_USD永续',
    contractDisplayName: 'XAU_USD永续',
    feeCycleHours: 4,
    firstCollectionHour: 20,
    floatUpper: '0.5%',
    floatLower: '-0.5%',
    marginImpact: '20000 USDT',
    autoAdjust: false,
    marketSource: '--',
    autoAdjustRange: '--',
    ratePrecision: '6 (0.000001)',
    oldAlgorithmRate: '0%',
    newAlgorithmRate: '0.005%',
    settlementRate: '--',
    enabled: true,
  },
];

export const contractNameOptions = [
  { label: 'BTC_USD永续', value: 'BTC_USD' },
  { label: 'XAU_USD永续', value: 'XAU_USD' },
];
