import type { Painting } from '../types'
import {
  countrySearchTerms,
  eraYearRanges,
  genreSearchTerms,
} from './preferenceOptions'
import type { Preferences } from './storage'

const UA = 'MillePaintings/1.0 (educational multi-source discover; +https://hxyan2020.github.io/PRD/mille/)'

export type DiscoverStepStatus = 'pending' | 'running' | 'ok' | 'empty' | 'error' | 'skipped'

export type DiscoverStep = {
  id: string
  source: string
  status: DiscoverStepStatus
  detail: string
  found: number
}

export type DiscoverProgress = {
  steps: DiscoverStep[]
  totalFound: number
  phase: 'preparing' | 'searching' | 'merging' | 'done' | 'error'
  message: string
}

type ProgressFn = (p: DiscoverProgress) => void

/** Optional UI translator so progress strings follow the active language. */
export type DiscoverI18n = (key: string, vars?: Record<string, string | number>) => string

function errDetail(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'Timed out'
  if (err instanceof Error) {
    if (err.name === 'AbortError' || /aborted/i.test(err.message)) return 'Timed out'
    return err.message
  }
  return 'Failed'
}

function commons(filename: string, width = 2400) {
  const base = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`
  return `${base}?width=${width}`
}

function yearOf(time?: string): string {
  if (!time) return 'Unknown'
  const m = time.match(/([+-]?\d{1,4})-/)
  return m ? String(parseInt(m[1], 10)) : 'Unknown'
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function yearFromText(text?: string | null): string {
  if (!text) return 'Unknown'
  const m = text.match(/\b(\d{3,4})\b/)
  return m ? m[1] : 'Unknown'
}

/**
 * Focused free-text query from preference chips.
 * Uses genre + country only (moods/eras are applied later as filters) so
 * museum APIs are not flooded with unrelated Western hits.
 */
export function preferenceSearchQuery(prefs: Preferences): string {
  const parts: string[] = []
  for (const g of prefs.genres.slice(0, 3)) {
    for (const t of genreSearchTerms(g).slice(0, 2)) parts.push(t)
  }
  for (const c of prefs.countries.slice(0, 2)) {
    for (const t of countrySearchTerms(c).slice(0, 2)) parts.push(t)
  }
  const unique = [...new Set(parts.map((p) => p.trim().toLowerCase()).filter(Boolean))]
  if (!unique.length) return 'famous painting'
  // Keep query short — long OR bags return off-topic Western works.
  return `${unique.slice(0, 6).join(' ')} painting`
}

/** Extra museum/Commons queries that stay on-criteria for East Asian prefs. */
function preferenceSearchVariants(prefs: Preferences): string[] {
  const primary = preferenceSearchQuery(prefs)
  const variants = new Set<string>([primary])
  const genres = prefs.genres.map((g) => g.toLowerCase())
  const countries = prefs.countries.map((c) => c.toLowerCase())
  if (genres.some((g) => g.includes('shan shui'))) {
    variants.add('shan shui chinese landscape painting')
    variants.add('shanshui landscape scroll painting')
    variants.add('山水画 chinese landscape')
  }
  if (genres.some((g) => g.includes('chinese painting') || g.includes('ink wash'))) {
    variants.add('chinese ink wash painting scroll')
    variants.add('chinese hanging scroll painting')
  }
  if (genres.some((g) => g.includes('bird-and-flower'))) {
    variants.add('chinese bird and flower painting')
    variants.add('花鸟画 chinese painting')
  }
  if (countries.some((c) => c === 'china' || c.includes('dynasty'))) {
    variants.add('chinese painting museum collection')
  }
  return [...variants].slice(0, 5)
}

const CHINA_IMPLIED_GENRES = [
  'shan shui',
  'chinese painting',
  'literati painting',
  'bird-and-flower painting',
  'ink wash painting',
  'handscroll',
  'hanging scroll',
]

function paintingBlob(p: Painting): string {
  return `${p.name} ${p.painter} ${p.genre} ${p.painterCountry} ${p.placeOfCreation} ${p.collection} ${p.intro} ${p.anecdote}`.toLowerCase()
}

function matchesGenre(p: Painting, genres: string[]): boolean {
  if (!genres.length) return true
  const blob = paintingBlob(p)
  return genres.some((g) => {
    const terms = [g, ...genreSearchTerms(g)].map((t) => t.toLowerCase())
    return terms.some((t) => t && blob.includes(t))
  })
}

function matchesCountry(p: Painting, countries: string[], genres: string[] = []): boolean {
  if (!countries.length) return true
  const blob = paintingBlob(p)
  const direct = countries.some((c) => {
    const terms = [c, ...countrySearchTerms(c)].map((t) => t.toLowerCase())
    return terms.some((t) => t && blob.includes(t))
  })
  if (direct) return true
  // Shan shui / Chinese painting traditions imply China when that country is selected.
  const wantsChina = countries.some((c) => {
    const k = c.toLowerCase()
    return k === 'china' || k.includes('dynasty') || k === 'taiwan'
  })
  if (!wantsChina) return false
  const implied = genres.filter((g) => CHINA_IMPLIED_GENRES.includes(g.toLowerCase()))
  return implied.length > 0 && matchesGenre(p, implied)
}

/** When both genre and country are set, require BOTH (AND). */
export function matchesPreferences(p: Painting, prefs: Preferences): boolean {
  const genreOk = matchesGenre(p, prefs.genres)
  const countryOk = matchesCountry(p, prefs.countries, prefs.genres)
  if (prefs.genres.length && prefs.countries.length) return genreOk && countryOk
  if (prefs.genres.length) return genreOk
  if (prefs.countries.length) return countryOk
  return true
}

/**
 * Fill missing genre/country from title/description so Commons/Openverse
 * hits can pass the AND filter without accepting Western leakage.
 */
function enrichPainting(p: Painting, prefs: Preferences): Painting {
  const blob = paintingBlob(p)
  let genre = p.genre
  let country = p.painterCountry
  const genreUnknown = !genre || genre.toLowerCase() === 'painting' || genre.toLowerCase() === 'unknown'
  const countryUnknown =
    !country || country.toLowerCase() === 'unknown' || country.toLowerCase() === 'unknown / private collection'

  if (genreUnknown) {
    for (const g of prefs.genres) {
      const terms = [g, ...genreSearchTerms(g)].map((t) => t.toLowerCase())
      if (terms.some((t) => t && blob.includes(t))) {
        genre = g
        break
      }
    }
  }
  if (countryUnknown) {
    for (const c of prefs.countries) {
      const terms = [c, ...countrySearchTerms(c)].map((t) => t.toLowerCase())
      if (terms.some((t) => t && blob.includes(t))) {
        country = c
        break
      }
    }
  }
  // Chinese-tradition keywords in sparse Commons metadata → China.
  if (
    (countryUnknown || country.toLowerCase() === 'unknown') &&
    /shan\s*shui|shanshui|chinese|china|山水|文人|花鸟|花鳥|水墨|国画|手卷|立轴|立軸/.test(blob)
  ) {
    country = 'China'
  }
  if (
    (genreUnknown || genre.toLowerCase() === 'painting') &&
    /shan\s*shui|shanshui|山水/.test(blob)
  ) {
    genre = prefs.genres.find((g) => /shan shui/i.test(g)) || 'shan shui'
  }
  return { ...p, genre, painterCountry: country }
}

function preferenceScore(p: Painting, prefs: Preferences): number {
  const blob = paintingBlob(p)
  let score = 0
  for (const g of prefs.genres) {
    for (const t of [g, ...genreSearchTerms(g)]) {
      if (t && blob.includes(t.toLowerCase())) score += 3
    }
  }
  for (const c of prefs.countries) {
    for (const t of [c, ...countrySearchTerms(c)]) {
      if (t && blob.includes(t.toLowerCase())) score += 3
    }
  }
  for (const m of prefs.moods) {
    if (blob.includes(m.toLowerCase())) score += 1
  }
  return score + Math.min(p.sitelinks, 40) / 40
}

/** AIC IIIF is often blocked for hotlinking from GitHub Pages — rescue via Commons. */
function needsImageRescue(url: string): boolean {
  return /artic\.edu\/iiif/i.test(url)
}

async function commonsImageForTitle(
  title: string,
  artist?: string,
): Promise<{ image: string; imageFull: string } | null> {
  const q = [title, artist, 'painting'].filter(Boolean).join(' ').slice(0, 120)
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${q}`,
    gsrlimit: '5',
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '1200',
  })
  try {
    const res = await fetchWithTimeout(
      `https://commons.wikimedia.org/w/api.php?${params}`,
      { headers: { 'User-Agent': UA } },
      10000,
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ url?: string; thumburl?: string }> }> }
    }
    for (const page of Object.values(data.query?.pages || {})) {
      const info = page.imageinfo?.[0]
      const file = page.title?.replace(/^File:/, '')
      if (!file || !info?.url) continue
      // Prefer Commons FilePath (works under referrerPolicy=no-referrer).
      return {
        image: commons(file, 1600),
        imageFull: commons(file, 2400),
      }
    }
  } catch {
    return null
  }
  return null
}

async function ensureDisplayableImage(p: Painting): Promise<Painting | null> {
  if (!p.image && !p.imageFull) return null
  if (!needsImageRescue(p.image) && !needsImageRescue(p.imageFull)) return p
  const rescued = await commonsImageForTitle(p.name, p.painter)
  if (!rescued) return null
  return { ...p, image: rescued.image, imageFull: rescued.imageFull }
}

function expandGenreTerms(genres: string[]): string[] {
  const out = new Set<string>()
  for (const g of genres.slice(0, 8)) {
    for (const t of genreSearchTerms(g)) out.add(esc(t.toLowerCase()))
  }
  return [...out].slice(0, 14)
}

function expandCountryTerms(countries: string[]): string[] {
  const out = new Set<string>()
  for (const c of countries.slice(0, 8)) {
    for (const t of countrySearchTerms(c)) out.add(esc(t.toLowerCase()))
  }
  return [...out].slice(0, 16)
}

function eraBirthFilter(eras: string[]): string {
  if (!eras.length) return ''
  const clauses = eras
    .map((e) => eraYearRanges(e))
    .filter((x): x is [number, number] => Boolean(x))
    .map(([a, b]) => `(YEAR(?birth) >= ${a} && YEAR(?birth) <= ${b})`)
  if (!clauses.length) return ''
  return `OPTIONAL { ?creator wdt:P569 ?birth. } FILTER(${clauses.join(' || ')})`
}

function buildSparql(prefs: Preferences): string {
  const genreTerms = expandGenreTerms(prefs.genres)
  const countryTerms = expandCountryTerms(prefs.countries)

  const genreClause = genreTerms.length
    ? `
      ?painting wdt:P136 ?genre .
      ?genre rdfs:label ?gLabel .
      FILTER(LANG(?gLabel) = "en")
      FILTER(${genreTerms.map((g) => `CONTAINS(LCASE(?gLabel), "${g}")`).join(' || ')})
    `
    : 'OPTIONAL { ?painting wdt:P136 ?genre. }'

  const countryClause = countryTerms.length
    ? `
      ?creator wdt:P27 ?country .
      ?country rdfs:label ?cLabel .
      FILTER(LANG(?cLabel) = "en")
      FILTER(${countryTerms.map((c) => `CONTAINS(LCASE(?cLabel), "${c}")`).join(' || ')})
    `
    : 'OPTIONAL { ?creator wdt:P27 ?country. }'

  const eraClause = eraBirthFilter(prefs.eras)
  const birthOptional = eraClause.includes('P569') ? '' : 'OPTIONAL { ?creator wdt:P569 ?birth. }'
  const minLinks = genreTerms.length || countryTerms.length || prefs.eras.length ? 2 : 6

  return `
    SELECT DISTINCT ?painting ?paintingLabel ?paintingDescription ?image ?creator ?creatorLabel
           ?birth ?death ?countryLabel ?genreLabel ?collectionLabel ?creationPlaceLabel ?sitelinks
    WHERE {
      VALUES ?type { wd:Q3305213 wd:Q134307 wd:Q18573970 wd:Q860861 wd:Q4502142 }
      ?painting wdt:P31/wdt:P279* ?type;
                wikibase:sitelinks ?sitelinks;
                wdt:P18 ?image;
                wdt:P170 ?creator.
      FILTER(?sitelinks >= ${minLinks})
      ${genreClause}
      ${countryClause}
      ${birthOptional}
      ${eraClause}
      OPTIONAL { ?painting wdt:P195 ?collection. }
      OPTIONAL { ?painting wdt:P1071 ?creationPlace. }
      OPTIONAL { ?creator wdt:P570 ?death. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 80
  `
}

type Binding = Record<string, { value: string }>

function rowToPainting(row: Binding, genreFallback?: string): Painting | null {
  const id = row.painting.value.split('/').pop() || ''
  const name = row.paintingLabel?.value
  if (!id || !name || /^Q\d+$/.test(name)) return null
  const imagePath = decodeURIComponent(row.image.value.split('Special:FilePath/')[1] || '')
  if (!imagePath) return null
  return {
    id,
    rank: 0,
    sitelinks: Number(row.sitelinks?.value || 0),
    name,
    image: commons(imagePath, 1600),
    imageFull: commons(imagePath),
    painter: row.creatorLabel?.value || 'Unknown',
    painterId: (row.creator?.value || '').split('/').pop() || '',
    painterBirthYear: yearOf(row.birth?.value),
    painterDeathYear: yearOf(row.death?.value),
    painterCountry: row.countryLabel?.value || 'Unknown',
    placeOfCreation: row.creationPlaceLabel?.value || 'Unknown',
    collection: row.collectionLabel?.value || 'Unknown / private collection',
    lostOrDestroyed: false,
    intro:
      row.paintingDescription?.value ||
      `${name} is a work by ${row.creatorLabel?.value || 'an artist'}, discovered via Wikidata for your Mille preferences.`,
    genre: row.genreLabel?.value || genreFallback || 'Painting',
    anecdote: `${row.creatorLabel?.value || 'This painter'} remains part of the living conversation of art history.`,
    painterPhotos: [],
    discovered: true,
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 18000,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function runSparql(query: string): Promise<Binding[]> {
  const url =
    'https://query.wikidata.org/sparql?' + new URLSearchParams({ format: 'json', query })
  const res = await fetchWithTimeout(
    url,
    {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
    },
    20000,
  )
  if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status}`)
  const data = (await res.json()) as { results: { bindings: Binding[] } }
  return data.results.bindings
}

/** Faster SPARQL: direct painting instance, no subclass walk. */
function buildSparqlFast(prefs: Preferences): string {
  const genreTerms = expandGenreTerms(prefs.genres).slice(0, 8)
  const genreClause = genreTerms.length
    ? `
      ?painting wdt:P136 ?genre .
      ?genre rdfs:label ?gLabel .
      FILTER(LANG(?gLabel) = "en")
      FILTER(${genreTerms.map((g) => `CONTAINS(LCASE(?gLabel), "${g}")`).join(' || ')})
    `
    : 'OPTIONAL { ?painting wdt:P136 ?genre. }'
  return `
    SELECT DISTINCT ?painting ?paintingLabel ?paintingDescription ?image ?creator ?creatorLabel
           ?birth ?death ?countryLabel ?genreLabel ?collectionLabel ?creationPlaceLabel ?sitelinks
    WHERE {
      ?painting wdt:P31 wd:Q3305213;
                wikibase:sitelinks ?sitelinks;
                wdt:P18 ?image;
                wdt:P170 ?creator.
      FILTER(?sitelinks >= 3)
      ${genreClause}
      OPTIONAL { ?creator wdt:P27 ?country. }
      OPTIONAL { ?creator wdt:P569 ?birth. }
      OPTIONAL { ?creator wdt:P570 ?death. }
      OPTIONAL { ?painting wdt:P195 ?collection. }
      OPTIONAL { ?painting wdt:P1071 ?creationPlace. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 40
  `
}

async function searchWikidataText(query: string, existing: Set<string>): Promise<Painting[]> {
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    format: 'json',
    origin: '*',
    language: 'en',
    uselang: 'en',
    type: 'item',
    limit: '12',
    search: query.slice(0, 80),
  })
  const res = await fetchWithTimeout(
    `https://www.wikidata.org/w/api.php?${params}`,
    { headers: { 'User-Agent': UA } },
    12000,
  )
  if (!res.ok) throw new Error(`Wikidata search ${res.status}`)
  const data = (await res.json()) as {
    search?: Array<{ id: string; label?: string; description?: string }>
  }
  const ids = (data.search || []).map((s) => s.id).filter(Boolean).slice(0, 10)
  if (!ids.length) return []

  const entParams = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    origin: '*',
    ids: ids.join('|'),
    props: 'labels|descriptions|claims',
    languages: 'en',
  })
  const entRes = await fetchWithTimeout(
    `https://www.wikidata.org/w/api.php?${entParams}`,
    { headers: { 'User-Agent': UA } },
    12000,
  )
  if (!entRes.ok) throw new Error(`Wikidata entities ${entRes.status}`)
  const entData = (await entRes.json()) as {
    entities?: Record<
      string,
      {
        labels?: Record<string, { value: string }>
        descriptions?: Record<string, { value: string }>
        claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: string | { id?: string } } } }>>
      }
    >
  }

  const out: Painting[] = []
  for (const [id, ent] of Object.entries(entData.entities || {})) {
    if (existing.has(id) || id.startsWith('-')) continue
    const name = ent.labels?.en?.value
    if (!name) continue
    const imageClaim = ent.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (typeof imageClaim !== 'string' || !imageClaim) continue
    const creatorId =
      typeof ent.claims?.P170?.[0]?.mainsnak?.datavalue?.value === 'object'
        ? ent.claims?.P170?.[0]?.mainsnak?.datavalue?.value?.id
        : undefined
    out.push({
      id,
      rank: 0,
      sitelinks: 5,
      name,
      image: commons(imageClaim, 1600),
      imageFull: commons(imageClaim),
      painter: creatorId || 'Unknown',
      painterId: creatorId || '',
      painterBirthYear: 'Unknown',
      painterDeathYear: 'Unknown',
      painterCountry: 'Unknown',
      placeOfCreation: 'Unknown',
      collection: 'Wikidata',
      lostOrDestroyed: false,
      intro:
        ent.descriptions?.en?.value ||
        `${name} — found via Wikidata entity search for your preferences.`,
      genre: 'Painting',
      anecdote: 'Discovered through the Wikidata search API.',
      painterPhotos: [],
      discovered: true,
    })
  }
  return out
}

async function searchWikidata(
  prefs: Preferences,
  existing: Set<string>,
  query: string,
): Promise<Painting[]> {
  const out: Painting[] = []
  const pushRows = (bindings: Binding[]) => {
    for (const row of bindings) {
      const p = rowToPainting(row, prefs.genres[0])
      if (!p || existing.has(p.id) || out.some((x) => x.id === p.id)) continue
      out.push(p)
    }
  }

  try {
    pushRows(await runSparql(buildSparqlFast(prefs)))
  } catch {
    // fall through to full / text search
  }

  if (out.length < 6) {
    try {
      pushRows(await runSparql(buildSparql({ ...prefs, countries: [], eras: [] })))
    } catch {
      // ignore — text search next
    }
  }

  if (out.length < 4) {
    const textHits = await searchWikidataText(query, existing)
    for (const p of textHits) {
      if (existing.has(p.id) || out.some((x) => x.id === p.id)) continue
      out.push(p)
    }
  }

  return out
}

type AicHit = {
  id: number
  title?: string
  artist_title?: string | null
  image_id?: string | null
  date_display?: string | null
  place_of_origin?: string | null
  artwork_type_title?: string | null
  department_title?: string | null
  medium_display?: string | null
}

async function searchArtInstitute(query: string, existing: Set<string>): Promise<Painting[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '24',
    fields:
      'id,title,artist_title,image_id,date_display,place_of_origin,artwork_type_title,department_title,medium_display',
  })
  // Prefer paintings when the API understands the filter.
  const url = `https://api.artic.edu/api/v1/artworks/search?${params}&query[term][artwork_type_id]=1`
  let res = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } }, 15000)
  if (!res.ok) {
    res = await fetchWithTimeout(
      `https://api.artic.edu/api/v1/artworks/search?${params}`,
      { headers: { 'User-Agent': UA } },
      15000,
    )
  }
  if (!res.ok) throw new Error(`Art Institute ${res.status}`)
  const data = (await res.json()) as { data?: AicHit[] }
  const out: Painting[] = []
  for (const hit of data.data || []) {
    if (!hit.title) continue
    const id = `aic-${hit.id}`
    if (existing.has(id)) continue
    const type = (hit.artwork_type_title || '').toLowerCase()
    if (type && !/paint|scroll|panel|ink|oil|watercolor|tempera|fresco|drawing/.test(type)) {
      continue
    }
    // AIC IIIF is often blocked off-site — prefer Commons rescue for a displayable URL.
    const rescued = await commonsImageForTitle(hit.title, hit.artist_title || undefined)
    if (!rescued && !hit.image_id) continue
    const img = rescued?.image || `https://www.artic.edu/iiif/2/${hit.image_id}/full/843,/0/default.jpg`
    const imgFull = rescued?.imageFull || `https://www.artic.edu/iiif/2/${hit.image_id}/full/1686,/0/default.jpg`
    const candidate: Painting = {
      id,
      rank: 0,
      sitelinks: 4,
      name: hit.title,
      image: img,
      imageFull: imgFull,
      painter: hit.artist_title || 'Unknown',
      painterId: '',
      painterBirthYear: yearFromText(hit.date_display),
      painterDeathYear: 'Unknown',
      painterCountry: hit.place_of_origin || 'Unknown',
      placeOfCreation: hit.place_of_origin || 'Unknown',
      collection: 'Art Institute of Chicago',
      lostOrDestroyed: false,
      intro: `${hit.title}${hit.artist_title ? ` by ${hit.artist_title}` : ''}${
        hit.date_display ? ` (${hit.date_display})` : ''
      }. Discovered from the Art Institute of Chicago open collection for your preferences.`,
      genre: hit.artwork_type_title || hit.medium_display || 'Painting',
      anecdote: hit.department_title
        ? `Held in the Art Institute of Chicago’s ${hit.department_title}.`
        : 'Sourced from the Art Institute of Chicago open API.',
      painterPhotos: [],
      discovered: true,
    }
    const displayable = await ensureDisplayableImage(candidate)
    if (displayable) out.push(displayable)
  }
  return out
}

type VaRecord = {
  systemNumber?: string
  objectType?: string
  _primaryTitle?: string
  _primaryMaker?: { name?: string; association?: string }
  _primaryDate?: string
  _primaryPlace?: string
  _images?: { _iiif_image_base_url?: string; _primary_thumbnail?: string }
}

async function searchVA(query: string, existing: Set<string>): Promise<Painting[]> {
  const params = new URLSearchParams({
    q: query,
    q_object_type: 'Painting',
    images_exist: 'true',
    page_size: '24',
  })
  const res = await fetchWithTimeout(
    `https://api.vam.ac.uk/v2/objects/search?${params}`,
    { headers: { Accept: 'application/json', 'User-Agent': UA } },
    15000,
  )
  if (!res.ok) throw new Error(`V&A ${res.status}`)
  const data = (await res.json()) as { records?: VaRecord[] }
  const out: Painting[] = []
  for (const rec of data.records || []) {
    const type = (rec.objectType || '').toLowerCase()
    if (type && !/paint|oil|watercolor|watercolour|tempera|scroll|panel|drawing|print/.test(type)) {
      continue
    }
    const base = rec._images?._iiif_image_base_url
    if (!base || !rec.systemNumber || !rec._primaryTitle) continue
    const id = `va-${rec.systemNumber}`
    if (existing.has(id)) continue
    const image = `${base}full/!800,800/0/default.jpg`
    const imageFull = `${base}full/!1600,1600/0/default.jpg`
    out.push({
      id,
      rank: 0,
      sitelinks: 3,
      name: rec._primaryTitle,
      image,
      imageFull,
      painter: rec._primaryMaker?.name || 'Unknown',
      painterId: '',
      painterBirthYear: yearFromText(rec._primaryDate),
      painterDeathYear: 'Unknown',
      painterCountry: rec._primaryPlace || 'Unknown',
      placeOfCreation: rec._primaryPlace || 'Unknown',
      collection: 'Victoria and Albert Museum',
      lostOrDestroyed: false,
      intro: `${rec._primaryTitle}${
        rec._primaryMaker?.name ? ` by ${rec._primaryMaker.name}` : ''
      }${rec._primaryDate ? ` (${rec._primaryDate})` : ''}. Discovered from the V&A Collections API for your preferences.`,
      genre: rec.objectType || 'Painting',
      anecdote: 'Sourced from the Victoria and Albert Museum open collections search.',
      painterPhotos: [],
      discovered: true,
    })
  }
  return out
}

type OpenverseHit = {
  id: string
  title?: string
  url?: string
  foreign_landing_url?: string
  creator?: string | null
  source?: string
  provider?: string
  category?: string
  tags?: Array<{ name?: string }>
}

async function searchOpenverse(
  query: string,
  existing: Set<string>,
  prefs: Preferences,
): Promise<Painting[]> {
  const out: Painting[] = []
  const seenLocal = new Set<string>()
  for (const q of preferenceSearchVariants(prefs).slice(0, 3)) {
    const params = new URLSearchParams({
      q: q.includes('painting') ? q : `${q} painting`,
      page_size: '16',
      category: 'digitized_artwork',
      license_type: 'commercial,modification',
    })
    let res: Response
    try {
      res = await fetchWithTimeout(
        `https://api.openverse.org/v1/images/?${params}`,
        { headers: { Accept: 'application/json', 'User-Agent': UA } },
        15000,
      )
    } catch {
      continue
    }
    if (!res.ok) continue
    const data = (await res.json()) as { results?: OpenverseHit[] }
    for (const hit of data.results || []) {
      if (!hit.id || !hit.url || !hit.title) continue
      const id = `ov-${hit.id}`
      if (existing.has(id) || seenLocal.has(id)) continue
      seenLocal.add(id)
      const tags = (hit.tags || []).map((t) => t.name).filter(Boolean).join(', ')
      const provider = hit.provider || hit.source || 'Openverse'
      out.push({
        id,
        rank: 0,
        sitelinks: 2,
        name: hit.title,
        image: hit.url,
        imageFull: hit.url,
        painter: hit.creator || 'Unknown',
        painterId: '',
        painterBirthYear: 'Unknown',
        painterDeathYear: 'Unknown',
        painterCountry: 'Unknown',
        placeOfCreation: 'Unknown',
        collection: `${provider} (via Openverse)`,
        lostOrDestroyed: false,
        intro: `${hit.title}${hit.creator ? ` — attributed to ${hit.creator}` : ''}. ${tags}. Open-licensed digitized artwork found via Openverse.`,
        genre: tags || 'Painting',
        anecdote: hit.foreign_landing_url
          ? `Original record: ${hit.foreign_landing_url}`
          : 'Sourced through the Openverse open-content image search.',
        painterPhotos: [],
        discovered: true,
      })
    }
    if (out.length >= 20) break
  }
  if (!out.length && query) {
    // fallback single query already covered by variants; keep signature used
  }
  return out
}

async function searchCommonsOnce(
  query: string,
  existing: Set<string>,
  seenLocal: Set<string>,
): Promise<Painting[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: '20',
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1200',
  })
  const res = await fetchWithTimeout(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { headers: { 'User-Agent': UA } },
    15000,
  )
  if (!res.ok) throw new Error(`Commons ${res.status}`)
  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid: number
          title?: string
          imageinfo?: Array<{
            url?: string
            thumburl?: string
            extmetadata?: Record<string, { value?: string }>
          }>
        }
      >
    }
  }
  const out: Painting[] = []
  for (const page of Object.values(data.query?.pages || {})) {
    const info = page.imageinfo?.[0]
    if (!info?.url || !page.title) continue
    const id = `commons-${page.pageid}`
    if (existing.has(id) || seenLocal.has(id)) continue
    seenLocal.add(id)
    const meta = info.extmetadata || {}
    const artistHtml = meta.Artist?.value || ''
    const artist = artistHtml.replace(/<[^>]+>/g, '').trim() || 'Unknown'
    const desc = (meta.ImageDescription?.value || '').replace(/<[^>]+>/g, '').trim()
    const categories = (meta.Categories?.value || '').replace(/<[^>]+>/g, ' ')
    const file = page.title.replace(/^File:/, '')
    const name = file.replace(/\.[^.]+$/, '')
    const blob = `${name} ${desc} ${categories} ${artist}`.toLowerCase()
    // Drop tourist photos / hotels that match “shan shui” as a place name.
    if (
      /panoramio|resort|hotel|spa|restaurant|selfie|wedding|logo|map of|street view|flickr/.test(
        blob,
      )
    ) {
      continue
    }
    // Prefer painting-like media when the filename/description gives a signal.
    const looksPainted =
      /paint|painting|scroll|ink|watercolor|watercolour|oil on|canvas|album leaf|hanging|handscroll|山水|水墨|国画|画|畫|painter|artist/.test(
        blob,
      )
    if (!looksPainted && !/shan\s*shui|shanshui|chinese landscape/.test(blob)) {
      continue
    }
    // Prefer direct upload.wikimedia.org URLs (less redirect/rate-limit than FilePath).
    // Keep FilePath as imageFull alternate for SafeImage fallback.
    const direct = info.thumburl || info.url
    out.push({
      id,
      rank: 0,
      sitelinks: looksPainted ? 3 : 2,
      name,
      image: direct || commons(file, 1600),
      imageFull: info.url || commons(file, 2400),
      painter: artist.slice(0, 120),
      painterId: '',
      painterBirthYear: 'Unknown',
      painterDeathYear: 'Unknown',
      painterCountry: 'Unknown',
      placeOfCreation: 'Unknown',
      collection: 'Wikimedia Commons',
      lostOrDestroyed: false,
      intro:
        `${desc} ${categories}`.trim().slice(0, 600) ||
        `${name} — open media from Wikimedia Commons matching your discovery preferences.`,
      genre: 'Painting',
      anecdote: 'Located via Wikimedia Commons full-text media search.',
      painterPhotos: [],
      discovered: true,
    })
  }
  return out
}

async function searchCommons(
  query: string,
  existing: Set<string>,
  prefs: Preferences,
): Promise<Painting[]> {
  const seenLocal = new Set<string>()
  const out: Painting[] = []
  for (const q of preferenceSearchVariants(prefs)) {
    try {
      const batch = await searchCommonsOnce(q, existing, seenLocal)
      out.push(...batch)
    } catch {
      // try remaining variants
    }
    if (out.length >= 28) break
  }
  if (!out.length) {
    return searchCommonsOnce(query, existing, seenLocal)
  }
  return out
}

type MetSearch = { objectIDs?: number[] | null }

async function searchMet(query: string, existing: Set<string>): Promise<Painting[]> {
  // Met retired /v1/search on 2026-10-01 — use Elastic-backed v1.1.
  const params = new URLSearchParams({
    q: query,
    hasImages: 'true',
  })
  const res = await fetchWithTimeout(
    `https://collectionapi.metmuseum.org/public/collection/v1.1/search?${params}`,
    { headers: { 'User-Agent': UA } },
    12000,
  )
  if (!res.ok) throw new Error(`Met ${res.status}`)
  const data = (await res.json()) as MetSearch
  const ids = (data.objectIDs || []).slice(0, 16)
  const out: Painting[] = []
  for (const objectID of ids) {
    const id = `met-${objectID}`
    if (existing.has(id) || out.some((x) => x.id === id)) continue
    try {
      const objRes = await fetchWithTimeout(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`,
        { headers: { 'User-Agent': UA } },
        8000,
      )
      if (!objRes.ok) continue
      const obj = (await objRes.json()) as {
        title?: string
        artistDisplayName?: string
        primaryImage?: string
        primaryImageSmall?: string
        objectDate?: string
        culture?: string
        country?: string
        medium?: string
        classification?: string
        department?: string
        objectURL?: string
      }
      const image = obj.primaryImageSmall || obj.primaryImage
      if (!image || !obj.title) continue
      const cultureBlob = `${obj.culture || ''} ${obj.country || ''} ${obj.department || ''}`.toLowerCase()
      out.push({
        id,
        rank: 0,
        sitelinks: 5,
        name: obj.title,
        image,
        imageFull: obj.primaryImage || image,
        painter: obj.artistDisplayName || 'Unknown',
        painterId: '',
        painterBirthYear: yearFromText(obj.objectDate),
        painterDeathYear: 'Unknown',
        painterCountry: obj.country || obj.culture || 'Unknown',
        placeOfCreation: obj.country || obj.culture || 'Unknown',
        collection: 'The Metropolitan Museum of Art',
        lostOrDestroyed: false,
        intro: `${obj.title}${obj.artistDisplayName ? ` by ${obj.artistDisplayName}` : ''}${
          obj.objectDate ? ` (${obj.objectDate})` : ''
        }. ${obj.medium || obj.classification || 'Painting'} from the Met open collection.`,
        genre: obj.classification || obj.medium || 'Painting',
        anecdote: cultureBlob
          ? `Met culture/department: ${obj.culture || obj.department || 'collection'}.`
          : obj.objectURL || 'Sourced from the Metropolitan Museum of Art open access API.',
        painterPhotos: [],
        discovered: true,
      })
    } catch {
      // skip object
    }
  }
  return out
}

function rankByMood(list: Painting[], moods: string[]): Painting[] {
  if (!moods.length) return list
  const moodMap: Record<string, string[]> = {
    contemplative: ['landscape', 'still', 'quiet', 'seascape', 'shan shui', 'ink', 'bamboo'],
    dramatic: ['history', 'battle', 'myth', 'religious', 'mural', 'storm'],
    intimate: ['portrait', 'genre', 'domestic', 'interior', 'miniature', 'self'],
    epic: ['history', 'allegory', 'religious', 'monument', 'mural', 'battle'],
  }
  return list
    .map((p) => {
      const blob = `${p.genre} ${p.intro} ${p.name}`.toLowerCase()
      const hit = moods.some((m) => (moodMap[m] || []).some((w) => blob.includes(w)))
      return { p, hit }
    })
    .sort((a, b) => Number(b.hit) - Number(a.hit) || b.p.sitelinks - a.p.sitelinks)
    .map((x) => x.p)
}

function makeSteps(): DiscoverStep[] {
  return [
    {
      id: 'prepare',
      source: 'Preferences',
      status: 'pending',
      detail: 'Building search terms from your selections',
      found: 0,
    },
    {
      id: 'wikidata',
      source: 'Wikidata',
      status: 'pending',
      detail: 'Structured painting graph + entity search',
      found: 0,
    },
    {
      id: 'commons',
      source: 'Wikimedia Commons',
      status: 'pending',
      detail: 'Open media archive search',
      found: 0,
    },
    {
      id: 'va',
      source: 'V&A Museum',
      status: 'pending',
      detail: 'Victoria and Albert Collections API',
      found: 0,
    },
    {
      id: 'openverse',
      source: 'Openverse',
      status: 'pending',
      detail: 'Open-licensed digitized artworks',
      found: 0,
    },
    {
      id: 'met',
      source: 'The Met',
      status: 'pending',
      detail: 'Metropolitan Museum open access API',
      found: 0,
    },
    {
      id: 'aic',
      source: 'Art Institute of Chicago',
      status: 'pending',
      detail: 'Museum API (images via Commons when needed)',
      found: 0,
    },
    {
      id: 'merge',
      source: 'Merge',
      status: 'pending',
      detail: 'Filter to matching prefs, dedupe, rank',
      found: 0,
    },
  ]
}

/**
 * Multi-source discovery: Wikidata + Art Institute of Chicago + V&A + Openverse + Commons.
 * Reports realtime step progress via onProgress.
 */
export async function discoverPaintings(
  prefs: Preferences,
  existingIds: Set<string>,
  onProgress?: ProgressFn,
  t: DiscoverI18n = (_key, vars) => {
    if (vars && 'source' in vars) return `Searching ${vars.source}…`
    if (vars && 'n' in vars) return `Found ${vars.n}`
    return ''
  },
): Promise<Painting[]> {
  const steps = makeSteps()
  const emit = (phase: DiscoverProgress['phase'], message: string, totalFound: number) => {
    onProgress?.({ steps: steps.map((s) => ({ ...s })), totalFound, phase, message })
  }

  const setStep = (
    id: string,
    patch: Partial<DiscoverStep>,
    phase: DiscoverProgress['phase'],
    message: string,
    totalFound: number,
  ) => {
    const step = steps.find((s) => s.id === id)
    if (step) Object.assign(step, patch)
    emit(phase, message, totalFound)
  }

  const seen = new Set(existingIds)
  const pool: Painting[] = []
  const addAll = (items: Painting[]) => {
    let n = 0
    for (const p of items) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      pool.push(p)
      n++
    }
    return n
  }

  const query = preferenceSearchQuery(prefs)
  setStep(
    'prepare',
    { status: 'running', detail: t('discoverStepQuery', { q: query.slice(0, 120) }) },
    'preparing',
    t('discoverPreparing', { q: query.slice(0, 80) }),
    0,
  )
  await new Promise((r) => setTimeout(r, 120))
  setStep(
    'prepare',
    {
      status: 'ok',
      detail: t('discoverStepReady', {
        genres: prefs.genres.length,
        countries: prefs.countries.length,
        eras: prefs.eras.length,
      }),
    },
    'searching',
    t('discoverSearchingApis'),
    0,
  )

  const runSource = async (
    id: string,
    sourceLabel: string,
    search: () => Promise<Painting[]>,
  ) => {
    setStep(
      id,
      { status: 'running', detail: t('discoverStepRunning', { source: sourceLabel }) },
      'searching',
      t('discoverSearchingSource', { source: sourceLabel }),
      pool.length,
    )
    try {
      const found = (await search())
        .map((p) => enrichPainting(p, prefs))
        .filter((p) => matchesPreferences(p, prefs))
      const n = addAll(found)
      setStep(
        id,
        {
          status: n ? 'ok' : 'empty',
          found: n,
          detail: n ? t('discoverStepAdded', { n, source: sourceLabel }) : t('discoverStepEmpty', { source: sourceLabel }),
        },
        'searching',
        t('discoverSourceCount', { source: sourceLabel, n }),
        pool.length,
      )
    } catch (err) {
      setStep(
        id,
        { status: 'error', detail: errDetail(err) },
        'searching',
        t('discoverSourceSkipped', { source: sourceLabel }),
        pool.length,
      )
    }
  }

  // Prefer Commons/Met (reliable hotlink images), then other museums.
  await runSource('wikidata', 'Wikidata', () => searchWikidata(prefs, seen, query))
  await runSource('commons', 'Wikimedia Commons', () => searchCommons(query, seen, prefs))
  await runSource('met', 'The Met', () => searchMet(query, seen))
  await runSource('va', 'V&A Museum', () => searchVA(query, seen))
  await runSource('openverse', 'Openverse', () => searchOpenverse(query, seen, prefs))
  await runSource('aic', 'Art Institute of Chicago', () => searchArtInstitute(query, seen))

  setStep(
    'merge',
    { status: 'running', detail: t('discoverStepMerging') },
    'merging',
    t('discoverMerging'),
    pool.length,
  )

  // Strict preference filter: genre AND country when both are selected.
  const matched = pool.filter((p) => matchesPreferences(p, prefs))
  const ranked = rankByMood(matched, prefs.moods)
    .map((p) => ({ p, score: preferenceScore(p, prefs) }))
    .sort((a, b) => b.score - a.score || b.p.sitelinks - a.p.sitelinks)
    .map((x) => x.p)
    .slice(0, 40)

  const sourcesHit = steps.filter((s) => s.found > 0 && s.id !== 'merge' && s.id !== 'prepare').length
  setStep(
    'merge',
    {
      status: ranked.length ? 'ok' : 'empty',
      found: ranked.length,
      detail: t('discoverStepMerged', {
        n: ranked.length,
        sources: sourcesHit,
      }),
    },
    'done',
    ranked.length
      ? t('discoverDone', { n: ranked.length })
      : t('discoverNone'),
    ranked.length,
  )

  return ranked
}
