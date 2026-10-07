import type { Painting } from '../types'

/** Cap Commons Special:FilePath URLs so browsers never fetch multi‑100MB originals. */
export function withCommonsWidth(url: string, width: number): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (!trimmed.includes('Special:FilePath')) return trimmed
  if (/[?&]width=\d+/i.test(trimmed)) {
    return trimmed.replace(/([?&]width=)\d+/i, `$1${width}`)
  }
  return `${trimmed}${trimmed.includes('?') ? '&' : '?'}width=${width}`
}

/** Inline page / card display — sharp enough, safe to decode. */
export function displayImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const primary = painting.image?.trim()
  if (primary) return withCommonsWidth(primary, 1600)
  const full = painting.imageFull?.trim()
  return full ? withCommonsWidth(full, 1600) : ''
}

/** Fullscreen / large in-app viewer. */
export function viewerImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const full = painting.imageFull?.trim()
  if (full) return withCommonsWidth(full, 2400)
  return displayImageUrl(painting)
}

/** External “open hi-res” link — large but bounded. */
export function hiResImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const full = painting.imageFull?.trim()
  if (full) return withCommonsWidth(full, 3200)
  return displayImageUrl(painting)
}
