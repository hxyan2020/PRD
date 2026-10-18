import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import {
  highlightSelectionInNotebookQuote,
  selectionIsInNotebookQuote,
} from '../lib/highlightSelection'
import { ExplainDrawer } from './ExplainDrawer'

interface ToolbarState {
  text: string
  x: number
  y: number
  placeBelow: boolean
  canHighlightNote: boolean
}

const TOOLBAR_W = 196
const TOOLBAR_W_HIGHLIGHT = 278
const TOOLBAR_H = 52

export function SelectionTools() {
  const location = useLocation()
  const notebook = useNotebook()
  const { lang, t } = useLanguage()
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null)
  const [flash, setFlash] = useState('')
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainText, setExplainText] = useState('')
  const hideTimer = useRef<number | null>(null)
  const showTimer = useRef<number | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const holdingToolbar = useRef(false)

  useEffect(() => {
    const clearShowTimer = () => {
      if (showTimer.current != null) {
        window.clearTimeout(showTimer.current)
        showTimer.current = null
      }
    }

    const syncFromSelection = () => {
      if (holdingToolbar.current) return
      clearShowTimer()
      // Android finalizes the native selection after touchend; wait a beat.
      showTimer.current = window.setTimeout(() => {
        if (holdingToolbar.current) return
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
          setToolbar(null)
          return
        }
        const text = selection.toString().trim()
        if (text.length < 2 || text.length > 4000) {
          setToolbar(null)
          return
        }
        const anchor = selection.anchorNode
        if (anchor && isInsideUiChrome(anchor)) {
          setToolbar(null)
          return
        }
        const range = selection.getRangeAt(0)
        let rect = pickVisibleRect(range)
        if (!rect) {
          // Selection may be off-screen after long-press scroll; bring it into view.
          const anchorEl =
            range.startContainer.nodeType === Node.ELEMENT_NODE
              ? (range.startContainer as Element)
              : range.startContainer.parentElement
          anchorEl?.scrollIntoView({ block: 'center', inline: 'nearest' })
          rect = pickVisibleRect(range) ?? range.getBoundingClientRect()
        }
        if (!rect.width && !rect.height) {
          setToolbar(null)
          return
        }

        const canHighlightNote = selectionIsInNotebookQuote()
        const width = canHighlightNote ? TOOLBAR_W_HIGHLIGHT : TOOLBAR_W
        const x = Math.min(
          window.innerWidth - width - 12,
          Math.max(12, rect.left + rect.width / 2 - width / 2),
        )
        const preferAbove = rect.top - TOOLBAR_H - 10
        const placeBelow = preferAbove < 12
        const rawY = placeBelow ? rect.bottom + 10 : preferAbove
        const y = Math.min(
          window.innerHeight - TOOLBAR_H - 12,
          Math.max(12, rawY),
        )

        setToolbar({ text, x, y, placeBelow, canHighlightNote })
      }, 280)
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && toolbarRef.current?.contains(target)) return
      // Don’t clear immediately — selectionchange will refresh if a new selection starts.
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) setToolbar(null)
      }, 320)
    }

    document.addEventListener('selectionchange', syncFromSelection)
    document.addEventListener('mouseup', syncFromSelection)
    document.addEventListener('touchend', syncFromSelection, { passive: true })
    document.addEventListener('keyup', syncFromSelection)
    document.addEventListener('pointerdown', onPointerDown, true)

    return () => {
      clearShowTimer()
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current)
      document.removeEventListener('selectionchange', syncFromSelection)
      document.removeEventListener('mouseup', syncFromSelection)
      document.removeEventListener('touchend', syncFromSelection)
      document.removeEventListener('keyup', syncFromSelection)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  const source = sourceFromPath(location.pathname, lang, t)

  function saveClip() {
    if (!toolbar) return
    const text = toolbar.text
    const label = source.label
    const path = source.path
    setToolbar(null)
    window.getSelection()?.removeAllRanges()
    void notebook
      .addClip({
        selectedText: text,
        sourceLabel: label,
        sourcePath: path,
      })
      .then(() => {
        setFlash(t('savedToNotebook'))
        window.setTimeout(() => setFlash(''), 1800)
      })
      .catch(() => {
        setFlash(t('noteSaveFailed'))
        window.setTimeout(() => setFlash(''), 2200)
      })
  }

  function openExplain() {
    if (!toolbar) return
    setExplainText(toolbar.text)
    setExplainOpen(true)
    setToolbar(null)
    window.getSelection()?.removeAllRanges()
  }

  function highlightInNote() {
    if (!toolbar?.canHighlightNote) return
    const result = highlightSelectionInNotebookQuote('#fde68a')
    if (!result) return
    setToolbar(null)
    void notebook
      .updateEntry(result.entryId, { selectedText: result.html })
      .then((updated) => {
        if (!updated) return
        setFlash(t('highlightedInNote'))
        window.setTimeout(() => setFlash(''), 1800)
      })
      .catch(() => {
        setFlash(t('noteSaveFailed'))
        window.setTimeout(() => setFlash(''), 2200)
      })
  }

  return (
    <>
      {toolbar ? (
        <div
          ref={toolbarRef}
          className={`selection-toolbar ${toolbar.placeBelow ? 'below' : 'above'}${
            toolbar.canHighlightNote ? ' with-highlight' : ''
          }`}
          style={{ left: toolbar.x, top: toolbar.y }}
          role="toolbar"
          aria-label={t('selectionToolbar')}
        >
          {toolbar.canHighlightNote ? (
            <button
              type="button"
              className="selection-action highlight"
              onPointerDown={(event) => {
                holdingToolbar.current = true
                event.preventDefault()
              }}
              onPointerUp={() => {
                holdingToolbar.current = false
              }}
              onClick={highlightInNote}
            >
              <HighlightIcon />
              <span>{t('highlightSelection')}</span>
            </button>
          ) : null}
          <button
            type="button"
            className="selection-action"
            onPointerDown={(event) => {
              holdingToolbar.current = true
              event.preventDefault()
            }}
            onPointerUp={() => {
              holdingToolbar.current = false
            }}
            onClick={saveClip}
          >
            <NotebookIcon />
            <span>{t('saveClip')}</span>
          </button>
          <button
            type="button"
            className="selection-action ai"
            onPointerDown={(event) => {
              holdingToolbar.current = true
              event.preventDefault()
            }}
            onPointerUp={() => {
              holdingToolbar.current = false
            }}
            onClick={openExplain}
          >
            <ChatbotIcon />
            <span>{t('askAI')}</span>
          </button>
        </div>
      ) : null}
      {flash ? <div className="notebook-toast">{flash}</div> : null}
      <ExplainDrawer
        open={explainOpen}
        selectedText={explainText}
        sourceLabel={source.label}
        sourcePath={source.path}
        onClose={() => setExplainOpen(false)}
      />
    </>
  )
}

function HighlightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 19h16v2H4zm2.75-3.5 2 .7 8.1-8.1-2-2-8.1 8.1zM16.4 4.85l1.4-1.4a1 1 0 0 1 1.4 0l1.35 1.35a1 1 0 0 1 0 1.4l-1.4 1.4z"
      />
    </svg>
  )
}

function NotebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 3.75A1.75 1.75 0 0 0 4.25 5.5v13A1.75 1.75 0 0 0 6 20.25h12A1.75 1.75 0 0 0 19.75 18.5v-13A1.75 1.75 0 0 0 18 3.75H6Zm.25 1.5h11.5v13H6.25v-13ZM8.5 8h7v1.5h-7V8Zm0 3.5h7V13h-7v-1.5Zm0 3.5h5V17h-5v-1.5Z"
      />
    </svg>
  )
}

function ChatbotIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.25c-4.56 0-8.25 3.13-8.25 7 0 2.18 1.18 4.13 3.05 5.45l-.7 3.15a.75.75 0 0 0 1.08.84l3.55-1.78c.72.14 1.47.22 2.27.22 4.56 0 8.25-3.13 8.25-7s-3.69-7-8.25-7Zm-3.1 5.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Zm3.1 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Zm3.1 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
      />
    </svg>
  )
}

function sourceFromPath(
  pathname: string,
  lang: 'en' | 'zh',
  t: (
    key:
      | 'day'
      | 'navGlossary'
      | 'navUseCases'
      | 'navOps'
      | 'navCareer'
      | 'navCurriculum'
      | 'navTracker',
  ) => string,
) {
  const day = pathname.match(/\/day\/(\d+)/)
  if (day) {
    return {
      label: lang === 'zh' ? `第 ${day[1]} 天` : `Day ${day[1]}`,
      path: pathname,
    }
  }
  if (pathname.startsWith('/glossary')) return { label: t('navGlossary'), path: pathname }
  if (pathname.startsWith('/use-cases')) return { label: t('navUseCases'), path: pathname }
  if (pathname.startsWith('/ops')) return { label: t('navOps'), path: pathname }
  if (pathname.startsWith('/career')) return { label: t('navCareer'), path: pathname }
  if (pathname.startsWith('/curriculum')) return { label: t('navCurriculum'), path: pathname }
  if (pathname.startsWith('/tracker')) return { label: t('navTracker'), path: pathname }
  return { label: 'OWNLAB', path: pathname }
}

function isInsideUiChrome(node: Node): boolean {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  if (!el) return false
  return Boolean(
    el.closest(
      'input, textarea, button, [contenteditable="true"], .rte, .selection-toolbar, .drawer-panel, .nav, .topbar, .day-check, .board-check, .lang-switch, .menu-toggle',
    ),
  )
}

function pickVisibleRect(range: Range): DOMRect | null {
  const rects = Array.from(range.getClientRects()).filter((r) => r.width || r.height)
  const candidates = rects.length ? rects : [range.getBoundingClientRect()]
  const vh = window.innerHeight
  const visible = candidates.find((r) => r.bottom > 8 && r.top < vh - 8)
  return visible ?? null
}
