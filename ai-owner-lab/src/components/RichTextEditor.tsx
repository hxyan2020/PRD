import { useEffect, useId, useRef, useState } from 'react'
import { sanitizeHtml } from '../lib/sanitizeHtml'
import { fileToNoteImageDataUrl, isAllowedImageMime } from '../lib/noteImage'
import { useLanguage } from '../i18n/LanguageContext'

const COLORS = [
  { value: '#14212b', labelKey: 'editorColorInk' as const },
  { value: '#0f766e', labelKey: 'editorColorTeal' as const },
  { value: '#b45309', labelKey: 'editorColorAmber' as const },
  { value: '#b91c1c', labelKey: 'editorColorRed' as const },
  { value: '#1d4ed8', labelKey: 'editorColorBlue' as const },
  { value: '#6d28d9', labelKey: 'editorColorViolet' as const },
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

function hasVisibleContent(html: string): boolean {
  if (!html) return false
  if (/<img\b/i.test(html)) return true
  return Boolean(html.replace(/<br\s*\/?>|&nbsp;|\s|<\/?[^>]+>/gi, '').trim())
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
  const lastHtml = useRef(value)
  const placeholderId = useId()
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)

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
  }, [autoFocus])

  function emitChange() {
    const el = editorRef.current
    if (!el) return
    const html = sanitizeHtml(el.innerHTML)
    if (html === lastHtml.current) return
    lastHtml.current = html
    onChange(html)
  }

  function withFocus(action: () => void) {
    editorRef.current?.focus()
    action()
    emitChange()
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
        // insertHTML keeps surrounding text; fallback for older engines
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
          onClick={() => withFocus(() => runCommand('insertUnorderedList'))}
        >
          •≡
        </button>
        <button
          type="button"
          className="rte-btn"
          title={t('editorNumbered')}
          aria-label={t('editorNumbered')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => withFocus(() => runCommand('insertOrderedList'))}
        >
          1.
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <label className="rte-select-wrap">
          <span className="sr-only">{t('editorFontSize')}</span>
          <select
            className="rte-select"
            defaultValue="3"
            aria-label={t('editorFontSize')}
            onMouseDown={(e) => e.stopPropagation()}
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
            onMouseDown={(e) => e.stopPropagation()}
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
        <span className="rte-sep" aria-hidden="true" />
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
          onInput={emitChange}
          onBlur={emitChange}
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
          }}
        />
      </div>
    </div>
  )
}
