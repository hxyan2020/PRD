/**
 * Account-based notebook sync (Murex-style): session cookie → Vercel Blob.
 * No cloud key / restore required once signed in.
 */

import { upload } from '@vercel/blob/client'
import { isVercelNotebookHost } from './notebookVercelSync'

export { isVercelNotebookHost }

const ENABLED_LS = 'ownlab-notebook-account-sync'
const LAST_SYNC_LS = 'ownlab-notebook-account-last-sync'
const USER_LS = 'ownlab-notebook-account-user'

export function loadAccountSyncEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_LS) === '1'
  } catch {
    return false
  }
}

export function saveAccountSyncEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_LS, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function loadCachedAccountUser(): string | null {
  try {
    return localStorage.getItem(USER_LS)
  } catch {
    return null
  }
}

export function saveCachedAccountUser(username: string | null) {
  try {
    if (username) localStorage.setItem(USER_LS, username)
    else localStorage.removeItem(USER_LS)
  } catch {
    /* ignore */
  }
}

export function getLastAccountSyncAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_LS)
  } catch {
    return null
  }
}

export function setLastAccountSyncAt(iso = new Date().toISOString()) {
  try {
    localStorage.setItem(LAST_SYNC_LS, iso)
  } catch {
    /* ignore */
  }
  return iso
}

export function isAccountSyncReady(): boolean {
  return Boolean(isVercelNotebookHost() && loadAccountSyncEnabled() && loadCachedAccountUser())
}

function api(path: string): string {
  return `${window.location.origin}${path}`
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error) return body.error
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`
}

export async function fetchAccountMe(): Promise<{ username: string } | null> {
  if (!isVercelNotebookHost()) return null
  const res = await fetch(api('/api/auth/me'), { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as { username: string }
}

export async function registerAccount(
  username: string,
  password: string,
): Promise<{ username: string }> {
  const res = await fetch(api('/api/auth/register'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as { username: string }
}

export async function loginAccount(
  username: string,
  password: string,
): Promise<{ username: string }> {
  const res = await fetch(api('/api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as { username: string }
}

export async function logoutAccount(): Promise<void> {
  await fetch(api('/api/auth/logout'), { method: 'POST', credentials: 'include' })
  saveAccountSyncEnabled(false)
  saveCachedAccountUser(null)
}

export type AccountPullResult = {
  content: string
  etag: string | null
  noteCount: number
  uploadedAt: string | null
  entryIds: string[]
}

/** Stable fingerprint so we can skip no-op cloud pushes (stops overwrite races). */
export function notebookContentFingerprint(json: string): string {
  const parsed = JSON.parse(json) as {
    entries?: Array<{ id?: string; updatedAt?: string; selectedText?: string; title?: string }>
    trash?: Array<{ id?: string; deletedAt?: string; selectedText?: string; title?: string }>
    categories?: Array<{ id?: string; name?: string; color?: string }>
    purgedIds?: string[]
  }
  const entries = Array.isArray(parsed.entries) ? parsed.entries : []
  const trash = Array.isArray(parsed.trash) ? parsed.trash : []
  const categories = Array.isArray(parsed.categories) ? parsed.categories : []
  const purgedIds = Array.isArray(parsed.purgedIds) ? [...parsed.purgedIds].sort() : []
  const normEntries = entries
    .filter((e) => e && typeof e.id === 'string')
    .map((e) => ({
      id: e.id,
      updatedAt: e.updatedAt || '',
      title: e.title || '',
      selectedText: e.selectedText || '',
    }))
    .sort((a, b) => a.id!.localeCompare(b.id!))
  const normTrash = trash
    .filter((e) => e && typeof e.id === 'string')
    .map((e) => ({
      id: e.id,
      deletedAt: e.deletedAt || '',
      title: e.title || '',
      selectedText: e.selectedText || '',
    }))
    .sort((a, b) => a.id!.localeCompare(b.id!))
  const normCategories = categories
    .filter((c) => c && typeof c.id === 'string')
    .map((c) => ({ id: c.id, name: c.name || '', color: c.color || '' }))
    .sort((a, b) => a.id!.localeCompare(b.id!))
  return JSON.stringify({ entries: normEntries, trash: normTrash, categories: normCategories, purgedIds })
}

async function readNotebookContentFromResponse(res: Response): Promise<{
  content: string
  etag: string | null
  uploadedAt: string | null
}> {
  const etag = res.headers.get('etag')
  const raw = await res.text()
  // New API returns a signed Blob URL so large notebooks skip the serverless cap.
  try {
    const parsed = JSON.parse(raw) as {
      url?: unknown
      entries?: unknown
      uploadedAt?: unknown
    }
    const uploadedAt = typeof parsed.uploadedAt === 'string' ? parsed.uploadedAt : null
    if (typeof parsed.url === 'string' && parsed.url && !Array.isArray(parsed.entries)) {
      const fileRes = await fetch(parsed.url)
      if (!fileRes.ok) throw new Error(`Cloud notebook download failed (${fileRes.status})`)
      return {
        content: await fileRes.text(),
        etag: fileRes.headers.get('etag') || etag,
        uploadedAt,
      }
    }
  } catch (err) {
    if (err instanceof Error && /download failed/i.test(err.message)) throw err
    /* fall through — raw may already be the notebook JSON */
  }
  return { content: raw, etag, uploadedAt: null }
}

export async function pullAccountBackup(): Promise<AccountPullResult | null> {
  const res = await fetch(api('/api/notebook'), { method: 'GET', credentials: 'include' })
  if (res.status === 401) throw new Error('Sign in required')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await readError(res))
  const { content, etag, uploadedAt } = await readNotebookContentFromResponse(res)
  let noteCount = 0
  const entryIds: string[] = []
  try {
    const parsed = JSON.parse(content) as { entries?: unknown; trash?: unknown }
    const entries = Array.isArray(parsed.entries) ? parsed.entries : []
    const trash = Array.isArray(parsed.trash) ? parsed.trash : []
    for (const item of [...entries, ...trash]) {
      if (item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') {
        entryIds.push((item as { id: string }).id)
      }
    }
    // Dustbin notes are part of the cloud notebook — count them so login/merge
    // does not treat a trash-only backup as "empty" and skip (or overwrite) it.
    noteCount = entryIds.length
  } catch {
    throw new Error('Cloud notebook was not valid JSON')
  }
  return { content, etag, noteCount, uploadedAt, entryIds }
}

/**
 * Always upload the account notebook via Blob client.
 * PUT /api/notebook hits Vercel’s ~4.5MB body limit (HTTP 413) once high-res
 * images are embedded — direct Blob upload has no practical size cap.
 */
export async function pushAccountBackup(json: string): Promise<{ etag: string | null }> {
  const username = loadCachedAccountUser()
  if (!username) throw new Error('Sign in required')
  const pathname = `ownlab-accounts/${username}/notebook.json`
  const file = new File([json], 'notebook.json', {
    type: 'application/json;charset=utf-8',
  })
  try {
    await upload(pathname, file, {
      access: 'private',
      handleUploadUrl: api('/api/blob/upload'),
      multipart: file.size >= 4 * 1024 * 1024,
      contentType: 'application/json;charset=utf-8',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cloud upload failed'
    if (/413|too large|payload/i.test(message)) {
      throw new Error(
        'Notebook too large to sync. Wait for image upload to finish, then open Notebook again.',
      )
    }
    throw err instanceof Error ? err : new Error(message)
  }
  setLastAccountSyncAt()
  return { etag: null }
}
