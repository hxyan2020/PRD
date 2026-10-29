import { PAIRS } from '../config/pairs'

export type PairMarketSnapshot = {
  symbol: string
  indexName: string
  contractStatus: '启用中' | '下架'
  indexPrice: string
  markPrice: string
  lastPrice: string
  fundingRate: string
  nextFundingIn: string
  openInterestUsd: string
  volume24hUsd: string
  longShortRatio: string
  spreadBps: string
}

export const pairMarketSnapshots: PairMarketSnapshot[] = [
  {
    symbol: PAIRS.XAU_USD.symbol,
    indexName: PAIRS.XAU_USD.indexName,
    contractStatus: '启用中',
    indexPrice: '4348.62',
    markPrice: '4348.55',
    lastPrice: '4348.50',
    fundingRate: '0.0050%',
    nextFundingIn: '02:14:33',
    openInterestUsd: '12.4M',
    volume24hUsd: '86.2M',
    longShortRatio: '1.08 : 1',
    spreadBps: '1.2',
  },
  {
    symbol: PAIRS.BTC_USD.symbol,
    indexName: PAIRS.BTC_USD.indexName,
    contractStatus: '下架',
    indexPrice: '83382.50',
    markPrice: '83382.50',
    lastPrice: '83382.40',
    fundingRate: '0.0095%',
    nextFundingIn: '05:44:33',
    openInterestUsd: '48.1M',
    volume24hUsd: '312.0M',
    longShortRatio: '0.92 : 1',
    spreadBps: '0.8',
  },
]

export type PositionValueStatRow = {
  id: string
  contractName: string
  longValue: string
  shortValue: string
}

export const positionValueStats: PositionValueStatRow[] = [
  { id: 'xau', contractName: PAIRS.XAU_USD.displayNameZh, longValue: '8,420,120 USD', shortValue: '7,910,440 USD' },
  { id: 'btc', contractName: PAIRS.BTC_USD.displayNameZh, longValue: '22,180,500 USD', shortValue: '24,002,100 USD' },
]

export type IndexMarketLinkRecord = {
  indexName: string
  targetPair: string
  marketSource: string
}

export const indexMarketLinkRecords: IndexMarketLinkRecord[] = [
  { indexName: 'XAUUSD', targetPair: 'XAU/USDT', marketSource: 'BINANCE' },
  { indexName: 'XAUUSD', targetPair: 'XAU/USDT', marketSource: 'OKEX' },
  { indexName: 'XAUUSD', targetPair: 'PAXG/USDT', marketSource: 'BYBIT' },
  { indexName: 'BTCUSD', targetPair: 'BTC/USDT', marketSource: 'BINANCE' },
  { indexName: 'BTCUSD', targetPair: 'BTC/USDT', marketSource: 'OKEX' },
  { indexName: 'BTCUSD', targetPair: 'BTC/USDT', marketSource: 'BITGET' },
  { indexName: 'BTCUSD', targetPair: 'BTC/USD', marketSource: 'LMAX' },
]
