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

export function sparkline(values: number[]): string {
  if (!values.length) return '▁'.repeat(8)
  const max = Math.max(...values, 1)
  return values.map((v) => SPARK[Math.min(SPARK.length - 1, Math.round((v / max) * (SPARK.length - 1)))]!).join('')
}

export function asciiLineChart(series: { hour: string; total: number }[], height = 5): string {
  const vals = series.map((s) => s.total)
  const max = Math.max(...vals, 1)
  const rows: string[] = []
  for (let h = height; h >= 1; h--) {
    const thresh = (max * h) / height
    let row = ''
    for (const v of vals) {
      row += v >= thresh ? '█' : '·'
    }
    const label = h === height ? String(Math.round(max)).padStart(5) : ''.padStart(5)
    rows.push(`${label}│${row}`)
  }
  const axis = `${''.padStart(5)}└${'─'.repeat(vals.length)}`
  const ticks = series.map((s, i) => (i % 3 === 0 ? s.hour : '  ')).join('')
  return [...rows, axis, `${''.padStart(6)}${ticks}`].join('\n')
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

/** Markdown body for the daily Yan-only token usage DM (not greeting). */
export async function formatTokenUsageReport(lang: Lang): Promise<string> {
  const store = await loadTokenUsage()
  const last24 = sumLast24h(store)
  const series = last24hSeries(store)
  const chart = asciiLineChart(series)
  const spark = sparkline(series.map((s) => s.total))
  const day = sgtDayKey()

  if (lang === 'zh-Hans') {
    return [
      `📬 **Token 日消耗 · ${day}**（每日 **${TOKEN_USAGE_START_HM}** SGT · 仅推送 Yan）`,
      '',
      `• **最近 24 小时：** **${fmtTokens(last24.total)}** tokens（prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} · ${last24.calls} 次调用）`,
      `• **全历史累计：** **${fmtTokens(store.allTime.total)}** tokens（prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} · ${store.allTime.calls} 次调用）`,
      `• **24h 走势：** ${spark}`,
      '',
      chart,
      '',
      '_横轴为东八区小时；含每次 Lark 回复估算（~字数/4）+ 识图／桌面 /api/chat 的上游 usage。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      `📬 **Token 日消耗 · ${day}**（每日 **${TOKEN_USAGE_START_HM}** SGT · 僅推送 Yan）`,
      '',
      `• **最近 24 小時：** **${fmtTokens(last24.total)}** tokens（prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} · ${last24.calls} 次呼叫）`,
      `• **全歷史累計：** **${fmtTokens(store.allTime.total)}** tokens（prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} · ${store.allTime.calls} 次呼叫）`,
      `• **24h 走勢：** ${spark}`,
      '',
      chart,
      '',
      '_橫軸為東八區小時；含每次 Lark 回覆估算（~字數/4）+ 識圖／桌面 /api/chat 的上游 usage。_',
    ].join('\n')
  }
  return [
    `📬 **Token usage · ${day}** (daily **${TOKEN_USAGE_START_HM}** SGT · Yan only)`,
    '',
    `• **Last 24h:** **${fmtTokens(last24.total)}** tokens (prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} · ${last24.calls} calls)`,
    `• **All-time:** **${fmtTokens(store.allTime.total)}** tokens (prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} · ${store.allTime.calls} calls)`,
    `• **24h trend:** ${spark}`,
    '',
    chart,
    '',
    '_X-axis = Asia/Singapore hour; every Lark reply is estimated (~chars/4) plus vision / desk /api/chat provider usage._',
  ].join('\n')
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
