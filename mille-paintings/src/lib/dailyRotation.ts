import { todayKey } from './storage'
import type { Painting } from '../types'

/** Stable uint32 hash of a string (FNV-1a). */
export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Rotate a list by a day-derived offset so the starting painting
 * changes every local calendar day, while relative order stays stable.
 */
export function rotateByDay<T>(list: T[], day = todayKey()): T[] {
  if (list.length <= 1) return list
  const offset = hashString(`mille-rotate:${day}`) % list.length
  if (offset === 0) return [...list]
  return [...list.slice(offset), ...list.slice(0, offset)]
}

/** Core (non-discovered) paintings in popularity order, rotated for today. */
export function dailyCoreRotation(paintings: Painting[], day = todayKey()): Painting[] {
  const core = paintings
    .filter((p) => !p.discovered)
    .slice()
    .sort((a, b) => (a.rank || 9999) - (b.rank || 9999) || b.sitelinks - a.sitelinks)
  return rotateByDay(core, day)
}

/** Hero + featured strip for the home page (7 works from today's rotation). */
export function dailyHomeSelection(
  paintings: Painting[],
  day = todayKey(),
): { hero: Painting | null; featured: Painting[] } {
  const rotated = dailyCoreRotation(paintings, day)
  if (!rotated.length) return { hero: null, featured: [] }
  return {
    hero: rotated[0],
    featured: rotated.slice(1, 7),
  }
}
