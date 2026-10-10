import { isCategoryColorId, nextCategoryColor } from '../lib/categoryColors'
import {
  IDB_KEYS,
  idbGet,
  idbGetMeta,
  idbSet,
  idbSetMeta,
  isPersistenceQuotaExceeded,
} from '../lib/notebookPersistence'
import type { NotebookCategory, NotebookEntry, TrashedNotebookEntry } from './useNotebook'

const LS_ENTRIES = 'ownlab-notebook-v1'
const LS_TRASH = 'ownlab-notebook-trash-v1'
const LS_CATEGORIES = 'ownlab-notebook-categories-v1'

type EntryListener = (entries: NotebookEntry[]) => void
type TrashListener = (trash: TrashedNotebookEntry[]) => void
type CategoryListener = (categories: NotebookCategory[]) => void
type ReadyListener = () => void

const entryListeners = new Set<EntryListener>()
const trashListeners = new Set<TrashListener>()
const categoryListeners = new Set<CategoryListener>()
const readyListeners = new Set<ReadyListener>()

export type NotebookStorageErrorCode = 'quota' | 'unknown'

export class NotebookStorageError extends Error {
  readonly code: NotebookStorageErrorCode

  constructor(code: NotebookStorageErrorCode, message?: string) {
    super(message ?? (code === 'quota' ? 'Notebook storage is full' : 'Notebook storage failed'))
    this.name = 'NotebookStorageError'
    this.code = code
  }
}

type Cache = {
  entries: NotebookEntry[]
  trash: TrashedNotebookEntry[]
  categories: NotebookCategory[]
}

const cache: Cache = {
  entries: [],
  trash: [],
  categories: [],
}

let ready = false
let readyPromise: Promise<void> | null = null

function sortEntries(entries: NotebookEntry[]): NotebookEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function sortTrash(trash: TrashedNotebookEntry[]): TrashedNotebookEntry[] {
  return [...trash].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  )
}

function sortCategories(categories: NotebookCategory[]): NotebookCategory[] {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

function parseEntries(raw: unknown): NotebookEntry[] {
  if (!Array.isArray(raw)) return []
  return sortEntries(raw as NotebookEntry[])
}

function parseTrash(raw: unknown): TrashedNotebookEntry[] {
  if (!Array.isArray(raw)) return []
  return sortTrash(
    (raw as TrashedNotebookEntry[]).filter(
      (e) =>
        e &&
        typeof e.id === 'string' &&
        typeof e.selectedText === 'string' &&
        typeof e.deletedAt === 'string',
    ),
  )
}

function normalizeCategory(
  raw: Partial<NotebookCategory>,
  usedColors: Array<string | undefined>,
): NotebookCategory | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  const color = isCategoryColorId(raw.color) ? raw.color : nextCategoryColor(usedColors)
  return {
    id: raw.id,
    name: raw.name,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    color,
  }
}

function parseCategories(raw: unknown): NotebookCategory[] {
  if (!Array.isArray(raw)) return []
  const used: Array<string | undefined> = []
  const normalized: NotebookCategory[] = []
  for (const item of raw as Partial<NotebookCategory>[]) {
    const cat = normalizeCategory(item, used)
    if (!cat) continue
    used.push(cat.color)
    normalized.push(cat)
  }
  return sortCategories(normalized)
}

function readLocalStorageJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

function clearLocalStorageNotebookKeys() {
  try {
    localStorage.removeItem(LS_ENTRIES)
    localStorage.removeItem(LS_TRASH)
    localStorage.removeItem(LS_CATEGORIES)
  } catch {
    /* ignore */
  }
}

async function persistKey(key: typeof IDB_KEYS.entries | typeof IDB_KEYS.trash | typeof IDB_KEYS.categories, value: unknown) {
  try {
    await idbSet(key, value)
  } catch (err) {
    throw new NotebookStorageError(isPersistenceQuotaExceeded(err) ? 'quota' : 'unknown')
  }
}

async function hydrate(): Promise<void> {
  let entries: NotebookEntry[] = []
  let trash: TrashedNotebookEntry[] = []
  let categories: NotebookCategory[] = []

  try {
    const meta = await idbGetMeta()
    const idbEntries = await idbGet<NotebookEntry[]>(IDB_KEYS.entries)
    const idbTrash = await idbGet<TrashedNotebookEntry[]>(IDB_KEYS.trash)
    const idbCategories = await idbGet<NotebookCategory[]>(IDB_KEYS.categories)

    const hasIdb =
      idbEntries !== undefined || idbTrash !== undefined || idbCategories !== undefined || Boolean(meta)

    if (hasIdb) {
      entries = parseEntries(idbEntries ?? [])
      trash = parseTrash(idbTrash ?? [])
      categories = parseCategories(idbCategories ?? [])
    } else {
      // First launch on IndexedDB: migrate any legacy localStorage notebook.
      entries = parseEntries(readLocalStorageJson(LS_ENTRIES))
      trash = parseTrash(readLocalStorageJson(LS_TRASH))
      categories = parseCategories(readLocalStorageJson(LS_CATEGORIES))
      const hadLocalData = entries.length > 0 || trash.length > 0 || categories.length > 0
      await persistKey(IDB_KEYS.entries, entries)
      await persistKey(IDB_KEYS.trash, trash)
      await persistKey(IDB_KEYS.categories, categories)
      await idbSetMeta({
        storageBackend: 'indexeddb',
        migratedFromLocalStorageAt: hadLocalData ? new Date().toISOString() : undefined,
      })
      clearLocalStorageNotebookKeys()
      if (hadLocalData) (cache as Cache & { _migrated?: boolean })._migrated = true
    }

    // If IDB already existed but localStorage still has newer/orphan data (partial
    // prior migrate), merge by id without dropping either side.
    const lsEntries = parseEntries(readLocalStorageJson(LS_ENTRIES))
    const lsTrash = parseTrash(readLocalStorageJson(LS_TRASH))
    const lsCategories = parseCategories(readLocalStorageJson(LS_CATEGORIES))
    if (lsEntries.length || lsTrash.length || lsCategories.length) {
      const entryIds = new Set(entries.map((e) => e.id))
      const mergedEntries = sortEntries([
        ...entries,
        ...lsEntries.filter((e) => e?.id && !entryIds.has(e.id)),
      ])
      const trashIds = new Set(trash.map((e) => e.id))
      const mergedTrash = sortTrash([
        ...trash,
        ...lsTrash.filter((e) => e?.id && !trashIds.has(e.id)),
      ])
      const catIds = new Set(categories.map((c) => c.id))
      const mergedCategories = sortCategories([
        ...categories,
        ...lsCategories.filter((c) => c?.id && !catIds.has(c.id)),
      ])
      entries = mergedEntries
      trash = mergedTrash
      categories = mergedCategories
      await persistKey(IDB_KEYS.entries, entries)
      await persistKey(IDB_KEYS.trash, trash)
      await persistKey(IDB_KEYS.categories, categories)
      clearLocalStorageNotebookKeys()
      ;(cache as Cache & { _migrated?: boolean })._migrated = true
    }
  } catch {
    // Fall back to whatever localStorage still has if IDB is blocked.
    entries = parseEntries(readLocalStorageJson(LS_ENTRIES))
    trash = parseTrash(readLocalStorageJson(LS_TRASH))
    categories = parseCategories(readLocalStorageJson(LS_CATEGORIES))
  }

  cache.entries = entries
  cache.trash = trash
  cache.categories = categories
  ready = true
  entryListeners.forEach((listener) => listener(cache.entries))
  trashListeners.forEach((listener) => listener(cache.trash))
  categoryListeners.forEach((listener) => listener(cache.categories))
  readyListeners.forEach((listener) => listener())
}

function ensureReady(): Promise<void> {
  if (ready) return Promise.resolve()
  if (!readyPromise) readyPromise = hydrate()
  return readyPromise
}

// Kick off hydration as soon as the module loads in the browser.
if (typeof window !== 'undefined') {
  void ensureReady()
}

async function writeEntries(entries: NotebookEntry[]) {
  await ensureReady()
  const sorted = sortEntries(entries)
  await persistKey(IDB_KEYS.entries, sorted)
  cache.entries = sorted
  entryListeners.forEach((listener) => listener(sorted))
}

async function writeTrash(trash: TrashedNotebookEntry[]) {
  await ensureReady()
  const sorted = sortTrash(trash)
  await persistKey(IDB_KEYS.trash, sorted)
  cache.trash = sorted
  trashListeners.forEach((listener) => listener(sorted))
}

async function writeCategories(categories: NotebookCategory[]) {
  await ensureReady()
  const sorted = sortCategories(categories)
  await persistKey(IDB_KEYS.categories, sorted)
  cache.categories = sorted
  categoryListeners.forEach((listener) => listener(sorted))
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeCategoryIds(ids: string[] | undefined): string[] | undefined {
  if (!ids?.length) return undefined
  const unique = [...new Set(ids.filter(Boolean))]
  return unique.length ? unique : undefined
}

const MIGRATION_BANNER_KEY = 'ownlab-notebook-idb-banner-seen'

export const notebookStore = {
  ready: ensureReady,
  isReady: () => ready,
  get: () => cache.entries,
  getTrash: () => cache.trash,
  getCategories: () => cache.categories,
  /** True once after a localStorage → IndexedDB migration (for a one-time UI notice). */
  consumeMigrationNotice(): boolean {
    try {
      if (localStorage.getItem(MIGRATION_BANNER_KEY) === '1') return false
      // Only show if we actually cleared/migrated LS data this session or earlier.
      // Flag is set when hydrate wrote meta.migratedFromLocalStorageAt for the first time,
      // or when merge-from-LS ran. We detect via meta asynchronously in hydrate and
      // stash a session hint on cache.
      if (!(cache as Cache & { _migrated?: boolean })._migrated) return false
      localStorage.setItem(MIGRATION_BANNER_KEY, '1')
      return true
    } catch {
      return false
    }
  },
  subscribe(listener: EntryListener) {
    entryListeners.add(listener)
    return () => {
      entryListeners.delete(listener)
    }
  },
  subscribeTrash(listener: TrashListener) {
    trashListeners.add(listener)
    return () => {
      trashListeners.delete(listener)
    }
  },
  subscribeCategories(listener: CategoryListener) {
    categoryListeners.add(listener)
    return () => {
      categoryListeners.delete(listener)
    }
  },
  subscribeReady(listener: ReadyListener) {
    readyListeners.add(listener)
    if (ready) listener()
    return () => {
      readyListeners.delete(listener)
    }
  },
  async addClip(input: {
    selectedText: string
    sourceLabel?: string
    sourcePath?: string
    categoryIds?: string[]
  }) {
    await ensureReady()
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'clip',
      selectedText: input.selectedText.trim(),
      categoryIds: normalizeCategoryIds(input.categoryIds),
      sourceLabel: input.sourceLabel,
      sourcePath: input.sourcePath,
    }
    await writeEntries([entry, ...cache.entries])
    return entry
  },
  async addExplanation(input: {
    selectedText: string
    explanation: string
    sourceLabel?: string
    sourcePath?: string
    model?: string
    categoryIds?: string[]
  }) {
    await ensureReady()
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'explanation',
      selectedText: input.selectedText.trim(),
      explanation: input.explanation.trim(),
      categoryIds: normalizeCategoryIds(input.categoryIds),
      sourceLabel: input.sourceLabel,
      sourcePath: input.sourcePath,
      model: input.model,
    }
    await writeEntries([entry, ...cache.entries])
    return entry
  },
  async addNote(input: { text: string; title?: string; categoryIds?: string[] }) {
    await ensureReady()
    const text = input.text.trim()
    if (!text) return null
    const title = input.title?.trim() || undefined
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'note',
      title,
      selectedText: text,
      categoryIds: normalizeCategoryIds(input.categoryIds),
      sourceLabel: 'Notebook',
    }
    await writeEntries([entry, ...cache.entries])
    return entry
  },
  async update(
    id: string,
    patch: {
      title?: string
      selectedText?: string
      explanation?: string
      categoryIds?: string[]
    },
  ) {
    await ensureReady()
    const entries = cache.entries
    const index = entries.findIndex((e) => e.id === id)
    if (index < 0) return null
    const current = entries[index]
    const selectedText =
      patch.selectedText !== undefined ? patch.selectedText.trim() : current.selectedText
    if (!selectedText) return null

    let explanation = current.explanation
    if (patch.explanation !== undefined) {
      const next = patch.explanation.trim()
      explanation = next || undefined
    }

    let title = current.title
    if (patch.title !== undefined) {
      const next = patch.title.trim()
      title = next || undefined
    }

    const categoryIds =
      patch.categoryIds !== undefined
        ? normalizeCategoryIds(patch.categoryIds)
        : current.categoryIds

    const updated: NotebookEntry = {
      ...current,
      title,
      selectedText,
      categoryIds,
      explanation: current.type === 'explanation' ? explanation ?? '' : explanation,
      updatedAt: new Date().toISOString(),
    }
    const next = [...entries]
    next[index] = updated
    await writeEntries(next)
    return updated
  },
  async remove(id: string) {
    await ensureReady()
    const entries = cache.entries
    const entry = entries.find((e) => e.id === id)
    if (!entry) return null
    const deletedAt = new Date().toISOString()
    const trashed: TrashedNotebookEntry = { ...entry, deletedAt }
    await writeTrash([trashed, ...cache.trash.filter((e) => e.id !== id)])
    await writeEntries(entries.filter((e) => e.id !== id))
    return trashed
  },
  async restore(id: string) {
    await ensureReady()
    const trash = cache.trash
    const index = trash.findIndex((e) => e.id === id)
    if (index < 0) return null
    const trashed = trash[index]
    const restored: NotebookEntry = {
      id: trashed.id,
      createdAt: trashed.createdAt,
      updatedAt: new Date().toISOString(),
      type: trashed.type,
      title: trashed.title,
      selectedText: trashed.selectedText,
      explanation: trashed.explanation,
      categoryIds: trashed.categoryIds,
      sourceLabel: trashed.sourceLabel,
      sourcePath: trashed.sourcePath,
      model: trashed.model,
    }
    await writeTrash(trash.filter((e) => e.id !== id))
    const active = cache.entries
    if (active.some((e) => e.id === restored.id)) {
      restored.id = uid('nb')
    }
    await writeEntries([restored, ...active])
    return restored
  },
  async clear() {
    await ensureReady()
    const now = new Date().toISOString()
    const moving = cache.entries.map((entry) => ({ ...entry, deletedAt: now }))
    if (moving.length) {
      const keep = cache.trash.filter((t) => !moving.some((m) => m.id === t.id))
      await writeTrash([...moving, ...keep])
    }
    await writeEntries([])
  },
  async addCategory(name: string) {
    await ensureReady()
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = cache.categories
    if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ?? null
    }
    const category: NotebookCategory = {
      id: uid('cat'),
      name: trimmed,
      createdAt: new Date().toISOString(),
      color: nextCategoryColor(existing.map((c) => c.color)),
    }
    await writeCategories([...existing, category])
    return category
  },
  async renameCategory(id: string, name: string) {
    await ensureReady()
    const trimmed = name.trim()
    if (!trimmed) return null
    const categories = cache.categories
    const index = categories.findIndex((c) => c.id === id)
    if (index < 0) return null
    if (
      categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return null
    }
    const updated = { ...categories[index], name: trimmed }
    const next = [...categories]
    next[index] = updated
    await writeCategories(next)
    return updated
  },
  async removeCategory(id: string) {
    await ensureReady()
    await writeCategories(cache.categories.filter((c) => c.id !== id))
    const entries = cache.entries
    let changed = false
    const next = entries.map((entry) => {
      if (!entry.categoryIds?.includes(id)) return entry
      changed = true
      return {
        ...entry,
        categoryIds: normalizeCategoryIds(entry.categoryIds.filter((cid) => cid !== id)),
        updatedAt: new Date().toISOString(),
      }
    })
    if (changed) await writeEntries(next)
  },
}
