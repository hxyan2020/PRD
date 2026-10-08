import type { Painting } from '../types'

const BASE = {
  viewed: 'viewed',
  collected: 'collected',
  prefs: 'prefs',
  extras: 'extras',
  lastSurprise: 'lastSurprise',
} as const

/** Active account id — when set, all library keys are namespaced per user. */
let activeUserId: string | null = null

export function getActiveStorageUserId(): string | null {
  return activeUserId
}

export function setActiveStorageUserId(userId: string | null) {
  activeUserId = userId
}

function storageKey(base: string): string {
  return activeUserId ? `mille.u.${activeUserId}.${base}` : `mille.${base}`
}

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

export type UserLibrarySnapshot = {
  viewed: string[]
  collected: string[]
  prefs: Preferences
  extras: Painting[]
  updatedAt: string
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
  return readJson<string[]>(storageKey(BASE.viewed), [])
}

export function markViewed(id: string): string[] {
  const ids = getViewedIds()
  if (!ids.includes(id)) {
    ids.unshift(id)
    writeJson(storageKey(BASE.viewed), ids.slice(0, 5000))
  }
  return ids
}

export function setViewedIds(ids: string[]) {
  writeJson(storageKey(BASE.viewed), [...new Set(ids)].slice(0, 5000))
}

export function getCollectedIds(): string[] {
  return readJson<string[]>(storageKey(BASE.collected), [])
}

export function toggleCollected(id: string): string[] {
  const ids = getCollectedIds()
  const idx = ids.indexOf(id)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.unshift(id)
  writeJson(storageKey(BASE.collected), ids)
  return ids
}

export function setCollectedIds(ids: string[]) {
  writeJson(storageKey(BASE.collected), [...new Set(ids)])
}

export function isCollected(id: string): boolean {
  return getCollectedIds().includes(id)
}

export function getPreferences(): Preferences {
  return { ...DEFAULT_PREFS, ...readJson<Partial<Preferences>>(storageKey(BASE.prefs), {}) }
}

export function savePreferences(prefs: Preferences) {
  writeJson(storageKey(BASE.prefs), prefs)
}

export function getExtraPaintings(): Painting[] {
  return readJson<Painting[]>(storageKey(BASE.extras), [])
}

export function addExtraPaintings(paintings: Painting[]) {
  const existing = getExtraPaintings()
  const byId = new Map(existing.map((p) => [p.id, p]))
  for (const p of paintings) byId.set(p.id, p)
  const next = [...byId.values()]
  writeJson(storageKey(BASE.extras), next)
  return next
}

export function setExtraPaintings(paintings: Painting[]) {
  writeJson(storageKey(BASE.extras), paintings)
}

export function getStats() {
  return {
    viewed: getViewedIds().length,
    collected: getCollectedIds().length,
    extras: getExtraPaintings().length,
  }
}

/** Snapshot of the active user's (or guest) library for sync/backup. */
export function exportLibrarySnapshot(): UserLibrarySnapshot {
  return {
    viewed: getViewedIds(),
    collected: getCollectedIds(),
    prefs: getPreferences(),
    extras: getExtraPaintings(),
    updatedAt: new Date().toISOString(),
  }
}

/** Replace active library from a snapshot (used after login / cloud pull). */
export function importLibrarySnapshot(snap: UserLibrarySnapshot) {
  setViewedIds(snap.viewed || [])
  setCollectedIds(snap.collected || [])
  savePreferences({ ...DEFAULT_PREFS, ...(snap.prefs || {}) })
  setExtraPaintings(snap.extras || [])
}

/**
 * Copy guest (logged-out) library into the active user namespace when the
 * user account is empty — so signup doesn't lose in-progress browsing.
 */
export function migrateGuestLibraryIfEmpty() {
  if (!activeUserId) return
  const userHasData =
    getViewedIds().length > 0 ||
    getCollectedIds().length > 0 ||
    getExtraPaintings().length > 0 ||
    getPreferences().genres.length > 0 ||
    getPreferences().countries.length > 0

  if (userHasData) return

  const guestViewed = readJson<string[]>('mille.viewed', [])
  const guestCollected = readJson<string[]>('mille.collected', [])
  const guestPrefs = readJson<Partial<Preferences>>('mille.prefs', {})
  const guestExtras = readJson<Painting[]>('mille.extras', [])

  if (
    !guestViewed.length &&
    !guestCollected.length &&
    !guestExtras.length &&
    !guestPrefs.genres?.length &&
    !guestPrefs.countries?.length
  ) {
    return
  }

  setViewedIds(guestViewed)
  setCollectedIds(guestCollected)
  savePreferences({ ...DEFAULT_PREFS, ...guestPrefs })
  setExtraPaintings(guestExtras)
}

/** Stable day key in local timezone YYYY-MM-DD */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
