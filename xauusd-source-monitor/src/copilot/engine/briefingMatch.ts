import type { ImportedBriefing } from '../storage'

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}%./_-]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

function briefingHaystack(b: ImportedBriefing): string {
  return [
    b.title,
    b.triggerReason,
    b.severity,
    ...(b.causes || []),
    ...(b.observations || []),
    ...(b.why || []),
    ...(b.impact || []),
    ...(b.actions || []),
    ...(b.breachedSources || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * Rank Market Condition briefings that are relevant to the user's RCA input.
 * Always prefers open/recent items; returns top matches (may be empty).
 */
export function matchRelevantBriefings(
  query: string,
  briefings: ImportedBriefing[],
  limit = 3,
): ImportedBriefing[] {
  const q = query.trim()
  const qTokens = tokens(q)
  const now = Date.now()

  const scored = briefings.map((b) => {
    const hay = briefingHaystack(b)
    let score = 0
    for (const t of qTokens) {
      if (!hay.includes(t)) continue
      score += t.length >= 4 ? 3 : 1
    }
    // Shared venue / contract cues
    for (const cue of ['xauusd', 'okx', 'bitget', 'bybit', 'binance', 'mark', 'index', 'funding']) {
      if (q.toLowerCase().includes(cue) && hay.includes(cue)) score += 2
    }
    if (!b.archivedAt) score += 2
    const sev = String(b.severity || '').toLowerCase()
    if (sev.includes('red') || sev === 'p0') score += 3
    else if (sev.includes('yellow') || sev === 'p1') score += 2
    // Recency boost (7d)
    const age = now - (b.createdAt || 0)
    if (age >= 0 && age < 7 * 24 * 3600 * 1000) score += 2
    else if (age < 30 * 24 * 3600 * 1000) score += 1
    return { b, score }
  })

  scored.sort((a, c) => c.score - a.score || (c.b.createdAt || 0) - (a.b.createdAt || 0))

  const positive = scored.filter((x) => x.score > 0).slice(0, limit)
  if (positive.length) return positive.map((x) => x.b)

  // No lexical hit — still bind the newest open briefings so analysis has market context.
  return briefings
    .filter((b) => !b.archivedAt)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, Math.min(2, limit))
}
