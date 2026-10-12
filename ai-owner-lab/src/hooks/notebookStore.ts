import { isCategoryColorId, nextCategoryColor } from '../lib/categoryColors'
import { readFolderBackup, requestPersistentStorage, writeFolderBackup } from '../lib/notebookFolderBackup'
import {
  getCloudSyncStatus,
  isCloudSyncReady,
  loadGistSettings,
  pullGistBackup,
  pushGistBackup,
  resolveOwnlabNotebookGist,
  saveGistSettings,
  setLastCloudSyncAt,
} from '../lib/notebookGistSync'
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

  // Ask the browser not to evict notebook storage under disk pressure.
  void requestPersistentStorage()

  // Merge any newer on-disk / cloud backup after primary hydrate settles.
  void (async () => {
    try {
      const folderJson = await readFolderBackup()
      if (folderJson) await notebookStore.importBackup(folderJson)
    } catch {
      /* ignore */
    }
    try {
      if (isCloudSyncReady()) {
        const gistJson = await pullGistBackup()
        if (gistJson) {
          await notebookStore.importBackup(gistJson)
          setLastCloudSyncAt()
        }
      }
    } catch {
      /* ignore */
    }
    await scheduleDurableSync()
  })()
}

function ensureReady(): Promise<void> {
  if (ready) return Promise.resolve()
  if (!readyPromise) readyPromise = hydrate()
  return readyPromise
}

let cloudPullInFlight: Promise<void> | null = null

/** Pull cloud notes when the tab becomes visible again (other-device edits). */
async function pullCloudIfConfigured() {
  if (!isCloudSyncReady()) return
  if (cloudPullInFlight) return cloudPullInFlight
  cloudPullInFlight = (async () => {
    try {
      const gistJson = await pullGistBackup()
      if (gistJson) {
        await notebookStore.importBackup(gistJson)
        setLastCloudSyncAt()
      }
    } catch {
      /* ignore offline / auth errors */
    } finally {
      cloudPullInFlight = null
    }
  })()
  return cloudPullInFlight
}

// Kick off hydration as soon as the module loads in the browser.
if (typeof window !== 'undefined') {
  void ensureReady()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void pullCloudIfConfigured()
  })
  window.addEventListener('focus', () => {
    void pullCloudIfConfigured()
  })
}

function buildBackupJson(): string {
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
}

let durableTimer: ReturnType<typeof setTimeout> | null = null
let cloudPushInFlight: Promise<void> | null = null

export type CloudRuntimeState = 'off' | 'syncing' | 'synced' | 'error'

type CloudRuntime = {
  state: CloudRuntimeState
  lastSyncedAt: string | null
  error: string | null
  gistId: string
}

type CloudRuntimeListener = (runtime: CloudRuntime) => void
const cloudRuntimeListeners = new Set<CloudRuntimeListener>()

let cloudRuntime: CloudRuntime = {
  state: isCloudSyncReady() ? 'synced' : 'off',
  lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
  error: null,
  gistId: getCloudSyncStatus().gistId,
}

function setCloudRuntime(patch: Partial<CloudRuntime>) {
  cloudRuntime = { ...cloudRuntime, ...patch }
  cloudRuntimeListeners.forEach((listener) => listener(cloudRuntime))
}

function refreshCloudRuntimeFromSettings() {
  const status = getCloudSyncStatus()
  if (!isCloudSyncReady()) {
    setCloudRuntime({
      state: 'off',
      lastSyncedAt: status.lastSyncedAt,
      error: null,
      gistId: status.gistId,
    })
    return
  }
  setCloudRuntime({
    state: cloudRuntime.state === 'error' ? 'error' : 'synced',
    lastSyncedAt: status.lastSyncedAt,
    gistId: status.gistId,
  })
}

/** Debounced folder backup only (local disk). */
function scheduleFolderBackup() {
  if (typeof window === 'undefined') return
  if (durableTimer) window.clearTimeout(durableTimer)
  durableTimer = window.setTimeout(() => {
    durableTimer = null
    void writeFolderBackup(buildBackupJson()).catch(() => {
      /* folder not configured / permission denied */
    })
  }, 1200)
}

/** Push notebook to cloud immediately when sync is enabled (awaits in-flight). */
async function flushCloudSync() {
  if (!isCloudSyncReady()) {
    setCloudRuntime({ state: 'off', error: null })
    return
  }
  if (cloudPushInFlight) return cloudPushInFlight
  setCloudRuntime({ state: 'syncing', error: null })
  cloudPushInFlight = (async () => {
    try {
      const result = await pushGistBackup(buildBackupJson())
      setCloudRuntime({
        state: 'synced',
        lastSyncedAt: new Date().toISOString(),
        error: null,
        gistId: result.gistId,
      })
    } catch (err) {
      setCloudRuntime({
        state: 'error',
        error: err instanceof Error ? err.message : 'Cloud sync failed',
      })
    } finally {
      cloudPushInFlight = null
    }
  })()
  return cloudPushInFlight
}

/** Folder (debounced) + cloud (immediate when enabled). */
async function scheduleDurableSync() {
  scheduleFolderBackup()
  await flushCloudSync()
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
  await scheduleDurableSync()
}

async function writeTrash(trash: TrashedNotebookEntry[]) {
  await ensureReady()
  const sorted = sortTrash(trash)
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await persistKey(IDB_KEYS.trash, sorted)
  cache.trash = sorted
  trashListeners.forEach((listener) => listener(sorted))
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await scheduleDurableSync()
}

async function writeCategories(categories: NotebookCategory[]) {
  await ensureReady()
  const sorted = sortCategories(categories)
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await persistKey(IDB_KEYS.categories, sorted)
  cache.categories = sorted
  categoryListeners.forEach((listener) => listener(sorted))
  await saveSnapshot(cache.entries, cache.trash, cache.categories)
  await scheduleDurableSync()
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
  /** Rescan localStorage + IDB + folder/Gist backups and merge anything still present. */
  async recoverFromBackups(): Promise<{ restored: number; total: number }> {
    await ensureReady()
    const before = cache.entries.length
    const gathered = await gatherAllSources()
    const entries = gathered.entries
    const trash = gathered.trash
    const categories = gathered.categories
    const localChanged =
      entries.length !== cache.entries.length ||
      trash.length !== cache.trash.length ||
      categories.length !== cache.categories.length
    if (localChanged) {
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
    }
    await notebookStore.pullRemoteBackups()
    return { restored: Math.max(0, cache.entries.length - before), total: cache.entries.length }
  },
  /** Download a JSON backup of notes / trash / categories. */
  exportBackup(): string {
    return buildBackupJson()
  },
  /**
   * Dump every notebook-related IndexedDB + localStorage remnant for recovery.
   * No DevTools required — use this when F12 / Application panel is unavailable.
   */
  async dumpRecoveryStorage(): Promise<{
    json: string
    entryCount: number
    sources: string[]
  }> {
    await ensureReady()
    const idbEntries = await idbGet(IDB_KEYS.entries)
    const idbTrash = await idbGet(IDB_KEYS.trash)
    const idbCategories = await idbGet(IDB_KEYS.categories)
    const snapshot = await idbGet(IDB_KEYS.snapshot)
    const snapshotPrev = await idbGet(IDB_KEYS.snapshotPrev)
    const meta = await idbGetMeta()
    const lsEntries = readLocalStorageJson(LS_ENTRIES)
    const lsTrash = readLocalStorageJson(LS_TRASH)
    const lsCategories = readLocalStorageJson(LS_CATEGORIES)

    const merged = await gatherAllSources()
    const sources: string[] = []
    if (parseEntries(idbEntries).length) sources.push('indexeddb.entries')
    if (parseSnapshot(snapshot)?.entries.length) sources.push('indexeddb.snapshot')
    if (parseSnapshot(snapshotPrev)?.entries.length) sources.push('indexeddb.snapshot_prev')
    if (parseEntries(lsEntries).length) sources.push('localStorage.entries')
    if (parseTrash(idbTrash).length || parseTrash(lsTrash).length) sources.push('trash')
    if (parseCategories(idbCategories).length || parseCategories(lsCategories).length) {
      sources.push('categories')
    }

    const json = JSON.stringify(
      {
        version: 1,
        kind: 'ownlab-recovery-dump',
        exportedAt: new Date().toISOString(),
        href: typeof location !== 'undefined' ? location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        summary: {
          mergedEntryCount: merged.entries.length,
          sources,
        },
        // Importable shape (same as a normal backup).
        entries: merged.entries,
        trash: merged.trash,
        categories: merged.categories,
        // Raw remnants for debugging / deeper recovery.
        raw: {
          indexedDB: {
            entries: idbEntries ?? null,
            trash: idbTrash ?? null,
            categories: idbCategories ?? null,
            snapshot: snapshot ?? null,
            snapshot_prev: snapshotPrev ?? null,
            meta: meta ?? null,
          },
          localStorage: {
            [LS_ENTRIES]: lsEntries ?? null,
            [LS_TRASH]: lsTrash ?? null,
            [LS_CATEGORIES]: lsCategories ?? null,
          },
        },
      },
      null,
      2,
    )
    return { json, entryCount: merged.entries.length, sources }
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
      raw?: {
        indexedDB?: {
          entries?: unknown
          trash?: unknown
          categories?: unknown
          snapshot?: unknown
          snapshot_prev?: unknown
        }
        localStorage?: Record<string, unknown>
      }
    }
    // Accept normal backups and recovery dumps (including nested raw remnants).
    const rawIdb = body.raw?.indexedDB
    const rawLs = body.raw?.localStorage
    const snap = parseSnapshot(rawIdb?.snapshot)
    const snapPrev = parseSnapshot(rawIdb?.snapshot_prev)
    const entries = mergeEntries(
      cache.entries,
      parseEntries(body.entries),
      parseEntries(rawIdb?.entries),
      snap?.entries ?? [],
      snapPrev?.entries ?? [],
      parseEntries(rawLs?.[LS_ENTRIES]),
    )
    const trash = mergeTrash(
      cache.trash,
      parseTrash(body.trash),
      parseTrash(rawIdb?.trash),
      snap?.trash ?? [],
      snapPrev?.trash ?? [],
      parseTrash(rawLs?.[LS_TRASH]),
    )
    const categories = mergeCategories(
      cache.categories,
      parseCategories(body.categories),
      parseCategories(rawIdb?.categories),
      snap?.categories ?? [],
      snapPrev?.categories ?? [],
      parseCategories(rawLs?.[LS_CATEGORIES]),
    )
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
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    await scheduleDurableSync()
    return { total: entries.length }
  },
  getCloudSyncStatus,
  getCloudRuntime: () => cloudRuntime,
  subscribeCloudRuntime(listener: CloudRuntimeListener) {
    cloudRuntimeListeners.add(listener)
    listener(cloudRuntime)
    return () => {
      cloudRuntimeListeners.delete(listener)
    }
  },
  /** Immediately push notebook JSON to folder backup + optional cloud Gist. */
  async syncDurableNow(): Promise<{
    folder: boolean
    gistId: string | null
    gistError?: string
    htmlUrl?: string | null
  }> {
    await ensureReady()
    const json = buildBackupJson()
    let folder = false
    let gistId: string | null = null
    let gistError: string | undefined
    let htmlUrl: string | null | undefined
    try {
      folder = await writeFolderBackup(json)
    } catch {
      folder = false
    }
    if (isCloudSyncReady()) {
      setCloudRuntime({ state: 'syncing', error: null })
      try {
        const result = await pushGistBackup(json)
        gistId = result.gistId
        htmlUrl = result.htmlUrl
        setCloudRuntime({
          state: 'synced',
          lastSyncedAt: new Date().toISOString(),
          error: null,
          gistId: result.gistId,
        })
      } catch (err) {
        gistError = err instanceof Error ? err.message : 'Cloud sync failed'
        setCloudRuntime({ state: 'error', error: gistError })
      }
    } else {
      refreshCloudRuntimeFromSettings()
    }
    return { folder, gistId, gistError, htmlUrl }
  },
  /** Pull folder + cloud backups and merge into the notebook. */
  async pullRemoteBackups(): Promise<{ total: number; fromFolder: boolean; fromGist: boolean }> {
    await ensureReady()
    let fromFolder = false
    let fromGist = false
    try {
      const folderJson = await readFolderBackup()
      if (folderJson) {
        await notebookStore.importBackup(folderJson)
        fromFolder = true
      }
    } catch {
      /* ignore */
    }
    try {
      const settings = loadGistSettings()
      if (settings.token && settings.gistId) {
        const gistJson = await pullGistBackup(settings)
        if (gistJson) {
          await notebookStore.importBackup(gistJson)
          setLastCloudSyncAt()
          fromGist = true
        }
      }
    } catch {
      /* ignore */
    }
    return { total: cache.entries.length, fromFolder, fromGist }
  },
  /**
   * Push then pull cloud notebook and report whether sync is healthy.
   * Safe to run anytime — does not delete local notes.
   */
  async verifyCloudSync(): Promise<{
    ok: boolean
    configured: boolean
    gistId: string
    localCount: number
    cloudCount: number
    lastSyncedAt: string | null
    htmlUrl: string | null
    error?: string
  }> {
    await ensureReady()
    const settings = loadGistSettings()
    const localCount = cache.entries.length
    if (!settings.enabled || !settings.token) {
      return {
        ok: false,
        configured: false,
        gistId: settings.gistId,
        localCount,
        cloudCount: 0,
        lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
        htmlUrl: null,
        error: 'Cloud sync is not enabled on this device',
      }
    }
    try {
      const pushed = await notebookStore.syncDurableNow()
      if (!pushed.gistId) {
        return {
          ok: false,
          configured: false,
          gistId: settings.gistId,
          localCount,
          cloudCount: 0,
          lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
          htmlUrl: null,
          error: pushed.gistError || 'Upload to cloud failed',
        }
      }
      const gistJson = await pullGistBackup(loadGistSettings())
      if (!gistJson) {
        return {
          ok: false,
          configured: true,
          gistId: pushed.gistId,
          localCount,
          cloudCount: 0,
          lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
          htmlUrl: pushed.htmlUrl ?? null,
          error: 'Cloud notebook is empty or unreadable',
        }
      }
      let cloudCount = 0
      try {
        const parsed = JSON.parse(gistJson) as { entries?: unknown }
        cloudCount = parseEntries(parsed.entries).length
      } catch {
        return {
          ok: false,
          configured: true,
          gistId: pushed.gistId,
          localCount,
          cloudCount: 0,
          lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
          htmlUrl: pushed.htmlUrl ?? null,
          error: 'Cloud notebook JSON is invalid',
        }
      }
      setLastCloudSyncAt()
      const ok = cloudCount >= localCount && cloudCount > 0
      setCloudRuntime({
        state: ok ? 'synced' : 'error',
        lastSyncedAt: new Date().toISOString(),
        error: ok ? null : 'Cloud note count is lower than local',
        gistId: pushed.gistId,
      })
      return {
        ok: ok || (localCount === 0 && cloudCount === 0),
        configured: true,
        gistId: pushed.gistId,
        localCount,
        cloudCount,
        lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
        htmlUrl: pushed.htmlUrl ?? null,
        error:
          ok || (localCount === 0 && cloudCount === 0)
            ? undefined
            : `Cloud has ${cloudCount} note(s) but this device has ${localCount}`,
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Cloud verify failed'
      setCloudRuntime({ state: 'error', error })
      return {
        ok: false,
        configured: Boolean(settings.token && settings.gistId && settings.enabled),
        gistId: settings.gistId,
        localCount,
        cloudCount: 0,
        lastSyncedAt: getCloudSyncStatus().lastSyncedAt,
        htmlUrl: null,
        error,
      }
    }
  },
  /**
   * Enable cloud sync with a GitHub token.
   * On a new device, the same token alone finds your existing OWNLAB gist and restores notes
   * (no separate site login — the token is the credential).
   */
  async enableCloudSync(input: {
    token: string
    gistId?: string
  }): Promise<{
    gistId: string
    htmlUrl: string | null
    total: number
    restoredFromCloud: boolean
    cloudNoteCount: number
  }> {
    await ensureReady()
    const token = input.token.trim()
    if (!token) {
      throw new NotebookStorageError('unknown', 'GitHub token is required')
    }

    let gistId = input.gistId?.trim() || loadGistSettings().gistId
    let restoredFromCloud = false
    let cloudNoteCount = 0

    // New device / token-only setup: locate the existing cloud notebook instead of
    // creating a second empty gist that hides the notes from the first device.
    if (!gistId) {
      const existing = await resolveOwnlabNotebookGist(token)
      if (existing) {
        gistId = existing.gistId
        cloudNoteCount = existing.noteCount
      }
    }

    saveGistSettings({
      token,
      gistId: gistId || '',
      enabled: true,
    })
    refreshCloudRuntimeFromSettings()

    if (gistId) {
      try {
        const gistJson = await pullGistBackup(loadGistSettings())
        if (gistJson) {
          try {
            const parsed = JSON.parse(gistJson) as { entries?: unknown }
            cloudNoteCount = Array.isArray(parsed.entries) ? parsed.entries.length : cloudNoteCount
          } catch {
            /* keep prior count */
          }
          if (cloudNoteCount > 0 || cache.entries.length === 0) {
            await notebookStore.importBackup(gistJson)
            restoredFromCloud = cloudNoteCount > 0
            setLastCloudSyncAt()
          }
        }
      } catch (err) {
        // If an explicit gist id was wrong, fail clearly; discovery misses just create anew below.
        if (input.gistId?.trim()) {
          throw err instanceof Error
            ? new NotebookStorageError('unknown', err.message)
            : new NotebookStorageError('unknown', 'Could not download cloud notebook')
        }
      }
    }

    const result = await notebookStore.syncDurableNow()
    if (!result.gistId) {
      throw new NotebookStorageError('unknown', result.gistError || 'Cloud upload failed')
    }
    return {
      gistId: result.gistId,
      htmlUrl: result.htmlUrl ?? null,
      total: cache.entries.length,
      restoredFromCloud,
      cloudNoteCount,
    }
  },
  /** Connect this device to an existing cloud notebook and download notes. */
  async connectCloudSync(input: {
    token: string
    gistId?: string
  }): Promise<{ total: number; gistId: string; restoredFromCloud: boolean }> {
    await ensureReady()
    const token = input.token.trim()
    let gistId = input.gistId?.trim() || ''
    if (!token) {
      throw new NotebookStorageError('unknown', 'GitHub token is required')
    }
    if (!gistId) {
      const existing = await resolveOwnlabNotebookGist(token)
      if (!existing) {
        throw new NotebookStorageError(
          'unknown',
          'No OWNLAB cloud notebook found for this token. Enable cloud sync on your first device first.',
        )
      }
      gistId = existing.gistId
    }
    saveGistSettings({ token, gistId, enabled: true })
    refreshCloudRuntimeFromSettings()
    const gistJson = await pullGistBackup(loadGistSettings())
    if (!gistJson) {
      throw new NotebookStorageError('unknown', 'No cloud notebook found for that id')
    }
    const imported = await notebookStore.importBackup(gistJson)
    setLastCloudSyncAt()
    await scheduleDurableSync()
    return { total: imported.total, gistId, restoredFromCloud: imported.total > 0 }
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
