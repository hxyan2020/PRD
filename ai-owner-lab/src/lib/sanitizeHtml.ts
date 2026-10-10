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
])

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
      if (/url\s*\(/i.test(value) && prop !== 'background-image') return ''
      if (/url\s*\(/i.test(value)) return ''
      return `${prop}: ${value}`
    })
    .filter(Boolean)
    .join('; ')
}

function sanitizeImg(el: HTMLElement) {
  const src = el.getAttribute('src') || ''
  if (!isSafeImageSrc(src)) {
    el.replaceWith(document.createTextNode(''))
    return false
  }
  // Keep only safe attributes.
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

/** Strip scripts/events; keep basic formatting tags used by the notebook editor. */
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
          const text = document.createTextNode(el.textContent ?? '')
          el.replaceWith(text)
          continue
        }
        if (el.tagName === 'IMG') {
          sanitizeImg(el)
          continue
        }
        if (el.tagName === 'LI' || el.tagName === 'UL' || el.tagName === 'OL') {
          // Keep nested lists intact; only drop junk attrs.
        }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase()
          if (name === 'style') {
            const cleaned = sanitizeStyle(attr.value)
            if (cleaned) el.setAttribute('style', cleaned)
            else el.removeAttribute('style')
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

export function isBlankHtml(html: string): boolean {
  if (htmlHasImage(html)) return false
  return !htmlToPlainText(html)
}
