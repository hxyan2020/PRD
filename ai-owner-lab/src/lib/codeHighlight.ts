import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

export const CODE_LANGUAGES = [
  { id: 'plaintext', label: 'Plain text' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
  { id: 'yaml', label: 'YAML' },
  { id: 'html', label: 'HTML' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'json', label: 'JSON' },
  { id: 'css', label: 'CSS' },
  { id: 'bash', label: 'Bash' },
  { id: 'markdown', label: 'Markdown' },
] as const

export type CodeLanguageId = (typeof CODE_LANGUAGES)[number]['id']

const ALIASES: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  yml: 'yaml',
  sh: 'bash',
  shell: 'bash',
  md: 'markdown',
  text: 'plaintext',
  plain: 'plaintext',
  none: 'plaintext',
}

export function normalizeCodeLanguage(raw: string | null | undefined): string {
  const value = (raw || 'plaintext').trim().toLowerCase()
  if (!value) return 'plaintext'
  return ALIASES[value] || value
}

export function isKnownCodeLanguage(lang: string): boolean {
  const id = normalizeCodeLanguage(lang)
  return CODE_LANGUAGES.some((item) => item.id === id) || hljs.getLanguage(id) != null
}

/** Highlight a single code string. Returns HTML (escaped + spans). */
export function highlightCode(code: string, language?: string | null): string {
  const lang = normalizeCodeLanguage(language)
  if (!code) return ''
  if (lang === 'plaintext' || !hljs.getLanguage(lang)) {
    return escapeHtml(code)
  }
  try {
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
  } catch {
    return escapeHtml(code)
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function detectLangFromEl(el: Element): string {
  return (
    normalizeCodeLanguage(
      el.getAttribute('data-lang') ||
        el.closest('pre')?.getAttribute('data-lang') ||
        [...el.classList].find((c) => c.startsWith('language-'))?.slice('language-'.length) ||
        [...(el.closest('pre')?.classList || [])]
          .find((c) => c.startsWith('language-'))
          ?.slice('language-'.length),
    ) || 'plaintext'
  )
}

/** textContent drops <br>; contentEditable often inserts those inside <pre>. */
export function codeElementToPlainText(el: HTMLElement): string {
  let out = ''
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.nodeValue || ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const tag = (node as Element).tagName
    if (tag === 'BR') {
      out += '\n'
      return
    }
    for (const child of node.childNodes) walk(child)
    if (tag === 'DIV' || tag === 'P' || tag === 'LI') out += '\n'
  }
  walk(el)
  return out.replace(/\u00a0/g, ' ').replace(/\n+$/u, '')
}

/**
 * Recover structured code that lost newlines (e.g. "value"next_key: jammed together).
 * Only runs when the block has no real line breaks.
 */
export function restoreCollapsedCodeLines(code: string, _language?: string | null): string {
  if (!code || code.includes('\n')) return code
  if (!/:\s*"/.test(code) && !/:\s*\d/.test(code)) return code

  let next = code
  // "value"next_key:  →  "value"\nnext_key:
  next = next.replace(/("(?:\\.|[^"\\])*")(?=[A-Za-z_][\w.-]*\s*:)/g, '$1\n')
  // "value"- "item"  → list items on new lines
  next = next.replace(/("(?:\\.|[^"\\])*")(?=-\s*)/g, '$1\n')
  // yaml/json object close jammed: }key: or ]key:
  next = next.replace(/([}\]])(?=[A-Za-z_][\w.-]*\s*:)/g, '$1\n')
  // empty value jammed into next key: purpose:business_objective:
  next = next.replace(/(:)(?=[A-Za-z_][\w.-]*\s*:)/g, '$1\n')

  return next
}

function ensureCodeChild(pre: HTMLElement): HTMLElement {
  const existing = pre.querySelector(':scope > code')
  if (existing) return existing as HTMLElement
  const code = document.createElement('code')
  code.textContent = codeElementToPlainText(pre)
  pre.replaceChildren(code)
  return code
}

function paintCodeElement(code: HTMLElement, lang: string) {
  const source = restoreCollapsedCodeLines(codeElementToPlainText(code), lang)
  code.innerHTML = highlightCode(source, lang)
  code.classList.add('hljs', `language-${lang}`)
  code.setAttribute('data-lang', lang)
  const pre = code.closest('pre')
  if (pre) {
    pre.classList.add('notebook-code-block', `language-${lang}`)
    pre.setAttribute('data-lang', lang)
  }
}

/**
 * Apply syntax highlighting to <pre>/<code> nodes inside a DOM root.
 * Safe to call after sanitizeHtml. Handles bare <pre> (no <code> child).
 */
export function highlightCodeBlocksInElement(root: ParentNode) {
  const pres = root.querySelectorAll(
    'pre.notebook-code-block, pre[data-lang], pre[class*="language-"]',
  )
  pres.forEach((node) => {
    const pre = node as HTMLElement
    const code = ensureCodeChild(pre)
    paintCodeElement(code, detectLangFromEl(pre) || detectLangFromEl(code))
  })

  // Inline / leftover code blocks not already covered via pre.
  root.querySelectorAll('code.notebook-code, code[class*="language-"]').forEach((node) => {
    const code = node as HTMLElement
    if (code.closest('pre')) return
    paintCodeElement(code, detectLangFromEl(code))
  })
}

/** Sanitize-friendly: collapse highlighted spans back to plain text in code blocks. */
export function plainifyCodeBlocksInElement(root: ParentNode) {
  root
    .querySelectorAll('pre.notebook-code-block, pre[data-lang], pre[class*="language-"]')
    .forEach((node) => {
      const pre = node as HTMLElement
      const lang = detectLangFromEl(pre)
      const text = restoreCollapsedCodeLines(codeElementToPlainText(pre), lang)
      const code = document.createElement('code')
      code.className = `language-${lang}`
      code.setAttribute('data-lang', lang)
      code.textContent = text
      pre.replaceChildren(code)
      pre.className = `notebook-code-block language-${lang}`
      pre.setAttribute('data-lang', lang)
    })

  root.querySelectorAll('code.notebook-code, code[class*="language-"]').forEach((node) => {
    const code = node as HTMLElement
    if (code.closest('pre')) return
    const lang = detectLangFromEl(code)
    const text = restoreCollapsedCodeLines(codeElementToPlainText(code), lang)
    code.replaceChildren(document.createTextNode(text))
    code.className = `notebook-code language-${lang}`
    code.setAttribute('data-lang', lang)
  })
}
