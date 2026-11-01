import type { AppLang } from '../i18n/messages'
import type { BriefingCitation, InfoSourceKind, InfoSourceProbe } from '../types'
import { staticCitationCatalog } from './citations'

type ProbeDef = {
  id: string
  kind: InfoSourceKind
  en: string
  zh: string
  url: string
  check: InfoSourceProbe['check']
}

function kindFromCitation(c: BriefingCitation): InfoSourceKind | null {
  if (c.category === 'price_api') return 'price'
  if (c.category === 'venue') return 'venue'
  if (c.category === 'news') return 'news'
  if (c.category === 'macro') {
    if (c.id.startsWith('fed-') || c.url.includes('federalreserve.gov')) return 'policy'
    return 'macro'
  }
  return null
}

function checkForUrl(url: string): InfoSourceProbe['check'] {
  if (
    url.includes('/api/') ||
    url.includes('api.') ||
    url.includes('query1.finance.yahoo.com') ||
    url.endsWith('.json') ||
    url.includes('ne-press.json')
  ) {
    return 'json'
  }
  return 'http'
}

/** Full catalog derived from briefing citations + a few extra health endpoints. */
export function buildProbeDefs(lang: AppLang): ProbeDef[] {
  const fromCitations: ProbeDef[] = staticCitationCatalog(lang)
    .map((c) => {
      const kind = kindFromCitation(c)
      if (!kind) return null
      return {
        id: c.id,
        kind,
        en: c.label,
        zh: c.label,
        url: c.url,
        check: checkForUrl(c.url),
      }
    })
    .filter((d): d is ProbeDef => d != null)

  // Extra health endpoints not always listed as briefing citations
  const extras: ProbeDef[] = [
    {
      id: 'yahoo-dxy-history',
      kind: 'macro',
      en: 'Yahoo history page: Dollar Index DX-Y.NYB',
      zh: 'Yahoo 歷史頁：美元指數 DX-Y.NYB',
      url: 'https://finance.yahoo.com/quote/DX-Y.NYB/history?p=DX-Y.NYB',
      check: 'http',
    },
    {
      id: 'yahoo-tnx-history',
      kind: 'macro',
      en: 'Yahoo history page: US 10Y ^TNX',
      zh: 'Yahoo 歷史頁：美國 10 年期 ^TNX',
      url: 'https://finance.yahoo.com/quote/%5ETNX/history?p=%5ETNX',
      check: 'http',
    },
  ]

  const seen = new Set<string>()
  const out: ProbeDef[] = []
  for (const d of [...fromCitations, ...extras]) {
    if (seen.has(d.id) || seen.has(d.url)) continue
    seen.add(d.id)
    seen.add(d.url)
    out.push(d)
  }
  return out
}

async function probeOne(def: ProbeDef, lang: AppLang): Promise<InfoSourceProbe> {
  const started = performance.now()
  const checkedAt = Date.now()
  const label = lang === 'zh-Hant' ? def.zh : def.en

  // JSON / API: require readable CORS response + parse
  if (def.check === 'json') {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(def.url, { signal: ctrl.signal, cache: 'no-store', mode: 'cors' })
      clearTimeout(timer)
      const latencyMs = Math.round(performance.now() - started)
      if (!res.ok) {
        return {
          id: def.id,
          label,
          url: def.url,
          kind: def.kind,
          check: def.check,
          status: res.status >= 500 ? 'down' : 'degraded',
          latencyMs,
          detail: `HTTP ${res.status}`,
          checkedAt,
        }
      }
      await res.json()
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        check: def.check,
        status: latencyMs > 2500 ? 'degraded' : 'ok',
        latencyMs,
        detail: lang === 'zh-Hant' ? 'JSON 可讀、CORS 正常' : 'JSON readable, CORS ok',
        checkedAt,
      }
    } catch (e) {
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        check: def.check,
        status: 'down',
        latencyMs: null,
        detail: e instanceof Error ? e.message : 'failed',
        checkedAt,
      }
    }
  }

  // HTML / article / venue pages: try CORS; if blocked, opaque no-cors proves network reachability
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(def.url, {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'cors',
      method: 'GET',
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    if (!res.ok) {
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        check: def.check,
        status: res.status >= 500 ? 'down' : 'degraded',
        latencyMs,
        detail: `HTTP ${res.status}`,
        checkedAt,
      }
    }
    return {
      id: def.id,
      label,
      url: def.url,
      kind: def.kind,
      check: def.check,
      status: latencyMs > 3000 ? 'degraded' : 'ok',
      latencyMs,
      detail: lang === 'zh-Hant' ? 'HTTP 可讀' : 'HTTP readable',
      checkedAt,
    }
  } catch {
    // CORS often blocks Kitco/Yahoo/venue HTML — fall back to opaque request
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      await fetch(def.url, {
        signal: ctrl.signal,
        cache: 'no-store',
        mode: 'no-cors',
        method: 'GET',
      })
      clearTimeout(timer)
      const latencyMs = Math.round(performance.now() - started)
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        check: 'cors_opaque',
        status: 'degraded',
        latencyMs,
        detail:
          lang === 'zh-Hant'
            ? '瀏覽器 CORS 擋讀取，但網址可點開（opaque 可達）'
            : 'Browser CORS blocks read; URL still openable (opaque reachable)',
        checkedAt,
      }
    } catch (e) {
      return {
        id: def.id,
        label,
        url: def.url,
        kind: def.kind,
        check: def.check,
        status: 'down',
        latencyMs: null,
        detail: e instanceof Error ? e.message : 'failed',
        checkedAt,
      }
    }
  }
}

export async function probeInfoSources(lang: AppLang): Promise<InfoSourceProbe[]> {
  const defs = buildProbeDefs(lang)
  return Promise.all(defs.map((d) => probeOne(d, lang)))
}

export function probeDefsForLang(lang: AppLang) {
  return buildProbeDefs(lang).map((d) => ({
    id: d.id,
    kind: d.kind,
    label: lang === 'zh-Hant' ? d.zh : d.en,
    url: d.url,
    check: d.check,
  }))
}
