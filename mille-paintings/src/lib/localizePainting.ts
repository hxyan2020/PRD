import type { Painting } from '../types'
import { optionLabel, optionLabels } from './optionLabels'
import { mintLangFor, wikiLangFor, wikiSitelinkKey } from './wikiLang'

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
/** Machine-translated intro/anecdote snippets (uiLang + source text). */
const mintCache = new Map<string, string>()

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

/** True when text is a thin attribution stub rather than a real description. */
export function isThinDescription(text: string, minLen = 160): boolean {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return true
  // Wikipedia exchars truncates with "..." — that is not a stub when the body is already long.
  const truncated = t.endsWith('…') || t.endsWith('...')
  if (truncated && t.length < Math.min(minLen, 200)) return true
  if (t.length < minLen) return true
  if (
    /^(painting|oil painting|portrait painting|artwork|work)\b.*\bby\b/i.test(t) &&
    t.length < 280
  ) {
    return true
  }
  const sentences = (t.match(/[.!?]/g) || []).length
  if (/\bpainting by\b/i.test(t) && sentences <= 1 && t.length < 220) {
    return true
  }
  return false
}

function pickRicherText(
  current: string,
  candidate: string,
  minLen = 160,
  opts?: { preferCandidate?: boolean },
): string {
  const next = (candidate || '').replace(/\s+/g, ' ').trim()
  if (!next) return current
  // UI-language Wikipedia leads win whenever they are not a stub.
  if (opts?.preferCandidate && next.length >= Math.min(120, minLen) && !isThinDescription(next, Math.min(120, minLen))) {
    return next
  }
  if (isThinDescription(next, minLen) && !isThinDescription(current, minLen)) return current
  if (next.length > (current || '').length) return next
  if (isThinDescription(current, minLen) && !isThinDescription(next, minLen)) return next
  return current
}

function cleanWikiExtract(raw: string): string {
  return (raw || '')
    .replace(/\s*==+\s*[^=]+?\s*==+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function chunkForMint(text: string, maxLen = 700): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= maxLen) return [clean]
  const parts: string[] = []
  let rest = clean
  while (rest.length > maxLen) {
    const window = rest.slice(0, maxLen)
    const breakAt = Math.max(window.lastIndexOf('. '), window.lastIndexOf('。'), window.lastIndexOf('! '), window.lastIndexOf('? '))
    const idx = breakAt > maxLen * 0.4 ? breakAt + 1 : window.lastIndexOf(' ')
    const cut = idx > maxLen * 0.3 ? idx : maxLen
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/** True when translated text uses the expected script for the UI language. */
export function textMatchesUiLang(text: string, uiLang: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  const mint = mintLangFor(uiLang)
  if (!mint) return true
  if (mint === 'zh' || mint === 'ja') return /[\u3400-\u9fff]/.test(t)
  if (mint === 'ko') return /[\uac00-\ud7af]/.test(t)
  if (mint === 'ar' || mint === 'fa' || mint === 'ur') return /[\u0600-\u06ff]/.test(t)
  if (mint === 'he') return /[\u0590-\u05ff]/.test(t)
  if (mint === 'ru' || mint === 'uk') return /[\u0400-\u04ff]/.test(t)
  if (mint === 'el') return /[\u0370-\u03ff]/.test(t)
  if (mint === 'th') return /[\u0e00-\u0e7f]/.test(t)
  if (mint === 'hi') return /[\u0900-\u097f]/.test(t)
  if (mint === 'bn') return /[\u0980-\u09ff]/.test(t)
  // Latin-script locales: reject untranslated English catalogue phrasing.
  // (Titles may stay English even in a good translation.)
  if (/\boil-on-canvas painting (created|executed)\b/i.test(t) || /\bis an oil-on-canvas\b/i.test(t)) {
    return false
  }
  return true
}

async function translateChunk(chunk: string, target: string): Promise<string> {
  const body = JSON.stringify({
    html: `<p>${chunk.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
  })
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://cxserver.wikimedia.org/v2/translate/en/${target}/MinT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      if (!res.ok) return ''
      const data = (await res.json()) as { contents?: string }
      return stripHtml(data.contents || '')
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  return ''
}

/**
 * Translate catalogue English via Wikimedia MinT (cxserver) when no UI-language
 * Wikipedia page exists. Returns '' on failure (failures are not cached).
 */
async function translateViaMint(text: string, uiLang: string): Promise<string> {
  const target = mintLangFor(uiLang)
  if (!target || !text.trim()) return ''
  const cacheKey = `${target}:${text}`
  const hit = mintCache.get(cacheKey)
  if (hit) return hit

  const chunks = chunkForMint(text)
  // Parallelize chunks — sequential MinT made painting pages look untranslated.
  const parts = await Promise.all(chunks.map((chunk) => translateChunk(chunk, target)))
  if (parts.some((p) => !p)) return ''
  const out = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (!out) return ''
  mintCache.set(cacheKey, out)
  return out
}

async function fetchWikiExtract(
  wiki: string,
  title: string,
  variant?: string,
): Promise<string> {
  const base = {
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'extracts',
    explaintext: '1',
    redirects: '1',
    titles: title,
  } as const

  const pull = async (extra: Record<string, string>) => {
    const params = new URLSearchParams({ ...base, ...extra })
    if (variant) params.set('variant', variant)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`https://${wiki}.wikipedia.org/w/api.php?${params}`)
        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) {
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
            continue
          }
          return ''
        }
        const data = (await res.json()) as {
          query?: { pages?: Record<string, { extract?: string; missing?: boolean }> }
        }
        for (const page of Object.values(data.query?.pages || {})) {
          if (page.missing) continue
          const extract = cleanWikiExtract(page.extract || '')
          if (extract && !/may refer to:/i.test(extract)) return extract
        }
        return ''
      } catch {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
    return ''
  }

  // Lead first; if thin, pull a longer plain-text window (one page only).
  let extract = await pull({ exintro: '1' })
  if (isThinDescription(extract, 280)) {
    const longer = await pull({ exchars: '1800' })
    if (longer.length > extract.length) extract = longer
  }
  return extract
}

export type LocalizeProgress = (partial: LocalizedPainting) => void

/**
 * Localize painting display fields for the active UI language.
 * Falls back to the English dataset values when a translation is missing.
 * Calls `onPartial` after the intro is ready so the about section can update
 * before the slower painter-bio translation finishes.
 */
export async function localizePainting(
  painting: Painting,
  uiLang: string,
  onPartial?: LocalizeProgress,
): Promise<LocalizedPainting> {
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

    let intro = painting.intro
    let anecdote = painting.anecdote
    let introFromUiWiki = false
    let anecdoteFromUiWiki = false

    // Prefer a non-stub UI-language Wikipedia extract. Only fall back to English /
    // catalogue / Wikidata descriptions when the target-language page is missing.
    const targetPaintingTitle = paintingEnt?.sitelinks?.[wikiSitelinkKey(target.wiki)]?.title
    if (targetPaintingTitle) {
      const extract = await fetchWikiExtract(target.wiki, targetPaintingTitle, target.variant)
      // Accept UI-language leads even when shorter than the English catalogue —
      // never let truncated wiki ellipsis cause an English overwrite later.
      if (extract.length >= 80 && !isThinDescription(extract, 80)) {
        intro = extract
        introFromUiWiki = true
      }
    }
    if (!introFromUiWiki && isThinDescription(intro, 120)) {
      const enTitle = paintingEnt?.sitelinks?.enwiki?.title
      if (enTitle && target.wiki !== 'en') {
        const enExtract = await fetchWikiExtract('en', enTitle)
        intro = pickRicherText(intro, enExtract, 160)
      }
      if (isThinDescription(intro, 120) && paintingEnt?.descriptions) {
        const desc = pickLabel(
          { labels: paintingEnt.descriptions as Record<string, { value: string }> },
          target.labelLangs,
          '',
        )
        if (desc) intro = pickRicherText(intro, desc, 40)
      }
    }
    // Optimized English catalogue intros: machine-translate when no UI wiki page.
    if (!introFromUiWiki) {
      const minted = await translateViaMint(intro, uiLang)
      if (minted.length >= 80 && textMatchesUiLang(minted, uiLang)) intro = minted
    }

    const withIntro: LocalizedPainting = {
      ...painting,
      name,
      painter,
      genre,
      painterCountry,
      placeOfCreation,
      collection,
      intro,
      anecdote: painting.anecdote,
      localized: true,
    }
    // Publish intro ASAP so “关于这幅画” is not stuck on English while the bio loads.
    onPartial?.(withIntro)

    const targetPainterTitle = painterEnt?.sitelinks?.[wikiSitelinkKey(target.wiki)]?.title
    if (targetPainterTitle) {
      const extract = await fetchWikiExtract(target.wiki, targetPainterTitle, target.variant)
      if (extract.length >= 80 && !isThinDescription(extract, 80)) {
        anecdote = extract
        anecdoteFromUiWiki = true
      }
    }
    if (!anecdoteFromUiWiki && isThinDescription(anecdote, 120)) {
      const enTitle = painterEnt?.sitelinks?.enwiki?.title
      if (enTitle && target.wiki !== 'en') {
        const enExtract = await fetchWikiExtract('en', enTitle)
        anecdote = pickRicherText(anecdote, enExtract, 120)
      }
    }
    if (!anecdoteFromUiWiki) {
      const minted = await translateViaMint(anecdote, uiLang)
      if (minted.length >= 60 && textMatchesUiLang(minted, uiLang)) anecdote = minted
    }

    const localized: LocalizedPainting = {
      ...withIntro,
      anecdote,
      localized: true,
    }
    // Only cache when the about text actually matches the UI language (or wiki provided it).
    const introOk = introFromUiWiki || textMatchesUiLang(localized.intro, uiLang)
    if (introOk) cache.set(cacheKey, localized)
    return localized
  } catch {
    // Do not cache failures — a transient MinT/Wikidata error would otherwise
    // pin the English catalogue text for the rest of the session.
    return { ...painting, localized: false }
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
  mintCache.clear()
}
