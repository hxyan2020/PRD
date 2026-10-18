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

/** Thrown when another device updated the Gist between our pull and push. */
export class GistConflictError extends Error {
  readonly status: number

  constructor(status = 412) {
    super('Cloud notebook changed on another device — retrying merge')
    this.name = 'GistConflictError'
    this.status = status
  }
}

export function isGistConflictError(err: unknown): err is GistConflictError {
  return err instanceof GistConflictError
}

type GithubRequestResult = {
  ok: boolean
  status: number
  etag: string | null
  data: unknown
}

async function githubRequest(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<GithubRequestResult> {
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
  return {
    ok: response.ok,
    status: response.status,
    etag: response.headers.get('ETag'),
    data,
  }
}

async function githubFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<unknown> {
  const result = await githubRequest(path, token, init)
  if (!result.ok) {
    if (result.status === 409 || result.status === 412) {
      throw new GistConflictError(result.status)
    }
    const data = result.data
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : `GitHub error ${result.status}`
    throw new Error(message)
  }
  return result.data
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
      const content = await extractBackupContentFull(full, trimmed)
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

type GistFile = {
  content?: string
  truncated?: boolean
  raw_url?: string
  filename?: string
}

function pickOwnlabFile(
  files: Record<string, GistFile> | undefined,
): GistFile | null {
  if (!files) return null
  if (files[FILE_NAME]) return files[FILE_NAME]
  return Object.values(files)[0] ?? null
}

/**
 * Full notebook JSON, following raw_url when GitHub truncates >1MB files.
 * Without this, large notebooks restore as empty/corrupt on a new device.
 * Also falls back to raw_url when inline content is missing or not valid JSON.
 */
export async function extractBackupContentFull(
  gist: Record<string, unknown>,
  token: string,
): Promise<string | null> {
  const files = gist.files as Record<string, GistFile> | undefined
  const file = pickOwnlabFile(files)
  if (!file) return null

  const inline = file.content ?? null
  const inlineOk = (() => {
    if (!inline) return false
    try {
      JSON.parse(inline)
      return true
    } catch {
      return false
    }
  })()

  const needsRaw = Boolean(file.raw_url) && (file.truncated || !inlineOk)
  if (needsRaw && file.raw_url) {
    const response = await fetch(file.raw_url, {
      headers: {
        Accept: 'application/vnd.github.raw',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!response.ok) {
      if (inlineOk) return inline
      throw new Error(`Could not download full cloud notebook (${response.status})`)
    }
    return response.text()
  }
  return inline
}

export type OwnlabGistBackup = OwnlabGistMatch & { content: string }

/** Download every OWNLAB gist backup for this token (for union-merge recovery). */
export async function pullAllOwnlabGistBackups(token: string): Promise<OwnlabGistBackup[]> {
  const matches = await findOwnlabNotebookGists(token)
  const out: OwnlabGistBackup[] = []
  for (const match of matches) {
    try {
      const full = await githubJson(`/gists/${match.gistId}`, token.trim())
      const content = await extractBackupContentFull(full, token.trim())
      if (!content) continue
      out.push({
        ...match,
        noteCount: countNotesInBackupJson(content),
        content,
      })
    } catch {
      /* skip unreadable gist */
    }
  }
  return out
}

/**
 * Publish a standalone notes HTML as a *public* Gist so the user can open a
 * shareable link on any device and copy text/images.
 */
export async function publishPublicNotesHtml(
  html: string,
  token: string,
  options?: { fileName?: string; description?: string },
): Promise<{ gistId: string; htmlUrl: string; rawUrl: string | null }> {
  const trimmed = token.trim()
  if (!trimmed) throw new Error('GitHub token is required')
  const fileName = options?.fileName || 'ownlab-notes-copy.html'
  const description =
    options?.description || 'OWNLAB notes — public copy page (text + images)'
  const result = await githubRequest('/gists', trimmed, {
    method: 'POST',
    body: JSON.stringify({
      description,
      public: true,
      files: {
        [fileName]: { content: html },
      },
    }),
  })
  if (!result.ok) {
    const data = result.data
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : `GitHub error ${result.status}`
    throw new Error(message)
  }
  const created = result.data
  if (!created || typeof created !== 'object' || Array.isArray(created)) {
    throw new Error('Unexpected GitHub response')
  }
  const gistId = String((created as { id?: unknown }).id || '')
  if (!gistId) throw new Error('GitHub did not return a public page id')
  const htmlUrl =
    typeof (created as { html_url?: unknown }).html_url === 'string'
      ? String((created as { html_url: string }).html_url)
      : `https://gist.github.com/${gistId}`
  const files = (created as { files?: Record<string, { raw_url?: string }> }).files
  const rawUrl = files?.[fileName]?.raw_url ?? null
  return { gistId, htmlUrl, rawUrl }
}

/** Accept a raw gist id or a gist.github.com / api URL. */
export function parseGistIdInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^[a-f0-9]{16,}$/i.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    const parts = url.pathname.split('/').filter(Boolean)
    // https://gist.github.com/{user}/{id} or https://gist.github.com/{id}
    const last = parts[parts.length - 1] || ''
    if (/^[a-f0-9]{16,}$/i.test(last)) return last
  } catch {
    /* not a URL */
  }
  const match = trimmed.match(/[a-f0-9]{20,}/i)
  return match?.[0] ?? trimmed
}

export type PulledGistBackup = {
  content: string
  etag: string | null
  gistId: string
}

/**
 * Pull cloud notebook JSON + ETag (for conflict-safe push).
 * Returns null when this device has no gist id yet.
 */
export async function pullGistBackupMeta(
  settings = loadGistSettings(),
): Promise<PulledGistBackup | null> {
  if (!settings.token || !settings.gistId) return null
  // Allow an explicit pull while connecting a second device (enabled may still be off).
  const result = await githubRequest(`/gists/${settings.gistId}`, settings.token)
  if (!result.ok) {
    const data = result.data
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : `GitHub error ${result.status}`
    throw new Error(message)
  }
  if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
    throw new Error('Unexpected GitHub response')
  }
  const content = await extractBackupContentFull(
    result.data as Record<string, unknown>,
    settings.token,
  )
  if (!content) return null
  return { content, etag: result.etag, gistId: settings.gistId }
}

export async function pullGistBackup(
  settings = loadGistSettings(),
): Promise<string | null> {
  const meta = await pullGistBackupMeta(settings)
  return meta?.content ?? null
}

/**
 * If this device is stuck on an empty / poorer OWNLAB gist while another gist for
 * the same token has more notes, switch to the richer notebook.
 *
 * `preferRichest`: used by the public-HTML export path — always attach to the
 * OWNLAB gist with the most notes so a phone with a partial/older gist id still
 * pulls the full notebook (e.g. 15 notes instead of a leftover 8-note gist).
 */
export async function repairOwnlabGistSelection(
  settings = loadGistSettings(),
  options?: { preferRichest?: boolean },
): Promise<{ switched: boolean; gistId: string; noteCount: number }> {
  if (!settings.token) {
    return { switched: false, gistId: settings.gistId, noteCount: 0 }
  }
  const matches = await findOwnlabNotebookGists(settings.token)
  if (!matches.length) {
    return { switched: false, gistId: settings.gistId, noteCount: 0 }
  }
  const best = matches[0]
  const current = settings.gistId
    ? matches.find((m) => m.gistId === settings.gistId)
    : undefined
  const currentCount = current?.noteCount ?? 0
  // Default: only escape unset / unknown / empty gists.
  // Export path: also jump when another OWNLAB gist clearly has more notes.
  const shouldSwitch =
    !settings.gistId ||
    !current ||
    (currentCount === 0 && best.noteCount > 0) ||
    (Boolean(options?.preferRichest) && best.noteCount > currentCount)
  if (shouldSwitch && best.gistId !== settings.gistId) {
    saveGistSettings({ gistId: best.gistId })
    return { switched: true, gistId: best.gistId, noteCount: best.noteCount }
  }
  return {
    switched: false,
    gistId: settings.gistId || best.gistId,
    noteCount: current?.noteCount ?? best.noteCount,
  }
}

export async function pushGistBackup(
  json: string,
  settings = loadGistSettings(),
  options?: { ifMatch?: string | null },
): Promise<{ gistId: string; truncated: boolean; htmlUrl: string | null; etag: string | null }> {
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
    const headers: Record<string, string> = {}
    if (options?.ifMatch) headers['If-Match'] = options.ifMatch
    const result = await githubRequest(`/gists/${settings.gistId}`, settings.token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers,
    })
    if (!result.ok) {
      if (result.status === 409 || result.status === 412) {
        throw new GistConflictError(result.status)
      }
      const data = result.data
      const message =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message: unknown }).message)
          : `GitHub error ${result.status}`
      throw new Error(message)
    }
    const updated = result.data
    if (!updated || typeof updated !== 'object' || Array.isArray(updated)) {
      throw new Error('Unexpected GitHub response')
    }
    setLastCloudSyncAt()
    return {
      gistId: settings.gistId,
      truncated,
      htmlUrl:
        typeof (updated as { html_url?: unknown }).html_url === 'string'
          ? String((updated as { html_url: string }).html_url)
          : gistUrlFor(settings.gistId),
      etag: result.etag,
    }
  }

  const createdResult = await githubRequest('/gists', settings.token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!createdResult.ok) {
    const data = createdResult.data
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : `GitHub error ${createdResult.status}`
    throw new Error(message)
  }
  const created = createdResult.data
  if (!created || typeof created !== 'object' || Array.isArray(created)) {
    throw new Error('Unexpected GitHub response')
  }
  const gistId = String((created as { id?: unknown }).id || '')
  if (!gistId) throw new Error('GitHub did not return a cloud notebook id')
  saveGistSettings({ gistId })
  setLastCloudSyncAt()
  return {
    gistId,
    truncated,
    htmlUrl:
      typeof (created as { html_url?: unknown }).html_url === 'string'
        ? String((created as { html_url: string }).html_url)
        : gistUrlFor(gistId),
    etag: createdResult.etag,
  }
}

/** Verify the token can read/write gists (classic PAT with gist scope). */
export async function verifyGistToken(token: string): Promise<{ ok: true }> {
  const trimmed = token.trim()
  if (!trimmed) throw new Error('GitHub token is required')
  try {
    // Prefer the gists endpoint — some tokens can sync notes without a full /user grant.
    // Response is a JSON array; do not use githubJson (object-only).
    const data = await githubFetch('/gists?per_page=1', trimmed)
    if (!Array.isArray(data)) {
      throw new Error('Unexpected GitHub response while verifying token')
    }
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
