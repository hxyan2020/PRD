import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { CODE_LANGUAGES, type CodeLanguageId } from '../lib/codeHighlight'
import { sanitizeHtml } from '../lib/sanitizeHtml'
import { fileToNoteImageDataUrl, isAllowedImageMime } from '../lib/noteImage'
import { clearHighlightInRange, highlightRange } from '../lib/rangeHighlight'
import { useLanguage } from '../i18n/LanguageContext'

const COLORS = [
  { value: '#14212b', labelKey: 'editorColorInk' as const },
  { value: '#0f766e', labelKey: 'editorColorTeal' as const },
  { value: '#b45309', labelKey: 'editorColorAmber' as const },
  { value: '#b91c1c', labelKey: 'editorColorRed' as const },
  { value: '#1d4ed8', labelKey: 'editorColorBlue' as const },
  { value: '#6d28d9', labelKey: 'editorColorViolet' as const },
]

const HIGHLIGHTS = [
  { value: '#fde68a', labelKey: 'editorHighlightYellow' as const },
  { value: '#bbf7d0', labelKey: 'editorHighlightGreen' as const },
  { value: '#bae6fd', labelKey: 'editorHighlightBlue' as const },
  { value: '#fecdd3', labelKey: 'editorHighlightRose' as const },
  { value: '#e9d5ff', labelKey: 'editorHighlightViolet' as const },
]

const SIZES = [
  { value: '3', labelKey: 'editorSizeNormal' as const },
  { value: '2', labelKey: 'editorSizeSmall' as const },
  { value: '4', labelKey: 'editorSizeLarge' as const },
  { value: '5', labelKey: 'editorSizeXLarge' as const },
]

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  autoFocus?: boolean
  ariaLabel?: string
}

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
}

function closestListItem(node: Node | null): HTMLLIElement | null {
  const el = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement
  return el?.closest('li') ?? null
}

function selectedListItems(editor: HTMLElement | null): HTMLLIElement[] {
  const selection = window.getSelection()
  if (!editor || !selection || !selection.rangeCount) return []
  const range = selection.getRangeAt(0)
  const startLi = closestListItem(range.startContainer)
  if (selection.isCollapsed) return startLi && editor.contains(startLi) ? [startLi] : []
  const items = [...editor.querySelectorAll('li')].filter((li) => {
    try {
      return selection.containsNode(li, true)
    } catch {
      return false
    }
  })
  if (items.length) return items
  return startLi && editor.contains(startLi) ? [startLi] : []
}

function lastChildList(li: HTMLLIElement): HTMLElement | null {
  const last = li.lastElementChild
  if (last && (last.tagName === 'UL' || last.tagName === 'OL')) return last as HTMLElement
  return null
}

function nestListItems(items: HTMLLIElement[], tag: 'UL' | 'OL') {
  for (const li of items) {
    const prev = li.previousElementSibling
    if (!prev || prev.tagName !== 'LI') continue
    const parentLi = prev as HTMLLIElement
    let nested = lastChildList(parentLi)
    if (!nested) {
      nested = document.createElement(tag.toLowerCase())
      parentLi.appendChild(nested)
    }
    nested.appendChild(li)
  }
}

function unnestListItems(items: HTMLLIElement[]) {
  // Outermost last so moving one doesn't skip siblings.
  for (const li of [...items].reverse()) {
    const list = li.parentElement
    if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) continue
    const parentLi = list.parentElement
    if (!parentLi || parentLi.tagName !== 'LI') {
      runCommand('outdent')
      continue
    }
    parentLi.after(li)
    if (!list.children.length) list.remove()
  }
}

function applyList(editor: HTMLElement | null, tag: 'UL' | 'OL') {
  const items = selectedListItems(editor)
  if (!items.length) {
    runCommand(tag === 'UL' ? 'insertUnorderedList' : 'insertOrderedList')
    return
  }
  const alreadyThisType = items.every((li) => li.parentElement?.tagName === tag)
  const canNest = items.some((li) => li.previousElementSibling?.tagName === 'LI')
  if (alreadyThisType && canNest) {
    nestListItems(items, tag)
    return
  }
  if (!alreadyThisType && canNest) {
    nestListItems(items, tag)
    return
  }
  runCommand(tag === 'UL' ? 'insertUnorderedList' : 'insertOrderedList')
}

function hasVisibleContent(html: string): boolean {
  if (!html) return false
  if (/<(img|table|pre|code)\b/i.test(html)) return true
  return Boolean(html.replace(/<br\s*\/?>|&nbsp;|\s|<\/?[^>]+>/gi, '').trim())
}

function buildTableHtml(rows: number, cols: number): string {
  const safeRows = Math.min(12, Math.max(2, rows))
  const safeCols = Math.min(8, Math.max(2, cols))
  const header = Array.from({ length: safeCols }, (_, i) => `<th>H${i + 1}</th>`).join('')
  const body = Array.from({ length: safeRows - 1 }, () => {
    const cells = Array.from({ length: safeCols }, () => '<td><br></td>').join('')
    return `<tr>${cells}</tr>`
  }).join('')
  return `<table class="notebook-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table><p><br></p>`
}

function buildCodeBlockHtml(language: CodeLanguageId, sample = ''): string {
  const lang = language || 'plaintext'
  const body = sample || (lang === 'plaintext' ? '// code' : sampleForLanguage(lang))
  return `<pre class="notebook-code-block language-${lang}" data-lang="${lang}"><code class="language-${lang}" data-lang="${lang}">${escapeForInsert(body)}</code></pre><p><br></p>`
}

function escapeForInsert(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sampleForLanguage(lang: string): string {
  switch (lang) {
    case 'python':
      return 'def hello(name: str) -> str:\n    return f"hi {name}"'
    case 'sql':
      return 'SELECT id, name\nFROM users\nWHERE active = TRUE;'
    case 'yaml':
      return 'service: ownlab\nreplicas: 3\nenv:\n  - name: MODE\n    value: prod'
    case 'html':
      return '<section class="card">\n  <h2>Title</h2>\n</section>'
    case 'javascript':
    case 'typescript':
      return "const total = items.reduce((sum, n) => sum + n, 0)\nconsole.log(total)"
    case 'json':
      return '{\n  "status": "ok",\n  "count": 3\n}'
    case 'css':
      return '.card {\n  padding: 1rem;\n  border-radius: 0.5rem;\n}'
    case 'bash':
      return 'npm run build\nrsync -av dist/ ./ownlab/'
    case 'markdown':
      return '# Heading\n\n- item one\n- item two'
    default:
      return '// code'
  }
}

function insertHtmlAtSelection(html: string, editor: HTMLElement | null) {
  if (!document.execCommand('insertHTML', false, html) && editor) {
    editor.insertAdjacentHTML('beforeend', html)
  }
}

function selectionInsideCode(editor: HTMLElement | null): HTMLElement | null {
  const selection = window.getSelection()
  if (!editor || !selection || !selection.rangeCount) return null
  const node = selection.getRangeAt(0).startContainer
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  const code = el?.closest('pre, code')
  return code && editor.contains(code) ? (code as HTMLElement) : null
}

function applyHighlightColor(color: string, editor: HTMLElement | null) {
  const selection = window.getSelection()
  if (!selection || !selection.rangeCount || selection.isCollapsed) return
  const range = selection.getRangeAt(0)
  if (color === 'transparent') {
    clearHighlightInRange(range, editor)
    return
  }
  // Text-node wrapping works across multiple list rows / bullets.
  if (highlightRange(range, color)) return
  // Fallback for odd browser selections.
  document.execCommand('hiliteColor', false, color) ||
    document.execCommand('backColor', false, color)
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '8rem',
  autoFocus,
  ariaLabel,
}: Props) {
  const { t } = useLanguage()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const savedRange = useRef<Range | null>(null)
  const lastHtml = useRef(value)
  const placeholderId = useId()
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguageId>('python')
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ''
      lastHtml.current = value
    }
  }, [value])

  useEffect(() => {
    if (!autoFocus) return
    const el = editorRef.current
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    savedRange.current = range.cloneRange()
  }, [autoFocus])

  function captureSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || !selection.rangeCount) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return
    savedRange.current = range.cloneRange()
  }

  function restoreSelection(): boolean {
    const editor = editorRef.current
    const range = savedRange.current
    if (!editor || !range) return false
    editor.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    try {
      selection?.addRange(range)
      return Boolean(selection && !selection.isCollapsed)
    } catch {
      return false
    }
  }

  function emitChange() {
    const el = editorRef.current
    if (!el) return
    const html = sanitizeHtml(el.innerHTML)
    if (html === lastHtml.current) return
    lastHtml.current = html
    onChange(html)
  }

  function withFocus(action: () => void) {
    restoreSelection()
    editorRef.current?.focus()
    action()
    emitChange()
    captureSelection()
  }

  async function insertImageFile(file: Blob) {
    if (!isAllowedImageMime(file.type || '')) {
      setImageError(t('editorImageTypeError'))
      return
    }
    setImageBusy(true)
    setImageError(null)
    try {
      const dataUrl = await fileToNoteImageDataUrl(file)
      withFocus(() => {
        const safe = sanitizeHtml(
          `<img src="${dataUrl}" alt="" style="max-width: 100%; height: auto" />`,
        )
        if (!document.execCommand('insertHTML', false, safe)) {
          const el = editorRef.current
          if (!el) return
          el.insertAdjacentHTML('beforeend', safe)
        }
      })
    } catch {
      setImageError(t('editorImageTooLarge'))
    } finally {
      setImageBusy(false)
    }
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await insertImageFile(file)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const empty = !hasVisibleContent(value)

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label={t('editorToolbar')}>
        <button
          type="button"
          className="rte-btn"
          title={t('editorBold')}
          aria-label={t('editorBold')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => runCommand('bold'))}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="rte-btn"
          title={t('editorItalic')}
          aria-label={t('editorItalic')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => runCommand('italic'))}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="rte-btn"
          title={t('editorUnderline')}
          aria-label={t('editorUnderline')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => runCommand('underline'))}
        >
          <span className="rte-u">U</span>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button
          type="button"
          className="rte-btn"
          title={t('editorBullet')}
          aria-label={t('editorBullet')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => applyList(editorRef.current, 'UL'))}
        >
          •≡
        </button>
        <button
          type="button"
          className="rte-btn"
          title={t('editorNumbered')}
          aria-label={t('editorNumbered')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => applyList(editorRef.current, 'OL'))}
        >
          1.
        </button>
        <button
          type="button"
          className="rte-btn"
          title={`${t('editorIndent')} (Tab)`}
          aria-label={t('editorIndent')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            withFocus(() => {
              const items = selectedListItems(editorRef.current)
              const tag = items[0]?.parentElement?.tagName === 'OL' ? 'OL' : 'UL'
              nestListItems(items, tag)
            })
          }
        >
          ⇥
        </button>
        <button
          type="button"
          className="rte-btn"
          title={`${t('editorOutdent')} (Shift+Tab)`}
          aria-label={t('editorOutdent')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => unnestListItems(selectedListItems(editorRef.current)))}
        >
          ⇤
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <label className="rte-select-wrap">
          <span className="sr-only">{t('editorFontSize')}</span>
          <select
            className="rte-select"
            defaultValue="3"
            aria-label={t('editorFontSize')}
            onMouseDown={() => captureSelection()}
            onFocus={() => captureSelection()}
            onChange={(e) => {
              const size = e.target.value
              withFocus(() => runCommand('fontSize', size))
            }}
          >
            {SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {t(size.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="rte-select-wrap">
          <span className="sr-only">{t('editorTextColor')}</span>
          <select
            className="rte-select"
            defaultValue={COLORS[0].value}
            aria-label={t('editorTextColor')}
            onMouseDown={() => captureSelection()}
            onFocus={() => captureSelection()}
            onChange={(e) => {
              const color = e.target.value
              withFocus(() => runCommand('foreColor', color))
            }}
          >
            {COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {t(color.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <div
          className="rte-highlight-swatches"
          role="group"
          aria-label={t('editorHighlight')}
        >
          {HIGHLIGHTS.map((color) => (
            <button
              key={color.value}
              type="button"
              className="rte-highlight-swatch"
              title={t(color.labelKey)}
              aria-label={t(color.labelKey)}
              style={{ '--hl-swatch': color.value } as CSSProperties}
              onMouseDown={(e) => {
                e.preventDefault()
                captureSelection()
              }}
              onClick={() =>
                withFocus(() => applyHighlightColor(color.value, editorRef.current))
              }
            />
          ))}
          <button
            type="button"
            className="rte-highlight-swatch none"
            title={t('editorHighlightNone')}
            aria-label={t('editorHighlightNone')}
            onMouseDown={(e) => {
              e.preventDefault()
              captureSelection()
            }}
            onClick={() =>
              withFocus(() => applyHighlightColor('transparent', editorRef.current))
            }
          >
            /
          </button>
        </div>
        <span className="rte-sep" aria-hidden="true" />
        <div className="rte-table-controls" role="group" aria-label={t('editorInsertTable')}>
          <label className="rte-select-wrap rte-table-size">
            <span className="sr-only">{t('editorTableRows')}</span>
            <select
              className="rte-select"
              value={tableRows}
              aria-label={t('editorTableRows')}
              onMouseDown={() => captureSelection()}
              onFocus={() => captureSelection()}
              onChange={(e) => setTableRows(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
          <label className="rte-select-wrap rte-table-size">
            <span className="sr-only">{t('editorTableCols')}</span>
            <select
              className="rte-select"
              value={tableCols}
              aria-label={t('editorTableCols')}
              onMouseDown={() => captureSelection()}
              onFocus={() => captureSelection()}
              onChange={(e) => setTableCols(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  ×{n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rte-btn"
            title={t('editorInsertTable')}
            aria-label={t('editorInsertTable')}
            onMouseDown={(e) => {
              e.preventDefault()
              captureSelection()
            }}
            onClick={() =>
              withFocus(() =>
                insertHtmlAtSelection(
                  sanitizeHtml(buildTableHtml(tableRows, tableCols)),
                  editorRef.current,
                ),
              )
            }
          >
            ▦
          </button>
        </div>
        <div className="rte-code-controls" role="group" aria-label={t('editorInsertCode')}>
          <label className="rte-select-wrap">
            <span className="sr-only">{t('editorCodeLanguage')}</span>
            <select
              className="rte-select rte-code-lang"
              value={codeLanguage}
              aria-label={t('editorCodeLanguage')}
              onMouseDown={() => captureSelection()}
              onFocus={() => captureSelection()}
              onChange={(e) => setCodeLanguage(e.target.value as CodeLanguageId)}
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rte-btn"
            title={t('editorInsertCode')}
            aria-label={t('editorInsertCode')}
            onMouseDown={(e) => {
              e.preventDefault()
              captureSelection()
            }}
            onClick={() =>
              withFocus(() =>
                insertHtmlAtSelection(
                  sanitizeHtml(buildCodeBlockHtml(codeLanguage)),
                  editorRef.current,
                ),
              )
            }
          >
            {'</>'}
          </button>
        </div>
        <button
          type="button"
          className="rte-btn rte-btn-image"
          title={t('editorInsertImage')}
          aria-label={t('editorInsertImage')}
          disabled={imageBusy}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <span aria-hidden="true" className="rte-image-glyph" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => void onPickFiles(e.target.files)}
        />
        <button
          type="button"
          className="rte-btn"
          title={t('editorClear')}
          aria-label={t('editorClear')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => runCommand('removeFormat'))}
        >
          ⌫
        </button>
      </div>
      {imageError ? (
        <p className="rte-image-error" role="alert">
          {imageError}
        </p>
      ) : null}
      {imageBusy ? (
        <p className="rte-image-status" role="status">
          {t('editorImageProcessing')}
        </p>
      ) : null}

      <div
        className="rte-shell"
        onDragOver={(e) => {
          if ([...e.dataTransfer.types].includes('Files')) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }
        }}
        onDrop={(e) => {
          const files = e.dataTransfer.files
          if (!files?.length) return
          const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
          if (!images.length) return
          e.preventDefault()
          void (async () => {
            for (const file of images) await insertImageFile(file)
          })()
        }}
      >
        {empty ? (
          <div className="rte-placeholder" id={placeholderId} aria-hidden="true">
            {placeholder}
          </div>
        ) : null}
        <div
          ref={editorRef}
          className="rte-editor"
          style={{ minHeight }}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel || placeholder}
          aria-describedby={empty ? placeholderId : undefined}
          suppressContentEditableWarning
          onInput={() => {
            captureSelection()
            emitChange()
          }}
          onBlur={emitChange}
          onKeyUp={captureSelection}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && selectionInsideCode(editorRef.current)) {
              e.preventDefault()
              // Keep newlines inside code blocks instead of splitting the <pre>.
              runCommand('insertText', '\n')
              emitChange()
              captureSelection()
              return
            }
            if (e.key !== 'Tab') return
            if (selectionInsideCode(editorRef.current)) {
              e.preventDefault()
              runCommand('insertText', '  ')
              emitChange()
              captureSelection()
              return
            }
            const items = selectedListItems(editorRef.current)
            if (!items.length) return
            e.preventDefault()
            captureSelection()
            withFocus(() => {
              if (e.shiftKey) unnestListItems(items)
              else nestListItems(items, items[0]?.parentElement?.tagName === 'OL' ? 'OL' : 'UL')
            })
          }}
          onMouseUp={captureSelection}
          onSelect={captureSelection}
          onPaste={(e) => {
            const items = e.clipboardData?.items
            const imageItems = items
              ? Array.from(items).filter((item) => item.type.startsWith('image/'))
              : []
            if (imageItems.length) {
              e.preventDefault()
              void (async () => {
                for (const item of imageItems) {
                  const file = item.getAsFile()
                  if (file) await insertImageFile(file)
                }
              })()
              return
            }
            e.preventDefault()
            const text = e.clipboardData.getData('text/plain')
            runCommand('insertText', text)
            emitChange()
            captureSelection()
          }}
        />
      </div>
    </div>
  )
}
