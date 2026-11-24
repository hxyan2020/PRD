/**
 * Lark IM plain-text hygiene: strip markdown symbols that show up literally
 * in text messages (and keep cards readable without ** / backticks).
 */

/** Convert markdown-ish content to plain readable text. */
export function toPlainText(input: string): string {
  if (!input) return input
  let s = input
  // [label](url) → label (url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, '$1 ($2)')
  // bold / italic / code
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,]|$)/g, '$1$2')
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,]|$)/g, '$1$2')
  s = s.replace(/`([^`]+)`/g, '$1')
  // leftover lone ** / __ / backticks / # headers
  s = s.replace(/\*\*/g, '')
  s = s.replace(/__/g, '')
  s = s.replace(/`/g, '')
  s = s.replace(/^#{1,6}\s+/gm, '')
  // horizontal rules used as separators → blank line
  s = s.replace(/^\s*---+\s*$/gm, '')
  return s
}

/** Deep-clean string fields inside a Lark card JSON. */
export function plainCard(card: Record<string, unknown>): Record<string, unknown> {
  return walk(card) as Record<string, unknown>
}

function walk(value: unknown): unknown {
  if (typeof value === 'string') return toPlainText(value)
  if (Array.isArray(value)) return value.map(walk)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Keep tag names intact; only sanitize human-visible content fields
      if (k === 'tag' || k === 'type' || k === 'template' || k === 'type' || k === 'url') {
        out[k] = v
        continue
      }
      if (k === 'content' || k === 'text' || typeof v === 'string') {
        out[k] = walk(v)
      } else {
        out[k] = walk(v)
      }
    }
    return out
  }
  return value
}
