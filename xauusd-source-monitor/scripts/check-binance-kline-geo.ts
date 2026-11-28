import {
  BINANCE_FAPI_BASES,
  binanceFapiUrl,
  fetchBinanceFapi,
  fetchBinanceKline,
  fetchMarketKline,
} from '../src/engine/hourlyScan.ts'

async function main() {
  console.log('bases', BINANCE_FAPI_BASES.join(' → '))
  console.log('ticker_url', binanceFapiUrl('/fapi/v1/ticker/price?symbol=XAUUSDT'))

  // Direct fapi host should 451 here; helper must still succeed via www
  let fapiBlocked = false
  try {
    const r = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=XAUUSDT', {
      headers: { Accept: 'application/json' },
    })
    fapiBlocked = r.status === 451 || r.status === 403
    console.log('fapi.binance.com status', r.status)
  } catch (e: any) {
    fapiBlocked = true
    console.log('fapi.binance.com err', e.message)
  }

  const res = await fetchBinanceFapi('/fapi/v1/ticker/price?symbol=XAUUSDT')
  const ticker = await res.json()
  console.log('fetchBinanceFapi ticker', res.status, ticker)

  const series = await fetchBinanceKline('1H', 8)
  console.log('kline', series.sourceId, series.symbol, 'bars', series.bars.length, 'last', series.bars.at(-1)?.c)

  const market = await fetchMarketKline('1H', 8)
  console.log('marketKline', market.sourceId, market.bars.length)

  const ok =
    BINANCE_FAPI_BASES[0] === 'https://www.binance.com' &&
    res.ok &&
    typeof ticker?.price === 'string' &&
    series.bars.length >= 5 &&
    market.sourceId === 'binance-candles' &&
    (fapiBlocked || true) // environment may or may not block fapi

  if (!ok) {
    console.error('FAIL')
    process.exit(1)
  }
  console.log('PASS')
}
main()
