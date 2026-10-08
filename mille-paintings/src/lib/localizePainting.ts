import type { Painting } from '../types'
import { optionLabel, optionLabels } from './optionLabels'
import { wikiLangFor, wikiSitelinkKey } from './wikiLang'

export type LocalizedPainting = Painting & {
  /** True when at least one field was replaced from Wikidata/Wikipedia. */
  localized: boolean
}

type WdEntity = {
  id?: string
  labels?: Record<string, { value: string }>
  descriptions?: Record<string, { value: string }>
  sitelinks?: Record<string, { title: string }>
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>>
}

const cache = new Map<string, LocalizedPainting>()
/** Labels-only cache for gallery/list cards (no Wikipedia extracts). */
const labelCache = new Map<string, LocalizedPainting>()

function pickLabel(entity: WdEntity | undefined, langs: string[], fallback: string): string {
  if (!entity?.labels) return fallback
  for (const lang of langs) {
    const hit = entity.labels[lang]?.value
    if (hit) return hit
  }
  // languagefallback may put the resolved label under another key
  const first = Object.values(entity.labels)[0]?.value
  return first || fallback
}

function claimIds(entity: WdEntity | undefined, prop: string): string[] {
  const claims = entity?.claims?.[prop] || []
  const ids: string[] = []
  for (const c of claims) {
    const id = c.mainsnak?.datavalue?.value?.id
    if (id) ids.push(id)
  }
  return ids
}

async function fetchEntities(
  ids: string[],
  langs: string[],
  props = 'labels|descriptions|claims|sitelinks',
): Promise<Record<string, WdEntity>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return {}
  const out: Record<string, WdEntity> = {}
  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40)
    const params = new URLSearchParams({
      action: 'wbgetentities',
      format: 'json',
      origin: '*',
      ids: chunk.join('|'),
      props,
      languages: langs.join('|'),
      languagefallback: '1',
    })
    const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`)
    if (!res.ok) throw new Error(`Wikidata ${res.status}`)
    const data = (await res.json()) as { entities?: Record<string, WdEntity> }
    Object.assign(out, data.entities || {})
  }
  return out
}

/** Instant locale polish for genre strings without network. Country stays English for flag lookup. */
export function withStaticLabels(painting: Painting, uiLang: string): LocalizedPainting {
  if (!uiLang || uiLang === 'en') return { ...painting, localized: false }
  return {
    ...painting,
    genre: optionLabels(uiLang, painting.genre),
    localized: false,
  }
}

async function fetchWikiExtract(
  wiki: string,
  title: string,
  variant?: string,
): Promise<string> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    redirects: '1',
    titles: title,
  })
  if (variant) params.set('variant', variant)
  const res = await fetch(`https://${wiki}.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) return ''
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { extract?: string; missing?: boolean }> }
  }
  for (const page of Object.values(data.query?.pages || {})) {
    if (page.missing) continue
    const extract = (page.extract || '').replace(/\s+/g, ' ').trim()
    if (extract && !/may refer to:/i.test(extract)) return extract
  }
  return ''
}

/**
 * Localize painting display fields for the active UI language.
 * Falls back to the English dataset values when a translation is missing.
 */
export async function localizePainting(painting: Painting, uiLang: string): Promise<LocalizedPainting> {
  if (!uiLang || uiLang === 'en') {
    return { ...painting, localized: false }
  }

  const cacheKey = `${uiLang}:${painting.id}`
  const hit = cache.get(cacheKey)
  if (hit) return hit

  const target = wikiLangFor(uiLang)
  const langs = [...new Set([...target.labelLangs, 'en'])]

  try {
    const baseIds = [painting.id, painting.painterId].filter(Boolean)
    const entities = await fetchEntities(baseIds, langs)
    const paintingEnt = entities[painting.id]
    const painterEnt = painting.painterId ? entities[painting.painterId] : undefined

    const relatedIds = [
      ...claimIds(paintingEnt, 'P136'), // genre
      ...claimIds(paintingEnt, 'P195'), // collection
      ...claimIds(paintingEnt, 'P1071'), // place of creation
      ...claimIds(painterEnt, 'P27'), // country of citizenship
    ]
    const related = relatedIds.length ? await fetchEntities(relatedIds, langs) : {}

    const name = pickLabel(paintingEnt, target.labelLangs, painting.name)
    const painter = pickLabel(painterEnt, target.labelLangs, painting.painter)

    const genreFallback = optionLabels(uiLang, painting.genre)
    const countryFallback = optionLabel(uiLang, painting.painterCountry)

    const genreId = claimIds(paintingEnt, 'P136')[0]
    const genre = genreId
      ? pickLabel(related[genreId], target.labelLangs, genreFallback)
      : genreFallback

    const countryId = claimIds(painterEnt, 'P27')[0]
    const painterCountry = countryId
      ? pickLabel(related[countryId], target.labelLangs, countryFallback)
      : countryFallback

    const placeId = claimIds(paintingEnt, 'P1071')[0]
    const placeOfCreation = placeId
      ? pickLabel(related[placeId], target.labelLangs, painting.placeOfCreation)
      : painting.placeOfCreation

    const collectionId = claimIds(paintingEnt, 'P195')[0]
    const collection = collectionId
      ? pickLabel(related[collectionId], target.labelLangs, painting.collection)
      : painting.collection

    const siteKey = wikiSitelinkKey(target.wiki)
    const paintingTitle = paintingEnt?.sitelinks?.[siteKey]?.title
    const painterTitle = painterEnt?.sitelinks?.[siteKey]?.title

    let intro = painting.intro
    let anecdote = painting.anecdote
    if (paintingTitle) {
      const extract = await fetchWikiExtract(target.wiki, paintingTitle, target.variant)
      if (extract) intro = extract
    } else if (paintingEnt?.descriptions) {
      const desc = pickLabel(
        { labels: paintingEnt.descriptions as Record<string, { value: string }> },
        target.labelLangs,
        '',
      )
      if (desc) intro = desc
    }
    if (painterTitle) {
      const extract = await fetchWikiExtract(target.wiki, painterTitle, target.variant)
      if (extract) anecdote = extract
    }

    const localized: LocalizedPainting = {
      ...painting,
      name,
      painter,
      genre,
      painterCountry,
      placeOfCreation,
      collection,
      intro,
      anecdote,
      localized: true,
    }
    cache.set(cacheKey, localized)
    return localized
  } catch {
    const fallback = { ...painting, localized: false }
    cache.set(cacheKey, fallback)
    return fallback
  }
}

/**
 * Batch-localize card fields (name, painter, genre, country) for gallery/home lists.
 * Skips Wikipedia extracts so large grids stay responsive.
 */
export async function localizePaintingLabelsBatch(
  paintings: Painting[],
  uiLang: string,
): Promise<LocalizedPainting[]> {
  if (!paintings.length) return []
  if (!uiLang || uiLang === 'en') {
    return paintings.map((p) => ({ ...p, localized: false }))
  }

  const target = wikiLangFor(uiLang)
  const langs = [...new Set([...target.labelLangs, 'en'])]
  const result = new Map<string, LocalizedPainting>()
  const missing: Painting[] = []

  for (const p of paintings) {
    const key = `${uiLang}:${p.id}`
    const full = cache.get(key)
    if (full) {
      result.set(p.id, full)
      continue
    }
    const labels = labelCache.get(key)
    if (labels) {
      result.set(p.id, labels)
      continue
    }
    missing.push(p)
    result.set(p.id, withStaticLabels(p, uiLang))
  }

  if (!missing.length) {
    return paintings.map((p) => result.get(p.id) || withStaticLabels(p, uiLang))
  }

  try {
    const baseIds = missing.flatMap((p) => [p.id, p.painterId].filter(Boolean))
    const entities = await fetchEntities(baseIds, langs, 'labels|claims')

    const relatedIds: string[] = []
    for (const p of missing) {
      const paintingEnt = entities[p.id]
      relatedIds.push(...claimIds(paintingEnt, 'P136').slice(0, 2))
    }
    const related = relatedIds.length
      ? await fetchEntities(relatedIds, langs, 'labels')
      : {}

    for (const p of missing) {
      const paintingEnt = entities[p.id]
      const painterEnt = p.painterId ? entities[p.painterId] : undefined
      const genreId = claimIds(paintingEnt, 'P136')[0]
      const genreFallback = optionLabels(uiLang, p.genre)
      // Keep painterCountry in English so CountryFlags can resolve; cards display via optionLabel.

      const localized: LocalizedPainting = {
        ...p,
        name: pickLabel(paintingEnt, target.labelLangs, p.name),
        painter: pickLabel(painterEnt, target.labelLangs, p.painter),
        genre: genreId
          ? pickLabel(related[genreId], target.labelLangs, genreFallback)
          : genreFallback,
        localized: true,
      }
      labelCache.set(`${uiLang}:${p.id}`, localized)
      result.set(p.id, localized)
    }
  } catch {
    // Keep static label fallbacks already placed in result.
  }

  return paintings.map((p) => result.get(p.id) || withStaticLabels(p, uiLang))
}

export function clearLocalizationCache() {
  cache.clear()
  labelCache.clear()
}
