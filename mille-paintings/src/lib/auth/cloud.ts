import type { UserLibrarySnapshot } from '../storage'

/**
 * Optional Supabase cloud sync.
 * When VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set, library snapshots
 * are stored in a `mille_user_library` table keyed by user id.
 *
 * Expected table (run once in Supabase SQL):
 *
 * create table if not exists mille_user_library (
 *   user_id text primary key,
 *   viewed jsonb not null default '[]',
 *   collected jsonb not null default '[]',
 *   prefs jsonb not null default '{}',
 *   extras jsonb not null default '[]',
 *   updated_at timestamptz not null default now()
 * );
 *
 * alter table mille_user_library enable row level security;
 * -- For local-account sync via anon key, use a service policy carefully,
 * -- or prefer Supabase Auth user_id = auth.uid(). For this app’s local
 * -- accounts, the client uses the anon key with user_id as the row key
 * -- (security through obscurity of UUID — upgrade to Supabase Auth for RLS).
 */

function supabaseConfig(): { url: string; anon: string } | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  if (!url || !anon) return null
  return { url: url.replace(/\/$/, ''), anon }
}

export function isCloudSyncEnabled(): boolean {
  return Boolean(supabaseConfig())
}

async function supabaseFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cfg = supabaseConfig()
  if (!cfg) throw new Error('cloud_disabled')
  const headers = new Headers(init.headers)
  headers.set('apikey', cfg.anon)
  headers.set('Authorization', `Bearer ${cfg.anon}`)
  headers.set('Content-Type', 'application/json')
  headers.set('Prefer', 'return=representation')
  return fetch(`${cfg.url}/rest/v1/${path}`, { ...init, headers })
}

export async function pullCloudLibrary(userId: string): Promise<UserLibrarySnapshot | null> {
  if (!supabaseConfig()) return null
  const res = await supabaseFetch(
    `mille_user_library?user_id=eq.${encodeURIComponent(userId)}&select=*`,
  )
  if (!res.ok) throw new Error(`cloud_pull_${res.status}`)
  const rows = (await res.json()) as Array<{
    viewed?: string[]
    collected?: string[]
    prefs?: UserLibrarySnapshot['prefs']
    extras?: UserLibrarySnapshot['extras']
    updated_at?: string
  }>
  const row = rows[0]
  if (!row) return null
  return {
    viewed: row.viewed || [],
    collected: row.collected || [],
    prefs: row.prefs || { genres: [], countries: [], eras: [], moods: [] },
    extras: row.extras || [],
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

export async function pushCloudLibrary(userId: string, snap: UserLibrarySnapshot): Promise<void> {
  if (!supabaseConfig()) return
  const body = {
    user_id: userId,
    viewed: snap.viewed,
    collected: snap.collected,
    prefs: snap.prefs,
    extras: snap.extras,
    updated_at: snap.updatedAt || new Date().toISOString(),
  }
  const res = await supabaseFetch('mille_user_library?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`cloud_push_${res.status}`)
}
