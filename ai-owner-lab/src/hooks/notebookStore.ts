import { isCategoryColorId, nextCategoryColor } from '../lib/categoryColors'
import {
  IDB_KEYS,
  idbGet,
  idbGetMeta,
  idbSetMeta,
  idbSetVerified,
  isPersistenceQuotaExceeded,
  type NotebookSnapshot,
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

function isEntryLike(e: unknown): e is NotebookEntry {
  if (!e || typeof e !== 'object') return false
  const row = e as Partial<NotebookEntry>
  return typeof row.id === 'string' && typeof row.selectedText === 'string'
}

function parseEntries(raw: unknown): NotebookEntry[] {
  if (!Array.isArray(raw)) return []
  return sortEntries(raw.filter(isEntryLike))
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

function entryTime(e: NotebookEntry): number {
  return new Date(e.updatedAt || e.createdAt).getTime()
}

function mergeEntries(...lists: NotebookEntry[][]): NotebookEntry[] {
  const map = new Map<string, NotebookEntry>()
  for (const list of lists) {
    for (const entry of list) {
      if (!isEntryLike(entry)) continue
      const prev = map.get(entry.id)
      if (!prev || entryTime(entry) >= entryTime(prev)) map.set(entry.id, entry)
    }
  }
  return sortEntries([...map.values()])
}

function mergeTrash(...lists: TrashedNotebookEntry[][]): TrashedNotebookEntry[] {
  const map = new Map<string, TrashedNotebookEntry>()
  for (const list of lists) {
    for (const entry of list) {
      if (!entry?.id) continue
      const prev = map.get(entry.id)
      if (!prev || new Date(entry.deletedAt).getTime() >= new Date(prev.deletedAt).getTime()) {
        map.set(entry.id, entry)
      }
    }
  }
  return sortTrash([...map.values()])
}

function mergeCategories(...lists: NotebookCategory[][]): NotebookCategory[] {
  const map = new Map<string, NotebookCategory>()
  for (const list of lists) {
    for (const cat of list) {
      if (!cat?.id) continue
      if (!map.has(cat.id)) map.set(cat.id, cat)
    }
  }
  return sortCategories([...map.values()])
}

function snapshotFrom(
  entries: NotebookEntry[],
  trash: TrashedNotebookEntry[],
  categories: NotebookCategory[],
): NotebookSnapshot {
  return {
    savedAt: new Date().toISOString(),
    entries,
    trash,
    categories,
  }
}

function parseSnapshot(raw: unknown): {
  entries: NotebookEntry[]
  trash: TrashedNotebookEntry[]
  categories: NotebookCategory[]
} | null {
  if (!raw || typeof raw !== 'object') return null
  const snap = raw as Partial<NotebookSnapshot>
  return {
    entries: parseEntries(snap.entries),
    trash: parseTrash(snap.trash),
    categories: parseCategories(snap.categories),
  }
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

async function persistKey(
  key: typeof IDB_KEYS.entries | typeof IDB_KEYS.trash | typeof IDB_KEYS.categories,
  value: unknown,
) {
  try {
    await idbSetVerified(key, value)
  } catch (err) {
    throw new NotebookStorageError(isPersistenceQuotaExceeded(err) ? 'quota' : 'unknown')
  }
}

async function saveSnapshot(
  entries: NotebookEntry[],
  trash: TrashedNotebookEntry[],
  categories: NotebookCategory[],
) {
  // Only snapshot when there is something to protect.
  if (!entries.length && !trash.length && !categories.length) return
  try {
    const current = await idbGet<NotebookSnapshot>(IDB_KEYS.snapshot)
    if (current) {
      await idbSetVerified(IDB_KEYS.snapshotPrev, current)
    }
    await idbSetVerified(IDB_KEYS.snapshot, snapshotFrom(entries, trash, categories))
    const meta = (await idbGetMeta()) ?? { storageBackend: 'indexeddb' as const }
    await idbSetMeta({ ...meta, storageBackend: 'indexeddb', lastBackupAt: new Date().toISOString() })
  } catch {
    /* best-effort backup — never block the primary write path for backup failure alone */
  }
}

async function gatherAllSources(): Promise<{
  entries: NotebookEntry[]
  trash: TrashedNotebookEntry[]
  categories: NotebookCategory[]
  recoveredFromBackup: boolean
  recoveredFromLocalStorage: boolean
}> {
  const idbEntries = parseEntries(await idbGet(IDB_KEYS.entries))
  const idbTrash = parseTrash(await idbGet(IDB_KEYS.trash))
  const idbCategories = parseCategories(await idbGet(IDB_KEYS.categories))

  const snap = parseSnapshot(await idbGet(IDB_KEYS.snapshot))
  const snapPrev = parseSnapshot(await idbGet(IDB_KEYS.snapshotPrev))

  const lsEntries = parseEntries(readLocalStorageJson(LS_ENTRIES))
  const lsTrash = parseTrash(readLocalStorageJson(LS_TRASH))
  const lsCategories = parseCategories(readLocalStorageJson(LS_CATEGORIES))

  const entries = mergeEntries(
    idbEntries,
    snap?.entries ?? [],
    snapPrev?.entries ?? [],
    lsEntries,
  )
  const trash = mergeTrash(idbTrash, snap?.trash ?? [], snapPrev?.trash ?? [], lsTrash)
  const categories = mergeCategories(
    idbCategories,
    snap?.categories ?? [],
    snapPrev?.categories ?? [],
    lsCategories,
  )

  const recoveredFromBackup =
    idbEntries.length === 0 &&
    entries.length > 0 &&
    (Boolean(snap?.entries.length) || Boolean(snapPrev?.entries.length))
  const recoveredFromLocalStorage =
    idbEntries.length < entries.length && lsEntries.length > 0

  return { entries, trash, categories, recoveredFromBackup, recoveredFromLocalStorage }
}

async function hydrate(): Promise<void> {
  let entries: NotebookEntry[] = []
  let trash: TrashedNotebookEntry[] = []
  let categories: NotebookCategory[] = []
  let recovered = false

  try {
    const gathered = await gatherAllSources()
    entries = gathered.entries
    trash = gathered.trash
    categories = gathered.categories
    recovered = gathered.recoveredFromBackup || gathered.recoveredFromLocalStorage

    // Persist merged result when we recovered/merged anything extra, or first-time migrate.
    const primaryEntries = parseEntries(await idbGet(IDB_KEYS.entries))
    const needsPersist =
      recovered ||
      primaryEntries.length !== entries.length ||
      (await idbGet(IDB_KEYS.entries)) === undefined

    if (needsPersist && (entries.length || trash.length || categories.length)) {
      await saveSnapshot(entries, trash, categories)
      await persistKey(IDB_KEYS.entries, entries)
      await persistKey(IDB_KEYS.trash, trash)
      await persistKey(IDB_KEYS.categories, categories)
      await idbSetMeta({
        storageBackend: 'indexeddb',
        migratedFromLocalStorageAt: gathered.recoveredFromLocalStorage
          ? new Date().toISOString()
          : undefined,
        lastBackupAt: new Date().toISOString(),
      })
      // Only clear legacy LS after a verified IDB write of the merged set.
      if (entries.length > 0 || trash.length > 0 || categories.length > 0) {
        const verified = parseEntries(await idbGet(IDB_KEYS.entries))
        if (verified.length === entries.length) {
          clearLocalStorageNotebookKeys()
        }
      }
      if (gathered.recoveredFromLocalStorage || gathered.recoveredFromBackup) {
        ;(cache as Cache & { _migrated?: boolean })._migrated = true
      }
    } else if ((await idbGet(IDB_KEYS.entries)) === undefined) {
      // Empty first visit — initialize IDB keys but keep any LS untouched if present.
      await persistKey(IDB_KEYS.entries, [])
      await persistKey(IDB_KEYS.trash, [])
      await persistKey(IDB_KEYS.categories, [])
      await idbSetMeta({ storageBackend: 'indexeddb' })
    }

    if (recovered) {
      ;(cache as Cache & { _recovered?: boolean })._recovered = true
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
  // Keep prior durable snapshot as snapshotPrev, then write primary.
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await persistKey(IDB_KEYS.entries, sorted)
  cache.entries = sorted
  entryListeners.forEach((listener) => listener(sorted))
  // After a successful write, point the latest snapshot at the new durable set.
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
}

async function writeTrash(trash: TrashedNotebookEntry[]) {
  await ensureReady()
  const sorted = sortTrash(trash)
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await persistKey(IDB_KEYS.trash, sorted)
  cache.trash = sorted
  trashListeners.forEach((listener) => listener(sorted))
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
}

async function writeCategories(categories: NotebookCategory[]) {
  await ensureReady()
  const sorted = sortCategories(categories)
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await persistKey(IDB_KEYS.categories, sorted)
  cache.categories = sorted
  categoryListeners.forEach((listener) => listener(sorted))
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
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
      if (!(cache as Cache & { _migrated?: boolean })._migrated) return false
      localStorage.setItem(MIGRATION_BANNER_KEY, '1')
      return true
    } catch {
      return false
    }
  },
  consumeRecoveryNotice(): boolean {
    const flagged = (cache as Cache & { _recovered?: boolean })._recovered
    if (!flagged) return false
    ;(cache as Cache & { _recovered?: boolean })._recovered = false
    return true
  },
  /** Rescan localStorage + IDB backups and merge anything still present. */
  async recoverFromBackups(): Promise<{ restored: number; total: number }> {
    await ensureReady()
    const before = cache.entries.length
    const gathered = await gatherAllSources()
    const entries = gathered.entries
    const trash = gathered.trash
    const categories = gathered.categories
    if (
      entries.length === cache.entries.length &&
      trash.length === cache.trash.length &&
      categories.length === cache.categories.length
    ) {
      return { restored: 0, total: cache.entries.length }
    }
    await saveSnapshot(entries, trash, categories)
    await persistKey(IDB_KEYS.entries, entries)
    await persistKey(IDB_KEYS.trash, trash)
    await persistKey(IDB_KEYS.categories, categories)
    cache.entries = entries
    cache.trash = trash
    cache.categories = categories
    entryListeners.forEach((listener) => listener(entries))
    trashListeners.forEach((listener) => listener(trash))
    categoryListeners.forEach((listener) => listener(categories))
    return { restored: Math.max(0, entries.length - before), total: entries.length }
  },
  /** Download a JSON backup of notes / trash / categories. */
  exportBackup(): string {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        entries: cache.entries,
        trash: cache.trash,
        categories: cache.categories,
      },
      null,
      2,
    )
  },
  async importBackup(json: string): Promise<{ total: number }> {
    await ensureReady()
    let parsed: unknown
    try {
      parsed = JSON.parse(json) as unknown
    } catch {
      throw new NotebookStorageError('unknown', 'Invalid backup file')
    }
    const body = parsed as {
      entries?: unknown
      trash?: unknown
      categories?: unknown
    }
    const entries = mergeEntries(cache.entries, parseEntries(body.entries))
    const trash = mergeTrash(cache.trash, parseTrash(body.trash))
    const categories = mergeCategories(cache.categories, parseCategories(body.categories))
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    await persistKey(IDB_KEYS.entries, entries)
    await persistKey(IDB_KEYS.trash, trash)
    await persistKey(IDB_KEYS.categories, categories)
    cache.entries = entries
    cache.trash = trash
    cache.categories = categories
    entryListeners.forEach((listener) => listener(entries))
    trashListeners.forEach((listener) => listener(trash))
    categoryListeners.forEach((listener) => listener(categories))
    return { total: entries.length }
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
