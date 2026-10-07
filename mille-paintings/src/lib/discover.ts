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

/** Compact free-text query built from the user's preference chips. */
export function preferenceSearchQuery(prefs: Preferences): string {
  const parts: string[] = []
  for (const g of prefs.genres.slice(0, 4)) {
    parts.push(genreSearchTerms(g)[0] || g)
  }
  for (const c of prefs.countries.slice(0, 3)) {
    parts.push(countrySearchTerms(c)[0] || c)
  }
  for (const e of prefs.eras.slice(0, 2)) {
    parts.push(e.replace(/-/g, ' '))
  }
  for (const m of prefs.moods.slice(0, 2)) {
    parts.push(m)
  }
  if (!parts.length) parts.push('famous oil painting')
  parts.push('painting')
  return [...new Set(parts.map((p) => p.trim()).filter(Boolean))].join(' ')
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
    if (!hit.image_id || !hit.title) continue
    const id = `aic-${hit.id}`
    if (existing.has(id)) continue
    const type = (hit.artwork_type_title || '').toLowerCase()
    if (type && !/paint|scroll|panel|ink|oil|watercolor|tempera|fresco|drawing/.test(type)) {
      continue
    }
    const img = `https://www.artic.edu/iiif/2/${hit.image_id}/full/843,/0/default.jpg`
    const imgFull = `https://www.artic.edu/iiif/2/${hit.image_id}/full/1686,/0/default.jpg`
    out.push({
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
    })
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

async function searchOpenverse(query: string, existing: Set<string>): Promise<Painting[]> {
  const params = new URLSearchParams({
    q: `${query} painting`,
    page_size: '20',
    category: 'digitized_artwork',
    license_type: 'commercial,modification',
  })
  const res = await fetchWithTimeout(
    `https://api.openverse.org/v1/images/?${params}`,
    { headers: { Accept: 'application/json', 'User-Agent': UA } },
    15000,
  )
  if (!res.ok) throw new Error(`Openverse ${res.status}`)
  const data = (await res.json()) as { results?: OpenverseHit[] }
  const out: Painting[] = []
  for (const hit of data.results || []) {
    if (!hit.id || !hit.url || !hit.title) continue
    const id = `ov-${hit.id}`
    if (existing.has(id)) continue
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
      intro: `${hit.title}${hit.creator ? ` — attributed to ${hit.creator}` : ''}. Open-licensed digitized artwork found via Openverse across museums and archives.`,
      genre: tags || 'Painting',
      anecdote: hit.foreign_landing_url
        ? `Original record: ${hit.foreign_landing_url}`
        : 'Sourced through the Openverse open-content image search.',
      painterPhotos: [],
      discovered: true,
    })
  }
  return out
}

async function searchCommons(query: string, existing: Set<string>): Promise<Painting[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: '16',
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
    if (existing.has(id)) continue
    const meta = info.extmetadata || {}
    const artistHtml = meta.Artist?.value || ''
    const artist = artistHtml.replace(/<[^>]+>/g, '').trim() || 'Unknown'
    const desc = (meta.ImageDescription?.value || '').replace(/<[^>]+>/g, '').trim()
    const name = page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '')
    out.push({
      id,
      rank: 0,
      sitelinks: 2,
      name,
      image: info.thumburl || info.url,
      imageFull: info.url,
      painter: artist.slice(0, 120),
      painterId: '',
      painterBirthYear: 'Unknown',
      painterDeathYear: 'Unknown',
      painterCountry: 'Unknown',
      placeOfCreation: 'Unknown',
      collection: 'Wikimedia Commons',
      lostOrDestroyed: false,
      intro:
        desc.slice(0, 600) ||
        `${name} — open media from Wikimedia Commons matching your discovery preferences.`,
      genre: 'Painting',
      anecdote: 'Located via Wikimedia Commons full-text media search.',
      painterPhotos: [],
      discovered: true,
    })
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
      id: 'aic',
      source: 'Art Institute of Chicago',
      status: 'pending',
      detail: 'Museum open collection API',
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
      id: 'commons',
      source: 'Wikimedia Commons',
      status: 'pending',
      detail: 'Open media archive search',
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
      id: 'merge',
      source: 'Merge',
      status: 'pending',
      detail: 'Deduplicate and rank matches',
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
      const found = await search()
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

  // Hit fast museum APIs first so the status UI moves quickly; Wikidata SPARQL can be slower.
  await runSource('aic', 'Art Institute of Chicago', () => searchArtInstitute(query, seen))
  await runSource('va', 'V&A Museum', () => searchVA(query, seen))
  await runSource('openverse', 'Openverse', () => searchOpenverse(query, seen))
  await runSource('commons', 'Wikimedia Commons', () => searchCommons(query, seen))
  await runSource('wikidata', 'Wikidata', () => searchWikidata(prefs, seen, query))

  setStep(
    'merge',
    { status: 'running', detail: t('discoverStepMerging') },
    'merging',
    t('discoverMerging'),
    pool.length,
  )
  const ranked = rankByMood(pool, prefs.moods).slice(0, 40)
  const sourcesHit = steps.filter((s) => s.found > 0 && s.id !== 'merge').length
  setStep(
    'merge',
    {
      status: ranked.length ? 'ok' : 'empty',
      found: ranked.length,
      detail: t('discoverStepMerged', { n: ranked.length, sources: sourcesHit }),
    },
    'done',
    ranked.length
      ? t('discoverDone', { n: ranked.length })
      : t('discoverNone'),
    ranked.length,
  )

  return ranked
}
