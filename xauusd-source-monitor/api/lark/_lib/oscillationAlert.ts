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
/** Geo-safe K-line (okx.com/trade-swap 404s in SG and other regions). */
const OKX_TRADE = 'https://www.tradingview.com/chart/?symbol=OKX%3AXAUUSDT.P'

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
  // Cite exchange trade / K-line UI and news pages — never raw JSON API hosts.
  const src: OscSource[] = [
    { label: 'OKX XAU-USDT-SWAP K线', url: OKX_TRADE },
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
      : '突发新闻：**未命中**（Fed 新闻关键词过滤）'
    : hant
      ? snap.newsHeadline
        ? `突發新聞：**命中** — ${snap.newsHeadline}`
        : '突發新聞：**未命中**（Fed 新聞關鍵詞過濾）'
      : snap.newsHeadline
        ? `Breaking news: **hit** — ${snap.newsHeadline}`
        : 'Breaking news: **no hit** (Fed headline keyword filter)'

  const body = hans
    ? [
        firing
          ? '⚠️ **结论：当前满足预警条件**（与自动推送同一套规则）'
          : '✅ **结论：当前没有震荡／杠杆／突发新闻预警**',
        '',
        `• **标的：** OKX XAU-USDT-SWAP · 最新 **${fmt(snap.last)}**`,
        snap.oi != null ? `• **持仓（OI）：** ${fmt(snap.oi, 0)}` : '',
        '',
        '📌 **触发机制**（你发「震荡行情预警」会即时评估；cron 每 **15** 分钟自动跑同一套）',
        '1. **振幅偏离** — 近 6 根 1H 振幅均值 ≥ 更早约 24 根均值的 **1.45×**',
        '2. **资金费率／杠杆代理** — |费率| ≥ **0.01%** 且 ≥ 历史 |费率| 均值的 **1.5×**',
        '3. **突发新闻** — Fed 新闻标题命中战争／制裁／暴涨暴跌等关键词',
        '命中任一项 → 推送群 + @Yan Haixiang 私聊。',
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
          `• **標的：** OKX XAU-USDT-SWAP · 最新 **${fmt(snap.last)}**`,
          snap.oi != null ? `• **持倉（OI）：** ${fmt(snap.oi, 0)}` : '',
          '',
          '📌 **觸發機制**（你發「震盪行情預警」會即時評估；cron 每 **15** 分鐘自動跑同一套）',
          '1. **振幅偏離** — 近 6 根 1H 振幅均值 ≥ 更早約 24 根均值的 **1.45×**',
          '2. **資金費率／槓桿代理** — |費率| ≥ **0.01%** 且 ≥ 歷史 |費率| 均值的 **1.5×**',
          '3. **突發新聞** — Fed 新聞標題命中戰爭／制裁／暴漲暴跌等關鍵詞',
          '命中任一項 → 推送群 + @Yan Haixiang 私聊。',
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
          `• **Instrument:** OKX XAU-USDT-SWAP · last **${fmt(snap.last)}**`,
          snap.oi != null ? `• **OI:** ${fmt(snap.oi, 0)}` : '',
          '',
          '📌 **Trigger mechanism** (this command evaluates live; cron runs the same check every **15** minutes)',
          '1. **Vol spike** — last-6×1H mean range ≥ **1.45×** the prior ~24-bar mean',
          '2. **Funding / leverage proxy** — |funding| ≥ **0.01%** and ≥ **1.5×** hist |funding| mean',
          '3. **Breaking news** — Fed headline matches war / sanctions / crash / surge keywords',
          'Any hit → push to the group + @Yan Haixiang DM.',
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
      '演示：当前未触及实盘阈值，展示预警卡片样式与推送通道（群 + Haixiang 私聊）。',
    )
  }

  const sources = oscillationSources(snap)
  const body = [
    demo ? '🧪 **这是 DEMO 预警**（今天 10:00 东八区演练）' : '⚠️ **震荡／杠杆／新闻预警**',
    '',
    `${atAdmin} 请留意下方预警`,
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
  // After start until 18:00 CST catch-up (idempotent via demoSentDay).
  // Narrow 10:00–10:14 windows miss when a deploy overlaps the :00 cron.
  return hm >= OSC_DEMO_START_HM && hm < '18:00'
}
