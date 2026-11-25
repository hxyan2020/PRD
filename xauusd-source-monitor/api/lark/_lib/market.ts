import {
  generateHourlyScan,
  KITCO_GOLD_URL,
  OKX_KLINE_URL,
  resolveCiteUrlOrNull,
  type HourlyKlineSeries,
  type HourlyMarketReport,
  type KlineBar,
  type RankedPoint,
  type ReportSource,
} from '../../../src/engine/hourlyScan.js'
import { larkConfigured, resolveFaviconImgKey } from './client.js'
import { simpleCard } from './cards.js'
import { readDurableJson, writeDurableJson } from './durableJson.js'
import type { Lang } from './types.js'

export interface MarketSnapshot {
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

const DESK_MARKET = 'https://vex-llm-proxy.vercel.app/#/market'

/**
 * Default when conversation language is missing / unsupported.
 * Supported market copy: zh-Hans · zh-Hant · en — everything else → 中文.
 */
export const LARK_MARKET_LANG: Lang = 'zh-Hans'

const CHAT_LANG_STORE = 'lark-chat-lang.json'

/** Map session / request / detected lang → supported market lang (else 中文). */
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
  // Unsupported or unclear → 中文
  return LARK_MARKET_LANG
}

/** Remember the chat’s conversation language for cron 早报 (best-effort durable). */
export async function rememberChatMarketLang(chatId: string, lang: Lang | string | null | undefined) {
  const id = (chatId || '').trim()
  if (!id) return
  const resolved = resolveMarketLang(lang)
  try {
    const map = (await readDurableJson<Record<string, string>>(CHAT_LANG_STORE)) || {}
    if (map[id] === resolved) return
    map[id] = resolved
    // Keep store bounded
    const keys = Object.keys(map)
    if (keys.length > 200) {
      for (const k of keys.slice(0, keys.length - 200)) delete map[k]
    }
    await writeDurableJson(CHAT_LANG_STORE, map)
  } catch {
    /* non-fatal */
  }
}

/** Lang for a cron / group 早报: request hint → remembered chat lang → 中文. */
export async function resolveDailyMarketLang(opts: {
  chatId: string
  hint?: Lang | string | null
}): Promise<{ lang: Lang; source: string }> {
  if (opts.hint != null && String(opts.hint).trim()) {
    return { lang: resolveMarketLang(opts.hint), source: 'request' }
  }
  try {
    const map = (await readDurableJson<Record<string, string>>(CHAT_LANG_STORE)) || {}
    const remembered = map[(opts.chatId || '').trim()]
    if (remembered) return { lang: resolveMarketLang(remembered), source: 'chat' }
  } catch {
    /* fall through */
  }
  return { lang: LARK_MARKET_LANG, source: 'default_zh' }
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

/** Last ~24 × 1H OKX bars → open/high/low/close + % change. */
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
  { id: 'okx-kline', label: 'OKX K线', url: OKX_KLINE_URL, domain: 'okx.com' },
  { id: 'kitco', label: 'Kitco', url: KITCO_GOLD_URL, domain: 'kitco.com' },
  { id: 'yahoo-tnx', label: 'Yahoo行情', url: 'https://finance.yahoo.com/quote/%5ETNX', domain: 'yahoo.com' },
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
    if (snap.okx) bits.push(hans || hant ? `OKX 金 ${snap.okx.last.toFixed(2)}` : `OKX ${snap.okx.last.toFixed(2)}`)
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

/** Cap Opp/Risk to 3 ranked lines; sources as inline markdown hyperlinks (no buttons). */
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

/** Fixed desk source links as markdown only (早报 never uses action buttons). */
export function dailySourceHyperlinks(): string {
  return DAILY_FIXED_LINKS.map((l) => `[${l.label}](${l.url})`).join(' · ')
}

/**
 * Morning group digest: past-24h XAU range + fixed TL;DR / Opp / Risk skeleton.
 * Numbers and bullets change daily; section titles and order stay fixed.
 * All sources are field hyperlinks — never Lark action buttons.
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
  // TradingView OKX:XAUUSDT.P is the geo-safe K-line target
  if (/tradingview\.com/i.test(host) && /OKX|XAUUSDT/i.test(url)) return 'OKX K线'
  if (/okx\.com/i.test(host)) return 'OKX K线'
  if (/bitget\.com/i.test(host)) return 'Bitget K线'
  if (/kitco\.com/i.test(host)) return 'Kitco'
  if (/yahoo\.com/i.test(host)) return 'Yahoo行情'
  if (/federalreserve\.gov/i.test(host)) return '美联储'
  if (/x\.com|twitter\.com/i.test(host)) return 'X'
  if (/reuters\.com/i.test(host)) return '路透'
  if (/bloomberg\.com/i.test(host)) return '彭博'
  if (/cnbc\.com/i.test(host)) return 'CNBC'
  if (/lbma\.org/i.test(host)) return 'LBMA'
  if (/binance\.com/i.test(host)) return 'Binance'
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

function mdDiv(content: string): Record<string, unknown> {
  return { tag: 'div', text: { tag: 'lark_md', content } }
}

function pricesAndKlineBlock(snap: MarketSnapshot, lang: Lang, mode: 'hourly' | 'daily'): string {
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
        '• 每日早上自动推送；数据覆盖近 **24 根 1H K 线**（OKX XAU-USDT-SWAP）+ 当日宏观／来源要点。',
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
        '• 每日早上自動推送；數據覆蓋近 **24 根 1H K 線**（OKX XAU-USDT-SWAP）+ 當日宏觀／來源要點。',
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
        '• Daily morning push; ~**24** × 1H OKX XAU-USDT-SWAP bars + macro / source notes.',
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

  lines.push(...renderKline(hourly?.kline, lang), '')
  if (hans) {
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **现货 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情绪：** **${hourly.sentiment.labelZh}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
  } else if (hant) {
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **現貨 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情緒：** **${hourly.sentiment.labelZh}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
  } else {
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP:** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT:** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **Spot XAU:** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **Sentiment:** **${hourly.sentiment.labelEn}** (${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score})`,
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
 * Interactive market card.
 * - hourly: TL;DR / Opp / Risk with per-point source logo button rows
 * - daily: fixed skeleton; sources only as markdown hyperlinks (no buttons)
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
  } = opts

  const empty =
    mode === 'daily'
      ? lang === 'zh-Hans'
        ? '过去 24 小时暂无要点。'
        : lang === 'zh-Hant'
          ? '過去 24 小時暫無要點。'
          : 'No points in the last 24h.'
      : lang === 'zh-Hans'
        ? '本小时暂无要点。'
        : lang === 'zh-Hant'
          ? '本小時暫無要點。'
          : 'No points this hour.'

  // Daily: never append free-form LLM text — keeps section order identical every day.
  const dailyAppendix = mode === 'daily' ? '' : appendix

  const dailyBody =
    mode === 'daily'
      ? await formatDaily24hMarketAnswerAsync(snap, lang)
      : formatMarketAnswer(snap, lang, question)

  const fallbackMd = [intro, dailyBody, dailyAppendix].filter(Boolean).join('\n').trim()

  if (!larkConfigured()) {
    return simpleCard(title, fallbackMd, template)
  }

  const hourly = snap.hourly
  const byId = sourcesById(hourly?.sources)
  const elements: Record<string, unknown>[] = []

  if (intro.trim()) elements.push(mdDiv(intro.trim()))

  if (mode === 'daily') {
    // Single markdown body — sources are [label](url) fields, never action buttons.
    // Fixed + per-point links are 404-filtered (see formatDaily24hMarketAnswerAsync / pointSources).
    elements.push(mdDiv(dailyBody))
  } else {
    elements.push(mdDiv(pricesAndKlineBlock(snap, lang, mode)))
    // Hourly: TL;DR + per-point logo rows (variable is OK for on-demand scans)
    const tldrLines = renderSection('📋 TL;DR', hourly?.tldr || [], empty, lang, true)
    elements.push(mdDiv(tldrLines.join('\n')))
    if (hourly?.tldr?.[0]) {
      const row = await logoLinkActions(pointSources(hourly.tldr[0], byId))
      if (row) elements.push(row)
    }

    elements.push(mdDiv('**✨ Opportunity**'))
    const opps = (hourly?.opportunity || []).slice(0, 4)
    if (!opps.length) elements.push(mdDiv(`• ${empty}`))
    else {
      for (const p of opps) {
        elements.push(mdDiv(`${p.rank}. ${pointText(p, lang)}`))
        const row = await logoLinkActions(pointSources(p, byId))
        if (row) elements.push(row)
      }
    }

    elements.push(mdDiv('**⚠️ Risk**'))
    const risks = (hourly?.risk || []).slice(0, 4)
    if (!risks.length) elements.push(mdDiv(`• ${empty}`))
    else {
      for (const p of risks) {
        elements.push(mdDiv(`${p.rank}. ${pointText(p, lang)}`))
        const row = await logoLinkActions(pointSources(p, byId))
        if (row) elements.push(row)
      }
    }

    elements.push(mdDiv(marketFooterBlock(snap, lang, question, mode)))
    if (dailyAppendix.trim()) elements.push(mdDiv(dailyAppendix.trim()))
  }

  return {
    config: { wide_screen_mode: true },
    header: {
      template,
      title: { tag: 'plain_text', content: title },
    },
    elements,
  }
}

function renderKline(kline: HourlyKlineSeries | null | undefined, lang: Lang): string[] {
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  if (!kline?.bars?.length) {
    return [
      hans
        ? '📈 **K线** · 本小时蜡烛不可用（OKX 源不可达）'
        : hant
          ? '📈 **K線** · 本小時蠟燭不可用（OKX 源不可達）'
          : '📈 **K-line** · unavailable this hour (OKX feed unreachable)',
    ]
  }
  const bars = kline.bars
  const last = bars[bars.length - 1]!
  const spark = asciiCloseSpark(bars, 16)
  const candles = asciiCandleRow(bars, 12)
  const lo = Math.min(...bars.slice(-16).map((b) => b.l))
  const hi = Math.max(...bars.slice(-16).map((b) => b.h))
  const title = hans
    ? `📈 **K线** · ${kline.symbol} · ${kline.interval} · 近 ${Math.min(16, bars.length)} 根（OKX）`
    : hant
      ? `📈 **K線** · ${kline.symbol} · ${kline.interval} · 近 ${Math.min(16, bars.length)} 根（OKX）`
      : `📈 **K-line** · ${kline.symbol} · ${kline.interval} · last ${Math.min(16, bars.length)} bars (OKX)`
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
  const okxCap = byId.get('okx-ticker')?.captionEn || ''
  const bitgetCap = byId.get('bitget-ticker')?.captionEn || ''
  const spotCap = byId.get('gold-api')?.captionEn || ''
  const okxMatch = okxCap.match(/([\d.]+)\s*$/)
  const bitgetMatch = bitgetCap.match(/([\d.]+)\s*$/)
  const spotMatch = spotCap.match(/([\d.]+)\s*$/)
  const okxLast = okxMatch ? Number(okxMatch[1]) : hourly.kline?.bars?.at(-1)?.c
  const bitgetLast = bitgetMatch ? Number(bitgetMatch[1]) : undefined
  const spotLast = spotMatch ? Number(spotMatch[1]) : undefined

  const notes: string[] = []
  if (hourly.sentiment) {
    notes.push(
      `Sentiment ${hourly.sentiment.labelEn} (${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score})`,
    )
  }
  notes.push('Hourly desk scan — same engine as web Market → Hourly scan.')

  return {
    okx: okxLast && Number.isFinite(okxLast) ? { last: okxLast } : undefined,
    bitget: bitgetLast && Number.isFinite(bitgetLast) ? { last: bitgetLast } : undefined,
    spot: spotLast && Number.isFinite(spotLast) ? { last: spotLast } : undefined,
    notes,
    sources: hourly.sources.slice(0, 12).map((s) => ({
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
