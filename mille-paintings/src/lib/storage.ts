import type { Painting } from '../types'

const KEYS = {
  viewed: 'mille.viewed',
  collected: 'mille.collected',
  prefs: 'mille.prefs',
  extras: 'mille.extras',
  lastSurprise: 'mille.lastSurprise',
} as const

export type Preferences = {
  genres: string[]
  countries: string[]
  eras: string[] // e.g. renaissance, baroque, modern
  moods: string[] // contemplative, dramatic, intimate, epic
}

export const DEFAULT_PREFS: Preferences = {
  genres: [],
  countries: [],
  eras: [],
  moods: [],
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getViewedIds(): string[] {
  return readJson<string[]>(KEYS.viewed, [])
}

export function markViewed(id: string): string[] {
  const ids = getViewedIds()
  if (!ids.includes(id)) {
    ids.unshift(id)
    writeJson(KEYS.viewed, ids.slice(0, 5000))
  }
  return ids
}

export function getCollectedIds(): string[] {
  return readJson<string[]>(KEYS.collected, [])
}

export function toggleCollected(id: string): string[] {
  const ids = getCollectedIds()
  const idx = ids.indexOf(id)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.unshift(id)
  writeJson(KEYS.collected, ids)
  return ids
}

export function isCollected(id: string): boolean {
  return getCollectedIds().includes(id)
}

export function getPreferences(): Preferences {
  return { ...DEFAULT_PREFS, ...readJson<Partial<Preferences>>(KEYS.prefs, {}) }
}

export function savePreferences(prefs: Preferences) {
  writeJson(KEYS.prefs, prefs)
}

export function getExtraPaintings(): Painting[] {
  return readJson<Painting[]>(KEYS.extras, [])
}

export function addExtraPaintings(paintings: Painting[]) {
  const existing = getExtraPaintings()
  const byId = new Map(existing.map((p) => [p.id, p]))
  for (const p of paintings) byId.set(p.id, p)
  const next = [...byId.values()]
  writeJson(KEYS.extras, next)
  return next
}

export function getStats() {
  return {
    viewed: getViewedIds().length,
    collected: getCollectedIds().length,
    extras: getExtraPaintings().length,
  }
}

/** Stable day key in local timezone YYYY-MM-DD */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
