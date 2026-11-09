import { staticCitationCatalog } from '../../engine/citations'
import type { AppLang } from '../../i18n/messages'
import type { CopilotSettings } from '../types'

export type ExternalPage = { label: string; url: string; kind: 'curated' | 'search' }

/** Venue / docs deep links keyed by alert tokens — concrete UI pages, not homepages. */
const VENUE_PAGES: { test: RegExp; labelZh: string; labelEn: string; url: string }[] = [
  {
    test: /BYBIT_INDEX|bybit/i,
    labelZh: 'Bybit 交易页：XAUUSDT 永续',
    labelEn: 'Bybit trade page: XAUUSDT perpetual',
    url: 'https://www.bybit.com/trade/usdt/XAUUSDT',
  },
  {
    test: /BYBIT_INDEX|bybit.*index|index.?price/i,
    labelZh: 'Bybit 帮助中心：指数价格说明',
    labelEn: 'Bybit Help: Index Price introduction',
    url: 'https://www.bybit.com/en/help-center/article/Introduction-to-Index-Price',
  },
  {
    test: /BYBIT_INDEX|bybit/i,
    labelZh: 'Bybit 公告/指数价格信息页',
    labelEn: 'Bybit index-price information page',
    url: 'https://www.bybit.com/en/announcement-info/index-price',
  },
  {
    test: /OKX_INDEX|\bokx\b/i,
    labelZh: 'OKX 交易页：XAU-USDT-SWAP',
    labelEn: 'OKX trade page: XAU-USDT-SWAP',
    url: 'https://www.okx.com/trade-swap/xau-usdt-swap',
  },
  {
    test: /bitget/i,
    labelZh: 'Bitget 合约页：XAUUSDT',
    labelEn: 'Bitget futures page: XAUUSDT',
    url: 'https://www.bitget.com/futures/usdt/XAUUSDT',
  },
  {
    test: /binance/i,
    labelZh: 'Binance 合约页：XAUUSDT',
    labelEn: 'Binance futures page: XAUUSDT',
    url: 'https://www.binance.com/en/futures/XAUUSDT',
  },
  {
    test: /kitco|华尔街|抛售|gold.?price|金价/i,
    labelZh: 'Kitco 金价新闻（示例深链）',
    labelEn: 'Kitco gold news (deep link example)',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-falls-below-3900-silver-tumbles-wall-street-selloff-triggers',
  },
  {
    test: /联准会|fed|fomc|升息|利率/i,
    labelZh: '联准会新闻稿 JSON 索引',
    labelEn: 'Federal Reserve press releases JSON index',
    url: 'https://www.federalreserve.gov/json/ne-press.json',
  },
  {
    test: /COMEX|GC=F|黄金期货/i,
    labelZh: 'Yahoo 历史页：COMEX 黄金 GC=F',
    labelEn: 'Yahoo history: COMEX gold GC=F',
    url: 'https://finance.yahoo.com/quote/GC%3DF/history?p=GC%3DF',
  },
]

/** Curated pages from alert keywords + static monitor catalog (always available offline). */
export function resolveCuratedExternalPages(
  alertText: string,
  lang: AppLang = 'zh-Hant',
): ExternalPage[] {
  const zh = lang === 'zh-Hant'
  const out: ExternalPage[] = []
  const seen = new Set<string>()
  const push = (label: string, url: string, kind: ExternalPage['kind'] = 'curated') => {
    const u = url.trim()
    if (!u || seen.has(u)) return
    seen.add(u)
    out.push({ label, url: u, kind })
  }

  for (const row of VENUE_PAGES) {
    if (row.test.test(alertText)) {
      push(zh ? row.labelZh : row.labelEn, row.url)
    }
  }

  // Pull a few matching catalog rows (APIs / venue pages already used by Market Condition)
  const catalog = staticCitationCatalog(lang)
  const t = alertText.toLowerCase()
  for (const c of catalog) {
    const id = c.id.toLowerCase()
    const label = c.label.toLowerCase()
    const hit =
      (/bybit/.test(t) && /bybit/.test(id + label)) ||
      (/okx/.test(t) && /okx/.test(id + label)) ||
      (/bitget/.test(t) && /bitget/.test(id + label)) ||
      (/binance/.test(t) && /binance/.test(id + label)) ||
      (/xau|gold|黄金|指數|指数/.test(t) && (c.category === 'price_api' || c.category === 'venue'))
    if (hit) push(c.label, c.url)
  }

  return out.slice(0, 10)
}

function searchQueryFromAlert(alertText: string): string {
  const venue = alertText.match(/BYBIT_INDEX|OKX_INDEX|BINANCE_INDEX|BITGET_INDEX/i)?.[0]
  const asset = alertText.match(/XAU[_\s-]?USD|XAUUSD/i)?.[0] || 'XAUUSD'
  const event =
    alertText.match(/指数源变更剔除|指数源变更恢复|线性过渡|source removal|source recovery|linear transition/i)?.[0] ||
    'index price source'
  return [asset, venue, event, 'perpetual index price'].filter(Boolean).join(' ')
}

/**
 * Live web search via same-origin `/api/web-search` (Brave/Serper if configured, else DuckDuckGo).
 * Falls back to curated pages only when the API is unavailable.
 */
export async function fetchExternalPagesForAlert(args: {
  alertText: string
  settings: CopilotSettings
  lang?: AppLang
}): Promise<ExternalPage[]> {
  const lang = args.lang === 'en' ? 'en' : 'zh-Hant'
  const curated = resolveCuratedExternalPages(args.alertText, lang)
  const q = searchQueryFromAlert(args.alertText)
  const bases = [
    args.settings.proxyBase.replace(/\/$/, ''),
    typeof window !== 'undefined' ? '' : '',
  ].filter((b, i, arr) => arr.indexOf(b) === i)

  for (const base of bases) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (args.settings.deskToken?.trim()) {
        headers['X-Desk-Token'] = args.settings.deskToken.trim()
      }
      const res = await fetch(`${base}/api/web-search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: q, lang, limit: 6 }),
      })
      if (!res.ok) continue
      const data = (await res.json()) as {
        results?: { title?: string; url?: string }[]
      }
      const searched: ExternalPage[] = []
      for (const r of data.results || []) {
        const url = (r.url || '').trim()
        if (!url.startsWith('http')) continue
        searched.push({
          label: (r.title || url).slice(0, 120),
          url,
          kind: 'search',
        })
      }
      // Prefer search hits first, then curated fill
      const merged: ExternalPage[] = []
      const seen = new Set<string>()
      for (const row of [...searched, ...curated]) {
        if (seen.has(row.url)) continue
        seen.add(row.url)
        merged.push(row)
      }
      return merged.slice(0, 12)
    } catch {
      /* try next base */
    }
  }
  return curated
}
