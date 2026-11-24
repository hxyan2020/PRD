import {
  generateHourlyScan,
  type HourlyKlineSeries,
  type HourlyMarketReport,
  type KlineBar,
  type RankedPoint,
} from '../../../src/engine/hourlyScan.js'
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
  const scanAt = formatEast8(snap.fetchedAt || Date.now())
  const stats = compute24hStats(snap)
  const lines: string[] = []
  const chg =
    stats == null
      ? '—'
      : `${stats.changePct >= 0 ? '+' : ''}${stats.changePct.toFixed(2)}%`

  if (lang === 'zh-Hans') {
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
    lines.push(...renderKline(hourly?.kline, lang), '')
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **现货 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情绪：** **${hourly.sentiment.labelZh}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
    lines.push('')
    lines.push(
      ...renderSection('📋 TL;DR', hourly?.tldr || [], '过去 24 小时暂无要点。', lang, true),
      '',
      ...renderSection('✨ Opportunity', hourly?.opportunity || [], '过去 24 小时暂无要点。', lang),
      '',
      ...renderSection('⚠️ Risk', hourly?.risk || [], '过去 24 小时暂无要点。', lang),
      '',
    )
    lines.push(
      '• **解读：** 价格观察（bps／基差）≠ 新闻／宏观原因。值班排查请贴告警或私聊机器人发 **排查**。',
      '',
      '🔗 **来源**',
    )
    for (const s of (hourly?.sources || []).filter((x) => x.health === 'ok').slice(0, 8)) {
      lines.push(`• [${s.captionZh || s.captionEn}](${s.url})`)
    }
    lines.push(`• [打开网页 Market](${DESK_MARKET})`)
    return lines.join('\n')
  }

  // Fallback EN (rarely used for this group cron)
  lines.push('📊 **Past-24h market report · V Exchange Risk**', '')
  lines.push(`⏱ **As of:** **${scanAt}** (UTC+8)`, '')
  if (stats) {
    lines.push(
      '📈 **24h range**',
      `• **Open:** **${stats.open.toFixed(2)}** → **Close:** **${stats.close.toFixed(2)}** (**${chg}**)`,
      `• **High:** **${stats.high.toFixed(2)}** · **Low:** **${stats.low.toFixed(2)}** · **Bars:** **${stats.bars}**`,
      '',
    )
  }
  lines.push(...renderKline(hourly?.kline, 'en'), '')
  lines.push(
    ...renderSection('📋 TL;DR', hourly?.tldr || [], 'No points in the last 24h.', 'en', true),
    '',
    ...renderSection('✨ Opportunity', hourly?.opportunity || [], 'No points in the last 24h.', 'en'),
    '',
    ...renderSection('⚠️ Risk', hourly?.risk || [], 'No points in the last 24h.', 'en'),
  )
  return lines.join('\n')
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

function renderSection(
  title: string,
  points: RankedPoint[],
  empty: string,
  lang: Lang,
  oneLine = false,
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
    return out
  }
  for (const p of points.slice(0, 4)) {
    out.push(`${p.rank}. ${pointText(p, lang)}`)
  }
  return out
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
      label: s.captionEn,
      url: s.url,
    })),
    fetchedAt: hourly.createdAt,
    hourly,
  }
}

export function formatMarketAnswer(snap: MarketSnapshot, lang: Lang, question: string): string {
  const hourly = snap.hourly
  const bare = isBareMarketQuery(question)
  const scanAt = formatEast8(snap.fetchedAt || Date.now())
  const lines: string[] = []

  if (lang === 'zh-Hans') {
    lines.push('📊 **小时行情扫报 · V Exchange Risk**', '')
    lines.push(
      `⏱ **最近一次扫描：** **${scanAt}**（东八区）`,
      '• 网页端 **每个整点（东八区）自动扫描**；本次为即时拉取（与网页「立即扫描」同源）。',
      '',
    )
    lines.push(...renderKline(hourly?.kline, lang), '')
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **现货 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情绪：** **${hourly.sentiment.labelZh}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
    lines.push('')
    lines.push(
      ...renderSection(
        '📋 TL;DR',
        hourly?.tldr || [],
        '本小时暂无要点。',
        lang,
        true,
      ),
      '',
      ...renderSection('✨ Opportunity', hourly?.opportunity || [], '本小时暂无要点。', lang),
      '',
      ...renderSection('⚠️ Risk', hourly?.risk || [], '本小时暂无要点。', lang),
      '',
    )
    if (hourly?.vexPlaceholder) {
      lines.push(`📊 **V Exchange 指标**`, `• ${hourly.vexNoteZh}`, '')
    }
    if (!bare) {
      lines.push(`❓ **针对你的问题：** 「${question.slice(0, 120)}」`, '')
    }
    lines.push(
      '• **解读：** 价格观察（bps／基差）≠ 新闻／宏观原因。事故排查请贴告警或发 **investigate**。',
      '',
      '🔗 **来源**',
    )
    for (const s of (hourly?.sources || []).filter((x) => x.health === 'ok').slice(0, 8)) {
      lines.push(`• [${s.captionZh || s.captionEn}](${s.url})`)
    }
    lines.push(`• [打开网页 Market 小时扫报](${DESK_MARKET})`)
  } else if (lang === 'zh-Hant') {
    lines.push('📊 **小時行情掃報 · V Exchange Risk**', '')
    lines.push(
      `⏱ **最近一次掃描：** **${scanAt}**（東八區）`,
      '• 網頁端 **每個整點（東八區）自動掃描**；本次為即時拉取（與網頁「立即掃描」同源）。',
      '',
    )
    lines.push(...renderKline(hourly?.kline, lang), '')
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP：** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT：** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **現貨 XAU：** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **情緒：** **${hourly.sentiment.labelZh}**（${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score}）`,
      )
    }
    lines.push('')
    lines.push(
      ...renderSection(
        '📋 TL;DR',
        hourly?.tldr || [],
        '本小時暫無要點。',
        lang,
        true,
      ),
      '',
      ...renderSection('✨ Opportunity', hourly?.opportunity || [], '本小時暫無要點。', lang),
      '',
      ...renderSection('⚠️ Risk', hourly?.risk || [], '本小時暫無要點。', lang),
      '',
    )
    if (hourly?.vexPlaceholder) {
      lines.push(`📊 **V Exchange 指標**`, `• ${hourly.vexNoteZh}`, '')
    }
    if (!bare) {
      lines.push(`❓ **針對你的問題：** 「${question.slice(0, 120)}」`, '')
    }
    lines.push(
      '• **解讀：** 價格觀察（bps／基差）≠ 新聞／宏觀原因。事故排查請貼告警或發 **investigate**。',
      '',
      '🔗 **來源**',
    )
    for (const s of (hourly?.sources || []).filter((x) => x.health === 'ok').slice(0, 8)) {
      lines.push(`• [${s.captionZh || s.captionEn}](${s.url})`)
    }
    lines.push(`• [打開網頁 Market 小時掃報](${DESK_MARKET})`)
  } else {
    lines.push('📊 **Hourly market scan · V Exchange Risk**', '')
    lines.push(
      `⏱ **Last scan:** **${scanAt}** (UTC+8)`,
      '• Web desk **auto-scans every hour on the hour (UTC+8)**; this reply is an on-demand pull (same engine as **Scan now**).',
      '',
    )
    lines.push(...renderKline(hourly?.kline, lang), '')
    if (snap.okx) lines.push(`• **OKX XAU-USDT-SWAP:** **${snap.okx.last.toFixed(2)}**`)
    if (snap.bitget) lines.push(`• **Bitget XAUUSDT:** **${snap.bitget.last.toFixed(2)}**`)
    if (snap.spot) lines.push(`• **Spot XAU:** **${snap.spot.last.toFixed(2)}**`)
    if (hourly?.sentiment) {
      lines.push(
        `• **Sentiment:** **${hourly.sentiment.labelEn}** (${hourly.sentiment.score >= 0 ? '+' : ''}${hourly.sentiment.score})`,
      )
    }
    lines.push('')
    lines.push(
      ...renderSection('📋 TL;DR', hourly?.tldr || [], 'No points this hour.', lang, true),
      '',
      ...renderSection('✨ Opportunity', hourly?.opportunity || [], 'No points this hour.', lang),
      '',
      ...renderSection('⚠️ Risk', hourly?.risk || [], 'No points this hour.', lang),
      '',
    )
    if (hourly?.vexPlaceholder) {
      lines.push(`📊 **V Exchange indicators**`, `• ${hourly.vexNoteEn}`, '')
    }
    if (!bare) {
      lines.push(`❓ **On your question:** “${question.slice(0, 120)}”`, '')
    }
    lines.push(
      '• **Guidance:** price observations (bps / basis) ≠ news/macro causes. For an incident, paste the alert or type **investigate**.',
      '',
      '🔗 **Sources**',
    )
    for (const s of (hourly?.sources || []).filter((x) => x.health === 'ok').slice(0, 8)) {
      lines.push(`• [${s.captionEn}](${s.url})`)
    }
    lines.push(`• [Open web Market hourly scan](${DESK_MARKET})`)
  }

  return lines.join('\n')
}
