import { sanitizeHtml } from './sanitizeHtml'

/** True when clipboard HTML carries a real table we should preserve. */
export function htmlContainsTable(html: string): boolean {
  return /<table[\s>]/i.test(html)
}

/** True when clipboard HTML carries lists worth preserving. */
export function htmlContainsList(html: string): boolean {
  return /<(ul|ol)[\s>]/i.test(html)
}

function escapeCell(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Turn tab-separated plain text (Excel / Sheets / Numbers copy) into a notebook table.
 * Returns null when the paste does not look like a multi-cell grid.
 */
export function tsvPlainTextToTableHtml(text: string): string | null {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').trimEnd()
  if (!normalized.trim()) return null

  const rows = normalized.split('\n').map((line) => line.split('\t'))
  if (rows.length < 1) return null

  const colCount = Math.max(...rows.map((r) => r.length))
  if (colCount < 2 && rows.length < 2) return null

  const hasTabs = rows.some((r) => r.length > 1)
  if (!hasTabs) return null
  if (rows.length === 1 && colCount < 2) return null

  const padded = rows.map((r) => {
    const next = [...r]
    while (next.length < colCount) next.push('')
    return next.slice(0, Math.min(colCount, 12))
  })
  const limited = padded.slice(0, 40)
  const cols = limited[0]?.length ?? 0
  if (cols < 2) return null

  const [header, ...body] = limited
  const head = header.map((c) => `<th>${escapeCell(c.trim() || '\u00a0')}</th>`).join('')
  const bodyHtml = (body.length ? body : [Array.from({ length: cols }, () => '')])
    .map((row) => {
      const cells = row.map((c) => `<td>${escapeCell(c.trim()) || '<br>'}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  return sanitizeHtml(
    `<table class="notebook-table"><thead><tr>${head}</tr></thead><tbody>${bodyHtml}</tbody></table><p><br></p>`,
  )
}

type ListLine = {
  level: number
  ordered: boolean
  text: string
}

const BULLET_RE = /^(?:[-*•·▪▸►]|–|—)\s+(.*)$/
const ORDERED_RE = /^(?:\d+[.)]|[a-zA-Z][.)]|[ivxlcdmIVXLCDM]+[.)])\s+(.*)$/

function parseListLine(line: string): ListLine | null {
  const lead = line.match(/^(\s*)(.*)$/)
  if (!lead) return null
  const indent = lead[1].replace(/\t/g, '  ')
  const rest = lead[2]
  if (!rest.trim()) return null
  const level = Math.min(6, Math.floor(indent.length / 2))
  const bullet = rest.match(BULLET_RE)
  if (bullet) return { level, ordered: false, text: bullet[1].trim() }
  const ordered = rest.match(ORDERED_RE)
  if (ordered) return { level, ordered: true, text: ordered[1].trim() }
  return null
}

/**
 * Convert indented plain-text bullets / numbered lines into nested UL/OL HTML.
 */
export function plainTextListsToHtml(text: string): string | null {
  const lines = text.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').split('\n')
  const items: ListLine[] = []
  for (const line of lines) {
    if (!line.trim()) {
      if (items.length) break
      continue
    }
    const item = parseListLine(line)
    if (!item) {
      if (items.length) break
      return null
    }
    items.push(item)
  }
  if (items.length < 1) return null

  // Normalize levels to start at 0 and step by at most 1.
  let minLevel = Math.min(...items.map((i) => i.level))
  const normalized = items.map((i) => ({ ...i, level: i.level - minLevel }))
  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i].level > normalized[i - 1].level + 1) {
      normalized[i].level = normalized[i - 1].level + 1
    }
  }

  type Node = { ordered: boolean; text: string; children: Node[] }
  const roots: Node[] = []
  const stack: Node[] = []

  for (const row of normalized) {
    const node: Node = { ordered: row.ordered, text: row.text, children: [] }
    while (stack.length > row.level) stack.pop()
    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    stack.push(node)
  }

  const renderList = (nodes: Node[]): string => {
    if (!nodes.length) return ''
    // Split consecutive runs by ordered/unordered so mixed markers stay correct.
    const parts: string[] = []
    let i = 0
    while (i < nodes.length) {
      const ordered = nodes[i].ordered
      const run: Node[] = []
      while (i < nodes.length && nodes[i].ordered === ordered) {
        run.push(nodes[i])
        i += 1
      }
      const tag = ordered ? 'ol' : 'ul'
      const lis = run
        .map((n) => {
          const nested = n.children.length ? renderList(n.children) : ''
          return `<li>${escapeText(n.text) || '<br>'}${nested}</li>`
        })
        .join('')
      parts.push(`<${tag}>${lis}</${tag}>`)
    }
    return parts.join('')
  }

  const html = renderList(roots)
  if (!html) return null
  return sanitizeHtml(`${html}<p><br></p>`)
}

/**
 * Nest sibling lists that Word/Docs emit as indented adjacent UL/OL blocks
 * into proper embedded lists inside the previous LI.
 */
export function nestAdjacentIndentedLists(html: string): string {
  if (typeof document === 'undefined') return html
  if (!htmlContainsList(html)) return html
  const template = document.createElement('template')
  template.innerHTML = html

  const marginPx = (el: HTMLElement): number => {
    const style = el.getAttribute('style') || ''
    const m = /margin-left\s*:\s*([-.\d]+)(px|pt)?/i.exec(style)
    if (!m) return 0
    const n = Number(m[1])
    if (!Number.isFinite(n)) return 0
    return (m[2] || 'px').toLowerCase() === 'pt' ? n * (96 / 72) : n
  }

  const lists = Array.from(template.content.querySelectorAll('ul, ol')) as HTMLElement[]
  for (const list of lists) {
    if (!list.isConnected) continue
    const prev = list.previousElementSibling as HTMLElement | null
    if (!prev) continue
    const prevIsList = prev.tagName === 'UL' || prev.tagName === 'OL'
    if (!prevIsList) continue
    const deeper = marginPx(list) - marginPx(prev) >= 12
    const alreadyNested = list.parentElement?.tagName === 'LI'
    if (alreadyNested) continue
    if (!deeper && marginPx(list) <= marginPx(prev)) continue
    const lastLi = prev.querySelector(':scope > li:last-of-type')
    if (!lastLi) continue
    lastLi.appendChild(list)
  }

  return template.innerHTML
}

/**
 * Prefer structured clipboard HTML (tables / lists / rich text) over plain text.
 * Returns sanitized HTML ready for insertHTML, or null to fall back to plain text.
 */
export function structuredClipboardHtml(html: string): string | null {
  const raw = html?.trim()
  if (!raw) return null
  if (!htmlContainsTable(raw) && !htmlContainsList(raw) && !/<t[dh][\s>]/i.test(raw)) {
    if (!/<(p|div|br|h[1-3]|li|span|b|strong|i|em|u)[\s>/]/i.test(raw)) return null
  }

  const cleaned = sanitizeHtml(raw)
  if (!cleaned.trim()) return null
  if (htmlContainsTable(raw) && !htmlContainsTable(cleaned)) return null
  const withNested = nestAdjacentIndentedLists(cleaned)
  return sanitizeHtml(withNested)
}
