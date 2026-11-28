import { isZh, type AppLang } from '../i18n/messages'
import { zhField, zhUi } from '../i18n/zh'
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

/** JSON APIs that stay readable under browser CORS — prefer these for “healthy”. */
const JSON_LATENCY_DEGRADED_MS = 6000
/** HTML pages rarely allow CORS; opaque reachability is the expected success path. */
const HTML_LATENCY_DEGRADED_MS = 8000

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

/**
 * Health-panel catalog: CORS-friendly JSON first, plus a slim HTML set
 * (venues / policy / curated Kitco). Drops Yahoo HTML history duplicates.
 */
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

  const seen = new Set<string>()
  const out: ProbeDef[] = []
  for (const d of fromCitations) {
    if (seen.has(d.id) || seen.has(d.url)) continue
    seen.add(d.id)
    seen.add(d.url)
    out.push(d)
  }
  return out
}

function baseResult(
  def: ProbeDef,
  lang: AppLang,
  partial: Pick<InfoSourceProbe, 'status' | 'latencyMs' | 'detail' | 'check' | 'checkedAt'>,
): InfoSourceProbe {
  return {
    id: def.id,
    label: isZh(lang) ? zhField(lang, def.zh, def.en) : def.en,
    url: def.url,
    kind: def.kind,
    check: partial.check,
    status: partial.status,
    latencyMs: partial.latencyMs,
    detail: partial.detail,
    checkedAt: partial.checkedAt,
  }
}

async function probeOne(def: ProbeDef, lang: AppLang): Promise<InfoSourceProbe> {
  const started = performance.now()
  const checkedAt = Date.now()

  // JSON / API: require readable CORS response + parse
  if (def.check === 'json') {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10_000)
      const res = await fetch(def.url, { signal: ctrl.signal, cache: 'no-store', mode: 'cors' })
      clearTimeout(timer)
      const latencyMs = Math.round(performance.now() - started)
      if (!res.ok) {
        // Some CDNs return 403 to bots while the desk URL still opens — try opaque.
        if (res.status === 401 || res.status === 403 || res.status === 429) {
          return probeOpaqueHtml(def, lang, started, checkedAt, `HTTP ${res.status} → opaque`)
        }
        return baseResult(def, lang, {
          check: def.check,
          status: res.status >= 500 ? 'down' : 'degraded',
          latencyMs,
          detail: `HTTP ${res.status}`,
          checkedAt,
        })
      }
      await res.json()
      const slow = latencyMs > JSON_LATENCY_DEGRADED_MS
      return baseResult(def, lang, {
        check: def.check,
        status: slow ? 'degraded' : 'ok',
        latencyMs,
        detail: slow
          ? isZh(lang)
            ? zhUi(lang, `JSON 可讀但偏慢（${latencyMs}ms）`)
            : `JSON readable but slow (${latencyMs}ms)`
          : isZh(lang) ? zhUi(lang, 'JSON 可讀、CORS 正常') : 'JSON readable, CORS ok',
        checkedAt,
      })
    } catch (e) {
      // Yahoo/Fed occasionally trip CORS from some origins — opaque proves host up.
      try {
        return await probeOpaqueHtml(
          def,
          lang,
          started,
          checkedAt,
          e instanceof Error ? e.message : 'cors failed',
        )
      } catch {
        return baseResult(def, lang, {
          check: def.check,
          status: 'down',
          latencyMs: null,
          detail: e instanceof Error ? e.message : 'failed',
          checkedAt,
        })
      }
    }
  }

  // HTML / article / venue pages
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    const res = await fetch(def.url, {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'cors',
      method: 'GET',
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        return probeOpaqueHtml(def, lang, started, checkedAt, `HTTP ${res.status} → opaque`)
      }
      return baseResult(def, lang, {
        check: def.check,
        status: res.status >= 500 ? 'down' : 'degraded',
        latencyMs,
        detail: `HTTP ${res.status}`,
        checkedAt,
      })
    }
    const slow = latencyMs > HTML_LATENCY_DEGRADED_MS
    return baseResult(def, lang, {
      check: def.check,
      status: slow ? 'degraded' : 'ok',
      latencyMs,
      detail: slow
        ? isZh(lang)
          ? zhUi(lang, `HTTP 可讀但偏慢（${latencyMs}ms）`)
          : `HTTP readable but slow (${latencyMs}ms)`
        : isZh(lang) ? zhUi(lang, 'HTTP 可讀') : 'HTTP readable',
      checkedAt,
    })
  } catch {
    return probeOpaqueHtml(def, lang, started, checkedAt)
  }
}

/**
 * News / venue / policy HTML almost never allows CORS in the browser.
 * Opaque success means the URL is reachable — treat as healthy (not degraded).
 */
async function probeOpaqueHtml(
  def: ProbeDef,
  lang: AppLang,
  started: number,
  checkedAt: number,
  prior?: string,
): Promise<InfoSourceProbe> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  try {
    await fetch(def.url, {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'no-cors',
      method: 'GET',
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    return baseResult(def, lang, {
      check: 'cors_opaque',
      status: 'ok',
      latencyMs,
      detail: isZh(lang)
        ? zhUi(lang, `網址可達（瀏覽器 CORS 無法讀正文${prior ? `；${prior}` : ''}）`)
        : `URL reachable (browser CORS cannot read body${prior ? `; ${prior}` : ''})`,
      checkedAt,
    })
  } catch (e) {
    clearTimeout(timer)
    // Venue / news CDNs often block automated browser fetches entirely while
    // still opening fine for operators — don't alarm the health board.
    if (def.kind === 'venue' || def.kind === 'news') {
      return baseResult(def, lang, {
        check: 'cors_opaque',
        status: 'degraded',
        latencyMs: null,
        detail:
          isZh(lang) ? zhUi(lang, '來源已列入目錄；瀏覽器自動化探測被擋，請手動開啟核對') : 'Listed in catalog; browser automation blocked — open manually to verify',
        checkedAt,
      })
    }
    return baseResult(def, lang, {
      check: def.check,
      status: 'down',
      latencyMs: null,
      detail: e instanceof Error ? e.message : 'unreachable',
      checkedAt,
    })
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
    label: isZh(lang) ? zhField(lang, d.zh, d.en) : d.en,
    url: d.url,
    check: d.check,
  }))
}
