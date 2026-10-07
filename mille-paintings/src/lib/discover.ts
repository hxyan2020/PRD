import type { Painting } from '../types'
import type { Preferences } from './storage'

const UA_NOTE = 'MillePaintings discover'

function commons(filename: string, width?: number) {
  const base = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`
  return width ? `${base}?width=${width}` : base
}

function yearOf(time?: string): string {
  if (!time) return 'Unknown'
  const m = time.match(/([+-]?\d{1,4})-/)
  return m ? String(parseInt(m[1], 10)) : 'Unknown'
}

export async function discoverPaintings(prefs: Preferences, existingIds: Set<string>): Promise<Painting[]> {
  const genreFilter = prefs.genres[0]
  const countryFilter = prefs.countries[0]

  // Build a lightweight SPARQL query biased by prefs.
  const genreClause = genreFilter
    ? `?painting wdt:P136 ?genre. ?genre rdfs:label ?gLabel. FILTER(CONTAINS(LCASE(?gLabel), "${genreFilter.toLowerCase()}")).`
    : ''
  const countryClause = countryFilter
    ? `?creator wdt:P27 ?country. ?country rdfs:label ?cLabel. FILTER(CONTAINS(LCASE(?cLabel), "${countryFilter.toLowerCase()}")).`
    : ''

  const query = `
    SELECT DISTINCT ?painting ?paintingLabel ?paintingDescription ?image ?creator ?creatorLabel
           ?birth ?death ?countryLabel ?genreLabel ?collectionLabel ?creationPlaceLabel ?sitelinks
    WHERE {
      ?painting wdt:P31 wd:Q3305213;
                wikibase:sitelinks ?sitelinks;
                wdt:P18 ?image;
                wdt:P170 ?creator.
      FILTER(?sitelinks >= 4)
      ${genreClause}
      ${countryClause}
      OPTIONAL { ?painting wdt:P136 ?genre. }
      OPTIONAL { ?painting wdt:P195 ?collection. }
      OPTIONAL { ?painting wdt:P1071 ?creationPlace. }
      OPTIONAL { ?creator wdt:P569 ?birth. }
      OPTIONAL { ?creator wdt:P570 ?death. }
      OPTIONAL { ?creator wdt:P27 ?country. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 80
  `

  const url =
    'https://query.wikidata.org/sparql?' +
    new URLSearchParams({ format: 'json', query })

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA_NOTE },
  })
  if (!res.ok) throw new Error(`Wikidata ${res.status}`)
  const data = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] }
  }

  const byId = new Map<string, Painting>()
  for (const row of data.results.bindings) {
    const id = row.painting.value.split('/').pop() || ''
    if (!id || existingIds.has(id) || byId.has(id)) continue
    const name = row.paintingLabel?.value
    if (!name || /^Q\d+$/.test(name)) continue
    const imagePath = decodeURIComponent(row.image.value.split('Special:FilePath/')[1] || '')
    byId.set(id, {
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
        `${name} is a work by ${row.creatorLabel?.value || 'an artist'}.`,
      genre: row.genreLabel?.value || genreFilter || 'Painting',
      anecdote: `${row.creatorLabel?.value || 'This painter'} remains part of the living conversation of art history.`,
      painterPhotos: [],
    })
  }

  return [...byId.values()].slice(0, 40)
}
