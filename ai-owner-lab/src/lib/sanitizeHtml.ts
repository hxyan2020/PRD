import {
  highlightCodeBlocksInElement,
  normalizeCodeLanguage,
  plainifyCodeBlocksInElement,
} from './codeHighlight'
import { isSafeImageSrc } from './noteImage'

const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'UL',
  'OL',
  'LI',
  'P',
  'BR',
  'DIV',
  'SPAN',
  'FONT',
  'H1',
  'H2',
  'H3',
  'IMG',
  'FIGURE',
  'MARK',
  'BLOCKQUOTE',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'TH',
  'TD',
  'PRE',
  'CODE',
  'CAPTION',
  'COLGROUP',
  'COL',
])

const ALLOWED_STYLES = new Set([
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'max-width',
  'height',
  'width',
  'display',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-left',
  'list-style-type',
  'list-style',
  'text-align',
  'border-collapse',
  'white-space',
])

const TABLE_TAGS = new Set(['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'COLGROUP', 'COL'])

function sanitizeStyle(style: string): string {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf(':')
      if (idx < 0) return ''
      const prop = part.slice(0, idx).trim().toLowerCase()
      const value = part.slice(idx + 1).trim()
      if (!ALLOWED_STYLES.has(prop)) return ''
      if (/expression|javascript:/i.test(value)) return ''
      if (/url\s*\(/i.test(value)) return ''
      return `${prop}: ${value}`
    })
    .filter(Boolean)
    .join('; ')
}

function isSafeClassName(className: string): boolean {
  return /^(language-[\w+-]+|hljs(-[\w+-]+)?|notebook-table|notebook-code(-block)?|rte-table)$/.test(
    className,
  )
}

function sanitizeClassAttr(value: string): string {
  return value
    .split(/\s+/)
    .map((c) => c.trim())
    .filter(isSafeClassName)
    .join(' ')
}

function sanitizeImg(el: HTMLElement) {
  const src = el.getAttribute('src') || ''
  if (!isSafeImageSrc(src)) {
    el.replaceWith(document.createTextNode(''))
    return false
  }
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    if (name === 'src') continue
    if (name === 'alt') {
      el.setAttribute('alt', attr.value.slice(0, 200))
      continue
    }
    if (name === 'style') {
      const cleaned = sanitizeStyle(attr.value)
      if (cleaned) el.setAttribute('style', cleaned)
      else el.removeAttribute('style')
      continue
    }
    if ((name === 'width' || name === 'height') && /^\d{1,4}$/.test(attr.value)) {
      continue
    }
    el.removeAttribute(attr.name)
  }
  if (!el.getAttribute('alt')) el.setAttribute('alt', '')
  const style = el.getAttribute('style') || ''
  if (!/max-width/i.test(style)) {
    el.setAttribute('style', `${style ? `${style}; ` : ''}max-width: 100%; height: auto`)
  }
  return true
}

function sanitizeTableCell(el: HTMLElement) {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    if (name === 'style') {
      const cleaned = sanitizeStyle(attr.value)
      if (cleaned) el.setAttribute('style', cleaned)
      else el.removeAttribute('style')
      continue
    }
    if (name === 'colspan' || name === 'rowspan') {
      if (/^[1-9]\d{0,1}$/.test(attr.value)) continue
    }
    if (name === 'scope' && /^(col|row|colgroup|rowgroup)$/i.test(attr.value)) continue
    el.removeAttribute(attr.name)
  }
}

function sanitizeCodeLike(el: HTMLElement) {
  const lang = normalizeCodeLanguage(
    el.getAttribute('data-lang') ||
      [...el.classList].find((c) => c.startsWith('language-'))?.slice('language-'.length),
  )
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    if (name === 'class') {
      const cleaned = sanitizeClassAttr(attr.value)
      if (cleaned) el.setAttribute('class', cleaned)
      else el.removeAttribute('class')
      continue
    }
    if (name === 'data-lang') continue
    if (name === 'style') {
      // Drop custom styles on code; theme CSS owns appearance.
      el.removeAttribute('style')
      continue
    }
    el.removeAttribute(attr.name)
  }
  el.setAttribute('data-lang', lang)
  const classes = new Set(
    (el.getAttribute('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter((c) => !c.startsWith('language-') && c !== 'hljs' && !c.startsWith('hljs-')),
  )
  classes.add(`language-${lang}`)
  if (el.tagName === 'PRE') classes.add('notebook-code-block')
  if (el.tagName === 'CODE' && el.parentElement?.tagName !== 'PRE') classes.add('notebook-code')
  el.className = [...classes].join(' ')
}

/** Strip scripts/events; keep formatting, tables, and code blocks used by the notebook editor. */
export function sanitizeHtml(input: string): string {
  if (typeof document === 'undefined') {
    return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  }
  const template = document.createElement('template')
  template.innerHTML = input
  const walk = (node: Node) => {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (!ALLOWED_TAGS.has(el.tagName)) {
          // Preserve contents of unknown wrappers.
          const parent = el.parentNode
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el)
            parent.removeChild(el)
            continue
          }
          const text = document.createTextNode(el.textContent ?? '')
          el.replaceWith(text)
          continue
        }
        if (el.tagName === 'IMG') {
          sanitizeImg(el)
          continue
        }
        if (el.tagName === 'PRE' || el.tagName === 'CODE') {
          sanitizeCodeLike(el)
          walk(el)
          continue
        }
        if (TABLE_TAGS.has(el.tagName)) {
          if (el.tagName === 'TH' || el.tagName === 'TD') {
            sanitizeTableCell(el)
          } else {
            for (const attr of Array.from(el.attributes)) {
              const name = attr.name.toLowerCase()
              if (name === 'class') {
                const cleaned = sanitizeClassAttr(attr.value)
                if (cleaned) el.setAttribute('class', cleaned)
                else el.removeAttribute('class')
              } else if (name === 'style') {
                const cleaned = sanitizeStyle(attr.value)
                if (cleaned) el.setAttribute('style', cleaned)
                else el.removeAttribute('style')
              } else if (name === 'span' && el.tagName === 'COL' && /^[1-9]\d{0,1}$/.test(attr.value)) {
                // keep
              } else {
                el.removeAttribute(attr.name)
              }
            }
            if (el.tagName === 'TABLE') {
              el.classList.add('notebook-table')
            }
          }
          walk(el)
          continue
        }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase()
          if (name === 'style') {
            const cleaned = sanitizeStyle(attr.value)
            if (cleaned) el.setAttribute('style', cleaned)
            else el.removeAttribute('style')
          } else if (name === 'class') {
            const cleaned = sanitizeClassAttr(attr.value)
            if (cleaned) el.setAttribute('class', cleaned)
            else el.removeAttribute('class')
          } else if (el.tagName === 'FONT' && (name === 'color' || name === 'size' || name === 'face')) {
            // keep legacy font attrs from execCommand
          } else {
            el.removeAttribute(attr.name)
          }
        }
        walk(el)
        // Browsers may wrap indented lists in blockquote; unwrap, keep nested ul/ol.
        if (el.tagName === 'BLOCKQUOTE' && el.parentNode) {
          const parent = el.parentNode
          while (el.firstChild) parent.insertBefore(el.firstChild, el)
          parent.removeChild(el)
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child)
      }
    }
  }
  walk(template.content)
  // Persist code as plain text (no hljs spans) so re-editing stays clean.
  plainifyCodeBlocksInElement(template.content)
  return template.innerHTML
}

/** Sanitize then apply syntax highlighting for display (notes reader / timeline). */
export function renderNoteHtml(input: string): string {
  if (typeof document === 'undefined') return sanitizeHtml(input)
  const template = document.createElement('template')
  template.innerHTML = sanitizeHtml(input)
  highlightCodeBlocksInElement(template.content)
  return template.innerHTML
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = sanitizeHtml(html)
  return (div.textContent || '').replace(/\u00a0/g, ' ').trim()
}

export function htmlHasImage(html: string): boolean {
  return /<img\b/i.test(html)
}

export function htmlHasTableOrCode(html: string): boolean {
  return /<(table|pre|code)\b/i.test(html)
}

export function isBlankHtml(html: string): boolean {
  if (htmlHasImage(html) || htmlHasTableOrCode(html)) return false
  return !htmlToPlainText(html)
}
