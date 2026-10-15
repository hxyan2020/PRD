import {
  corsAuth,
  createUserRecord,
  loadUser,
  normalizeUsername,
  readJsonBody,
  saveUser,
  setSessionCookie,
  signSession,
} from '../_lib/auth.js'

export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown },
  res: {
    setHeader: (k: string, v: string) => void
    status: (n: number) => { end: () => void; json: (b: unknown) => void; send: (b: string) => void }
  },
) {
  corsAuth(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = readJsonBody(req)
    const username = normalizeUsername(String(body.username || ''))
    const password = String(body.password || '')
    if (username.length < 2) {
      res.status(400).json({ error: 'Username must be at least 2 characters (letters/numbers)' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }
    const existing = await loadUser(username)
    if (existing) {
      res.status(409).json({ error: 'That username is already taken — sign in instead' })
      return
    }
    const record = createUserRecord(username, password)
    await saveUser(record)
    const token = signSession(record.username)
    setSessionCookie(res, token)
    res.status(201).json({ username: record.username })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Register failed' })
  }
}
