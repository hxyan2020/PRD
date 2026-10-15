import {
  corsAuth,
  loadUser,
  normalizeUsername,
  readJsonBody,
  setSessionCookie,
  signSession,
  verifyPassword,
} from '../_lib/auth'

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
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' })
      return
    }
    const record = await loadUser(username)
    if (!record || !verifyPassword(password, record)) {
      res.status(401).json({ error: 'Wrong username or password' })
      return
    }
    const token = signSession(record.username)
    setSessionCookie(res, token)
    res.status(200).json({ username: record.username })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Login failed' })
  }
}
