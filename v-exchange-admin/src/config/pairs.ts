/** Canonical XAUUSD / BTCUSD pair definitions for admin mock data and filters. */

export type PairKey = 'XAU_USD' | 'BTC_USD'

export type PairDefinition = {
  key: PairKey
  symbol: string
  indexName: string
  baseCoin: string
  quoteCoin: string
  displayNameZh: string
  displayNameEn: string
  contractFid: string
}

export const PAIRS: Record<PairKey, PairDefinition> = {
  XAU_USD: {
    key: 'XAU_USD',
    symbol: 'XAU_USD',
    indexName: 'XAUUSD',
    baseCoin: 'XAU',
    quoteCoin: 'USD',
    displayNameZh: 'XAU_USD永续',
    displayNameEn: 'XAU_USD PERPETUAL',
    contractFid: '100000011',
  },
  BTC_USD: {
    key: 'BTC_USD',
    symbol: 'BTC_USD',
    indexName: 'BTCUSD',
    baseCoin: 'BTC',
    quoteCoin: 'USD',
    displayNameZh: 'BTC_USD永续',
    displayNameEn: 'BTC_USD PERPETUAL',
    contractFid: '100000010',
  },
}

export const PAIR_LIST = [PAIRS.XAU_USD, PAIRS.BTC_USD]

export const perpContractOptions = PAIR_LIST.map((p) => ({
  value: p.displayNameZh,
  label: p.displayNameZh,
}))

export const symbolOptions = PAIR_LIST.map((p) => ({
  value: p.symbol,
  label: p.symbol,
}))

export const indexNameOptions = PAIR_LIST.map((p) => ({
  value: p.indexName,
  label: p.indexName,
}))

export const baseCoinOptions = PAIR_LIST.map((p) => ({
  value: p.baseCoin,
  label: p.baseCoin,
}))
