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

type YamlTok =
  | { t: 'key'; name: string }
  | { t: 'string'; v: string }
  | { t: 'scalar'; v: string }
  | { t: 'dash' }

function readQuotedString(s: string, start: number): { raw: string; end: number } {
  let j = start + 1
  let raw = '"'
  while (j < s.length) {
    if (s[j] === '\\' && j + 1 < s.length) {
      raw += s[j]! + s[j + 1]!
      j += 2
      continue
    }
    raw += s[j]
    if (s[j] === '"') {
      j += 1
      break
    }
    j += 1
  }
  return { raw, end: j }
}

/** Read a balanced [...] or {...} value, including quoted strings inside. */
function readFlowCollection(s: string, start: number): { raw: string; end: number } {
  const open = s[start]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let j = start
  let raw = ''
  while (j < s.length) {
    const ch = s[j]!
    if (ch === '"') {
      const q = readQuotedString(s, j)
      raw += q.raw
      j = q.end
      continue
    }
    raw += ch
    if (ch === open) depth += 1
    else if (ch === close) {
      depth -= 1
      j += 1
      if (depth === 0) break
      continue
    }
    j += 1
  }
  return { raw, end: j }
}

function tokenizeYamlLike(input: string): YamlTok[] {
  const s = input.replace(/\r\n?/g, '\n')
  const tokens: YamlTok[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === '\n' || ch === ' ' || ch === '\t') {
      i += 1
      continue
    }
    if (ch === '-' && (i + 1 >= s.length || /[\sA-Za-z_"'\[]/.test(s[i + 1]!))) {
      tokens.push({ t: 'dash' })
      i += 1
      continue
    }
    if (ch === '"') {
      const q = readQuotedString(s, i)
      tokens.push({ t: 'string', v: q.raw })
      i = q.end
      continue
    }
    if (ch === '[' || ch === '{') {
      const flow = readFlowCollection(s, i)
      tokens.push({ t: 'scalar', v: flow.raw })
      i = flow.end
      continue
    }
    const key = s.slice(i).match(/^([A-Za-z_][\w.-]*):(?!\w)/)
    if (key) {
      tokens.push({ t: 'key', name: key[1]! })
      i += key[0].length
      continue
    }
    const scalar = s.slice(i).match(/^[^\s\[\]{}]+/)
    if (scalar) {
      tokens.push({ t: 'scalar', v: scalar[0]! })
      i += scalar[0].length
      continue
    }
    i += 1
  }
  return tokens
}

function keyShape(
  tokens: YamlTok[],
  index: number,
): 'leaf' | 'empty' | 'seq' | 'other' {
  const tok = tokens[index]
  if (!tok || tok.t !== 'key') return 'other'
  const next = tokens[index + 1]
  if (!next || next.t === 'key') return 'empty'
  if (next.t === 'dash') return 'seq'
  if (next.t === 'string' || next.t === 'scalar') return 'leaf'
  return 'other'
}

function lineLooksJammed(line: string): boolean {
  return /:\s*[A-Za-z_][\w.-]*\s*:/.test(line) || /:\s*-\s+\S/.test(line)
}

/**
 * Rebuild YAML with newlines + 2-space indentation from flattened / jammed text.
 * Preserves blocks that already include nested indentation.
 */
export function reindentYaml(code: string): string {
  const normalized = code.replace(/\t/g, '  ')
  const lines = normalized.split(/\r?\n/)
  const alreadyIndented = lines.some((l) => /^ {2,}\S/.test(l))
  const jammedLines = lines.filter((l) => lineLooksJammed(l))

  // Normal nested YAML (with indent) — keep as-is. Only rewrite truly jammed lines.
  if (alreadyIndented && jammedLines.length === 0) {
    return lines.map((l) => l.replace(/\s+$/u, '')).join('\n').replace(/\n+$/u, '')
  }
  if (alreadyIndented && jammedLines.length > 0) {
    return lines
      .map((line) => {
        if (!lineLooksJammed(line)) return line.replace(/\s+$/u, '')
        const indent = (line.match(/^ */)?.[0] || '').length
        const rebuilt = reindentYamlFlat(line.trim())
        return rebuilt
          .split('\n')
          .map((l, idx) => (idx === 0 ? ' '.repeat(indent) + l : ' '.repeat(indent) + l))
          .join('\n')
      })
      .join('\n')
      .replace(/\n+$/u, '')
  }

  return reindentYamlFlat(normalized)
}

/** Parse a flat / partially-flat YAML stream into indented lines. Never drops tokens. */
function reindentYamlFlat(normalized: string): string {
  const tokens = tokenizeYamlLike(normalized)
  if (!tokens.some((t) => t.t === 'key')) return normalized

  const out: string[] = []
  let i = 0
  const pad = (n: number) => '  '.repeat(Math.max(0, n))

  const peek = () => tokens[i]
  const take = () => tokens[i++]!

  const parseSeq = (indent: number) => {
    while (peek()?.t === 'dash') {
      take() // dash
      const next = peek()
      if (next?.t === 'key') {
        const shape = keyShape(tokens, i)
        if (shape === 'leaf') {
          const key = take() as Extract<YamlTok, { t: 'key' }>
          const val = take()
          const text = val.t === 'string' || val.t === 'scalar' ? val.v : ''
          out.push(`${pad(indent)}- ${key.name}: ${text}`)
          // Mapping fields under this list item (stop before numeric/bool leaves —
          // those usually belong to the parent map, e.g. timeout_seconds: 30).
          while (keyShape(tokens, i) === 'leaf') {
            const vPeek = tokens[i + 1]
            if (
              vPeek?.t === 'scalar' &&
              /^(true|false|null|-?\d+(?:\.\d+)?)$/i.test(vPeek.v)
            ) {
              break
            }
            const k = take() as Extract<YamlTok, { t: 'key' }>
            const v = take()
            const vt = v.t === 'string' || v.t === 'scalar' ? v.v : ''
            out.push(`${pad(indent + 1)}${k.name}: ${vt}`)
          }
        } else if (shape === 'empty') {
          const key = take() as Extract<YamlTok, { t: 'key' }>
          out.push(`${pad(indent)}- ${key.name}:`)
          parseMap(indent + 1, false)
        } else if (shape === 'seq') {
          const key = take() as Extract<YamlTok, { t: 'key' }>
          out.push(`${pad(indent)}- ${key.name}:`)
          parseSeq(indent + 1)
        } else {
          break
        }
      } else if (next?.t === 'string' || next?.t === 'scalar') {
        const val = take() as Extract<YamlTok, { t: 'string' | 'scalar' }>
        out.push(`${pad(indent)}- ${val.v}`)
      } else {
        break
      }
    }
  }

  /**
   * @param allowSiblingEmptyStop When true (nested under an empty key that only had leaves so far),
   *   stop before the next empty/seq key so it can be a sibling of the parent.
   */
  const remainingHasEmptyOrSeq = (from: number): boolean => {
    for (let j = from; j < tokens.length; j++) {
      if (tokens[j]?.t !== 'key') continue
      const sh = keyShape(tokens, j)
      if (sh === 'empty' || sh === 'seq') return true
      if (sh === 'leaf') j += 1
    }
    return false
  }

  const parseMap = (indent: number, allowSiblingEmptyStop: boolean) => {
    let seenLeaf = false
    let seenComplex = false
    while (peek()?.t === 'key') {
      const shape = keyShape(tokens, i)
      if (
        allowSiblingEmptyStop &&
        seenLeaf &&
        !seenComplex &&
        (shape === 'empty' || shape === 'seq')
      ) {
        // e.g. purpose: leaves… then trigger:  → trigger is sibling of purpose
        break
      }
      // Trailing root-level leaves after a nested section (decision_logic after investigation)
      if (
        allowSiblingEmptyStop &&
        seenComplex &&
        shape === 'leaf' &&
        !remainingHasEmptyOrSeq(i)
      ) {
        break
      }
      if (shape === 'leaf') {
        const key = take() as Extract<YamlTok, { t: 'key' }>
        const val = take()
        const text = val.t === 'string' || val.t === 'scalar' ? val.v : ''
        out.push(`${pad(indent)}${key.name}: ${text}`)
        seenLeaf = true
        continue
      }
      if (shape === 'empty') {
        const key = take() as Extract<YamlTok, { t: 'key' }>
        out.push(`${pad(indent)}${key.name}:`)
        parseMap(indent + 1, true)
        seenComplex = true
        continue
      }
      if (shape === 'seq') {
        const key = take() as Extract<YamlTok, { t: 'key' }>
        out.push(`${pad(indent)}${key.name}:`)
        parseSeq(indent + 1)
        seenComplex = true
        continue
      }
      break
    }
  }

  // Root: series of entries.
  while (i < tokens.length) {
    const before = i
    if (peek()?.t === 'key') {
      parseMap(0, false)
      if (i > before) continue
      // Parser made no progress — emit the key literally and advance.
      const key = take() as Extract<YamlTok, { t: 'key' }>
      out.push(`${key.name}:`)
      continue
    }
    if (peek()?.t === 'dash') {
      parseSeq(0)
      if (i === before) take()
      continue
    }
    // Unexpected token — emit as plain text so nothing is cut short.
    const tok = take()
    if (tok.t === 'key') out.push(`${tok.name}:`)
    else if (tok.t === 'dash') out.push('-')
    else out.push(tok.v)
  }

  // Safety: if anything remains, append it rather than truncating.
  if (i < tokens.length) {
    const rest = tokens
      .slice(i)
      .map((t) => {
        if (t.t === 'key') return `${t.name}:`
        if (t.t === 'dash') return '-'
        return t.v
      })
      .join(' ')
    if (rest.trim()) out.push(rest)
  }

  return out.join('\n')
}

/** Insert newlines at jammed structural boundaries (non-YAML fallback). */
function splitJammedStructuredLines(code: string): string {
  let next = code.replace(/\r\n?/g, '\n')
  next = next.replace(/("(?:\\.|[^"\\])*")\s*(?=[A-Za-z_][\w.-]*\s*:)/g, '$1\n')
  next = next.replace(/("(?:\\.|[^"\\])*")\s*(?=-\s+)/g, '$1\n')
  next = next.replace(/([A-Za-z_][\w.-]*:)\s*(?=[A-Za-z_][\w.-]*\s*:)/g, '$1\n')
  next = next.replace(/([A-Za-z_][\w.-]*:)\s*(?=-\s+)/g, '$1\n')
  next = next.replace(
    /(:\s*(?:true|false|null|-?\d+(?:\.\d+)?))\s*(?=[A-Za-z_][\w.-]*\s*:|-\s+)/gi,
    '$1\n',
  )
  next = next.replace(/([}\]])\s*(?=[A-Za-z_][\w.-]*\s*:)/g, '$1\n')
  next = next.replace(/(-\s+"(?:\\.|[^"\\])*")\s*(?=-\s+)/g, '$1\n')
  return next
}

/**
 * Recover structured code: restore newlines and YAML indentation when flattened.
 */
export function restoreCollapsedCodeLines(code: string, language?: string | null): string {
  if (!code) return code
  const lang = normalizeCodeLanguage(language)
  const hasStructure =
    /:\s*"/.test(code) || /:\s*\d/.test(code) || /:\s*[A-Za-z_][\w.-]*\s*:/.test(code)
  if (!hasStructure && !code.includes('\n')) return code

  if (lang === 'yaml' || lang === 'yml') {
    return reindentYaml(code)
  }

  if (!code.includes('\n') || /"[A-Za-z_][\w.-]*\s*:/.test(code) || /:[A-Za-z_][\w.-]*\s*:/.test(code)) {
    return splitJammedStructuredLines(code)
  }
  return code
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
