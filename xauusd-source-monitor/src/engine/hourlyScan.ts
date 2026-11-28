/**
 * Hourly Market Condition scan — bilingual TL;DR / Opportunity / Risk.
 * Never invents points: empty sections say so explicitly.
 */
import type { BriefingCitation, SourceHealth } from '../types'

export type ReportSectionKind = 'tldr' | 'opportunity' | 'risk'

export type SourceKind =
  | 'news'
  | 'social'
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
  /** Primary venue K-line (Binance XAUUSDT; OKX backup) for the report chart */
  kline: HourlyKlineSeries | null
  /** CFD pricing indicators are placeholders until ops provides the feed */
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
/** Primary venue for market reports — Binance USDT-M XAUUSDT perp. */
const BINANCE_TICKER = 'https://fapi.binance.com/fapi/v1/ticker/price?symbol=XAUUSDT'
const BINANCE_FUNDING = 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=XAUUSDT'
const BINANCE_CANDLES =
  'https://fapi.binance.com/fapi/v1/klines?symbol=XAUUSDT&interval=1h&limit=36'
const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_FUNDING = 'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP'
const OKX_CANDLES =
  'https://www.okx.com/api/v5/market/candles?instId=XAU-USDT-SWAP&bar=1H&limit=36'
const BITGET_TICKER =
  'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT'

type CatalogEntry = {
  id: string
  kind: SourceKind
  /** Probe URL (may be a JSON API). */
  url: string
  /**
   * Human-facing page for citations in Lark / desk (exchange K-line, news, social).
   * When set, ReportSource.url uses this — never expose raw JSON APIs in reports.
   */
  linkUrl?: string
  captionEn: string
  captionZh: string
  /** Prefer JSON CORS probe when true */
  json?: boolean
  /** When true, a reachable opinion/news URL can feed Risk/Opportunity text */
  opinion?: boolean
  opinionTone?: 'risk' | 'opportunity'
  /** Informative Opportunity/Risk bullet summarizing the article (not just the headline) */
  summaryEn?: string
  summaryZh?: string
}

/**
 * Human-facing Binance XAUUSDT perpetual K-line (TradingView — geo-safe).
 */
export const BINANCE_KLINE_URL =
  'https://www.tradingview.com/chart/?symbol=BINANCE%3AXAUUSDT.P'

/**
 * Human-facing OKX XAU perpetual K-line (backup venue).
 * Direct okx.com/trade-swap/… 404s in several regions (e.g. SG) — TradingView
 * chart for OKX:XAUUSDT.P stays reachable for desk viewing.
 */
export const OKX_KLINE_URL =
  'https://www.tradingview.com/chart/?symbol=OKX%3AXAUUSDT.P'

/** Kitco gold chart — `/gold-price` returns HTTP 404. */
export const KITCO_GOLD_URL = 'https://www.kitco.com/charts/gold'

/** Bitget support hub — old `/support/sections/…` deep links 404. */
export const BITGET_SUPPORT_URL = 'https://www.bitget.com/support'

const CITE_PROBE_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (compatible; VE-RiskDesk/1.0; +https://quote-ai-troubleshooting-bot.vercel.app)',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
}

/** True only for proven missing pages (do not treat timeouts / bot-blocks as 404). */
export function isMissingHttpStatus(status: number | null | undefined): boolean {
  return status === 404 || status === 410
}

/** HEAD/GET status for a human cite URL. `null` = unreachable / aborted (not proven 404). */
export async function probeCiteHttpStatus(url: string, timeoutMs = 8000): Promise<number | null> {
  const target = (url || '').trim()
  if (!/^https?:\/\//i.test(target)) return null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    let res = await fetch(target, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: CITE_PROBE_HEADERS,
      cache: 'no-store',
    })
    // Some CDNs reject HEAD — fall back to GET (body discarded).
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      res = await fetch(target, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: CITE_PROBE_HEADERS,
        cache: 'no-store',
      })
    }
    clearTimeout(timer)
    return res.status
  } catch {
    return null
  }
}

/** Stable public page when a deep link 404s (same desk / publisher). */
export function citeFallbackUrl(url: string, id = ''): string | null {
  const u = url || ''
  const key = id.toLowerCase()
  if (/okx\.com/i.test(u) && /trade|swap/i.test(u)) return OKX_KLINE_URL
  if (/kitco\.com/i.test(u)) {
    if (/\/news\//i.test(u) || key.startsWith('kitco-')) {
      return 'https://www.kitco.com/news/category/metals'
    }
    return KITCO_GOLD_URL
  }
  if (/bitget\.com/i.test(u) && /support|announc/i.test(u)) return BITGET_SUPPORT_URL
  if (/bitget\.com/i.test(u)) return 'https://www.bitget.com/futures/usdt/XAUUSDT'
  if (/binance\.com/i.test(u) && /fapi|\bapi\b/i.test(u)) return BINANCE_KLINE_URL
  if (/binance\.com/i.test(u)) return 'https://www.binance.com/en/futures/XAUUSDT'
  if (/bybit\.com/i.test(u)) return 'https://www.bybit.com/trade/usdt/XAUUSDT'
  if (/federalreserve\.gov/i.test(u)) {
    return 'https://www.federalreserve.gov/newsevents/pressreleases.htm'
  }
  if (/ecb\.europa\.eu/i.test(u)) return 'https://www.ecb.europa.eu/press/pr/html/index.en.html'
  if (/treasury\.gov/i.test(u)) return 'https://home.treasury.gov/news/press-releases'
  if (/imf\.org/i.test(u)) return 'https://www.imf.org/en/News'
  if (/bis\.org/i.test(u)) return 'https://www.bis.org/'
  if (/bls\.gov/i.test(u)) return 'https://www.bls.gov/'
  if (/coindesk\.com/i.test(u)) return 'https://www.coindesk.com/markets/'
  if (/theblock\.co/i.test(u)) return 'https://www.theblock.co/latest'
  if (/cointelegraph\.com/i.test(u)) return 'https://cointelegraph.com/tags/markets'
  if (/decrypt\.co/i.test(u)) return 'https://decrypt.co/news'
  if (/gold\.org/i.test(u)) return 'https://www.gold.org/goldhub'
  if (/caixinglobal\.com/i.test(u)) return 'https://www.caixinglobal.com/'
  if (/fred\.stlouisfed\.org|stlouisfed\.org/i.test(u)) {
    return 'https://fred.stlouisfed.org/'
  }
  if (/tradingview\.com/i.test(u) && /BINANCE/i.test(u)) return BINANCE_KLINE_URL
  if (/tradingview\.com/i.test(u)) return OKX_KLINE_URL
  return null
}

/**
 * Resolve a citation URL that is not HTTP 404/410.
 * Rewrites to a stable fallback when the primary page is missing; returns null if still missing.
 */
export async function resolveCiteUrlOrNull(
  url: string,
  id = '',
): Promise<{ url: string; status: number | null; rewritten: boolean } | null> {
  const primary = (url || '').trim()
  if (!primary) return null
  const st = await probeCiteHttpStatus(primary)
  if (!isMissingHttpStatus(st)) {
    return { url: primary, status: st, rewritten: false }
  }
  const fb = citeFallbackUrl(primary, id)
  if (!fb || fb === primary) return null
  const st2 = await probeCiteHttpStatus(fb)
  if (isMissingHttpStatus(st2)) return null
  return { url: fb, status: st2, rewritten: true }
}

/** Default human UI when a JSON probe has no explicit linkUrl. */
function humanLinkFor(id: string, probeUrl: string): string {
  switch (id) {
    case 'binance-ticker':
    case 'binance-candles':
    case 'binance-funding':
      return BINANCE_KLINE_URL
    case 'okx-ticker':
    case 'okx-candles':
    case 'okx-funding':
      return OKX_KLINE_URL
    case 'bitget-ticker':
      return 'https://www.bitget.com/futures/usdt/XAUUSDT'
    case 'gold-api':
      return KITCO_GOLD_URL
    case 'yahoo-gc':
      return 'https://finance.yahoo.com/quote/GC=F'
    case 'yahoo-dxy':
      return 'https://finance.yahoo.com/quote/DX-Y.NYB'
    case 'yahoo-tnx':
      return 'https://finance.yahoo.com/quote/%5ETNX'
    case 'fed-press-json':
      return 'https://www.federalreserve.gov/newsevents/pressreleases.htm'
    default:
      // Never cite query1.finance.yahoo / api.* JSON hosts in reports
      if (/\/api\/|query1\.finance\.yahoo|gold-api\.com|ne-press\.json/i.test(probeUrl)) {
        return 'https://quote-ai-troubleshooting-bot.vercel.app/#/market'
      }
      return probeUrl
  }
}

/**
 * Major XAUUSD-perp desk coverage: news, KOL social, exchange announcements,
 * APIs, prices, and macro/indicator feeds. Always listed with health + checkedAt.
 */
const SOURCE_CATALOG: CatalogEntry[] = [
  // —— Prices / APIs / indicators ——
  // Binance is primary for market reports; OKX kept as backup.
  {
    id: 'binance-ticker',
    kind: 'api',
    url: BINANCE_TICKER,
    linkUrl: BINANCE_KLINE_URL,
    captionEn: 'Binance XAUUSDT.P K-line (TradingView)',
    captionZh: 'Binance XAUUSDT.P K线（TradingView）',
    json: true,
  },
  {
    id: 'binance-candles',
    kind: 'price',
    url: BINANCE_CANDLES,
    linkUrl: BINANCE_KLINE_URL,
    captionEn: 'Binance XAUUSDT.P 1H K-line (TradingView)',
    captionZh: 'Binance XAUUSDT.P 1H K线（TradingView）',
    json: true,
  },
  {
    id: 'binance-funding',
    kind: 'indicator',
    url: BINANCE_FUNDING,
    linkUrl: BINANCE_KLINE_URL,
    captionEn: 'Binance XAUUSDT.P funding / K-line (TradingView)',
    captionZh: 'Binance XAUUSDT.P 资金费率／K线（TradingView）',
    json: true,
  },
  {
    id: 'okx-ticker',
    kind: 'api',
    url: OKX_TICKER,
    linkUrl: OKX_KLINE_URL,
    captionEn: 'OKX XAUUSDT.P K-line (TradingView · backup)',
    captionZh: 'OKX XAUUSDT.P K线（TradingView · 备用）',
    json: true,
  },
  {
    id: 'okx-candles',
    kind: 'price',
    url: OKX_CANDLES,
    linkUrl: OKX_KLINE_URL,
    captionEn: 'OKX XAUUSDT.P 1H K-line (TradingView · backup)',
    captionZh: 'OKX XAUUSDT.P 1H K线（TradingView · 备用）',
    json: true,
  },
  {
    id: 'okx-funding',
    kind: 'indicator',
    url: OKX_FUNDING,
    linkUrl: OKX_KLINE_URL,
    captionEn: 'OKX XAUUSDT.P funding / K-line (TradingView · backup)',
    captionZh: 'OKX XAUUSDT.P 资金费率／K线（TradingView · 备用）',
    json: true,
  },
  {
    id: 'bitget-ticker',
    kind: 'api',
    url: BITGET_TICKER,
    linkUrl: 'https://www.bitget.com/futures/usdt/XAUUSDT',
    captionEn: 'Bitget XAUUSDT perpetual / K-line',
    captionZh: 'Bitget XAUUSDT 永续／K线',
    json: true,
  },
  {
    id: 'gold-api',
    kind: 'price',
    url: GOLD_API,
    linkUrl: KITCO_GOLD_URL,
    captionEn: 'Kitco gold spot price',
    captionZh: 'Kitco 黄金现货价',
    json: true,
  },
  {
    id: 'yahoo-gc',
    kind: 'price',
    url: YAHOO_GC,
    linkUrl: 'https://finance.yahoo.com/quote/GC=F',
    captionEn: 'Yahoo COMEX gold GC=F chart',
    captionZh: 'Yahoo COMEX 黄金 GC=F 行情',
    json: true,
  },
  {
    id: 'yahoo-dxy',
    kind: 'macro',
    url: YAHOO_DXY,
    linkUrl: 'https://finance.yahoo.com/quote/DX-Y.NYB',
    captionEn: 'Yahoo Dollar Index chart',
    captionZh: 'Yahoo 美元指数行情',
    json: true,
  },
  {
    id: 'yahoo-tnx',
    kind: 'macro',
    url: YAHOO_TNX,
    linkUrl: 'https://finance.yahoo.com/quote/%5ETNX',
    captionEn: 'Yahoo US 10Y yield chart',
    captionZh: 'Yahoo 美债10年收益率行情',
    json: true,
  },
  {
    id: 'fed-press-json',
    kind: 'announcement',
    url: FED_PRESS,
    linkUrl: 'https://www.federalreserve.gov/newsevents/pressreleases.htm',
    captionEn: 'Federal Reserve press releases',
    captionZh: '美联储新闻稿',
    json: true,
  },
  // —— Exchange venues / official announcements ——
  {
    id: 'okx-trade',
    kind: 'exchange',
    url: OKX_KLINE_URL,
    captionEn: 'OKX XAUUSDT.P K-line (TradingView)',
    captionZh: 'OKX XAUUSDT.P K线（TradingView）',
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
    url: BITGET_SUPPORT_URL,
    captionEn: 'Bitget announcements / notices',
    captionZh: 'Bitget 公告／通知',
  },
  // —— Major news: finance / commodities (authoritative desks) ——
  {
    id: 'reuters-markets',
    kind: 'news',
    url: 'https://www.reuters.com/markets/',
    captionEn: 'Reuters: Markets',
    captionZh: '路透：市場',
  },
  {
    id: 'reuters-gold',
    kind: 'news',
    url: 'https://www.reuters.com/markets/commodities/',
    captionEn: 'Reuters: Commodities / markets',
    captionZh: '路透：大宗商品／市場',
  },
  {
    id: 'bloomberg-markets',
    kind: 'news',
    url: 'https://www.bloomberg.com/markets',
    captionEn: 'Bloomberg: Markets',
    captionZh: '彭博：市場',
  },
  {
    id: 'bloomberg-gold',
    kind: 'news',
    url: 'https://www.bloomberg.com/markets/commodities',
    captionEn: 'Bloomberg: Commodities',
    captionZh: '彭博：大宗商品',
  },
  {
    id: 'cnbc-markets',
    kind: 'news',
    url: 'https://www.cnbc.com/markets/',
    captionEn: 'CNBC: Markets',
    captionZh: 'CNBC：市場',
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
    id: 'ft-markets',
    kind: 'news',
    url: 'https://www.ft.com/markets',
    captionEn: 'Financial Times: Markets',
    captionZh: '金融時報：市場',
  },
  {
    id: 'ft-commodities',
    kind: 'news',
    url: 'https://www.ft.com/commodities',
    captionEn: 'Financial Times: Commodities',
    captionZh: '金融時報：大宗商品',
  },
  {
    id: 'ap-business',
    kind: 'news',
    url: 'https://apnews.com/business',
    captionEn: 'AP News: Business',
    captionZh: '美联社：商业／财经',
  },
  {
    id: 'nikkei-asia-markets',
    kind: 'news',
    url: 'https://asia.nikkei.com/Business/Markets',
    captionEn: 'Nikkei Asia: Markets',
    captionZh: '日经亚洲：市场',
  },
  {
    id: 'caixin-global',
    kind: 'news',
    url: 'https://www.caixinglobal.com/',
    captionEn: 'Caixin Global: China finance / macro',
    captionZh: '财新国际：中国财经／宏观',
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
  // —— Crypto desks (authoritative coin-circle coverage) ——
  {
    id: 'coindesk-markets',
    kind: 'news',
    url: 'https://www.coindesk.com/markets/',
    captionEn: 'CoinDesk: Markets',
    captionZh: 'CoinDesk：加密市场',
  },
  {
    id: 'coindesk-policy',
    kind: 'news',
    url: 'https://www.coindesk.com/policy/',
    captionEn: 'CoinDesk: Policy / regulation',
    captionZh: 'CoinDesk：政策／监管',
  },
  {
    id: 'theblock-news',
    kind: 'news',
    url: 'https://www.theblock.co/latest',
    captionEn: 'The Block: Latest crypto news',
    captionZh: 'The Block：加密新闻',
  },
  {
    id: 'cointelegraph-markets',
    kind: 'news',
    url: 'https://cointelegraph.com/tags/markets',
    captionEn: 'Cointelegraph: Markets',
    captionZh: 'Cointelegraph：市场',
  },
  {
    id: 'decrypt-news',
    kind: 'news',
    url: 'https://decrypt.co/news',
    captionEn: 'Decrypt: Crypto news',
    captionZh: 'Decrypt：加密新闻',
  },
  {
    id: 'binance-research',
    kind: 'news',
    url: 'https://www.binance.com/en/research',
    captionEn: 'Binance Research',
    captionZh: 'Binance Research 研报',
  },
  {
    id: 'coinmarketcap-news',
    kind: 'news',
    url: 'https://coinmarketcap.com/headlines/news/',
    captionEn: 'CoinMarketCap: News headlines',
    captionZh: 'CoinMarketCap：新闻头条',
  },
  // —— Macro / official institutions ——
  {
    id: 'ecb-press',
    kind: 'announcement',
    url: 'https://www.ecb.europa.eu/press/pr/html/index.en.html',
    captionEn: 'ECB: Press releases',
    captionZh: '欧洲央行：新闻稿',
  },
  {
    id: 'ecb-monetary',
    kind: 'macro',
    url: 'https://www.ecb.europa.eu/press/press_conference/html/index.en.html',
    captionEn: 'ECB: Monetary policy press conferences',
    captionZh: '欧洲央行：货币政策记者会',
  },
  {
    id: 'ustreasury-press',
    kind: 'announcement',
    url: 'https://home.treasury.gov/news/press-releases',
    captionEn: 'US Treasury: Press releases',
    captionZh: '美国财政部：新闻稿',
  },
  {
    id: 'bls-cpi',
    kind: 'macro',
    url: 'https://www.bls.gov/cpi/',
    captionEn: 'BLS: Consumer Price Index (CPI)',
    captionZh: '美国劳工统计局：CPI 通胀',
  },
  {
    id: 'bea-gdp',
    kind: 'macro',
    url: 'https://www.bea.gov/data/gdp/gross-domestic-product',
    captionEn: 'BEA: US GDP',
    captionZh: '美国经济分析局：GDP',
  },
  {
    id: 'imf-news',
    kind: 'macro',
    url: 'https://www.imf.org/en/News',
    captionEn: 'IMF: News',
    captionZh: '国际货币基金组织：新闻',
  },
  {
    id: 'bis-speeches',
    kind: 'macro',
    url: 'https://www.bis.org/',
    captionEn: 'BIS: Bank for International Settlements',
    captionZh: '国际清算银行（BIS）',
  },
  {
    id: 'worldbank-news',
    kind: 'macro',
    url: 'https://www.worldbank.org/en/news',
    captionEn: 'World Bank: News',
    captionZh: '世界银行：新闻',
  },
  {
    id: 'wgc-news',
    kind: 'news',
    url: 'https://www.gold.org/goldhub/gold-focus',
    captionEn: 'World Gold Council: Gold Focus',
    captionZh: '世界黄金协会：Gold Focus',
  },
  {
    id: 'fred-home',
    kind: 'macro',
    url: 'https://fred.stlouisfed.org/',
    captionEn: 'FRED: St. Louis Fed economic data',
    captionZh: 'FRED：圣路易斯联储经济数据',
  },
  {
    id: 'kitco-survey',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-30/wall-street-abandons-ship-after-gold-sinks-below-3900oz-main-street',
    captionEn: 'Kitco survey: Wall Street turns bearish after gold sinks below $3,900',
    captionZh: 'Kitco 調查：金價跌破 3,900 後華爾街轉空',
    opinion: true,
    opinionTone: 'risk',
    summaryEn:
      'Kitco News Weekly Gold Survey: after spot gold broke below $3,900 (weekly low near $3,870 — weakest in over a year) amid a hawkish Fed hold, firm GDP/PCE, and Friday tech-led liquidation, Wall Street flipped sharply bearish — only 1 of 16 analysts (6%) expect a rebound next week vs 63% looking for further losses — while Main Street stayed narrowly bullish (53%); several desks flag a possible extension toward roughly $3,750–$3,850 if support fails.',
    summaryZh:
      'Kitco 每週黃金調查：現貨金跌破 3,900（週低約 3,870，逾一年最弱），背景是聯準會鷹派按兵不動、GDP／核心 PCE 偏強，以及週五科技股帶動的貴金屬被迫平倉；華爾街轉空明顯——16 位分析師中僅 1 位（6%）看反彈、63% 看續跌，Main Street 仍以 53% 窄幅偏多；多家機構指出若支撐失守，可能延伸至約 3,750–3,850。',
  },
  {
    id: 'kitco-paradox',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-30/golds-frustrating-paradox-falling-yields-and-weaker-dollar-cant-stop',
    captionEn: "Kitco: Gold's paradox — falling yields/weaker USD can't stop selloff",
    captionZh: 'Kitco：收益率下行與美元走弱仍擋不住金價拋售',
    opinion: true,
    opinionTone: 'opportunity',
    summaryEn:
      'Kitco: even after a Fed hold, sharply lower yields and a softer dollar — the classic support mix for non-yielding gold — prices still fell about 3% on the week below $3,900, their weakest level in over a year, as traders price higher-for-longer policy and Iran-linked oil inflation; Kitco argues the long-term fundamentals are intact and frames the selloff as frustrating short-term action that still leaves lower prices as long-term buying opportunities.',
    summaryZh:
      'Kitco：即便聯準會按兵不動、債息明顯下行、美元走軟——傳統上利好無孳息黃金——金價仍週跌約 3%、跌破 3,900，創逾一年低位，因市場定價「更高更久」利率與伊朗相關油價通脹；文中認為長期基本面未破，將此輪拋售視為短期挫折，並把更低價位視為長期買入機會。',
  },
  {
    id: 'kitco-hawkish-pause',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-29/gold-remains-stuck-fed-takes-hawkish-pause-tds-melek',
    captionEn: 'Kitco / TDS: Gold stuck as Fed takes hawkish pause',
    captionZh: 'Kitco / TDS：聯準會鷹派暫停，金價受困',
    opinion: true,
    opinionTone: 'risk',
    summaryEn:
      'Kitco / TD Securities (Bart Melek): the Fed left rates unchanged but kept a hawkish focus on returning inflation to 2%, leaving gold consolidating near key levels with TDS seeing a roughly $3,900–$4,250 range; Melek expects higher carry and opportunity cost while long-end yields stay restrictive, so a material near-term rebound looks unlikely even though TDS is not calling for a rout.',
    summaryZh:
      'Kitco／道明證券（Bart Melek）：聯準會維持利率不變但仍鷹派盯住 2% 通脹目標，金價在關鍵位附近盤整，TDS 預期大致落在 3,900–4,250；Melek 認為長端利率仍偏緊、持有黃金的機會成本上升，短期難有實質反彈，但也未預期崩盤式下跌。',
  },
  {
    id: 'kitco-rates-holdback',
    kind: 'news',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-wants-rally-threat-higher-interest-rates-holding-it-back-catalyst',
    captionEn: 'Kitco: Higher-rate threat holding gold rally back',
    captionZh: 'Kitco：利率上行威脅壓制金價反彈',
    opinion: true,
    opinionTone: 'risk',
    summaryEn:
      'Kitco / Catalyst Funds (David Miller): spot gold slid below $3,900 (about −3% on the week, weakest in roughly a year) as sticky inflation and higher-for-longer rate expectations outweighed softer yields and a weaker dollar; Miller frames the move as a correction after large 2024–25 gains rather than a broken bull thesis, with speculative flows weak while longer-term holders and sovereign demand still underpin the metal.',
    summaryZh:
      'Kitco／Catalyst Funds（David Miller）：現貨金跌破 3,900（週跌約 3%，約一年低位），黏性通脹與「更高更久」利率預期蓋過債息回落與美元走弱；Miller 將此視為 2024–25 大漲後的回調而非多頭論述破裂，短線投機流偏弱，但長線持有者與官方部門需求仍構成支撐。',
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
  // —— KOL / social media (gold & macro desks) ——
  {
    id: 'kol-x-kitco',
    kind: 'social',
    url: 'https://x.com/KitcoNewsNow',
    captionEn: 'KOL · X: Kitco News (@KitcoNewsNow)',
    captionZh: 'KOL · X：Kitco News（@KitcoNewsNow）',
  },
  {
    id: 'kol-x-goldtelegraph',
    kind: 'social',
    url: 'https://x.com/GoldTelegraph',
    captionEn: 'KOL · X: Gold Telegraph (@GoldTelegraph)',
    captionZh: 'KOL · X：Gold Telegraph（@GoldTelegraph）',
  },
  {
    id: 'kol-x-peterschiff',
    kind: 'social',
    url: 'https://x.com/PeterSchiff',
    captionEn: 'KOL · X: Peter Schiff (@PeterSchiff)',
    captionZh: 'KOL · X：Peter Schiff（@PeterSchiff）',
  },
  {
    id: 'kol-x-lynalden',
    kind: 'social',
    url: 'https://x.com/LynAldenContact',
    captionEn: 'KOL · X: Lyn Alden (@LynAldenContact)',
    captionZh: 'KOL · X：Lyn Alden（@LynAldenContact）',
  },
  {
    id: 'kol-x-lukegromen',
    kind: 'social',
    url: 'https://x.com/LukeGromen',
    captionEn: 'KOL · X: Luke Gromen (@LukeGromen)',
    captionZh: 'KOL · X：Luke Gromen（@LukeGromen）',
  },
  {
    id: 'kol-x-zerohedge',
    kind: 'social',
    url: 'https://x.com/zerohedge',
    captionEn: 'KOL · X: ZeroHedge (@zerohedge)',
    captionZh: 'KOL · X：ZeroHedge（@zerohedge）',
  },
  {
    id: 'kol-x-davidlin',
    kind: 'social',
    url: 'https://x.com/DavidLin_TV',
    captionEn: 'KOL · X: David Lin (@DavidLin_TV)',
    captionZh: 'KOL · X：David Lin（@DavidLin_TV）',
  },
  {
    id: 'kol-x-tfmetals',
    kind: 'social',
    url: 'https://x.com/TFMetals',
    captionEn: 'KOL · X: TF Metals Report (@TFMetals)',
    captionZh: 'KOL · X：TF Metals Report（@TFMetals）',
  },
  {
    id: 'kol-x-jsblokland',
    kind: 'social',
    url: 'https://x.com/jsblokland',
    captionEn: 'KOL · X: Jan Nieuwenhuijs / BlindOwl (@jsblokland)',
    captionZh: 'KOL · X：Jan Nieuwenhuijs／BlindOwl（@jsblokland）',
  },
  {
    id: 'kol-x-allthingsgold',
    kind: 'social',
    url: 'https://x.com/AllThingsGold',
    captionEn: 'KOL · X: All Things Gold (@AllThingsGold)',
    captionZh: 'KOL · X：All Things Gold（@AllThingsGold）',
  },
  {
    id: 'kol-x-raoulgmi',
    kind: 'social',
    url: 'https://x.com/RaoulGMI',
    captionEn: 'KOL · X: Raoul Pal / Real Vision (@RaoulGMI)',
    captionZh: 'KOL · X：Raoul Pal／Real Vision（@RaoulGMI）',
  },
  {
    id: 'kol-x-coindesk',
    kind: 'social',
    url: 'https://x.com/CoinDesk',
    captionEn: 'KOL · X: CoinDesk (@CoinDesk)',
    captionZh: 'KOL · X：CoinDesk（@CoinDesk）',
  },
  {
    id: 'kol-x-theblock',
    kind: 'social',
    url: 'https://x.com/TheBlock__',
    captionEn: 'KOL · X: The Block (@TheBlock__)',
    captionZh: 'KOL · X：The Block（@TheBlock__）',
  },
  {
    id: 'kol-x-wublockchain',
    kind: 'social',
    url: 'https://x.com/WuBlockchain',
    captionEn: 'KOL · X: Wu Blockchain (@WuBlockchain)',
    captionZh: 'KOL · X：吴说区块链（@WuBlockchain）',
  },
  {
    id: 'kol-x-adambutton',
    kind: 'social',
    url: 'https://x.com/AdamButton',
    captionEn: 'KOL · X: Adam Button (@AdamButton)',
    captionZh: 'KOL · X：Adam Button（@AdamButton）',
  },
  {
    id: 'kol-x-northmantrader',
    kind: 'social',
    url: 'https://x.com/NorthmanTrader',
    captionEn: 'KOL · X: NorthmanTrader (@NorthmanTrader)',
    captionZh: 'KOL · X：NorthmanTrader（@NorthmanTrader）',
  },
  {
    id: 'kol-yt-kitco',
    kind: 'social',
    url: 'https://www.youtube.com/kitconews',
    captionEn: 'KOL · YouTube: Kitco NEWS',
    captionZh: 'KOL · YouTube：Kitco NEWS',
  },
  {
    id: 'kol-yt-davidlin',
    kind: 'social',
    url: 'https://www.youtube.com/@DavidLin',
    captionEn: 'KOL · YouTube: David Lin',
    captionZh: 'KOL · YouTube：David Lin',
  },
  {
    id: 'kol-yt-realvision',
    kind: 'social',
    url: 'https://www.youtube.com/@RealVision',
    captionEn: 'KOL · YouTube: Real Vision',
    captionZh: 'KOL · YouTube：Real Vision',
  },
  {
    id: 'kol-stocktwits-xauusd',
    kind: 'social',
    url: 'https://stocktwits.com/symbol/XAUUSD',
    captionEn: 'KOL · StockTwits: XAUUSD chatter',
    captionZh: 'KOL · StockTwits：XAUUSD 社群討論',
  },
]

/** Desk bullets are statements — drop interrogatives / trailing ? prompts. */
function stripQuestions(text: string): string {
  return text
    .replace(/\?\s*/g, '. ')
    .replace(/\s+\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

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
    if (host.includes('coindesk.com')) return 'coindesk.com'
    if (host.includes('theblock.co')) return 'theblock.co'
    if (host.includes('cointelegraph.com')) return 'cointelegraph.com'
    if (host.includes('ecb.europa.eu')) return 'ecb.europa.eu'
    if (host.includes('treasury.gov')) return 'treasury.gov'
    if (host.includes('imf.org')) return 'imf.org'
    if (host.includes('bis.org')) return 'bis.org'
    if (host.includes('gold.org')) return 'gold.org'
    if (host.includes('stlouisfed.org') || host.includes('fred.stlouisfed.org')) {
      return 'fred.stlouisfed.org'
    }
    if (host.includes('cnbc.com')) return 'cnbc.com'
    if (host.includes('kitco.com')) return 'kitco.com'
    if (host.includes('cmegroup.com')) return 'cmegroup.com'
    if (host.includes('lbma.org.uk')) return 'lbma.org.uk'
    if (host.includes('investing.com')) return 'investing.com'
    if (host.includes('marketwatch.com')) return 'marketwatch.com'
    if (host.includes('wsj.com')) return 'wsj.com'
    if (host.includes('ft.com')) return 'ft.com'
    if (host === 'x.com' || host.includes('twitter.com')) return 'x.com'
    if (host.includes('youtube.com') || host === 'youtu.be') return 'youtube.com'
    if (host.includes('stocktwits.com')) return 'stocktwits.com'
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
  let domain = domainOf(url)
  // Keep venue favicon when the click-through is the geo-safe TradingView chart
  if (/tradingview\.com/i.test(domain) && /BINANCE/i.test(url)) {
    domain = 'binance.com'
  } else if (/tradingview\.com/i.test(domain) && /OKX|XAUUSDT/i.test(url)) {
    domain = 'okx.com'
  }
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

/** Citation URL for Lark / desk — human UI, never raw JSON probe hosts. */
function citeUrl(entry: CatalogEntry): string {
  return entry.linkUrl || humanLinkFor(entry.id, entry.url)
}

/**
 * Ensure the human cite URL is not HTTP 404/410 before attaching it to a source.
 * Missing pages rewrite to a stable fallback; still-missing → `down` (not cited in 早报).
 */
async function finalizeCiteSource(
  entry: CatalogEntry,
  base: ReportSource,
  json: unknown | null,
): Promise<{ source: ReportSource; json: unknown | null }> {
  const resolved = await resolveCiteUrlOrNull(base.url, entry.id)
  if (!resolved) {
    return {
      source: {
        ...base,
        health: 'down',
        detail: `${base.detail || 'cite'} · cite URL HTTP 404/410 (not linked)`,
      },
      json,
    }
  }
  if (resolved.rewritten) {
    return {
      source: makeSource(
        entry.id,
        resolved.url,
        entry.captionEn,
        entry.captionZh,
        entry.kind,
        base.health === 'ok' ? 'degraded' : base.health,
        base.checkedAt,
        {
          latencyMs: base.latencyMs,
          detail: `${base.detail || 'ok'} · cite rewritten (primary 404)`,
        },
      ),
      json,
    }
  }
  if (base.url !== resolved.url) {
    return { source: { ...base, url: resolved.url }, json }
  }
  return { source: base, json }
}

async function probeCatalogEntry(entry: CatalogEntry): Promise<{
  source: ReportSource
  json: unknown | null
}> {
  const started = performance.now()
  const checkedAt = Date.now()
  const displayUrl = citeUrl(entry)
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
        return finalizeCiteSource(
          entry,
          makeSource(
            entry.id,
            displayUrl,
            entry.captionEn,
            entry.captionZh,
            entry.kind,
            res.status >= 500 ? 'down' : 'degraded',
            checkedAt,
            { latencyMs, detail: `HTTP ${res.status}` },
          ),
          null,
        )
      }
      const json = await res.json()
      return finalizeCiteSource(
        entry,
        makeSource(
          entry.id,
          displayUrl,
          entry.captionEn,
          entry.captionZh,
          entry.kind,
          'ok',
          checkedAt,
          { latencyMs, detail: 'JSON OK' },
        ),
        json,
      )
    } catch (e) {
      return finalizeCiteSource(
        entry,
        makeSource(
          entry.id,
          displayUrl,
          entry.captionEn,
          entry.captionZh,
          entry.kind,
          'down',
          checkedAt,
          { detail: e instanceof Error ? e.message.slice(0, 80) : 'fetch failed' },
        ),
        null,
      )
    }
  }

  // HTML / announcement / news — status-aware GET (no opaque no-cors: that hides 404s)
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(entry.url, {
      signal: ctrl.signal,
      cache: 'no-store',
      method: 'GET',
      redirect: 'follow',
      headers: CITE_PROBE_HEADERS,
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    if (isMissingHttpStatus(res.status)) {
      return finalizeCiteSource(
        entry,
        makeSource(
          entry.id,
          displayUrl,
          entry.captionEn,
          entry.captionZh,
          entry.kind,
          'down',
          checkedAt,
          { latencyMs, detail: `HTTP ${res.status}` },
        ),
        null,
      )
    }
    // 401/403/5xx: page may still open in a browser — keep URL, mark degraded when blocked
    const health: SourceHealthStatus =
      res.ok || res.status === 401 || res.status === 403 ? (res.ok ? 'ok' : 'degraded') : 'degraded'
    return finalizeCiteSource(
      entry,
      makeSource(
        entry.id,
        displayUrl,
        entry.captionEn,
        entry.captionZh,
        entry.kind,
        health,
        checkedAt,
        {
          latencyMs,
          detail: res.ok ? 'Reachable' : `HTTP ${res.status} (cite kept; not 404)`,
        },
      ),
      null,
    )
  } catch (e) {
    // X / YouTube often block automated browser probes; keep KOL rows listed.
    if (entry.kind === 'social') {
      try {
        const fav = logoFor(domainOf(displayUrl))
        const ctrl2 = new AbortController()
        const timer2 = setTimeout(() => ctrl2.abort(), 4000)
        const res = await fetch(fav, { signal: ctrl2.signal, cache: 'no-store', mode: 'cors' })
        clearTimeout(timer2)
        const latencyMs = Math.round(performance.now() - started)
        if (res.ok) {
          return {
            source: makeSource(
              entry.id,
              displayUrl,
              entry.captionEn,
              entry.captionZh,
              entry.kind,
              'ok',
              checkedAt,
              {
                latencyMs,
                detail: 'KOL listed (profile probe blocked; favicon OK)',
              },
            ),
            json: null,
          }
        }
      } catch {
        /* fall through to degraded */
      }
      return {
        source: makeSource(
          entry.id,
          displayUrl,
          entry.captionEn,
          entry.captionZh,
          entry.kind,
          'degraded',
          checkedAt,
          {
            detail: 'KOL listed — open profile manually (host blocked probe)',
          },
        ),
        json: null,
      }
    }
    // Timeout / network: not proven 404 — keep cite URL for end users
    return {
      source: makeSource(
        entry.id,
        displayUrl,
        entry.captionEn,
        entry.captionZh,
        entry.kind,
        'degraded',
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

/** Lark mobile card ≈ chars/line (CJK wraps tighter than Latin). */
const MOBILE_CHARS_PER_LINE_CJK = 22
const MOBILE_CHARS_PER_LINE_LATIN = 42

function mobileCharBudget(text: string, maxLines: number): number {
  const hasCjk = /[\u4e00-\u9fff]/.test(text)
  return maxLines * (hasCjk ? MOBILE_CHARS_PER_LINE_CJK : MOBILE_CHARS_PER_LINE_LATIN)
}

/** Cut to budget at a word / CJK boundary; always end with sentence punctuation. */
function hardCapClause(text: string, maxChars: number): string {
  const cleaned = text.trim().replace(/\s+/g, ' ')
  if (!cleaned) return ''
  if (cleaned.length <= maxChars) {
    return /[.。!！?？]$/.test(cleaned) ? cleaned : `${cleaned.replace(/[,，;；:\-—–…]+$/g, '')}.`
  }
  const cut = cleaned.slice(0, maxChars)
  const at = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('。'),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('！'),
    cut.lastIndexOf('? '),
    cut.lastIndexOf('？'),
    cut.lastIndexOf(', '),
    cut.lastIndexOf('，'),
    cut.lastIndexOf('；'),
    cut.lastIndexOf('; '),
    cut.lastIndexOf(' '),
  )
  let out = (at > maxChars * 0.4 ? cut.slice(0, at) : cut).trim()
  out = out
    .replace(/\b(the|a|an|on|of|to|for|and|or|as|with|that|this|their|its)\s*$/i, '')
    .replace(/[，,;；:\-—–…]+\s*$/g, '')
    .trim()
  if (!out) out = cut.trim()
  return /[.。!！?？]$/.test(out) ? out : `${out}.`
}

/**
 * Opportunity / Risk / TL;DR beat body:
 * - Prefer complete sentences
 * - Hard-cap ~3 mobile lines (Lark phone width) and at most 3 sentences
 */
export function clampSummary(
  text: string,
  opts?: { maxChars?: number; maxSentences?: number; maxLines?: number },
): string {
  const maxLines = opts?.maxLines ?? 3
  const maxChars = opts?.maxChars ?? mobileCharBudget(text, maxLines)
  const maxSentences = opts?.maxSentences ?? 3

  const cleaned = stripQuestions(text.trim().replace(/\s+/g, ' '))
  if (!cleaned) return ''

  const sentences = cleaned
    .split(/(?<=[.。!！?？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const finish = (s: string) => {
    const t = s.trim()
    if (!t) return ''
    return /[.。!！?？]$/.test(t) ? t : `${t}.`
  }

  // No clear sentence breaks — hard-cap to mobile budget (never keep a 5–7 line run-on)
  if (sentences.length <= 1) {
    return hardCapClause(cleaned, maxChars)
  }

  const picked: string[] = []
  let len = 0
  for (const s of sentences) {
    if (picked.length >= maxSentences) break
    const nextLen = picked.length === 0 ? s.length : len + 1 + s.length
    if (picked.length > 0 && nextLen > maxChars) break
    if (picked.length === 0 && s.length > maxChars) {
      return hardCapClause(s, maxChars)
    }
    picked.push(s)
    len = nextLen
  }

  let out = picked.join(' ').trim()
  if (out.length > maxChars) out = hardCapClause(out, maxChars)
  else if (out && !/[.。!！?？]$/.test(out)) out = `${out}.`
  return finish(out)
}

function rankPoints(
  rows: Omit<RankedPoint, 'rank'>[],
): RankedPoint[] {
  return rows.slice(0, 4).map((r, i) => ({
    ...r,
    rank: i + 1,
    en: clampSummary(r.en, { maxLines: 3, maxSentences: 3 }),
    zh: clampSummary(r.zh, { maxLines: 3, maxSentences: 3 }),
  }))
}

/** Short clause for TL;DR — ≤ ~3 mobile lines; complete thought only; never “on the…”. */
function gistClause(text: string, maxChars?: number): string {
  const cleaned = stripQuestions(text.trim().replace(/\s+/g, ' '))
  if (!cleaned) return ''
  const budget = maxChars ?? mobileCharBudget(cleaned, 3)
  const first =
    cleaned.split(/(?<=[.。!！])\s+/).filter(Boolean)[0]?.replace(/[.。!！]+$/, '') || cleaned
  if (first.length <= budget) return first.trim()

  // Prefer a complete left side before em-dash when that side is already a full idea
  const em = first.indexOf(' — ')
  if (em >= Math.min(36, budget * 0.4) && em <= budget) return first.slice(0, em).trim()

  const cut = first.slice(0, budget)
  const at = Math.max(
    cut.lastIndexOf(', '),
    cut.lastIndexOf('，'),
    cut.lastIndexOf('; '),
    cut.lastIndexOf('；'),
    cut.lastIndexOf(' '),
  )
  let out = (at > budget * 0.45 ? cut.slice(0, at) : cut).trim()
  out = out
    .replace(/\b(the|a|an|on|of|to|for|and|or|as|with|that|this|their|its)\s*$/i, '')
    .replace(/[，,;；:\-—–…]+\s*$/g, '')
    .trim()
  return out
}

function looksLikeTapePoint(text: string): boolean {
  return /\b(bps|basis|perp|spot|dislocation|溢价|溢價|基差|永续|永續|现货|現貨)\b/i.test(text)
}

/** News / macro / named-event style points (vs pure tape/basis). */
function looksLikeEventPoint(text: string): boolean {
  return /\b(Fed|FOMC|Powell|ECB|BOJ|CPI|NFP|Kitco|Bloomberg|Reuters|war|sanctions|oil|Iran|tariff|election|rate\s*cut|hold|hike|降息|加息|美联储|聯準會|央行|制裁|关税|關稅|战争|戰爭)\b/i.test(
    text,
  )
}

/**
 * TL;DR: ≤4 lines summarizing market trend + major event (if any).
 * Does not paste truncated Opportunity bullets; details stay in Opportunity / Risk.
 * Skips empty filler lines (“no ranked … this hour”).
 */
export function buildOneLineTldr(args: {
  dxy: number | null
  tnx: number | null
  /** Primary venue last (Binance preferred; OKX when Binance unavailable). */
  venuePx: number | null
  venueLabel?: 'binance' | 'okx'
  /** @deprecated use venuePx */
  okxPx?: number | null
  spotLive: number | null
  opportunity: RankedPoint[]
  risk: RankedPoint[]
}): RankedPoint[] {
  const sourceIds: string[] = []
  const printEn: string[] = []
  const printZh: string[] = []

  const venuePx = args.venuePx ?? args.okxPx ?? null
  const venue = args.venueLabel || (args.venuePx != null ? 'binance' : 'okx')
  if (venuePx != null) {
    if (venue === 'binance') {
      printEn.push(`Binance XAU ${venuePx.toFixed(2)}`)
      printZh.push(`Binance 金 ${venuePx.toFixed(2)}`)
      sourceIds.push('binance-ticker')
    } else {
      printEn.push(`OKX XAU ${venuePx.toFixed(2)}`)
      printZh.push(`OKX 金 ${venuePx.toFixed(2)}`)
      sourceIds.push('okx-ticker')
    }
  }
  if (args.spotLive != null) {
    printEn.push(`spot ${args.spotLive.toFixed(2)}`)
    printZh.push(`现货 ${args.spotLive.toFixed(2)}`)
    sourceIds.push('gold-api')
  }
  if (args.dxy != null) {
    printEn.push(`DXY ${args.dxy.toFixed(2)}`)
    printZh.push(`美元指数 ${args.dxy.toFixed(2)}`)
    sourceIds.push('yahoo-dxy')
  }
  if (args.tnx != null) {
    printEn.push(`10Y ${args.tnx.toFixed(2)}%`)
    printZh.push(`10Y ${args.tnx.toFixed(2)}%`)
    sourceIds.push('yahoo-tnx')
  }

  const ranked = [...args.opportunity, ...args.risk]
  for (const p of ranked.slice(0, 6)) sourceIds.push(...p.sourceIds)

  const tape =
    ranked.find((p) => looksLikeTapePoint(p.en) || looksLikeTapePoint(p.zh)) || null
  const event =
    ranked.find(
      (p) =>
        p !== tape &&
        (looksLikeEventPoint(p.en) || looksLikeEventPoint(p.zh) || !looksLikeTapePoint(p.en)),
    ) || null
  // Prefer a clearly event-like point when several non-tape candidates exist
  const eventPreferred =
    ranked.find(
      (p) => p !== tape && (looksLikeEventPoint(p.en) || looksLikeEventPoint(p.zh)),
    ) || event

  const linesEn: string[] = []
  const linesZh: string[] = []

  // 1) Live prints
  if (printEn.length) {
    linesEn.push(`Live: ${printEn.join(' · ')}.`)
    linesZh.push(`即时：${printZh.join(' · ')}。`)
  }

  // 2) Trend — tape/basis gist, else a short opportunity gist (≤3 mobile lines each)
  const trendSrc = tape || args.opportunity[0] || null
  if (trendSrc) {
    const gEn = gistClause(trendSrc.en)
    const gZh = gistClause(trendSrc.zh || trendSrc.en)
    if (gEn) linesEn.push(`Trend: ${gEn}.`)
    if (gZh) linesZh.push(`走势：${gZh}。`)
  }

  // 3) Major event — only when we have a distinct news/macro point
  if (eventPreferred && eventPreferred !== trendSrc) {
    const gEn = gistClause(eventPreferred.en)
    const gZh = gistClause(eventPreferred.zh || eventPreferred.en)
    if (gEn) linesEn.push(`Event: ${gEn}.`)
    if (gZh) linesZh.push(`事件：${gZh}。`)
  }

  // 4) Optional watch — top risk only if it adds something new (still within 4 lines)
  const watch = args.risk[0]
  if (
    watch &&
    watch !== trendSrc &&
    watch !== eventPreferred &&
    linesEn.length < 4
  ) {
    const gEn = gistClause(watch.en)
    const gZh = gistClause(watch.zh || watch.en)
    if (gEn) linesEn.push(`Watch: ${gEn}.`)
    if (gZh) linesZh.push(`关注：${gZh}。`)
  }

  // Hard cap — never more than 4 TL;DR lines; each beat ≤3 mobile lines
  const clampBeat = (line: string) => {
    const m = line.match(/^(Live:|Trend:|Event:|Watch:|即时：|走势：|事件：|关注：)\s*(.*)$/)
    if (!m) return clampSummary(line, { maxLines: 3, maxSentences: 2 })
    const body = clampSummary(m[2] || '', { maxLines: 3, maxSentences: 2 }).replace(/^[•\s]+/, '')
    return `${m[1]} ${body}`.replace(/\s+/g, ' ').trim()
  }
  const en = linesEn.slice(0, 4).map(clampBeat)
  const zh = linesZh.slice(0, 4).map(clampBeat)
  if (!en.length) {
    en.push('Trend: no live prints or ranked points this hour.')
    zh.push('走势：本小时暂无报价或排序要点。')
  }

  return [
    {
      rank: 1,
      en: en.join('\n'),
      zh: zh.join('\n'),
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

/** Binance USDT-M ticker/price or 24hr lastPrice. */
function binanceLast(data: unknown): number | null {
  try {
    const d = data as { price?: string; lastPrice?: string }
    const n = Number(d.price ?? d.lastPrice)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** Binance premiumIndex.lastFundingRate (decimal). */
function binanceFundingRate(data: unknown): number | null {
  try {
    const n = Number((data as { lastFundingRate?: string })?.lastFundingRate)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** Binance futures klines: [openTime, o, h, l, c, volume, ...] oldest-first. */
export function binanceCandles(data: unknown): KlineBar[] {
  try {
    if (!Array.isArray(data)) return []
    const bars: KlineBar[] = []
    for (const row of data) {
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
    return bars.sort((a, b) => a.t - b.t)
  } catch {
    return []
  }
}

function binanceInterval(bar: KlineIntervalBar): string {
  if (bar === '15m') return '15m'
  if (bar === '4H') return '4h'
  if (bar === '1D') return '1d'
  return '1h'
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

/** OKX candle bar sizes supported by the report K-line switcher */
export const KLINE_INTERVALS = [
  { bar: '15m', label: '15m', limit: 48 },
  { bar: '1H', label: '1H', limit: 36 },
  { bar: '4H', label: '4H', limit: 42 },
  { bar: '1D', label: '1D', limit: 60 },
] as const

export type KlineIntervalBar = (typeof KLINE_INTERVALS)[number]['bar']

/** OKX candles: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm] newest-first */
export function okxCandles(data: unknown): KlineBar[] {
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

/** Live OKX XAU-USDT-SWAP candles for an interval (browser CORS OK). */
export async function fetchOkxKline(
  bar: KlineIntervalBar,
  limit?: number,
  signal?: AbortSignal,
): Promise<HourlyKlineSeries> {
  const meta = KLINE_INTERVALS.find((i) => i.bar === bar) || KLINE_INTERVALS[1]
  const n = limit ?? meta.limit
  const url = `https://www.okx.com/api/v5/market/candles?instId=XAU-USDT-SWAP&bar=${encodeURIComponent(bar)}&limit=${n}`
  const res = await fetch(url, {
    signal,
    cache: 'no-store',
    mode: 'cors',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`OKX candles HTTP ${res.status}`)
  const json = (await res.json()) as { code?: string; msg?: string; data?: string[][] }
  if (json.code && json.code !== '0') {
    throw new Error(json.msg || `OKX candles code ${json.code}`)
  }
  const bars = okxCandles(json)
  if (bars.length === 0) throw new Error('OKX candles empty')
  return {
    symbol: 'XAU-USDT-SWAP',
    interval: bar,
    sourceId: 'okx-candles',
    bars,
  }
}

/** Live Binance XAUUSDT USDT-M candles. */
export async function fetchBinanceKline(
  bar: KlineIntervalBar,
  limit?: number,
  signal?: AbortSignal,
): Promise<HourlyKlineSeries> {
  const meta = KLINE_INTERVALS.find((i) => i.bar === bar) || KLINE_INTERVALS[1]
  const n = limit ?? meta.limit
  const interval = binanceInterval(bar)
  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=XAUUSDT&interval=${encodeURIComponent(interval)}&limit=${n}`
  const res = await fetch(url, {
    signal,
    cache: 'no-store',
    mode: 'cors',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Binance candles HTTP ${res.status}`)
  const json = (await res.json()) as unknown
  if (json && typeof json === 'object' && !Array.isArray(json) && 'code' in json) {
    const err = json as { code?: number; msg?: string }
    if (err.code && err.code !== 200) {
      throw new Error(err.msg || `Binance candles code ${err.code}`)
    }
  }
  const bars = binanceCandles(json)
  if (bars.length === 0) throw new Error('Binance candles empty')
  return {
    symbol: 'XAUUSDT',
    interval: bar,
    sourceId: 'binance-candles',
    bars,
  }
}

/**
 * Market-report K-line: Binance primary, OKX backup.
 * Prefer this over fetchOkxKline for cards / TF switcher.
 */
export async function fetchMarketKline(
  bar: KlineIntervalBar,
  limit?: number,
  signal?: AbortSignal,
): Promise<HourlyKlineSeries> {
  try {
    return await fetchBinanceKline(bar, limit, signal)
  } catch {
    return fetchOkxKline(bar, limit, signal)
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
      `Yahoo 美元指数 DX-Y.NYB 最新 ${dxy.toFixed(3)}`,
    )
    if (dxy >= 104) {
      riskRaw.push({
        en: `Yahoo DX-Y.NYB prints ${dxy.toFixed(3)}, a firm dollar backdrop that raises the FX opportunity cost of holding gold and typically pressures XAUUSD perps until the index cools.`,
        zh: `Yahoo 美元指数 DX-Y.NYB 报 ${dxy.toFixed(3)}，美元偏强推高持有黄金的汇率机会成本，通常会压抑 XAUUSD 永续，直至指数回软。`,
        sourceIds: ['yahoo-dxy'],
      })
    } else if (dxy <= 100) {
      opportunityRaw.push({
        en: `Yahoo DX-Y.NYB prints ${dxy.toFixed(3)}, a soft dollar backdrop that lowers FX headwinds for gold and is constructive for XAUUSD perps while the index stays subdued.`,
        zh: `Yahoo 美元指数 DX-Y.NYB 报 ${dxy.toFixed(3)}，美元偏弱减轻黄金的汇率逆风，指数维持偏软期间对 XAUUSD 永续偏建设性。`,
        sourceIds: ['yahoo-dxy'],
      })
    }
  }

  const tnx = yahooLastClose(byId.get('yahoo-tnx')?.json ?? null)
  if (tnx != null) {
    bumpCaption(
      'yahoo-tnx',
      `Yahoo ^TNX (US 10Y) last ${tnx.toFixed(3)}%`,
      `Yahoo ^TNX（美债 10 年）最新 ${tnx.toFixed(3)}%`,
    )
    if (tnx >= 4.2) {
      riskRaw.push({
        en: `Yahoo ^TNX (US 10Y) at ${tnx.toFixed(3)}% keeps real-rate pressure elevated, increasing the opportunity cost of non-yielding gold and weighing on XAUUSD while yields stay this high.`,
        zh: `Yahoo ^TNX（美債 10 年）報 ${tnx.toFixed(3)}%，實質利率壓力偏高，推升無孳息黃金的機會成本，收益率維持高位期間壓抑 XAUUSD。`,
        sourceIds: ['yahoo-tnx'],
      })
    } else if (tnx <= 3.5) {
      opportunityRaw.push({
        en: `Yahoo ^TNX (US 10Y) at ${tnx.toFixed(3)}% softens real-rate headwinds for gold, reducing the opportunity cost of holding XAUUSD while the 10Y stays this subdued.`,
        zh: `Yahoo ^TNX（美債 10 年）報 ${tnx.toFixed(3)}%，實質利率逆風減輕，10 年期維持偏軟期間降低持有 XAUUSD 的機會成本。`,
        sourceIds: ['yahoo-tnx'],
      })
    }
  }

  const fed = fedLatestHeadline(byId.get('fed-press-json')?.json ?? null)
  if (fed) {
    const fedUrl = fed.link.startsWith('http')
      ? fed.link
      : `https://www.federalreserve.gov${fed.link}`
    const fedCite = await resolveCiteUrlOrNull(fedUrl, 'fed-press-item')
    if (fedCite) {
      sources.push(
        makeSource(
          'fed-press-item',
          fedCite.url,
          `Fed press: ${fed.title}`,
          `聯準會新聞：${fed.title}`,
          'announcement',
          fedCite.rewritten ? 'degraded' : 'ok',
          Date.now(),
          {
            detail: fedCite.rewritten
              ? 'From ne-press.json · cite rewritten (primary 404)'
              : 'From ne-press.json',
          },
        ),
      )
      riskRaw.push({
        en: `Federal Reserve press item “${fed.title}” is on the calendar feed — treat it as event/policy context for gold rates pricing this hour, not as a confirmed market catalyst yet.`,
        zh: `聯準會新聞稿「${fed.title}」已出現在日程來源——本小時僅作黃金利率定價的事件／政策背景，尚未視為已確認的行情催化。`,
        sourceIds: ['fed-press-item', 'fed-press-json'],
      })
    }
  }

  const spotLive = goldApiPrice(byId.get('gold-api')?.json ?? null)
  if (spotLive != null) {
    bumpCaption(
      'gold-api',
      `Kitco gold spot ${spotLive.toFixed(2)}`,
      `Kitco 黄金现货 ${spotLive.toFixed(2)}`,
    )
  }

  // Primary venue = Binance; OKX kept as backup when Binance probe fails.
  const binancePx = binanceLast(byId.get('binance-ticker')?.json ?? null)
  const okxPx = okxLast(byId.get('okx-ticker')?.json ?? null)
  const venuePx = binancePx ?? okxPx
  const venueLabel: 'binance' | 'okx' | null =
    binancePx != null ? 'binance' : okxPx != null ? 'okx' : null
  const venueTickerId = venueLabel === 'binance' ? 'binance-ticker' : 'okx-ticker'
  const venueNameEn = venueLabel === 'binance' ? 'Binance XAUUSDT' : 'OKX XAU-USDT-SWAP'
  const venueNameZh = venueLabel === 'binance' ? 'Binance XAUUSDT' : 'OKX XAU-USDT-SWAP'

  if (binancePx != null) {
    bumpCaption(
      'binance-ticker',
      `Binance XAUUSDT last ${binancePx.toFixed(2)}`,
      `Binance XAUUSDT 最新 ${binancePx.toFixed(2)}`,
    )
  }
  if (okxPx != null) {
    bumpCaption(
      'okx-ticker',
      `OKX XAU-USDT-SWAP last ${okxPx.toFixed(2)} (backup)`,
      `OKX XAU-USDT-SWAP 最新 ${okxPx.toFixed(2)}（备用）`,
    )
  }
  if (venuePx != null && spotLive != null && venueLabel) {
    const basisBps = ((venuePx - spotLive) / spotLive) * 10_000
    if (Math.abs(basisBps) >= 25) {
      riskRaw.push({
        en: `${venueNameEn} last ${venuePx.toFixed(2)} vs Kitco spot ${spotLive.toFixed(2)} leaves a ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps futures–spot basis — wide enough to distort mid marks, venue prints, and LP hedges until the dislocation narrows.`,
        zh: `${venueNameZh} 最新 ${venuePx.toFixed(2)}，对 Kitco 现货 ${spotLive.toFixed(2)} 的期现基差为 ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps——偏宽，足以扭曲中间价、场所报价与 LP 对冲，直至错位收敛。`,
        sourceIds: [venueTickerId, 'gold-api'],
      })
    } else {
      opportunityRaw.push({
        en: `${venueNameEn} last ${venuePx.toFixed(2)} vs Kitco spot ${spotLive.toFixed(2)} shows only a ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps basis — perp and spot are aligned with no extreme dislocation this hour.`,
        zh: `${venueNameZh} 最新 ${venuePx.toFixed(2)}，对 Kitco 现货 ${spotLive.toFixed(2)} 基差仅 ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps——永续与现货对齐，本小时无极端错位。`,
        sourceIds: [venueTickerId, 'gold-api'],
      })
    }
  }

  const binanceFunding = binanceFundingRate(byId.get('binance-funding')?.json ?? null)
  const okxFunding = okxFundingRate(byId.get('okx-funding')?.json ?? null)
  const funding = binanceFunding ?? okxFunding
  const fundingId = binanceFunding != null ? 'binance-funding' : 'okx-funding'
  const fundingNameEn =
    binanceFunding != null ? 'Binance XAUUSDT' : 'OKX XAU-USDT-SWAP'
  const fundingNameZh = fundingNameEn
  if (funding != null) {
    const pct = funding * 100
    bumpCaption(
      fundingId,
      `${fundingNameEn} funding ${pct.toFixed(4)}%`,
      `${fundingNameZh} 资金费率 ${pct.toFixed(4)}%`,
    )
    if (Math.abs(pct) >= 0.05) {
      riskRaw.push({
        en: `${fundingNameEn} funding is ${pct.toFixed(4)}%, an elevated carry cost that signals crowded perp positioning and raises squeeze / rollover stress for leveraged XAUUSD books this hour.`,
        zh: `${fundingNameZh} 資金費率報 ${pct.toFixed(4)}%，持有成本偏高，顯示永續倉位擁擠，本小時槓桿 XAUUSD 賬本的軋空／展期壓力上升。`,
        sourceIds: [fundingId],
      })
    }
  }

  const bitgetPx = bitgetLast(byId.get('bitget-ticker')?.json ?? null)
  if (bitgetPx != null && venuePx != null && venueLabel) {
    bumpCaption(
      'bitget-ticker',
      `Bitget XAUUSDT last ${bitgetPx.toFixed(2)}`,
      `Bitget XAUUSDT 最新 ${bitgetPx.toFixed(2)}`,
    )
    const crossBps = ((bitgetPx - venuePx) / venuePx) * 10_000
    if (Math.abs(crossBps) >= 20) {
      riskRaw.push({
        en: `Bitget XAUUSDT last ${bitgetPx.toFixed(2)} vs ${venueNameEn} ${venuePx.toFixed(2)} is ${crossBps >= 0 ? '+' : ''}${crossBps.toFixed(1)} bps apart — a material cross-venue gap that can bias a single mid mark if liquidity is thinner on one side.`,
        zh: `Bitget XAUUSDT 最新 ${bitgetPx.toFixed(2)} 與 ${venueNameZh} ${venuePx.toFixed(2)} 相差 ${crossBps >= 0 ? '+' : ''}${crossBps.toFixed(1)} bps——跨場所價差偏大，若單邊流動性較薄，單一中間價可能失真。`,
        sourceIds: ['bitget-ticker', venueTickerId],
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

  const binanceBars = binanceCandles(byId.get('binance-candles')?.json ?? null)
  const okxBars = okxCandles(byId.get('okx-candles')?.json ?? null)
  let kline: HourlyKlineSeries | null = null
  if (binanceBars.length > 0) {
    const last = binanceBars[binanceBars.length - 1]
    bumpCaption(
      'binance-candles',
      `Binance XAUUSDT 1H K-line · ${binanceBars.length} bars · last ${last.c.toFixed(2)}`,
      `Binance XAUUSDT 1H K线 · ${binanceBars.length} 根 · 最新 ${last.c.toFixed(2)}`,
    )
    kline = {
      symbol: 'XAUUSDT',
      interval: '1H',
      sourceId: 'binance-candles',
      bars: binanceBars,
    }
  } else if (okxBars.length > 0) {
    const last = okxBars[okxBars.length - 1]
    bumpCaption(
      'okx-candles',
      `OKX XAU-USDT-SWAP 1H K-line · ${okxBars.length} bars · last ${last.c.toFixed(2)} (backup)`,
      `OKX XAU-USDT-SWAP 1H K线 · ${okxBars.length} 根 · 最新 ${last.c.toFixed(2)}（备用）`,
    )
    kline = {
      symbol: 'XAU-USDT-SWAP',
      interval: '1H',
      sourceId: 'okx-candles',
      bars: okxBars,
    }
  }

  // Desk health from live monitor (always attach as a source with freshness)
  const alertSources = args.health.filter((h) => h.health === 'alert' || h.health === 'watch')
  sources.push(
    makeSource(
      'vex-monitor-composite',
      'https://quote-ai-troubleshooting-bot.vercel.app/#/market/health',
      args.composite != null
        ? `CFD pricing desk composite ${args.composite.toFixed(2)}; watch/alert=${alertSources.length}`
        : 'CFD pricing desk composite unavailable',
      args.composite != null
        ? `CFD 定價工作台綜合價 ${args.composite.toFixed(2)}；關注／警報=${alertSources.length}`
        : 'CFD 定價工作台綜合價不可用',
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
    'CFD pricing proprietary indicators: placeholder only — feed not connected; no indicator points this hour.'
  const vexNoteZh =
    'CFD 定價自有指標：目前僅為占位，數據源未接入；本小時無指標要點。'

  // Opinion bullets: informative article summaries (not bare headlines); never restated in TL;DR
  for (const entry of SOURCE_CATALOG.filter((e) => e.opinion)) {
    const hit = byId.get(entry.id)
    if (!hit || hit.source.health !== 'ok') continue
    const point = {
      en: stripQuestions(entry.summaryEn || entry.captionEn),
      zh: stripQuestions(entry.summaryZh || entry.captionZh),
      sourceIds: [entry.id],
    }
    if (entry.opinionTone === 'opportunity') opportunityRaw.push(point)
    else riskRaw.push(point)
  }

  for (const c of args.extraCitations || []) {
    if (sources.some((s) => s.id === c.id || s.url === c.url)) continue
    const cite = await resolveCiteUrlOrNull(c.url, c.id)
    if (!cite) continue // proven 404/410 — never cite in 早报 / desk
    sources.push(
      makeSource(
        c.id,
        cite.url,
        c.label,
        c.label,
        'news',
        cite.rewritten ? 'degraded' : 'unchecked',
        createdAt,
        {
          detail: cite.rewritten
            ? 'Imported briefing citation · cite rewritten (primary 404)'
            : 'Imported briefing citation',
        },
      ),
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
    'social',
  ]
  sources.sort((a, b) => {
    const ka = kindOrder.indexOf(a.kind)
    const kb = kindOrder.indexOf(b.kind)
    if (ka !== kb) return ka - kb
    return a.id.localeCompare(b.id)
  })

  const opportunity = rankPoints(opportunityRaw)
  const risk = rankPoints(riskRaw)
  // TL;DR: live prints + compressed Opportunity / Risk gists (balanced both sides)
  const tldr = buildOneLineTldr({
    dxy,
    tnx,
    venuePx: venuePx ?? null,
    venueLabel: venueLabel ?? undefined,
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
