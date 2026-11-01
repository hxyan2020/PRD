import type { AppLang } from '../i18n/messages'
import type { BriefingCitation, SourceHealth } from '../types'

const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_FUNDING = 'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP'
const OKX_TRADE = 'https://www.okx.com/trade-swap/xau-usdt-swap'
const BITGET_TICKER =
  'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT'
const BITGET_TRADE = 'https://www.bitget.com/futures/usdt/XAUUSDT'
const GOLD_API = 'https://api.gold-api.com/price/XAU'
const KITCO_CHART = 'https://www.kitco.com/charts/gold'
const BYBIT_TRADE = 'https://www.bybit.com/trade/usdt/XAUUSDT'
const BINANCE_FUTURES = 'https://www.binance.com/en/futures/XAUUSDT'
const YAHOO_GC = 'https://finance.yahoo.com/quote/GC%3DF/'
const YAHOO_DXY = 'https://finance.yahoo.com/quote/DX-Y.NYB/'
const YAHOO_TNX = 'https://finance.yahoo.com/quote/%5ETNX/'
const FED_PRESS_JSON = 'https://www.federalreserve.gov/json/ne-press.json'

/** Specific articles (not landing pages) tied to the current gold dislocation. */
const GOLD_NEWS_ARTICLES = [
  {
    id: 'kitco-plunge-3900',
    en: 'Kitco: Gold plunges to one-year low below $3,900 (30 Oct 2026)',
    zh: 'Kitco：金價跌破 3,900 美元至一年低點（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-prices-plunge-one-year-low-below-3900-higher-oil-prices-fuel-fears',
  },
  {
    id: 'kitco-pm-liquidation',
    en: 'Kitco PM: Gold below $3,900 as Wall Street selloff triggers liquidation (30 Oct 2026)',
    zh: 'Kitco 午後：美股拋售引發清算，金價跌破 3,900（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-falls-below-3900-silver-tumbles-wall-street-selloff-triggers',
  },
  {
    id: 'kitco-survey',
    en: 'Kitco survey: Wall Street turns bearish after gold sinks below $3,900 (30 Oct 2026)',
    zh: 'Kitco 調查：金價跌破 3,900 後華爾街轉空（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/wall-street-abandons-ship-after-gold-sinks-below-3900oz-main-street',
  },
  {
    id: 'kitco-paradox',
    en: "Kitco: Gold's paradox — falling yields/weaker USD can't stop selloff (30 Oct 2026)",
    zh: 'Kitco：收益率下行與美元走弱仍擋不住金價拋售（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/golds-frustrating-paradox-falling-yields-and-weaker-dollar-cant-stop',
  },
]

async function latestFedMonetaryUrl(): Promise<BriefingCitation | null> {
  try {
    const res = await fetch(FED_PRESS_JSON, { cache: 'no-store' })
    if (!res.ok) return null
    const rows = (await res.json()) as { t?: string; pt?: string; l?: string; d?: string }[]
    const hit = rows.find(
      (r) =>
        (r.pt || '').toLowerCase().includes('monetary') &&
        (r.t || '').toLowerCase().includes('fomc'),
    )
    if (!hit?.l) return null
    const path = hit.l.startsWith('http') ? hit.l : `https://www.federalreserve.gov${hit.l}`
    return {
      id: 'fed-fomc',
      label: `Fed FOMC statement — ${hit.d ?? 'latest'}`,
      url: path,
      category: 'macro',
      note: hit.t,
    }
  } catch {
    return null
  }
}

async function snapshotNote(url: string, pick: (json: unknown) => string | null): Promise<string | undefined> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return undefined
    const json = await res.json()
    return pick(json) ?? undefined
  } catch {
    return undefined
  }
}

export async function collectCitations(args: {
  lang: AppLang
  health: SourceHealth[]
  composite: number
  spot: number | null
  createdAt: number
}): Promise<BriefingCitation[]> {
  const { lang, health, composite, spot, createdAt } = args
  const zh = lang === 'zh-Hant'
  const ts = new Date(createdAt).toISOString()
  const citations: BriefingCitation[] = []

  const [okxNote, bitgetNote, spotNote, fed] = await Promise.all([
    snapshotNote(OKX_TICKER, (j) => {
      const last = (j as { data?: { last?: string }[] })?.data?.[0]?.last
      return last ? `last=${last} @ ${ts}` : null
    }),
    snapshotNote(BITGET_TICKER, (j) => {
      const last = (j as { data?: { lastPr?: string }[] })?.data?.[0]?.lastPr
      return last ? `lastPr=${last} @ ${ts}` : null
    }),
    snapshotNote(GOLD_API, (j) => {
      const price = (j as { price?: number })?.price
      return price != null ? `price=${price} @ ${ts}` : null
    }),
    latestFedMonetaryUrl(),
  ])

  citations.push({
    id: 'okx-ticker-api',
    label: zh
      ? 'OKX API：XAU-USDT-SWAP 最新成交價 JSON'
      : 'OKX API: XAU-USDT-SWAP last price JSON',
    url: OKX_TICKER,
    category: 'price_api',
    note: okxNote,
  })
  citations.push({
    id: 'okx-funding-api',
    label: zh
      ? 'OKX API：XAU-USDT-SWAP 資金費率 JSON'
      : 'OKX API: XAU-USDT-SWAP funding-rate JSON',
    url: OKX_FUNDING,
    category: 'price_api',
  })
  citations.push({
    id: 'okx-trade',
    label: zh ? 'OKX 交易頁：XAU-USDT-SWAP' : 'OKX trade page: XAU-USDT-SWAP',
    url: OKX_TRADE,
    category: 'venue',
  })
  citations.push({
    id: 'bitget-ticker-api',
    label: zh
      ? 'Bitget API：XAUUSDT 永續 ticker JSON'
      : 'Bitget API: XAUUSDT perpetual ticker JSON',
    url: BITGET_TICKER,
    category: 'price_api',
    note: bitgetNote,
  })
  citations.push({
    id: 'bitget-trade',
    label: zh ? 'Bitget 合約頁：XAUUSDT' : 'Bitget futures page: XAUUSDT',
    url: BITGET_TRADE,
    category: 'venue',
  })
  citations.push({
    id: 'bybit-trade',
    label: zh ? 'Bybit 交易頁：XAUUSDT' : 'Bybit trade page: XAUUSDT',
    url: BYBIT_TRADE,
    category: 'venue',
  })
  citations.push({
    id: 'binance-futures',
    label: zh ? 'Binance 合約頁：XAUUSDT' : 'Binance futures page: XAUUSDT',
    url: BINANCE_FUTURES,
    category: 'venue',
  })
  citations.push({
    id: 'gold-api-xau',
    label: zh ? 'gold-api：XAU 現貨美元價 JSON' : 'gold-api: XAU spot USD JSON',
    url: GOLD_API,
    category: 'price_api',
    note:
      spotNote ??
      (spot != null ? `monitor spot=${spot.toFixed(2)}; composite=${composite.toFixed(2)}` : undefined),
  })
  citations.push({
    id: 'kitco-gold-chart',
    label: zh ? 'Kitco 黃金現貨即時圖表（盎司美元）' : 'Kitco live gold spot chart (USD/oz)',
    url: KITCO_CHART,
    category: 'price_api',
  })
  citations.push({
    id: 'yahoo-gc',
    label: zh ? 'Yahoo Finance：COMEX 黃金期貨 GC=F' : 'Yahoo Finance: COMEX gold futures GC=F',
    url: YAHOO_GC,
    category: 'macro',
  })
  citations.push({
    id: 'yahoo-dxy',
    label: zh ? 'Yahoo Finance：美元指數 DX-Y.NYB' : 'Yahoo Finance: US Dollar Index DX-Y.NYB',
    url: YAHOO_DXY,
    category: 'macro',
  })
  citations.push({
    id: 'yahoo-tnx',
    label: zh ? 'Yahoo Finance：美國 10 年期收益率 ^TNX' : 'Yahoo Finance: US 10Y yield ^TNX',
    url: YAHOO_TNX,
    category: 'macro',
  })

  if (fed) {
    citations.push({
      ...fed,
      label: zh ? `聯準會 FOMC 聲明 — ${fed.note ?? fed.label}` : fed.label,
    })
  } else {
    citations.push({
      id: 'fed-fomc-fallback',
      label: zh
        ? '聯準會 FOMC 聲明（2026-10-28）'
        : 'Federal Reserve FOMC statement (28 Oct 2026)',
      url: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm',
      category: 'macro',
    })
  }

  for (const article of GOLD_NEWS_ARTICLES) {
    citations.push({
      id: article.id,
      label: zh ? article.zh : article.en,
      url: article.url,
      category: 'news',
    })
  }

  // Attach which breached venues map to which verification links
  const breached = health.filter((h) => h.health === 'alert' || h.health === 'watch')
  if (breached.length) {
    citations.push({
      id: 'breach-map',
      label: zh
        ? `本次越界來源對照：${breached.map((h) => `${h.id} ${h.deviationBps?.toFixed(1) ?? '?'}bps`).join(' · ')}`
        : `Breached sources this event: ${breached
            .map((h) => `${h.id} ${h.deviationBps?.toFixed(1) ?? '?'}bps`)
            .join(' · ')}`,
      url: OKX_TICKER,
      category: 'positioning',
      note: zh
        ? '點上方各交易所 API/交易頁核對即時報價；衍生 LP 請以綜合錨點交叉驗證。'
        : 'Open the venue API/trade links above to verify live quotes; derived LPs should be cross-checked vs anchors.',
    })
  }

  return citations
}

export function citationsToLegacyLines(citations: BriefingCitation[]): string[] {
  return citations.map((c) => `${c.label} — ${c.url}${c.note ? ` (${c.note})` : ''}`)
}
