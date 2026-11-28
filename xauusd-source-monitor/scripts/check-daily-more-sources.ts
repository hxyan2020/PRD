import {
  dailySourceHyperlinks,
  formatDaily24hMarketAnswer,
  dailyExpandedSources,
  DAILY_REPORT_SECTIONS,
  type MarketSnapshot,
} from '../api/lark/_lib/market.ts'
import type { ReportSource } from '../src/engine/hourlyScan.ts'

const links = dailySourceHyperlinks()
const labels = [
  'Binance K线','OKX K线','Bitget','Kitco','Yahoo GC','Yahoo DXY','Yahoo 10Y','Fed','FRED',
  'Reuters','Bloomberg','CNBC Gold','MarketWatch','Investing','FT','WSJ','COMEX','LBMA','WGC','CoinDesk','Kitco X','Kitco News',
]
const hit = labels.filter((l) => links.includes(l))
console.log('fixed_link_count_labels', hit.length, '/', labels.length)
console.log('sections', DAILY_REPORT_SECTIONS.length, DAILY_REPORT_SECTIONS.join(','))

const snap = {
  asOf: Date.now(),
  hourly: {
    asOf: Date.now(),
    windowMinutes: 1440,
    tldr: [],
    opportunity: [],
    risk: [],
    sources: [
      {
        id: 'extra-news',
        captionEn: 'Mining.com',
        captionZh: 'Mining.com',
        url: 'https://www.mining.com/commodity/gold/',
        domain: 'mining.com',
        logoUrl: '',
        kind: 'news',
        health: 'ok',
        checkedAt: Date.now(),
        detail: 'test',
      },
    ] as ReportSource[],
  },
} as unknown as MarketSnapshot

const md = formatDaily24hMarketAnswer(snap, 'zh-Hans')
console.log('has_sources_section', md.includes('**📚 数据来源**'))
console.log('has_reuters', md.includes('Reuters'))
console.log('has_bloomberg', md.includes('Bloomberg'))
console.log('has_fed', md.includes('Fed'))
console.log('has_comex', md.includes('COMEX'))
console.log('has_coindesk', md.includes('CoinDesk'))

const fixed: ReportSource[] = [
  {
    id: 'binance-kline',
    captionEn: 'Binance K线',
    captionZh: 'Binance K线',
    url: 'https://www.binance.com/en/trade/XAU_USDT',
    domain: 'binance.com',
    logoUrl: '',
    kind: 'exchange',
    health: 'ok',
    checkedAt: Date.now(),
    detail: '',
  },
]
const expanded = dailyExpandedSources(fixed, snap.hourly!.sources, 24)
console.log('expanded_ids', expanded.map((s) => s.id).join(','))
const ok =
  hit.length >= 18 &&
  md.includes('**📚 数据来源**') &&
  expanded.some((s) => s.id === 'binance-kline') &&
  expanded.some((s) => s.id === 'extra-news') &&
  DAILY_REPORT_SECTIONS.length === 7
if (!ok) {
  console.error('FAIL')
  process.exit(1)
}
console.log('PASS')
