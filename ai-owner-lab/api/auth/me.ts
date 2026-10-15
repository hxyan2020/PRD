import { corsAuth, sessionFromRequest } from '../_lib/auth'

export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined> },
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
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const session = sessionFromRequest(req)
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    res.status(200).json({ username: session.u })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Auth check failed' })
  }
}
