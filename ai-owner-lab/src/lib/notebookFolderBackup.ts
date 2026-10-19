/**
 * Durable on-disk backup via the File System Access API (Chrome / Edge).
 * The chosen folder survives “clear site data” better than IndexedDB alone.
 */

const HANDLE_DB = 'ownlab-notebook-handles'
const HANDLE_STORE = 'handles'
const HANDLE_KEY = 'backupDir'
const BACKUP_FILE = 'ownlab-notebook-backup.json'

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('handle db open failed'))
  })
}

async function idbPutHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY)
    })
  } finally {
    db.close()
  }
}

async function idbGetHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openHandleDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly')
      const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true
  const opts: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' }
  if ((await handle.queryPermission(opts)) === 'granted') return true
  return (await handle.requestPermission(opts)) === 'granted'
}

export function folderBackupSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export async function requestPersistentStorage(): Promise<'granted' | 'denied' | 'unsupported'> {
  try {
    if (!navigator.storage?.persist) return 'unsupported'
    if (await navigator.storage.persisted()) return 'granted'
    return (await navigator.storage.persist()) ? 'granted' : 'denied'
  } catch {
    return 'unsupported'
  }
}

export async function getPersistentStorageState(): Promise<'granted' | 'prompt' | 'unsupported'> {
  try {
    if (!navigator.storage?.persisted) return 'unsupported'
    return (await navigator.storage.persisted()) ? 'granted' : 'prompt'
  } catch {
    return 'unsupported'
  }
}

export async function pickBackupFolder(): Promise<{ name: string } | null> {
  if (!folderBackupSupported() || !window.showDirectoryPicker) return null
  const handle = await window.showDirectoryPicker({
    id: 'ownlab-notebook-backup',
    mode: 'readwrite',
    startIn: 'documents',
  })
  if (!(await ensurePermission(handle))) return null
  await idbPutHandle(handle)
  return { name: handle.name }
}

export async function getBackupFolderName(): Promise<string | null> {
  const handle = await idbGetHandle()
  if (!handle) return null
  if (!(await ensurePermission(handle))) return null
  return handle.name
}

export async function clearBackupFolder(): Promise<void> {
  const db = await openHandleDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY)
    })
  } finally {
    db.close()
  }
}

export async function writeFolderBackup(json: string): Promise<boolean> {
  const handle = await idbGetHandle()
  if (!handle) return false
  if (!(await ensurePermission(handle))) return false

  const main = await handle.getFileHandle(BACKUP_FILE, { create: true })
  const writable = await main.createWritable()
  await writable.write(json)
  await writable.close()

  // Daily rolling copy (overwrites same day).
  const day = new Date().toISOString().slice(0, 10)
  try {
    const daily = await handle.getFileHandle(`ownlab-notebook-backup-${day}.json`, {
      create: true,
    })
    const dayWritable = await daily.createWritable()
    await dayWritable.write(json)
    await dayWritable.close()
  } catch {
    /* optional */
  }
  return true
}

export async function readFolderBackup(): Promise<string | null> {
  const handle = await idbGetHandle()
  if (!handle) return null
  if (!(await ensurePermission(handle))) return null
  try {
    const fileHandle = await handle.getFileHandle(BACKUP_FILE)
    const file = await fileHandle.getFile()
    return await file.text()
  } catch {
    return null
  }
}
