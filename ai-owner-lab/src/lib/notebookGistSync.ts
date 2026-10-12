/**
 * Cloud notebook sync via a private GitHub Gist.
 * Notes travel with your GitHub account across devices.
 * Token stays in this browser only (same pattern as the AI tutor API key).
 */

const TOKEN_KEY = 'ownlab-notebook-gist-token'
const GIST_ID_KEY = 'ownlab-notebook-gist-id'
const ENABLED_KEY = 'ownlab-notebook-gist-enabled'
const LAST_SYNC_KEY = 'ownlab-notebook-gist-last-sync'
const FILE_NAME = 'ownlab-notebook-backup.json'
const MAX_PUSH_CHARS = 4_500_000

export const GIST_TOKEN_CREATE_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=OWNLAB%20notebook%20cloud%20sync'

export type GistSettings = {
  token: string
  gistId: string
  enabled: boolean
}

export type CloudSyncStatus = {
  configured: boolean
  enabled: boolean
  gistId: string
  lastSyncedAt: string | null
  gistUrl: string | null
}

export function loadGistSettings(): GistSettings {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY)?.trim() ?? '',
      gistId: localStorage.getItem(GIST_ID_KEY)?.trim() ?? '',
      enabled: localStorage.getItem(ENABLED_KEY) === '1',
    }
  } catch {
    return { token: '', gistId: '', enabled: false }
  }
}

export function saveGistSettings(input: Partial<GistSettings>) {
  const current = loadGistSettings()
  const next: GistSettings = {
    token: input.token !== undefined ? input.token.trim() : current.token,
    gistId: input.gistId !== undefined ? input.gistId.trim() : current.gistId,
    enabled: input.enabled !== undefined ? input.enabled : current.enabled,
  }
  try {
    if (next.token) localStorage.setItem(TOKEN_KEY, next.token)
    else localStorage.removeItem(TOKEN_KEY)
    if (next.gistId) localStorage.setItem(GIST_ID_KEY, next.gistId)
    else localStorage.removeItem(GIST_ID_KEY)
    localStorage.setItem(ENABLED_KEY, next.enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
  return next
}

export function getLastCloudSyncAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY)
  } catch {
    return null
  }
}

export function setLastCloudSyncAt(iso = new Date().toISOString()) {
  try {
    localStorage.setItem(LAST_SYNC_KEY, iso)
  } catch {
    /* ignore */
  }
  return iso
}

export function gistUrlFor(gistId: string): string | null {
  if (!gistId) return null
  return `https://gist.github.com/${gistId}`
}

export function getCloudSyncStatus(): CloudSyncStatus {
  const settings = loadGistSettings()
  return {
    configured: Boolean(settings.token && settings.gistId && settings.enabled),
    enabled: settings.enabled,
    gistId: settings.gistId,
    lastSyncedAt: getLastCloudSyncAt(),
    gistUrl: gistUrlFor(settings.gistId),
  }
}

export function isCloudSyncReady(settings = loadGistSettings()): boolean {
  return Boolean(settings.enabled && settings.token)
}

async function githubFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const text = await response.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text.slice(0, 200) }
  }
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : `GitHub error ${response.status}`
    throw new Error(message)
  }
  return data
}

async function githubJson(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const data = await githubFetch(path, token, init)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Unexpected GitHub response')
  }
  return data as Record<string, unknown>
}

export const OWNLAB_GIST_FILE = FILE_NAME
export const OWNLAB_GIST_DESCRIPTION = 'OWNLAB notebook cloud backup'

export type OwnlabGistMatch = {
  gistId: string
  updatedAt: string
  htmlUrl: string | null
  noteCount: number
}

function countNotesInBackupJson(raw: string | null): number {
  if (!raw) return 0
  try {
    const parsed = JSON.parse(raw) as { entries?: unknown }
    return Array.isArray(parsed.entries) ? parsed.entries.length : 0
  } catch {
    return 0
  }
}

function gistLooksLikeOwnlab(gist: Record<string, unknown>): boolean {
  const files = gist.files as Record<string, unknown> | undefined
  if (files && FILE_NAME in files) return true
  const description = typeof gist.description === 'string' ? gist.description : ''
  return /OWNLAB notebook/i.test(description)
}

/**
 * Find existing OWNLAB cloud notebooks for this GitHub token.
 * Used so a new device can restore notes with the token alone (no separate login / gist id).
 */
export async function findOwnlabNotebookGists(token: string): Promise<OwnlabGistMatch[]> {
  const trimmed = token.trim()
  if (!trimmed) return []

  const candidates: Array<{ gistId: string; updatedAt: string; htmlUrl: string | null }> = []
  for (let page = 1; page <= 5; page += 1) {
    const data = await githubFetch(`/gists?per_page=100&page=${page}`, trimmed)
    if (!Array.isArray(data) || data.length === 0) break
    for (const item of data) {
      if (!item || typeof item !== 'object') continue
      const gist = item as Record<string, unknown>
      if (!gistLooksLikeOwnlab(gist)) continue
      const gistId = String(gist.id || '')
      if (!gistId) continue
      candidates.push({
        gistId,
        updatedAt: typeof gist.updated_at === 'string' ? gist.updated_at : '',
        htmlUrl: typeof gist.html_url === 'string' ? gist.html_url : gistUrlFor(gistId),
      })
    }
    if (data.length < 100) break
  }

  // Rank by note count (empty gists created by prior broken “enable” flows lose).
  const scored: OwnlabGistMatch[] = []
  for (const candidate of candidates) {
    try {
      const full = await githubJson(`/gists/${candidate.gistId}`, trimmed)
      const content = extractBackupContent(full)
      scored.push({
        ...candidate,
        noteCount: countNotesInBackupJson(content),
      })
    } catch {
      scored.push({ ...candidate, noteCount: 0 })
    }
  }

  scored.sort((a, b) => {
    if (b.noteCount !== a.noteCount) return b.noteCount - a.noteCount
    return (b.updatedAt || '').localeCompare(a.updatedAt || '')
  })
  return scored
}

/** Best existing OWNLAB gist for this token, or null if none. */
export async function resolveOwnlabNotebookGist(
  token: string,
): Promise<OwnlabGistMatch | null> {
  const matches = await findOwnlabNotebookGists(token)
  return matches[0] ?? null
}

function extractBackupContent(gist: Record<string, unknown>): string | null {
  const files = gist.files as Record<string, { content?: string }> | undefined
  if (!files) return null
  if (files[FILE_NAME]?.content) return files[FILE_NAME].content
  const first = Object.values(files)[0]
  return first?.content ?? null
}

export async function pullGistBackup(
  settings = loadGistSettings(),
): Promise<string | null> {
  if (!settings.token || !settings.gistId) return null
  // Allow an explicit pull while connecting a second device (enabled may still be off).
  const gist = await githubJson(`/gists/${settings.gistId}`, settings.token)
  return extractBackupContent(gist)
}

export async function pushGistBackup(
  json: string,
  settings = loadGistSettings(),
): Promise<{ gistId: string; truncated: boolean; htmlUrl: string | null }> {
  if (!settings.enabled || !settings.token) {
    throw new Error('Cloud sync is not configured')
  }
  let body = json
  let truncated = false
  if (body.length > MAX_PUSH_CHARS) {
    // Prefer syncing structure over failing entirely when images blow the limit.
    truncated = true
    const parsed = JSON.parse(body) as {
      version?: number
      exportedAt?: string
      entries?: Array<{ selectedText?: string; explanation?: string; [k: string]: unknown }>
      trash?: Array<{ selectedText?: string; explanation?: string; [k: string]: unknown }>
      categories?: unknown
    }
    const shrink = (list: typeof parsed.entries) =>
      (list ?? []).map((entry) => ({
        ...entry,
        selectedText:
          typeof entry.selectedText === 'string' && entry.selectedText.length > 80_000
            ? `${entry.selectedText.slice(0, 80_000)}\n\n<!-- truncated for gist size -->`
            : entry.selectedText,
        explanation:
          typeof entry.explanation === 'string' && entry.explanation.length > 40_000
            ? `${entry.explanation.slice(0, 40_000)}\n\n<!-- truncated for gist size -->`
            : entry.explanation,
      }))
    body = JSON.stringify(
      {
        ...parsed,
        exportedAt: new Date().toISOString(),
        truncatedForGist: true,
        entries: shrink(parsed.entries),
        trash: shrink(parsed.trash),
        categories: parsed.categories ?? [],
      },
      null,
      2,
    )
  }

  const payload = {
    description: 'OWNLAB notebook cloud backup',
    public: false,
    files: {
      [FILE_NAME]: { content: body },
    },
  }

  if (settings.gistId) {
    const updated = await githubJson(`/gists/${settings.gistId}`, settings.token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    setLastCloudSyncAt()
    return {
      gistId: settings.gistId,
      truncated,
      htmlUrl: typeof updated.html_url === 'string' ? updated.html_url : gistUrlFor(settings.gistId),
    }
  }

  const created = await githubJson('/gists', settings.token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const gistId = String(created.id || '')
  if (!gistId) throw new Error('GitHub did not return a cloud notebook id')
  saveGistSettings({ gistId })
  setLastCloudSyncAt()
  return {
    gistId,
    truncated,
    htmlUrl: typeof created.html_url === 'string' ? created.html_url : gistUrlFor(gistId),
  }
}

/** Verify the token can read/write gists (classic PAT with gist scope). */
export async function verifyGistToken(token: string): Promise<{ ok: true }> {
  const trimmed = token.trim()
  if (!trimmed) throw new Error('GitHub token is required')
  try {
    // Prefer the gists endpoint — some tokens can sync notes without a full /user grant.
    await githubJson('/gists?per_page=1', trimmed)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid token'
    if (/Resource not accessible|Bad credentials|401|403/i.test(message)) {
      throw new Error(
        'Token cannot access Gists. Create a classic GitHub PAT with the gist scope and try again.',
      )
    }
    throw err
  }
}
