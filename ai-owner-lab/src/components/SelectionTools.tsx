import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotebook } from '../hooks/useNotebook'
import { ExplainDrawer } from './ExplainDrawer'

interface ToolbarState {
  text: string
  x: number
  y: number
}

function sourceFromPath(pathname: string): { label?: string; path: string } {
  const day = pathname.match(/\/day\/(\d+)/)
  if (day) return { label: `Day ${day[1]}`, path: pathname }
  if (pathname.startsWith('/glossary')) return { label: 'Glossary', path: pathname }
  if (pathname.startsWith('/use-cases')) return { label: 'Use cases', path: pathname }
  if (pathname.startsWith('/ops')) return { label: 'Ops playbook', path: pathname }
  if (pathname.startsWith('/career')) return { label: 'Career', path: pathname }
  if (pathname.startsWith('/curriculum')) return { label: 'Curriculum', path: pathname }
  if (pathname.startsWith('/tracker')) return { label: 'Tracker', path: pathname }
  return { label: 'OWNLAB', path: pathname }
}

export function SelectionTools() {
  const location = useLocation()
  const notebook = useNotebook()
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

  const source = sourceFromPath(location.pathname)

  function saveClip() {
    if (!toolbar) return
    notebook.addClip({
      selectedText: toolbar.text,
      sourceLabel: source.label,
      sourcePath: source.path,
    })
    setFlash('Saved to notebook')
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
            Add to notebook
          </button>
          <button type="button" onClick={openExplain}>
            Explain with AI
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

function isInsideUiChrome(node: Node): boolean {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  if (!el) return false
  return Boolean(
    el.closest(
      'input, textarea, button, .selection-toolbar, .drawer-panel, .nav, .topbar, .day-check, .board-check',
    ),
  )
}
