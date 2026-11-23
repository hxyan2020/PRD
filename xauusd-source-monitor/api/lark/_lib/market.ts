import type { Lang } from './types.js'

export interface MarketSnapshot {
  okx?: { last: number; change24hPct?: number }
  dxyHint?: string
  notes: string[]
  sources: { label: string; url: string }[]
  fetchedAt: number
}

async function fetchOkxXau(): Promise<{ last: number; change24hPct?: number } | null> {
  try {
    const r = await fetch('https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT', {
      signal: AbortSignal.timeout(8_000),
    })
    const data = (await r.json()) as {
      data?: { last?: string; sodUtc8?: string; open24h?: string }[]
    }
    const row = data.data?.[0]
    if (!row?.last) return null
    const last = Number(row.last)
    const open = Number(row.open24h || row.sodUtc8 || 0)
    const change24hPct = open > 0 ? ((last - open) / open) * 100 : undefined
    return { last, change24hPct }
  } catch {
    return null
  }
}

async function fetchOkxCandleNote(): Promise<string | null> {
  try {
    const r = await fetch(
      'https://www.okx.com/api/v5/market/candles?instId=XAU-USDT&bar=1H&limit=3',
      { signal: AbortSignal.timeout(8_000) },
    )
    const data = (await r.json()) as { data?: string[][] }
    const candles = data.data || []
    if (candles.length < 2) return null
    const latest = Number(candles[0]?.[4] || 0)
    const prev = Number(candles[1]?.[4] || 0)
    if (!latest || !prev) return null
    const bps = ((latest - prev) / prev) * 10_000
    return `Last 1H close move ≈ ${bps.toFixed(0)} bps`
  } catch {
    return null
  }
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [okx, candle] = await Promise.all([fetchOkxXau(), fetchOkxCandleNote()])
  const notes: string[] = []
  if (candle) notes.push(candle)
  notes.push(
    'External news/macro (Kitco, Yahoo Finance, Fed calendar) should be confirmed on the web Market desk before treating as cause.',
  )
  return {
    okx: okx || undefined,
    notes,
    sources: [
      { label: 'OKX XAU-USDT', url: 'https://www.okx.com/trade-spot/xau-usdt' },
      { label: 'Kitco gold', url: 'https://www.kitco.com/gold-price-today-usa/' },
      { label: 'Yahoo GC=F', url: 'https://finance.yahoo.com/quote/GC=F/' },
      { label: 'VE Risk Desk (web)', url: 'https://vex-llm-proxy.vercel.app/#/market' },
    ],
    fetchedAt: Date.now(),
  }
}

export function formatMarketAnswer(snap: MarketSnapshot, lang: Lang, question: string): string {
  const lines: string[] = []
  if (lang === 'zh-Hans') {
    lines.push('📈 **市况摘要 · V Exchange Risk**', '')
    if (snap.okx) {
      const ch =
        snap.okx.change24hPct != null ? `（约 ${snap.okx.change24hPct.toFixed(2)}% / 24h）` : ''
      lines.push(`• **OKX XAU-USDT 最新：** **${snap.okx.last.toFixed(2)}** ${ch}`)
    } else {
      lines.push('• **OKX 行情：** 暂不可用 — 请稍后重试或开网页 Market 面板')
    }
    for (const n of snap.notes) lines.push(`• **备注：** ${n}`)
    lines.push('', `❓ **针对你的问题：** 「${question.slice(0, 120)}」`)
    lines.push(
      '• **解读：** 价格异动「观察」（bps／基差／场所结构）≠「原因」（新闻／宏观）。若需事故排查，请贴告警原文或输入 `investigate`。',
    )
    lines.push('', '🔗 **来源**')
    for (const s of snap.sources) lines.push(`• **${s.label}：** ${s.url}`)
  } else if (lang === 'zh-Hant') {
    lines.push('📈 **市況摘要 · V Exchange Risk**', '')
    if (snap.okx) {
      const ch =
        snap.okx.change24hPct != null ? `（約 ${snap.okx.change24hPct.toFixed(2)}% / 24h）` : ''
      lines.push(`• **OKX XAU-USDT 最新：** **${snap.okx.last.toFixed(2)}** ${ch}`)
    } else {
      lines.push('• **OKX 行情：** 暫不可用 — 請稍後重試或開網頁 Market 面板')
    }
    for (const n of snap.notes) lines.push(`• **備註：** ${n}`)
    lines.push('', `❓ **針對你的問題：** 「${question.slice(0, 120)}」`)
    lines.push(
      '• **解讀：** 價格異動「觀察」（bps／基差／場所結構）≠「原因」（新聞／宏觀）。若需事故排查，請貼告警原文或輸入 `investigate`。',
    )
    lines.push('', '🔗 **來源**')
    for (const s of snap.sources) lines.push(`• **${s.label}：** ${s.url}`)
  } else {
    lines.push('📈 **Market brief · V Exchange Risk**', '')
    if (snap.okx) {
      const ch =
        snap.okx.change24hPct != null ? ` (~${snap.okx.change24hPct.toFixed(2)}% / 24h)` : ''
      lines.push(`• **OKX XAU-USDT last:** **${snap.okx.last.toFixed(2)}**${ch}`)
    } else {
      lines.push('• **OKX quotes:** unavailable — retry shortly or open the web Market desk')
    }
    for (const n of snap.notes) lines.push(`• **Note:** ${n}`)
    lines.push('', `❓ **On your question:** “${question.slice(0, 120)}”`)
    lines.push(
      '• **Guidance:** price “observations” (bps / basis / venue structure) ≠ “causes” (news / macro). For an incident, paste the alert or type `investigate`.',
    )
    lines.push('', '🔗 **Sources**')
    for (const s of snap.sources) lines.push(`• **${s.label}:** ${s.url}`)
  }
  return lines.join('\n')
}
