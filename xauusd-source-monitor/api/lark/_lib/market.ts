import {
  generateHourlyScan,
  type HourlyKlineSeries,
  type HourlyMarketReport,
  type KlineBar,
  type RankedPoint,
  type ReportSource,
} from '../../../src/engine/hourlyScan.js'
import { larkConfigured, resolveFaviconImgKey } from './client.js'
import { simpleCard } from './cards.js'
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

/** All Lark-delivered market reports (chat + cron pushes) use Simplified Chinese. */
export const LARK_MARKET_LANG: Lang = 'zh-Hans'

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
 * Morning group digest: past-24h XAU range + current desk TL;DR / Opp / Risk.
 * Chinese by default (group push).
 */
export function formatDaily24hMarketAnswer(snap: MarketSnapshot, lang: Lang = 'zh-Hans'): string {
  const hourly = snap.hourly
  const byId = sourcesById(hourly?.sources)
  const empty =
    lang === 'zh-Hans'
      ? '过去 24 小时暂无要点。'
      : lang === 'zh-Hant'
        ? '過去 24 小時暫無要點。'
        : 'No points in the last 24h.'
  return [
    pricesAndKlineBlock(snap, lang, 'daily'),
    '',
    ...renderSection('📋 TL;DR', hourly?.tldr || [], empty, lang, true, byId),
    '',
    ...renderSection('✨ Opportunity', hourly?.opportunity || [], empty, lang, false, byId),
    '',
    ...renderSection('⚠️ Risk', hourly?.risk || [], empty, lang, false, byId),
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

/** Unique sources for a ranked point (domain-deduped, max 4). */
export function pointSources(
  p: RankedPoint,
  byId: Map<string, ReportSource>,
): ReportSource[] {
  const out: ReportSource[] = []
  const seen = new Set<string>()
  for (const id of p.sourceIds || []) {
    const s = byId.get(id)
    if (!s) continue
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
    if (hans) {
      lines.push('📊 **过去 24 小时行情报告 · V Exchange Risk**', '')
      lines.push(
        `⏱ **报告时间：** **${scanAt}**（东八区）`,
        '• 每日早上自动推送；数据覆盖近 **24 根 1H K 线**（OKX XAU-USDT-SWAP）+ 当日宏观／来源要点。',
        '',
      )
      if (stats) {
        lines.push(
          '📈 **24h 价格区间**',
          `• **开：** **${stats.open.toFixed(2)}** → **收：** **${stats.close.toFixed(2)}**（**${chg}**）`,
          `• **高：** **${stats.high.toFixed(2)}** · **低：** **${stats.low.toFixed(2)}** · **K 线数：** **${stats.bars}**`,
          `• **窗口：** ${formatEast8(stats.fromTs)} → ${formatEast8(stats.toTs)}（东八区）`,
          '',
        )
      }
    } else if (hant) {
      lines.push('📊 **過去 24 小時行情報告 · V Exchange Risk**', '')
      lines.push(`⏱ **報告時間：** **${scanAt}**（東八區）`, '')
    } else {
      lines.push('📊 **Past-24h market report · V Exchange Risk**', '')
      lines.push(`⏱ **As of:** **${scanAt}** (UTC+8)`, '')
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
 * Interactive market card: each Opportunity / Risk / TL;DR point is followed by
 * favicon logo buttons that open the source URL (logo = hyperlink).
 * Falls back to a plain lark_md card when Lark upload is unavailable.
 */
export async function buildMarketCard(opts: {
  title: string
  snap: MarketSnapshot
  lang: Lang
  question?: string
  mode?: 'hourly' | 'daily'
  /** Extra markdown prepended (e.g. daily cron intro). */
  intro?: string
  /** Extra markdown appended (e.g. LLM enrich). */
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

  const fallbackMd = [
    intro,
    mode === 'daily' ? formatDaily24hMarketAnswer(snap, lang) : formatMarketAnswer(snap, lang, question),
    appendix,
  ]
    .filter(Boolean)
    .join('\n')
    .trim()

  if (!larkConfigured()) {
    return simpleCard(title, fallbackMd, template)
  }

  const hourly = snap.hourly
  const byId = sourcesById(hourly?.sources)
  const elements: Record<string, unknown>[] = []

  if (intro.trim()) elements.push(mdDiv(intro.trim()))
  elements.push(mdDiv(pricesAndKlineBlock(snap, lang, mode)))

  // TL;DR text (beats only — logos on the next action row)
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
  if (appendix.trim()) elements.push(mdDiv(appendix.trim()))

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
