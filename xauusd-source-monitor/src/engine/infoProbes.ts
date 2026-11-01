import type { AppLang } from '../i18n/messages'
import type { InfoSourceProbe } from '../types'

type ProbeDef = {
  id: string
  kind: InfoSourceProbe['kind']
  en: string
  zh: string
  url: string
  /** Prefer GET JSON parse when true */
  json?: boolean
}

const DEFS: ProbeDef[] = [
  {
    id: 'okx-ticker',
    kind: 'price',
    en: 'OKX XAU-USDT-SWAP ticker API',
    zh: 'OKX XAU-USDT-SWAP ticker API',
    url: 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP',
    json: true,
  },
  {
    id: 'okx-funding',
    kind: 'price',
    en: 'OKX XAU-USDT-SWAP funding-rate API',
    zh: 'OKX XAU-USDT-SWAP 資金費率 API',
    url: 'https://www.okx.com/api/v5/public/funding-rate?instId=XAU-USDT-SWAP',
    json: true,
  },
  {
    id: 'bitget-ticker',
    kind: 'price',
    en: 'Bitget XAUUSDT mix ticker API',
    zh: 'Bitget XAUUSDT 合約 ticker API',
    url: 'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT',
    json: true,
  },
  {
    id: 'gold-api',
    kind: 'price',
    en: 'gold-api XAU spot USD',
    zh: 'gold-api XAU 現貨美元',
    url: 'https://api.gold-api.com/price/XAU',
    json: true,
  },
  {
    id: 'yahoo-gc-chart',
    kind: 'price',
    en: 'Yahoo chart API GC=F 1m JSON',
    zh: 'Yahoo chart API GC=F 1 分鐘 JSON',
    url: 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d',
    json: true,
  },
  {
    id: 'yahoo-gc-history',
    kind: 'macro',
    en: 'Yahoo history page: COMEX GC=F',
    zh: 'Yahoo 歷史頁：COMEX GC=F',
    url: 'https://finance.yahoo.com/quote/GC%3DF/history?p=GC%3DF',
  },
  {
    id: 'yahoo-dxy-chart',
    kind: 'macro',
    en: 'Yahoo chart API DX-Y.NYB 1m JSON',
    zh: 'Yahoo chart API 美元指數 1 分鐘 JSON',
    url: 'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1m&range=1d',
    json: true,
  },
  {
    id: 'yahoo-tnx-chart',
    kind: 'macro',
    en: 'Yahoo chart API ^TNX 1m JSON',
    zh: 'Yahoo chart API ^TNX 1 分鐘 JSON',
    url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1m&range=1d',
    json: true,
  },
  {
    id: 'fed-press-json',
    kind: 'policy',
    en: 'Fed press release JSON feed',
    zh: '聯準會新聞稿 JSON',
    url: 'https://www.federalreserve.gov/json/ne-press.json',
    json: true,
  },
  {
    id: 'fed-fomc',
    kind: 'policy',
    en: 'Fed FOMC statement (28 Oct 2026)',
    zh: '聯準會 FOMC 聲明（2026-10-28）',
    url: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm',
  },
  {
    id: 'kitco-plunge',
    kind: 'news',
    en: 'Kitco article: gold plunge below $3,900',
    zh: 'Kitco 文章：金價跌破 3,900',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-prices-plunge-one-year-low-below-3900-higher-oil-prices-fuel-fears',
  },
  {
    id: 'kitco-pm',
    kind: 'news',
    en: 'Kitco PM: liquidation selloff',
    zh: 'Kitco 午後：清算拋售',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-falls-below-3900-silver-tumbles-wall-street-selloff-triggers',
  },
  {
    id: 'kitco-survey',
    kind: 'news',
    en: 'Kitco survey: Wall Street turns bearish',
    zh: 'Kitco 調查：華爾街轉空',
    url: 'https://www.kitco.com/news/article/2026-10-30/wall-street-abandons-ship-after-gold-sinks-below-3900oz-main-street',
  },
  {
    id: 'kitco-paradox',
    kind: 'news',
    en: "Kitco: gold's frustrating paradox",
    zh: 'Kitco：金價令人挫敗的悖論',
    url: 'https://www.kitco.com/news/article/2026-10-30/golds-frustrating-paradox-falling-yields-and-weaker-dollar-cant-stop',
  },
  {
    id: 'kitco-capitulation',
    kind: 'news',
    en: 'Kitco: gold & silver near capitulation',
    zh: 'Kitco：金銀逼近投降價位',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-and-silver-prices-coming-dangerously-close-capitulation-levels-jesse',
  },
  {
    id: 'kitco-below-4000',
    kind: 'news',
    en: 'Kitco: gold drops below $4,000',
    zh: 'Kitco：金價跌破 4,000',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-drops-below-4000-silver-tumbles-hormuz-attack-lifts-oil-prices-kitco',
  },
  {
    id: 'kitco-hawkish-pause',
    kind: 'news',
    en: 'Kitco / TDS: hawkish Fed pause',
    zh: 'Kitco / TDS：聯準會鷹派暫停',
    url: 'https://www.kitco.com/news/article/2026-10-29/gold-remains-stuck-fed-takes-hawkish-pause-tds-melek',
  },
]

async function probeOne(def: ProbeDef, lang: AppLang): Promise<InfoSourceProbe> {
  const started = performance.now()
  const checkedAt = Date.now()
  const label = lang === 'zh-Hant' ? def.zh : def.en
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(def.url, {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'cors',
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    if (!res.ok) {
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        status: res.status >= 500 ? 'down' : 'degraded',
        latencyMs,
        detail: `HTTP ${res.status}`,
        checkedAt,
      }
    }
    if (def.json) {
      const json = await res.json()
      const detail = typeof json === 'object' ? 'JSON ok' : 'ok'
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        status: latencyMs > 2500 ? 'degraded' : 'ok',
        latencyMs,
        detail,
        checkedAt,
      }
    }
    return {
      id: def.id,
      label,
      url: def.url,
      kind: def.kind,
      status: latencyMs > 3000 ? 'degraded' : 'ok',
      latencyMs,
      detail: `HTTP ${res.status}`,
      checkedAt,
    }
  } catch (e) {
    return {
      id: def.id,
      label,
      url: def.url,
      kind: def.kind,
      status: 'down',
      latencyMs: null,
      detail: e instanceof Error ? e.message : 'failed',
      checkedAt,
    }
  }
}

export async function probeInfoSources(lang: AppLang): Promise<InfoSourceProbe[]> {
  return Promise.all(DEFS.map((d) => probeOne(d, lang)))
}

export function probeDefsForLang(lang: AppLang) {
  return DEFS.map((d) => ({
    id: d.id,
    kind: d.kind,
    label: lang === 'zh-Hant' ? d.zh : d.en,
    url: d.url,
  }))
}
