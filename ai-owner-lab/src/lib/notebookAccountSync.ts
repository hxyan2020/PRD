/**
 * Account-based notebook sync (Murex-style): session cookie → Vercel Blob.
 * No cloud key / restore required once signed in.
 */

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
}

export async function pullAccountBackup(): Promise<AccountPullResult | null> {
  const res = await fetch(api('/api/notebook'), { method: 'GET', credentials: 'include' })
  if (res.status === 401) throw new Error('Sign in required')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await readError(res))
  const content = await res.text()
  let noteCount = 0
  try {
    const parsed = JSON.parse(content) as { entries?: unknown }
    noteCount = Array.isArray(parsed.entries) ? parsed.entries.length : 0
  } catch {
    throw new Error('Cloud notebook was not valid JSON')
  }
  return { content, etag: res.headers.get('etag'), noteCount }
}

export async function pushAccountBackup(json: string): Promise<{ etag: string | null }> {
  const res = await fetch(api('/api/notebook'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: json,
  })
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error(await readError(res))
  const body = (await res.json().catch(() => null)) as { etag?: string } | null
  setLastAccountSyncAt()
  return { etag: body?.etag ?? res.headers.get('etag') }
}
