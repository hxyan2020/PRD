import { useMemo, useState, type CSSProperties } from 'react'
import type { NotebookCategory, NotebookEntry } from '../hooks/useNotebook'
import type { UiKey } from '../i18n/ui'
import { categoryColorStyle } from '../lib/categoryColors'
import { htmlToPlainText } from '../lib/sanitizeHtml'

const UNCATEGORIZED_ID = '__uncategorized__'

export type NoteTreeNode = {
  id: string
  name: string
  color?: NotebookCategory['color']
  notes: NotebookEntry[]
}

function noteLabel(entry: NotebookEntry): string {
  const title = entry.title?.trim()
  if (title) return title
  const plain = htmlToPlainText(entry.selectedText).trim()
  if (plain) return plain.length > 72 ? `${plain.slice(0, 72)}…` : plain
  return entry.id
}

function sortByAlpha<T>(items: T[], key: (item: T) => string, lang: 'en' | 'zh'): T[] {
  const collator = new Intl.Collator(lang === 'zh' ? 'zh-CN' : 'en', {
    sensitivity: 'base',
    numeric: true,
  })
  return [...items].sort((a, b) => collator.compare(key(a), key(b)))
}

export function buildNoteTree(
  categories: NotebookCategory[],
  entries: NotebookEntry[],
  lang: 'en' | 'zh',
  uncategorizedLabel: string,
): NoteTreeNode[] {
  const sortedCats = sortByAlpha(categories, (c) => c.name, lang)
  const nodes: NoteTreeNode[] = sortedCats.map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    notes: sortByAlpha(
      entries.filter((e) => (e.categoryIds ?? []).includes(cat.id)),
      noteLabel,
      lang,
    ),
  }))

  const uncategorized = sortByAlpha(
    entries.filter((e) => !(e.categoryIds ?? []).length),
    noteLabel,
    lang,
  )
  if (uncategorized.length || !nodes.length) {
    nodes.push({
      id: UNCATEGORIZED_ID,
      name: uncategorizedLabel,
      notes: uncategorized,
    })
  }
  return nodes
}

type Props = {
  categories: NotebookCategory[]
  entries: NotebookEntry[]
  lang: 'en' | 'zh'
  selectedNoteId: string | null
  onSelectNote: (entry: NotebookEntry) => void
  t: (key: UiKey, vars?: Record<string, string | number>) => string
  /** When true, drop outer card chrome (used inside the Tree tab). */
  embedded?: boolean
}

export function NoteTree({
  categories,
  entries,
  lang,
  selectedNoteId,
  onSelectNote,
  t,
  embedded = false,
}: Props) {
  const tree = useMemo(
    () => buildNoteTree(categories, entries, lang, t('uncategorized')),
    [categories, entries, lang, t],
  )

  // Categories start folded; only ids present here are expanded.
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  function toggleCategory(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (!entries.length && !categories.length) {
    return (
      <div className={`note-tree${embedded ? ' embedded' : ''}`} aria-label={t('noteTree')}>
        <p className="note-tree-empty-page">{t('noteTreeEmpty')}</p>
      </div>
    )
  }

  return (
    <section
      className={`note-tree${embedded ? ' embedded' : ''}`}
      aria-label={t('noteTree')}
    >
      <div className="note-tree-head">
        <h2>{t('noteTree')}</h2>
        <p className="note-tree-hint">{t('noteTreeHint')}</p>
      </div>
      <ul className="note-tree-list" role="tree">
        {tree.map((node) => {
          const expanded = Boolean(expandedIds[node.id])
          return (
            <li
              key={node.id}
              className="note-tree-category"
              role="treeitem"
              aria-expanded={expanded}
              style={
                node.color
                  ? (categoryColorStyle(node.color) as CSSProperties)
                  : undefined
              }
            >
              <button
                type="button"
                className="note-tree-category-btn"
                onClick={() => toggleCategory(node.id)}
                aria-expanded={expanded}
              >
                <span className="note-tree-chevron" aria-hidden="true">
                  {expanded ? '▾' : '▸'}
                </span>
                {node.color ? <span className="category-dot" aria-hidden="true" /> : null}
                <span className="note-tree-category-name">{node.name}</span>
                <span className="note-tree-count">{node.notes.length}</span>
              </button>
              {expanded ? (
                node.notes.length ? (
                  <ul className="note-tree-notes" role="group">
                    {node.notes.map((entry) => {
                      const label = noteLabel(entry)
                      const selected = selectedNoteId === entry.id
                      return (
                        <li key={`${node.id}-${entry.id}`} role="treeitem">
                          <button
                            type="button"
                            className={`note-tree-note-btn${selected ? ' on' : ''}`}
                            onClick={() => onSelectNote(entry)}
                            aria-current={selected ? 'true' : undefined}
                            title={label}
                          >
                            <span className="note-tree-note-label">{label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="note-tree-empty">{t('noteTreeEmptyCategory')}</p>
                )
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
