import {
  bitgetCandles,
  fetchBitgetKline,
  fetchMarketKline,
  BITGET_KLINE_URL,
} from '../src/engine/hourlyScan.ts'

async function main() {
  console.log('human', BITGET_KLINE_URL)
  const series = await fetchBitgetKline('1H', 8)
  console.log('bitget', series.sourceId, series.symbol, 'bars', series.bars.length, 'last', series.bars.at(-1)?.c)

  const parsed = bitgetCandles({
    code: '00000',
    data: [
      ['1000', '1', '2', '0.5', '1.5', '10'],
      ['2000', '1.5', '2.5', '1.4', '2.0', '11'],
    ],
  })
  console.log(
    'parse_order',
    parsed.map((b) => b.t).join(','),
    'asc',
    parsed[0]!.t < parsed[1]!.t,
  )

  // Force Bitget by calling it directly; market chain should prefer Binance when healthy
  const market = await fetchMarketKline('15m', 6)
  console.log('market', market.sourceId, market.bars.length)

  const ok =
    /bitget\.com\/futures\/usdt\/XAUUSDT/i.test(BITGET_KLINE_URL) &&
    series.sourceId === 'bitget-candles' &&
    series.bars.length >= 5 &&
    parsed.length === 2 &&
    parsed[0]!.t < parsed[1]!.t &&
    /^(binance|okx|bitget)-candles$/.test(market.sourceId)

  if (!ok) {
    console.error('FAIL')
    process.exit(1)
  }
  console.log('PASS')
}
main()
