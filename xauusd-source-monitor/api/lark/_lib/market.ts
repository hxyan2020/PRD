import {
  BINANCE_KLINE_URL,
  BITGET_KLINE_URL,
  fetchMarketKline,
  generateHourlyScan,
  KLINE_INTERVALS,
  KITCO_GOLD_URL,
  OKX_KLINE_URL,
  resolveCiteUrlOrNull,
  type HourlyKlineSeries,
  type HourlyMarketReport,
  type KlineBar,
  type KlineIntervalBar,
  type RankedPoint,
  type ReportSource,
} from '../../../src/engine/hourlyScan.js'
import { larkConfigured, resolveFaviconImgKey } from './client.js'
import { simpleCard } from './cards.js'
import { readDurableJson, writeDurableJson } from './durableJson.js'
import type { Lang } from './types.js'

export interface MarketSnapshot {
  /** Primary venue print (Binance XAUUSDT). */
  binance?: { last: number; change24hPct?: number }
  /** Backup venue print (OKX XAU-USDT-SWAP). */
  okx?: { last: number; change24hPct?: number }
  bitget?: { last: number; change24hPct?: number }
  spot?: { last: number }
  dxyHint?: string
  notes: string[]
  sources: { label: string; url: string }[]
  fetchedAt: number
  /** Full hourly desk report (same engine as web Market → Hourly scan). */
  hourly?: HourlyMarketReport
}

/** Human venue tag from kline sourceId (Binance → OKX → Bitget). */
function klineVenueLabel(kline: HourlyKlineSeries | null | undefined): string {
  if (kline?.sourceId?.startsWith('binance')) return 'Binance'
  if (kline?.sourceId?.startsWith('okx')) return 'OKX'
  if (kline?.sourceId?.startsWith('bitget')) return 'Bitget'
  if (kline?.symbol?.includes('OKX') || kline?.symbol === 'XAU-USDT-SWAP') return 'OKX'
  if (kline?.symbol === 'XAUUSDT') return 'Binance'
  return 'Binance'
}

const DESK_MARKET = 'https://vex-llm-proxy.vercel.app/#/market'

/**
 * Default when conversation language is missing / unsupported.
 * Supported market copy: zh-Hans · zh-Hant · en as **three distinct languages**.
 * 简体中文 ≠ 繁體中文 — never collapse one into the other.
 * Unsupported hints → 简体中文 (mainland desk default).
 */
export const LARK_MARKET_LANG: Lang = 'zh-Hans'

const CHAT_LANG_STORE = 'lark-chat-lang.json'

type MarketLangStore = {
  /** Legacy flat map chatId → lang (still read). */
  [key: string]: string | Record<string, string> | undefined
  byChat?: Record<string, string>
  byOpenId?: Record<string, string>
}

/** Map session / request / detected lang → supported market lang. */
export function resolveMarketLang(hint?: Lang | string | null): Lang {
  const raw = String(hint || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
  if (!raw) return LARK_MARKET_LANG
  if (raw === 'zh-hans' || raw === 'zh-cn' || raw === 'zh' || raw === 'cn' || raw === 'chs') {
    return 'zh-Hans'
  }
  if (
    raw === 'zh-hant' ||
    raw === 'zh-tw' ||
    raw === 'zh-hk' ||
    raw === 'zh-mo' ||
    raw === 'cht' ||
    raw === 'hant'
  ) {
    return 'zh-Hant'
  }
  if (raw === 'en' || raw === 'en-us' || raw === 'en-gb' || raw === 'eng') {
    return 'en'
  }
  // Unsupported → 简体中文 default (not 繁體)
  return LARK_MARKET_LANG
}

function chatLangKey(chatId: string) {
  return `chat:${chatId}`
}
function openIdLangKey(openId: string) {
  return `user:${openId}`
}

/** Remember conversation language for cron / interactive market cards (chat + user). */
export async function rememberChatMarketLang(
  chatId: string,
  lang: Lang | string | null | undefined,
  openId?: string | null,
) {
  const resolved = resolveMarketLang(lang)
  const cid = (chatId || '').trim()
  const oid = (openId || '').trim()
  if (!cid && !oid) return
  try {
    const raw = ((await readDurableJson<MarketLangStore>(CHAT_LANG_STORE)) || {}) as MarketLangStore
    const byChat = { ...(raw.byChat || {}) }
    const byOpenId = { ...(raw.byOpenId || {}) }
    // Migrate legacy flat chatId → lang entries
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'byChat' || k === 'byOpenId') continue
      if (typeof v === 'string' && !byChat[k]) byChat[k] = v
    }
    let dirty = false
    if (cid && byChat[cid] !== resolved) {
      byChat[cid] = resolved
      dirty = true
    }
    if (oid && byOpenId[oid] !== resolved) {
      byOpenId[oid] = resolved
      dirty = true
    }
    if (!dirty) return
    const trim = (m: Record<string, string>, max: number) => {
      const keys = Object.keys(m)
      if (keys.length <= max) return m
      for (const k of keys.slice(0, keys.length - max)) delete m[k]
      return m
    }
    await writeDurableJson(CHAT_LANG_STORE, {
      byChat: trim(byChat, 200),
      byOpenId: trim(byOpenId, 200),
    })
  } catch {
    /* non-fatal */
  }
}

/**
 * Lang for cron / interactive market cards:
 * request hint → remembered openId → remembered chatId → 简体中文.
 * zh-Hans and zh-Hant stay distinct.
 */
export async function resolveDailyMarketLang(opts: {
  chatId: string
  openId?: string | null
  hint?: Lang | string | null
}): Promise<{ lang: Lang; source: string }> {
  if (opts.hint != null && String(opts.hint).trim()) {
    return { lang: resolveMarketLang(opts.hint), source: 'request' }
  }
  try {
    const raw = ((await readDurableJson<MarketLangStore>(CHAT_LANG_STORE)) || {}) as MarketLangStore
    const byChat = { ...(raw.byChat || {}) }
    const byOpenId = { ...(raw.byOpenId || {}) }
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'byChat' || k === 'byOpenId') continue
      if (typeof v === 'string' && !byChat[k]) byChat[k] = v
    }
    const oid = (opts.openId || '').trim()
    if (oid && byOpenId[oid]) {
      return { lang: resolveMarketLang(byOpenId[oid]), source: 'open_id' }
    }
    const cid = (opts.chatId || '').trim()
    if (cid && byChat[cid]) {
      return { lang: resolveMarketLang(byChat[cid]), source: 'chat' }
    }
    // Legacy keys written as chat:/user: prefixes
    if (oid && typeof raw[openIdLangKey(oid)] === 'string') {
      return { lang: resolveMarketLang(String(raw[openIdLangKey(oid)])), source: 'open_id' }
    }
    if (cid && typeof raw[chatLangKey(cid)] === 'string') {
      return { lang: resolveMarketLang(String(raw[chatLangKey(cid)])), source: 'chat' }
    }
  } catch {
    /* fall through */
  }
  return { lang: LARK_MARKET_LANG, source: 'default_zh_hans' }
}

/** Sentiment labels from the hourly engine are 简体 — map for 繁體 cards. */
export function marketSentimentLabel(
  lang: Lang,
  labelZh: string,
  labelEn: string,
): string {
  if (lang === 'en') return labelEn
  if (lang === 'zh-Hant') {
    const map: Record<string, string> = {
      偏空: '偏空',
      偏谨慎: '偏謹慎',
      中性: '中性',
      偏建设性: '偏建設性',
      偏多: '偏多',
    }
    return map[labelZh] || labelZh
  }
  return labelZh
}

export function dailyMarketTitle(lang: Lang): string {
  if (lang === 'zh-Hant') return '每日 24h 行情早報'
  if (lang === 'en') return 'Daily 24h market brief'
  return '每日 24h 行情早报'
}

export function dailyMarketIntro(lang: Lang, dayKey: string, atMarkdown: string): string {
  if (lang === 'zh-Hant') {
    return `🌅 **每日早報 · 過去 24 小時行情**（東八區每天 **09:00** 自動推送 · **${dayKey}**）\n\n${atMarkdown} 早報來了\n`
  }
  if (lang === 'en') {
    return `🌅 **Daily brief · past 24h** (auto-push **09:00** Asia/Shanghai · **${dayKey}**)\n\n${atMarkdown} morning brief is here\n`
  }
  return `🌅 **每日早报 · 过去 24 小时行情**（东八区每天 **09:00** 自动推送 · **${dayKey}**）\n\n${atMarkdown} 早报来了\n`
}

export function hourlyMarketTitle(lang: Lang): string {
  if (lang === 'zh-Hant') return '小時行情掃報'
  if (lang === 'en') return 'Hourly market scan'
  return '小时行情扫报'
}

/** Asia/Shanghai (= UTC+8) wall clock string. */
export function formatEast8(ts: number): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(ts))
  } catch {
    return new Date(ts).toISOString()
  }
}

/** Short Asia/Shanghai axis label for charts, e.g. `11:00`. */
export function formatEast8Hm(ts: number): string {
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

/** Axis tick for a K-line interval — day bars need MM-DD, intraday keep HH:mm. */
export function formatChartAxisLabel(ts: number, interval: string): string {
  if (interval === '1D') {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date(ts))
      const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
      return `${get('month')}-${get('day')}`
    } catch {
      const d = new Date(ts + 8 * 3600_000)
      return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    }
  }
  if (interval === '4H') {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date(ts))
      const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
      const hour = get('hour') === '24' ? '00' : get('hour')
      return `${get('month')}-${get('day')} ${hour}:${get('minute')}`
    } catch {
      return formatEast8Hm(ts)
    }
  }
  return formatEast8Hm(ts)
}

export function isKlineIntervalBar(v: unknown): v is KlineIntervalBar {
  return KLINE_INTERVALS.some((i) => i.bar === v)
}

/** Feishu action row — switch market K-line interval (same set as web Market desk). */
export function klineIntervalActions(
  selected: KlineIntervalBar,
  opts: { mode: 'hourly' | 'daily'; lang: Lang },
): Record<string, unknown> {
  return {
    tag: 'action',
    actions: KLINE_INTERVALS.map((opt) => ({
      tag: 'button',
      type: opt.bar === selected ? 'primary' : 'default',
      text: { tag: 'plain_text', content: opt.label },
      value: {
        action: 'market_kline_tf',
        bar: opt.bar,
        mode: opts.mode,
        lang: opts.lang,
      },
    })),
  }
}

/** Half-hour slot key in Asia/Shanghai, e.g. `2026-11-24T20:00` / `…T20:30` (cron dedupe). */
export function shanghaiHalfHourKey(ts: number = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(ts))
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
    const hour = get('hour') === '24' ? '00' : get('hour')
    const minute = String(Math.floor(Number(get('minute')) / 30) * 30).padStart(2, '0')
    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${minute}`
  } catch {
    const d = new Date(ts)
    const m = Math.floor(d.getUTCMinutes() / 30) * 30
    return `${d.toISOString().slice(0, 13)}:${String(m).padStart(2, '0')}`
  }
}

/** Calendar day key in Asia/Shanghai, e.g. `2026-11-25` (daily cron dedupe). */
export function shanghaiDayKey(ts: number = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(ts))
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
    return `${get('year')}-${get('month')}-${get('day')}`
  } catch {
    return new Date(ts).toISOString().slice(0, 10)
  }
}

export type Day24hStats = {
  bars: number
  open: number
  high: number
  low: number
  close: number
  changePct: number
  fromTs: number
  toTs: number
}

/** Last ~24 × 1H primary-venue bars → open/high/low/close + % change. */
export function compute24hStats(snap: MarketSnapshot): Day24hStats | null {
  const bars = snap.hourly?.kline?.bars || []
  if (bars.length < 2) return null
  const cutoff = Date.now() - 24 * 3600_000
  let window = bars.filter((b) => b.t >= cutoff)
  if (window.length < 2) window = bars.slice(-24)
  if (window.length < 2) return null
  const open = window[0]!.o
  const close = window[window.length - 1]!.c
  const high = Math.max(...window.map((b) => b.h))
  const low = Math.min(...window.map((b) => b.l))
  const changePct = open !== 0 ? ((close - open) / open) * 100 : 0
  return {
    bars: window.length,
    open,
    high,
    low,
    close,
    changePct,
    fromTs: window[0]!.t,
    toTs: window[window.length - 1]!.t,
  }
}

/**
 * Fixed 早报 skeleton (content changes daily; section order never does):
 * 1) Header + 24h range  2) K线 + prints  3) TL;DR (4 beats)
 * 4) Opportunity (≤3)  5) Risk (≤3)  6) Data sources  7) Footer
 */
export const DAILY_REPORT_SECTIONS = [
  'header_24h',
  'kline_prints',
  'tldr',
  'opportunity',
  'risk',
  'sources',
  'footer',
] as const

/**
 * Desk-curated human links shown on 每日早报 (TL;DR logos + 数据来源).
 * Prefer authoritative venue / macro / news hubs already in SOURCE_CATALOG —
 * never invent URLs. Proven 404/410 are dropped by resolveCiteUrlOrNull.
 */
const DAILY_FIXED_LINKS: { id: string; label: string; url: string; domain: string }[] = [
  // Venues / prints
  { id: 'binance-kline', label: 'Binance K线', url: BINANCE_KLINE_URL, domain: 'binance.com' },
  { id: 'okx-kline', label: 'OKX K线', url: OKX_KLINE_URL, domain: 'okx.com' },
  {
    id: 'bitget-futures',
    label: 'Bitget K线',
    url: BITGET_KLINE_URL,
    domain: 'bitget.com',
  },
  { id: 'kitco', label: 'Kitco', url: KITCO_GOLD_URL, domain: 'kitco.com' },
  {
    id: 'kitco-news',
    label: 'Kitco News',
    url: 'https://www.kitco.com/news/category/metals',
    domain: 'kitco.com',
  },
  // Macro / rates / dollar
  {
    id: 'yahoo-gc',
    label: 'Yahoo GC',
    url: 'https://finance.yahoo.com/quote/GC=F',
    domain: 'yahoo.com',
  },
  {
    id: 'yahoo-dxy',
    label: 'Yahoo DXY',
    url: 'https://finance.yahoo.com/quote/DX-Y.NYB',
    domain: 'yahoo.com',
  },
  {
    id: 'yahoo-tnx',
    label: 'Yahoo 10Y',
    url: 'https://finance.yahoo.com/quote/%5ETNX',
    domain: 'yahoo.com',
  },
  {
    id: 'fed-press',
    label: 'Fed',
    url: 'https://www.federalreserve.gov/newsevents/pressreleases.htm',
    domain: 'federalreserve.gov',
  },
  {
    id: 'fred',
    label: 'FRED',
    url: 'https://fred.stlouisfed.org/',
    domain: 'stlouisfed.org',
  },
  // Authoritative news / commodities desks
  {
    id: 'reuters-gold',
    label: 'Reuters',
    url: 'https://www.reuters.com/markets/commodities/',
    domain: 'reuters.com',
  },
  {
    id: 'bloomberg-gold',
    label: 'Bloomberg',
    url: 'https://www.bloomberg.com/markets/commodities',
    domain: 'bloomberg.com',
  },
  {
    id: 'cnbc-gold',
    label: 'CNBC Gold',
    url: 'https://www.cnbc.com/gold/',
    domain: 'cnbc.com',
  },
  {
    id: 'marketwatch-gold',
    label: 'MarketWatch',
    url: 'https://www.marketwatch.com/investing/future/gc00',
    domain: 'marketwatch.com',
  },
  {
    id: 'investing-gold',
    label: 'Investing',
    url: 'https://www.investing.com/commodities/gold',
    domain: 'investing.com',
  },
  {
    id: 'ft-commodities',
    label: 'FT',
    url: 'https://www.ft.com/commodities',
    domain: 'ft.com',
  },
  {
    id: 'wsj-markets',
    label: 'WSJ',
    url: 'https://www.wsj.com/finance/markets',
    domain: 'wsj.com',
  },
  // Physical / official gold
  {
    id: 'cme-comex',
    label: 'COMEX',
    url: 'https://www.cmegroup.com/markets/metals/precious/gold.html',
    domain: 'cmegroup.com',
  },
  {
    id: 'lbma',
    label: 'LBMA',
    url: 'https://www.lbma.org.uk/prices-and-data/precious-metal-prices',
    domain: 'lbma.org.uk',
  },
  {
    id: 'wgc',
    label: 'WGC',
    url: 'https://www.gold.org/goldhub/gold-focus',
    domain: 'gold.org',
  },
  // Crypto-desk gold / macro overlap
  {
    id: 'coindesk-markets',
    label: 'CoinDesk',
    url: 'https://www.coindesk.com/markets/',
    domain: 'coindesk.com',
  },
  // KOL pulse
  {
    id: 'kol-x-kitco',
    label: 'Kitco X',
    url: 'https://x.com/KitcoNewsNow',
    domain: 'x.com',
  },
]

/** Max logo buttons per Lark action row (Lark UI limit). */
const LOGO_ROW_SIZE = 5
/** Cap logo rows so cold cron stays within maxDuration. */
const LOGO_ROW_MAX = 4

/** Drop sources whose cite URL is proven HTTP 404/410 (or marked down for missing page). */
export function isCiteableSource(s: ReportSource | undefined | null): boolean {
  if (!s?.url) return false
  if (s.health === 'down' && /404|410|not linked/i.test(s.detail || '')) return false
  if (s.health === 'down' && /HTTP 404|HTTP 410/i.test(s.detail || '')) return false
  // Explicitly never cite when detail says cite was rejected as missing
  if (/cite URL HTTP 404\/410/i.test(s.detail || '')) return false
  return true
}

/**
 * Fixed desk links for 早报 — skip any that currently 404/410.
 * Timeouts / bot-blocks are kept (not proven missing for end users).
 * Resolved in parallel so a larger source set still fits cron maxDuration.
 */
export async function dailySourceHyperlinksLive(): Promise<string> {
  const settled = await Promise.all(
    DAILY_FIXED_LINKS.map(async (l) => {
      const resolved = await resolveCiteUrlOrNull(l.url, l.id)
      if (!resolved) return null
      return `[${l.label}](${resolved.url})`
    }),
  )
  return settled.filter(Boolean).join(' · ')
}

/** Always 4 TL;DR beats: 即时 / 走势 / 事件 / 关注 — pad missing with stable placeholders. */
export function normalizeDailyTldrBeats(snap: MarketSnapshot, lang: Lang): string[] {
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const raw = pointText(
    snap.hourly?.tldr?.[0] || { rank: 1, en: '', zh: '', sourceIds: [] },
    lang,
  )
  const lines = raw
    .split(/\n+/)
    .map((x) => x.trim().replace(/^•\s*/, ''))
    .filter(Boolean)

  const findBeat = (re: RegExp) => lines.find((l) => re.test(l))

  const liveFromSnap = (() => {
    const bits: string[] = []
    if (snap.binance) {
      bits.push(
        hans || hant
          ? `Binance 金 ${snap.binance.last.toFixed(2)}`
          : `Binance ${snap.binance.last.toFixed(2)}`,
      )
    } else if (snap.okx) {
      bits.push(hans || hant ? `OKX 金 ${snap.okx.last.toFixed(2)}` : `OKX ${snap.okx.last.toFixed(2)}`)
    }
    if (snap.spot) bits.push(hans || hant ? `现货 ${snap.spot.last.toFixed(2)}` : `spot ${snap.spot.last.toFixed(2)}`)
    if (!bits.length) return ''
    if (hans) return `即时：${bits.join(' · ')}。`
    if (hant) return `即時：${bits.join(' · ')}。`
    return `Live: ${bits.join(' · ')}.`
  })()

  const live =
    findBeat(/^(即时：|即時：|Live:)/i) ||
    liveFromSnap ||
    (hans ? '即时：报价暂缺。' : hant ? '即時：報價暫缺。' : 'Live: prints unavailable.')
  const trend =
    findBeat(/^(走势：|走勢：|Trend:)/i) ||
    (hans ? '走势：本窗口暂无基差／错位要点。' : hant ? '走勢：本窗口暫無基差／錯位要點。' : 'Trend: no tape note this window.')
  const event =
    findBeat(/^(事件：|Event:)/i) ||
    (hans ? '事件：本窗口暂无重大宏观要点。' : hant ? '事件：本窗口暫無重大宏觀要點。' : 'Event: no major macro note this window.')
  const watch =
    findBeat(/^(关注：|關注：|Watch:)/i) ||
    (hans ? '关注：继续盯 DXY／10Y 与金价联动。' : hant ? '關注：繼續盯 DXY／10Y 與金價聯動。' : 'Watch: keep an eye on DXY / 10Y vs gold.')

  return [live, trend, event, watch]
}

/** Cap Opp/Risk to 3 ranked lines. Optional byId adds markdown chips (dry / text fallback). */
export function normalizeDailyRanked(
  points: RankedPoint[] | undefined,
  lang: Lang,
  empty: string,
  max = 3,
  byId?: Map<string, ReportSource>,
): string[] {
  const rows = (points || []).slice(0, max)
  if (!rows.length) return [`• ${empty}`]
  return rows.map((p, i) => {
    const body = `${i + 1}. ${pointText(p, lang)}`
    if (!byId) return body
    const chips = sourceChipLine(pointSources(p, byId))
    return chips ? `${body}\n  🔗 ${chips}` : body
  })
}

/** Fixed desk source links as markdown (dry / text fallback when buttons unavailable). */
export function dailySourceHyperlinks(): string {
  return DAILY_FIXED_LINKS.map((l) => `[${l.label}](${l.url})`).join(' · ')
}

/** Fixed desk links as ReportSource rows for logo buttons (404-filtered). */
export async function dailyFixedSourcesLive(): Promise<ReportSource[]> {
  const now = Date.now()
  const settled = await Promise.all(
    DAILY_FIXED_LINKS.map(async (l) => {
      const resolved = await resolveCiteUrlOrNull(l.url, l.id)
      if (!resolved) return null
      const kind: ReportSource['kind'] =
        /x\.com|twitter/i.test(l.domain)
          ? 'social'
          : /reuters|bloomberg|cnbc|wsj|ft\.com|kitco|marketwatch|investing|coindesk/i.test(
                l.domain,
              )
            ? 'news'
            : /federalreserve|fred|stlouisfed/i.test(l.domain)
              ? 'macro'
              : /cmegroup|lbma|gold\.org/i.test(l.domain)
                ? 'indicator'
                : /yahoo\.com/i.test(l.domain)
                  ? 'price'
                  : 'exchange'
      return {
        id: l.id,
        captionEn: l.label,
        captionZh: l.label,
        url: resolved.url,
        domain: l.domain,
        logoUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(l.domain)}&sz=64`,
        kind,
        health: 'ok' as const,
        checkedAt: now,
        detail: resolved.rewritten ? 'cite rewritten (primary 404)' : 'desk fixed link',
      } satisfies ReportSource
    }),
  )
  return settled.filter((s): s is ReportSource => Boolean(s))
}

/**
 * Morning group digest: past-24h XAU range + fixed TL;DR / Opp / Risk skeleton.
 * Numbers and bullets change daily; section titles and order stay fixed.
 * Text/dry path uses markdown chips; interactive cards use logo buttons via buildMarketCard.
 * Prefer `formatDaily24hMarketAnswerAsync` so fixed links are 404-checked live.
 */
export function formatDaily24hMarketAnswer(snap: MarketSnapshot, lang: Lang = 'zh-Hans'): string {
  return formatDaily24hMarketAnswerWithLinks(snap, lang, dailySourceHyperlinks())
}

/** Same as formatDaily24hMarketAnswer, but probes fixed links and drops proven 404/410. */
export async function formatDaily24hMarketAnswerAsync(
  snap: MarketSnapshot,
  lang: Lang = 'zh-Hans',
): Promise<string> {
  const links = (await dailySourceHyperlinksLive()) || dailySourceHyperlinks()
  return formatDaily24hMarketAnswerWithLinks(snap, lang, links)
}

function formatDaily24hMarketAnswerWithLinks(
  snap: MarketSnapshot,
  lang: Lang,
  sourceLinks: string,
): string {
  const empty =
    lang === 'zh-Hans'
      ? '过去 24 小时暂无要点。'
      : lang === 'zh-Hant'
        ? '過去 24 小時暫無要點。'
        : 'No points in the last 24h.'
  const byId = sourcesById(snap.hourly?.sources)
  const tldr = normalizeDailyTldrBeats(snap, lang)
  const linkLine = sourceLinks.trim() ? `🔗 ${sourceLinks}` : null
  return [
    pricesAndKlineBlock(snap, lang, 'daily'),
    '',
    '**📋 TL;DR**',
    ...tldr.map((l) => (l.startsWith('•') ? l : `• ${l}`)),
    '',
    '**✨ Opportunity**',
    ...normalizeDailyRanked(snap.hourly?.opportunity, lang, empty, 3, byId),
    '',
    '**⚠️ Risk**',
    ...normalizeDailyRanked(snap.hourly?.risk, lang, empty, 3, byId),
    '',
    dailySourcesSectionTitle(lang),
    linkLine ||
      (lang === 'en'
        ? '• Source links unavailable this run.'
        : lang === 'zh-Hant'
          ? '• 本輪來源連結暫不可用。'
          : '• 本轮来源链接暂不可用。'),
    '',
    marketFooterBlock(snap, lang, '', 'daily'),
  ].join('\n')
}

/** Compact sparkline from closes (Lark has no canvas). */
export function asciiCloseSpark(bars: KlineBar[], width = 16): string {
  if (!bars.length) return '—'
  const slice = bars.slice(-width)
  const closes = slice.map((b) => b.c)
  const lo = Math.min(...closes)
  const hi = Math.max(...closes)
  const chars = '▁▂▃▄▅▆▇█'
  if (!(hi > lo)) return chars[4]!.repeat(slice.length)
  return slice
    .map((b) => {
      const t = (b.c - lo) / (hi - lo)
      return chars[Math.min(chars.length - 1, Math.max(0, Math.round(t * (chars.length - 1))))]!
    })
    .join('')
}

/** Per-bar OHLC wick using relative mid of the window. */
export function asciiCandleRow(bars: KlineBar[], width = 12): string {
  if (!bars.length) return '—'
  const slice = bars.slice(-width)
  const lo = Math.min(...slice.map((b) => b.l))
  const hi = Math.max(...slice.map((b) => b.h))
  const mid = (lo + hi) / 2
  return slice
    .map((b) => {
      const up = b.c >= b.o
      if (hi <= lo) return up ? '┃' : '│'
      // High wick relative to mid → taller glyph when close above mid
      if (up) return b.c >= mid ? '▲' : '△'
      return b.c < mid ? '▼' : '▽'
    })
    .join('')
}

function pointText(p: RankedPoint, lang: Lang): string {
  if (lang === 'zh-Hans' || lang === 'zh-Hant') return p.zh || p.en
  return p.en
}

function sourcesById(sources: ReportSource[] | undefined): Map<string, ReportSource> {
  const map = new Map<string, ReportSource>()
  for (const s of sources || []) map.set(s.id, s)
  return map
}

/**
 * Unique sources for a ranked point (max 5).
 * News / social / announcements dedupe by URL so multiple articles on the same
 * host (e.g. several Kitco takes of one event) can all appear as sources.
 * Venue / price / API rows still dedupe by domain to avoid ticker+candle doubles.
 */
export function pointSources(
  p: RankedPoint,
  byId: Map<string, ReportSource>,
): ReportSource[] {
  const out: ReportSource[] = []
  const seen = new Set<string>()
  for (const id of p.sourceIds || []) {
    const s = byId.get(id)
    if (!s || !isCiteableSource(s)) continue
    const newsLike = s.kind === 'news' || s.kind === 'social' || s.kind === 'announcement'
    const key = newsLike
      ? (s.url || s.id).toLowerCase()
      : (s.domain || s.id).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= 5) break
  }
  return out
}

/** Short human label for a source chip (exchange / news / social host — never API path). */
function sourceChipLabel(s: ReportSource): string {
  const host = (s.domain || '').replace(/^www\./, '')
  const url = s.url || ''
  // TradingView BINANCE/OKX:XAUUSDT.P are geo-safe K-line targets
  if (/tradingview\.com/i.test(host) && /BINANCE/i.test(url)) return 'Binance K线'
  if (/tradingview\.com/i.test(host) && /OKX|XAUUSDT/i.test(url)) return 'OKX K线'
  if (/binance\.com/i.test(host)) return 'Binance K线'
  if (/okx\.com/i.test(host)) return 'OKX K线'
  if (/bitget\.com/i.test(host)) return 'Bitget K线'
  if (/kitco\.com/i.test(host)) {
    const cap = `${s.captionEn || ''} ${s.captionZh || ''}`
    if (/survey|調查|调查/i.test(cap)) return 'Kitco Survey'
    if (/paradox|悖論|悖论/i.test(cap)) return 'Kitco Paradox'
    if (/TDS|Melek|hawkish|鷹派|鹰派/i.test(cap)) return 'Kitco TDS'
    if (/Catalyst|Miller|holding|利率/i.test(cap)) return 'Kitco Rates'
    if (/news|新聞|新闻/i.test(cap)) return 'Kitco News'
    return 'Kitco'
  }
  if (/yahoo\.com/i.test(host)) return 'Yahoo行情'
  if (/federalreserve\.gov/i.test(host)) return '美联储'
  if (/x\.com|twitter\.com/i.test(host)) return 'X'
  if (/reuters\.com/i.test(host)) return '路透'
  if (/bloomberg\.com/i.test(host)) return '彭博'
  if (/cnbc\.com/i.test(host)) return 'CNBC'
  if (/wsj\.com/i.test(host)) return 'WSJ'
  if (/ft\.com/i.test(host)) return 'FT'
  if (/coindesk\.com/i.test(host)) return 'CoinDesk'
  if (/theblock\.co/i.test(host)) return 'The Block'
  if (/cointelegraph\.com/i.test(host)) return 'Cointelegraph'
  if (/decrypt\.co/i.test(host)) return 'Decrypt'
  if (/ecb\.europa\.eu/i.test(host)) return '欧洲央行'
  if (/treasury\.gov/i.test(host)) return '美财政部'
  if (/bls\.gov/i.test(host)) return 'BLS'
  if (/imf\.org/i.test(host)) return 'IMF'
  if (/bis\.org/i.test(host)) return 'BIS'
  if (/gold\.org/i.test(host)) return '黄金协会'
  if (/caixinglobal\.com|caixin\.com/i.test(host)) return '财新'
  if (/nikkei\.com/i.test(host)) return '日经'
  if (/apnews\.com/i.test(host)) return '美联社'
  if (/lbma\.org/i.test(host)) return 'LBMA'
  if (/bybit\.com/i.test(host)) return 'Bybit'
  return host.slice(0, 18) || '来源'
}

/** Inline markdown chips — human UI links (K-line / news / social), not JSON APIs. */
function sourceChipLine(sources: ReportSource[]): string {
  if (!sources.length) return ''
  return sources.map((s) => `[${sourceChipLabel(s)}](${s.url})`).join(' · ')
}

function renderSection(
  title: string,
  points: RankedPoint[],
  empty: string,
  lang: Lang,
  oneLine = false,
  byId?: Map<string, ReportSource>,
): string[] {
  const out = [`**${title}**`]
  if (!points.length) {
    out.push(`• ${empty}`)
    return out
  }
  if (oneLine) {
    // Coherent multi-beat TL;DR (Live / Tape / Context / Watch) — one bullet per line
    const raw = pointText(points[0]!, lang)
    for (const line of raw.split(/\n+/).map((x) => x.trim()).filter(Boolean)) {
      out.push(line.startsWith('•') ? line : `• ${line}`)
    }
    if (byId) {
      const chips = sourceChipLine(pointSources(points[0]!, byId))
      if (chips) out.push(`  🔗 ${chips}`)
    }
    return out
  }
  for (const p of points.slice(0, 4)) {
    out.push(`${p.rank}. ${pointText(p, lang)}`)
    if (byId) {
      const chips = sourceChipLine(pointSources(p, byId))
      if (chips) out.push(`  🔗 ${chips}`)
    }
  }
  return out
}

function mdDiv(content: string): Record<string, unknown> {
  return { tag: 'div', text: { tag: 'lark_md', content } }
}

/** Lark action row: each source is a button with site favicon as the clickable logo. */
async function logoLinkActions(sources: ReportSource[]): Promise<Record<string, unknown> | null> {
  if (!sources.length) return null
  const slice = sources.slice(0, LOGO_ROW_SIZE)
  const keys = await Promise.all(slice.map((s) => resolveFaviconImgKey(s.domain, s.logoUrl)))
  const actions: Record<string, unknown>[] = slice.map((s, i) => {
    const label = sourceChipLabel(s).slice(0, 24)
    const btn: Record<string, unknown> = {
      tag: 'button',
      type: 'default',
      text: { tag: 'plain_text', content: label },
      multi_url: {
        url: s.url,
        pc_url: s.url,
        android_url: s.url,
        ios_url: s.url,
      },
    }
    const imgKey = keys[i]
    if (imgKey) btn.icon = { tag: 'custom_icon', img_key: imgKey }
    return btn
  })
  if (!actions.length) return null
  return { tag: 'action', actions }
}

/** Multiple action rows so 早报 can surface more than 5 desk sources. */
async function logoLinkActionRows(
  sources: ReportSource[],
  maxRows = LOGO_ROW_MAX,
): Promise<Record<string, unknown>[]> {
  if (!sources.length) return []
  const cap = Math.max(1, maxRows) * LOGO_ROW_SIZE
  const list = sources.slice(0, cap)
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < list.length; i += LOGO_ROW_SIZE) {
    const row = await logoLinkActions(list.slice(i, i + LOGO_ROW_SIZE))
    if (row) rows.push(row)
  }
  return rows
}

/**
 * Merge fixed desk links with healthy live hourly sources (news / macro / venues / social)
 * so the morning report cites a broad set — not only the four legacy chips.
 */
export function dailyExpandedSources(
  fixed: ReportSource[],
  hourlySources: ReportSource[] | undefined,
  max = 24,
): ReportSource[] {
  const out: ReportSource[] = []
  const seen = new Set<string>()
  const push = (s: ReportSource | undefined | null) => {
    if (!s || !isCiteableSource(s) || out.length >= max) return
    const key = `${(s.domain || '').toLowerCase()}|${(s.url || '').toLowerCase()}`
    if (seen.has(key)) return
    // Prefer human pages over raw JSON API endpoints
    if (
      /(?:^|\/\/)(?:api|fapi|dapi|eapi)\./i.test(s.url) ||
      /okx\.com\/api|bitget\.com\/api|gold-api|query1\.finance/i.test(s.url)
    ) {
      return
    }
    seen.add(key)
    out.push(s)
  }
  for (const s of fixed) push(s)
  const live = (hourlySources || []).filter((s) =>
    /^(news|macro|exchange|announcement|social|indicator|price)$/i.test(s.kind || ''),
  )
  // Prefer healthy / unchecked over down
  live.sort((a, b) => {
    const score = (s: ReportSource) =>
      s.health === 'ok' ? 0 : s.health === 'unchecked' ? 1 : s.health === 'degraded' ? 2 : 3
    return score(a) - score(b)
  })
  for (const s of live) push(s)
  return out
}

function dailySourcesSectionTitle(lang: Lang): string {
  if (lang === 'zh-Hant') return '**📚 數據來源**'
  if (lang === 'en') return '**📚 Data sources**'
  return '**📚 数据来源**'
}

function marketEmptyHint(mode: 'hourly' | 'daily', lang: Lang): string {
  if (mode === 'daily') {
    return lang === 'zh-Hans'
      ? '过去 24 小时暂无要点。'
      : lang === 'zh-Hant'
        ? '過去 24 小時暫無要點。'
        : 'No points in the last 24h.'
  }
  return lang === 'zh-Hans'
    ? '本小时暂无要点。'
    : lang === 'zh-Hant'
      ? '本小時暫無要點。'
      : 'No points this hour.'
}

function pricesAndKlineBlock(
  snap: MarketSnapshot,
  lang: Lang,
  mode: 'hourly' | 'daily',
  opts?: { asciiKline?: boolean },
): string {
  const hourly = snap.hourly
  const scanAt = formatEast8(snap.fetchedAt || Date.now())
  const lines: string[] = []
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'

  if (mode === 'daily') {
    const stats = compute24hStats(snap)
    const chg =
      stats == null
        ? '—'
        : `${stats.changePct >= 0 ? '+' : ''}${stats.changePct.toFixed(2)}%`
    // Fixed daily header skeleton — always emit the same fields (— when missing).
    if (hans) {
      lines.push('📊 **过去 24 小时行情报告 · V Exchange Risk**', '')
      lines.push(
        `⏱ **报告时间：** **${scanAt}**（东八区）`,
        '• 每日早上自动推送；数据覆盖近 **24 根 1H K 线**（Binance → OKX → Bitget）+ 当日宏观／来源要点。',
        '',
        '📈 **24h 价格区间**',
        stats
          ? `• **开：** **${stats.open.toFixed(2)}** → **收：** **${stats.close.toFixed(2)}**（**${chg}**）`
          : '• **开：** **—** → **收：** **—**（**—**）',
        stats
          ? `• **高：** **${stats.high.toFixed(2)}** · **低：** **${stats.low.toFixed(2)}** · **K 线数：** **${stats.bars}**`
          : '• **高：** **—** · **低：** **—** · **K 线数：** **—**',
        stats
          ? `• **窗口：** ${formatEast8(stats.fromTs)} → ${formatEast8(stats.toTs)}（东八区）`
          : '• **窗口：** —（东八区）',
        '',
      )
    } else if (hant) {
      lines.push('📊 **過去 24 小時行情報告 · V Exchange Risk**', '')
      lines.push(
        `⏱ **報告時間：** **${scanAt}**（東八區）`,
        '• 每日早上自動推送；數據覆蓋近 **24 根 1H K 線**（Binance → OKX → Bitget）+ 當日宏觀／來源要點。',
        '',
        '📈 **24h 價格區間**',
        stats
          ? `• **開：** **${stats.open.toFixed(2)}** → **收：** **${stats.close.toFixed(2)}**（**${chg}**）`
          : '• **開：** **—** → **收：** **—**（**—**）',
        stats
          ? `• **高：** **${stats.high.toFixed(2)}** · **低：** **${stats.low.toFixed(2)}** · **K 線數：** **${stats.bars}**`
          : '• **高：** **—** · **低：** **—** · **K 線數：** **—**',
        stats
          ? `• **窗口：** ${formatEast8(stats.fromTs)} → ${formatEast8(stats.toTs)}（東八區）`
          : '• **窗口：** —（東八區）',
        '',
      )
    } else {
      lines.push('📊 **Past-24h market report · V Exchange Risk**', '')
      lines.push(
        `⏱ **As of:** **${scanAt}** (UTC+8)`,
        '• Daily morning push; ~**24** × 1H bars (Binance → OKX → Bitget) + macro / source notes.',
        '',
        '📈 **24h range**',
        stats
          ? `• **Open:** **${stats.open.toFixed(2)}** → **Close:** **${stats.close.toFixed(2)}** (**${chg}**)`
          : '• **Open:** **—** → **Close:** **—** (**—**)',
        stats
          ? `• **High:** **${stats.high.toFixed(2)}** · **Low:** **${stats.low.toFixed(2)}** · **Bars:** **${stats.bars}**`
          : '• **High:** **—** · **Low:** **—** · **Bars:** **—**',
        stats
          ? `• **Window:** ${formatEast8(stats.fromTs)} → ${formatEast8(stats.toTs)} (UTC+8)`
          : '• **Window:** — (UTC+8)',
        '',
      )
    }
  } else if (hans) {
    lines.push('📊 **小时行情扫报 · V Exchange Risk**', '')
    lines.push(
      `⏱ **最近一次扫描：** **${scanAt}**（东八区）`,
      '• 网页端 **每个整点（东八区）自动扫描**；本次为即时拉取（与网页「立即扫描」同源）。',
      '',
    )
  } else if (hant) {
    lines.push('📊 **小時行情掃報 · V Exchange Risk**', '')
    lines.push(
      `⏱ **最近一次掃描：** **${scanAt}**（東八區）`,
      '• 網頁端 **每個整點（東八區）自動掃描**；本次為即時拉取（與網頁「立即掃描」同源）。',
      '',
    )
  } else {
    lines.push('📊 **Hourly market scan · V Exchange Risk**', '')
    lines.push(
      `⏱ **Last scan:** **${scanAt}** (UTC+8)`,
      '• Web desk **auto-scans every hour on the hour (UTC+8)**; this reply is an on-demand pull (same engine as **Scan now**).',
      '',
    )
  }

  // Interactive cards use VChart instead of ASCII; text/dry keeps ASCII spark.
  if (opts?.asciiKline !== false) {
    lines.push(...renderKline(hourly?.kline, lang), '')
  } else {
    const n = mode === 'daily' ? 24 : 16
    lines.push(...renderKlineCaption(hourly?.kline, lang, n), '')
  }
  if (hans) {
    if (snap.binance) lines.push(`• **Binance XAUUSDT：** **${snap.binance.last.toFixed(2)}**`)
    else if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP（备用）：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.binance && snap.okx) {
      lines.push(`• **OKX XAU-USDT-SWAP（备用）：** **${snap.okx.last.toFixed(2)}**`)
    }
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **现货 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情绪：** **${marketSentimentLabel(lang, hourly.sentiment.labelZh, hourly.sentiment.labelEn)}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
  } else if (hant) {
    if (snap.binance) lines.push(`• **Binance XAUUSDT：** **${snap.binance.last.toFixed(2)}**`)
    else if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP（備用）：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.binance && snap.okx) {
      lines.push(`• **OKX XAU-USDT-SWAP（備用）：** **${snap.okx.last.toFixed(2)}**`)
    }
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **現貨 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情緒：** **${marketSentimentLabel(lang, hourly.sentiment.labelZh, hourly.sentiment.labelEn)}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
  } else {
    if (snap.binance) lines.push(`• **Binance XAUUSDT:** **${snap.binance.last.toFixed(2)}**`)
    else if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP (backup):** **${snap.okx.last.toFixed(2)}**`)
    if (snap.binance && snap.okx) {
      lines.push(`• **OKX XAU-USDT-SWAP (backup):** **${snap.okx.last.toFixed(2)}**`)
    }
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT:** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **Spot XAU:** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **Sentiment:** **${marketSentimentLabel(lang, hourly.sentiment.labelZh, hourly.sentiment.labelEn)}** (${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score})`,
      )
    }
  }
  return lines.join('\n')
}

function marketFooterBlock(
  snap: MarketSnapshot,
  lang: Lang,
  question: string,
  mode: 'hourly' | 'daily',
): string {
  const hourly = snap.hourly
  const bare = isBareMarketQuery(question)
  const lines: string[] = []
  if (mode === 'hourly' && hourly?.vexPlaceholder) {
    if (lang === 'zh-Hans') lines.push(`📊 **V Exchange 指标**`, `• ${hourly.vexNoteZh}`, '')
    else if (lang === 'zh-Hant') lines.push(`📊 **V Exchange 指標**`, `• ${hourly.vexNoteZh}`, '')
    else lines.push(`📊 **V Exchange indicators**`, `• ${hourly.vexNoteEn}`, '')
  }
  if (mode === 'hourly' && !bare && question.trim()) {
    if (lang === 'zh-Hans') lines.push(`❓ **针对你的问题：** 「${question.slice(0, 120)}」`, '')
    else if (lang === 'zh-Hant') lines.push(`❓ **針對你的問題：** 「${question.slice(0, 120)}」`, '')
    else lines.push(`❓ **On your question:** “${question.slice(0, 120)}”`, '')
  }
  if (lang === 'zh-Hans') {
    lines.push(
      mode === 'daily'
        ? '• **解读：** 价格观察（bps／基差）≠ 新闻／宏观原因。值班排查请贴告警或私聊机器人发 **排查**。'
        : '• **解读：** 价格观察（bps／基差）≠ 新闻／宏观原因。事故排查请贴告警或发 **investigate**。',
      '',
      `• [打开网页 Market](${DESK_MARKET})`,
    )
  } else if (lang === 'zh-Hant') {
    lines.push(
      '• **解讀：** 價格觀察（bps／基差）≠ 新聞／宏觀原因。事故排查請貼告警或發 **investigate**。',
      '',
      `• [打開網頁 Market](${DESK_MARKET})`,
    )
  } else {
    lines.push(
      '• **Guidance:** price observations (bps / basis) ≠ news/macro causes. For an incident, paste the alert or type **investigate**.',
      '',
      `• [Open web Market](${DESK_MARKET})`,
    )
  }
  return lines.join('\n')
}

/**
 * Interactive market card (daily + half-hourly).
 * Sources are favicon logo buttons (`multi_url`) after each point / TL;DR.
 * Text/dry fallback still uses markdown chips when Lark is not configured.
 */
export async function buildMarketCard(opts: {
  title: string
  snap: MarketSnapshot
  lang: Lang
  question?: string
  mode?: 'hourly' | 'daily'
  /** Extra markdown prepended (e.g. daily cron intro). */
  intro?: string
  /** Extra markdown appended (e.g. LLM enrich). Ignored for daily to keep format fixed. */
  appendix?: string
  template?: string
  /** Override OKX series (interval switcher). Defaults to snap.hourly.kline. */
  kline?: HourlyKlineSeries | null
}): Promise<Record<string, unknown>> {
  const {
    title,
    snap,
    lang,
    question = lang.startsWith('zh') ? '行情' : 'Market',
    mode = 'hourly',
    intro = '',
    appendix = '',
    template = 'wathet',
    kline: klineOverride,
  } = opts

  const empty = marketEmptyHint(mode, lang)
  // Daily: never append free-form LLM text — keeps section order identical every day.
  const bodyAppendix = mode === 'daily' ? '' : appendix

  const bodyMd =
    mode === 'daily'
      ? await formatDaily24hMarketAnswerAsync(snap, lang)
      : formatMarketAnswer(snap, lang, question)

  const fallbackMd = [intro, bodyMd, bodyAppendix].filter(Boolean).join('\n').trim()

  if (!larkConfigured()) {
    return simpleCard(title, fallbackMd, template)
  }

  const hourly = snap.hourly
  const kline = klineOverride !== undefined ? klineOverride : hourly?.kline
  const selectedBar: KlineIntervalBar = isKlineIntervalBar(kline?.interval)
    ? kline.interval
    : '1H'
  // Merge selected series into a snap clone so caption / OHLC match the chart.
  const snapForKline: MarketSnapshot =
    hourly && kline
      ? { ...snap, hourly: { ...hourly, kline } }
      : snap
  const byId = sourcesById(hourly?.sources)
  const elements: Record<string, unknown>[] = []
  if (intro.trim()) elements.push(mdDiv(intro.trim()))

  // Header + prints without ASCII spark; VChart + interval buttons follow.
  elements.push(mdDiv(pricesAndKlineBlock(snapForKline, lang, mode, { asciiKline: false })))
  const chartWidth =
    selectedBar === '1D' ? 30 : selectedBar === '4H' ? 24 : selectedBar === '15m' ? 32 : mode === 'daily' ? 24 : 16
  const klineChart = klineCloseChartElement(kline, lang, chartWidth)
  if (klineChart) elements.push(klineChart)
  elements.push(klineIntervalActions(selectedBar, { mode, lang }))

  // TL;DR text (beats only — logos on the next action row(s))
  let dailyExpanded: ReportSource[] = []
  if (mode === 'daily') {
    const tldr = normalizeDailyTldrBeats(snap, lang)
    elements.push(
      mdDiv(['**📋 TL;DR**', ...tldr.map((l) => (l.startsWith('•') ? l : `• ${l}`))].join('\n')),
    )
    const fixed = await dailyFixedSourcesLive()
    dailyExpanded = dailyExpandedSources(fixed, hourly?.sources, 24)
    const rows = await logoLinkActionRows(
      dailyExpanded.slice(0, LOGO_ROW_MAX * LOGO_ROW_SIZE),
      LOGO_ROW_MAX,
    )
    for (const row of rows) elements.push(row)
  } else {
    const tldrLines = renderSection('📋 TL;DR', hourly?.tldr || [], empty, lang, true)
    elements.push(mdDiv(tldrLines.join('\n')))
    if (hourly?.tldr?.[0]) {
      const row = await logoLinkActions(pointSources(hourly.tldr[0], byId))
      if (row) elements.push(row)
    }
  }

  elements.push(mdDiv('**✨ Opportunity**'))
  const opps =
    mode === 'daily'
      ? (hourly?.opportunity || []).slice(0, 3)
      : (hourly?.opportunity || []).slice(0, 4)
  if (!opps.length) elements.push(mdDiv(`• ${empty}`))
  else {
    for (const p of opps) {
      elements.push(mdDiv(`${p.rank}. ${pointText(p, lang)}`))
      const row = await logoLinkActions(pointSources(p, byId))
      if (row) elements.push(row)
    }
  }

  elements.push(mdDiv('**⚠️ Risk**'))
  const risks =
    mode === 'daily' ? (hourly?.risk || []).slice(0, 3) : (hourly?.risk || []).slice(0, 4)
  if (!risks.length) elements.push(mdDiv(`• ${empty}`))
  else {
    for (const p of risks) {
      elements.push(mdDiv(`${p.rank}. ${pointText(p, lang)}`))
      const row = await logoLinkActions(pointSources(p, byId))
      if (row) elements.push(row)
    }
  }

  if (mode === 'daily') {
    const chips = sourceChipLine(dailyExpanded.slice(0, 20))
    elements.push(
      mdDiv(
        [
          dailySourcesSectionTitle(lang),
          chips
            ? `🔗 ${chips}`
            : lang === 'en'
              ? '• Source links unavailable this run.'
              : lang === 'zh-Hant'
                ? '• 本輪來源連結暫不可用。'
                : '• 本轮来源链接暂不可用。',
        ].join('\n'),
      ),
    )
  }

  elements.push(mdDiv(marketFooterBlock(snap, lang, question, mode)))
  if (bodyAppendix.trim()) elements.push(mdDiv(bodyAppendix.trim()))

  return {
    // update_multi: TF buttons refresh the same card for all recipients (group + DM).
    config: { wide_screen_mode: true, update_multi: true },
    header: {
      template,
      title: { tag: 'plain_text', content: title },
    },
    elements,
  }
}

/** Title + last OHLC only (no ASCII) — used when a VChart follows. */
function renderKlineCaption(
  kline: HourlyKlineSeries | null | undefined,
  lang: Lang,
  width = 16,
): string[] {
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const venue = klineVenueLabel(kline)
  if (!kline?.bars?.length) {
    return [
      hans
        ? '📈 **K线** · 本小时蜡烛不可用（Binance／OKX 源不可达）'
        : hant
          ? '📈 **K線** · 本小時蠟燭不可用（Binance／OKX 源不可達）'
          : '📈 **K-line** · unavailable this hour (Binance / OKX feed unreachable)',
    ]
  }
  const bars = kline.bars
  const last = bars[bars.length - 1]!
  const n = Math.min(Math.max(8, width), bars.length)
  const title = hans
    ? `📈 **K线** · ${kline.symbol} · ${kline.interval} · 近 **${n}** 根收盘走势（${venue} · 下图可点开放大）`
    : hant
      ? `📈 **K線** · ${kline.symbol} · ${kline.interval} · 近 **${n}** 根收盤走勢（${venue} · 下圖可點開放大）`
      : `📈 **K-line** · ${kline.symbol} · ${kline.interval} · last **${n}** closes (${venue} · tap chart to enlarge)`
  const lastLine = hans
    ? `末根（东八区 ${formatEast8(last.t)}）：O **${last.o.toFixed(2)}** · H **${last.h.toFixed(2)}** · L **${last.l.toFixed(2)}** · C **${last.c.toFixed(2)}**`
    : hant
      ? `末根（東八區 ${formatEast8(last.t)}）：O **${last.o.toFixed(2)}** · H **${last.h.toFixed(2)}** · L **${last.l.toFixed(2)}** · C **${last.c.toFixed(2)}**`
      : `Last bar (${formatEast8(last.t)} UTC+8): O **${last.o.toFixed(2)}** · H **${last.h.toFixed(2)}** · L **${last.l.toFixed(2)}** · C **${last.c.toFixed(2)}**`
  return [title, lastLine]
}

function renderKline(kline: HourlyKlineSeries | null | undefined, lang: Lang): string[] {
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const venue = klineVenueLabel(kline)
  if (!kline?.bars?.length) {
    return [
      hans
        ? '📈 **K线** · 本小时蜡烛不可用（Binance／OKX 源不可达）'
        : hant
          ? '📈 **K線** · 本小時蠟燭不可用（Binance／OKX 源不可達）'
          : '📈 **K-line** · unavailable this hour (Binance / OKX feed unreachable)',
    ]
  }
  const bars = kline.bars
  const last = bars[bars.length - 1]!
  const spark = asciiCloseSpark(bars, 16)
  const candles = asciiCandleRow(bars, 12)
  const lo = Math.min(...bars.slice(-16).map((b) => b.l))
  const hi = Math.max(...bars.slice(-16).map((b) => b.h))
  const title = hans
    ? `📈 **K线** · ${kline.symbol} · ${kline.interval} · 近 ${Math.min(16, bars.length)} 根（${venue}）`
    : hant
      ? `📈 **K線** · ${kline.symbol} · ${kline.interval} · 近 ${Math.min(16, bars.length)} 根（${venue}）`
      : `📈 **K-line** · ${kline.symbol} · ${kline.interval} · last ${Math.min(16, bars.length)} bars (${venue})`
  const lastLine = hans
    ? `末根（东八区 ${formatEast8(last.t)}）：O **${last.o.toFixed(2)}** · H **${last.h.toFixed(2)}** · L **${last.l.toFixed(2)}** · C **${last.c.toFixed(2)}**`
    : hant
      ? `末根（東八區 ${formatEast8(last.t)}）：O **${last.o.toFixed(2)}** · H **${last.h.toFixed(2)}** · L **${last.l.toFixed(2)}** · C **${last.c.toFixed(2)}**`
      : `Last bar (${formatEast8(last.t)} UTC+8): O **${last.o.toFixed(2)}** · H **${last.h.toFixed(2)}** · L **${last.l.toFixed(2)}** · C **${last.c.toFixed(2)}**`
  return [
    title,
    `\`${hi.toFixed(0)} ${spark}\``,
    `\`${candles}\``,
    `\`${lo.toFixed(0)}\``,
    lastLine,
  ]
}

/**
 * Feishu VChart area of OKX closes (candlestick not in the card's 13 types).
 * Same shape as weekly DEMO charts — client ≥ 7.1; older clients show upgrade hint.
 * Y-axis is padded around closes (zero:false) so gold does not plot from 0→4000.
 */
export function klineCloseChartElement(
  kline: HourlyKlineSeries | null | undefined,
  lang: Lang,
  width = 16,
): Record<string, unknown> | null {
  const interval = kline?.interval || '1H'
  const bars = (kline?.bars || []).slice(-Math.max(8, width))
  if (!bars.length) return null
  const values = bars.map((b) => ({
    t: formatChartAxisLabel(b.t, interval),
    close: Number(b.c.toFixed(2)),
  }))
  const closes = values.map((v) => v.close)
  const lo = Math.min(...closes)
  const hi = Math.max(...closes)
  const pad = Math.max((hi - lo) * 0.08, hi * 0.0015, 0.5)
  const yMin = Number((lo - pad).toFixed(2))
  const yMax = Number((hi + pad).toFixed(2))
  const title =
    lang === 'zh-Hans'
      ? `${kline?.symbol || 'XAU'} · ${interval} 收盘走势（近 ${bars.length} 根）`
      : lang === 'zh-Hant'
        ? `${kline?.symbol || 'XAU'} · ${interval} 收盤走勢（近 ${bars.length} 根）`
        : `${kline?.symbol || 'XAU'} · ${interval} closes (last ${bars.length})`
  return {
    tag: 'chart',
    aspect_ratio: '16:9',
    color_theme: 'brand',
    preview: true,
    chart_spec: {
      type: 'area',
      title: { text: title },
      data: { values },
      xField: 't',
      yField: 'close',
      point: { visible: true, style: { size: 4 } },
      line: { style: { curveType: 'monotone', lineWidth: 2 } },
      area: { style: { fillOpacity: 0.28 } },
      axes: [
        { orient: 'bottom', label: { autoRotate: true } },
        {
          orient: 'left',
          nice: false,
          zero: false,
          min: yMin,
          max: yMax,
        },
      ],
      legends: { visible: false },
      tooltip: { visible: true },
      label: { visible: false },
    },
  }
}

/**
 * Rebuild a market card for a Feishu interval-button tap (15m / 1H / 4H / 1D).
 * Fetches candles Binance → OKX → Bitget for `bar` and keeps the rest of the live snapshot.
 */
export async function rebuildMarketCardForInterval(opts: {
  bar: KlineIntervalBar
  mode?: 'hourly' | 'daily'
  lang?: Lang
}): Promise<Record<string, unknown>> {
  const mode = opts.mode === 'daily' ? 'daily' : 'hourly'
  const lang = resolveMarketLang(opts.lang)
  // Parallel — TF callback updates the message async after a fast Feishu toast ack.
  const [snap, klineFetched] = await Promise.all([
    fetchMarketSnapshot().catch(() => null),
    fetchMarketKline(opts.bar).catch(() => null),
  ])
  // Never fall back to a different interval (e.g. 4H tap → 1H chart looks "stuck").
  const snapKline = snap?.hourly?.kline
  const kline: HourlyKlineSeries | null =
    klineFetched ||
    (snapKline && snapKline.interval === opts.bar ? snapKline : null) ||
    null
  const lastClose = kline?.bars?.at(-1)?.c
  const venue = klineVenueLabel(kline)
  const venueUrl =
    venue === 'OKX' ? OKX_KLINE_URL : venue === 'Bitget' ? BITGET_KLINE_URL : BINANCE_KLINE_URL
  const snapSafe: MarketSnapshot =
    snap ||
    ({
      binance:
        venue === 'Binance' && lastClose && Number.isFinite(lastClose)
          ? { last: lastClose }
          : undefined,
      okx:
        venue === 'OKX' && lastClose && Number.isFinite(lastClose)
          ? { last: lastClose }
          : undefined,
      bitget:
        venue === 'Bitget' && lastClose && Number.isFinite(lastClose)
          ? { last: lastClose }
          : undefined,
      notes: [
        lang === 'en'
          ? `${venue} K-line ${opts.bar}`
          : `${venue} K线 ${opts.bar}`,
      ],
      sources: [
        {
          label: venue,
          url: venueUrl,
        },
      ],
      fetchedAt: Date.now(),
      hourly: kline
        ? ({
            asOf: Date.now(),
            tldr: [],
            opportunity: [],
            risk: [],
            sources: [],
            kline,
            sentiment: null,
          } as unknown as NonNullable<MarketSnapshot['hourly']>)
        : undefined,
    } satisfies MarketSnapshot)
  const title =
    mode === 'daily' ? dailyMarketTitle(lang) : hourlyMarketTitle(lang)
  const intro =
    mode === 'daily'
      ? lang === 'en'
        ? '🌅 **Daily market brief**\n'
        : lang === 'zh-Hant'
          ? '🌅 **每日早報**\n'
          : '🌅 **每日早报**\n'
      : lang === 'en'
        ? '📬 **Half-hourly market push**\n'
        : lang === 'zh-Hant'
          ? '📬 **半小時行情推送**\n'
          : '📬 **半小时行情推送**\n'
  return buildMarketCard({
    title,
    snap: snapSafe,
    lang,
    mode,
    intro,
    template: mode === 'daily' ? 'blue' : 'wathet',
    question: lang === 'en' ? 'market' : '行情',
    kline,
  })
}

/** True when the user only typed a market command / synonym — don't echo it back. */
function isBareMarketQuery(question: string): boolean {
  const q = question.trim().toLowerCase()
  return /^(market|markets|行情|市况|市況|趋势|趨勢|gold|xau|xauusd)$/i.test(q)
}

/**
 * Same hourly engine as the web Market desk (TL;DR / Opportunity / Risk / K-line).
 * Probes live prints + catalog; never invents empty-section points.
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const hourly = await generateHourlyScan({ health: [], composite: null, spot: null })
  const byId = new Map(hourly.sources.map((s) => [s.id, s]))
  const binanceCap = byId.get('binance-ticker')?.captionEn || ''
  const okxCap = byId.get('okx-ticker')?.captionEn || ''
  const bitgetCap = byId.get('bitget-ticker')?.captionEn || ''
  const spotCap = byId.get('gold-api')?.captionEn || ''
  const binanceMatch = binanceCap.match(/([\d.]+)(?:\s*\(backup\))?\s*$/)
  const okxMatch = okxCap.match(/([\d.]+)(?:\s*\(backup\))?\s*$/)
  const bitgetMatch = bitgetCap.match(/([\d.]+)\s*$/)
  const spotMatch = spotCap.match(/([\d.]+)\s*$/)
  const klineLast = hourly.kline?.bars?.at(-1)?.c
  const fromBinanceKline = hourly.kline?.sourceId?.startsWith('binance')
  const binanceLast = binanceMatch
    ? Number(binanceMatch[1])
    : fromBinanceKline
      ? klineLast
      : undefined
  const okxLast = okxMatch
    ? Number(okxMatch[1])
    : !fromBinanceKline && klineLast != null
      ? klineLast
      : undefined
  const bitgetLast = bitgetMatch ? Number(bitgetMatch[1]) : undefined
  const spotLast = spotMatch ? Number(spotMatch[1]) : undefined

  const notes: string[] = []
  if (hourly.sentiment) {
    notes.push(
      `Sentiment ${hourly.sentiment.labelEn} (${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score})`,
    )
  }
  notes.push('Hourly desk scan — Binance → OKX → Bitget — same engine as web Market.')

  return {
    binance: binanceLast && Number.isFinite(binanceLast) ? { last: binanceLast } : undefined,
    okx: okxLast && Number.isFinite(okxLast) ? { last: okxLast } : undefined,
    bitget: bitgetLast && Number.isFinite(bitgetLast) ? { last: bitgetLast } : undefined,
    spot: spotLast && Number.isFinite(spotLast) ? { last: spotLast } : undefined,
    notes,
    sources: hourly.sources.slice(0, 36).map((s) => ({
      label: s.captionZh || s.captionEn,
      url: s.url,
    })),
    fetchedAt: hourly.createdAt,
    hourly,
  }
}

export function formatMarketAnswer(snap: MarketSnapshot, lang: Lang, question: string): string {
  const hourly = snap.hourly
  const byId = sourcesById(hourly?.sources)
  const empty =
    lang === 'zh-Hans'
      ? '本小时暂无要点。'
      : lang === 'zh-Hant'
        ? '本小時暫無要點。'
        : 'No points this hour.'
  return [
    pricesAndKlineBlock(snap, lang, 'hourly'),
    '',
    ...renderSection('📋 TL;DR', hourly?.tldr || [], empty, lang, true, byId),
    '',
    ...renderSection('✨ Opportunity', hourly?.opportunity || [], empty, lang, false, byId),
    '',
    ...renderSection('⚠️ Risk', hourly?.risk || [], empty, lang, false, byId),
    '',
    marketFooterBlock(snap, lang, question, 'hourly'),
  ].join('\n')
}
