import type { SourceDef } from '../types'

/** XAUUSD MVP perp venues from V Exchange index mapping (exchanges + LPs). */
export const XAUUSD_SOURCES: SourceDef[] = [
  { id: 'BINANCE', label: 'BINANCE', kind: 'exchange', basisBps: 1.2, noiseBps: 1.5 },
  { id: 'OKEX', label: 'OKEX', kind: 'exchange', basisBps: 0, noiseBps: 0.8 },
  { id: 'BITGET', label: 'BITGET', kind: 'exchange', basisBps: -0.8, noiseBps: 1.2 },
  { id: 'BYBIT', label: 'BYBIT', kind: 'exchange', basisBps: 0.6, noiseBps: 1.1 },
  { id: 'BINANCE_INDEX', label: 'BINANCE_INDEX', kind: 'exchange_index', basisBps: 0.4, noiseBps: 0.6 },
  { id: 'OKEX_INDEX', label: 'OKEX_INDEX', kind: 'exchange_index', basisBps: -0.2, noiseBps: 0.5 },
  { id: 'BYBIT_INDEX', label: 'BYBIT_INDEX', kind: 'exchange_index', basisBps: 0.3, noiseBps: 0.6 },
  { id: 'BITGET_INDEX', label: 'BITGET_INDEX', kind: 'exchange_index', basisBps: -0.4, noiseBps: 0.7 },
  { id: 'RC_INDEX', label: 'RC_INDEX', kind: 'composite_index', basisBps: 0.1, noiseBps: 0.4 },
  { id: 'LMAX', label: 'LMAX', kind: 'lp', basisBps: -0.5, noiseBps: 0.9 },
  { id: 'ISPRIME', label: 'ISPRIME', kind: 'lp', basisBps: 0.7, noiseBps: 1.4 },
  { id: 'STARPRIME', label: 'STARPRIME', kind: 'lp', basisBps: -0.9, noiseBps: 1.6 },
  { id: 'VELOCITY', label: 'VELOCITY', kind: 'lp', basisBps: 1.1, noiseBps: 1.8 },
]

export const KIND_LABEL: Record<SourceDef['kind'], string> = {
  exchange: 'Exchange',
  exchange_index: 'Exchange index',
  lp: 'Liquidity provider',
  composite_index: 'Composite index',
}
