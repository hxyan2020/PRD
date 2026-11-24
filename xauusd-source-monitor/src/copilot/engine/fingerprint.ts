/** Stable-ish fingerprint so the same pasted alert is not investigated twice. */
export function investigationFingerprint(parts: {
  title?: string
  facts?: string
  imagesCount?: number
}): string {
  const raw = [
    String(parts.title || '').trim(),
    String(parts.facts || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*([【】\[\]()（）：:·|,，])\s*/g, '$1')
      .trim(),
    parts.imagesCount ? `imgs:${parts.imagesCount}` : '',
  ]
    .filter(Boolean)
    .join('|')
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `inv_${(h >>> 0).toString(16)}_${raw.slice(0, 48)}`
}

/** Reuse an open incident if the same alert was investigated within the window. */
export function findRecentSameInvestigation<
  T extends { fingerprint?: string; facts?: string; createdAt: number; archivedAt?: number },
>(
  history: T[],
  fingerprint: string,
  windowMs = 15 * 60 * 1000,
): T | null {
  const since = Date.now() - windowMs
  return (
    history.find(
      (h) =>
        !h.archivedAt &&
        h.createdAt >= since &&
        (h.fingerprint === fingerprint ||
          (fingerprint &&
            h.facts &&
            investigationFingerprint({ facts: h.facts }) === fingerprint)),
    ) || null
  )
}
