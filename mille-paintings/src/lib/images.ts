import type { Painting } from '../types'

/** Commons thumbnail widths that upload/thumb endpoints currently accept. */
const COMMONS_THUMB_WIDTHS = [960, 1280, 1920] as const

/** Prefer these caps for in-app display / viewer (never request disallowed sizes). */
export const DISPLAY_IMAGE_WIDTH = 1280
export const VIEWER_IMAGE_WIDTH = 1920

/** Extract a Commons file title from Special:FilePath or upload/thumb.wikimedia.org URLs. */
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
  // thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Name.jpg/1280px-Name.jpg
  const upload = trimmed.match(
    /(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?(?:[0-9a-f]\/[0-9a-f]{2}\/)([^/?#]+)/i,
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

function clampCommonsWidth(width: number): number {
  let best: number = COMMONS_THUMB_WIDTHS[0]
  for (const w of COMMONS_THUMB_WIDTHS) {
    if (w <= width) best = w
  }
  // If requested larger than all known thumbs, use the largest safe thumb (never uncapped original).
  if (width > COMMONS_THUMB_WIDTHS[COMMONS_THUMB_WIDTHS.length - 1]) {
    return COMMONS_THUMB_WIDTHS[COMMONS_THUMB_WIDTHS.length - 1]
  }
  return best
}

/** Always return a width-capped Commons derivative — never the unbounded original. */
export function withCommonsWidth(url: string, width: number): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  const safeWidth = clampCommonsWidth(width)

  // Already a sized Commons thumb — keep host, rewrite to a safe width when needed.
  if (/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(trimmed)) {
    const rewritten = trimmed.replace(/\/\d+px-/i, `/${safeWidth}px-`)
    if (rewritten !== trimmed) return rewritten
    return trimmed
  }

  // FilePath already width-capped.
  if (/Special:FilePath\//i.test(trimmed) && /[?&]width=\d+/i.test(trimmed)) {
    return trimmed.replace(/([?&]width=)\d+/i, `$1${safeWidth}`)
  }

  const name = commonsFileName(trimmed)
  if (name) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${safeWidth}`
  }

  // Non-Commons URL: return as-is (already sized remote asset, etc.)
  if (/[?&]width=\d+/i.test(trimmed)) {
    return trimmed.replace(/([?&]width=)\d+/i, `$1${safeWidth}`)
  }
  return trimmed
}

/**
 * Hosts that commonly 403 / fail as hotlinked <img> from GitHub Pages
 * (or return empty placeholders). Prefer Commons rescue instead of storing these.
 */
export function isBlockedHotlinkUrl(url: string): boolean {
  const u = url.trim()
  if (!u) return true
  if (/artic\.edu\/iiif/i.test(u)) return true
  if (/www\.artic\.edu\/iiif/i.test(u)) return true
  // Rawpixel CDN often serves Openverse hits that 403 off-site.
  if (/images\.rawpixel\.com/i.test(u)) return true
  return false
}

export function hasDisplayableImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): boolean {
  const urls = [painting.image, painting.imageFull].map((u) => (u || '').trim()).filter(Boolean)
  if (!urls.length) return false
  return urls.some((u) => !isBlockedHotlinkUrl(u))
}

/** Ordered unique image URLs to try for display (card / page). */
export function imageCandidates(
  painting: Pick<Painting, 'image' | 'imageFull'>,
  width: number = DISPLAY_IMAGE_WIDTH,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (url?: string) => {
    const u = (url || '').trim()
    if (!u || seen.has(u) || isBlockedHotlinkUrl(u)) return
    seen.add(u)
    out.push(u)
  }

  const primary = painting.image?.trim() || ''
  const full = painting.imageFull?.trim() || ''

  push(displayImageUrl(painting))
  push(primary && !isBlockedHotlinkUrl(primary) ? withCommonsWidth(primary, width) : '')
  push(full && !isBlockedHotlinkUrl(full) ? withCommonsWidth(full, width) : '')
  push(primary)
  push(full)

  // Extra Commons width variants when we know the file name.
  for (const raw of [primary, full]) {
    const name = commonsFileName(raw || '')
    if (!name) continue
    for (const w of COMMONS_THUMB_WIDTHS) {
      push(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${w}`)
    }
  }

  // V&A IIIF: try a couple of sizes if the primary IIIF URL fails.
  for (const raw of [primary, full]) {
    if (!raw || !/framemark\.vam\.ac\.uk\/collections\//i.test(raw)) continue
    const base = raw.replace(/full\/.+$/i, '')
    if (!base.endsWith('/')) continue
    push(`${base}full/!800,800/0/default.jpg`)
    push(`${base}full/!400,400/0/default.jpg`)
    push(`${base}full/!1600,1600/0/default.jpg`)
  }

  return out
}

/** Inline page / card display — sharp enough, safe to decode. */
export function displayImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const primary = painting.image?.trim()
  if (primary && !isBlockedHotlinkUrl(primary)) {
    if (
      /(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(primary) ||
      (!/wikimedia\.org|wikidata\.org/i.test(primary) && !/Special:FilePath/i.test(primary))
    ) {
      // Rewrite upload thumbs to a known-safe width when they request a banned size.
      if (/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(primary)) {
        return withCommonsWidth(primary, DISPLAY_IMAGE_WIDTH)
      }
      return primary
    }
    return withCommonsWidth(primary, DISPLAY_IMAGE_WIDTH)
  }
  const full = painting.imageFull?.trim()
  if (full && !isBlockedHotlinkUrl(full)) {
    return withCommonsWidth(full, DISPLAY_IMAGE_WIDTH)
  }
  return ''
}

/** Fullscreen / large in-app viewer. */
export function viewerImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const candidates = imageCandidates(painting, VIEWER_IMAGE_WIDTH)
  return candidates[0] || ''
}

/**
 * External “open hi-res” link.
 * Cap at a safe Commons thumb width — larger FilePath requests can fall through
 * to multi‑100MB originals that browsers fail to display.
 */
export function hiResImageUrl(painting: Pick<Painting, 'image' | 'imageFull'>): string {
  const full = painting.imageFull?.trim() || painting.image?.trim()
  if (!full || isBlockedHotlinkUrl(full)) {
    return displayImageUrl(painting)
  }
  return withCommonsWidth(full, VIEWER_IMAGE_WIDTH)
}

/** True when a URL would fetch an uncapped Commons original. */
export function isUnsafeCommonsOriginal(url: string): boolean {
  const u = url.trim()
  if (!u) return false
  if (
    /upload\.wikimedia\.org\/wikipedia\/commons\/(?!thumb\/)/i.test(u) &&
    !/[?&]width=\d+/i.test(u)
  ) {
    return true
  }
  if (/Special:FilePath\//i.test(u) && !/[?&]width=\d+/i.test(u)) return true
  return false
}
