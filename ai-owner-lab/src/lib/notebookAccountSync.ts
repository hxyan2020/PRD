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

/** Abort hung sync fetches so the UI cannot stick on “Saving to cloud…”. */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
  label: string,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: ctrl.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`${label} timed out`)
    }
    throw err
  } finally {
    window.clearTimeout(timer)
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: number | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer != null) window.clearTimeout(timer)
  }
}

export async function fetchAccountMe(): Promise<{ username: string } | null> {
  if (!isVercelNotebookHost()) return null
  const res = await fetchWithTimeout(
    api('/api/auth/me'),
    { credentials: 'include' },
    15_000,
    'Session check',
  )
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
  size: number | null
}

/** Cheap cloud probe — size/uploadedAt without downloading notebook.json. */
export type AccountCloudMeta = {
  url: string
  uploadedAt: string | null
  size: number | null
  etag: string | null
}

function downloadTimeoutForSize(size: number | null): number {
  // Mobile networks often need minutes for 20–50MB notebooks.
  const bytes = typeof size === 'number' && size > 0 ? size : 8_000_000
  return Math.min(300_000, Math.max(180_000, Math.round(bytes / 1024) * 50))
}

function isLikelyIosWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iP(hone|ad|od)/i.test(ua)) return true
  // iPadOS desktop UA
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** Read a response body without AbortSignal so a header timeout cannot kill mid-stream. */
async function readResponseText(res: Response, timeoutMs: number): Promise<string> {
  if (!res.body) return res.text()
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  const deadline = Date.now() + timeoutMs
  try {
    while (true) {
      if (Date.now() > deadline) {
        try {
          await reader.cancel()
        } catch {
          /* ignore */
        }
        throw new Error('Cloud notebook download timed out')
      }
      const { done, value } = await reader.read()
      if (done) break
      if (value && value.byteLength) {
        chunks.push(value)
        received += value.byteLength
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      /* ignore */
    }
  }
  const merged = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8').decode(merged)
}

function uploadTimeoutForSize(bytes: number): number {
  return Math.min(360_000, Math.max(120_000, Math.round(bytes / 1024) * 35))
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

/**
 * HEAD-equivalent: ask the API for signed URL + size/uploadedAt only.
 * Avoids downloading a multi‑MB notebook.json just to learn nothing changed.
 */
export async function pullAccountMeta(): Promise<AccountCloudMeta | null> {
  const res = await fetchWithTimeout(
    api('/api/notebook'),
    { method: 'GET', credentials: 'include' },
    30_000,
    'Cloud notebook check',
  )
  if (res.status === 401) throw new Error('Sign in required')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await readError(res))
  const etag = res.headers.get('etag')
  const raw = await res.text()
  try {
    const parsed = JSON.parse(raw) as {
      url?: unknown
      entries?: unknown
      uploadedAt?: unknown
      size?: unknown
    }
    const uploadedAt = typeof parsed.uploadedAt === 'string' ? parsed.uploadedAt : null
    const size = typeof parsed.size === 'number' ? parsed.size : null
    if (typeof parsed.url === 'string' && parsed.url && !Array.isArray(parsed.entries)) {
      return { url: parsed.url, uploadedAt, size, etag }
    }
    // Legacy: body was the notebook itself — no separate download URL.
    return { url: '', uploadedAt, size: raw.length, etag }
  } catch {
    return { url: '', uploadedAt: null, size: raw.length, etag }
  }
}

function mapDownloadError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err || 'download failed')
  // Safari/WebKit surfaces cross-origin Blob failures as bare "Load failed".
  if (/load failed|failed to fetch|networkerror|network request failed/i.test(message)) {
    return new Error(
      'Could not download cloud notebook on this device. Tap the status pill to retry (same-origin download).',
    )
  }
  return err instanceof Error ? err : new Error(message)
}

async function downloadViaSameOrigin(
  size: number | null,
): Promise<{ content: string; etag: string | null; uploadedAt: string | null } | null> {
  const attempts = isLikelyIosWebKit() ? 3 : 2
  let lastErr: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const ctrl = new AbortController()
    // Only abort if headers never arrive — never abort while reading the body
    // (that was a common Safari "Load failed" / truncated stream cause).
    const headerTimer = window.setTimeout(() => ctrl.abort(), 45_000)
    try {
      const res = await fetch(api('/api/notebook/content'), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: ctrl.signal,
      })
      window.clearTimeout(headerTimer)
      if (res.status === 404) return null
      if (res.status === 401) throw new Error('Sign in required')
      if (!res.ok) throw new Error(await readError(res))
      const contentType = res.headers.get('content-type') || ''
      const content = await readResponseText(res, downloadTimeoutForSize(size))
      // SPA fallback HTML must not be treated as a notebook.
      if (!contentType.includes('application/json') && !content.trim().startsWith('{')) {
        throw new Error('Cloud notebook proxy returned a non-JSON body')
      }
      return {
        content,
        etag: res.headers.get('etag'),
        uploadedAt: res.headers.get('x-ownlab-uploaded-at'),
      }
    } catch (err) {
      window.clearTimeout(headerTimer)
      if (err instanceof Error && /Sign in required/i.test(err.message)) throw err
      lastErr = err
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 600 * (attempt + 1))
      })
    }
  }
  throw mapDownloadError(lastErr)
}

async function downloadViaSignedUrl(
  meta: AccountCloudMeta,
): Promise<{ content: string; etag: string | null }> {
  if (!meta.url) throw new Error('Cloud notebook download URL missing')
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const fileRes = await fetchWithTimeout(
        meta.url,
        { mode: 'cors', credentials: 'omit', cache: 'no-store' },
        downloadTimeoutForSize(meta.size),
        'Cloud notebook download',
      )
      if (!fileRes.ok) throw new Error(`Cloud notebook download failed (${fileRes.status})`)
      return {
        content: await fileRes.text(),
        etag: fileRes.headers.get('etag') || meta.etag,
      }
    } catch (err) {
      lastErr = err
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 400 * (attempt + 1))
      })
    }
  }
  throw mapDownloadError(lastErr)
}

async function downloadAccountNotebook(
  meta: AccountCloudMeta,
  legacyBody?: string,
): Promise<{ content: string; etag: string | null; uploadedAt?: string | null }> {
  if (!meta.url) {
    if (typeof legacyBody === 'string' && legacyBody) {
      return { content: legacyBody, etag: meta.etag, uploadedAt: meta.uploadedAt }
    }
    throw new Error('Cloud notebook download URL missing')
  }

  // Prefer same-origin Edge stream — iOS Safari often throws "Load failed" on
  // cross-origin private Blob URLs even when the signed link is valid.
  try {
    const proxied = await downloadViaSameOrigin(meta.size)
    if (proxied) {
      return {
        content: proxied.content,
        etag: proxied.etag || meta.etag,
        uploadedAt: proxied.uploadedAt || meta.uploadedAt,
      }
    }
  } catch (err) {
    if (err instanceof Error && /Sign in required/i.test(err.message)) throw err
    // Signed Blob URLs reliably fail on iOS WebKit — do not waste retries there.
    if (isLikelyIosWebKit()) throw mapDownloadError(err)
  }

  return downloadViaSignedUrl(meta)
}

function parseNotebookCounts(content: string): { noteCount: number; entryIds: string[] } {
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
  } catch {
    throw new Error('Cloud notebook was not valid JSON')
  }
  // Dustbin notes are part of the cloud notebook — count them so login/merge
  // does not treat a trash-only backup as "empty" and skip (or overwrite) it.
  return { noteCount: entryIds.length, entryIds }
}

export async function pullAccountBackup(): Promise<AccountPullResult | null> {
  // Same-origin Edge stream first (avoids Safari "Load failed" on Blob CDN).
  try {
    const proxied = await downloadViaSameOrigin(null)
    if (proxied) {
      const { noteCount, entryIds } = parseNotebookCounts(proxied.content)
      return {
        content: proxied.content,
        etag: proxied.etag,
        noteCount,
        uploadedAt: proxied.uploadedAt,
        entryIds,
        size: proxied.content.length,
      }
    }
    return null
  } catch (err) {
    if (err instanceof Error && /Sign in required/i.test(err.message)) throw err
    // On iOS the signed-URL fallback almost always fails the same way.
    if (isLikelyIosWebKit()) throw mapDownloadError(err)
    // Desktop: fall back to meta + signed URL for older deploys / edge failures.
  }

  const res = await fetchWithTimeout(
    api('/api/notebook'),
    { method: 'GET', credentials: 'include' },
    30_000,
    'Cloud notebook check',
  )
  if (res.status === 401) throw new Error('Sign in required')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await readError(res))
  const headerEtag = res.headers.get('etag')
  const raw = await res.text()
  let meta: AccountCloudMeta
  let legacyBody: string | undefined
  try {
    const parsed = JSON.parse(raw) as {
      url?: unknown
      entries?: unknown
      uploadedAt?: unknown
      size?: unknown
    }
    const uploadedAt = typeof parsed.uploadedAt === 'string' ? parsed.uploadedAt : null
    const size = typeof parsed.size === 'number' ? parsed.size : null
    if (typeof parsed.url === 'string' && parsed.url && !Array.isArray(parsed.entries)) {
      meta = { url: parsed.url, uploadedAt, size, etag: headerEtag }
    } else {
      meta = { url: '', uploadedAt, size: raw.length, etag: headerEtag }
      legacyBody = raw
    }
  } catch {
    meta = { url: '', uploadedAt: null, size: raw.length, etag: headerEtag }
    legacyBody = raw
  }

  const downloaded = await downloadAccountNotebook(meta, legacyBody)
  const { noteCount, entryIds } = parseNotebookCounts(downloaded.content)
  return {
    content: downloaded.content,
    etag: downloaded.etag,
    noteCount,
    uploadedAt: downloaded.uploadedAt ?? meta.uploadedAt,
    entryIds,
    size: meta.size,
  }
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
  // Prefer multipart for anything above ~1.5MB — large notebooks were timing out
  // on a single PUT. Budget scales with size but still hard-caps (~6 min).
  const useMultipart = file.size >= 1.5 * 1024 * 1024
  const uploadTimeoutMs = uploadTimeoutForSize(file.size)
  try {
    await withTimeout(
      upload(pathname, file, {
        access: 'private',
        handleUploadUrl: api('/api/blob/upload'),
        multipart: useMultipart,
        contentType: 'application/json;charset=utf-8',
      }),
      uploadTimeoutMs,
      'Cloud notebook upload',
    )
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
