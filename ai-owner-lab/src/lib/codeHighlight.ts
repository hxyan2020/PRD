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

/**
 * Apply syntax highlighting to <pre><code> / <code> nodes inside a DOM root.
 * Safe to call after sanitizeHtml.
 */
export function highlightCodeBlocksInElement(root: ParentNode) {
  const blocks = root.querySelectorAll('pre code, code.notebook-code, code[class*="language-"]')
  blocks.forEach((node) => {
    const code = node as HTMLElement
    // Skip nested code inside already-processed pre>code (query may hit both)
    if (code.tagName === 'CODE' && code.parentElement?.tagName !== 'PRE' && !code.classList.contains('notebook-code')) {
      // inline code — leave as plain escaped text
      return
    }
    const lang =
      normalizeCodeLanguage(
        code.getAttribute('data-lang') ||
          code.closest('pre')?.getAttribute('data-lang') ||
          [...code.classList].find((c) => c.startsWith('language-'))?.slice('language-'.length) ||
          [...(code.closest('pre')?.classList || [])]
            .find((c) => c.startsWith('language-'))
            ?.slice('language-'.length),
      ) || 'plaintext'

    const source = code.textContent || ''
    code.innerHTML = highlightCode(source, lang)
    code.classList.add('hljs')
    code.classList.add(`language-${lang}`)
    code.setAttribute('data-lang', lang)
    const pre = code.closest('pre')
    if (pre) {
      pre.classList.add('notebook-code-block')
      pre.setAttribute('data-lang', lang)
    }
  })
}

/** Sanitize-friendly: collapse highlighted spans back to plain text in code blocks. */
export function plainifyCodeBlocksInElement(root: ParentNode) {
  root.querySelectorAll('pre code, code.notebook-code').forEach((node) => {
    const code = node as HTMLElement
    const lang = normalizeCodeLanguage(
      code.getAttribute('data-lang') ||
        code.closest('pre')?.getAttribute('data-lang') ||
        [...code.classList].find((c) => c.startsWith('language-'))?.slice('language-'.length),
    )
    const text = code.textContent || ''
    code.replaceChildren(document.createTextNode(text))
    code.className = `language-${lang}`
    code.setAttribute('data-lang', lang)
    const pre = code.closest('pre')
    if (pre) {
      pre.className = `notebook-code-block language-${lang}`
      pre.setAttribute('data-lang', lang)
    }
  })
}
