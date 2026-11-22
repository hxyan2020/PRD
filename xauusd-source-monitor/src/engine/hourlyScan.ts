/**
 * Hourly Market Condition scan — bilingual TL;DR / Opportunity / Risk.
 * Never invents points: empty sections say so explicitly.
 */
import type { BriefingCitation, SourceHealth } from '../types'

export type ReportSectionKind = 'tldr' | 'opportunity' | 'risk'

export type SourceKind =
  | 'news'
  | 'exchange'
  | 'announcement'
  | 'api'
  | 'price'
  | 'macro'
  | 'indicator'

export type SourceHealthStatus = 'ok' | 'degraded' | 'down' | 'unchecked'

export interface ReportSource {
  id: string
  /** Short caption under the logo */
  captionEn: string
  captionZh: string
  url: string
  domain: string
  /** Favicon / official mark via Google s2 (no local assets required) */
  logoUrl: string
  kind: SourceKind
  health: SourceHealthStatus
  /** Epoch ms when this source was last probed / refreshed */
  checkedAt: number
  latencyMs?: number
  detail?: string
}

export interface RankedPoint {
  /** 1 = most urgent … 4 = least */
  rank: number
  en: string
  zh: string
  sourceIds: string[]
}

/** -100 (bearish) … 0 (neutral) … +100 (bullish) for XAUUSD desk tone */
export type SentimentBandId =
  | 'bearish'
  | 'cautious'
  | 'neutral'
  | 'constructive'
  | 'bullish'

export interface SentimentBarometer {
  /** Integer score in [-100, 100] */
  score: number
  band: SentimentBandId
  labelEn: string
  labelZh: string
  /** CSS color token for the fill / pill */
  color: string
  /** How the score is defined — shown on hover */
  definitionEn: string[]
  definitionZh: string[]
}

/** One OHLC bar for the report K-line chart */
export interface KlineBar {
  /** Candle open time (epoch ms) */
  t: number
  o: number
  h: number
  l: number
  c: number
  /** Optional base volume */
  v?: number
}

export interface HourlyKlineSeries {
  symbol: string
  /** Exchange bar size label, e.g. 1H */
  interval: string
  sourceId: string
  bars: KlineBar[]
}

export interface HourlyMarketReport {
  id: string
  createdAt: number
  /** Asia/Singapore hour bucket, e.g. 2026-11-22T19 */
  hourKey: string
  tldr: RankedPoint[]
  opportunity: RankedPoint[]
  risk: RankedPoint[]
  sources: ReportSource[]
  sentiment: SentimentBarometer
  /** OKX XAU-USDT-SWAP 1H candles for the report chart */
  kline: HourlyKlineSeries | null
  /** V Exchange indicators are placeholders until ops provides the feed */
  vexPlaceholder: true
  vexNoteEn: string
  vexNoteZh: string
}

const REPORTS_KEY = 'xauusd-hourly-scan-reports-v1'
const HOUR_MS = 60 * 60_000

const YAHOO_DXY =
  'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1m&range=1d'
const YAHOO_TNX =
  'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1m&range=1d'
const YAHOO_GC =
  'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d'
const FED_PRESS = 'https://www.federalreserve.gov/json/ne-press.json'
const GOLD_API = 'https://api.gold-api.com/price/XAU'
const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_FUNDING = 'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP'
const OKX_CANDLES =
  'https://www.okx.com/api/v5/market/candles?instId=XAU-USDT-SWAP&bar=1H&limit=36'
const BITGET_TICKER =
  'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT'

type CatalogEntry = {
  id: string
  kind: SourceKind
  url: string
  captionEn: string
  captionZh: string
  /** Prefer JSON CORS probe when true */
  json?: boolean
  /** When true, a reachable opinion/news URL can feed Risk/Opportunity text */
  opinion?: boolean
  opinionTone?: 'risk' | 'opportunity'
}

/**
 * Major XAUUSD-perp desk coverage: news, exchange announcements, APIs,
 * prices, and macro/indicator feeds. Always listed with health + checkedAt.
 */
const SOURCE_CATALOG: CatalogEntry[] = [
  // —— Prices / APIs / indicators ——
  {
    id: 'okx-ticker',
    kind: 'api',
    url: OKX_TICKER,
    captionEn: 'OKX API: XAU-USDT-SWAP last price',
    captionZh: 'OKX API：XAU-USDT-SWAP 最新價',
    json: true,
  },
  {
    id: 'okx-candles',
    kind: 'price',
    url: OKX_CANDLES,
    captionEn: 'OKX API: XAU-USDT-SWAP 1H K-line (36 bars)',
    captionZh: 'OKX API：XAU-USDT-SWAP 1H K 線（36 根）',
    json: true,
  },
  {
    id: 'okx-funding',
    kind: 'indicator',
    url: OKX_FUNDING,
    captionEn: 'OKX API: XAU-USDT-SWAP funding rate',
    captionZh: 'OKX API：XAU-USDT-SWAP 資金費率',
    json: true,
  },
  {
    id: 'bitget-ticker',
    kind: 'api',
    url: BITGET_TICKER,
    captionEn: 'Bitget API: XAUUSDT perpetual ticker',
    captionZh: 'Bitget API：XAUUSDT 永續 ticker',
    json: true,
  },
  {
    id: 'gold-api',
    kind: 'price',
    url: GOLD_API,
    captionEn: 'gold-api: XAU spot USD',
    captionZh: 'gold-api：XAU 現貨美元價',
    json: true,
  },
  {
    id: 'yahoo-gc',
    kind: 'price',
    url: YAHOO_GC,
    captionEn: 'Yahoo chart: COMEX gold GC=F (1m)',
    captionZh: 'Yahoo 圖：COMEX 黃金 GC=F（1分鐘）',
    json: true,
  },
  {
    id: 'yahoo-dxy',
    kind: 'macro',
    url: YAHOO_DXY,
    captionEn: 'Yahoo chart: Dollar Index DX-Y.NYB (1m)',
    captionZh: 'Yahoo 圖：美元指數 DX-Y.NYB（1分鐘）',
    json: true,
  },
  {
    id: 'yahoo-tnx',
    kind: 'macro',
    url: YAHOO_TNX,
    captionEn: 'Yahoo chart: US 10Y yield ^TNX (1m)',
    captionZh: 'Yahoo 圖：美債 10 年 ^TNX（1分鐘）',
    json: true,
  },
  {
    id: 'fed-press-json',
    kind: 'announcement',
    url: FED_PRESS,
    captionEn: 'Federal Reserve press-release JSON index',
    captionZh: '聯準會新聞稿 JSON 索引',
    json: true,
  },
  // —— Exchange venues / official announcements ——
  {
    id: 'okx-trade',
    kind: 'exchange',
    url: 'https://www.okx.com/trade-swap/xau-usdt-swap',
    captionEn: 'OKX trade page: XAU-USDT-SWAP',
    captionZh: 'OKX 交易頁：XAU-USDT-SWAP',
  },
  {
    id: 'okx-announcements',
    kind: 'announcement',
    url: 'https://www.okx.com/help/section/announcements-latest-announcements',
    captionEn: 'OKX official announcements',
    captionZh: 'OKX 官方公告',
  },
  {
    id: 'binance-futures',
    kind: 'exchange',
    url: 'https://www.binance.com/en/futures/XAUUSDT',
    captionEn: 'Binance futures: XAUUSDT',
    captionZh: 'Binance 合約：XAUUSDT',
  },
  {
    id: 'binance-announcements',
    kind: 'announcement',
    url: 'https://www.binance.com/en/support/announcement',
    captionEn: 'Binance official announcements',
    captionZh: 'Binance 官方公告',
  },
  {
    id: 'bybit-trade',
    kind: 'exchange',
    url: 'https://www.bybit.com/trade/usdt/XAUUSDT',
    captionEn: 'Bybit trade: XAUUSDT',
    captionZh: 'Bybit 交易：XAUUSDT',
  },
  {
    id: 'bybit-announcements',
    kind: 'announcement',
    url: 'https://announcements.bybit.com/',
    captionEn: 'Bybit official announcements',
    captionZh: 'Bybit 官方公告',
  },
  {
    id: 'bitget-trade',
    kind: 'exchange',
    url: 'https://www.bitget.com/futures/usdt/XAUUSDT',
    captionEn: 'Bitget futures: XAUUSDT',
    captionZh: 'Bitget 合約：XAUUSDT',
  },
  {
    id: 'bitget-announcements',
    kind: 'announcement',
    url: 'https://www.bitget.com/support/sections/5955811737113',
    captionEn: 'Bitget announcements / notices',
    captionZh: 'Bitget 公告／通知',
  },
  // —— Major news outlets (gold / macro) ——
  {
    id: 'reuters-gold',
    kind: 'news',
    url: 'https://www.reuters.com/markets/commodities/',
    captionEn: 'Reuters: Commodities / markets',
    captionZh: '路透：大宗商品／市場',
  },
  {
    id: 'bloomberg-gold',
    kind: 'news',
    url: 'https://www.bloomberg.com/markets/commodities',
    captionEn: 'Bloomberg: Commodities',
    captionZh: '彭博：大宗商品',
  },
  {
    id: 'cnbc-gold',
    kind: 'news',
    url: 'https://www.cnbc.com/gold/',
    captionEn: 'CNBC: Gold',
    captionZh: 'CNBC：黃金',
  },
  {
    id: 'wsj-markets',
    kind: 'news',
    url: 'https://www.wsj.com/finance/markets',
    captionEn: 'WSJ: Markets',
    captionZh: '華爾街日報：市場',
  },
  {
    id: 'ft-commodities',
    kind: 'news',
    url: 'https://www.ft.com/commodities',
    captionEn: 'Financial Times: Commodities',
    captionZh: '金融時報：大宗商品',
  },
  {
    id: 'marketwatch-gold',
    kind: 'news',
    url: 'https://www.marketwatch.com/investing/future/gc00',
    captionEn: 'MarketWatch: Gold continuous (GC00)',
    captionZh: 'MarketWatch：黃金連續合約 GC00',
  },
  {
    id: 'investing-gold',
    kind: 'news',
    url: 'https://www.investing.com/commodities/gold',
    captionEn: 'Investing.com: Gold',
    captionZh: 'Investing.com：黃金',
  },
  {
    id: 'kitco-home',
    kind: 'news',
    url: 'https://www.kitco.com/news/category/metals',
    captionEn: 'Kitco: Metals news desk',
    captionZh: 'Kitco：金屬新聞台',
  },
  {
    id: 'kitco-survey',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-30/wall-street-abandons-ship-after-gold-sinks-below-3900oz-main-street',
    captionEn: 'Kitco survey: Wall Street turns bearish after gold sinks below $3,900',
    captionZh: 'Kitco 調查：金價跌破 3,900 後華爾街轉空',
    opinion: true,
    opinionTone: 'risk',
  },
  {
    id: 'kitco-paradox',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-30/golds-frustrating-paradox-falling-yields-and-weaker-dollar-cant-stop',
    captionEn: "Kitco: Gold's paradox — falling yields/weaker USD can't stop selloff",
    captionZh: 'Kitco：收益率下行與美元走弱仍擋不住金價拋售',
    opinion: true,
    opinionTone: 'opportunity',
  },
  {
    id: 'kitco-hawkish-pause',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-29/gold-remains-stuck-fed-takes-hawkish-pause-tds-melek',
    captionEn: 'Kitco / TDS: Gold stuck as Fed takes hawkish pause',
    captionZh: 'Kitco / TDS：聯準會鷹派暫停，金價受困',
    opinion: true,
    opinionTone: 'risk',
  },
  {
    id: 'kitco-rates-holdback',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-wants-rally-threat-higher-interest-rates-holding-it-back-catalyst',
    captionEn: 'Kitco: Higher-rate threat holding gold rally back',
    captionZh: 'Kitco：利率上行威脅壓制金價反彈',
    opinion: true,
    opinionTone: 'risk',
  },
  {
    id: 'cme-comex',
    kind: 'exchange',
    url: 'https://www.cmegroup.com/markets/metals/precious/gold.html',
    captionEn: 'CME Group: COMEX Gold futures',
    captionZh: 'CME Group：COMEX 黃金期貨',
  },
  {
    id: 'lbma',
    kind: 'indicator',
    url: 'https://www.lbma.org.uk/prices-and-data/precious-metal-prices',
    captionEn: 'LBMA: Precious metal prices & data',
    captionZh: 'LBMA：貴金屬價格與數據',
  },
]

function domainOf(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    // Prefer public site marks over API CDN hosts for the logo popup.
    if (host.includes('yahoo.com')) return 'finance.yahoo.com'
    if (host.includes('okx.com')) return 'okx.com'
    if (host.includes('bitget.com')) return 'bitget.com'
    if (host.includes('binance.com')) return 'binance.com'
    if (host.includes('bybit.com')) return 'bybit.com'
    if (host.includes('federalreserve.gov')) return 'federalreserve.gov'
    if (host.includes('gold-api.com')) return 'gold-api.com'
    if (host.includes('reuters.com')) return 'reuters.com'
    if (host.includes('bloomberg.com')) return 'bloomberg.com'
    if (host.includes('cnbc.com')) return 'cnbc.com'
    if (host.includes('kitco.com')) return 'kitco.com'
    if (host.includes('cmegroup.com')) return 'cmegroup.com'
    if (host.includes('lbma.org.uk')) return 'lbma.org.uk'
    if (host.includes('investing.com')) return 'investing.com'
    if (host.includes('marketwatch.com')) return 'marketwatch.com'
    if (host.includes('wsj.com')) return 'wsj.com'
    if (host.includes('ft.com')) return 'ft.com'
    return host
  } catch {
    return url
  }
}

function logoFor(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

function makeSource(
  id: string,
  url: string,
  captionEn: string,
  captionZh: string,
  kind: SourceKind,
  health: SourceHealthStatus,
  checkedAt: number,
  extra?: { latencyMs?: number; detail?: string },
): ReportSource {
  const domain = domainOf(url)
  return {
    id,
    captionEn,
    captionZh,
    url,
    domain,
    logoUrl: logoFor(domain),
    kind,
    health,
    checkedAt,
    latencyMs: extra?.latencyMs,
    detail: extra?.detail,
  }
}

async function probeCatalogEntry(entry: CatalogEntry): Promise<{
  source: ReportSource
  json: unknown | null
}> {
  const started = performance.now()
  const checkedAt = Date.now()
  if (entry.json) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(entry.url, {
        signal: ctrl.signal,
        cache: 'no-store',
        mode: 'cors',
      })
      clearTimeout(timer)
      const latencyMs = Math.round(performance.now() - started)
      if (!res.ok) {
        return {
          source: makeSource(
            entry.id,
            entry.url,
            entry.captionEn,
            entry.captionZh,
            entry.kind,
            res.status >= 500 ? 'down' : 'degraded',
            checkedAt,
            { latencyMs, detail: `HTTP ${res.status}` },
          ),
          json: null,
        }
      }
      const json = await res.json()
      return {
        source: makeSource(
          entry.id,
          entry.url,
          entry.captionEn,
          entry.captionZh,
          entry.kind,
          'ok',
          checkedAt,
          { latencyMs, detail: 'JSON OK' },
        ),
        json,
      }
    } catch (e) {
      return {
        source: makeSource(
          entry.id,
          entry.url,
          entry.captionEn,
          entry.captionZh,
          entry.kind,
          'down',
          checkedAt,
          { detail: e instanceof Error ? e.message.slice(0, 80) : 'fetch failed' },
        ),
        json: null,
      }
    }
  }

  // HTML / announcement / news — no-cors reachability
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    await fetch(entry.url, {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'no-cors',
      method: 'GET',
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    return {
      source: makeSource(
        entry.id,
        entry.url,
        entry.captionEn,
        entry.captionZh,
        entry.kind,
        'ok',
        checkedAt,
        { latencyMs, detail: 'Reachable (opaque)' },
      ),
      json: null,
    }
  } catch (e) {
    return {
      source: makeSource(
        entry.id,
        entry.url,
        entry.captionEn,
        entry.captionZh,
        entry.kind,
        'down',
        checkedAt,
        { detail: e instanceof Error ? e.message.slice(0, 80) : 'unreachable' },
      ),
      json: null,
    }
  }
}

function hourKeySgt(ts = Date.now()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(ts)).map((p) => [p.type, p.value]),
  ) as Record<string, string>
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}`
}

/** One line only — strip to a single sentence / clause. */
function clampOneLine(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  const parts = trimmed.split(/(?<=[.!?。！？])\s+/).filter(Boolean)
  const first = parts[0] || trimmed
  return first.length > 160 ? `${first.slice(0, 157).trimEnd()}…` : first
}

function rankPoints(
  rows: Omit<RankedPoint, 'rank'>[],
): RankedPoint[] {
  return rows.slice(0, 4).map((r, i) => ({
    ...r,
    rank: i + 1,
    en: clampOneLine(r.en),
    zh: clampOneLine(r.zh),
  }))
}

/** Single one-line TL;DR — synthesizes live prints; does not copy Opportunity/Risk news. */
function buildOneLineTldr(args: {
  dxy: number | null
  tnx: number | null
  okxPx: number | null
  spotLive: number | null
  opportunity: RankedPoint[]
  risk: RankedPoint[]
}): RankedPoint[] {
  const bitsEn: string[] = []
  const bitsZh: string[] = []
  const sourceIds: string[] = []

  if (args.okxPx != null) {
    bitsEn.push(`OKX XAU ${args.okxPx.toFixed(2)}`)
    bitsZh.push(`OKX 金 ${args.okxPx.toFixed(2)}`)
    sourceIds.push('okx-ticker')
  }
  if (args.spotLive != null) {
    bitsEn.push(`spot ${args.spotLive.toFixed(2)}`)
    bitsZh.push(`現貨 ${args.spotLive.toFixed(2)}`)
    sourceIds.push('gold-api')
  }
  if (args.dxy != null) {
    bitsEn.push(`DXY ${args.dxy.toFixed(2)}`)
    bitsZh.push(`美元指數 ${args.dxy.toFixed(2)}`)
    sourceIds.push('yahoo-dxy')
  }
  if (args.tnx != null) {
    bitsEn.push(`10Y ${args.tnx.toFixed(2)}%`)
    bitsZh.push(`10Y ${args.tnx.toFixed(2)}%`)
    sourceIds.push('yahoo-tnx')
  }

  const nOpp = args.opportunity.length
  const nRisk = args.risk.length
  const tailEn =
    nOpp || nRisk
      ? ` · ${nRisk} risk / ${nOpp} opportunity — details below`
      : ' · no ranked signals this hour'
  const tailZh =
    nOpp || nRisk
      ? ` · ${nRisk} 風險／${nOpp} 機會 — 詳見下方`
      : ' · 本小時無排序要點'

  const coreEn = bitsEn.length ? bitsEn.join(' · ') : 'XAUUSD desk scan'
  const coreZh = bitsZh.length ? bitsZh.join(' · ') : 'XAUUSD 工作台掃報'

  return [
    {
      rank: 1,
      en: clampOneLine(coreEn + tailEn),
      zh: clampOneLine(coreZh + tailZh),
      sourceIds: [...new Set(sourceIds)],
    },
  ]
}

function yahooLastClose(data: unknown): number | null {
  try {
    const chart = data as {
      chart?: { result?: { meta?: { regularMarketPrice?: number }; indicators?: { quote?: { close?: (number | null)[] }[] } }[] }
    }
    const meta = chart.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof meta === 'number' && Number.isFinite(meta)) return meta
    const closes = chart.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    for (let i = closes.length - 1; i >= 0; i--) {
      const v = closes[i]
      if (typeof v === 'number' && Number.isFinite(v)) return v
    }
  } catch {
    /* ignore */
  }
  return null
}

function fedLatestHeadline(data: unknown): { title: string; link: string } | null {
  try {
    const rows = data as { title?: string; link?: string; type?: string }[]
    if (!Array.isArray(rows)) return null
    const hit = rows.find((r) => r?.title && r?.link)
    if (!hit?.title || !hit?.link) return null
    return { title: String(hit.title), link: String(hit.link) }
  } catch {
    return null
  }
}

function okxLast(data: unknown): number | null {
  try {
    const row = (data as { data?: { last?: string }[] })?.data?.[0]
    const n = Number(row?.last)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function goldApiPrice(data: unknown): number | null {
  try {
    const n = Number((data as { price?: number })?.price)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function okxFundingRate(data: unknown): number | null {
  try {
    const row = (data as { data?: { fundingRate?: string }[] })?.data?.[0]
    const n = Number(row?.fundingRate)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function bitgetLast(data: unknown): number | null {
  try {
    const row = (data as { data?: { lastPr?: string }[] | { lastPr?: string } })?.data
    const last = Array.isArray(row) ? row[0]?.lastPr : row?.lastPr
    const n = Number(last)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** OKX candles: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm] newest-first */
function okxCandles(data: unknown): KlineBar[] {
  try {
    const rows = (data as { data?: string[][] })?.data
    if (!Array.isArray(rows)) return []
    const bars: KlineBar[] = []
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 5) continue
      const t = Number(row[0])
      const o = Number(row[1])
      const h = Number(row[2])
      const l = Number(row[3])
      const c = Number(row[4])
      const v = Number(row[5])
      if (![t, o, h, l, c].every((n) => Number.isFinite(n))) continue
      bars.push({
        t,
        o,
        h,
        l,
        c,
        v: Number.isFinite(v) ? v : undefined,
      })
    }
    // Oldest → newest for charting
    return bars.sort((a, b) => a.t - b.t)
  } catch {
    return []
  }
}

function normalizeSource(s: ReportSource, fallbackTs: number): ReportSource {
  return {
    ...s,
    kind: s.kind || 'news',
    health: s.health || 'unchecked',
    checkedAt: typeof s.checkedAt === 'number' ? s.checkedAt : fallbackTs,
  }
}

export function loadHourlyReports(): HourlyMarketReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HourlyMarketReport[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, 48).map((r) => ({
      ...r,
      sources: (r.sources || []).map((s) => normalizeSource(s, r.createdAt)),
      sentiment: r.sentiment ?? computeSentiment(r.opportunity || [], r.risk || []),
      kline: r.kline ?? null,
    }))
  } catch {
    return []
  }
}

export function saveHourlyReports(list: HourlyMarketReport[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, 48)))
}

/** Rank weight: #1 most urgent → 25, then 20 / 15 / 10. */
function rankWeight(rank: number): number {
  const w = 25 - (Math.max(1, Math.min(4, rank)) - 1) * 5
  return w
}

export function computeSentiment(
  opportunity: RankedPoint[],
  risk: RankedPoint[],
): SentimentBarometer {
  let raw = 0
  for (const p of opportunity) raw += rankWeight(p.rank)
  for (const p of risk) raw -= rankWeight(p.rank)
  const score = Math.max(-100, Math.min(100, Math.round(raw)))

  let band: SentimentBandId = 'neutral'
  if (score <= -50) band = 'bearish'
  else if (score <= -15) band = 'cautious'
  else if (score >= 50) band = 'bullish'
  else if (score >= 15) band = 'constructive'

  const palette: Record<SentimentBandId, { color: string; labelEn: string; labelZh: string }> = {
    bearish: { color: '#991b1b', labelEn: 'Bearish', labelZh: '偏空' },
    cautious: { color: '#c2410c', labelEn: 'Cautious', labelZh: '偏谨慎' },
    neutral: { color: '#a16207', labelEn: 'Neutral', labelZh: '中性' },
    constructive: { color: '#15803d', labelEn: 'Constructive', labelZh: '偏建设性' },
    bullish: { color: '#166534', labelEn: 'Bullish', labelZh: '偏多' },
  }

  const meta = palette[band]
  const definitionEn = [
    'Score range: −100 (bearish) → 0 (neutral) → +100 (bullish) for XAUUSD desk tone.',
    'Each Opportunity point adds +25 / +20 / +15 / +10 by urgency rank (#1–#4).',
    'Each Risk point subtracts the same weights (−25 / −20 / −15 / −10).',
    'Bands: ≤−50 Bearish · −49…−15 Cautious · −14…+14 Neutral · +15…+49 Constructive · ≥+50 Bullish.',
    'Only scored from listed Opportunity/Risk points this hour — never invented. Empty lists → 0 Neutral.',
  ]
  const definitionZh = [
    '分數區間：−100（偏空）→ 0（中性）→ +100（偏多），針對 XAUUSD 工作台語氣。',
    '每條「機會」按緊急度排名加分：#1–#4 為 +25 / +20 / +15 / +10。',
    '每條「風險」按同樣權重減分：−25 / −20 / −15 / −10。',
    '分檔：≤−50 偏空 · −49…−15 偏謹慎 · −14…+14 中性 · +15…+49 偏建設性 · ≥+50 偏多。',
    '僅依據本小時列出的機會／風險要點計分，不編造。兩邊皆空 → 0 中性。',
  ]

  if (opportunity.length === 0 && risk.length === 0) {
    return {
      score: 0,
      band: 'neutral',
      labelEn: 'Neutral',
      labelZh: '中性',
      color: palette.neutral.color,
      definitionEn,
      definitionZh,
    }
  }

  return {
    score,
    band,
    labelEn: meta.labelEn,
    labelZh: meta.labelZh,
    color: meta.color,
    definitionEn,
    definitionZh,
  }
}

export function msUntilNextHourSgt(now = Date.now()): number {
  const key = hourKeySgt(now)
  // Advance one hour in SGT by constructing the next bucket boundary via UTC offset +8
  const [datePart, hourPart] = key.split('T')
  const y = Number(datePart!.slice(0, 4))
  const m = Number(datePart!.slice(5, 7))
  const d = Number(datePart!.slice(8, 10))
  const h = Number(hourPart)
  // SGT = UTC+8 → next hour start as UTC ms
  const nextUtc = Date.UTC(y, m - 1, d, h + 1, 0, 0, 0) - 8 * HOUR_MS
  return Math.max(5_000, nextUtc - now + 1_000)
}

export async function generateHourlyScan(args: {
  health: SourceHealth[]
  composite: number | null
  spot: number | null
  extraCitations?: BriefingCitation[]
}): Promise<HourlyMarketReport> {
  const createdAt = Date.now()
  const opportunityRaw: Omit<RankedPoint, 'rank'>[] = []
  const riskRaw: Omit<RankedPoint, 'rank'>[] = []

  // Probe full XAUUSD desk catalog in parallel — every entry stays in the source list.
  const probed = await Promise.all(SOURCE_CATALOG.map((e) => probeCatalogEntry(e)))
  const byId = new Map(probed.map((p) => [p.source.id, p]))
  const sources: ReportSource[] = probed.map((p) => p.source)

  const bumpCaption = (id: string, en: string, zh: string) => {
    const hit = sources.find((s) => s.id === id)
    if (!hit) return
    hit.captionEn = en
    hit.captionZh = zh
  }

  const dxy = yahooLastClose(byId.get('yahoo-dxy')?.json ?? null)
  if (dxy != null) {
    bumpCaption(
      'yahoo-dxy',
      `Yahoo DX-Y.NYB last ${dxy.toFixed(3)}`,
      `Yahoo 美元指數 DX-Y.NYB 最新 ${dxy.toFixed(3)}`,
    )
    if (dxy >= 104) {
      riskRaw.push({
        en: `DXY ${dxy.toFixed(3)} firm — USD headwind for XAUUSD.`,
        zh: `美元指數 ${dxy.toFixed(3)} 偏強 — 對 XAUUSD 構成逆風。`,
        sourceIds: ['yahoo-dxy'],
      })
    } else if (dxy <= 100) {
      opportunityRaw.push({
        en: `DXY ${dxy.toFixed(3)} soft — near-term USD headwind easing.`,
        zh: `美元指數 ${dxy.toFixed(3)} 偏弱 — 短期美元逆風減輕。`,
        sourceIds: ['yahoo-dxy'],
      })
    }
  }

  const tnx = yahooLastClose(byId.get('yahoo-tnx')?.json ?? null)
  if (tnx != null) {
    bumpCaption(
      'yahoo-tnx',
      `Yahoo ^TNX (US 10Y) last ${tnx.toFixed(3)}%`,
      `Yahoo ^TNX（美債 10 年）最新 ${tnx.toFixed(3)}%`,
    )
    if (tnx >= 4.2) {
      riskRaw.push({
        en: `US 10Y ${tnx.toFixed(3)}% elevated — rate pressure on gold.`,
        zh: `美債 10 年 ${tnx.toFixed(3)}% 偏高 — 利率壓力壓抑金價。`,
        sourceIds: ['yahoo-tnx'],
      })
    } else if (tnx <= 3.5) {
      opportunityRaw.push({
        en: `US 10Y ${tnx.toFixed(3)}% soft — constructive for XAUUSD if it holds.`,
        zh: `美債 10 年 ${tnx.toFixed(3)}% 偏軟 — 若延續對 XAUUSD 偏建設性。`,
        sourceIds: ['yahoo-tnx'],
      })
    }
  }

  const fed = fedLatestHeadline(byId.get('fed-press-json')?.json ?? null)
  if (fed) {
    const fedUrl = fed.link.startsWith('http')
      ? fed.link
      : `https://www.federalreserve.gov${fed.link}`
    sources.push(
      makeSource(
        'fed-press-item',
        fedUrl,
        `Fed press: ${fed.title}`,
        `聯準會新聞：${fed.title}`,
        'announcement',
        'ok',
        Date.now(),
        { detail: 'From ne-press.json' },
      ),
    )
    riskRaw.push({
      en: `Fed press: ${fed.title} — calendar context only.`,
      zh: `聯準會新聞：${fed.title} — 僅作日程背景。`,
      sourceIds: ['fed-press-item', 'fed-press-json'],
    })
  }

  const spotLive = goldApiPrice(byId.get('gold-api')?.json ?? null)
  if (spotLive != null) {
    bumpCaption(
      'gold-api',
      `gold-api XAU spot ${spotLive.toFixed(2)}`,
      `gold-api XAU 現貨 ${spotLive.toFixed(2)}`,
    )
  }

  const okxPx = okxLast(byId.get('okx-ticker')?.json ?? null)
  if (okxPx != null) {
    bumpCaption(
      'okx-ticker',
      `OKX XAU-USDT-SWAP last ${okxPx.toFixed(2)}`,
      `OKX XAU-USDT-SWAP 最新 ${okxPx.toFixed(2)}`,
    )
    if (spotLive != null) {
      const basisBps = ((okxPx - spotLive) / spotLive) * 10_000
      if (Math.abs(basisBps) >= 25) {
        riskRaw.push({
          en: `OKX vs spot basis ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps — wide; check venue/LP.`,
          zh: `OKX 對現貨基差 ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps — 偏寬，核對場所／LP。`,
          sourceIds: ['okx-ticker', 'gold-api'],
        })
      } else {
        opportunityRaw.push({
          en: `OKX vs spot basis ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps — no extreme dislocation.`,
          zh: `OKX 對現貨基差 ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps — 無極端錯位。`,
          sourceIds: ['okx-ticker', 'gold-api'],
        })
      }
    }
  }

  const funding = okxFundingRate(byId.get('okx-funding')?.json ?? null)
  if (funding != null) {
    const pct = funding * 100
    bumpCaption(
      'okx-funding',
      `OKX XAU-USDT-SWAP funding ${pct.toFixed(4)}%`,
      `OKX XAU-USDT-SWAP 資金費率 ${pct.toFixed(4)}%`,
    )
    if (Math.abs(pct) >= 0.05) {
      riskRaw.push({
        en: `OKX funding ${pct.toFixed(4)}% — elevated perp stress risk.`,
        zh: `OKX 資金費率 ${pct.toFixed(4)}% — 永續持倉壓力偏高。`,
        sourceIds: ['okx-funding'],
      })
    }
  }

  const bitgetPx = bitgetLast(byId.get('bitget-ticker')?.json ?? null)
  if (bitgetPx != null && okxPx != null) {
    bumpCaption(
      'bitget-ticker',
      `Bitget XAUUSDT last ${bitgetPx.toFixed(2)}`,
      `Bitget XAUUSDT 最新 ${bitgetPx.toFixed(2)}`,
    )
    const crossBps = ((bitgetPx - okxPx) / okxPx) * 10_000
    if (Math.abs(crossBps) >= 20) {
      riskRaw.push({
        en: `Bitget vs OKX ${crossBps >= 0 ? '+' : ''}${crossBps.toFixed(1)} bps — check liquidity before one mid.`,
        zh: `Bitget 對 OKX ${crossBps >= 0 ? '+' : ''}${crossBps.toFixed(1)} bps — 先核對流動性再取中間價。`,
        sourceIds: ['bitget-ticker', 'okx-ticker'],
      })
    }
  }

  const gc = yahooLastClose(byId.get('yahoo-gc')?.json ?? null)
  if (gc != null) {
    bumpCaption(
      'yahoo-gc',
      `Yahoo COMEX GC=F last ${gc.toFixed(2)}`,
      `Yahoo COMEX GC=F 最新 ${gc.toFixed(2)}`,
    )
  }

  const candleBars = okxCandles(byId.get('okx-candles')?.json ?? null)
  let kline: HourlyKlineSeries | null = null
  if (candleBars.length > 0) {
    const last = candleBars[candleBars.length - 1]
    bumpCaption(
      'okx-candles',
      `OKX XAU-USDT-SWAP 1H K-line · ${candleBars.length} bars · last ${last.c.toFixed(2)}`,
      `OKX XAU-USDT-SWAP 1H K 線 · ${candleBars.length} 根 · 最新 ${last.c.toFixed(2)}`,
    )
    kline = {
      symbol: 'XAU-USDT-SWAP',
      interval: '1H',
      sourceId: 'okx-candles',
      bars: candleBars,
    }
  }

  // Desk health from live monitor (always attach as a source with freshness)
  const alertSources = args.health.filter((h) => h.health === 'alert' || h.health === 'watch')
  sources.push(
    makeSource(
      'vex-monitor-composite',
      'https://vex-llm-proxy.vercel.app/#/market/health',
      args.composite != null
        ? `V Exchange desk composite ${args.composite.toFixed(2)}; watch/alert=${alertSources.length}`
        : 'V Exchange desk composite unavailable',
      args.composite != null
        ? `V Exchange 工作台綜合價 ${args.composite.toFixed(2)}；關注／警報=${alertSources.length}`
        : 'V Exchange 工作台綜合價不可用',
      'indicator',
      args.composite != null ? 'ok' : 'degraded',
      createdAt,
      { detail: 'Local monitor tick' },
    ),
  )
  if (alertSources.length >= 2 && args.composite != null) {
    const ids = alertSources.slice(0, 4).map((h) => h.id)
    riskRaw.push({
      en: `Desk: ${alertSources.length} watch/alert (${ids.join(', ')}) vs composite ${args.composite.toFixed(2)}.`,
      zh: `工作台：${alertSources.length} 個關注／警報（${ids.join('、')}），綜合價 ${args.composite.toFixed(2)}。`,
      sourceIds: ['vex-monitor-composite'],
    })
  }

  const vexNoteEn =
    'V Exchange proprietary indicators: placeholder only — feed not connected; no indicator points this hour.'
  const vexNoteZh =
    'V Exchange 自有指標：目前僅為占位，數據源未接入；本小時無指標要點。'

  // Opinion headlines only (one line) — full article lives in Sources, never restated in TL;DR
  for (const entry of SOURCE_CATALOG.filter((e) => e.opinion)) {
    const hit = byId.get(entry.id)
    if (!hit || hit.source.health !== 'ok') continue
    const point = {
      en: entry.captionEn,
      zh: entry.captionZh,
      sourceIds: [entry.id],
    }
    if (entry.opinionTone === 'opportunity') opportunityRaw.push(point)
    else riskRaw.push(point)
  }

  for (const c of args.extraCitations || []) {
    if (sources.some((s) => s.id === c.id || s.url === c.url)) continue
    sources.push(
      makeSource(c.id, c.url, c.label, c.label, 'news', 'unchecked', createdAt, {
        detail: 'Imported briefing citation',
      }),
    )
  }

  // Stable order: kind groups then id
  const kindOrder: SourceKind[] = [
    'price',
    'api',
    'indicator',
    'macro',
    'exchange',
    'announcement',
    'news',
  ]
  sources.sort((a, b) => {
    const ka = kindOrder.indexOf(a.kind)
    const kb = kindOrder.indexOf(b.kind)
    if (ka !== kb) return ka - kb
    return a.id.localeCompare(b.id)
  })

  const opportunity = rankPoints(opportunityRaw)
  const risk = rankPoints(riskRaw)
  // One-line TL;DR from live prints only — does not repeat Opportunity/Risk news lines
  const tldr = buildOneLineTldr({
    dxy,
    tnx,
    okxPx: okxPx ?? null,
    spotLive: spotLive ?? null,
    opportunity,
    risk,
  })
  const sentiment = computeSentiment(opportunity, risk)

  return {
    id: `hourly_${createdAt}`,
    createdAt,
    hourKey: hourKeySgt(createdAt),
    tldr,
    opportunity,
    risk,
    sources,
    sentiment,
    kline,
    vexPlaceholder: true,
    vexNoteEn,
    vexNoteZh,
  }
}

export const EMPTY_SECTION_EN = 'No points this hour.'
export const EMPTY_SECTION_ZH = '本小時暫無要點。'
