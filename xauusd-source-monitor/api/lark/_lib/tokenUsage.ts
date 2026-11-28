/**
 * Durable token accounting for the 报价 AI排查助手 agent (Lark LLM + desk /api/chat).
 * Hourly buckets for charts; all-time counters never reset.
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import type { Lang } from './types.js'

const STORE_NAME = 'agent-token-usage.json'
/** Keep ~14d of hourly buckets (chart needs 24h; buffer for gaps). */
const RETAIN_HOURS = 24 * 14

export type TokenSource = 'lark' | 'desk' | 'vision' | 'other'

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
}): Promise<void> {
  const prompt = Math.max(0, Math.floor(Number(args.prompt) || 0))
  const completion = Math.max(0, Math.floor(Number(args.completion) || 0))
  const total = prompt + completion
  if (total <= 0) return
  const at = args.at || Date.now()
  const key = hourKey(at)
  try {
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
    await writeDurableJson(STORE_NAME, store)
  } catch {
    /* never break the agent on metering */
  }
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

/**
 * Daily token digest for Yan Haixiang (private DM at 18:00 SGT).
 * Not shown on greeting cards.
 */
export async function formatTokenUsageDailyReport(
  lang: Lang,
  dayKey?: string,
): Promise<{ title: string; markdown: string }> {
  const store = await loadTokenUsage()
  const last24 = sumLast24h(store)
  const series = last24hSeries(store)
  const chart = asciiLineChart(series)
  const spark = sparkline(series.map((s) => s.total))
  const day = dayKey || new Date().toISOString().slice(0, 10)

  if (lang === 'zh-Hans') {
    return {
      title: `Token 用量日报 · ${day}`,
      markdown: [
        `📊 **报价 AI排查助手 · Token 用量日报**（${day} · 18:00 SGT）`,
        '',
        `• **最近 24 小时：** **${fmtTokens(last24.total)}** tokens（prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} · ${last24.calls} 次调用）`,
        `• **全历史累计：** **${fmtTokens(store.allTime.total)}** tokens（prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} · ${store.allTime.calls} 次调用）`,
        `• **24h 走势：** ${spark}`,
        '',
        chart,
        '',
        '_横轴为 SGT（UTC+8）小时；统计含 Lark 对话 LLM／识图与桌面 /api/chat。_',
        '_仅推送给 @Yan Haixiang · 不出现在问候卡。_',
      ].join('\n'),
    }
  }
  if (lang === 'zh-Hant') {
    return {
      title: `Token 用量日報 · ${day}`,
      markdown: [
        `📊 **报价 AI排查助手 · Token 用量日報**（${day} · 18:00 SGT）`,
        '',
        `• **最近 24 小時：** **${fmtTokens(last24.total)}** tokens（prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} · ${last24.calls} 次呼叫）`,
        `• **全歷史累計：** **${fmtTokens(store.allTime.total)}** tokens（prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} · ${store.allTime.calls} 次呼叫）`,
        `• **24h 走勢：** ${spark}`,
        '',
        chart,
        '',
        '_橫軸為 SGT（UTC+8）小時；統計含 Lark 對話 LLM／識圖與桌面 /api/chat。_',
        '_僅推送給 @Yan Haixiang · 不出現在問候卡。_',
      ].join('\n'),
    }
  }
  return {
    title: `Token usage daily · ${day}`,
    markdown: [
      `📊 **报价 AI排查助手 · daily token usage** (${day} · 18:00 SGT)`,
      '',
      `• **Last 24h:** **${fmtTokens(last24.total)}** tokens (prompt ${fmtTokens(last24.prompt)} · completion ${fmtTokens(last24.completion)} · ${last24.calls} calls)`,
      `• **All-time:** **${fmtTokens(store.allTime.total)}** tokens (prompt ${fmtTokens(store.allTime.prompt)} · completion ${fmtTokens(store.allTime.completion)} · ${store.allTime.calls} calls)`,
      `• **24h trend:** ${spark}`,
      '',
      chart,
      '',
      '_X-axis = SGT (UTC+8) hour; includes Lark LLM/vision and desk /api/chat._',
      '_Private DM to @Yan Haixiang only — not on greeting cards._',
    ].join('\n'),
  }
}

/** @deprecated Use formatTokenUsageDailyReport — greeting cards no longer include usage. */
export async function formatTokenUsageForGreeting(lang: Lang): Promise<string> {
  const { markdown } = await formatTokenUsageDailyReport(lang)
  return markdown
}
