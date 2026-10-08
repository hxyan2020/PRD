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
])

const ALLOWED_STYLES = new Set([
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
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
      if (/expression|url\s*\(|javascript:/i.test(value)) return ''
      return `${prop}: ${value}`
    })
    .filter(Boolean)
    .join('; ')
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

export function isBlankHtml(html: string): boolean {
  return !htmlToPlainText(html)
}
