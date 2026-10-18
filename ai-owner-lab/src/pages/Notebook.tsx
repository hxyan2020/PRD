import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CloudSetupCard } from '../components/CloudSetupCard'
import { NoteAttachments } from '../components/NoteAttachments'
import { NoteTree } from '../components/NoteTree'
import { NotebookBackupPanel } from '../components/NotebookBackupPanel'
import { RichTextEditor, type RichTextEditorHandle } from '../components/RichTextEditor'
import {
  NotebookStorageError,
  notebookStore,
  type CloudRuntimeState,
} from '../hooks/notebookStore'
import {
  formatTimestamp,
  useNotebook,
  type NotebookAttachment,
  type NotebookCategory,
  type NotebookEntry,
  type TrashedNotebookEntry,
} from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import type { UiKey } from '../i18n/ui'
import { categoryColorStyle } from '../lib/categoryColors'
import { htmlToPlainText, isBlankHtml, renderNoteHtml, sanitizeHtml } from '../lib/sanitizeHtml'

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
      dangerouslySetInnerHTML={{ __html: renderNoteHtml(html) }}
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
              aria-label={cat.name}
            />
            <span className="category-dot" aria-hidden="true" />
            <span className="notebook-category-option-name">{cat.name}</span>
          </label>
        )
      })}
    </div>
  )
}

export function Notebook() {
  const {
    ready,
    entries,
    trash,
    categories,
    count,
    trashCount,
    addNote,
    updateEntry,
    removeEntry,
    restoreEntry,
    purgeTrashEntry,
    addCategory,
    removeCategory,
    recoverFromBackups,
    exportBackup,
    dumpRecoveryStorage,
    importBackup,
  } = useNotebook()
  const { lang, t } = useLanguage()
  const [view, setView] = useState<
    'notes' | 'add' | 'tree' | 'categories' | 'dustbin' | 'backup'
  >('notes')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftText, setDraftText] = useState('')
  const [draftExplanation, setDraftExplanation] = useState('')
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([])
  const [draftAttachments, setDraftAttachments] = useState<NotebookAttachment[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newCategoryIds, setNewCategoryIds] = useState<string[]>([])
  const [newAttachments, setNewAttachments] = useState<NotebookAttachment[]>([])
  const [composerError, setComposerError] = useState<string | null>(null)
  const [sort, setSort] = useState<NotebookSort>(() => readSort())
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterSelection>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [recoverToast, setRecoverToast] = useState(false)
  const [deletedForeverToast, setDeletedForeverToast] = useState(false)
  const [storageToast, setStorageToast] = useState<string | null>(null)
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)
  const [recoveryBusy, setRecoveryBusy] = useState(false)
  const [openedNoteId, setOpenedNoteId] = useState<string | null>(null)
  const [treeFocusId, setTreeFocusId] = useState<string | null>(null)
  const { available: authAvailable, username: authUser } = useAuth()
  const [cloudOn, setCloudOn] = useState(() => notebookStore.getCloudSyncStatus().configured)
  const [cloudState, setCloudState] = useState<CloudRuntimeState>(() =>
    notebookStore.getCloudRuntime().state,
  )
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [skipCloudRestore, setSkipCloudRestore] = useState(false)
  const accountSynced = Boolean(authAvailable && authUser)
  const composerEditorRef = useRef<RichTextEditorHandle | null>(null)
  const editEditorRef = useRef<RichTextEditorHandle | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const autoRecoverTried = useRef(false)
  const cloudSetupRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (accountSynced) setCloudOn(true)
  }, [accountSynced])

  useEffect(() => {
    if (!ready) return
    setCloudOn(accountSynced || notebookStore.getCloudSyncStatus().configured)
    let message: string | null = null
    if (notebookStore.consumeRecoveryNotice()) message = t('notesRecoveredToast')
    else if (notebookStore.consumeMigrationNotice()) message = t('notebookStorageUpgraded')
    if (!message) return
    setStorageToast(message)
    const timer = window.setTimeout(() => setStorageToast(null), 5200)
    return () => window.clearTimeout(timer)
  }, [ready, t, accountSynced])

  useEffect(() => {
    return notebookStore.subscribeCloudRuntime((runtime) => {
      setCloudState(runtime.state)
      setCloudError(runtime.error)
      setCloudOn(
        accountSynced ||
          notebookStore.getCloudSyncStatus().configured ||
          runtime.state === 'syncing' ||
          runtime.state === 'synced',
      )
    })
  }, [accountSynced])

  useEffect(() => {
    if (view !== 'backup') {
      setCloudOn(accountSynced || notebookStore.getCloudSyncStatus().configured)
    }
  }, [view, count, accountSynced])

  useEffect(() => {
    if (!openedNoteId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenedNoteId(null)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [openedNoteId])

  useEffect(() => {
    if (!ready || autoRecoverTried.current) return
    if (count > 0) return
    autoRecoverTried.current = true
    void recoverFromBackups()
      .then((result) => {
        if (result.restored > 0) {
          setRecoveryMessage(
            t('recoverNotesFound', { restored: result.restored, total: result.total }),
          )
        }
      })
      .catch(() => {
        /* ignore auto-recover errors */
      })
  }, [ready, count, recoverFromBackups, t])

  async function onRecoverNotes() {
    setRecoveryBusy(true)
    setRecoveryMessage(null)
    try {
      const result = await recoverFromBackups()
      if (result.restored > 0 || result.total > 0) {
        setRecoveryMessage(
          t('recoverNotesFound', { restored: result.restored, total: result.total }),
        )
      } else {
        setRecoveryMessage(t('recoverNotesNone'))
      }
    } catch {
      setRecoveryMessage(t('recoverNotesNone'))
    } finally {
      setRecoveryBusy(false)
    }
  }

  function onExportNotes() {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ownlab-notebook-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onRecoveryDump() {
    setRecoveryBusy(true)
    setRecoveryMessage(null)
    try {
      const dump = await dumpRecoveryStorage()
      const blob = new Blob([dump.json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ownlab-recovery-dump-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      if (dump.entryCount > 0) {
        // Also merge into the live notebook immediately.
        await importBackup(dump.json)
        setRecoveryMessage(
          t('recoveryDumpFound', {
            count: dump.entryCount,
            sources: dump.sources.join(', ') || 'storage',
          }),
        )
      } else {
        setRecoveryMessage(t('recoveryDumpEmpty'))
      }
    } catch {
      setRecoveryMessage(t('recoveryDumpFail'))
    } finally {
      setRecoveryBusy(false)
    }
  }

  async function onImportFile(file: File | null) {
    if (!file) return
    setRecoveryBusy(true)
    setRecoveryMessage(null)
    try {
      const text = await file.text()
      const result = await importBackup(text)
      setRecoveryMessage(t('recoverNotesFound', { restored: result.total, total: result.total }))
    } catch {
      setRecoveryMessage(t('recoverNotesNone'))
    } finally {
      setRecoveryBusy(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, NotebookCategory>()
    for (const cat of categories) map.set(cat.id, cat)
    return map
  }, [categories])

  /** Active notes only — never show dustbin items in the tree or note list. */
  const activeEntries = useMemo(() => {
    if (!trash.length) return entries
    const trashedIds = new Set(trash.map((e) => e.id))
    return entries.filter((e) => !trashedIds.has(e.id))
  }, [entries, trash])

  const visibleEntries = useMemo(() => {
    const filtered = filterEntries(activeEntries, query, categoryFilter, categories)
    return sortEntries(filtered, sort, lang)
  }, [activeEntries, query, categoryFilter, categories, sort, lang])

  const openedNote = useMemo(
    () => (openedNoteId ? activeEntries.find((e) => e.id === openedNoteId) ?? null : null),
    [openedNoteId, activeEntries],
  )

  useEffect(() => {
    if (!treeFocusId) return
    const el = document.querySelector<HTMLElement>(`[data-entry-id="${treeFocusId}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = window.setTimeout(() => setTreeFocusId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [treeFocusId, visibleEntries])

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
    setDraftAttachments([...(entry.attachments ?? [])])
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftTitle('')
    setDraftText('')
    setDraftExplanation('')
    setDraftCategoryIds([])
    setDraftAttachments([])
  }

  async function saveEdit(entry: NotebookEntry) {
    try {
      const selectedText =
        entry.type === 'note'
          ? (editEditorRef.current?.getSanitizedHtml() ?? sanitizeHtml(draftText)).trim()
          : draftText.trim()
      const hasFiles = draftAttachments.length > 0
      if (entry.type === 'note' ? isBlankHtml(selectedText) && !hasFiles : !selectedText) return
      const patch =
        entry.type === 'explanation'
          ? {
              title: draftTitle,
              selectedText,
              explanation: draftExplanation,
              categoryIds: draftCategoryIds,
              attachments: draftAttachments,
            }
          : {
              title: draftTitle,
              selectedText: selectedText || '<p></p>',
              categoryIds: draftCategoryIds,
              attachments: draftAttachments,
            }
      const updated = await updateEntry(entry.id, patch)
      if (updated) cancelEdit()
    } catch (err) {
      const message =
        err instanceof NotebookStorageError && err.code === 'quota'
          ? t('notebookStorageFull')
          : t('noteSaveFailed')
      window.alert(message)
    }
  }

  async function createNote() {
    setComposerError(null)
    try {
      // Prefer live contentEditable HTML — React state can lag behind the DOM.
      const html = (
        composerEditorRef.current?.getSanitizedHtml() ?? sanitizeHtml(newNote)
      ).trim()
      if (isBlankHtml(html) && newAttachments.length === 0) {
        setComposerError(t('noteEmptyBody'))
        composerEditorRef.current?.focus()
        return
      }
      const created = await addNote({
        text: isBlankHtml(html) ? '' : html,
        title: newTitle,
        categoryIds: newCategoryIds,
        attachments: newAttachments,
      })
      if (!created) {
        setComposerError(t('noteSaveFailed'))
        return
      }
      setNewTitle('')
      setNewNote('')
      setNewCategoryIds([])
      setNewAttachments([])
      setComposerError(null)
      setView('notes')
      if (!notebookStore.getCloudSyncStatus().configured) {
        setCloudOn(false)
        window.requestAnimationFrame(() => {
          cloudSetupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    } catch (err) {
      if (err instanceof NotebookStorageError && err.code === 'quota') {
        setComposerError(t('notebookStorageFull'))
      } else {
        setComposerError(t('noteSaveFailed'))
      }
    }
  }

  async function createCategory() {
    try {
      const created = await addCategory(newCategoryName)
      if (!created) return
      setNewCategoryName('')
    } catch (err) {
      const message =
        err instanceof NotebookStorageError && err.code === 'quota'
          ? t('notebookStorageFull')
          : t('noteSaveFailed')
      window.alert(message)
    }
  }

  function onDeleteCategory(cat: NotebookCategory) {
    if (!window.confirm(t('deleteCategoryConfirm', { name: cat.name }))) return
    void removeCategory(cat.id).catch(() => {
      window.alert(t('noteSaveFailed'))
    })
    setCategoryFilter((ids) => ids.filter((id) => id !== cat.id))
    setNewCategoryIds((ids) => ids.filter((id) => id !== cat.id))
    setDraftCategoryIds((ids) => ids.filter((id) => id !== cat.id))
  }

  function filterByCategoryId(id: string) {
    setView('notes')
    setCategoryFilter([id])
  }

  function openNoteFromTree(entry: NotebookEntry) {
    setView('tree')
    setCategoryFilter([])
    setQuery('')
    setOpenedNoteId(entry.id)
    setTreeFocusId(entry.id)
    setEditingId(null)
  }

  function openNoteFullScreen(entry: NotebookEntry) {
    setOpenedNoteId(entry.id)
    setTreeFocusId(entry.id)
    setEditingId(null)
  }

  function editOpenedNote(entry: NotebookEntry) {
    setOpenedNoteId(null)
    setView('notes')
    startEdit(entry)
    setTreeFocusId(entry.id)
  }

  function closeOpenedNote() {
    setOpenedNoteId(null)
  }

  function moveToDustbin(id: string) {
    void removeEntry(id).catch((err) => {
      const message =
        err instanceof NotebookStorageError && err.code === 'quota'
          ? t('notebookStorageFull')
          : t('noteSaveFailed')
      window.alert(message)
    })
    if (editingId === id) cancelEdit()
    if (openedNoteId === id) setOpenedNoteId(null)
    if (treeFocusId === id) setTreeFocusId(null)
  }

  async function recoverFromDustbin(entry: TrashedNotebookEntry) {
    try {
      const restored = await restoreEntry(entry.id)
      if (!restored) return
      setRecoverToast(true)
      window.setTimeout(() => setRecoverToast(false), 2200)
      setView('notes')
    } catch (err) {
      const message =
        err instanceof NotebookStorageError && err.code === 'quota'
          ? t('notebookStorageFull')
          : t('noteSaveFailed')
      window.alert(message)
    }
  }

  async function deleteForeverFromDustbin(entry: TrashedNotebookEntry) {
    if (!window.confirm(t('deleteForeverConfirm'))) return
    try {
      const removed = await purgeTrashEntry(entry.id)
      if (!removed) return
      setDeletedForeverToast(true)
      window.setTimeout(() => setDeletedForeverToast(false), 2200)
    } catch (err) {
      const message =
        err instanceof NotebookStorageError && err.code === 'quota'
          ? t('notebookStorageFull')
          : t('noteSaveFailed')
      window.alert(message)
    }
  }

  const categoryFiltering = categoryFilter.length > 0
  const filtering =
    view === 'notes'
      ? Boolean(query.trim()) || categoryFiltering
      : Boolean(query.trim())

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('notebookEyebrow')}</p>
        <h1>
          {view === 'dustbin'
            ? t('dustbinTitle')
            : view === 'tree'
              ? t('treeTitle')
              : view === 'categories'
                ? t('categoriesTitle')
                : view === 'backup'
                  ? t('backupTitle')
                  : view === 'add'
                    ? t('viewAdd')
                    : t('notebookTitle')}
        </h1>
        <p className="section-lede">
          {view === 'dustbin'
            ? t('dustbinLede')
            : view === 'tree'
              ? t('treeLede')
              : view === 'categories'
                ? t('categoriesLede')
                : view === 'backup'
                  ? t('backupLede')
                  : view === 'add'
                    ? t('viewAddLede')
                    : t('notebookLede')}
        </p>
        {cloudOn || accountSynced ? (
          <div className="notebook-cloud-status-row">
            <p
              className={`notebook-cloud-pill${cloudState === 'error' ? ' err' : ''}${
                cloudState === 'syncing' ? ' syncing' : ''
              }`}
              title={accountSynced ? t('authSignedInHint') : t('cloudTitle')}
            >
              {accountSynced
                ? cloudState === 'syncing'
                  ? t('cloudSyncing')
                  : cloudState === 'error'
                    ? t('cloudSyncError', { error: cloudError || 'error' })
                    : t('authSyncOn', { user: authUser || '' })
                : cloudState === 'syncing'
                  ? t('cloudSyncing')
                  : cloudState === 'error'
                    ? t('cloudSyncError', { error: cloudError || 'error' })
                    : t('cloudSynced')}
            </p>
            <button
              type="button"
              className="btn ghost notebook-cloud-verify-btn"
              onClick={() => setView('backup')}
            >
              {t('cloudVerify')}
            </button>
            {count > 0 ? (
              <Link className="btn ghost notebook-cloud-verify-btn" to="/notes-html">
                {t('publicHtmlNav')}
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="notebook-cloud-pill off" title={t('cloudRequiredTitle')}>
            {t('cloudSyncOffBanner')}
          </p>
        )}
        {!cloudOn && count > 0 ? (
          <div className="notebook-cloud-status-row">
            <Link className="btn ghost notebook-cloud-verify-btn" to="/notes-html">
              {t('publicHtmlNav')}
            </Link>
          </div>
        ) : null}
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
            <span className="notebook-view-count">{activeEntries.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'add'}
            className={`notebook-view-tab${view === 'add' ? ' on' : ''}`}
            onClick={() => setView('add')}
          >
            <span aria-hidden="true" className="notebook-view-icon notebook-view-icon-add" />
            {t('viewAdd')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'tree'}
            className={`notebook-view-tab${view === 'tree' ? ' on' : ''}`}
            onClick={() => setView('tree')}
          >
            <span aria-hidden="true" className="notebook-view-icon notebook-view-icon-tree" />
            {t('viewTree')}
            <span className="notebook-view-count">{activeEntries.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'categories'}
            className={`notebook-view-tab${view === 'categories' ? ' on' : ''}`}
            onClick={() => setView('categories')}
          >
            <span
              aria-hidden="true"
              className="notebook-view-icon notebook-view-icon-categories"
            />
            {t('viewCategories')}
            <span className="notebook-view-count">{categories.length}</span>
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
          <button
            type="button"
            role="tab"
            aria-selected={view === 'backup'}
            className={`notebook-view-tab${view === 'backup' ? ' on' : ''}`}
            onClick={() => setView('backup')}
          >
            <span aria-hidden="true" className="notebook-view-icon notebook-view-icon-backup" />
            {t('viewBackup')}
          </button>
        </div>
        {view === 'notes' || view === 'dustbin' ? (
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
                {view === 'notes' && count > 0 ? (
                  <button type="button" className="btn ghost" onClick={onExportNotes}>
                    {t('exportNotes')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {!accountSynced && !cloudOn && (view === 'notes' || view === 'backup') ? (
        <div ref={cloudSetupRef} className="notebook-cloud-setup-anchor">
          {authAvailable ? (
            <section className="notebook-cloud-setup" aria-label={t('authSignIn')}>
              <div className="notebook-cloud-setup-head">
                <h2>{t('authRequiredTitle')}</h2>
                <p>{t('authRequiredBody')}</p>
                <p className="notebook-cloud-setup-note">{t('authRequiredHint')}</p>
              </div>
            </section>
          ) : null}
          <CloudSetupCard
            restoreMode={count === 0 && !skipCloudRestore}
            onEnabled={() => {
              setCloudOn(true)
              setCloudState('synced')
              setSkipCloudRestore(false)
            }}
          />
          {count === 0 && !skipCloudRestore ? (
            <button
              type="button"
              className="btn ghost notebook-cloud-skip"
              onClick={() => setSkipCloudRestore(true)}
            >
              {t('cloudSkipRestore')}
            </button>
          ) : null}
        </div>
      ) : null}

      {recoverToast ? (
        <p className="notebook-toast" role="status">
          {t('recoveredToNotebook')}
        </p>
      ) : null}
      {deletedForeverToast ? (
        <p className="notebook-toast" role="status">
          {t('deletedForeverToast')}
        </p>
      ) : null}
      {storageToast ? (
        <p className="notebook-toast" role="status">
          {storageToast}
        </p>
      ) : null}

      {openedNote ? (
        <div
          className="note-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={t('noteTreeOpen')}
          data-opened-note-id={openedNote.id}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeOpenedNote()
          }}
        >
          <div className="note-fullscreen-panel">
            <div className="note-fullscreen-toolbar">
              <div className="note-fullscreen-head">
                <h2>
                  {openedNote.title?.trim() ||
                    htmlToPlainText(openedNote.selectedText).slice(0, 80) ||
                    t('freeNote')}
                </h2>
                <button
                  type="button"
                  className="btn primary note-fullscreen-close"
                  onClick={closeOpenedNote}
                  aria-label={t('closeNote')}
                >
                  {t('closeNote')}
                </button>
              </div>
              <div className="note-fullscreen-meta">
                <time dateTime={openedNote.createdAt}>
                  {formatTimestamp(openedNote.createdAt, lang)}
                </time>
                <span className="notebook-type">{typeLabel(openedNote.type, t)}</span>
                {(openedNote.categoryIds ?? [])
                  .map((id) => categoryMap.get(id))
                  .filter((c): c is NotebookCategory => Boolean(c))
                  .map((cat) => (
                    <span
                      key={cat.id}
                      className="notebook-category-badge"
                      style={categoryColorStyle(cat.color) as CSSProperties}
                    >
                      <span className="category-dot" aria-hidden="true" />
                      {cat.name}
                    </span>
                  ))}
              </div>
            </div>
            <div className="note-fullscreen-body">
              <NoteBody html={openedNote.selectedText} className="notebook-quote" />
              {openedNote.explanation ? (
                <div className="notebook-explanation">
                  {openedNote.explanation.split(/\n\n+/).map((block, index) => (
                    <p key={`${openedNote.id}-open-${index}`}>{block.replace(/\*\*/g, '')}</p>
                  ))}
                </div>
              ) : null}
              {(openedNote.attachments?.length ?? 0) > 0 ? (
                <NoteAttachments
                  attachments={openedNote.attachments ?? []}
                  canUpload={Boolean(authUser)}
                  onChange={async (next) => {
                    await updateEntry(openedNote.id, { attachments: next })
                  }}
                />
              ) : null}
            </div>
            <div className="notebook-actions note-fullscreen-actions">
              <button
                type="button"
                className="btn primary"
                onClick={closeOpenedNote}
              >
                {t('closeNote')}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => editOpenedNote(openedNote)}
              >
                {t('edit')}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => moveToDustbin(openedNote.id)}
              >
                {t('moveToDustbin')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {view === 'backup' ? (
        <NotebookBackupPanel />
      ) : view === 'dustbin' ? (
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
                <li
                  key={entry.id}
                  data-entry-id={entry.id}
                  className={`notebook-entry ${entry.type} dustbin-entry`}
                >
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
                      onClick={() => void recoverFromDustbin(entry)}
                    >
                      {t('recoverNote')}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => void deleteForeverFromDustbin(entry)}
                    >
                      {t('deleteForever')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )
      ) : view === 'categories' ? (
        <section className="notebook-categories open" aria-label={t('manageCategories')}>
          <div className="notebook-composer-head">
            <h2>{t('manageCategories')}</h2>
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
                  void createCategory()
                }
              }}
            />
            <button
              type="button"
              className="btn primary"
              disabled={!newCategoryName.trim()}
              onClick={() => void createCategory()}
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
      ) : view === 'tree' ? (
        <>
          <NoteTree
            categories={categories}
            entries={activeEntries}
            lang={lang}
            selectedNoteId={openedNoteId}
            onSelectNote={openNoteFromTree}
            t={t}
            embedded
          />

        </>
      ) : view === 'add' ? (
        <section className="notebook-composer notebook-add-panel" aria-label={t('viewAdd')}>
          <div className="notebook-composer-head">
            <div>
              <h2>{t('newNote')}</h2>
              <p className="notebook-add-lede">{t('viewAddLede')}</p>
            </div>
          </div>
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
                autoFocus
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
                ref={composerEditorRef}
                value={newNote}
                onChange={(html) => {
                  setNewNote(html)
                  if (composerError) setComposerError(null)
                }}
                placeholder={t('newNotePlaceholder')}
                ariaLabel={t('noteBodyLabel')}
              />
            </div>
            <NoteAttachments
              attachments={newAttachments}
              canUpload={Boolean(authUser)}
              onChange={(next) => {
                setNewAttachments(next)
                if (composerError) setComposerError(null)
              }}
            />
            {composerError ? (
              <p className="notebook-composer-error" role="alert">
                {composerError}
              </p>
            ) : null}
            <div className="notebook-actions">
              <button type="button" className="btn primary" onClick={() => void createNote()}>
                {t('createNote')}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setNewTitle('')
                  setNewNote('')
                  setNewCategoryIds([])
                  setNewAttachments([])
                  setComposerError(null)
                  setView('notes')
                }}
              >
                {t('cancelEdit')}
              </button>
            </div>
          </div>
        </section>
      ) : !cloudOn && count === 0 && !skipCloudRestore ? (
        null
      ) : (
        <>
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
          <div className="notebook-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => setView('add')}
            >
              {t('viewAdd')}
            </button>
          </div>
          <p className="notebook-recover-hint">{t('recoverNotesHint')}</p>
          <p className="notebook-recover-hint">{t('recoveryDumpHint')}</p>
          {recoveryMessage ? (
            <p className="notebook-recover-status" role="status">
              {recoveryMessage}
            </p>
          ) : null}
          <div className="notebook-actions">
            <button
              type="button"
              className="btn primary"
              disabled={recoveryBusy}
              onClick={() => void onRecoveryDump()}
            >
              {t('recoveryDump')}
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={recoveryBusy}
              onClick={() => void onRecoverNotes()}
            >
              {t('recoverNotes')}
            </button>
            <button type="button" className="btn ghost" onClick={() => setView('backup')}>
              {t('viewBackup')}
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={recoveryBusy}
              onClick={onExportNotes}
            >
              {t('exportNotes')}
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={recoveryBusy}
              onClick={() => importInputRef.current?.click()}
            >
              {t('importNotes')}
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
            />
          </div>
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
              entry.type === 'note'
                ? isBlankHtml(draftText) && draftAttachments.length === 0
                : !draftText.trim()
            const entryCategories = (entry.categoryIds ?? [])
              .map((id) => categoryMap.get(id))
              .filter((c): c is NotebookCategory => Boolean(c))
            return (
              <li
                key={entry.id}
                data-entry-id={entry.id}
                className={`notebook-entry notebook-entry-card ${entry.type}${editing ? ' editing' : ''}${
                  treeFocusId === entry.id || openedNoteId === entry.id ? ' tree-focus' : ''
                }`}
              >
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
                          onClick={(e) => {
                            e.stopPropagation()
                            filterByCategoryId(cat.id)
                          }}
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
                          ref={editEditorRef}
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
                    <NoteAttachments
                      attachments={draftAttachments}
                      canUpload={Boolean(authUser)}
                      onChange={setDraftAttachments}
                    />
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
                    <button
                      type="button"
                      className="notebook-entry-preview"
                      title={t('openNoteFullHint')}
                      aria-label={t('openNoteFullHint')}
                      onClick={() => openNoteFullScreen(entry)}
                    >
                      {entry.title ? (
                        <h3 className="notebook-entry-title">{entry.title}</h3>
                      ) : null}
                      {(() => {
                        const bodySummary = htmlToPlainText(entry.selectedText).trim()
                        const explanationSummary = (entry.explanation || '')
                          .replace(/\*\*/g, '')
                          .trim()
                        const summary = [bodySummary, explanationSummary]
                          .filter(Boolean)
                          .join('\n\n')
                        return summary ? (
                          <p className="notebook-entry-summary">{summary}</p>
                        ) : null
                      })()}
                      {(entry.attachments?.length ?? 0) > 0 ? (
                        <p className="notebook-entry-attach-count">
                          {t('attachTitle')}: {entry.attachments!.length}
                        </p>
                      ) : null}
                    </button>
                    <div className="notebook-actions notebook-entry-card-actions">
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => openNoteFullScreen(entry)}
                      >
                        {t('openNoteFull')}
                      </button>
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
