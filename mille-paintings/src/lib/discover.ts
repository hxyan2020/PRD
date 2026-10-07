import type { Painting } from '../types'
import {
  countrySearchTerms,
  eraYearRanges,
  genreSearchTerms,
} from './preferenceOptions'
import type { Preferences } from './storage'

const UA_NOTE = 'MillePaintings/1.0 (educational gallery discover)'

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

/** Map preference eras to birth-year ranges for SPARQL. */
function eraBirthFilter(eras: string[]): string {
  if (!eras.length) return ''
  const clauses = eras
    .map((e) => eraYearRanges(e))
    .filter((x): x is [number, number] => Boolean(x))
    .map(([a, b]) => `(YEAR(?birth) >= ${a} && YEAR(?birth) <= ${b})`)
  if (!clauses.length) return ''
  return `OPTIONAL { ?creator wdt:P569 ?birth. } FILTER(${clauses.join(' || ')})`
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

function buildQuery(prefs: Preferences): string {
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

  // Slightly looser when many filters are set so we still find candidates.
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
    LIMIT 140
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
      `${name} is a work by ${row.creatorLabel?.value || 'an artist'}, added to your Mille pool from your preferences.`,
    genre: row.genreLabel?.value || genreFallback || 'Painting',
    anecdote: `${row.creatorLabel?.value || 'This painter'} remains part of the living conversation of art history.`,
    painterPhotos: [],
    discovered: true,
  }
}

async function runSparql(query: string): Promise<Binding[]> {
  const url =
    'https://query.wikidata.org/sparql?' + new URLSearchParams({ format: 'json', query })
  const res = await fetch(url, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA_NOTE },
  })
  if (!res.ok) throw new Error(`Wikidata ${res.status}`)
  const data = (await res.json()) as { results: { bindings: Binding[] } }
  return data.results.bindings
}

/**
 * Discover additional paintings matching preferences and return only new IDs.
 * Falls back to a broader query if the tight preference query returns nothing.
 */
export async function discoverPaintings(
  prefs: Preferences,
  existingIds: Set<string>,
): Promise<Painting[]> {
  let bindings = await runSparql(buildQuery(prefs))

  // Fallback: drop country filter if too strict
  if (bindings.length < 8 && (prefs.countries.length || prefs.eras.length)) {
    const looser: Preferences = { ...prefs, countries: [], eras: prefs.eras }
    bindings = await runSparql(buildQuery(looser))
  }
  if (bindings.length < 5) {
    const broad: Preferences = { genres: prefs.genres.slice(0, 2), countries: [], eras: [], moods: [] }
    bindings = await runSparql(buildQuery(broad))
  }

  const byId = new Map<string, Painting>()
  for (const row of bindings) {
    const painting = rowToPainting(row, prefs.genres[0])
    if (!painting || existingIds.has(painting.id) || byId.has(painting.id)) continue
    byId.set(painting.id, painting)
  }

  // Light client-side mood ranking so mood prefs still matter without SPARQL complexity.
  let list = [...byId.values()]
  if (prefs.moods.length) {
    const moodMap: Record<string, string[]> = {
      contemplative: ['landscape', 'still', 'quiet', 'seascape', 'shan shui', 'ink'],
      dramatic: ['history', 'battle', 'myth', 'religious', 'mural'],
      intimate: ['portrait', 'genre', 'domestic', 'interior', 'miniature'],
      epic: ['history', 'allegory', 'religious', 'monument', 'mural'],
    }
    list = list
      .map((p) => {
        const blob = `${p.genre} ${p.intro}`.toLowerCase()
        const hit = prefs.moods.some((m) => (moodMap[m] || []).some((w) => blob.includes(w)))
        return { p, hit }
      })
      .sort((a, b) => Number(b.hit) - Number(a.hit) || b.p.sitelinks - a.p.sitelinks)
      .map((x) => x.p)
  }

  return list.slice(0, 40)
}
