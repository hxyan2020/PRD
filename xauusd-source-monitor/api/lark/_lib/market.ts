import type { Lang } from './types.js'

export interface MarketSnapshot {
  okx?: { last: number; change24hPct?: number }
  bitget?: { last: number; change24hPct?: number }
  spot?: { last: number }
  dxyHint?: string
  notes: string[]
  sources: { label: string; url: string }[]
  fetchedAt: number
}

const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_CANDLES =
  'https://www.okx.com/api/v5/market/candles?instId=XAU-USDT-SWAP&bar=1H&limit=3'
const BITGET_TICKER =
  'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT'
const GOLD_API = 'https://api.gold-api.com/price/XAU'

async function fetchOkxXau(): Promise<{ last: number; change24hPct?: number } | null> {
  try {
    const r = await fetch(OKX_TICKER, { signal: AbortSignal.timeout(8_000) })
    const data = (await r.json()) as {
      code?: string
      data?: { last?: string; sodUtc8?: string; open24h?: string }[]
    }
    if (String(data.code || '') !== '0') return null
    const row = data.data?.[0]
    if (!row?.last) return null
    const last = Number(row.last)
    if (!Number.isFinite(last) || last <= 0) return null
    const open = Number(row.open24h || row.sodUtc8 || 0)
    const change24hPct = open > 0 ? ((last - open) / open) * 100 : undefined
    return { last, change24hPct }
  } catch {
    return null
  }
}

async function fetchBitgetXau(): Promise<{ last: number; change24hPct?: number } | null> {
  try {
    const r = await fetch(BITGET_TICKER, { signal: AbortSignal.timeout(8_000) })
    const data = (await r.json()) as {
      code?: string
      data?: { lastPr?: string; change24h?: string }[]
    }
    if (String(data.code || '') !== '00000') return null
    const row = data.data?.[0]
    const last = Number(row?.lastPr || 0)
    if (!Number.isFinite(last) || last <= 0) return null
    const ch = Number(row?.change24h)
    const change24hPct = Number.isFinite(ch) ? ch * 100 : undefined
    return { last, change24hPct }
  } catch {
    return null
  }
}

async function fetchSpotXau(): Promise<{ last: number } | null> {
  try {
    const r = await fetch(GOLD_API, { signal: AbortSignal.timeout(8_000) })
    const data = (await r.json()) as { price?: number }
    const last = Number(data.price || 0)
    if (!Number.isFinite(last) || last <= 0) return null
    return { last }
  } catch {
    return null
  }
}

async function fetchOkxCandleNote(): Promise<string | null> {
  try {
    const r = await fetch(OKX_CANDLES, { signal: AbortSignal.timeout(8_000) })
    const data = (await r.json()) as { code?: string; data?: string[][] }
    if (String(data.code || '') !== '0') return null
    const candles = data.data || []
    if (candles.length < 2) return null
    const latest = Number(candles[0]?.[4] || 0)
    const prev = Number(candles[1]?.[4] || 0)
    if (!latest || !prev) return null
    const bps = ((latest - prev) / prev) * 10_000
    return `Last 1H close move ≈ ${bps.toFixed(0)} bps (OKX SWAP)`
  } catch {
    return null
  }
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [okx, bitget, spot, candle] = await Promise.all([
    fetchOkxXau(),
    fetchBitgetXau(),
    fetchSpotXau(),
    fetchOkxCandleNote(),
  ])
  const notes: string[] = []
  if (candle) notes.push(candle)
  if (okx && spot) {
    const basisBps = ((okx.last - spot.last) / spot.last) * 10_000
    notes.push(`OKX SWAP vs spot XAU basis ≈ ${basisBps.toFixed(0)} bps`)
  }
  notes.push(
    'External news/macro (Kitco, Yahoo Finance, Fed calendar) should be confirmed on the web Market desk before treating as cause.',
  )
  return {
    okx: okx || undefined,
    bitget: bitget || undefined,
    spot: spot || undefined,
    notes,
    sources: [
      { label: 'OKX XAU-USDT-SWAP', url: 'https://www.okx.com/trade-swap/xau-usdt-swap' },
      { label: 'Bitget XAUUSDT', url: 'https://www.bitget.com/futures/usdt/XAUUSDT' },
      { label: 'gold-api XAU spot', url: 'https://api.gold-api.com/price/XAU' },
      { label: 'Kitco gold', url: 'https://www.kitco.com/gold-price-today-usa/' },
      { label: 'Yahoo GC=F', url: 'https://finance.yahoo.com/quote/GC=F/' },
      { label: 'VE Risk Desk (web)', url: 'https://vex-llm-proxy.vercel.app/#/market' },
    ],
    fetchedAt: Date.now(),
  }
}

/** True when the user only typed a market command / synonym — don't echo it back. */
function isBareMarketQuery(question: string): boolean {
  const q = question.trim().toLowerCase()
  return /^(market|markets|行情|市况|市況|趋势|趨勢|gold|xau|xauusd)$/i.test(q)
}

export function formatMarketAnswer(snap: MarketSnapshot, lang: Lang, question: string): string {
  const lines: string[] = []
  const bare = isBareMarketQuery(question)
  const hasPrint = Boolean(snap.okx || snap.bitget || snap.spot)

  if (lang === 'zh-Hans') {
    lines.push('📈 **市况摘要 · V Exchange Risk**', '')
    if (snap.okx) {
      const ch =
        snap.okx.change24hPct != null ? `（约 ${snap.okx.change24hPct.toFixed(2)}% / 24h）` : ''
      lines.push(`• **OKX XAU-USDT-SWAP 最新：** **${snap.okx.last.toFixed(2)}** ${ch}`)
    }
    if (snap.bitget) {
      const ch =
        snap.bitget.change24hPct != null
          ? `（约 ${snap.bitget.change24hPct.toFixed(2)}% / 24h）`
          : ''
      lines.push(`• **Bitget XAUUSDT 最新：** **${snap.bitget.last.toFixed(2)}** ${ch}`)
    }
    if (snap.spot) {
      lines.push(`• **现货 XAU（gold-api）：** **${snap.spot.last.toFixed(2)}**`)
    }
    if (!hasPrint) {
      lines.push(
        '• **行情：** 暂不可用（外部行情源无法访问）— 请稍后重试，或联系 **@Yan Haixiang**；也可打开网页 Market 面板',
      )
    }
    lines.push('')
    for (const n of snap.notes) lines.push(`• **备注：** ${n}`)
    if (!bare) {
      lines.push('', `❓ **针对你的问题：** 「${question.slice(0, 120)}」`)
    }
    lines.push(
      '',
      '• **解读：** 价格异动「观察」（bps／基差／场所结构）≠「原因」（新闻／宏观）。若需事故排查，请贴告警原文或输入 **investigate**。',
    )
    lines.push('', '🔗 **来源**')
    for (const s of snap.sources) lines.push(`• **${s.label}：** ${s.url}`)
  } else if (lang === 'zh-Hant') {
    lines.push('📈 **市況摘要 · V Exchange Risk**', '')
    if (snap.okx) {
      const ch =
        snap.okx.change24hPct != null ? `（約 ${snap.okx.change24hPct.toFixed(2)}% / 24h）` : ''
      lines.push(`• **OKX XAU-USDT-SWAP 最新：** **${snap.okx.last.toFixed(2)}** ${ch}`)
    }
    if (snap.bitget) {
      const ch =
        snap.bitget.change24hPct != null
          ? `（約 ${snap.bitget.change24hPct.toFixed(2)}% / 24h）`
          : ''
      lines.push(`• **Bitget XAUUSDT 最新：** **${snap.bitget.last.toFixed(2)}** ${ch}`)
    }
    if (snap.spot) {
      lines.push(`• **現貨 XAU（gold-api）：** **${snap.spot.last.toFixed(2)}**`)
    }
    if (!hasPrint) {
      lines.push(
        '• **行情：** 暫不可用（外部行情源無法訪問）— 請稍後重試，或聯繫 **@Yan Haixiang**；也可打開網頁 Market 面板',
      )
    }
    lines.push('')
    for (const n of snap.notes) lines.push(`• **備註：** ${n}`)
    if (!bare) {
      lines.push('', `❓ **針對你的問題：** 「${question.slice(0, 120)}」`)
    }
    lines.push(
      '',
      '• **解讀：** 價格異動「觀察」（bps／基差／場所結構）≠「原因」（新聞／宏觀）。若需事故排查，請貼告警原文或輸入 **investigate**。',
    )
    lines.push('', '🔗 **來源**')
    for (const s of snap.sources) lines.push(`• **${s.label}：** ${s.url}`)
  } else {
    lines.push('📈 **Market brief · V Exchange Risk**', '')
    if (snap.okx) {
      const ch =
        snap.okx.change24hPct != null ? ` (~${snap.okx.change24hPct.toFixed(2)}% / 24h)` : ''
      lines.push(`• **OKX XAU-USDT-SWAP last:** **${snap.okx.last.toFixed(2)}**${ch}`)
    }
    if (snap.bitget) {
      const ch =
        snap.bitget.change24hPct != null
          ? ` (~${snap.bitget.change24hPct.toFixed(2)}% / 24h)`
          : ''
      lines.push(`• **Bitget XAUUSDT last:** **${snap.bitget.last.toFixed(2)}**${ch}`)
    }
    if (snap.spot) {
      lines.push(`• **Spot XAU (gold-api):** **${snap.spot.last.toFixed(2)}**`)
    }
    if (!hasPrint) {
      lines.push(
        '• **Quotes:** unavailable (external market feeds unreachable) — retry shortly, contact **@Yan Haixiang**, or open the web Market desk',
      )
    }
    lines.push('')
    for (const n of snap.notes) lines.push(`• **Note:** ${n}`)
    if (!bare) {
      lines.push('', `❓ **On your question:** “${question.slice(0, 120)}”`)
    }
    lines.push(
      '',
      '• **Guidance:** price “observations” (bps / basis / venue structure) ≠ “causes” (news / macro). For an incident, paste the alert or type **investigate**.',
    )
    lines.push('', '🔗 **Sources**')
    for (const s of snap.sources) lines.push(`• **${s.label}:** ${s.url}`)
  }
  return lines.join('\n')
}
