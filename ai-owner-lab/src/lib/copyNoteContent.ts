import { htmlToPlainText, renderNoteHtml } from './sanitizeHtml'
import type { NotebookEntry } from '../hooks/useNotebook'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bodyAsHtml(raw: string): string {
  const text = String(raw || '')
  if (!text.trim()) return ''
  if (/<\/?[a-z][\s\S]*>/i.test(text)) return renderNoteHtml(text)
  return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
}

function explanationAsHtml(raw: string): string {
  const text = String(raw || '')
    .replace(/\*\*/g, '')
    .trim()
  if (!text) return ''
  return text
    .split(/\n\n+/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Build title + body (+ explanation) for clipboard — HTML keeps formatting in Docs. */
export function noteContentForClipboard(entry: NotebookEntry): { html: string; text: string } {
  const title =
    entry.title?.trim() ||
    htmlToPlainText(entry.selectedText).replace(/\s+/g, ' ').trim().slice(0, 120) ||
    'Note'
  const bodyHtml = bodyAsHtml(entry.selectedText)
  const explHtml = explanationAsHtml(entry.explanation || '')
  const html = [
    `<h1>${escapeHtml(title)}</h1>`,
    bodyHtml,
    explHtml ? `<h2>Explanation</h2>${explHtml}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const text = [
    title,
    htmlToPlainText(entry.selectedText).trim() || entry.selectedText.trim(),
    (entry.explanation || '').replace(/\*\*/g, '').trim(),
  ]
    .filter(Boolean)
    .join('\n\n')

  return { html, text }
}

export async function copyNoteContent(entry: NotebookEntry): Promise<void> {
  const { html, text } = noteContentForClipboard(entry)
  if (!text.trim() && !html.replace(/<[^>]+>/g, '').trim()) {
    throw new Error('empty')
  }
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      return
    }
  } catch {
    /* fall through to plain text */
  }
  await navigator.clipboard.writeText(text)
}
