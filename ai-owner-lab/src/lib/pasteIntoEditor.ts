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

  // Need either multiple columns or multiple rows with tabs somewhere.
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

/**
 * Prefer structured clipboard HTML (tables / lists / rich text) over plain text.
 * Returns sanitized HTML ready for insertHTML, or null to fall back to plain text.
 */
export function structuredClipboardHtml(html: string): string | null {
  const raw = html?.trim()
  if (!raw) return null
  if (!htmlContainsTable(raw) && !htmlContainsList(raw) && !/<t[dh][\s>]/i.test(raw)) {
    // Still allow other rich HTML (bold/links-as-text etc.) when it has block structure.
    if (!/<(p|div|br|h[1-3]|li|span|b|strong|i|em|u)[\s>/]/i.test(raw)) return null
  }

  const cleaned = sanitizeHtml(raw)
  if (!cleaned.trim()) return null
  if (htmlContainsTable(raw) && !htmlContainsTable(cleaned)) return null
  return cleaned
}
