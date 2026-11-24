/**
 * Oscillation / leverage / breaking-news market alert for XAU OKX perp.
 * Triggers when short-horizon vol or funding (leverage proxy) exceeds a
 * dynamic historical mean, or a breaking-news headline is detected.
 */
import { shanghaiDayKey } from './market.js'

export const DEFAULT_OSC_GROUP_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'
export const DEFAULT_OSC_DM_CHAT_ID = 'oc_430fae67dd06b70f65b726b1673ef40e'

/** Demo fire: 2026-11-25 10:00 Asia/Shanghai */
export const OSC_DEMO_DAY =
  (process.env.LARK_OSC_DEMO_DAY || '').trim() || '2026-11-25'
export const OSC_DEMO_START_HM =
  (process.env.LARK_OSC_DEMO_START || '').trim() || '10:00'

const OKX_CANDLES =
  'https://www.okx.com/api/v5/market/candles?instId=XAU-USDT-SWAP&bar=1H&limit=48'
const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_FUNDING =
  'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP'
const OKX_FUNDING_HIST =
  'https://www.okx.com/api/v5/public/funding-rate-history?instId=XAU-USDT-SWAP&limit=48'
const OKX_OI =
  'https://www.okx.com/api/v5/public/open-interest?instId=XAU-USDT-SWAP'
const OKX_TRADE = 'https://www.okx.com/trade-swap/xau-usdt-swap'

export type OscTrigger =
  | 'vol_spike'
  | 'funding_leverage'
  | 'oi_spike'
  | 'breaking_news'
  | 'demo'

export type OscSource = { label: string; url: string }

export type OscillationSnapshot = {
  fetchedAt: number
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

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'VE-Risk-Copilot/1.0 (+oscillation)' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

/** OKX candles: [ts,o,h,l,c,vol,volCcy,volCcyQuote,confirm] newest first. */
function parseCandleRanges(data: unknown): { rangePct: number; close: number }[] {
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

function looksBreaking(title: string): boolean {
  return /\b(Fed|FOMC|Powell|war|sanctions|oil|Iran|emergency|halt|liquidation|flash|crash|surge|spike|突发|紧急|战争|制裁|暴跌|暴涨|强平)\b/i.test(
    title,
  )
}

export async function fetchBreakingHeadline(): Promise<{
  title: string
  url: string
} | null> {
  // Reuse Fed press JSON (same feed as hourly scan)
  const fed = await fetchJson('https://www.federalreserve.gov/json/ne-press.json')
  try {
    const rows = fed as { title?: string; link?: string }[]
    if (!Array.isArray(rows)) return null
    const hit = rows.find((r) => r?.title && looksBreaking(String(r.title)))
    if (!hit?.title) {
      const first = rows.find((r) => r?.title)
      if (!first?.title) return null
      // Only treat as breaking if keyword hit; otherwise null for live path
      return null
    }
    const link = String(hit.link || '')
    const url = link.startsWith('http')
      ? link
      : `https://www.federalreserve.gov${link}`
    return { title: String(hit.title), url }
  } catch {
    return null
  }
}

export async function evaluateOscillation(opts?: {
  demo?: boolean
}): Promise<OscillationSnapshot> {
  const demo = Boolean(opts?.demo)
  const [candles, ticker, funding, fundingHist, oiJson, news] = await Promise.all([
    fetchJson(OKX_CANDLES),
    fetchJson(OKX_TICKER),
    fetchJson(OKX_FUNDING),
    fetchJson(OKX_FUNDING_HIST),
    fetchJson(OKX_OI),
    fetchBreakingHeadline(),
  ])

  const ranges = parseCandleRanges(candles)
  const recent = ranges.slice(0, 6).map((r) => r.rangePct)
  const hist = ranges.slice(6, 30).map((r) => r.rangePct)
  const volRecentPct = mean(recent)
  const volMeanPct = mean(hist)
  const volRatio =
    volRecentPct != null && volMeanPct != null && volMeanPct > 0
      ? volRecentPct / volMeanPct
      : null

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

  const fundingRatio =
    fundingPct != null && fundingMeanAbsPct != null && fundingMeanAbsPct > 0
      ? Math.abs(fundingPct) / fundingMeanAbsPct
      : null

  const oi = (() => {
    try {
      const n = Number((oiJson as { data?: { oi?: string }[] })?.data?.[0]?.oi)
      return Number.isFinite(n) ? n : null
    } catch {
      return null
    }
  })()

  const triggers: OscTrigger[] = []
  if (demo) triggers.push('demo')
  // Sustained oscillation: recent range vs dynamic mean
  if (volRatio != null && volRatio >= 1.45) triggers.push('vol_spike')
  // Funding as crowded-leverage proxy vs dynamic mean
  if (fundingRatio != null && fundingRatio >= 1.5 && Math.abs(fundingPct || 0) >= 0.01) {
    triggers.push('funding_leverage')
  }
  if (news) triggers.push('breaking_news')

  // Demo path: if live didn't trip anything, still show as demo with context
  if (demo && triggers.length === 1) {
    // keep demo-only
  }

  return {
    fetchedAt: Date.now(),
    last,
    volRecentPct,
    volMeanPct,
    volRatio,
    fundingPct,
    fundingMeanAbsPct,
    fundingRatio,
    oi,
    newsHeadline: news?.title || null,
    newsUrl: news?.url || null,
    triggers,
    demo,
  }
}

export function shouldFireAlert(snap: OscillationSnapshot): boolean {
  if (snap.demo) return true
  return snap.triggers.some((t) => t !== 'demo')
}

export function oscillationSources(snap: OscillationSnapshot): OscSource[] {
  const src: OscSource[] = [
    { label: 'OKX XAU-USDT-SWAP', url: OKX_TRADE },
    { label: 'OKX ticker API', url: OKX_TICKER },
    { label: 'OKX funding', url: OKX_FUNDING },
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

export function buildOscillationAlertCard(snap: OscillationSnapshot): Record<string, unknown> {
  const demo = snap.demo
  const title = demo ? '【DEMO】震荡行情预警' : '震荡行情预警'
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
      '演示：当前未触及实盘阈值，展示预警卡片样式与推送通道（群 + Haixiang 私聊）。',
    )
  }

  const sources = oscillationSources(snap)
  const body = [
    demo ? '🧪 **这是 DEMO 预警**（明天 10:00 东八区演练）' : '⚠️ **震荡／杠杆／新闻预警**',
    '',
    `• **标的：** OKX XAU-USDT-SWAP · 最新 **${fmt(snap.last)}**`,
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
  // 10:00–10:14 window so */15 cron catches it once
  return hm >= '10:00' && hm <= '10:14'
}
