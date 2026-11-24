/**
 * Lark IM hygiene:
 * - Plain text messages: strip markdown (it shows as raw ** / backticks).
 * - Interactive cards with lark_md: keep ** / ` so Lark can render bold/code.
 */

/** Convert markdown-ish content to plain readable text (for msg_type=text). */
export function toPlainText(input: string): string {
  if (!input) return input
  let s = input
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, '$1 ($2)')
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,]|$)/g, '$1$2')
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,]|$)/g, '$1$2')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/\*\*/g, '')
  s = s.replace(/__/g, '')
  s = s.replace(/`/g, '')
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/\s#{1,6}\s+/g, ' ')
  s = s.replace(/^\s*---+\s*$/gm, '')
  s = s.replace(/\|\s*---+\s*/g, '| ')
  return s
}

/** Light clean for lark_md: keep bold/code/links; drop ATX leftovers from KB dumps. */
export function cleanLarkMd(input: string): string {
  if (!input) return input
  let s = input
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/\s#{1,6}\s+/g, ' ')
  s = s.replace(/^\s*---+\s*$/gm, '')
  return s
}

/** Deep-clean string fields inside a Lark card JSON. Preserves lark_md markup. */
export function plainCard(card: Record<string, unknown>): Record<string, unknown> {
  return walk(card, false) as Record<string, unknown>
}

function walk(value: unknown, keepMd: boolean): unknown {
  if (typeof value === 'string') return keepMd ? cleanLarkMd(value) : toPlainText(value)
  if (Array.isArray(value)) return value.map((v) => walk(v, keepMd))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const nextKeep = obj.tag === 'lark_md' ? true : keepMd
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'tag' || k === 'type' || k === 'template' || k === 'url') {
        out[k] = v
        continue
      }
      // action values must stay exact (step_done / archive / review)
      if (k === 'value' || k === 'action') {
        out[k] = v
        continue
      }
      out[k] = walk(v, k === 'content' && obj.tag === 'lark_md' ? true : nextKeep)
    }
    return out
  }
  return value
}
