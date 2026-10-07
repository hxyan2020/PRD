import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import { ExplainDrawer } from './ExplainDrawer'

interface ToolbarState {
  text: string
  x: number
  y: number
}

export function SelectionTools() {
  const location = useLocation()
  const notebook = useNotebook()
  const { lang, t } = useLanguage()
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null)
  const [flash, setFlash] = useState('')
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainText, setExplainText] = useState('')

  useEffect(() => {
    const onMouseUp = () => {
      window.setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
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
        const rect = range.getBoundingClientRect()
        if (!rect.width && !rect.height) {
          setToolbar(null)
          return
        }
        setToolbar({
          text,
          x: Math.min(window.innerWidth - 180, Math.max(12, rect.left + rect.width / 2 - 90)),
          y: Math.max(12, rect.top + window.scrollY - 52),
        })
      }, 10)
    }

    const onScroll = () => setToolbar(null)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keyup', onMouseUp)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keyup', onMouseUp)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  const source = sourceFromPath(location.pathname, lang, t)

  function saveClip() {
    if (!toolbar) return
    notebook.addClip({
      selectedText: toolbar.text,
      sourceLabel: source.label,
      sourcePath: source.path,
    })
    setFlash(t('savedToNotebook'))
    setToolbar(null)
    window.setTimeout(() => setFlash(''), 1800)
  }

  function openExplain() {
    if (!toolbar) return
    setExplainText(toolbar.text)
    setExplainOpen(true)
    setToolbar(null)
  }

  return (
    <>
      {toolbar ? (
        <div className="selection-toolbar" style={{ left: toolbar.x, top: toolbar.y }}>
          <button type="button" onClick={saveClip}>
            {t('addToNotebook')}
          </button>
          <button type="button" onClick={openExplain}>
            {t('explainWithAI')}
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

function sourceFromPath(
  pathname: string,
  lang: 'en' | 'zh',
  t: (key: 'day' | 'navGlossary' | 'navUseCases' | 'navOps' | 'navCareer' | 'navCurriculum' | 'navTracker') => string,
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
      'input, textarea, button, .selection-toolbar, .drawer-panel, .nav, .topbar, .day-check, .board-check, .lang-switch',
    ),
  )
}
