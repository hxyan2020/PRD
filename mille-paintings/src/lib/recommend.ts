import type { Painting } from '../types'
import { countrySearchTerms, eraYearRanges, genreSearchTerms } from './preferenceOptions'
import { getCollectedIds, getPreferences, getViewedIds, todayKey, type Preferences } from './storage'

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function erasForYear(year: number): string[] {
  const hits: string[] = []
  for (const era of [
    'ancient',
    'classical-antiquity',
    'medieval',
    'islamic-golden-age',
    'song-yuan',
    'ming-qing',
    'edo-period',
    'mughal-era',
    'renaissance',
    'baroque',
    'neoclassical-romantic',
    'impressionist-era',
    'modern',
    'contemporary',
  ]) {
    const range = eraYearRanges(era)
    if (range && year >= range[0] && year <= range[1]) hits.push(era)
  }
  return hits
}

function matchesGenre(paintingGenre: string, selected: string[]): boolean {
  const g = paintingGenre.toLowerCase()
  return selected.some((x) => {
    const terms = genreSearchTerms(x)
    return terms.some((t) => g.includes(t.toLowerCase()) || t.toLowerCase().includes(g))
  })
}

function matchesCountry(painterCountry: string, selected: string[]): boolean {
  const c = painterCountry.toLowerCase()
  return selected.some((label) => {
    const terms = countrySearchTerms(label)
    return terms.some((t) => c.includes(t.toLowerCase()))
  })
}

function scorePainting(p: Painting, prefs: Preferences, viewed: Set<string>, collected: Set<string>): number {
  let score = Math.log10(2 + p.sitelinks) * 10

  // Discovered works enter the daily rotation with a deliberate boost.
  if (p.discovered) score += 28

  if (prefs.genres.length) {
    if (matchesGenre(p.genre, prefs.genres)) score += 35
    else score -= 8
  }
  if (prefs.countries.length) {
    if (matchesCountry(p.painterCountry, prefs.countries)) score += 25
    else score -= 5
  }
  if (prefs.eras.length) {
    const year = Number(p.painterBirthYear)
    if (Number.isFinite(year) && prefs.eras.some((e) => erasForYear(year).includes(e))) score += 20
  }
  if (prefs.moods.length) {
    const blob = `${p.intro} ${p.genre}`.toLowerCase()
    const moodMap: Record<string, string[]> = {
      contemplative: ['landscape', 'still', 'quiet', 'meditation', 'haze', 'seascape'],
      dramatic: ['history', 'battle', 'myth', 'storm', 'crucifix'],
      intimate: ['portrait', 'genre', 'domestic', 'interior'],
      epic: ['history', 'allegory', 'religious', 'monument'],
    }
    for (const mood of prefs.moods) {
      if ((moodMap[mood] || []).some((w) => blob.includes(w))) score += 12
    }
  }
  if (viewed.has(p.id)) score -= 40
  if (collected.has(p.id)) score += 8
  if (p.lostOrDestroyed) score += 5
  return score
}

export function pickDailyPainting(paintings: Painting[], date = new Date()): Painting {
  if (!paintings.length) throw new Error('No paintings')
  const prefs = getPreferences()
  const viewed = new Set(getViewedIds())
  const collected = new Set(getCollectedIds())
  const day = todayKey(date)
  const ranked = [...paintings]
    .map((p) => ({ p, s: scorePainting(p, prefs, viewed, collected) }))
    .sort((a, b) => b.s - a.s)

  // Prefer a healthy mix: ensure discovered matches can appear in the daily pool.
  const discoveredTop = ranked.filter((x) => x.p.discovered).slice(0, 20)
  const coreTop = ranked.filter((x) => !x.p.discovered).slice(0, 60)
  const mixed = [...discoveredTop, ...coreTop]
  const pool = (mixed.length ? mixed : ranked).slice(0, Math.min(80, ranked.length))
  const idx = hashString(day + JSON.stringify(prefs) + String(discoveredTop.length)) % pool.length
  return pool[idx].p
}

export function pickSurprise(paintings: Painting[], excludeId?: string): Painting {
  const prefs = getPreferences()
  const viewed = new Set(getViewedIds())
  const collected = new Set(getCollectedIds())
  const ranked = paintings
    .filter((p) => p.id !== excludeId)
    .map((p) => ({
      p,
      s: scorePainting(p, prefs, viewed, collected) + (hashString(p.id + String(Date.now())) % 40),
    }))
    .sort((a, b) => b.s - a.s)
  return ranked[0]?.p ?? paintings[0]
}

export { erasForYear, scorePainting }
