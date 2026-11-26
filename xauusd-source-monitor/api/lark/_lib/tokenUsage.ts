/**
 * Durable token accounting for the Risk Copilot agent (Lark LLM + desk /api/chat).
 * Hourly buckets for charts; all-time counters never reset.
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import type { Lang } from './types.js'

const STORE_NAME = 'agent-token-usage.json'
/** Keep ~14d of hourly buckets (chart needs 24h; buffer for gaps). */
const RETAIN_HOURS = 24 * 14

export type TokenSource = 'lark' | 'desk' | 'vision' | 'rules' | 'other'

export type TokenHourBucket = {
  prompt: number
  completion: number
  total: number
  calls: number
}

export type TokenUsageStore = {
  allTime: TokenHourBucket
  /** Key: UTC `YYYY-MM-DDTHH` */
  hours: Record<string, TokenHourBucket>
  updatedAt: number
}

function emptyBucket(): TokenHourBucket {
  return { prompt: 0, completion: 0, total: 0, calls: 0 }
}

function hourKey(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 13)
}

function pruneHours(hours: Record<string, TokenHourBucket>, now = Date.now()): Record<string, TokenHourBucket> {
  const cutoff = now - RETAIN_HOURS * 3600_000
  const next: Record<string, TokenHourBucket> = {}
  for (const [k, v] of Object.entries(hours)) {
    const t = Date.parse(`${k}:00:00.000Z`)
    if (Number.isFinite(t) && t >= cutoff) next[k] = v
  }
  return next
}

export async function loadTokenUsage(): Promise<TokenUsageStore> {
  const raw = await readDurableJson<TokenUsageStore>(STORE_NAME)
  if (!raw || typeof raw !== 'object') {
    return { allTime: emptyBucket(), hours: {}, updatedAt: Date.now() }
  }
  return {
    allTime: { ...emptyBucket(), ...(raw.allTime || {}) },
    hours: raw.hours && typeof raw.hours === 'object' ? raw.hours : {},
    updatedAt: Number(raw.updatedAt) || Date.now(),
  }
}

export async function recordTokenUsage(args: {
  prompt: number
  completion: number
  source?: TokenSource
  model?: string
  at?: number
}): Promise<boolean> {
  const prompt = Math.max(0, Math.floor(Number(args.prompt) || 0))
  const completion = Math.max(0, Math.floor(Number(args.completion) || 0))
  const total = prompt + completion
  if (total <= 0) return true
  const at = args.at || Date.now()
  const key = hourKey(at)
  const apply = async (): Promise<boolean> => {
    const store = await loadTokenUsage()
    store.allTime.prompt += prompt
    store.allTime.completion += completion
    store.allTime.total += total
    store.allTime.calls += 1
    const b = store.hours[key] || emptyBucket()
    b.prompt += prompt
    b.completion += completion
    b.total += total
    b.calls += 1
    store.hours[key] = b
    store.hours = pruneHours(store.hours, at)
    store.updatedAt = at
    return writeDurableJson(STORE_NAME, store)
  }
  try {
    if (await apply()) return true
    // One retry — Blob/overwrite races on serverless.
    return await apply()
  } catch {
    /* never break the agent on metering */
    return false
  }
}

/**
 * Estimate + persist usage for a Lark bot turn (rules path or LLM).
 * Uses ~chars/4 when provider usage is unavailable — keeps the daily Yan
 * digest non-zero for normal investigate / greeting / market replies.
 */
export async function recordAgentTurnUsage(args: {
  inboundText?: string
  reply?: { text?: string; card?: unknown; followUpCards?: unknown[] } | null
  source?: TokenSource
}): Promise<boolean> {
  const outParts: string[] = []
  if (args.reply?.text) outParts.push(args.reply.text)
  if (args.reply?.card) {
    try {
      outParts.push(JSON.stringify(args.reply.card))
    } catch {
      /* ignore */
    }
  }
  if (args.reply?.followUpCards?.length) {
    try {
      outParts.push(JSON.stringify(args.reply.followUpCards))
    } catch {
      /* ignore */
    }
  }
  const prompt = estimateTokensFromText(args.inboundText || '')
  const completion = estimateTokensFromText(...outParts)
  if (prompt + completion <= 0) return true
  return recordTokenUsage({
    prompt,
    completion,
    source: args.source || 'rules',
  })
}

/** Rough fallback when upstream omits usage. */
export function estimateTokensFromText(...parts: string[]): number {
  const n = parts.reduce((s, p) => s + (p || '').length, 0)
  return Math.max(1, Math.ceil(n / 4))
}

export function sumLast24h(store: TokenUsageStore, now = Date.now()): TokenHourBucket {
  const out = emptyBucket()
  const cutoff = now - 24 * 3600_000
  for (const [k, b] of Object.entries(store.hours)) {
    const t = Date.parse(`${k}:00:00.000Z`)
    if (!Number.isFinite(t) || t < cutoff) continue
    out.prompt += b.prompt
    out.completion += b.completion
    out.total += b.total
    out.calls += b.calls
  }
  return out
}

/** 24 chronological hour buckets ending at current hour (UTC keys, display in +8). */
export function last24hSeries(store: TokenUsageStore, now = Date.now()): { hour: string; total: number }[] {
  const out: { hour: string; total: number }[] = []
  const end = new Date(now)
  end.setUTCMinutes(0, 0, 0)
  for (let i = 23; i >= 0; i--) {
    const t = end.getTime() - i * 3600_000
    const key = hourKey(t)
    const b = store.hours[key]
    // Label in Asia/Shanghai (UTC+8) as HH
    const local = new Date(t + 8 * 3600_000)
    const label = String(local.getUTCHours()).padStart(2, '0')
    out.push({ hour: label, total: b?.total || 0 })
  }
  return out
}

const SPARK = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const
const BAR = ['░', '▒', '▓', '█'] as const

export function sparkline(values: number[]): string {
  if (!values.length) return '▁'.repeat(8)
  const max = Math.max(...values, 1)
  return values.map((v) => SPARK[Math.min(SPARK.length - 1, Math.round((v / max) * (SPARK.length - 1)))]!).join('')
}

/** Compact hour-axis under a 24-char spark (labels every 3h). */
export function sparkAxis(series: { hour: string; total: number }[]): string {
  if (!series.length) return ''
  return series.map((s, i) => (i % 3 === 0 ? s.hour : '··')).join('')
}

/** Top-N peak hours for a readable mobile list (replaces multi-row ASCII charts). */
export function peakHours(
  series: { hour: string; total: number }[],
  n = 3,
): { hour: string; total: number }[] {
  return [...series]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total || a.hour.localeCompare(b.hour))
    .slice(0, n)
}

function horizontalBar(value: number, max: number, width = 8): string {
  if (max <= 0 || value <= 0) return BAR[0]!.repeat(width)
  const filled = Math.max(1, Math.round((value / max) * width))
  return BAR[3]!.repeat(Math.min(width, filled)) + BAR[0]!.repeat(Math.max(0, width - filled))
}

/**
 * @deprecated Multi-row ASCII misaligns on Feishu mobile (proportional font).
 * Prefer sparkline + peakHours. Kept for smoke / dry fallbacks.
 */
export function asciiLineChart(series: { hour: string; total: number }[], height = 5): string {
  const spark = sparkline(series.map((s) => s.total))
  const axis = sparkAxis(series)
  const peaks = peakHours(series, 3)
  const peakMax = Math.max(...peaks.map((p) => p.total), 1)
  const peakLines = peaks.length
    ? peaks.map((p) => `${p.hour} ${horizontalBar(p.total, peakMax)} ${fmtTokens(p.total)}`)
    : ['—']
  void height
  return [`${spark}`, axis, ...peakLines].join('\n')
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`
  return String(Math.round(n))
}

/** Calendar day in Asia/Singapore (SGT), e.g. `2026-11-25`. */
export function sgtDayKey(ts: number = Date.now()): string {
  try {
    return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  } catch {
    const d = new Date(ts + 8 * 3600_000)
    return d.toISOString().slice(0, 10)
  }
}

/** HH:MM wall clock in Asia/Singapore. */
export function sgtHm(ts: number = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Singapore',
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

/** Daily private push window start (SGT). Override with LARK_TOKEN_USAGE_START. */
export const TOKEN_USAGE_START_HM =
  (process.env.LARK_TOKEN_USAGE_START || '').trim() || '18:00'

/** True once the 18:00 SGT slot has opened (idempotent via dayKey sent-state). */
export function isTokenUsageSlot(ts: number = Date.now()): boolean {
  return sgtHm(ts) >= TOKEN_USAGE_START_HM
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

function usageSnapshot(lang: Lang, store: TokenUsageStore, now = Date.now()) {
  const last24 = sumLast24h(store, now)
  const series = last24hSeries(store, now)
  const spark = sparkline(series.map((s) => s.total))
  const axis = sparkAxis(series)
  const peaks = peakHours(series, 3)
  const peakMax = Math.max(...peaks.map((p) => p.total), 1)
  const day = sgtDayKey(now)
  return { last24, series, spark, axis, peaks, peakMax, day, store }
}

function peakLines(
  lang: Lang,
  peaks: { hour: string; total: number }[],
  peakMax: number,
): string {
  const hans = lang === 'zh-Hans'
  const zh = lang === 'zh-Hant' || hans
  if (!peaks.length) {
    return hans ? '_近 24h 暂无用量_' : zh ? '_近 24h 暫無用量_' : '_No usage in the last 24h_'
  }
  return peaks
    .map((p, i) => {
      const bar = horizontalBar(p.total, peakMax)
      if (hans) return `${i + 1}. **${p.hour}:00**  ${bar}  **${fmtTokens(p.total)}**`
      if (zh) return `${i + 1}. **${p.hour}:00**  ${bar}  **${fmtTokens(p.total)}**`
      return `${i + 1}. **${p.hour}:00**  ${bar}  **${fmtTokens(p.total)}**`
    })
    .join('\n')
}

/** Markdown body for the daily Yan-only token usage DM (not greeting). */
export async function formatTokenUsageReport(lang: Lang): Promise<string> {
  const snap = usageSnapshot(lang, await loadTokenUsage())
  const { last24, spark, axis, peaks, peakMax, day, store } = snap
  const peaksBlock = peakLines(lang, peaks, peakMax)

  if (lang === 'zh-Hans') {
    return [
      `**${day}** · 每日 **${TOKEN_USAGE_START_HM}** SGT · 仅推送 Yan`,
      '',
      `**最近 24 小时**  ·  **${fmtTokens(last24.total)}**`,
      `prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)}（${pct(last24.completion, last24.total)}）· ${last24.calls} 次`,
      '',
      `**全历史累计**  ·  **${fmtTokens(store.allTime.total)}**`,
      `prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)}（${pct(store.allTime.completion, store.allTime.total)}）· ${store.allTime.calls} 次`,
      '',
      `**24h 走势**（东八区小时）`,
      spark,
      axis,
      '',
      `**峰值时段**`,
      peaksBlock,
      '',
      '_含 Lark 回复估算（~字数/4）+ 识图／桌面 /api/chat 上游 usage_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      `**${day}** · 每日 **${TOKEN_USAGE_START_HM}** SGT · 僅推送 Yan`,
      '',
      `**最近 24 小時**  ·  **${fmtTokens(last24.total)}**`,
      `prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)}（${pct(last24.completion, last24.total)}）· ${last24.calls} 次`,
      '',
      `**全歷史累計**  ·  **${fmtTokens(store.allTime.total)}**`,
      `prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)}（${pct(store.allTime.completion, store.allTime.total)}）· ${store.allTime.calls} 次`,
      '',
      `**24h 走勢**（東八區小時）`,
      spark,
      axis,
      '',
      `**峰值時段**`,
      peaksBlock,
      '',
      '_含 Lark 回覆估算（~字數/4）+ 識圖／桌面 /api/chat 上游 usage_',
    ].join('\n')
  }
  return [
    `**${day}** · daily **${TOKEN_USAGE_START_HM}** SGT · Yan only`,
    '',
    `**Last 24h**  ·  **${fmtTokens(last24.total)}**`,
    `prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} (${pct(last24.completion, last24.total)}) · ${last24.calls} calls`,
    '',
    `**All-time**  ·  **${fmtTokens(store.allTime.total)}**`,
    `prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} (${pct(store.allTime.completion, store.allTime.total)}) · ${store.allTime.calls} calls`,
    '',
    `**24h trend** (Asia/Singapore hour)`,
    spark,
    axis,
    '',
    `**Peak hours**`,
    peaksBlock,
    '',
    '_Includes Lark reply estimates (~chars/4) + vision / desk /api/chat provider usage_',
  ].join('\n')
}

function kpiColumn(label: string, value: string, detail: string): Record<string, unknown> {
  return {
    tag: 'column',
    width: 'weighted',
    weight: 1,
    vertical_align: 'top',
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `${label}\n**${value}**\n${detail}`,
        },
      },
    ],
  }
}

/** Feishu VChart (client ≥ 7.1) — 24h token bars by Asia/Singapore hour. */
export function tokenUsageChartElement(
  series: { hour: string; total: number }[],
  lang: Lang,
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = lang === 'zh-Hant' || hans
  const title = hans
    ? '近 24 小时 Token（东八区）'
    : zh
      ? '近 24 小時 Token（東八區）'
      : 'Last 24h tokens (SGT hour)'
  const values = series.map((s) => ({ hour: s.hour, value: s.total }))
  return {
    tag: 'chart',
    aspect_ratio: '16:9',
    color_theme: 'brand',
    preview: true,
    chart_spec: {
      type: 'bar',
      title: { text: title },
      data: { values },
      xField: 'hour',
      yField: 'value',
      label: { visible: false },
    },
  }
}

/** Structured Feishu card — KPI columns + VChart + peak hours (no multi-row ASCII). */
export async function buildTokenUsageCard(lang: Lang): Promise<Record<string, unknown>> {
  const snap = usageSnapshot(lang, await loadTokenUsage())
  const { last24, series, peaks, peakMax, day, store } = snap
  const hans = lang === 'zh-Hans'
  const zh = lang === 'zh-Hant' || hans

  const subtitle = hans
    ? `📅 **${day}** · 每日 **${TOKEN_USAGE_START_HM}** SGT · 仅推送 Yan`
    : zh
      ? `📅 **${day}** · 每日 **${TOKEN_USAGE_START_HM}** SGT · 僅推送 Yan`
      : `📅 **${day}** · daily **${TOKEN_USAGE_START_HM}** SGT · Yan only`

  const label24 = hans ? '最近 24 小时' : zh ? '最近 24 小時' : 'Last 24h'
  const labelAll = hans ? '全历史累计' : zh ? '全歷史累計' : 'All-time'
  const detail24 = hans
    ? `in ${fmtTokens(last24.prompt)} · out ${fmtTokens(last24.completion)}（${pct(last24.completion, last24.total)}）\n${last24.calls} 次调用`
    : zh
      ? `in ${fmtTokens(last24.prompt)} · out ${fmtTokens(last24.completion)}（${pct(last24.completion, last24.total)}）\n${last24.calls} 次呼叫`
      : `in ${fmtTokens(last24.prompt)} · out ${fmtTokens(last24.completion)} (${pct(last24.completion, last24.total)})\n${last24.calls} calls`
  const detailAll = hans
    ? `in ${fmtTokens(store.allTime.prompt)} · out ${fmtTokens(store.allTime.completion)}（${pct(store.allTime.completion, store.allTime.total)}）\n${store.allTime.calls} 次调用`
    : zh
      ? `in ${fmtTokens(store.allTime.prompt)} · out ${fmtTokens(store.allTime.completion)}（${pct(store.allTime.completion, store.allTime.total)}）\n${store.allTime.calls} 次呼叫`
      : `in ${fmtTokens(store.allTime.prompt)} · out ${fmtTokens(store.allTime.completion)} (${pct(store.allTime.completion, store.allTime.total)})\n${store.allTime.calls} calls`

  const peakTitle = hans ? '**峰值时段**' : zh ? '**峰值時段**' : '**Peak hours**'
  const note = hans
    ? '含 Lark 回复估算（~字数/4）+ 识图／桌面 /api/chat 上游 usage · 图表需飞书 ≥ 7.1'
    : zh
      ? '含 Lark 回覆估算（~字數/4）+ 識圖／桌面 /api/chat 上游 usage · 圖表需飛書 ≥ 7.1'
      : 'Includes Lark reply estimates (~chars/4) + vision / desk usage · chart needs Feishu ≥ 7.1'

  return {
    config: { wide_screen_mode: true },
    header: {
      // blue — avoid indigo/purple wash on the daily desk push
      template: 'blue',
      title: { tag: 'plain_text', content: tokenUsageReportTitle(lang) },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: subtitle } },
      {
        tag: 'column_set',
        flex_mode: 'bisect',
        background_style: 'grey',
        columns: [
          kpiColumn(label24, fmtTokens(last24.total), detail24),
          kpiColumn(labelAll, fmtTokens(store.allTime.total), detailAll),
        ],
      },
      tokenUsageChartElement(series, lang),
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `${peakTitle}\n${peakLines(lang, peaks, peakMax)}`,
        },
      },
      { tag: 'note', elements: [{ tag: 'plain_text', content: note }] },
    ],
  }
}

/** @deprecated Use formatTokenUsageReport — greeting no longer embeds usage. */
export async function formatTokenUsageForGreeting(lang: Lang): Promise<string> {
  return formatTokenUsageReport(lang)
}

export function tokenUsageReportTitle(lang: Lang): string {
  if (lang === 'zh-Hans') return 'Token 日消耗'
  if (lang === 'zh-Hant') return 'Token 日消耗'
  return 'Token usage'
}
