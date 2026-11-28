import {
  computeSentiment,
  KLINE_INTERVALS,
  resolveCiteUrlOrNull,
  type HourlyKlineSeries,
  type HourlyMarketReport,
  type KlineBar,
  type KlineIntervalBar,
  type RankedPoint,
  type ReportSource,
} from '../../../src/engine/hourlyScan.js'
import { resolveFaviconImgKey } from './client.js'
import { readDurableJson, writeDurableJson } from './durableJson.js'
import {
  fetchBtcTapeKline,
  fetchMultiAssetBoard,
  formatMultiAssetBoard,
  multiAssetToHourlyPoints,
  type MultiAssetBoard,
} from './multiAssetMarket.js'
import type { Lang } from './types.js'

export interface MarketSnapshot {
  /** @deprecated Prefer `board` — kept for legacy XAU prints in older cards. */
  binance?: { last: number; change24hPct?: number }
  /** @deprecated Prefer `board`. */
  okx?: { last: number; change24hPct?: number }
  bitget?: { last: number; change24hPct?: number }
  spot?: { last: number }
  dxyHint?: string
  notes: string[]
  sources: { label: string; url: string }[]
  fetchedAt: number
  /** Multi-asset board (crypto / equity / FX / commodity). */
  board?: MultiAssetBoard
  /** Synthetic hourly sections derived from the multi-asset board (+ optional BTC tape). */
  hourly?: HourlyMarketReport
}

/** Human venue tag from kline sourceId (BTC tape on Binance spot by default). */
function klineVenueLabel(kline: HourlyKlineSeries | null | undefined): string {
  if (kline?.sourceId?.includes('btc') || kline?.symbol === 'BTCUSDT') return 'Binance BTC'
  if (kline?.sourceId?.startsWith('binance')) return 'Binance'
  if (kline?.sourceId?.startsWith('okx')) return 'OKX'
  return 'Binance'
}

const DESK_MARKET = 'https://quote-ai-troubleshooting-bot.vercel.app/#/market'

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
  if (lang === 'zh-Hant') return '每日跨資產行情早報'
  if (lang === 'en') return 'Daily multi-asset brief'
  return '每日跨资产行情早报'
}

export function dailyMarketIntro(lang: Lang, dayKey: string, atMarkdown: string): string {
  if (lang === 'zh-Hant') {
    return `🌅 **每日早報 · 加密／股指／外匯／商品**（東八區每天 **09:00** 自動推送 · **${dayKey}**）\n\n${atMarkdown} 早報來了\n`
  }
  if (lang === 'en') {
    return `🌅 **Daily brief · crypto / equities / FX / commodities** (auto-push **09:00** Asia/Shanghai · **${dayKey}**)\n\n${atMarkdown} morning brief is here\n`
  }
  return `🌅 **每日早报 · 加密／股指／外汇／商品**（东八区每天 **09:00** 自动推送 · **${dayKey}**）\n\n${atMarkdown} 早报来了\n`
}

export function hourlyMarketTitle(lang: Lang): string {
  if (lang === 'zh-Hant') return '跨資產行情掃報'
  if (lang === 'en') return 'Multi-asset market scan'
  return '跨资产行情扫报'
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
 * 4) Opportunity (≤3)  5) Risk (≤3)  6) Footer
 */
export const DAILY_REPORT_SECTIONS = [
  'header_24h',
  'kline_prints',
  'tldr',
  'opportunity',
  'risk',
  'footer',
] as const

const DAILY_FIXED_LINKS: { id: string; label: string; url: string; domain: string }[] = [
  { id: 'binance-btc', label: 'Binance BTC', url: 'https://www.binance.com/en/trade/BTC_USDT', domain: 'binance.com' },
  { id: 'yahoo-spx', label: 'S&P 500', url: 'https://finance.yahoo.com/quote/%5EGSPC', domain: 'yahoo.com' },
  { id: 'yahoo-eurusd', label: 'EUR/USD', url: 'https://finance.yahoo.com/quote/EURUSD%3DX', domain: 'yahoo.com' },
  { id: 'yahoo-gold', label: 'Gold GC=F', url: 'https://finance.yahoo.com/quote/GC%3DF', domain: 'yahoo.com' },
]

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
 */
export async function dailySourceHyperlinksLive(): Promise<string> {
  const parts: string[] = []
  for (const l of DAILY_FIXED_LINKS) {
    const resolved = await resolveCiteUrlOrNull(l.url, l.id)
    if (!resolved) continue
    parts.push(`[${l.label}](${resolved.url})`)
  }
  return parts.join(' · ')
}

/** Always 4 TL;DR beats: 即时 / 走势 / 事件 / 关注 — pad missing with stable placeholders. */
export function normalizeDailyTldrBeats(snap: MarketSnapshot, lang: Lang): string[] {
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const board = snap.board
  const pick = (ids: string[]) =>
    (board?.quotes || []).filter((q) => ids.includes(q.id)).map((q) => {
      const name = lang === 'en' ? q.nameEn : q.nameZh
      const chg =
        q.changePct == null || !Number.isFinite(q.changePct)
          ? '—'
          : `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%`
      const px =
        q.class === 'forex'
          ? Math.abs(q.last) >= 10
            ? q.last.toFixed(3)
            : q.last.toFixed(5)
          : q.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${name} ${px} (${chg})`
    })

  const liveBits = pick(['btc', 'spx', 'eurusd', 'xau'])
  const live =
    liveBits.length
      ? hans
        ? `即时：${liveBits.join(' · ')}。`
        : hant
          ? `即時：${liveBits.join(' · ')}。`
          : `Live: ${liveBits.join(' · ')}.`
      : hans
        ? '即时：报价暂缺。'
        : hant
          ? '即時：報價暫缺。'
          : 'Live: prints unavailable.'

  const up = (board?.movers.up || []).slice(0, 2).map((q) => (lang === 'en' ? q.nameEn : q.nameZh))
  const down = (board?.movers.down || []).slice(0, 2).map((q) => (lang === 'en' ? q.nameEn : q.nameZh))
  const trend =
    up.length || down.length
      ? hans
        ? `走势：强 ${up.join('／') || '—'} · 弱 ${down.join('／') || '—'}。`
        : hant
          ? `走勢：強 ${up.join('／') || '—'} · 弱 ${down.join('／') || '—'}。`
          : `Trend: firm ${up.join(' / ') || '—'} · soft ${down.join(' / ') || '—'}.`
      : hans
        ? '走势：本窗口暂无显著涨跌亮点。'
        : hant
          ? '走勢：本窗口暫無顯著漲跌亮點。'
          : 'Trend: no standout movers this window.'

  const covered = board
    ? CLASS_COVERAGE_LABEL(lang, board)
    : hans
      ? '覆盖暂缺'
      : hant
        ? '覆蓋暫缺'
        : 'coverage pending'
  const event = hans
    ? `事件：公开行情板已更新（${covered}）。`
    : hant
      ? `事件：公開行情板已更新（${covered}）。`
      : `Event: public board refreshed (${covered}).`

  const watch = hans
    ? '关注：加密波动、美股开收盘、美元与贵金属／原油联动；定价排查请发 investigate。'
    : hant
      ? '關注：加密波動、美股開收盤、美元與貴金屬／原油聯動；定價排查請發 investigate。'
      : 'Watch: crypto vol, US cash open/close, USD vs metals/oil; for pricing RCA type investigate.'

  return [live, trend, event, watch]
}

function CLASS_COVERAGE_LABEL(lang: Lang, board: MultiAssetBoard): string {
  const parts: string[] = []
  if (board.byClass.crypto.length) parts.push(lang === 'en' ? 'crypto' : '加密')
  if (board.byClass.equity.length) parts.push(lang === 'en' ? 'equities' : lang === 'zh-Hant' ? '股指' : '股指')
  if (board.byClass.forex.length) parts.push(lang === 'en' ? 'FX' : lang === 'zh-Hant' ? '外匯' : '外汇')
  if (board.byClass.commodity.length) parts.push(lang === 'en' ? 'commodities' : '商品')
  return parts.join(lang === 'en' ? ' + ' : '＋') || (lang === 'en' ? 'none' : '无')
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
  const out: ReportSource[] = []
  const now = Date.now()
  for (const l of DAILY_FIXED_LINKS) {
    const resolved = await resolveCiteUrlOrNull(l.url, l.id)
    if (!resolved) continue
    out.push({
      id: l.id,
      captionEn: l.label,
      captionZh: l.label,
      url: resolved.url,
      domain: l.domain,
      logoUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(l.domain)}&sz=64`,
      kind: 'venue',
      health: 'up',
      checkedAt: now,
      detail: resolved.rewritten ? 'cite rewritten (primary 404)' : 'desk fixed link',
    })
  }
  return out
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
    ...(linkLine ? [linkLine] : []),
    '',
    '**✨ Opportunity**',
    ...normalizeDailyRanked(snap.hourly?.opportunity, lang, empty, 3, byId),
    '',
    '**⚠️ Risk**',
    ...normalizeDailyRanked(snap.hourly?.risk, lang, empty, 3, byId),
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

/** Unique sources for a ranked point (domain-deduped, max 4). Never cite proven 404 pages. */
export function pointSources(
  p: RankedPoint,
  byId: Map<string, ReportSource>,
): ReportSource[] {
  const out: ReportSource[] = []
  const seen = new Set<string>()
  for (const id of p.sourceIds || []) {
    const s = byId.get(id)
    if (!s || !isCiteableSource(s)) continue
    const key = (s.domain || s.id).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= 4) break
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
  if (/kitco\.com/i.test(host)) return 'Kitco'
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
  const slice = sources.slice(0, 5)
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
  // Prefer multi-asset board (crypto / equity / FX / commodity).
  if (snap.board?.quotes?.length) {
    const body = formatMultiAssetBoard(snap.board, lang, mode)
    const hourly = snap.hourly
    const extra: string[] = []
    if (opts?.asciiKline !== false && hourly?.kline?.bars?.length) {
      extra.push('', ...renderKline(hourly.kline, lang))
    } else if (opts?.asciiKline === false && hourly?.kline) {
      const n = mode === 'daily' ? 24 : 16
      extra.push('', ...renderKlineCaption(hourly.kline, lang, n))
    }
    if (hourly?.sentiment) {
      const label = marketSentimentLabel(lang, hourly.sentiment.labelZh, hourly.sentiment.labelEn)
      const score = `${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}`
      if (lang === 'zh-Hans') extra.push(`• **跨资产情绪：** **${label}**（${score}）`)
      else if (lang === 'zh-Hant') extra.push(`• **跨資產情緒：** **${label}**（${score}）`)
      else extra.push(`• **Cross-asset sentiment:** **${label}** (${score})`)
    }
    return [body, ...extra].join('\n')
  }

  // Legacy XAU-only fallback (should be rare after multi-asset cutover).
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
    if (hans) {
      lines.push('📊 **过去 24 小时行情报告 · 报价 AI排查助手**', '')
      lines.push(
        `⏱ **报告时间：** **${scanAt}**（东八区）`,
        '• 每日早上自动推送；跨资产快照不可用时回退到 BTC 胶带。',
        '',
        '📈 **24h 价格区间（胶带）**',
        stats
          ? `• **开：** **${stats.open.toFixed(2)}** → **收：** **${stats.close.toFixed(2)}**（**${chg}**）`
          : '• **开：** **—** → **收：** **—**（**—**）',
        '',
      )
    } else if (hant) {
      lines.push('📊 **過去 24 小時行情報告 · 報價 AI排查助手**', '')
      lines.push(
        `⏱ **報告時間：** **${scanAt}**（東八區）`,
        '• 每日早上自動推送；跨資產快照不可用時回退到 BTC 膠帶。',
        '',
        '📈 **24h 價格區間（膠帶）**',
        stats
          ? `• **開：** **${stats.open.toFixed(2)}** → **收：** **${stats.close.toFixed(2)}**（**${chg}**）`
          : '• **開：** **—** → **收：** **—**（**—**）',
        '',
      )
    } else {
      lines.push('📊 **Past-24h market report · Quote AI**', '')
      lines.push(
        `⏱ **As of:** **${scanAt}** (UTC+8)`,
        '• Daily morning push; falls back to BTC tape when the multi-asset board is empty.',
        '',
        '📈 **24h range (tape)**',
        stats
          ? `• **Open:** **${stats.open.toFixed(2)}** → **Close:** **${stats.close.toFixed(2)}** (**${chg}**)`
          : '• **Open:** **—** → **Close:** **—** (**—**)',
        '',
      )
    }
  } else if (hans) {
    lines.push('📊 **跨资产行情扫报 · 报价 AI排查助手**', '')
    lines.push(`⏱ **最近一次扫描：** **${scanAt}**（东八区）`, '')
  } else if (hant) {
    lines.push('📊 **跨資產行情掃報 · 報價 AI排查助手**', '')
    lines.push(`⏱ **最近一次掃描：** **${scanAt}**（東八區）`, '')
  } else {
    lines.push('📊 **Multi-asset market scan · Quote AI**', '')
    lines.push(`⏱ **Last scan:** **${scanAt}** (UTC+8)`, '')
  }

  if (opts?.asciiKline !== false) {
    lines.push(...renderKline(hourly?.kline, lang), '')
  } else {
    const n = mode === 'daily' ? 24 : 16
    lines.push(...renderKlineCaption(hourly?.kline, lang, n), '')
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
  if (mode === 'hourly' && !bare && question.trim()) {
    if (lang === 'zh-Hans') lines.push(`❓ **针对你的问题：** 「${question.slice(0, 120)}」`, '')
    else if (lang === 'zh-Hant') lines.push(`❓ **針對你的問題：** 「${question.slice(0, 120)}」`, '')
    else lines.push(`❓ **On your question:** “${question.slice(0, 120)}”`, '')
  }
  if (lang === 'zh-Hans') {
    lines.push(
      mode === 'daily'
        ? '• **解读：** 公开行情快照 ≠ 投资建议。CFD 定价／LP→PE→MT 排查请贴告警或发 **排查**。'
        : '• **解读：** 公开行情快照 ≠ 投资建议。定价链路排查请贴告警或发 **investigate**。',
      '',
      `• [打开网页 Market](${DESK_MARKET})`,
    )
  } else if (lang === 'zh-Hant') {
    lines.push(
      mode === 'daily'
        ? '• **解讀：** 公開行情快照 ≠ 投資建議。CFD 定價／LP→PE→MT 排查請貼告警或發 **排查**。'
        : '• **解讀：** 公開行情快照 ≠ 投資建議。定價鏈路排查請貼告警或發 **investigate**。',
      '',
      `• [打開網頁 Market](${DESK_MARKET})`,
    )
  } else {
    lines.push(
      mode === 'daily'
        ? '• **Guidance:** public snapshot ≠ investment advice. For CFD pricing / LP→PE→MT RCA paste an alert or type **investigate**.'
        : '• **Guidance:** public snapshot ≠ investment advice. For pricing-pipeline RCA paste an alert or type **investigate**.',
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

  // Always build the interactive card shape (VChart + TF buttons + logo rows).
  // Without Lark credentials, favicon upload no-ops and the card remains valid dry JSON.

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

  // TL;DR text (beats only — logos on the next action row)
  if (mode === 'daily') {
    const tldr = normalizeDailyTldrBeats(snap, lang)
    elements.push(
      mdDiv(['**📋 TL;DR**', ...tldr.map((l) => (l.startsWith('•') ? l : `• ${l}`))].join('\n')),
    )
    const fixed = await dailyFixedSourcesLive()
    const row = await logoLinkActions(fixed)
    if (row) elements.push(row)
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
        ? '📈 **胶带 K线** · 本小时蜡烛不可用（Binance BTC 源不可达）'
        : hant
          ? '📈 **膠帶 K線** · 本小時蠟燭不可用（Binance BTC 源不可達）'
          : '📈 **Tape K-line** · unavailable this hour (Binance BTC feed unreachable)',
    ]
  }
  const bars = kline.bars
  const last = bars[bars.length - 1]!
  const n = Math.min(Math.max(8, width), bars.length)
  const title = hans
    ? `📈 **胶带 K线** · ${kline.symbol} · ${kline.interval} · 近 **${n}** 根收盘走势（${venue} · 下图可点开放大）`
    : hant
      ? `📈 **膠帶 K線** · ${kline.symbol} · ${kline.interval} · 近 **${n}** 根收盤走勢（${venue} · 下圖可點開放大）`
      : `📈 **Tape K-line** · ${kline.symbol} · ${kline.interval} · last **${n}** closes (${venue} · tap chart to enlarge)`
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
        ? '📈 **胶带 K线** · 本小时蜡烛不可用（Binance BTC 源不可达）'
        : hant
          ? '📈 **膠帶 K線** · 本小時蠟燭不可用（Binance BTC 源不可達）'
          : '📈 **Tape K-line** · unavailable this hour (Binance BTC feed unreachable)',
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
 * Refreshes the multi-asset board and swaps the BTC tape to the selected interval.
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
    fetchBtcTapeKline(opts.bar).catch(() => null),
  ])
  // Never fall back to a different interval (e.g. 4H tap → 1H chart looks "stuck").
  const snapKline = snap?.hourly?.kline
  const kline: HourlyKlineSeries | null =
    klineFetched ||
    (snapKline && snapKline.interval === opts.bar ? snapKline : null) ||
    null
  const lastClose = kline?.bars?.at(-1)?.c
  const snapSafe: MarketSnapshot =
    snap ||
    ({
      binance: lastClose && Number.isFinite(lastClose) ? { last: lastClose } : undefined,
      notes: [
        lang === 'en' ? `Binance BTCUSDT K-line ${opts.bar}` : `Binance BTCUSDT K线 ${opts.bar}`,
      ],
      sources: [
        {
          label: 'Binance BTC',
          url: 'https://www.binance.com/en/trade/BTC_USDT',
        },
      ],
      fetchedAt: Date.now(),
      hourly: kline
        ? ({
            id: `btc-tape-${Date.now()}`,
            createdAt: Date.now(),
            hourKey: '',
            tldr: [],
            opportunity: [],
            risk: [],
            sources: [],
            kline,
            sentiment: computeSentiment([], []),
            vexPlaceholder: true,
            vexNoteEn: 'BTC tape only',
            vexNoteZh: '仅 BTC 胶带',
          } satisfies HourlyMarketReport)
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
 * Multi-asset market snapshot for 报价 AI排查助手.
 * Crypto (Binance/OKX) + equities / FX / commodities (Yahoo Finance) + BTC tape chart.
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [board, btcKline] = await Promise.all([
    fetchMultiAssetBoard(),
    fetchBtcTapeKline('1H', 36).catch(() => null),
  ])

  const { tldrZh, tldrEn, opportunity, risk } = multiAssetToHourlyPoints(board)
  const opportunityPts: RankedPoint[] = opportunity.map((p) => ({
    rank: p.rank,
    en: `**${p.titleEn}** — ${p.bodyEn}`,
    zh: `**${p.titleZh}** — ${p.bodyZh}`,
    sourceIds: p.sourceIds,
  }))
  const riskPts: RankedPoint[] = risk.map((p) => ({
    rank: p.rank,
    en: `**${p.titleEn}** — ${p.bodyEn}`,
    zh: `**${p.titleZh}** — ${p.bodyZh}`,
    sourceIds: p.sourceIds,
  }))
  const tldrPts: RankedPoint[] = [
    {
      rank: 1,
      en: tldrEn,
      zh: tldrZh,
      sourceIds: [],
    },
  ]

  const now = board.fetchedAt || Date.now()
  const hourKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
    .format(new Date(now))
    .replace(', ', 'T')
    .replace(/(\d{2})$/, (_, h) => h)

  const sources: ReportSource[] = board.sources.map((s, i) => {
    let domain = 'market'
    try {
      domain = new URL(s.url).hostname.replace(/^www\./, '')
    } catch {
      /* keep default */
    }
    return {
      id: `board-${i}-${domain}`,
      captionEn: s.label,
      captionZh: s.label,
      url: s.url,
      domain,
      logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      kind: 'price' as const,
      health: 'ok' as const,
      checkedAt: now,
    }
  })

  const sentiment = computeSentiment(opportunityPts, riskPts)
  const kline: HourlyKlineSeries | null = btcKline
  const hourly: HourlyMarketReport = {
    id: `multi-asset-${now}`,
    createdAt: now,
    hourKey: hourKey || `multi-${now}`,
    tldr: tldrPts,
    opportunity: opportunityPts,
    risk: riskPts,
    sources,
    sentiment,
    kline,
    vexPlaceholder: true,
    vexNoteEn: 'Multi-asset board — crypto via Binance/OKX; equities/FX/commodities via Yahoo Finance.',
    vexNoteZh: '跨资产行情板 — 加密：Binance/OKX；股指／外汇／商品：Yahoo Finance。',
  }

  const btc = board.quotes.find((q) => q.id === 'btc')
  const notes = [
    ...board.notes,
    `Multi-asset board · ${board.quotes.length} quotes · sources: Binance/OKX + Yahoo Finance`,
  ]

  return {
    binance: btc ? { last: btc.last, change24hPct: btc.changePct } : undefined,
    notes,
    sources: board.sources,
    fetchedAt: now,
    board,
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
