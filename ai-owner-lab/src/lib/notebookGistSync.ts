/**
 * Optional GitHub Gist sync — notes travel with your GitHub account across devices.
 * Token stays in this browser only (same pattern as the AI tutor API key).
 */

const TOKEN_KEY = 'ownlab-notebook-gist-token'
const GIST_ID_KEY = 'ownlab-notebook-gist-id'
const ENABLED_KEY = 'ownlab-notebook-gist-enabled'
const FILE_NAME = 'ownlab-notebook-backup.json'
const MAX_PUSH_CHARS = 4_500_000

export type GistSettings = {
  token: string
  gistId: string
  enabled: boolean
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

async function githubJson(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
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
  let data: Record<string, unknown> = {}
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    data = { message: text.slice(0, 200) }
  }
  if (!response.ok) {
    throw new Error(String(data.message || `GitHub error ${response.status}`))
  }
  return data
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
  if (!settings.enabled || !settings.token || !settings.gistId) return null
  const gist = await githubJson(`/gists/${settings.gistId}`, settings.token)
  return extractBackupContent(gist)
}

export async function pushGistBackup(
  json: string,
  settings = loadGistSettings(),
): Promise<{ gistId: string; truncated: boolean }> {
  if (!settings.enabled || !settings.token) {
    throw new Error('GitHub sync is not configured')
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
    description: 'OWNLAB notebook backup',
    public: false,
    files: {
      [FILE_NAME]: { content: body },
    },
  }

  if (settings.gistId) {
    await githubJson(`/gists/${settings.gistId}`, settings.token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return { gistId: settings.gistId, truncated }
  }

  const created = await githubJson('/gists', settings.token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const gistId = String(created.id || '')
  if (!gistId) throw new Error('GitHub did not return a gist id')
  saveGistSettings({ gistId })
  return { gistId, truncated }
}
