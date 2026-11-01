import type { AppLang } from '../i18n/messages'
import type { BriefingCitation, SourceHealth } from '../types'

const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'
const OKX_FUNDING = 'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP'
const OKX_TRADE = 'https://www.okx.com/trade-swap/xau-usdt-swap'
const BITGET_TICKER =
  'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT'
const BITGET_TRADE = 'https://www.bitget.com/futures/usdt/XAUUSDT'
const GOLD_API = 'https://api.gold-api.com/price/XAU'
const BYBIT_TRADE = 'https://www.bybit.com/trade/usdt/XAUUSDT'
const BINANCE_FUTURES = 'https://www.binance.com/en/futures/XAUUSDT'
/** Concrete 1m chart JSON — not a quote landing page */
const YAHOO_GC_CHART =
  'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d'
const YAHOO_DXY_CHART =
  'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1m&range=1d'
const YAHOO_TNX_CHART =
  'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1m&range=1d'
const YAHOO_GC_PAGE = 'https://finance.yahoo.com/quote/GC%3DF/history?p=GC%3DF'
const YAHOO_DXY_PAGE = 'https://finance.yahoo.com/quote/DX-Y.NYB/history?p=DX-Y.NYB'
const YAHOO_TNX_PAGE = 'https://finance.yahoo.com/quote/%5ETNX/history?p=%5ETNX'
const FED_PRESS_JSON = 'https://www.federalreserve.gov/json/ne-press.json'
const FED_FOMC_FALLBACK =
  'https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm'

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
  {
    id: 'kitco-capitulation',
    en: 'Kitco: Gold & silver near capitulation levels — Jesse Felder (30 Oct 2026)',
    zh: 'Kitco：金銀逼近投降價位 — Jesse Felder（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-and-silver-prices-coming-dangerously-close-capitulation-levels-jesse',
  },
  {
    id: 'kitco-rates-holdback',
    en: 'Kitco: Higher-rate threat holding gold rally back (30 Oct 2026)',
    zh: 'Kitco：利率上行威脅壓制金價反彈（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-wants-rally-threat-higher-interest-rates-holding-it-back-catalyst',
  },
  {
    id: 'kitco-below-4000',
    en: 'Kitco: Gold drops below $4,000 as Hormuz attack lifts oil (30 Oct 2026)',
    zh: 'Kitco：霍爾木茲襲擊推升油價，金價跌破 4,000（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-drops-below-4000-silver-tumbles-hormuz-attack-lifts-oil-prices-kitco',
  },
  {
    id: 'kitco-rotation',
    en: 'Kitco: Energy surges, precious metals tumble — 2026 rotation (30 Oct 2026)',
    zh: 'Kitco：能源上漲、貴金屬下跌 — 2026 輪動（2026-10-30）',
    url: 'https://www.kitco.com/news/article/2026-10-30/energy-surges-precious-metals-tumble-2026-rotation-strengthens',
  },
  {
    id: 'kitco-fed-hike',
    en: 'Kitco: Fed may hike once more in December (29 Oct 2026)',
    zh: 'Kitco：聯準會或於 12 月再升息一次（2026-10-29）',
    url: 'https://www.kitco.com/news/article/2026-10-29/fed-will-hike-once-more-december-slowing-growth-and-falling-energy-ease',
  },
  {
    id: 'kitco-hawkish-pause',
    en: 'Kitco / TDS: Gold stuck as Fed takes hawkish pause (29 Oct 2026)',
    zh: 'Kitco / TDS：聯準會鷹派暫停，金價受困（2026-10-29）',
    url: 'https://www.kitco.com/news/article/2026-10-29/gold-remains-stuck-fed-takes-hawkish-pause-tds-melek',
  },
]

/** Full static catalog used by seed briefings — every row is a clickable deep link. */
export function staticCitationCatalog(lang: AppLang): BriefingCitation[] {
  const zh = lang === 'zh-Hant'
  const rows: BriefingCitation[] = [
    {
      id: 'okx-ticker-api',
      label: zh
        ? 'OKX API：XAU-USDT-SWAP 最新成交價 JSON'
        : 'OKX API: XAU-USDT-SWAP last price JSON',
      url: OKX_TICKER,
      category: 'price_api',
    },
    {
      id: 'okx-funding-api',
      label: zh
        ? 'OKX API：XAU-USDT-SWAP 資金費率 JSON'
        : 'OKX API: XAU-USDT-SWAP funding-rate JSON',
      url: OKX_FUNDING,
      category: 'price_api',
    },
    {
      id: 'bitget-ticker-api',
      label: zh
        ? 'Bitget API：XAUUSDT 永續 ticker JSON'
        : 'Bitget API: XAUUSDT perpetual ticker JSON',
      url: BITGET_TICKER,
      category: 'price_api',
    },
    {
      id: 'gold-api-xau',
      label: zh ? 'gold-api：XAU 現貨美元價 JSON' : 'gold-api: XAU spot USD JSON',
      url: GOLD_API,
      category: 'price_api',
    },
    {
      id: 'yahoo-gc-chart-api',
      label: zh
        ? 'Yahoo chart API：COMEX 黃金 GC=F（1 分鐘×1 日 JSON）'
        : 'Yahoo chart API: COMEX gold GC=F (1m×1d JSON)',
      url: YAHOO_GC_CHART,
      category: 'price_api',
    },
    {
      id: 'okx-trade',
      label: zh ? 'OKX 交易頁：XAU-USDT-SWAP' : 'OKX trade page: XAU-USDT-SWAP',
      url: OKX_TRADE,
      category: 'venue',
    },
    {
      id: 'bitget-trade',
      label: zh ? 'Bitget 合約頁：XAUUSDT' : 'Bitget futures page: XAUUSDT',
      url: BITGET_TRADE,
      category: 'venue',
    },
    {
      id: 'bybit-trade',
      label: zh ? 'Bybit 交易頁：XAUUSDT' : 'Bybit trade page: XAUUSDT',
      url: BYBIT_TRADE,
      category: 'venue',
    },
    {
      id: 'binance-futures',
      label: zh ? 'Binance 合約頁：XAUUSDT' : 'Binance futures page: XAUUSDT',
      url: BINANCE_FUTURES,
      category: 'venue',
    },
    {
      id: 'yahoo-gc-history',
      label: zh
        ? 'Yahoo 歷史頁：COMEX 黃金 GC=F'
        : 'Yahoo history page: COMEX gold GC=F',
      url: YAHOO_GC_PAGE,
      category: 'macro',
    },
    {
      id: 'yahoo-dxy-chart-api',
      label: zh
        ? 'Yahoo chart API：美元指數 DX-Y.NYB（1 分鐘 JSON）'
        : 'Yahoo chart API: Dollar Index DX-Y.NYB (1m JSON)',
      url: YAHOO_DXY_CHART,
      category: 'macro',
    },
    {
      id: 'yahoo-dxy-history',
      label: zh
        ? 'Yahoo 歷史頁：美元指數 DX-Y.NYB'
        : 'Yahoo history page: Dollar Index DX-Y.NYB',
      url: YAHOO_DXY_PAGE,
      category: 'macro',
    },
    {
      id: 'yahoo-tnx-chart-api',
      label: zh
        ? 'Yahoo chart API：美國 10 年期收益率 ^TNX（1 分鐘 JSON）'
        : 'Yahoo chart API: US 10Y yield ^TNX (1m JSON)',
      url: YAHOO_TNX_CHART,
      category: 'macro',
    },
    {
      id: 'yahoo-tnx-history',
      label: zh
        ? 'Yahoo 歷史頁：美國 10 年期收益率 ^TNX'
        : 'Yahoo history page: US 10Y yield ^TNX',
      url: YAHOO_TNX_PAGE,
      category: 'macro',
    },
    {
      id: 'fed-press-json',
      label: zh
        ? '聯準會新聞稿 JSON 索引（ne-press.json）'
        : 'Fed press-release JSON index (ne-press.json)',
      url: FED_PRESS_JSON,
      category: 'macro',
    },
    {
      id: 'fed-fomc',
      label: zh
        ? '聯準會 FOMC 聲明全文（2026-10-28）'
        : 'Federal Reserve FOMC statement full text (28 Oct 2026)',
      url: FED_FOMC_FALLBACK,
      category: 'macro',
    },
  ]

  for (const article of GOLD_NEWS_ARTICLES) {
    rows.push({
      id: article.id,
      label: zh ? article.zh : article.en,
      url: article.url,
      category: 'news',
    })
  }

  return rows
}

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
  const citations = staticCitationCatalog(lang)

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

  const annotate = (id: string, note?: string) => {
    const row = citations.find((c) => c.id === id)
    if (row && note) row.note = note
  }
  annotate('okx-ticker-api', okxNote)
  annotate('bitget-ticker-api', bitgetNote)
  annotate(
    'gold-api-xau',
    spotNote ??
      (spot != null ? `monitor spot=${spot.toFixed(2)}; composite=${composite.toFixed(2)}` : undefined),
  )

  if (fed) {
    const idx = citations.findIndex((c) => c.id === 'fed-fomc')
    if (idx >= 0) {
      citations[idx] = {
        ...fed,
        label: zh ? `聯準會 FOMC 聲明 — ${fed.note ?? fed.label}` : fed.label,
      }
    }
  }

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
        ? '點上方各交易所 API/交易頁與單篇新聞核對；衍生 LP 請以綜合錨點交叉驗證。'
        : 'Open the venue API/trade links and article URLs above to verify; derived LPs should be cross-checked vs anchors.',
    })
  }

  return citations
}

export function citationsToLegacyLines(citations: BriefingCitation[]): string[] {
  return citations.map((c) => `${c.label} — ${c.url}${c.note ? ` (${c.note})` : ''}`)
}
