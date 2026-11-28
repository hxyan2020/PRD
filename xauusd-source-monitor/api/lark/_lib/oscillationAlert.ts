/**
 * Oscillation / leverage / breaking-news market alert for XAU perp.
 * Primary venue: Binance XAUUSDT; OKX XAU-USDT-SWAP as automatic backup.
 */
import { shanghaiDayKey } from './market.js'

export const DEFAULT_OSC_GROUP_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'
export const DEFAULT_OSC_DM_CHAT_ID = 'oc_430fae67dd06b70f65b726b1673ef40e'

/** Demo fire: 2026-11-25 10:00 Asia/Shanghai */
export const OSC_DEMO_DAY =
  (process.env.LARK_OSC_DEMO_DAY || '').trim() || '2026-11-25'
export const OSC_DEMO_START_HM =
  (process.env.LARK_OSC_DEMO_START || '').trim() || '10:00'

// Prefer www.binance.com — fapi.binance.com returns HTTP 451 in many regions.
const BINANCE_CANDLES =
  'https://www.binance.com/fapi/v1/klines?symbol=XAUUSDT&interval=1h&limit=48'
const BINANCE_TICKER = 'https://www.binance.com/fapi/v1/ticker/price?symbol=XAUUSDT'
const BINANCE_FUNDING = 'https://www.binance.com/fapi/v1/premiumIndex?symbol=XAUUSDT'
const BINANCE_FUNDING_HIST =
  'https://www.binance.com/fapi/v1/fundingRate?symbol=XAUUSDT&limit=48'
const BINANCE_OI = 'https://www.binance.com/fapi/v1/openInterest?symbol=XAUUSDT'
const BINANCE_FAPI_FALLBACK_HOSTS = [
  'https://www.binance.com',
  'https://www.binance.info',
  'https://fapi.binance.com',
] as const
const BINANCE_TRADE =
  'https://www.tradingview.com/chart/?symbol=BINANCE%3AXAUUSDT.P'

const OKX_CANDLES =
  'https://www.okx.com/api/v5/market/candles?instId=XAU-USDT-SWAP&bar=1H&limit=48'
const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_FUNDING =
  'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP'
const OKX_FUNDING_HIST =
  'https://www.okx.com/api/v5/public/funding-rate-history?instId=XAU-USDT-SWAP&limit=48'
const OKX_OI =
  'https://www.okx.com/api/v5/public/open-interest?instId=XAU-USDT-SWAP'
/** Geo-safe K-line (okx.com/trade-swap 404s in SG and other regions). */
const OKX_TRADE = 'https://www.tradingview.com/chart/?symbol=OKX%3AXAUUSDT.P'

export type OscVenue = 'binance' | 'okx'

export type OscTrigger =
  | 'vol_spike'
  | 'funding_leverage'
  | 'oi_spike'
  | 'breaking_news'
  | 'demo'

export type OscSource = { label: string; url: string }

export type OscillationSnapshot = {
  fetchedAt: number
  /** Venue that supplied tape metrics (Binance preferred). */
  venue: OscVenue
  venueLabel: string
  last: number | null
  /** Recent 6×1H mean range % */
  volRecentPct: number | null
  /** Prior ~24×1H mean range % */
  volMeanPct: number | null
  volRatio: number | null
  fundingPct: number | null
  fundingMeanAbsPct: number | null
  fundingRatio: number | null
  oi: number | null
  newsHeadline: string | null
  newsUrl: string | null
  triggers: OscTrigger[]
  demo: boolean
}

function mean(xs: number[]): number | null {
  if (!xs.length) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Keep each venue probe short so cron-tick's child budget cannot starve the beat. */
const FETCH_TIMEOUT_MS = 4_000
/** Hard ceiling for the whole evaluate (Binance + OKX + news in parallel). */
export const OSC_EVAL_BUDGET_MS = 12_000

async function fetchJson(url: string): Promise<unknown | null> {
  const headers = { 'User-Agent': 'VE-Risk-Copilot/1.0 (+oscillation)' }
  const tryOne = async (target: string): Promise<unknown | null> => {
    try {
      const r = await fetch(target, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (r.status === 451 || r.status === 403) return null
      if (!r.ok) return null
      return await r.json()
    } catch {
      return null
    }
  }

  // Binance futures: rotate geo-friendly hosts when the primary 451s.
  const m = url.match(/^https:\/\/(?:www\.)?(?:binance\.com|binance\.info|fapi\.binance\.com)(\/fapi\/v1\/\S+)$/i)
  if (m) {
    const path = m[1]!
    for (const host of BINANCE_FAPI_FALLBACK_HOSTS) {
      const hit = await tryOne(`${host}${path}`)
      if (hit != null) return hit
    }
    return null
  }
  return tryOne(url)
}

function emptySnap(demo: boolean, news?: { title: string; url: string } | null): OscillationSnapshot {
  return {
    fetchedAt: Date.now(),
    venue: 'binance',
    venueLabel: 'Binance XAUUSDT',
    last: null,
    volRecentPct: null,
    volMeanPct: null,
    volRatio: null,
    fundingPct: null,
    fundingMeanAbsPct: null,
    fundingRatio: null,
    oi: null,
    newsHeadline: news?.title || null,
    newsUrl: news?.url || null,
    triggers: demo ? ['demo'] : news ? ['breaking_news'] : [],
    demo,
  }
}

/** OKX candles: [ts,o,h,l,c,…] newest first. */
function parseOkxCandleRanges(data: unknown): { rangePct: number; close: number }[] {
  const rows = (data as { data?: string[][] })?.data
  if (!Array.isArray(rows)) return []
  const out: { rangePct: number; close: number }[] = []
  for (const row of rows) {
    const h = Number(row?.[2])
    const l = Number(row?.[3])
    const c = Number(row?.[4])
    if (!(c > 0) || !Number.isFinite(h) || !Number.isFinite(l)) continue
    out.push({ rangePct: ((h - l) / c) * 100, close: c })
  }
  return out
}

/** Binance klines: [openTime,o,h,l,c,…] oldest first → return newest-first ranges. */
function parseBinanceCandleRanges(data: unknown): { rangePct: number; close: number }[] {
  if (!Array.isArray(data)) return []
  const out: { rangePct: number; close: number }[] = []
  for (const row of data) {
    if (!Array.isArray(row) || row.length < 5) continue
    const h = Number(row[2])
    const l = Number(row[3])
    const c = Number(row[4])
    if (!(c > 0) || !Number.isFinite(h) || !Number.isFinite(l)) continue
    out.push({ rangePct: ((h - l) / c) * 100, close: c })
  }
  return out.reverse()
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

/** Strong shock verbs / events (not alone enough for random tech headlines). */
const NEWS_SHOCK_RE =
  /\b(war|wars|sanctions?|invasion|airstrike|missile|default|collapse|emergency|halted?|liquidations?|flash\s*crash|crashes?|crash|surges?|spikes?|plunges?|tumbles?|slumps?|soars?|skyrockets?|unexpected|rate\s*(?:hike|cut|decision)|FOMC|Powell|央行|美联储|聯準會|突发|紧急|战争|制裁|暴跌|暴涨|强平|熔断)\b/i

/** Gold / macro desk relevance — same thematic coverage as 早报 hubs. */
const NEWS_GOLD_MACRO_RE =
  /\b(gold|XAU|XAUUSD|bullion|precious\s+metals?|COMEX|GC=F|silver|Fed|FOMC|Powell|Federal\s+Reserve|dollar|DXY|Treasur(?:y|ies)|yields?|10[\s-]?year|inflation|CPI|PCE|NFP|payrolls|oil|crude|Brent|WTI|Iran|Israel|Ukraine|Russia|tariff|commodit(?:y|ies)|metals?|ECB|BOJ|rate\s*(?:hike|cut|hold|decision)|贵金属|黄金|白银|美联储|聯準會|美元|原油)\b/i

/** Geopolitical / systemic shocks that move gold even without "gold" in the title. */
const NEWS_ALWAYS_SHOCK_RE =
  /\b(war|wars|sanctions?|invasion|airstrike|missile|Iran|flash\s*crash|bank\s+(?:failure|collapse)|sovereign\s+default|emergency\s+(?:rate|meeting))\b|战争|制裁|突发|紧急|熔断|强平潮/i

/**
 * Major news shock for 震荡行情预警.
 * FOMC / Powell always count; other Fed titles need a policy/shock cue;
 * otherwise need a shock verb + gold/macro relevance (or a systemic shock).
 */
export function looksMajorNewsShock(title: string): boolean {
  const t = decodeXmlEntities(title).trim()
  if (t.length < 8) return false
  // Chair / FOMC are high-signal; bare "Federal Reserve Board announces…" is not.
  if (/\b(FOMC|Powell|美联储|聯準會)\b/i.test(t)) return true
  if (
    /\b(Fed|Federal\s+Reserve)\b/i.test(t) &&
    /\b(rate|rates|hike|cut|hold|inflation|emergency|policy|decision|unexpectedly|hawkish|dovish|QT|QE)\b/i.test(
      t,
    )
  ) {
    return true
  }
  if (!NEWS_SHOCK_RE.test(t)) return false
  if (NEWS_ALWAYS_SHOCK_RE.test(t)) return true
  return NEWS_GOLD_MACRO_RE.test(t)
}

/** @deprecated use looksMajorNewsShock */
function looksBreaking(title: string): boolean {
  return looksMajorNewsShock(title)
}

/**
 * Machine-readable feeds for the same news desks as 早报 DAILY_FIXED_LINKS
 * (Fed / CNBC / MarketWatch / Investing / FT / CoinDesk / Kitco).
 * Reuters / Bloomberg / WSJ HTML walls are skipped — RSS/JSON only when reachable.
 */
type OscNewsFeed = {
  id: string
  label: string
  kind: 'fed-json' | 'rss' | 'html-titles'
  url: string
}

export const OSC_NEWS_FEEDS: OscNewsFeed[] = [
  {
    id: 'fed-press',
    label: 'Fed',
    kind: 'fed-json',
    url: 'https://www.federalreserve.gov/json/ne-press.json',
  },
  {
    id: 'cnbc-gold',
    label: 'CNBC',
    kind: 'rss',
    // Economy RSS — closest machine feed to the 早报 CNBC Gold desk
    url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',
  },
  {
    id: 'cnbc-markets',
    label: 'CNBC Markets',
    kind: 'rss',
    url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html',
  },
  {
    id: 'marketwatch-gold',
    label: 'MarketWatch',
    kind: 'rss',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
  },
  {
    id: 'investing-gold',
    label: 'Investing',
    kind: 'rss',
    url: 'https://www.investing.com/rss/news_25.rss',
  },
  {
    id: 'ft-commodities',
    label: 'FT',
    kind: 'rss',
    url: 'https://www.ft.com/commodities?format=rss',
  },
  {
    id: 'coindesk-markets',
    label: 'CoinDesk',
    kind: 'rss',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  },
  {
    id: 'kitco-news',
    label: 'Kitco News',
    kind: 'html-titles',
    url: 'https://www.kitco.com/news/category/metals',
  },
]

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'VE-Risk-Copilot/1.0 (+oscillation)',
        Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!r.ok) return null
    return await r.text()
  } catch {
    return null
  }
}

function parseRssItems(xml: string): { title: string; url: string }[] {
  const items: { title: string; url: string }[] = []
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
  for (const block of blocks.slice(0, 12)) {
    const titleM =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      block.match(/<title>([\s\S]*?)<\/title>/i)
    const linkM =
      block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ||
      block.match(/<link>([\s\S]*?)<\/link>/i) ||
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)
    const title = decodeXmlEntities(
      (titleM?.[1] || '').replace(/<[^>]+>/g, '').trim(),
    )
    let url = decodeXmlEntities((linkM?.[1] || '').trim())
    if (!title) continue
    if (!/^https?:\/\//i.test(url)) url = ''
    items.push({ title, url })
  }
  return items
}

function parseHtmlTitles(
  html: string,
  baseUrl: string,
): { title: string; url: string }[] {
  const items: { title: string; url: string }[] = []
  const seen = new Set<string>()
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) && items.length < 24) {
    const href = m[1]!
    const raw = m[2]!
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (raw.length < 28 || raw.length > 180) continue
    if (/^(home|news|markets|login|subscribe|read more|kitco news)$/i.test(raw)) {
      continue
    }
    if (!/\/news\//i.test(href) && !/article/i.test(href)) continue
    const title = decodeXmlEntities(raw)
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    let url = href
    try {
      url = href.startsWith('http') ? href : new URL(href, baseUrl).toString()
    } catch {
      url = baseUrl
    }
    items.push({ title, url })
  }
  return items
}

type OscNewsHit = { title: string; url: string; source: string }

async function collectFeedHeadlines(feed: OscNewsFeed): Promise<OscNewsHit[]> {
  try {
    if (feed.kind === 'fed-json') {
      const fed = await fetchJson(feed.url)
      const rows = Array.isArray(fed)
        ? (fed as { title?: string; link?: string }[])
        : []
      return rows
        .slice(0, 15)
        .map((r) => {
          const title = String(r?.title || '').trim()
          const link = String(r?.link || '')
          const url = link.startsWith('http')
            ? link
            : link
              ? `https://www.federalreserve.gov${link}`
              : 'https://www.federalreserve.gov/newsevents/pressreleases.htm'
          return { title, url, source: feed.label }
        })
        .filter((x) => x.title)
    }
    const text = await fetchText(feed.url)
    if (!text) return []
    const items =
      feed.kind === 'rss' ? parseRssItems(text) : parseHtmlTitles(text, feed.url)
    return items.map((it) => ({
      title: it.title,
      url: it.url || feed.url,
      source: feed.label,
    }))
  } catch {
    return []
  }
}

export async function fetchBreakingHeadline(): Promise<{
  title: string
  url: string
} | null> {
  // Scan 早报-aligned news desks in parallel (budget shared with venue probes).
  const batches = await Promise.all(OSC_NEWS_FEEDS.map(collectFeedHeadlines))
  for (const batch of batches) {
    for (const item of batch) {
      if (!looksBreaking(item.title)) continue
      const tagged = `[${item.source}] ${item.title}`
      return { title: tagged, url: item.url }
    }
  }
  return null
}

type VenueTape = {
  venue: OscVenue
  venueLabel: string
  ranges: { rangePct: number; close: number }[]
  last: number | null
  fundingPct: number | null
  fundingMeanAbsPct: number | null
  oi: number | null
}

async function fetchBinanceTape(): Promise<VenueTape | null> {
  const [candles, ticker, funding, fundingHist, oiJson] = await Promise.all([
    fetchJson(BINANCE_CANDLES),
    fetchJson(BINANCE_TICKER),
    fetchJson(BINANCE_FUNDING),
    fetchJson(BINANCE_FUNDING_HIST),
    fetchJson(BINANCE_OI),
  ])
  const ranges = parseBinanceCandleRanges(candles)
  if (ranges.length < 8) return null

  const last = (() => {
    try {
      const n = Number((ticker as { price?: string })?.price)
      return Number.isFinite(n) ? n : ranges[0]?.close ?? null
    } catch {
      return ranges[0]?.close ?? null
    }
  })()

  const fundingPct = (() => {
    try {
      const n = Number((funding as { lastFundingRate?: string })?.lastFundingRate)
      return Number.isFinite(n) ? n * 100 : null
    } catch {
      return null
    }
  })()

  const fundingMeanAbsPct = (() => {
    try {
      const rows = (fundingHist as { fundingRate?: string }[]) || []
      if (!Array.isArray(rows)) return null
      const abs = rows
        .map((r) => Math.abs(Number(r.fundingRate) * 100))
        .filter((n) => Number.isFinite(n))
      return mean(abs)
    } catch {
      return null
    }
  })()

  const oi = (() => {
    try {
      const n = Number((oiJson as { openInterest?: string })?.openInterest)
      return Number.isFinite(n) ? n : null
    } catch {
      return null
    }
  })()

  return {
    venue: 'binance',
    venueLabel: 'Binance XAUUSDT',
    ranges,
    last,
    fundingPct,
    fundingMeanAbsPct,
    oi,
  }
}

async function fetchOkxTape(): Promise<VenueTape | null> {
  const [candles, ticker, funding, fundingHist, oiJson] = await Promise.all([
    fetchJson(OKX_CANDLES),
    fetchJson(OKX_TICKER),
    fetchJson(OKX_FUNDING),
    fetchJson(OKX_FUNDING_HIST),
    fetchJson(OKX_OI),
  ])
  const ranges = parseOkxCandleRanges(candles)
  if (ranges.length < 8) return null

  const last = (() => {
    try {
      const n = Number((ticker as { data?: { last?: string }[] })?.data?.[0]?.last)
      return Number.isFinite(n) ? n : ranges[0]?.close ?? null
    } catch {
      return ranges[0]?.close ?? null
    }
  })()

  const fundingPct = (() => {
    try {
      const n = Number(
        (funding as { data?: { fundingRate?: string }[] })?.data?.[0]?.fundingRate,
      )
      return Number.isFinite(n) ? n * 100 : null
    } catch {
      return null
    }
  })()

  const fundingMeanAbsPct = (() => {
    try {
      const rows = (fundingHist as { data?: { fundingRate?: string }[] })?.data || []
      const abs = rows
        .map((r) => Math.abs(Number(r.fundingRate) * 100))
        .filter((n) => Number.isFinite(n))
      return mean(abs)
    } catch {
      return null
    }
  })()

  const oi = (() => {
    try {
      const n = Number((oiJson as { data?: { oi?: string }[] })?.data?.[0]?.oi)
      return Number.isFinite(n) ? n : null
    } catch {
      return null
    }
  })()

  return {
    venue: 'okx',
    venueLabel: 'OKX XAU-USDT-SWAP',
    ranges,
    last,
    fundingPct,
    fundingMeanAbsPct,
    oi,
  }
}

export async function evaluateOscillation(opts?: {
  demo?: boolean
}): Promise<OscillationSnapshot> {
  const demo = Boolean(opts?.demo)
  // Never let venue/news probes hang past OSC_EVAL_BUDGET_MS — a hung evaluate
  // is what made cron-tick abort and left 震荡预警 heartbeats silent.
  const run = async (): Promise<OscillationSnapshot> => {
  const [binanceTape, okxTape, news] = await Promise.all([
    fetchBinanceTape(),
    fetchOkxTape(),
    fetchBreakingHeadline(),
  ])
  // Binance primary; OKX backup when Binance tape is thin / unreachable.
  const tape = binanceTape || okxTape
  if (!tape) {
    return emptySnap(demo, news)
  }

  const recent = tape.ranges.slice(0, 6).map((r) => r.rangePct)
  const hist = tape.ranges.slice(6, 30).map((r) => r.rangePct)
  const volRecentPct = mean(recent)
  const volMeanPct = mean(hist)
  const volRatio =
    volRecentPct != null && volMeanPct != null && volMeanPct > 0
      ? volRecentPct / volMeanPct
      : null

  const fundingPct = tape.fundingPct
  const fundingMeanAbsPct = tape.fundingMeanAbsPct
  const fundingRatio =
    fundingPct != null && fundingMeanAbsPct != null && fundingMeanAbsPct > 0
      ? Math.abs(fundingPct) / fundingMeanAbsPct
      : null

  const triggers: OscTrigger[] = []
  if (demo) triggers.push('demo')
  if (volRatio != null && volRatio >= 1.45) triggers.push('vol_spike')
  if (fundingRatio != null && fundingRatio >= 1.5 && Math.abs(fundingPct || 0) >= 0.01) {
    triggers.push('funding_leverage')
  }
  if (news) triggers.push('breaking_news')

  return {
    fetchedAt: Date.now(),
    venue: tape.venue,
    venueLabel: tape.venueLabel,
    last: tape.last,
    volRecentPct,
    volMeanPct,
    volRatio,
    fundingPct,
    fundingMeanAbsPct,
    fundingRatio,
    oi: tape.oi,
    newsHeadline: news?.title || null,
    newsUrl: news?.url || null,
    triggers,
    demo,
  }
  }

  try {
    return await Promise.race([
      run(),
      new Promise<OscillationSnapshot>((resolve) =>
        setTimeout(() => resolve(emptySnap(demo)), OSC_EVAL_BUDGET_MS),
      ),
    ])
  } catch {
    return emptySnap(demo)
  }
}

export function shouldFireAlert(snap: OscillationSnapshot): boolean {
  if (snap.demo) return true
  return snap.triggers.some((t) => t !== 'demo')
}

export function oscillationSources(snap: OscillationSnapshot): OscSource[] {
  // Cite exchange trade / K-line UI and news pages — never raw JSON API hosts.
  const src: OscSource[] =
    snap.venue === 'okx'
      ? [
          { label: 'OKX XAU-USDT-SWAP K线（备用）', url: OKX_TRADE },
          { label: 'Binance XAUUSDT K线', url: BINANCE_TRADE },
        ]
      : [
          { label: 'Binance XAUUSDT K线', url: BINANCE_TRADE },
          { label: 'OKX XAU-USDT-SWAP K线（备用）', url: OKX_TRADE },
        ]
  if (snap.newsUrl) {
    src.push({ label: snap.newsHeadline || '突发新闻', url: snap.newsUrl })
  }
  return src
}

function fmt(n: number | null, d = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(d)
}

function venueLine(snap: OscillationSnapshot, lang: 'en' | 'zh-Hans' | 'zh-Hant'): string {
  const label = snap.venueLabel || (snap.venue === 'okx' ? 'OKX XAU-USDT-SWAP' : 'Binance XAUUSDT')
  const backup =
    snap.venue === 'okx'
      ? lang === 'en'
        ? ' (OKX backup — Binance unreachable)'
        : lang === 'zh-Hant'
          ? '（OKX 備用 · Binance 不可達）'
          : '（OKX 备用 · Binance 不可达）'
      : ''
  if (lang === 'en') return `**Instrument:** ${label}${backup} · last **${fmt(snap.last)}**`
  if (lang === 'zh-Hant') return `**標的：** ${label}${backup} · 最新 **${fmt(snap.last)}**`
  return `**标的：** ${label}${backup} · 最新 **${fmt(snap.last)}**`
}

/**
 * On-demand status when the user sends「震荡行情预警」.
 * Always explains the trigger mechanism; shows live metrics vs thresholds.
 */
export function buildOscillationStatusCard(
  snap: OscillationSnapshot,
  lang: 'en' | 'zh-Hans' | 'zh-Hant' = 'zh-Hans',
): Record<string, unknown> {
  const firing = shouldFireAlert(snap)
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const title = hans
    ? firing
      ? '震荡行情预警 · 已触发'
      : '震荡行情预警 · 当前未触发'
    : hant
      ? firing
        ? '震盪行情預警 · 已觸發'
        : '震盪行情預警 · 當前未觸發'
      : firing
        ? 'Oscillation alert · FIRING'
        : 'Oscillation alert · not firing'

  const volLine = hans
    ? `振幅：近 6×1H 均值 **${fmt(snap.volRecentPct, 3)}%** ÷ 历史均值 **${fmt(snap.volMeanPct, 3)}%** = **${fmt(snap.volRatio, 2)}×**（阈值 ≥ **1.45×**）`
    : hant
      ? `振幅：近 6×1H 均值 **${fmt(snap.volRecentPct, 3)}%** ÷ 歷史均值 **${fmt(snap.volMeanPct, 3)}%** = **${fmt(snap.volRatio, 2)}×**（閾值 ≥ **1.45×**）`
      : `Vol: last-6×1H mean **${fmt(snap.volRecentPct, 3)}%** ÷ hist mean **${fmt(snap.volMeanPct, 3)}%** = **${fmt(snap.volRatio, 2)}×** (threshold ≥ **1.45×**)`

  const fundLine = hans
    ? `资金费率：当前 **${fmt(snap.fundingPct, 4)}%** ÷ 历史|费率|均值 **${fmt(snap.fundingMeanAbsPct, 4)}%** = **${fmt(snap.fundingRatio, 2)}×**（需 |费率|≥**0.01%** 且比值 ≥ **1.5×**）`
    : hant
      ? `資金費率：當前 **${fmt(snap.fundingPct, 4)}%** ÷ 歷史|費率|均值 **${fmt(snap.fundingMeanAbsPct, 4)}%** = **${fmt(snap.fundingRatio, 2)}×**（需 |費率|≥**0.01%** 且比值 ≥ **1.5×**）`
      : `Funding: **${fmt(snap.fundingPct, 4)}%** ÷ hist |rate| mean **${fmt(snap.fundingMeanAbsPct, 4)}%** = **${fmt(snap.fundingRatio, 2)}×** (need |rate|≥**0.01%** and ratio ≥ **1.5×**)`

  const newsLine = hans
    ? snap.newsHeadline
      ? `突发新闻：**命中** — ${snap.newsHeadline}`
      : '突发新闻：**未命中**（早报同源新闻台 · 重大冲击关键词）'
    : hant
      ? snap.newsHeadline
        ? `突發新聞：**命中** — ${snap.newsHeadline}`
        : '突發新聞：**未命中**（早報同源新聞台 · 重大衝擊關鍵詞）'
      : snap.newsHeadline
        ? `Breaking news: **hit** — ${snap.newsHeadline}`
        : 'Breaking news: **no hit** (daily-report news desks · major-shock keywords)'

  const body = hans
    ? [
        firing
          ? '⚠️ **结论：当前满足预警条件**（与自动推送同一套规则）'
          : '✅ **结论：当前没有震荡／杠杆／突发新闻预警**',
        '',
        `• ${venueLine(snap, 'zh-Hans')}`,
        snap.oi != null ? `• **持仓（OI）：** ${fmt(snap.oi, 0)}` : '',
        '',
        '📌 **触发机制**（你发「震荡行情预警」会即时评估；cron 每 **15** 分钟自动跑同一套）',
        '1. **振幅偏离** — 近 6 根 1H 振幅均值 ≥ 更早约 24 根均值的 **1.45×**（Binance 优先，OKX 备用）',
        '2. **资金费率／杠杆代理** — |费率| ≥ **0.01%** 且 ≥ 历史 |费率| 均值的 **1.5×**',
        '3. **突发新闻** — 与早报同源（Fed／CNBC／MarketWatch／Investing／FT／CoinDesk／Kitco 等）标题命中战争／制裁／央行／暴涨暴跌等重大冲击',
        '命中任一项 → **仅推送群**（不私聊 Yan）。',
        '',
        '📊 **此刻读数**',
        `• ${volLine}`,
        `• ${fundLine}`,
        `• ${newsLine}`,
        '',
        '🔗 **数据源**',
        ...oscillationSources(snap).map((s) => `• [${s.label}](${s.url})`),
      ]
        .filter(Boolean)
        .join('\n')
    : hant
      ? [
          firing
            ? '⚠️ **結論：當前滿足預警條件**（與自動推送同一套規則）'
            : '✅ **結論：當前沒有震盪／槓桿／突發新聞預警**',
          '',
          `• ${venueLine(snap, 'zh-Hant')}`,
          snap.oi != null ? `• **持倉（OI）：** ${fmt(snap.oi, 0)}` : '',
          '',
          '📌 **觸發機制**（你發「震盪行情預警」會即時評估；cron 每 **15** 分鐘自動跑同一套）',
          '1. **振幅偏離** — 近 6 根 1H 振幅均值 ≥ 更早約 24 根均值的 **1.45×**（Binance 優先，OKX 備用）',
          '2. **資金費率／槓桿代理** — |費率| ≥ **0.01%** 且 ≥ 歷史 |費率| 均值的 **1.5×**',
          '3. **突發新聞** — 與早報同源（Fed／CNBC／MarketWatch／Investing／FT／CoinDesk／Kitco 等）標題命中戰爭／制裁／央行／暴漲暴跌等重大衝擊',
          '命中任一項 → **僅推送群**（不私聊 Yan）。',
          '',
          '📊 **此刻讀數**',
          `• ${volLine}`,
          `• ${fundLine}`,
          `• ${newsLine}`,
          '',
          '🔗 **資料來源**',
          ...oscillationSources(snap).map((s) => `• [${s.label}](${s.url})`),
        ]
          .filter(Boolean)
          .join('\n')
      : [
          firing
            ? '⚠️ **Verdict: alert conditions met** (same rules as the auto push)'
            : '✅ **Verdict: no oscillation / leverage / breaking-news alert right now**',
          '',
          `• ${venueLine(snap, 'en')}`,
          snap.oi != null ? `• **OI:** ${fmt(snap.oi, 0)}` : '',
          '',
          '📌 **Trigger mechanism** (this command evaluates live; cron runs the same check every **15** minutes)',
          '1. **Vol spike** — last-6×1H mean range ≥ **1.45×** the prior ~24-bar mean (Binance primary, OKX backup)',
          '2. **Funding / leverage proxy** — |funding| ≥ **0.01%** and ≥ **1.5×** hist |funding| mean',
          '3. **Breaking news** — same desks as the morning report (Fed / CNBC / MarketWatch / Investing / FT / CoinDesk / Kitco); headline matches war / sanctions / Fed / crash / surge shocks',
          'Any hit → push to the risk group only (no Yan DM).',
          '',
          '📊 **Live readings**',
          `• ${volLine}`,
          `• ${fundLine}`,
          `• ${newsLine}`,
          '',
          '🔗 **Sources**',
          ...oscillationSources(snap).map((s) => `• [${s.label}](${s.url})`),
        ]
          .filter(Boolean)
          .join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: firing ? 'red' : 'turquoise',
      title: { tag: 'plain_text', content: title },
    },
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
  }
}

export function buildOscillationAlertCard(
  snap: OscillationSnapshot,
  adminOpenId?: string,
): Record<string, unknown> {
  const demo = snap.demo
  const title = demo ? '【DEMO】震荡行情预警' : '震荡行情预警'
  const id = (adminOpenId || '').trim()
  const atAdmin = id && id.startsWith('ou_') ? `<at id="${id}"></at>` : '**@Yan Haixiang**'
  const reasons: string[] = []
  if (snap.triggers.includes('vol_spike')) {
    reasons.push(
      `价格持续震荡：近 6 根 1H 振幅均 ${fmt(snap.volRecentPct, 3)}%，约历史均值 ${fmt(snap.volMeanPct, 3)}% 的 **${fmt(snap.volRatio, 2)}×**`,
    )
  }
  if (snap.triggers.includes('funding_leverage')) {
    reasons.push(
      `杠杆拥挤代理（资金费率）偏高：当前 ${fmt(snap.fundingPct, 4)}%，约历史 |费率| 均值 ${fmt(snap.fundingMeanAbsPct, 4)}% 的 **${fmt(snap.fundingRatio, 2)}×**`,
    )
  }
  if (snap.triggers.includes('breaking_news') && snap.newsHeadline) {
    reasons.push(`突发新闻：${snap.newsHeadline}`)
  }
  if (demo && reasons.length === 0) {
    reasons.push(
      '演示：当前未触及实盘阈值，展示预警卡片样式与推送通道（仅群，不私聊 Yan）。',
    )
  }

  const sources = oscillationSources(snap)
  const body = [
    demo ? '🧪 **这是 DEMO 预警**（今天 10:00 东八区演练）' : '⚠️ **震荡／杠杆／新闻预警**',
    '',
    `${atAdmin} 请留意下方预警`,
    '',
    `• ${venueLine(snap, 'zh-Hans')}`,
    `• **原因：**`,
    ...reasons.map((r) => `  - ${r}`),
    '',
    '• **可能风险：** 波动放大下高杠杆仓位易触发 **连锁强平**／穿仓传染；关注资金费率、持仓与跨所价差是否同步恶化。',
    snap.oi != null ? `• **持仓（OI）：** ${fmt(snap.oi, 0)}` : '',
    '',
    '🔗 **数据源**',
    ...sources.map((s) => `• [${s.label}](${s.url})`),
  ]
    .filter(Boolean)
    .join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: demo ? 'orange' : 'red',
      title: { tag: 'plain_text', content: title },
    },
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
  }
}

export function shanghaiHm(ts: number = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(ts))
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
    const hour = get('hour') === '24' ? '00' : get('hour')
    return `${hour}:${get('minute')}`
  } catch {
    const d = new Date(ts)
    return `${String(d.getUTCHours() + 8).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
}

export function isOscDemoSlot(ts: number = Date.now()): boolean {
  if (shanghaiDayKey(ts) !== OSC_DEMO_DAY) return false
  const hm = shanghaiHm(ts)
  // After start until 18:00 CST catch-up (idempotent via demoSentDay).
  // Narrow 10:00–10:14 windows miss when a deploy overlaps the :00 cron.
  return hm >= OSC_DEMO_START_HM && hm < '18:00'
}
