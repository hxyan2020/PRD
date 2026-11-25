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

/** Light clean for lark_md: keep bold/links; drop code backticks & ATX leftovers. */
export function cleanLarkMd(input: string): string {
  if (!input) return input
  let s = input
  // Prefer bold over inline code so commands don't look like monospace junk
  s = s.replace(/`([^`]+)`/g, '**$1**')
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/\s#{1,6}\s+/g, ' ')
  s = s.replace(/^\s*---+\s*$/gm, '')
  return s
}

function splitMdRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

/** Turn GFM pipe tables into bold + bullet rows (Lark cards don't render tables). */
export function mdTablesToBullets(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const next = lines[i + 1] ?? ''
    const looksHeader = line.includes('|')
    const looksSep = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next)
    if (looksHeader && looksSep) {
      const headers = splitMdRow(line)
      i += 2
      while (i < lines.length) {
        const row = lines[i] ?? ''
        if (!row.includes('|') || !row.trim()) break
        if (/^\|?\s*:?-{3,}/.test(row.trim())) {
          i += 1
          continue
        }
        const cells = splitMdRow(row)
        const name = cells[0] || '—'
        const bits: string[] = []
        for (let c = 1; c < Math.max(headers.length, cells.length); c++) {
          const h = headers[c] || `col${c}`
          const v = cells[c] || ''
          if (v) bits.push(`**${h}：** ${v}`)
        }
        out.push(`• **${name}**`)
        if (bits.length) out.push(`  ${bits.join(' · ')}`)
        i += 1
      }
      out.push('')
      continue
    }
    out.push(line)
    i += 1
  }
  return out.join('\n')
}

/**
 * Format Skills / Knowledge node bodies for Lark lark_md:
 * preserve structure, bold headings, bullets for tables — never flatten to one line.
 */
export function formatNodeBodyForLark(raw: string, maxLen = 8000): string {
  if (!raw) return ''
  let s = raw.replace(/\r\n/g, '\n').trim()
  s = mdTablesToBullets(s)
  // ATX headings → bold section titles with spacing
  s = s.replace(/^#{1,6}\s+(.+)$/gm, '\n**$1**\n')
  // Blockquotes → italic callouts
  s = s.replace(/^>\s?(.*)$/gm, '💬 _$1_')
  // Lead labels
  s = s.replace(/^(Summary|摘要|待确认|待確認|Historical|Note|备注|備註)\s*([:：])/gim, '**$1**$2')
  // Numbered “1. foo” / “2.1 bar” already fine; ensure list markers on dash lines
  s = s.replace(/^[•·]\s*/gm, '• ')
  s = s.replace(/^[-*]\s+/gm, '• ')
  // Collapse excess blank lines but keep paragraph breaks
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  if (s.length <= maxLen) return s
  // Prefer cutting after a full step/bullet, never mid-sentence with a bare ellipsis alone
  const cut = s.slice(0, maxLen)
  const at = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('\n'))
  const kept = (at > maxLen * 0.5 ? cut.slice(0, at) : cut).trim()
  return `${kept}\n\n_…（正文过长，已保留完整步骤开头；发 skills 打开桌面页查看全文）_`
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
      // action values must stay exact (step_done / generate_report / archive / review / open_incident)
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
