import type { Painting } from '../types'

/** Extract a Commons file title from Special:FilePath or upload.wikimedia.org URLs. */
export function commonsFileName(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const filePath = trimmed.match(/Special:FilePath\/([^?#]+)/i)
  if (filePath?.[1]) {
    try {
      return decodeURIComponent(filePath[1].replace(/\+/g, ' '))
    } catch {
      return filePath[1]
    }
  }

  // upload.wikimedia.org/wikipedia/commons/a/ab/Name.jpg
  // upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Name.jpg/220px-Name.jpg
  const upload = trimmed.match(
    /upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?(?:[0-9a-f]\/[0-9a-f]{2}\/)([^/?#]+)/i,
  )
  if (upload?.[1]) {
    try {
      return decodeURIComponent(upload[1])
    } catch {
      return upload[1]
    }
  }

  return null
}

/** Always return a width-capped Commons derivative — never the unbounded original. */
export function withCommonsWidth(url: string, width: number): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  // Already a sized Commons thumb on upload.wikimedia.org — keep it (avoids FilePath redirects/429s).
  if (/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(trimmed)) {
    return trimmed
  }

  // FilePath already width-capped.
  if (/Special:FilePath\//i.test(trimmed) && /[?&]width=\d+/i.test(trimmed)) {
    return trimmed.replace(/([?&]width=)\d+/i, `$1${width}`)
  }

  const name = commonsFileName(trimmed)
  if (name) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`
  }

  // Non-Commons URL: return as-is (already sized remote asset, etc.)
  if (/[?&]width=\d+/i.test(trimmed)) {
    return trimmed.replace(/([?&]width=)\d+/i, `$1${width}`)
  }
  return trimmed
}

/** Inline page / card display — sharp enough, safe to decode. */
export function displayImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const primary = painting.image?.trim()
  // Prefer already-sized upload thumbs / non-Commons museum URLs as-is.
  if (primary) {
    if (
      /upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(primary) ||
      (!/wikimedia\.org|wikidata\.org/i.test(primary) && !/Special:FilePath/i.test(primary))
    ) {
      return primary
    }
    return withCommonsWidth(primary, 1600)
  }
  const full = painting.imageFull?.trim()
  return full ? withCommonsWidth(full, 1600) : ''
}

/** Fullscreen / large in-app viewer. */
export function viewerImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const full = painting.imageFull?.trim() || painting.image?.trim()
  return full ? withCommonsWidth(full, 2400) : ''
}

/**
 * External “open hi-res” link.
 * Cap at 2400px — larger requests can still fall through to multi‑100MB originals
 * that browsers fail to display.
 */
export function hiResImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const full = painting.imageFull?.trim() || painting.image?.trim()
  return full ? withCommonsWidth(full, 2400) : ''
}

/** True when a URL would fetch an uncapped Commons original. */
export function isUnsafeCommonsOriginal(url: string): boolean {
  const u = url.trim()
  if (!u) return false
  if (/upload\.wikimedia\.org\/wikipedia\/commons\/(?!thumb\/)/i.test(u) && !/[?&]width=\d+/i.test(u)) {
    return true
  }
  if (/Special:FilePath\//i.test(u) && !/[?&]width=\d+/i.test(u)) return true
  return false
}
