import { clearSessionCookie, corsAuth } from '../_lib/auth'

export default async function handler(
  req: { method?: string },
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
  clearSessionCookie(res)
  res.status(200).json({ ok: true })
}
