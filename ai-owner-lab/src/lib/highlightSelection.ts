import { highlightRange } from './rangeHighlight'
import { sanitizeHtml } from './sanitizeHtml'

const DEFAULT_HIGHLIGHT = '#fde68a'

/** Wrap the current selection inside a notebook quote and return updated HTML. */
export function highlightSelectionInNotebookQuote(
  color: string = DEFAULT_HIGHLIGHT,
): { entryId: string; html: string } | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null

  const range = selection.getRangeAt(0)
  const quote = findNotebookQuote(range.commonAncestorContainer)
  if (!quote) return null

  const entry = quote.closest<HTMLElement>('.notebook-entry[data-entry-id]')
  const entryId = entry?.dataset.entryId
  if (!entryId || entry.classList.contains('editing')) return null
  if (!quote.contains(range.commonAncestorContainer)) return null

  if (!highlightRange(range, color)) return null

  const html = sanitizeHtml(quote.innerHTML)
  selection.removeAllRanges()
  return { entryId, html }
}

export function selectionIsInNotebookQuote(): boolean {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.rangeCount) return false
  const range = selection.getRangeAt(0)
  const quote = findNotebookQuote(range.commonAncestorContainer)
  if (!quote) return false
  const entry = quote.closest('.notebook-entry[data-entry-id]')
  return Boolean(entry && !entry.classList.contains('editing'))
}

function findNotebookQuote(node: Node): HTMLElement | null {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  return el?.closest<HTMLElement>('.notebook-entry .notebook-quote') ?? null
}
