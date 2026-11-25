/**
 * Multi-asset market board for 报价 AI排查助手.
 * Covers major crypto / equity / FX / commodity indices with public data sources.
 */

export type AssetClass = 'crypto' | 'equity' | 'forex' | 'commodity'

export interface AssetQuote {
  id: string
  class: AssetClass
  symbol: string
  nameZh: string
  nameEn: string
  last: number
  changePct?: number
  source: string
  sourceUrl: string
  asOf: number
}

export interface MultiAssetBoard {
  quotes: AssetQuote[]
  byClass: Record<AssetClass, AssetQuote[]>
  notes: string[]
  sources: { label: string; url: string }[]
  fetchedAt: number
  movers: { up: AssetQuote[]; down: AssetQuote[] }
}

type Instrument = {
  id: string
  class: AssetClass
  symbol: string
  nameZh: string
  nameEn: string
  fetch: () => Promise<Omit<AssetQuote, 'id' | 'class' | 'symbol' | 'nameZh' | 'nameEn'> | null>
}

const UA = 'quote-ai-troubleshooting-bot/1.0 (+https://quote-ai-troubleshooting-bot.vercel.app)'

async function getJson(url: string, timeoutMs = 12_000): Promise<unknown | null> {
  try {
    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

/** Prefer data-api.binance.vision — api.binance.com often returns 451 outside supported regions. */
const BINANCE_DATA_HOSTS = [
  'https://data-api.binance.vision',
  'https://api.binance.com',
] as const

async function binanceTicker(symbol: string): Promise<{ last: number; changePct?: number } | null> {
  for (const host of BINANCE_DATA_HOSTS) {
    const data = (await getJson(
      `${host}/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
    )) as { lastPrice?: string; priceChangePercent?: string; code?: number } | null
    if (!data?.lastPrice) continue
    const last = Number(data.lastPrice)
    const changePct = data.priceChangePercent != null ? Number(data.priceChangePercent) : undefined
    if (!Number.isFinite(last)) continue
    return { last, changePct: Number.isFinite(changePct) ? changePct : undefined }
  }
  return null
}

async function okxSwapTicker(instId: string): Promise<{ last: number; changePct?: number } | null> {
  const data = (await getJson(
    `https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`,
  )) as { data?: { last?: string; sodUtc8?: string }[] } | null
  const row = data?.data?.[0]
  if (!row?.last) return null
  const last = Number(row.last)
  if (!Number.isFinite(last)) return null
  let changePct: number | undefined
  const open = row.sodUtc8 != null ? Number(row.sodUtc8) : NaN
  if (Number.isFinite(open) && open > 0) changePct = ((last - open) / open) * 100
  return { last, changePct }
}

/** Yahoo Finance chart v8 — works for equities, FX (=X), futures (=F), indices (^…). */
async function yahooQuote(
  yahooSymbol: string,
): Promise<{ last: number; changePct?: number; sourceUrl: string } | null> {
  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']
  for (const host of hosts) {
    const url = `${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`
    const data = (await getJson(url)) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number
            chartPreviousClose?: number
            previousClose?: number
          }
        }[]
      }
    } | null
    const meta = data?.chart?.result?.[0]?.meta
    const last = Number(meta?.regularMarketPrice)
    if (!Number.isFinite(last)) continue
    const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose)
    const changePct =
      Number.isFinite(prev) && prev > 0 ? ((last - prev) / prev) * 100 : undefined
    return {
      last,
      changePct,
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}`,
    }
  }
  return null
}

/** Stooq CSV last — resilient when Yahoo rate-limits (HTTP 429). */
async function stooqQuote(
  stooqSymbol: string,
): Promise<{ last: number; changePct?: number; sourceUrl: string } | null> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`
  try {
    const r = await fetch(url, {
      headers: { Accept: 'text/csv,text/plain,*/*', 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
    })
    if (!r.ok) return null
    const text = await r.text()
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return null
    const cols = lines[1]!.split(',')
    // Symbol,Date,Time,Open,High,Low,Close,Volume
    const open = Number(cols[3])
    const close = Number(cols[6])
    if (!Number.isFinite(close)) return null
    const changePct =
      Number.isFinite(open) && open > 0 ? ((close - open) / open) * 100 : undefined
    return {
      last: close,
      changePct,
      sourceUrl: `https://stooq.com/q/?s=${encodeURIComponent(stooqSymbol)}`,
    }
  } catch {
    return null
  }
}

/** Frankfurter ECB FX — last resort for major USD crosses (no change %). */
async function frankfurterUsdCross(
  quote: string,
): Promise<{ last: number; sourceUrl: string } | null> {
  // EURUSD = EUR→USD rate; USDJPY = 1 / (EUR→USD) * (EUR→JPY) roughly via USD base.
  try {
    if (quote === 'EUR') {
      const data = (await getJson('https://api.frankfurter.app/latest?from=EUR&to=USD')) as {
        rates?: { USD?: number }
      } | null
      const last = Number(data?.rates?.USD)
      return Number.isFinite(last)
        ? { last, sourceUrl: 'https://www.frankfurter.app/' }
        : null
    }
    const data = (await getJson(
      `https://api.frankfurter.app/latest?from=USD&to=${encodeURIComponent(quote)}`,
    )) as { rates?: Record<string, number> } | null
    const last = Number(data?.rates?.[quote])
    return Number.isFinite(last)
      ? { last, sourceUrl: 'https://www.frankfurter.app/' }
      : null
  } catch {
    return null
  }
}

async function publicIndexQuote(opts: {
  yahoo: string
  stooq?: string
  frankfurter?: string
}): Promise<{ last: number; changePct?: number; source: string; sourceUrl: string } | null> {
  const y = await yahooQuote(opts.yahoo)
  if (y) {
    return { last: y.last, changePct: y.changePct, source: 'Yahoo Finance', sourceUrl: y.sourceUrl }
  }
  if (opts.stooq) {
    const s = await stooqQuote(opts.stooq)
    if (s) {
      return { last: s.last, changePct: s.changePct, source: 'Stooq', sourceUrl: s.sourceUrl }
    }
  }
  if (opts.frankfurter) {
    const f = await frankfurterUsdCross(opts.frankfurter)
    if (f) return { last: f.last, source: 'Frankfurter / ECB', sourceUrl: f.sourceUrl }
  }
  return null
}

async function goldApiSpot(): Promise<{ last: number } | null> {
  const data = (await getJson('https://api.gold-api.com/price/XAU')) as {
    price?: number
  } | null
  const last = Number(data?.price)
  return Number.isFinite(last) ? { last } : null
}

const INSTRUMENTS: Instrument[] = [
  // —— Crypto ——
  {
    id: 'btc',
    class: 'crypto',
    symbol: 'BTCUSDT',
    nameZh: '比特币 BTC',
    nameEn: 'Bitcoin BTC',
    fetch: async () => {
      const q =
        (await binanceTicker('BTCUSDT')) ||
        (await okxSwapTicker('BTC-USDT-SWAP').then((x) =>
          x ? { last: x.last, changePct: x.changePct } : null,
        ))
      if (!q) return null
      return {
        last: q.last,
        changePct: q.changePct,
        source: 'Binance / OKX',
        sourceUrl: 'https://www.binance.com/en/trade/BTC_USDT',
        asOf: Date.now(),
      }
    },
  },
  {
    id: 'eth',
    class: 'crypto',
    symbol: 'ETHUSDT',
    nameZh: '以太坊 ETH',
    nameEn: 'Ethereum ETH',
    fetch: async () => {
      const q =
        (await binanceTicker('ETHUSDT')) ||
        (await okxSwapTicker('ETH-USDT-SWAP').then((x) =>
          x ? { last: x.last, changePct: x.changePct } : null,
        ))
      if (!q) return null
      return {
        last: q.last,
        changePct: q.changePct,
        source: 'Binance / OKX',
        sourceUrl: 'https://www.binance.com/en/trade/ETH_USDT',
        asOf: Date.now(),
      }
    },
  },
  {
    id: 'sol',
    class: 'crypto',
    symbol: 'SOLUSDT',
    nameZh: 'Solana SOL',
    nameEn: 'Solana SOL',
    fetch: async () => {
      const q = await binanceTicker('SOLUSDT')
      if (!q) return null
      return {
        last: q.last,
        changePct: q.changePct,
        source: 'Binance',
        sourceUrl: 'https://www.binance.com/en/trade/SOL_USDT',
        asOf: Date.now(),
      }
    },
  },
  // —— Equity indices ——
  {
    id: 'spx',
    class: 'equity',
    symbol: '^GSPC',
    nameZh: '标普 500',
    nameEn: 'S&P 500',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: '^GSPC', stooq: '^spx' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'ndx',
    class: 'equity',
    symbol: '^IXIC',
    nameZh: '纳斯达克综合',
    nameEn: 'Nasdaq Composite',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: '^IXIC', stooq: '^ndq' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'dji',
    class: 'equity',
    symbol: '^DJI',
    nameZh: '道琼斯工业',
    nameEn: 'Dow Jones',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: '^DJI', stooq: '^dji' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'hsi',
    class: 'equity',
    symbol: '^HSI',
    nameZh: '恒生指数',
    nameEn: 'Hang Seng',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: '^HSI', stooq: '^hsi' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  // —— Forex ——
  {
    id: 'eurusd',
    class: 'forex',
    symbol: 'EURUSD=X',
    nameZh: '欧元 / 美元',
    nameEn: 'EUR/USD',
    fetch: async () => {
      const q = await publicIndexQuote({
        yahoo: 'EURUSD=X',
        stooq: 'eurusd',
        frankfurter: 'EUR',
      })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'usdjpy',
    class: 'forex',
    symbol: 'USDJPY=X',
    nameZh: '美元 / 日元',
    nameEn: 'USD/JPY',
    fetch: async () => {
      const q = await publicIndexQuote({
        yahoo: 'USDJPY=X',
        stooq: 'usdjpy',
        frankfurter: 'JPY',
      })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'gbpusd',
    class: 'forex',
    symbol: 'GBPUSD=X',
    nameZh: '英镑 / 美元',
    nameEn: 'GBP/USD',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: 'GBPUSD=X', stooq: 'gbpusd' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'usdcnh',
    class: 'forex',
    symbol: 'USDCNH=X',
    nameZh: '美元 / 离岸人民币',
    nameEn: 'USD/CNH',
    fetch: async () => {
      const q = await publicIndexQuote({
        yahoo: 'USDCNH=X',
        stooq: 'usdcnh',
        frankfurter: 'CNY',
      })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  // —— Commodities ——
  {
    id: 'xau',
    class: 'commodity',
    symbol: 'XAUUSD',
    nameZh: '黄金 XAU',
    nameEn: 'Gold XAU',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: 'GC=F', stooq: 'gc.f' })
      if (q) return { ...q, asOf: Date.now() }
      const g = await goldApiSpot()
      if (!g) return null
      return {
        last: g.last,
        source: 'gold-api.com',
        sourceUrl: 'https://gold-api.com/',
        asOf: Date.now(),
      }
    },
  },
  {
    id: 'wti',
    class: 'commodity',
    symbol: 'CL=F',
    nameZh: 'WTI 原油',
    nameEn: 'WTI Crude',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: 'CL=F', stooq: 'cl.f' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'brent',
    class: 'commodity',
    symbol: 'BZ=F',
    nameZh: '布伦特原油',
    nameEn: 'Brent Crude',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: 'BZ=F', stooq: 'ukoil' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
  {
    id: 'silver',
    class: 'commodity',
    symbol: 'SI=F',
    nameZh: '白银',
    nameEn: 'Silver',
    fetch: async () => {
      const q = await publicIndexQuote({ yahoo: 'SI=F', stooq: 'si.f' })
      return q ? { ...q, asOf: Date.now() } : null
    },
  },
]

const CLASS_ORDER: AssetClass[] = ['crypto', 'equity', 'forex', 'commodity']

export function classLabel(lang: 'zh-Hans' | 'zh-Hant' | 'en', c: AssetClass): string {
  if (lang === 'en') {
    return (
      {
        crypto: '🪙 Crypto',
        equity: '📈 Equities',
        forex: '💱 FX',
        commodity: '🛢️ Commodities',
      } as const
    )[c]
  }
  if (lang === 'zh-Hant') {
    return (
      {
        crypto: '🪙 加密貨幣',
        equity: '📈 股票指數',
        forex: '💱 外匯',
        commodity: '🛢️ 大宗商品',
      } as const
    )[c]
  }
  return (
    {
      crypto: '🪙 加密货币',
      equity: '📈 股票指数',
      forex: '💱 外汇',
      commodity: '🛢️ 大宗商品',
    } as const
  )[c]
}

function fmtPx(q: AssetQuote): string {
  const abs = Math.abs(q.last)
  if (abs >= 1000) {
    return q.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (q.class === 'forex') {
    return abs >= 10 ? q.last.toFixed(3) : q.last.toFixed(5)
  }
  if (abs >= 1) return q.last.toFixed(2)
  return q.last.toFixed(4)
}

function fmtChg(q: AssetQuote): string {
  if (q.changePct == null || !Number.isFinite(q.changePct)) return '—'
  const sign = q.changePct >= 0 ? '+' : ''
  return `${sign}${q.changePct.toFixed(2)}%`
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx]!)
    }
  })
  await Promise.all(workers)
  return out
}

export async function fetchMultiAssetBoard(): Promise<MultiAssetBoard> {
  // Limit concurrency so Yahoo/Stooq are less likely to 429 when many symbols load at once.
  const settled = await mapPool(INSTRUMENTS, 3, async (inst) => {
    try {
      const raw = await inst.fetch()
      if (!raw) return null
      return {
        id: inst.id,
        class: inst.class,
        symbol: inst.symbol,
        nameZh: inst.nameZh,
        nameEn: inst.nameEn,
        ...raw,
      } satisfies AssetQuote
    } catch {
      return null
    }
  })

  const quotes = settled.filter(Boolean) as AssetQuote[]
  const byClass = {
    crypto: [] as AssetQuote[],
    equity: [] as AssetQuote[],
    forex: [] as AssetQuote[],
    commodity: [] as AssetQuote[],
  }
  for (const q of quotes) byClass[q.class].push(q)

  const withChg = quotes.filter((q) => q.changePct != null && Number.isFinite(q.changePct))
  const sorted = [...withChg].sort((a, b) => (b.changePct || 0) - (a.changePct || 0))
  const movers = {
    up: sorted.filter((q) => (q.changePct || 0) > 0).slice(0, 3),
    down: sorted.filter((q) => (q.changePct || 0) < 0).slice(-3).reverse(),
  }

  const sourceMap = new Map<string, string>()
  for (const q of quotes) {
    if (!sourceMap.has(q.source)) sourceMap.set(q.source, q.sourceUrl)
  }

  const notes: string[] = []
  if (!quotes.length) notes.push('All market feeds unavailable — retry shortly.')
  else {
    const missing = INSTRUMENTS.filter((i) => !quotes.some((q) => q.id === i.id)).map((i) => i.symbol)
    if (missing.length) notes.push(`Partial coverage — missing: ${missing.join(', ')}`)
  }

  return {
    quotes,
    byClass,
    notes,
    sources: [...sourceMap.entries()].map(([label, url]) => ({ label, url })),
    fetchedAt: Date.now(),
    movers,
  }
}

export function formatMultiAssetBoard(
  board: MultiAssetBoard,
  lang: 'zh-Hans' | 'zh-Hant' | 'en',
  mode: 'hourly' | 'daily' = 'hourly',
): string {
  const hans = lang === 'zh-Hans'
  const hant = lang === 'zh-Hant'
  const scanAt = new Intl.DateTimeFormat(hans || hant ? 'zh-CN' : 'en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(board.fetchedAt))

  const lines: string[] = []
  if (mode === 'daily') {
    lines.push(
      hans
        ? '📊 **每日跨资产行情早报 · 报价 AI排查助手**'
        : hant
          ? '📊 **每日跨資產行情早報 · 報價 AI排查助手**'
          : '📊 **Daily multi-asset brief · Quote AI**',
      '',
    )
  } else {
    lines.push(
      hans
        ? '📊 **跨资产行情扫报 · 报价 AI排查助手**'
        : hant
          ? '📊 **跨資產行情掃報 · 報價 AI排查助手**'
          : '📊 **Multi-asset market scan · Quote AI**',
      '',
    )
  }

  lines.push(
    hans || hant
      ? `⏱ **更新时间：** **${scanAt}**（东八区）`
      : `⏱ **As of:** **${scanAt}** (UTC+8)`,
  )
  lines.push(
    hans
      ? '• 覆盖 **加密 / 股指 / 外汇 / 商品** 主要指数；来源：Binance·OKX（加密）、Yahoo Finance（股指·外汇·商品期货）。'
      : hant
        ? '• 覆蓋 **加密／股指／外匯／商品** 主要指數；來源：Binance·OKX（加密）、Yahoo Finance（股指·外匯·商品期貨）。'
        : '• Covers **crypto / equities / FX / commodities**; sources: Binance·OKX (crypto), Yahoo Finance (equities·FX·futures).',
    '',
  )

  for (const c of CLASS_ORDER) {
    const list = board.byClass[c]
    if (!list.length) continue
    lines.push(`**${classLabel(lang, c)}**`)
    for (const q of list) {
      const name = hans || hant ? q.nameZh : q.nameEn
      lines.push(`• **${name}** (${q.symbol})：**${fmtPx(q)}**（${fmtChg(q)}）`)
    }
    lines.push('')
  }

  if (board.movers.up.length || board.movers.down.length) {
    lines.push(hans ? '**今日波动亮点**' : hant ? '**今日波動亮點**' : '**Movers**')
    for (const q of board.movers.up) {
      const name = hans || hant ? q.nameZh : q.nameEn
      lines.push(`• 🟢 ${name}：**${fmtChg(q)}**`)
    }
    for (const q of board.movers.down) {
      const name = hans || hant ? q.nameZh : q.nameEn
      lines.push(`• 🔴 ${name}：**${fmtChg(q)}**`)
    }
    lines.push('')
  }

  if (board.notes.length) {
    for (const n of board.notes) lines.push(`• ${n}`)
    lines.push('')
  }

  lines.push(
    hans
      ? '• **说明：** 价格为公开行情快照，不构成投资建议；定价 / LP→PE→MT 排查请发 **investigate** 或描述告警。'
      : hant
        ? '• **說明：** 價格為公開行情快照，不構成投資建議；定價／LP→PE→MT 排查請發 **investigate** 或描述告警。'
        : '• **Note:** Public market snapshot only — not investment advice. For pricing / LP→PE→MT RCA send **investigate**.',
  )

  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n')
}

/** Binance spot BTCUSDT candles for the optional tape chart on Lark cards. */
export async function fetchBtcTapeKline(
  interval: '15m' | '1H' | '4H' | '1D' = '1H',
  limit = 36,
): Promise<{
  symbol: string
  interval: string
  sourceId: string
  bars: { t: number; o: number; h: number; l: number; c: number; v?: number }[]
} | null> {
  const map: Record<string, string> = { '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d' }
  const iv = map[interval] || '1h'
  for (const host of BINANCE_DATA_HOSTS) {
    const url = `${host}/api/v3/klines?symbol=BTCUSDT&interval=${iv}&limit=${limit}`
    try {
      const r = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': UA },
        signal: AbortSignal.timeout(12_000),
      })
      if (!r.ok) continue
      const raw = (await r.json()) as unknown[]
      if (!Array.isArray(raw) || !raw.length) continue
      const bars = raw
        .map((row) => {
          const a = row as (string | number)[]
          return {
            t: Number(a[0]),
            o: Number(a[1]),
            h: Number(a[2]),
            l: Number(a[3]),
            c: Number(a[4]),
            v: Number(a[5]),
          }
        })
        .filter((b) => Number.isFinite(b.t) && Number.isFinite(b.c))
      if (!bars.length) continue
      return {
        symbol: 'BTCUSDT',
        interval,
        sourceId: 'binance-btc-spot',
        bars,
      }
    } catch {
      /* try next host */
    }
  }
  return null
}

export function multiAssetToHourlyPoints(board: MultiAssetBoard) {
  const lineFor = (lang: 'zh-Hans' | 'en') => {
    const parts: string[] = []
    for (const c of CLASS_ORDER) {
      const list = board.byClass[c]
      if (!list.length) continue
      const bits = list
        .slice(0, 3)
        .map((q) => `${lang === 'en' ? q.nameEn : q.nameZh} ${fmtPx(q)} (${fmtChg(q)})`)
        .join(' · ')
      parts.push(`${classLabel(lang, c).replace(/^[^ ]+ /, '')}: ${bits}`)
    }
    return parts.join('\n')
  }

  const opportunity = board.movers.up.map((q, i) => ({
    rank: i + 1,
    titleZh: `${q.nameZh} 走强`,
    titleEn: `${q.nameEn} stronger`,
    bodyZh: `${q.nameZh} 近时段变动 **${fmtChg(q)}**，最新 **${fmtPx(q)}**（${q.source}）。`,
    bodyEn: `${q.nameEn} moved **${fmtChg(q)}**; last **${fmtPx(q)}** (${q.source}).`,
    sourceIds: [] as string[],
  }))

  const risk = board.movers.down.map((q, i) => ({
    rank: i + 1,
    titleZh: `${q.nameZh} 走弱`,
    titleEn: `${q.nameEn} softer`,
    bodyZh: `${q.nameZh} 近时段变动 **${fmtChg(q)}**，最新 **${fmtPx(q)}**（${q.source}）。`,
    bodyEn: `${q.nameEn} moved **${fmtChg(q)}**; last **${fmtPx(q)}** (${q.source}).`,
    sourceIds: [] as string[],
  }))

  return {
    tldrZh: lineFor('zh-Hans'),
    tldrEn: lineFor('en'),
    opportunity,
    risk,
  }
}
