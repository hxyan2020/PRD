import { isCategoryColorId, nextCategoryColor } from '../lib/categoryColors'
import { readFolderBackup, requestPersistentStorage, writeFolderBackup } from '../lib/notebookFolderBackup'
import {
  getCloudSyncStatus,
  isCloudSyncReady,
  isGistConflictError,
  loadGistSettings,
  parseGistIdInput,
  publishPublicNotesHtml,
  pullAllOwnlabGistBackups,
  pullGistBackup,
  pullGistBackupMeta,
  pushGistBackup,
  repairOwnlabGistSelection,
  resolveOwnlabNotebookGist,
  saveGistSettings,
  setLastCloudSyncAt,
  type OwnlabGistMatch,
} from '../lib/notebookGistSync'
import {
  getLastAccountSyncAt,
  isAccountSyncReady,
  isVercelNotebookHost,
  loadCachedAccountUser,
  pullAccountBackup,
  pushAccountBackup,
  saveAccountSyncEnabled,
  saveCachedAccountUser,
  setLastAccountSyncAt,
} from '../lib/notebookAccountSync'
import {
  getLastVercelSyncAt,
  isVercelSyncReady,
  loadVercelSyncSettings,
  pullVercelBackup,
  pushVercelBackup,
  saveVercelSyncSettings,
  setLastVercelSyncAt,
} from '../lib/notebookVercelSync'
import {
  IDB_KEYS,
  idbGet,
  idbGetMeta,
  idbSetMeta,
  idbSetVerified,
  isPersistenceQuotaExceeded,
  type NotebookSnapshot,
} from '../lib/notebookPersistence'
import { parseAttachments, type NotebookAttachment } from '../lib/notebookAttachments'
import { replaceLargeDataImagesInHtml } from '../lib/notebookCompactImages'
import { awaitPendingNoteImageUploads } from '../lib/noteImage'
import type { NotebookCategory, NotebookEntry, TrashedNotebookEntry } from './useNotebook'

const LS_ENTRIES = 'ownlab-notebook-v1'
const LS_TRASH = 'ownlab-notebook-trash-v1'
const LS_CATEGORIES = 'ownlab-notebook-categories-v1'
const LS_PURGED = 'ownlab-notebook-purged-v1'

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
  /** Permanently deleted note ids (tombstones). */
  purgedIds: string[]
}

const cache: Cache = {
  entries: [],
  trash: [],
  categories: [],
  purgedIds: [],
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

function normalizeEntry(e: NotebookEntry): NotebookEntry {
  const attachments = parseAttachments(e.attachments)
  return attachments.length ? { ...e, attachments } : { ...e, attachments: undefined }
}

function parseEntries(raw: unknown): NotebookEntry[] {
  if (!Array.isArray(raw)) return []
  return sortEntries(raw.filter(isEntryLike).map(normalizeEntry))
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

function parsePurgedIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) ids.add(item.trim())
  }
  return [...ids].sort()
}

function mergePurgedIds(...lists: string[][]): string[] {
  const ids = new Set<string>()
  for (const list of lists) {
    for (const id of list) {
      if (id) ids.add(id)
    }
  }
  return [...ids].sort()
}

/**
 * A note must not live in both the notebook and the dustbin.
 * After merges (esp. cloud pull), prefer trash when deletedAt >= entry time;
 * prefer the live entry when it was updated/restored after the delete.
 * Permanently purged ids are stripped from both lists.
 */
function reconcileEntriesAndTrash(
  entries: NotebookEntry[],
  trash: TrashedNotebookEntry[],
  purgedIds: string[] = cache.purgedIds,
): { entries: NotebookEntry[]; trash: TrashedNotebookEntry[] } {
  const purged = new Set(purgedIds)
  const entryMap = new Map(entries.map((e) => [e.id, e]))
  const trashMap = new Map(trash.map((e) => [e.id, e]))
  const nextEntries: NotebookEntry[] = []
  const nextTrash: TrashedNotebookEntry[] = []
  for (const id of new Set([...entryMap.keys(), ...trashMap.keys()])) {
    if (purged.has(id)) continue
    const entry = entryMap.get(id)
    const trashed = trashMap.get(id)
    if (entry && trashed) {
      // Prefer the live note when it was edited/restored at or after delete time,
      // so Recover is not undone by a stale cloud dustbin copy on the next sync.
      if (entryTime(entry) >= new Date(trashed.deletedAt).getTime()) {
        nextEntries.push(entry)
      } else {
        nextTrash.push(trashed)
      }
    } else if (entry) {
      nextEntries.push(entry)
    } else if (trashed) {
      nextTrash.push(trashed)
    }
  }
  return { entries: sortEntries(nextEntries), trash: sortTrash(nextTrash) }
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
    localStorage.removeItem(LS_PURGED)
  } catch {
    /* ignore */
  }
}

async function persistKey(
  key:
    | typeof IDB_KEYS.entries
    | typeof IDB_KEYS.trash
    | typeof IDB_KEYS.categories
    | typeof IDB_KEYS.purged,
  value: unknown,
) {
  try {
    await idbSetVerified(key, value)
  } catch (err) {
    throw new NotebookStorageError(isPersistenceQuotaExceeded(err) ? 'quota' : 'unknown')
  }
}

async function persistPurgedIds(ids: string[]) {
  const next = parsePurgedIds(ids)
  cache.purgedIds = next
  await persistKey(IDB_KEYS.purged, next)
  try {
    localStorage.setItem(LS_PURGED, JSON.stringify(next))
  } catch {
    /* ignore */
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
  purgedIds: string[]
  recoveredFromBackup: boolean
  recoveredFromLocalStorage: boolean
}> {
  const idbEntries = parseEntries(await idbGet(IDB_KEYS.entries))
  const idbTrash = parseTrash(await idbGet(IDB_KEYS.trash))
  const idbCategories = parseCategories(await idbGet(IDB_KEYS.categories))
  const idbPurged = parsePurgedIds(await idbGet(IDB_KEYS.purged))

  const snap = parseSnapshot(await idbGet(IDB_KEYS.snapshot))
  const snapPrev = parseSnapshot(await idbGet(IDB_KEYS.snapshotPrev))

  const lsEntries = parseEntries(readLocalStorageJson(LS_ENTRIES))
  const lsTrash = parseTrash(readLocalStorageJson(LS_TRASH))
  const lsCategories = parseCategories(readLocalStorageJson(LS_CATEGORIES))
  const lsPurged = parsePurgedIds(readLocalStorageJson(LS_PURGED))

  const purgedIds = mergePurgedIds(idbPurged, lsPurged)
  const merged = reconcileEntriesAndTrash(
    mergeEntries(idbEntries, snap?.entries ?? [], snapPrev?.entries ?? [], lsEntries),
    mergeTrash(idbTrash, snap?.trash ?? [], snapPrev?.trash ?? [], lsTrash),
    purgedIds,
  )
  const entries = merged.entries
  const trash = merged.trash
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

  return {
    entries,
    trash,
    categories,
    purgedIds,
    recoveredFromBackup,
    recoveredFromLocalStorage,
  }
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
    cache.purgedIds = gathered.purgedIds
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
      await persistPurgedIds(gathered.purgedIds)
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
          try {
            localStorage.setItem(LS_PURGED, JSON.stringify(cache.purgedIds))
          } catch {
            /* ignore */
          }
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
      await persistPurgedIds(gathered.purgedIds)
      await idbSetMeta({ storageBackend: 'indexeddb' })
    } else if (gathered.purgedIds.length && (await idbGet(IDB_KEYS.purged)) === undefined) {
      await persistPurgedIds(gathered.purgedIds)
    }

    if (recovered) {
      ;(cache as Cache & { _recovered?: boolean })._recovered = true
    }
  } catch {
    // Fall back to whatever localStorage still has if IDB is blocked.
    const purgedIds = parsePurgedIds(readLocalStorageJson(LS_PURGED))
    cache.purgedIds = purgedIds
    const reconciled = reconcileEntriesAndTrash(
      parseEntries(readLocalStorageJson(LS_ENTRIES)),
      parseTrash(readLocalStorageJson(LS_TRASH)),
      purgedIds,
    )
    entries = reconciled.entries
    trash = reconciled.trash
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
      if (folderJson) await notebookStore.importBackup(folderJson, { syncCloud: false })
    } catch {
      /* ignore */
    }
    try {
      if (isCloudSyncReady()) {
        // Escape an empty/stale gist left by older enable flows.
        await repairOwnlabGistSelection()
        refreshCloudRuntimeFromSettings()
        const gistJson = await pullGistBackup()
        if (gistJson) {
          await notebookStore.importBackup(gistJson, { syncCloud: false })
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
let cloudEtag: string | null = null
let periodicSyncTimer: number | null = null

/**
 * Pull cloud notebook and merge into the local cache without scheduling another sync.
 * Used before push so another device's notes aren't overwritten by last-write-wins.
 * Returns the ETag to If-Match on the subsequent push.
 */
function anyCloudBackendReady(): boolean {
  return isAccountSyncReady() || isVercelSyncReady() || isCloudSyncReady()
}

async function pullAndMergeCloudQuiet(): Promise<{
  merged: boolean
  etag: string | null
  missing: boolean
  cloudNoteCount: number
  cloudContent: string | null
  uploadedAt: string | null
}> {
  if (isAccountSyncReady()) {
    const pulled = await pullAccountBackup()
    if (!pulled) {
      return {
        merged: false,
        etag: cloudEtag,
        missing: true,
        cloudNoteCount: 0,
        cloudContent: null,
        uploadedAt: null,
      }
    }
    cloudEtag = pulled.etag
    await notebookStore.importBackup(pulled.content, { syncCloud: false })
    setLastAccountSyncAt()
    return {
      merged: true,
      etag: pulled.etag,
      missing: false,
      cloudNoteCount: pulled.noteCount,
      cloudContent: pulled.content,
      uploadedAt: pulled.uploadedAt,
    }
  }
  if (isVercelSyncReady()) {
    const { cloudKey } = loadVercelSyncSettings()
    const pulled = await pullVercelBackup(cloudKey)
    if (!pulled) {
      return {
        merged: false,
        etag: cloudEtag,
        missing: true,
        cloudNoteCount: 0,
        cloudContent: null,
        uploadedAt: null,
      }
    }
    cloudEtag = pulled.etag
    await notebookStore.importBackup(pulled.content, { syncCloud: false })
    setLastVercelSyncAt()
    return {
      merged: true,
      etag: pulled.etag,
      missing: false,
      cloudNoteCount: pulled.noteCount,
      cloudContent: pulled.content,
      uploadedAt: null,
    }
  }
  if (!isCloudSyncReady()) {
    return {
      merged: false,
      etag: null,
      missing: true,
      cloudNoteCount: 0,
      cloudContent: null,
      uploadedAt: null,
    }
  }
  const settings = loadGistSettings()
  if (!settings.token || !settings.gistId) {
    return {
      merged: false,
      etag: cloudEtag,
      missing: true,
      cloudNoteCount: 0,
      cloudContent: null,
      uploadedAt: null,
    }
  }
  const meta = await pullGistBackupMeta(settings)
  if (!meta) {
    return {
      merged: false,
      etag: cloudEtag,
      missing: true,
      cloudNoteCount: 0,
      cloudContent: null,
      uploadedAt: null,
    }
  }
  cloudEtag = meta.etag
  await notebookStore.importBackup(meta.content, { syncCloud: false })
  setLastCloudSyncAt()
  return {
    merged: true,
    etag: meta.etag,
    missing: false,
    cloudNoteCount: 0,
    cloudContent: meta.content,
    uploadedAt: null,
  }
}

/**
 * True when local cache has notes (or newer edits) that cloud does not.
 * Used to skip uploads that would only rewrite the same notebook and race
 * other devices.
 */
function localIsAheadOfCloud(cloudContent: string): boolean {
  let parsed: {
    entries?: Array<{ id?: string; updatedAt?: string; createdAt?: string }>
    trash?: Array<{ id?: string; deletedAt?: string }>
  }
  try {
    parsed = JSON.parse(cloudContent) as typeof parsed
  } catch {
    return true
  }
  const cloudEntries = new Map<string, number>()
  for (const entry of Array.isArray(parsed.entries) ? parsed.entries : []) {
    if (!entry?.id) continue
    cloudEntries.set(entry.id, new Date(entry.updatedAt || entry.createdAt || 0).getTime())
  }
  const cloudTrash = new Map<string, number>()
  for (const entry of Array.isArray(parsed.trash) ? parsed.trash : []) {
    if (!entry?.id) continue
    cloudTrash.set(entry.id, new Date(entry.deletedAt || 0).getTime())
  }
  for (const entry of cache.entries) {
    const cloudTime = cloudEntries.get(entry.id)
    if (cloudTime == null) return true
    if (entryTime(entry) > cloudTime) return true
  }
  for (const entry of cache.trash) {
    const cloudTime = cloudTrash.get(entry.id)
    if (cloudTime == null) return true
    if (new Date(entry.deletedAt).getTime() > cloudTime) return true
  }
  return false
}

/** Pull cloud notes when the tab becomes visible again (other-device edits). */
async function pullCloudIfConfigured() {
  if (!anyCloudBackendReady()) return
  // Never share the push lock for idle pulls — phones were pull+push every 10s
  // and overwrote richer laptop uploads while stuck on "Saving to cloud…".
  if (cloudPushInFlight) return cloudPushInFlight
  if (cloudPullInFlight) return cloudPullInFlight
  cloudPullInFlight = (async () => {
    try {
      // "pulling" ≠ saving — idle refresh was mislabeled "Saving to cloud…".
      setCloudRuntime({ state: 'pulling', error: null })
      if (isAccountSyncReady()) {
        const latest = await pullAccountBackup()
        if (latest) {
          const ahead = localIsAheadOfCloud(latest.content)
          await notebookStore.importBackup(latest.content, { syncCloud: false })
          setLastAccountSyncAt()
          cloudEtag = latest.etag
          if (ahead) {
            await flushCloudSync()
            return
          }
        } else if (cache.entries.length + cache.trash.length > 0) {
          // Cloud empty but this device has notes — upload.
          await flushCloudSync()
          return
        }
      } else {
        // Legacy backends: keep prior pull+push behavior via flush.
        await flushCloudSync()
        return
      }
      setCloudRuntime({
        state: 'synced',
        lastSyncedAt: new Date().toISOString(),
        error: null,
        gistId: unifiedCloudSyncStatus().gistId,
      })
    } catch (err) {
      setCloudRuntime({
        state: 'error',
        error: err instanceof Error ? err.message : 'Cloud sync failed',
      })
    } finally {
      cloudPullInFlight = null
    }
  })()
  return cloudPullInFlight
}

function startPeriodicCloudSync() {
  if (typeof window === 'undefined') return
  if (periodicSyncTimer) return
  // Pull while visible so phones pick up laptop notes without re-uploading.
  periodicSyncTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (!anyCloudBackendReady()) return
    void pullCloudIfConfigured()
  }, 15_000)
}

// Kick off hydration as soon as the module loads in the browser.
if (typeof window !== 'undefined') {
  void ensureReady()
  startPeriodicCloudSync()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void pullCloudIfConfigured()
  })
  window.addEventListener('focus', () => {
    void pullCloudIfConfigured()
  })
  window.addEventListener('pageshow', () => {
    void pullCloudIfConfigured()
  })
  window.addEventListener('online', () => {
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
      purgedIds: cache.purgedIds,
    },
    null,
    2,
  )
}

let durableTimer: number | null = null
let cloudPushInFlight: Promise<void> | null = null
/** Set when a write happens while a cloud push is in flight — flush must run again. */
let cloudPushDirty = false

export type CloudRuntimeState = 'off' | 'pulling' | 'syncing' | 'synced' | 'error'

type CloudRuntime = {
  state: CloudRuntimeState
  lastSyncedAt: string | null
  error: string | null
  gistId: string
}

type CloudRuntimeListener = (runtime: CloudRuntime) => void
const cloudRuntimeListeners = new Set<CloudRuntimeListener>()

function unifiedCloudSyncStatus() {
  if (isAccountSyncReady()) {
    return {
      configured: true,
      enabled: true,
      gistId: `account:${loadCachedAccountUser()}`,
      lastSyncedAt: getLastAccountSyncAt(),
      gistUrl: null as string | null,
    }
  }
  if (isVercelSyncReady()) {
    const v = loadVercelSyncSettings()
    return {
      configured: true,
      enabled: true,
      gistId: `vercel:${v.cloudKey.slice(0, 8)}…`,
      lastSyncedAt: getLastVercelSyncAt(),
      gistUrl: null as string | null,
    }
  }
  return getCloudSyncStatus()
}

let cloudRuntime: CloudRuntime = {
  state: anyCloudBackendReady() ? 'synced' : 'off',
  lastSyncedAt: unifiedCloudSyncStatus().lastSyncedAt,
  error: null,
  gistId: unifiedCloudSyncStatus().gistId,
}

function setCloudRuntime(patch: Partial<CloudRuntime>) {
  cloudRuntime = { ...cloudRuntime, ...patch }
  cloudRuntimeListeners.forEach((listener) => listener(cloudRuntime))
}

function refreshCloudRuntimeFromSettings() {
  const status = unifiedCloudSyncStatus()
  if (!anyCloudBackendReady()) {
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

/** Stay under Vercel’s ~4.5MB body comfort zone; only compact when needed. */
const COMPACT_IMAGES_MIN_JSON_CHARS = 2_500_000

/**
 * Offload large inline data:image payloads to Blob before cloud push so the
 * notebook JSON does not trip HTTP 413 (Vercel ~4.5MB body limit).
 * Skip when the notebook is still small — re-uploading every sub‑1MB paste
 * made “Saving to cloud…” hang after each picture.
 */
async function compactInlineImagesForCloud(): Promise<void> {
  if (!isAccountSyncReady()) return
  if (!cache.entries.some((e) => (e.selectedText || '').includes('data:image')) &&
    !cache.trash.some((e) => (e.selectedText || '').includes('data:image'))) {
    return
  }
  const approxChars = buildBackupJson().length
  if (approxChars < COMPACT_IMAGES_MIN_JSON_CHARS) return

  let changed = false
  const nextEntries: NotebookEntry[] = []
  for (const entry of cache.entries) {
    const body = await replaceLargeDataImagesInHtml(entry.selectedText || '')
    if (body.replaced > 0) {
      changed = true
      nextEntries.push({
        ...entry,
        selectedText: body.html,
        updatedAt: new Date().toISOString(),
      })
    } else {
      nextEntries.push(entry)
    }
  }
  const nextTrash: TrashedNotebookEntry[] = []
  for (const entry of cache.trash) {
    const body = await replaceLargeDataImagesInHtml(entry.selectedText || '')
    if (body.replaced > 0) {
      changed = true
      nextTrash.push({ ...entry, selectedText: body.html })
    } else {
      nextTrash.push(entry)
    }
  }
  if (!changed) return

  await enqueueWrite(async () => {
    const entries = sortEntries(nextEntries)
    const trash = sortTrash(nextTrash)
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    await persistKey(IDB_KEYS.entries, entries)
    await persistKey(IDB_KEYS.trash, trash)
    cache.entries = entries
    cache.trash = trash
    entryListeners.forEach((listener) => listener(entries))
    trashListeners.forEach((listener) => listener(trash))
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
  })
}

/**
 * Push notebook to cloud when sync is enabled.
 * Coalesces overlapping writes: if notes change mid-upload, run another push with
 * the latest cache (previously those notes were dropped and never uploaded).
 * Retries on Gist ETag conflicts so two devices adding notes don't clobber each other.
 */
async function flushCloudSync() {
  if (!anyCloudBackendReady()) {
    setCloudRuntime({ state: 'off', error: null })
    return
  }
  cloudPushDirty = true
  if (cloudPushInFlight) return cloudPushInFlight
  setCloudRuntime({ state: 'syncing', error: null })
  const syncDeadline = Date.now() + 90_000
  cloudPushInFlight = (async () => {
    try {
      while (cloudPushDirty) {
        if (Date.now() > syncDeadline) {
          throw new Error('Cloud sync timed out — tap the status pill to retry')
        }
        cloudPushDirty = false
        let etag: string | null = cloudEtag
        let pullFailed = false
        let cloudMissing = false
        let cloudNoteCount = 0
        let cloudContent: string | null = null
        // Merge remote first so a slower device doesn't clobber notes from another.
        try {
          const pulled = await pullAndMergeCloudQuiet()
          etag = pulled.etag
          cloudMissing = pulled.missing
          cloudNoteCount = pulled.cloudNoteCount
          cloudContent = pulled.cloudContent
        } catch (err) {
          pullFailed = true
          // Account sync: never push a partial local notebook over cloud when pull
          // failed — that was wiping the laptop's newer notes from the phone.
          if (isAccountSyncReady()) {
            throw new Error(
              err instanceof Error
                ? `Could not refresh cloud notebook before save: ${err.message}`
                : 'Could not refresh cloud notebook before save',
            )
          }
        }
        if (cloudPushDirty) continue

        // Wait briefly for optimistic picture uploads so we never push blob: previews.
        try {
          await Promise.race([
            awaitPendingNoteImageUploads(),
            new Promise<void>((resolve) => {
              window.setTimeout(resolve, 20_000)
            }),
          ])
        } catch {
          /* individual insert handlers already surfaced errors */
        }
        if (cloudPushDirty) continue

        try {
          await compactInlineImagesForCloud()
        } catch {
          /* still attempt push with current JSON */
        }
        if (cloudPushDirty) continue

        let pushed = false
        if (isAccountSyncReady()) {
          const localCount = cache.entries.length + cache.trash.length
          // After a successful pull+merge, local must cover cloud. If it doesn't,
          // refuse push so a thinner device cannot wipe a richer notebook.
          if (!cloudMissing && !pullFailed && cloudNoteCount > localCount) {
            throw new Error(
              `Local notebook looks incomplete (${localCount}) vs cloud (${cloudNoteCount}) — retry sync`,
            )
          }

          // Only upload when this device has extra notes or newer edits than the
          // cloud snapshot we just merged. Prevents idle phones rewriting cloud.
          const shouldUpload =
            cloudMissing || !cloudContent || localIsAheadOfCloud(cloudContent)

          if (!shouldUpload) {
            setCloudRuntime({
              state: 'synced',
              lastSyncedAt: new Date().toISOString(),
              error: null,
              gistId: `account:${loadCachedAccountUser()}`,
            })
            pushed = true
          } else {
            const result = await pushAccountBackup(buildBackupJson())
            cloudEtag = result.etag
            setCloudRuntime({
              state: 'synced',
              lastSyncedAt: new Date().toISOString(),
              error: null,
              gistId: `account:${loadCachedAccountUser()}`,
            })
            pushed = true
          }
        } else if (isVercelSyncReady()) {
          const { cloudKey } = loadVercelSyncSettings()
          const result = await pushVercelBackup(buildBackupJson(), cloudKey)
          cloudEtag = result.etag
          setCloudRuntime({
            state: 'synced',
            lastSyncedAt: new Date().toISOString(),
            error: null,
            gistId: `vercel:${cloudKey.slice(0, 8)}…`,
          })
          pushed = true
        } else {
          for (let attempt = 0; attempt < 6; attempt += 1) {
            try {
              const result = await pushGistBackup(buildBackupJson(), loadGistSettings(), {
                ifMatch: etag,
              })
              cloudEtag = result.etag
              setCloudRuntime({
                state: 'synced',
                lastSyncedAt: new Date().toISOString(),
                error: null,
                gistId: result.gistId,
              })
              pushed = true
              break
            } catch (err) {
              if (!isGistConflictError(err)) throw err
              // Another device wrote first — merge their notes and retry with fresh ETag.
              try {
                const pulled = await pullAndMergeCloudQuiet()
                etag = pulled.etag
              } catch {
                etag = null
              }
              cloudPushDirty = false
            }
          }
        }
        if (!pushed) {
          throw new Error('Cloud sync conflicted with another device too many times')
        }
      }
    } catch (err) {
      setCloudRuntime({
        state: 'error',
        error: err instanceof Error ? err.message : 'Cloud sync failed',
      })
    } finally {
      cloudPushInFlight = null
      // A write may have landed between the last loop check and this finally.
      if (cloudPushDirty) void flushCloudSync()
    }
  })()
  return cloudPushInFlight
}

/** Folder (debounced) + cloud (immediate when enabled). */
async function scheduleDurableSync() {
  scheduleFolderBackup()
  await flushCloudSync()
}

/**
 * Serialize all notebook mutations. Overlapping addNote/update calls used to read the
 * same cache.entries snapshot and overwrite each other — notes "synced once then stopped"
 * on a busy new device because later local writes were dropped before upload.
 *
 * Cloud push/pull stays *outside* this chain so a slow Gist round-trip cannot block the
 * next local write (and so pull-merge can safely enqueueWrite without deadlock).
 */
let writeChain: Promise<void> = Promise.resolve()

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task)
  writeChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

/** Folder + cloud after the write lock is released (coalesced by flushCloudSync). */
function kickDurableSync() {
  void scheduleDurableSync()
}

async function mutateEntries(
  mutator: (prev: NotebookEntry[]) => NotebookEntry[],
): Promise<NotebookEntry[]> {
  const sorted = await enqueueWrite(async () => {
    await ensureReady()
    const next = sortEntries(mutator(cache.entries))
    // Keep prior durable snapshot as snapshotPrev, then write primary.
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    await persistKey(IDB_KEYS.entries, next)
    cache.entries = next
    entryListeners.forEach((listener) => listener(next))
    // After a successful write, point the latest snapshot at the new durable set.
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    return next
  })
  kickDurableSync()
  return sorted
}

async function mutateCategories(
  mutator: (prev: NotebookCategory[]) => NotebookCategory[],
): Promise<NotebookCategory[]> {
  const sorted = await enqueueWrite(async () => {
    await ensureReady()
    const next = sortCategories(mutator(cache.categories))
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    await persistKey(IDB_KEYS.categories, next)
    cache.categories = next
    categoryListeners.forEach((listener) => listener(next))
    await saveSnapshot(cache.entries, cache.trash, cache.categories)
    return next
  })
  kickDurableSync()
  return sorted
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
  async importBackup(
    json: string,
    options?: { syncCloud?: boolean },
  ): Promise<{ total: number }> {
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
      purgedIds?: unknown
      raw?: {
        indexedDB?: {
          entries?: unknown
          trash?: unknown
          categories?: unknown
          purged?: unknown
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
    const incomingEntries = [
      parseEntries(body.entries),
      parseEntries(rawIdb?.entries),
      snap?.entries ?? [],
      snapPrev?.entries ?? [],
      parseEntries(rawLs?.[LS_ENTRIES]),
    ]
    const incomingTrash = [
      parseTrash(body.trash),
      parseTrash(rawIdb?.trash),
      snap?.trash ?? [],
      snapPrev?.trash ?? [],
      parseTrash(rawLs?.[LS_TRASH]),
    ]
    const incomingCategories = [
      parseCategories(body.categories),
      parseCategories(rawIdb?.categories),
      snap?.categories ?? [],
      snapPrev?.categories ?? [],
      parseCategories(rawLs?.[LS_CATEGORIES]),
    ]
    const incomingPurged = mergePurgedIds(
      parsePurgedIds(body.purgedIds),
      parsePurgedIds(rawIdb?.purged),
      parsePurgedIds(rawLs?.[LS_PURGED]),
    )
    // Merge against the live cache inside the write queue so a concurrent addNote
    // cannot be overwritten by a slower pull-merge.
    const total = await enqueueWrite(async () => {
      const purgedIds = mergePurgedIds(cache.purgedIds, incomingPurged)
      const reconciled = reconcileEntriesAndTrash(
        mergeEntries(cache.entries, ...incomingEntries),
        mergeTrash(cache.trash, ...incomingTrash),
        purgedIds,
      )
      const entries = reconciled.entries
      const trash = reconciled.trash
      const categories = mergeCategories(cache.categories, ...incomingCategories)
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      await persistKey(IDB_KEYS.entries, entries)
      await persistKey(IDB_KEYS.trash, trash)
      await persistKey(IDB_KEYS.categories, categories)
      await persistPurgedIds(purgedIds)
      cache.entries = entries
      cache.trash = trash
      cache.categories = categories
      entryListeners.forEach((listener) => listener(entries))
      trashListeners.forEach((listener) => listener(trash))
      categoryListeners.forEach((listener) => listener(categories))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      return entries.length
    })
    if (options?.syncCloud !== false) {
      await scheduleDurableSync()
    }
    return { total }
  },
  getCloudSyncStatus: unifiedCloudSyncStatus,
  isVercelNotebookHost,
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
    try {
      folder = await writeFolderBackup(json)
    } catch {
      folder = false
    }
    await flushCloudSync()
    const status = getCloudSyncStatus()
    const runtime = cloudRuntime
    return {
      folder,
      gistId: runtime.gistId || status.gistId || null,
      gistError: runtime.state === 'error' ? runtime.error ?? 'Cloud sync failed' : undefined,
      htmlUrl: status.gistUrl,
    }
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
   * Recover every local remnant + union-merge ALL OWNLAB cloud gists for export.
   * Notes were often split across leftover gists (8 in one, more in another) or
   * only survived in IndexedDB snapshots — one "richest gist" pull is not enough.
   */
  async pullCloudForExport(): Promise<{
    ok: boolean
    localBefore: number
    cloudCount: number
    total: number
    switchedGist: boolean
    gistId: string
    gistSummaries: OwnlabGistMatch[]
    error?: string
  }> {
    await ensureReady()
    const localBefore = cache.entries.length
    const settings = loadGistSettings()
    async function mergeLocalRemnants() {
      const gathered = await gatherAllSources()
      try {
        const folderJson = await readFolderBackup()
        if (folderJson) {
          await notebookStore.importBackup(folderJson, { syncCloud: false })
        }
      } catch {
        /* no folder backup */
      }
      const purgedIds = mergePurgedIds(cache.purgedIds, gathered.purgedIds)
      const gatheredRecon = reconcileEntriesAndTrash(
        mergeEntries(cache.entries, gathered.entries),
        mergeTrash(cache.trash, gathered.trash),
        purgedIds,
      )
      const entries = gatheredRecon.entries
      const trash = gatheredRecon.trash
      const categories = mergeCategories(cache.categories, gathered.categories)
      if (
        entries.length !== cache.entries.length ||
        trash.length !== cache.trash.length ||
        categories.length !== cache.categories.length ||
        purgedIds.length !== cache.purgedIds.length
      ) {
        await enqueueWrite(async () => {
          const nextPurged = mergePurgedIds(cache.purgedIds, purgedIds)
          const next = reconcileEntriesAndTrash(
            mergeEntries(cache.entries, entries),
            mergeTrash(cache.trash, trash),
            nextPurged,
          )
          const nextCategories = mergeCategories(cache.categories, categories)
          await saveSnapshot(cache.entries, cache.trash, cache.categories)
          await persistKey(IDB_KEYS.entries, next.entries)
          await persistKey(IDB_KEYS.trash, next.trash)
          await persistKey(IDB_KEYS.categories, nextCategories)
          await persistPurgedIds(nextPurged)
          cache.entries = next.entries
          cache.trash = next.trash
          cache.categories = nextCategories
          entryListeners.forEach((listener) => listener(next.entries))
          trashListeners.forEach((listener) => listener(next.trash))
          categoryListeners.forEach((listener) => listener(nextCategories))
          await saveSnapshot(cache.entries, cache.trash, cache.categories)
        })
      }
    }

    if (!settings.token) {
      try {
        await mergeLocalRemnants()
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        localBefore,
        cloudCount: 0,
        total: cache.entries.length,
        switchedGist: false,
        gistId: settings.gistId,
        gistSummaries: [],
        error: 'Cloud sync is not configured on this device',
      }
    }
    try {
      if (!settings.enabled) {
        saveGistSettings({ enabled: true })
      }
      // Local IDB snapshots / localStorage / folder first (may hold notes cloud lost).
      try {
        await mergeLocalRemnants()
      } catch {
        /* continue with cloud union */
      }

      const backups = await pullAllOwnlabGistBackups(settings.token)
      const gistSummaries: OwnlabGistMatch[] = backups.map(
        ({ content: _c, ...match }) => match,
      )
      let cloudUnion = 0
      const seenIds = new Set<string>()
      for (const backup of backups) {
        try {
          const parsed = JSON.parse(backup.content) as { entries?: unknown }
          if (Array.isArray(parsed.entries)) {
            for (const row of parsed.entries) {
              if (row && typeof row === 'object' && 'id' in row) {
                seenIds.add(String((row as { id: unknown }).id))
              }
            }
          }
        } catch {
          /* skip */
        }
        await notebookStore.importBackup(backup.content, { syncCloud: false })
      }
      cloudUnion = seenIds.size

      const repaired = await repairOwnlabGistSelection(loadGistSettings(), {
        preferRichest: true,
      })
      refreshCloudRuntimeFromSettings()
      setLastCloudSyncAt()

      // Push the union back so future devices see the full set.
      if (cache.entries.length > 0 && isCloudSyncReady()) {
        try {
          await flushCloudSync()
        } catch {
          /* export can still proceed with local merge */
        }
      }

      return {
        ok: backups.length > 0 || cache.entries.length > localBefore,
        localBefore,
        cloudCount: cloudUnion || repaired.noteCount,
        total: cache.entries.length,
        switchedGist: repaired.switched,
        gistId: repaired.gistId || loadGistSettings().gistId,
        gistSummaries,
      }
    } catch (err) {
      return {
        ok: false,
        localBefore,
        cloudCount: 0,
        total: cache.entries.length,
        switchedGist: false,
        gistId: loadGistSettings().gistId,
        gistSummaries: [],
        error: err instanceof Error ? err.message : 'Cloud pull failed',
      }
    }
  },
  /** Publish current notes as a public HTML Gist link for copy on any device. */
  async publishNotesPublicLink(html: string): Promise<{
    htmlUrl: string
    rawUrl: string | null
    gistId: string
    noteCount: number
  }> {
    await ensureReady()
    const token = loadGistSettings().token
    if (!token) {
      throw new NotebookStorageError(
        'unknown',
        'GitHub token is required to create a public copy link',
      )
    }
    const published = await publishPublicNotesHtml(html, token, {
      description: `OWNLAB notes copy (${cache.entries.length} notes)`,
    })
    return { ...published, noteCount: cache.entries.length }
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
   * After account login: attach this device to the signed-in user's cloud notebook.
   * Pulls existing notes (if any) and enables automatic push — no restore key.
   */
  async enableAccountCloudSync(input: {
    username: string
    allowCreateEmpty?: boolean
  }): Promise<{
    username: string
    total: number
    restoredFromCloud: boolean
    cloudNoteCount: number
  }> {
    await ensureReady()
    if (!isVercelNotebookHost()) {
      throw new NotebookStorageError(
        'unknown',
        'Account sync is only available on the Vercel site (ownlab-omega.vercel.app).',
      )
    }
    const username = input.username.trim().toLowerCase()
    if (!username) throw new NotebookStorageError('unknown', 'Username required')

    const localCount = cache.entries.length
    const restoringEmptyDevice = localCount === 0 && !input.allowCreateEmpty
    let cloudNoteCount = 0
    let restoredFromCloud = false

    saveCachedAccountUser(username)
    saveAccountSyncEnabled(true)
    // Prefer account sync over key/gist on this device.
    saveVercelSyncSettings({ enabled: false })
    saveGistSettings({ enabled: false })
    refreshCloudRuntimeFromSettings()

    try {
      const pulled = await pullAccountBackup()
      if (pulled) {
        cloudNoteCount = pulled.noteCount
        // Always merge — importBackup unions entries + trash. Skipping when
        // cloud only had dustbin notes used to wipe trash on the next push.
        await notebookStore.importBackup(pulled.content, { syncCloud: false })
        restoredFromCloud = cloudNoteCount > 0
        setLastAccountSyncAt()
      }
    } catch (err) {
      if (restoringEmptyDevice) {
        saveAccountSyncEnabled(false)
        refreshCloudRuntimeFromSettings()
        throw err instanceof Error
          ? new NotebookStorageError('unknown', err.message)
          : new NotebookStorageError('unknown', 'Could not download account notebook')
      }
    }

    // Empty local + empty cloud on first register is OK (allowCreateEmpty).
    if (restoringEmptyDevice && cloudNoteCount === 0) {
      saveAccountSyncEnabled(false)
      refreshCloudRuntimeFromSettings()
      throw new NotebookStorageError(
        'unknown',
        'No notes on this account yet. Sign in on the device that has your notes first (they upload automatically), then open OWNLAB here again while signed in.',
      )
    }

    await scheduleDurableSync()
    return {
      username,
      total: cache.entries.length,
      restoredFromCloud,
      cloudNoteCount,
    }
  },
  disableAccountCloudSync() {
    saveAccountSyncEnabled(false)
    saveCachedAccountUser(null)
    refreshCloudRuntimeFromSettings()
  },
  /**
   * Enable cross-device sync via Vercel Blob using a shared cloud key.
   * Same key on every device = same notes (no GitHub token required).
   */
  async enableVercelCloudSync(input: {
    cloudKey: string
    allowCreateEmpty?: boolean
  }): Promise<{
    cloudKey: string
    total: number
    restoredFromCloud: boolean
    cloudNoteCount: number
  }> {
    await ensureReady()
    if (!isVercelNotebookHost()) {
      throw new NotebookStorageError(
        'unknown',
        'Vercel cloud storage is only available on the Vercel site (ownlab-omega.vercel.app).',
      )
    }
    const cloudKey = input.cloudKey.trim()
    if (cloudKey.length < 8) {
      throw new NotebookStorageError('unknown', 'Cloud key must be at least 8 characters')
    }

    const localCount = cache.entries.length
    const restoringEmptyDevice = localCount === 0 && !input.allowCreateEmpty
    let cloudNoteCount = 0
    let restoredFromCloud = false

    saveVercelSyncSettings({ cloudKey, enabled: true })
    // Prefer Vercel over Gist when both might be set.
    saveGistSettings({ enabled: false })
    refreshCloudRuntimeFromSettings()

    try {
      const pulled = await pullVercelBackup(cloudKey)
      if (pulled) {
        cloudNoteCount = pulled.noteCount
        await notebookStore.importBackup(pulled.content, { syncCloud: false })
        restoredFromCloud = cloudNoteCount > 0
        setLastVercelSyncAt()
      }
    } catch (err) {
      if (restoringEmptyDevice) {
        saveVercelSyncSettings({ enabled: false })
        refreshCloudRuntimeFromSettings()
        throw err instanceof Error
          ? new NotebookStorageError('unknown', err.message)
          : new NotebookStorageError('unknown', 'Could not download Vercel notebook')
      }
    }

    if (restoringEmptyDevice && cloudNoteCount === 0) {
      saveVercelSyncSettings({ enabled: false })
      refreshCloudRuntimeFromSettings()
      throw new NotebookStorageError(
        'unknown',
        'No notes found for this cloud key yet. On the device that has your notes: open Notebook, create/paste this same cloud key, Enable cloud sync, wait for Saved to cloud, then restore here.',
      )
    }

    await scheduleDurableSync()
    if (!isVercelSyncReady()) {
      throw new NotebookStorageError('unknown', 'Vercel cloud sync did not stay enabled')
    }
    return {
      cloudKey,
      total: cache.entries.length,
      restoredFromCloud,
      cloudNoteCount,
    }
  },
  /**
   * Enable cloud sync with a GitHub token.
   * On a new device (no local notes), refuse to create a fresh empty gist — restore only.
   */
  async enableCloudSync(input: {
    token: string
    gistId?: string
    /** When true, allow creating a brand-new empty cloud notebook (first device). */
    allowCreateEmpty?: boolean
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

    let gistId = parseGistIdInput(input.gistId || '') || loadGistSettings().gistId
    let restoredFromCloud = false
    let cloudNoteCount = 0
    const localCount = cache.entries.length
    const restoringEmptyDevice = localCount === 0 && !input.allowCreateEmpty

    // New device / token-only setup: locate the existing cloud notebook instead of
    // creating a second empty gist that hides the notes from the first device.
    if (!gistId) {
      const existing = await resolveOwnlabNotebookGist(token)
      if (existing) {
        gistId = existing.gistId
        cloudNoteCount = existing.noteCount
      }
    }

    if (restoringEmptyDevice && !gistId) {
      throw new NotebookStorageError(
        'unknown',
        'No OWNLAB cloud notebook found for this token. On the device that still has your notes: open Notebook → turn on cloud sync (or Backup → Double-check cloud sync), wait until it says Saved to cloud, then come back here and try again with the same token.',
      )
    }

    if (restoringEmptyDevice && gistId && cloudNoteCount === 0) {
      throw new NotebookStorageError(
        'unknown',
        'Cloud notebook is empty (0 notes). Your notes were probably never uploaded. On the device that has them: open Notebook → Enable cloud sync / Double-check cloud sync until it says Saved to cloud, then restore here again.',
      )
    }

    saveGistSettings({
      token,
      gistId: gistId || '',
      enabled: true,
    })
    // If this browser was previously stuck on an empty gist, jump to the rich one.
    try {
      const repaired = await repairOwnlabGistSelection(loadGistSettings())
      if (repaired.switched) {
        gistId = repaired.gistId
        cloudNoteCount = repaired.noteCount
      }
    } catch {
      /* discovery failed — continue with current id */
    }
    refreshCloudRuntimeFromSettings()

    if (gistId || loadGistSettings().gistId) {
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
            await notebookStore.importBackup(gistJson, { syncCloud: false })
            restoredFromCloud = cloudNoteCount > 0
            setLastCloudSyncAt()
          }
        }
      } catch (err) {
        if (restoringEmptyDevice || input.gistId?.trim()) {
          throw err instanceof Error
            ? new NotebookStorageError('unknown', err.message)
            : new NotebookStorageError('unknown', 'Could not download cloud notebook')
        }
      }
    }

    if (restoringEmptyDevice && cloudNoteCount === 0) {
      // Do not leave this device "synced" to an empty notebook — that looks like success with 0 notes.
      saveGistSettings({ enabled: false })
      refreshCloudRuntimeFromSettings()
      throw new NotebookStorageError(
        'unknown',
        'Cloud notebook is empty (0 notes). Your notes were probably never uploaded. On the device that has them: open Notebook → Enable cloud sync / Double-check cloud sync until it says Saved to cloud, then restore here again.',
      )
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
    let gistId = parseGistIdInput(input.gistId || '')
    if (!token) {
      throw new NotebookStorageError('unknown', 'GitHub token is required')
    }
    if (!gistId) {
      const existing = await resolveOwnlabNotebookGist(token)
      if (!existing || existing.noteCount === 0) {
        throw new NotebookStorageError(
          'unknown',
          'No OWNLAB notes found in cloud for this token. Enable cloud sync on the device that has your notes first, then try again.',
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
    const imported = await notebookStore.importBackup(gistJson, { syncCloud: false })
    if (imported.total === 0) {
      saveGistSettings({ enabled: false })
      refreshCloudRuntimeFromSettings()
      throw new NotebookStorageError(
        'unknown',
        'Cloud notebook is empty. Upload notes from your other device first, then connect again.',
      )
    }
    setLastCloudSyncAt()
    await scheduleDurableSync()
    return { total: imported.total, gistId, restoredFromCloud: true }
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
    await mutateEntries((prev) => [entry, ...prev])
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
    await mutateEntries((prev) => [entry, ...prev])
    return entry
  },
  async addNote(input: {
    text: string
    title?: string
    categoryIds?: string[]
    attachments?: NotebookAttachment[]
  }) {
    await ensureReady()
    const text = input.text.trim()
    const attachments = parseAttachments(input.attachments)
    if (!text && attachments.length === 0) return null
    const title = input.title?.trim() || undefined
    const entry: NotebookEntry = {
      id: uid('nb'),
      createdAt: new Date().toISOString(),
      type: 'note',
      title,
      selectedText: text || '<p></p>',
      categoryIds: normalizeCategoryIds(input.categoryIds),
      sourceLabel: 'Notebook',
      attachments: attachments.length ? attachments : undefined,
    }
    await mutateEntries((prev) => [entry, ...prev])
    return entry
  },
  async update(
    id: string,
    patch: {
      title?: string
      selectedText?: string
      explanation?: string
      categoryIds?: string[]
      attachments?: NotebookAttachment[]
    },
  ) {
    await ensureReady()
    let updated: NotebookEntry | null = null
    await mutateEntries((entries) => {
      const index = entries.findIndex((e) => e.id === id)
      if (index < 0) return entries
      const current = entries[index]
      const selectedText =
        patch.selectedText !== undefined ? patch.selectedText.trim() : current.selectedText
      const nextAttachments =
        patch.attachments !== undefined ? parseAttachments(patch.attachments) : current.attachments
      const hasFiles = (nextAttachments?.length ?? 0) > 0
      if (!selectedText && !hasFiles) return entries

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

      updated = {
        ...current,
        title,
        selectedText: selectedText || '<p></p>',
        categoryIds,
        explanation: current.type === 'explanation' ? explanation ?? '' : explanation,
        attachments: hasFiles ? nextAttachments : undefined,
        updatedAt: new Date().toISOString(),
      }
      const next = [...entries]
      next[index] = updated
      return next
    })
    return updated
  },
  async setAttachments(id: string, attachments: NotebookAttachment[]) {
    return notebookStore.update(id, { attachments })
  },
  async remove(id: string) {
    const trashed = await enqueueWrite(async () => {
      await ensureReady()
      const entries = cache.entries
      const entry = entries.find((e) => e.id === id)
      if (!entry) return null
      const deletedAt = new Date().toISOString()
      const nextTrashed: TrashedNotebookEntry = { ...entry, deletedAt }
      const nextTrash = sortTrash([nextTrashed, ...cache.trash.filter((e) => e.id !== id)])
      const nextEntries = sortEntries(entries.filter((e) => e.id !== id))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      await persistKey(IDB_KEYS.trash, nextTrash)
      await persistKey(IDB_KEYS.entries, nextEntries)
      cache.trash = nextTrash
      cache.entries = nextEntries
      trashListeners.forEach((listener) => listener(nextTrash))
      entryListeners.forEach((listener) => listener(nextEntries))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      return nextTrashed
    })
    if (trashed) kickDurableSync()
    return trashed
  },
  async restore(id: string) {
    const restored = await enqueueWrite(async () => {
      await ensureReady()
      const trash = cache.trash
      const index = trash.findIndex((e) => e.id === id)
      if (index < 0) return null
      const trashed = trash[index]
      // Keep updatedAt strictly after deletedAt so a later cloud merge cannot
      // put the note back in the dustbin from a stale trash copy.
      const deletedMs = new Date(trashed.deletedAt).getTime()
      const restoreMs = Math.max(Date.now(), deletedMs + 1)
      let restoredEntry: NotebookEntry = {
        id: trashed.id,
        createdAt: trashed.createdAt,
        updatedAt: new Date(restoreMs).toISOString(),
        type: trashed.type,
        title: trashed.title,
        selectedText: trashed.selectedText,
        explanation: trashed.explanation,
        categoryIds: trashed.categoryIds,
        sourceLabel: trashed.sourceLabel,
        sourcePath: trashed.sourcePath,
        model: trashed.model,
        attachments: trashed.attachments,
      }
      if (cache.entries.some((e) => e.id === restoredEntry.id)) {
        restoredEntry = { ...restoredEntry, id: uid('nb') }
      }
      const nextTrash = sortTrash(trash.filter((e) => e.id !== id))
      const nextEntries = sortEntries([restoredEntry, ...cache.entries])
      // Restoring overrides a prior permanent-delete tombstone for this id.
      const nextPurged = cache.purgedIds.filter((pid) => pid !== id && pid !== restoredEntry.id)
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      await persistKey(IDB_KEYS.trash, nextTrash)
      await persistKey(IDB_KEYS.entries, nextEntries)
      await persistPurgedIds(nextPurged)
      cache.trash = nextTrash
      cache.entries = nextEntries
      trashListeners.forEach((listener) => listener(nextTrash))
      entryListeners.forEach((listener) => listener(nextEntries))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      return restoredEntry
    })
    if (restored) kickDurableSync()
    return restored
  },
  /** Permanently remove a note from the dustbin (cannot be recovered). */
  async purgeTrash(id: string) {
    const removed = await enqueueWrite(async () => {
      await ensureReady()
      const trash = cache.trash
      const entry = trash.find((e) => e.id === id)
      if (!entry && !cache.entries.some((e) => e.id === id)) {
        // Still record a tombstone so a later cloud pull cannot resurrect it.
        if (!cache.purgedIds.includes(id)) {
          await persistPurgedIds([...cache.purgedIds, id])
        }
        return null
      }
      const nextTrash = sortTrash(trash.filter((e) => e.id !== id))
      const nextEntries = sortEntries(cache.entries.filter((e) => e.id !== id))
      const nextPurged = mergePurgedIds(cache.purgedIds, [id])
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      await persistKey(IDB_KEYS.trash, nextTrash)
      await persistKey(IDB_KEYS.entries, nextEntries)
      await persistPurgedIds(nextPurged)
      cache.trash = nextTrash
      cache.entries = nextEntries
      trashListeners.forEach((listener) => listener(nextTrash))
      entryListeners.forEach((listener) => listener(nextEntries))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      return entry ?? ({ id, deletedAt: new Date().toISOString() } as TrashedNotebookEntry)
    })
    if (removed) kickDurableSync()
    return removed
  },
  async clear() {
    await enqueueWrite(async () => {
      await ensureReady()
      const now = new Date().toISOString()
      const moving = cache.entries.map((entry) => ({ ...entry, deletedAt: now }))
      const nextTrash = moving.length
        ? sortTrash([
            ...moving,
            ...cache.trash.filter((t) => !moving.some((m) => m.id === t.id)),
          ])
        : cache.trash
      const nextEntries: NotebookEntry[] = []
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      await persistKey(IDB_KEYS.trash, nextTrash)
      await persistKey(IDB_KEYS.entries, nextEntries)
      cache.trash = nextTrash
      cache.entries = nextEntries
      trashListeners.forEach((listener) => listener(nextTrash))
      entryListeners.forEach((listener) => listener(nextEntries))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
    })
    kickDurableSync()
  },
  async addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return null
    let created: NotebookCategory | null = null
    await mutateCategories((existing) => {
      const match = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
      if (match) {
        created = match
        return existing
      }
      created = {
        id: uid('cat'),
        name: trimmed,
        createdAt: new Date().toISOString(),
        color: nextCategoryColor(existing.map((c) => c.color)),
      }
      return [...existing, created]
    })
    return created
  },
  async renameCategory(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return null
    let updated: NotebookCategory | null = null
    await mutateCategories((categories) => {
      const index = categories.findIndex((c) => c.id === id)
      if (index < 0) return categories
      if (
        categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())
      ) {
        return categories
      }
      updated = { ...categories[index], name: trimmed }
      const next = [...categories]
      next[index] = updated
      return next
    })
    return updated
  },
  async removeCategory(id: string) {
    await enqueueWrite(async () => {
      await ensureReady()
      const nextCategories = sortCategories(cache.categories.filter((c) => c.id !== id))
      let changed = false
      const nextEntries = sortEntries(
        cache.entries.map((entry) => {
          if (!entry.categoryIds?.includes(id)) return entry
          changed = true
          return {
            ...entry,
            categoryIds: normalizeCategoryIds(entry.categoryIds.filter((cid) => cid !== id)),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
      await persistKey(IDB_KEYS.categories, nextCategories)
      if (changed) await persistKey(IDB_KEYS.entries, nextEntries)
      cache.categories = nextCategories
      if (changed) cache.entries = nextEntries
      categoryListeners.forEach((listener) => listener(nextCategories))
      if (changed) entryListeners.forEach((listener) => listener(nextEntries))
      await saveSnapshot(cache.entries, cache.trash, cache.categories)
    })
    kickDurableSync()
  },
}
