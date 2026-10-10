import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { RichTextEditor } from '../components/RichTextEditor'
import {
  formatTimestamp,
  useNotebook,
  type NotebookCategory,
  type NotebookEntry,
  type TrashedNotebookEntry,
} from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import type { UiKey } from '../i18n/ui'
import { categoryColorStyle } from '../lib/categoryColors'
import { htmlToPlainText, isBlankHtml, sanitizeHtml } from '../lib/sanitizeHtml'

type NotebookSort = 'created' | 'edited' | 'alpha'
/** Empty = all notes. Includes `UNCATEGORIZED_FILTER` and/or category ids (OR match). */
type CategoryFilterSelection = string[]
const UNCATEGORIZED_FILTER = '__uncategorized__'

const SORT_STORAGE_KEY = 'ownlab-notebook-sort'

function typeLabel(
  type: NotebookEntry['type'],
  t: (key: 'aiExplanation' | 'clip' | 'freeNote') => string,
) {
  if (type === 'explanation') return t('aiExplanation')
  if (type === 'note') return t('freeNote')
  return t('clip')
}

function NoteBody({ html, className }: { html: string; className?: string }) {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html)
  if (!looksLikeHtml) {
    return <blockquote className={className}>{html}</blockquote>
  }
  return (
    <blockquote
      className={`${className ?? ''} notebook-rich`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}

function readSort(): NotebookSort {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY)
    if (raw === 'created' || raw === 'edited' || raw === 'alpha') return raw
  } catch {
    /* ignore */
  }
  return 'created'
}

function sortKeyAlpha(entry: NotebookEntry): string {
  const title = entry.title?.trim()
  if (title) return title
  return htmlToPlainText(entry.selectedText) || entry.selectedText
}

function sortEntries(entries: NotebookEntry[], sort: NotebookSort, lang: 'en' | 'zh'): NotebookEntry[] {
  const list = [...entries]
  if (sort === 'alpha') {
    const collator = new Intl.Collator(lang === 'zh' ? 'zh-CN' : 'en', {
      sensitivity: 'base',
      numeric: true,
    })
    return list.sort((a, b) => collator.compare(sortKeyAlpha(a), sortKeyAlpha(b)))
  }
  if (sort === 'edited') {
    return list.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime()
      const bTime = new Date(b.updatedAt || b.createdAt).getTime()
      return bTime - aTime
    })
  }
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function entrySearchText(entry: NotebookEntry, categories: NotebookCategory[]): string {
  const names = (entry.categoryIds ?? [])
    .map((id) => categories.find((c) => c.id === id)?.name ?? '')
    .join(' ')
  const parts = [
    entry.title ?? '',
    htmlToPlainText(entry.selectedText) || entry.selectedText,
    entry.explanation ? htmlToPlainText(entry.explanation) || entry.explanation : '',
    names,
  ]
  return parts.join('\n').toLowerCase()
}

function filterEntries(
  entries: NotebookEntry[],
  query: string,
  categoryFilter: CategoryFilterSelection,
  categories: NotebookCategory[],
): NotebookEntry[] {
  let list = entries
  if (categoryFilter.length) {
    const wantUncategorized = categoryFilter.includes(UNCATEGORIZED_FILTER)
    const wantedIds = categoryFilter.filter((id) => id !== UNCATEGORIZED_FILTER)
    list = list.filter((entry) => {
      const ids = entry.categoryIds ?? []
      if (wantUncategorized && ids.length === 0) return true
      return wantedIds.some((id) => ids.includes(id))
    })
  }

  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (!tokens.length) return list
  return list.filter((entry) => {
    const haystack = entrySearchText(entry, categories)
    return tokens.every((token) => haystack.includes(token))
  })
}

function toggleCategoryFilter(
  current: CategoryFilterSelection,
  id: string,
): CategoryFilterSelection {
  return current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

function CategoryPicker({
  categories,
  selectedIds,
  onChange,
  t,
}: {
  categories: NotebookCategory[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  t: (key: UiKey) => string
}) {
  if (!categories.length) {
    return <p className="notebook-category-empty">{t('noCategoriesYet')}</p>
  }
  return (
    <div className="notebook-category-picker" role="group" aria-label={t('noteCategoriesLabel')}>
      {categories.map((cat) => {
        const checked = selectedIds.includes(cat.id)
        return (
          <label
            key={cat.id}
            className={`notebook-category-option${checked ? ' on' : ''}`}
            style={categoryColorStyle(cat.color) as CSSProperties}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(toggleId(selectedIds, cat.id))}
            />
            <span className="category-dot" aria-hidden="true" />
            <span>{cat.name}</span>
          </label>
        )
      })}
    </div>
  )
}

export function Notebook() {
  const {
    entries,
    trash,
    categories,
    count,
    trashCount,
    addNote,
    updateEntry,
    removeEntry,
    restoreEntry,
    addCategory,
    removeCategory,
  } = useNotebook()
  const { lang, t } = useLanguage()
  const [view, setView] = useState<'notes' | 'dustbin'>('notes')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftText, setDraftText] = useState('')
  const [draftExplanation, setDraftExplanation] = useState('')
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newCategoryIds, setNewCategoryIds] = useState<string[]>([])
  const [composerOpen, setComposerOpen] = useState(true)
  const [sort, setSort] = useState<NotebookSort>(() => readSort())
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [recoverToast, setRecoverToast] = useState(false)

  const categoryMap = useMemo(() => {
    const map = new Map<string, NotebookCategory>()
    for (const cat of categories) map.set(cat.id, cat)
    return map
  }, [categories])

  const visibleEntries = useMemo(() => {
    const filtered = filterEntries(entries, query, categoryFilter, categories)
    return sortEntries(filtered, sort, lang)
  }, [entries, query, categoryFilter, categories, sort, lang])

  const visibleTrash = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = trash
    if (q) {
      list = list.filter((entry) => entrySearchText(entry, categories).includes(q))
    }
    return [...list].sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    )
  }, [trash, query, categories])

  function changeSort(next: NotebookSort) {
    setSort(next)
    try {
      localStorage.setItem(SORT_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  function startEdit(entry: NotebookEntry) {
    setEditingId(entry.id)
    setDraftTitle(entry.title ?? '')
    setDraftText(entry.selectedText)
    setDraftExplanation(entry.explanation ?? '')
    setDraftCategoryIds([...(entry.categoryIds ?? [])])
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftTitle('')
    setDraftText('')
    setDraftExplanation('')
    setDraftCategoryIds([])
  }

  function saveEdit(entry: NotebookEntry) {
    const selectedText =
      entry.type === 'note' ? sanitizeHtml(draftText).trim() : draftText.trim()
    if (entry.type === 'note' ? isBlankHtml(selectedText) : !selectedText) return
    const patch =
      entry.type === 'explanation'
        ? {
            title: draftTitle,
            selectedText,
            explanation: draftExplanation,
            categoryIds: draftCategoryIds,
          }
        : { title: draftTitle, selectedText, categoryIds: draftCategoryIds }
    const updated = updateEntry(entry.id, patch)
    if (updated) cancelEdit()
  }

  function createNote() {
    const html = sanitizeHtml(newNote).trim()
    if (isBlankHtml(html)) return
    const created = addNote({
      text: html,
      title: newTitle,
      categoryIds: newCategoryIds,
    })
    if (!created) return
    setNewTitle('')
    setNewNote('')
    setNewCategoryIds([])
    setComposerOpen(true)
  }

  function createCategory() {
    const created = addCategory(newCategoryName)
    if (!created) return
    setNewCategoryName('')
  }

  function onDeleteCategory(cat: NotebookCategory) {
    if (!window.confirm(t('deleteCategoryConfirm', { name: cat.name }))) return
    removeCategory(cat.id)
    setCategoryFilter((ids) => ids.filter((id) => id !== cat.id))
    setNewCategoryIds((ids) => ids.filter((id) => id !== cat.id))
    setDraftCategoryIds((ids) => ids.filter((id) => id !== cat.id))
  }

  function filterByCategoryId(id: string) {
    setView('notes')
    setCategoryFilter([id])
  }

  function moveToDustbin(id: string) {
    removeEntry(id)
    if (editingId === id) cancelEdit()
  }

  function recoverFromDustbin(entry: TrashedNotebookEntry) {
    const restored = restoreEntry(entry.id)
    if (!restored) return
    setRecoverToast(true)
    window.setTimeout(() => setRecoverToast(false), 2200)
    setView('notes')
  }

  const canCreate = !isBlankHtml(newNote)
  const categoryFiltering = categoryFilter.length > 0
  const filtering =
    view === 'notes'
      ? Boolean(query.trim()) || categoryFiltering
      : Boolean(query.trim())

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('notebookEyebrow')}</p>
        <h1>{view === 'dustbin' ? t('dustbinTitle') : t('notebookTitle')}</h1>
        <p className="section-lede">
          {view === 'dustbin' ? t('dustbinLede') : t('notebookLede')}
        </p>
        <div className="notebook-view-switch" role="tablist" aria-label={t('notebookTitle')}>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'notes'}
            className={`notebook-view-tab${view === 'notes' ? ' on' : ''}`}
            onClick={() => setView('notes')}
          >
            <span aria-hidden="true" className="notebook-view-icon notebook-view-icon-notes" />
            {t('viewNotes')}
            <span className="notebook-view-count">{count}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'dustbin'}
            className={`notebook-view-tab${view === 'dustbin' ? ' on' : ''}`}
            onClick={() => setView('dustbin')}
          >
            <span aria-hidden="true" className="notebook-view-icon notebook-view-icon-dustbin" />
            {t('dustbin')}
            <span className="notebook-view-count">{trashCount}</span>
          </button>
        </div>
        <div className="notebook-toolbar">
          <p className="notebook-count">
            {view === 'dustbin'
              ? filtering && trashCount > 0
                ? t('searchShowing', { shown: visibleTrash.length, total: trashCount })
                : t('dustbinCount', { n: trashCount })
              : filtering && count > 0
                ? t('searchShowing', { shown: visibleEntries.length, total: count })
                : `${count} ${count === 1 ? t('note') : t('notes')}`}
          </p>
          {(view === 'notes' ? count > 0 : trashCount > 0) ? (
            <div className="notebook-toolbar-controls">
              <label className="notebook-search">
                <span className="sr-only">{t('searchNotes')}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchNotesPlaceholder')}
                  aria-label={t('searchNotes')}
                />
              </label>
              {view === 'notes' ? (
                <label className="notebook-sort">
                  <span>{t('sortNotes')}</span>
                  <select
                    value={sort}
                    onChange={(e) => changeSort(e.target.value as NotebookSort)}
                    aria-label={t('sortNotes')}
                  >
                    <option value="created">{t('sortByCreated')}</option>
                    <option value="edited">{t('sortByEdited')}</option>
                    <option value="alpha">{t('sortByAlpha')}</option>
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {recoverToast ? (
        <p className="notebook-toast" role="status">
          {t('recoveredToNotebook')}
        </p>
      ) : null}

      {view === 'dustbin' ? (
        trashCount === 0 ? (
          <div className="callout dustbin-empty">
            <h2>{t('dustbinEmpty')}</h2>
            <p>{t('dustbinEmptyBody')}</p>
          </div>
        ) : visibleTrash.length === 0 ? (
          <div className="callout">
            <h2>{t('searchNoResults')}</h2>
            <p>{t('searchNotesPlaceholder')}</p>
          </div>
        ) : (
          <ol className="notebook-timeline dustbin-timeline">
            {visibleTrash.map((entry) => {
              const entryCategories = (entry.categoryIds ?? [])
                .map((id) => categoryMap.get(id))
                .filter((c): c is NotebookCategory => Boolean(c))
              return (
                <li key={entry.id} className={`notebook-entry ${entry.type} dustbin-entry`}>
                  <div className="notebook-meta">
                    <time dateTime={entry.deletedAt}>
                      {t('deletedAt')} {formatTimestamp(entry.deletedAt, lang)}
                    </time>
                    <span className="notebook-type">{typeLabel(entry.type, t)}</span>
                    {entryCategories.length
                      ? entryCategories.map((cat) => (
                          <span
                            key={cat.id}
                            className="notebook-category-badge"
                            style={categoryColorStyle(cat.color) as CSSProperties}
                          >
                            <span className="category-dot" aria-hidden="true" />
                            {cat.name}
                          </span>
                        ))
                      : null}
                  </div>
                  {entry.title ? <h3 className="notebook-entry-title">{entry.title}</h3> : null}
                  <NoteBody html={entry.selectedText} className="notebook-quote" />
                  {entry.explanation ? (
                    <div className="notebook-explanation">
                      {entry.explanation.split(/\n\n+/).map((block, index) => (
                        <p key={`${entry.id}-b-${index}`}>{block.replace(/\*\*/g, '')}</p>
                      ))}
                    </div>
                  ) : null}
                  <div className="notebook-actions">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => recoverFromDustbin(entry)}
                    >
                      {t('recoverNote')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )
      ) : (
        <>
      <section className="notebook-categories" aria-label={t('manageCategories')}>
        <div className="notebook-composer-head">
          <h2>{t('categories')}</h2>
        </div>
        <div className="notebook-category-create">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t('categoryNamePlaceholder')}
            maxLength={40}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                createCategory()
              }
            }}
          />
          <button
            type="button"
            className="btn primary"
            disabled={!newCategoryName.trim()}
            onClick={createCategory}
          >
            {t('addCategory')}
          </button>
        </div>
        {categories.length ? (
          <ul className="notebook-category-list">
            {categories.map((cat) => (
              <li key={cat.id} style={categoryColorStyle(cat.color) as CSSProperties}>
                <span className="notebook-category-chip">
                  <span className="category-dot" aria-hidden="true" />
                  {cat.name}
                </span>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => onDeleteCategory(cat)}
                  aria-label={`${t('deleteCategory')}: ${cat.name}`}
                >
                  {t('delete')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="notebook-category-empty">{t('noCategoriesYet')}</p>
        )}
      </section>

      <section className="notebook-composer" aria-label={t('newNote')}>
        <div className="notebook-composer-head">
          <h2>{t('newNote')}</h2>
          {!composerOpen ? (
            <button type="button" className="btn primary" onClick={() => setComposerOpen(true)}>
              {t('newNote')}
            </button>
          ) : null}
        </div>
        {composerOpen ? (
          <div className="notebook-edit-form">
            <label className="notebook-field">
              <span className="notebook-field-label">{t('noteTitleLabel')}</span>
              <input
                className="notebook-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('noteTitlePlaceholder')}
                maxLength={120}
                autoFocus={entries.length === 0}
              />
            </label>
            <div className="notebook-field">
              <span className="notebook-field-label">{t('noteCategoriesLabel')}</span>
              <CategoryPicker
                categories={categories}
                selectedIds={newCategoryIds}
                onChange={setNewCategoryIds}
                t={t}
              />
            </div>
            <div className="notebook-field">
              <span className="notebook-field-label">{t('noteBodyLabel')}</span>
              <RichTextEditor
                value={newNote}
                onChange={setNewNote}
                placeholder={t('newNotePlaceholder')}
                ariaLabel={t('noteBodyLabel')}
              />
            </div>
            <div className="notebook-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!canCreate}
                onClick={createNote}
              >
                {t('createNote')}
              </button>
              {entries.length > 0 ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setComposerOpen(false)
                    setNewTitle('')
                    setNewNote('')
                    setNewCategoryIds([])
                  }}
                >
                  {t('cancelEdit')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {count > 0 || categories.length > 0 ? (
        <section className="notebook-filter-bar" aria-label={t('filterByCategory')}>
          <div className="notebook-filter-bar-head">
            <h2>{t('filterByCategory')}</h2>
            {categoryFiltering ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => setCategoryFilter([])}
              >
                {t('clearCategoryFilter')}
              </button>
            ) : null}
          </div>
          <p className="notebook-filter-hint">{t('filterByCategoryHint')}</p>
          <div className="notebook-category-filters" role="toolbar" aria-label={t('filterByCategory')}>
            <button
              type="button"
              className={`notebook-filter-chip${!categoryFiltering ? ' on' : ''}`}
              aria-pressed={!categoryFiltering}
              onClick={() => setCategoryFilter([])}
            >
              {t('filterAllCategories')}
            </button>
            <button
              type="button"
              className={`notebook-filter-chip${
                categoryFilter.includes(UNCATEGORIZED_FILTER) ? ' on' : ''
              }`}
              aria-pressed={categoryFilter.includes(UNCATEGORIZED_FILTER)}
              onClick={() =>
                setCategoryFilter((ids) => toggleCategoryFilter(ids, UNCATEGORIZED_FILTER))
              }
            >
              {t('filterUncategorized')}
            </button>
            {categories.map((cat) => {
              const on = categoryFilter.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`notebook-filter-chip colored${on ? ' on' : ''}`}
                  style={categoryColorStyle(cat.color) as CSSProperties}
                  aria-pressed={on}
                  onClick={() => setCategoryFilter((ids) => toggleCategoryFilter(ids, cat.id))}
                >
                  <span className="category-dot" aria-hidden="true" />
                  {cat.name}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {entries.length === 0 ? (
        <div className="callout">
          <h2>{t('emptyNotebook')}</h2>
          <p>
            {t('emptyNotebookBody')}{' '}
            <Link to="/day/1">
              {t('day')}1
            </Link>
          </p>
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="callout">
          <h2>{t('searchNoResults')}</h2>
          <p>{categoryFiltering ? t('filterNoResults') : t('searchNotesPlaceholder')}</p>
          {categoryFiltering ? (
            <button type="button" className="btn ghost" onClick={() => setCategoryFilter([])}>
              {t('clearCategoryFilter')}
            </button>
          ) : null}
        </div>
      ) : (
        <ol className="notebook-timeline">
          {visibleEntries.map((entry) => {
            const editing = editingId === entry.id
            const editBlank =
              entry.type === 'note' ? isBlankHtml(draftText) : !draftText.trim()
            const entryCategories = (entry.categoryIds ?? [])
              .map((id) => categoryMap.get(id))
              .filter((c): c is NotebookCategory => Boolean(c))
            return (
              <li key={entry.id} className={`notebook-entry ${entry.type}${editing ? ' editing' : ''}`}>
                <div className="notebook-meta">
                  <time dateTime={entry.createdAt}>{formatTimestamp(entry.createdAt, lang)}</time>
                  {entry.updatedAt ? (
                    <span className="notebook-edited" title={formatTimestamp(entry.updatedAt, lang)}>
                      {t('edited')}
                    </span>
                  ) : null}
                  <span className="notebook-type">{typeLabel(entry.type, t)}</span>
                  {entryCategories.length
                    ? entryCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`notebook-category-badge filterable${
                            categoryFilter.includes(cat.id) ? ' on' : ''
                          }`}
                          style={categoryColorStyle(cat.color) as CSSProperties}
                          title={t('filterByThisCategory', { name: cat.name })}
                          aria-label={t('filterByThisCategory', { name: cat.name })}
                          onClick={() => filterByCategoryId(cat.id)}
                        >
                          <span className="category-dot" aria-hidden="true" />
                          {cat.name}
                        </button>
                      ))
                    : null}
                  {entry.sourceLabel && entry.type !== 'note' ? (
                    entry.sourcePath ? (
                      <Link to={entry.sourcePath}>{entry.sourceLabel}</Link>
                    ) : (
                      <span>{entry.sourceLabel}</span>
                    )
                  ) : null}
                  {entry.model ? <span className="notebook-model">{entry.model}</span> : null}
                </div>

                {editing ? (
                  <div className="notebook-edit-form">
                    <label className="notebook-field">
                      <span className="notebook-field-label">{t('noteTitleLabel')}</span>
                      <input
                        className="notebook-title-input"
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder={t('noteTitlePlaceholder')}
                        maxLength={120}
                        autoFocus
                      />
                    </label>
                    <div className="notebook-field">
                      <span className="notebook-field-label">{t('noteCategoriesLabel')}</span>
                      <CategoryPicker
                        categories={categories}
                        selectedIds={draftCategoryIds}
                        onChange={setDraftCategoryIds}
                        t={t}
                      />
                    </div>
                    {entry.type === 'note' ? (
                      <div className="notebook-field">
                        <span className="notebook-field-label">{t('noteBodyLabel')}</span>
                        <RichTextEditor
                          value={draftText}
                          onChange={setDraftText}
                          placeholder={t('newNotePlaceholder')}
                          minHeight="10rem"
                          ariaLabel={t('noteBodyLabel')}
                        />
                      </div>
                    ) : (
                      <label>
                        {t('selectedTextLabel')}
                        <textarea
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          rows={3}
                        />
                      </label>
                    )}
                    {entry.type === 'explanation' ? (
                      <label>
                        {t('explanationLabel')}
                        <textarea
                          value={draftExplanation}
                          onChange={(e) => setDraftExplanation(e.target.value)}
                          rows={8}
                        />
                      </label>
                    ) : null}
                    <div className="notebook-actions">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={editBlank}
                        onClick={() => saveEdit(entry)}
                      >
                        {t('saveEdits')}
                      </button>
                      <button type="button" className="btn ghost" onClick={cancelEdit}>
                        {t('cancelEdit')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {entry.title ? <h3 className="notebook-entry-title">{entry.title}</h3> : null}
                    <NoteBody html={entry.selectedText} className="notebook-quote" />
                    {entry.explanation ? (
                      <div className="notebook-explanation">
                        {entry.explanation.split(/\n\n+/).map((block, index) => (
                          <p key={`${entry.id}-b-${index}`}>{block.replace(/\*\*/g, '')}</p>
                        ))}
                      </div>
                    ) : null}
                    <div className="notebook-actions">
                      <button type="button" className="btn ghost" onClick={() => startEdit(entry)}>
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => moveToDustbin(entry.id)}
                      >
                        {t('moveToDustbin')}
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      )}
        </>
      )}

    </div>
  )
}
