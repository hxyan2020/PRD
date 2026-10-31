/**
 * Cross-device notebook sync via Vercel Blob (shared cloud key).
 * Works on the Vercel deployment (e.g. ownlab-omega.vercel.app) without GitHub.
 */

const KEY_LS = 'ownlab-notebook-vercel-cloud-key'
const ENABLED_LS = 'ownlab-notebook-vercel-enabled'
const LAST_SYNC_LS = 'ownlab-notebook-vercel-last-sync'

const MIN_KEY_LEN = 8

export type VercelSyncSettings = {
  cloudKey: string
  enabled: boolean
}

export function isVercelNotebookHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host.endsWith('.vercel.app') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    Boolean(import.meta.env.VITE_OWNLAB_VERCEL_SYNC)
  )
}

export function loadVercelSyncSettings(): VercelSyncSettings {
  try {
    return {
      cloudKey: localStorage.getItem(KEY_LS)?.trim() ?? '',
      enabled: localStorage.getItem(ENABLED_LS) === '1',
    }
  } catch {
    return { cloudKey: '', enabled: false }
  }
}

export function saveVercelSyncSettings(input: Partial<VercelSyncSettings>): VercelSyncSettings {
  const current = loadVercelSyncSettings()
  const next: VercelSyncSettings = {
    cloudKey: input.cloudKey !== undefined ? input.cloudKey.trim() : current.cloudKey,
    enabled: input.enabled !== undefined ? input.enabled : current.enabled,
  }
  try {
    if (next.cloudKey) localStorage.setItem(KEY_LS, next.cloudKey)
    else localStorage.removeItem(KEY_LS)
    localStorage.setItem(ENABLED_LS, next.enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
  return next
}

export function getLastVercelSyncAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_LS)
  } catch {
    return null
  }
}

export function setLastVercelSyncAt(iso = new Date().toISOString()) {
  try {
    localStorage.setItem(LAST_SYNC_LS, iso)
  } catch {
    /* ignore */
  }
  return iso
}

export function isVercelSyncReady(settings = loadVercelSyncSettings()): boolean {
  return Boolean(
    isVercelNotebookHost() && settings.enabled && settings.cloudKey.length >= MIN_KEY_LEN,
  )
}

export function generateCloudKey(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let out = 'ownlab-'
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length]
  }
  return out
}

function apiUrl(): string {
  return `${window.location.origin}/api/notebook`
}

export type VercelPullResult = {
  content: string
  etag: string | null
  noteCount: number
}

export async function pullVercelBackup(cloudKey: string): Promise<VercelPullResult | null> {
  const key = cloudKey.trim()
  if (key.length < MIN_KEY_LEN) throw new Error(`Cloud key must be at least ${MIN_KEY_LEN} characters`)
  const res = await fetch(apiUrl(), {
    method: 'GET',
    headers: { 'x-ownlab-cloud-key': key },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    let message = `Cloud download failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* keep */
    }
    throw new Error(message)
  }
  const content = await res.text()
  let noteCount = 0
  try {
    const parsed = JSON.parse(content) as { entries?: unknown; trash?: unknown }
    const entries = Array.isArray(parsed.entries) ? parsed.entries.length : 0
    const trash = Array.isArray(parsed.trash) ? parsed.trash.length : 0
    noteCount = entries + trash
  } catch {
    throw new Error('Cloud notebook was not valid JSON')
  }
  return {
    content,
    etag: res.headers.get('etag'),
    noteCount,
  }
}

export async function pushVercelBackup(
  json: string,
  cloudKey: string,
): Promise<{ etag: string | null }> {
  const key = cloudKey.trim()
  if (key.length < MIN_KEY_LEN) throw new Error(`Cloud key must be at least ${MIN_KEY_LEN} characters`)
  const res = await fetch(apiUrl(), {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-ownlab-cloud-key': key,
    },
    body: json,
  })
  if (!res.ok) {
    let message = `Cloud upload failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* keep */
    }
    throw new Error(message)
  }
  const body = (await res.json().catch(() => null)) as { etag?: string } | null
  setLastVercelSyncAt()
  return { etag: body?.etag ?? res.headers.get('etag') }
}

export async function probeVercelApi(): Promise<boolean> {
  if (!isVercelNotebookHost()) return false
  try {
    const res = await fetch(apiUrl(), { method: 'OPTIONS' })
    return res.ok || res.status === 204 || res.status === 401 || res.status === 405
  } catch {
    return false
  }
}
