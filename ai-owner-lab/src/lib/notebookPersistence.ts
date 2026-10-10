/** IndexedDB persistence for notebook data (far larger quota than localStorage). */

const DB_NAME = 'ownlab-notebook-db'
const DB_VERSION = 1
const STORE = 'kv'

export const IDB_KEYS = {
  entries: 'entries',
  trash: 'trash',
  categories: 'categories',
  meta: 'meta',
} as const

export type IdbKey = (typeof IDB_KEYS)[keyof typeof IDB_KEYS]

type Meta = {
  migratedFromLocalStorageAt?: string
  storageBackend: 'indexeddb'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open notebook database'))
  })
}

function isQuotaExceeded(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; code?: number; message?: string }
  if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true
  if (e.code === 22 || e.code === 1014) return true
  return /quota/i.test(e.message ?? '')
}

export async function idbGet<T>(key: IdbKey): Promise<T | undefined> {
  const db = await openDb()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result as T | undefined)
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
    })
  } finally {
    db.close()
  }
}

export async function idbSet(key: IdbKey, value: unknown): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => {
        const err = tx.error ?? new Error('IndexedDB write failed')
        reject(err)
      }
      tx.onabort = () => {
        const err = tx.error ?? new Error('IndexedDB write aborted')
        reject(err)
      }
      tx.objectStore(STORE).put(value, key)
    })
  } catch (err) {
    if (isQuotaExceeded(err)) {
      const quotaErr = new Error('QuotaExceededError')
      quotaErr.name = 'QuotaExceededError'
      throw quotaErr
    }
    throw err
  } finally {
    db.close()
  }
}

export async function idbGetMeta(): Promise<Meta | undefined> {
  return idbGet<Meta>(IDB_KEYS.meta)
}

export async function idbSetMeta(meta: Meta): Promise<void> {
  await idbSet(IDB_KEYS.meta, meta)
}

export { isQuotaExceeded as isPersistenceQuotaExceeded }
