/**
 * Stream a private notebook attachment after verifying the signed-in account owns it.
 */
import { head } from '@vercel/blob'
import { blobToken, corsAuth, sessionFromRequest } from '../_lib/auth.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

function queryPathname(req: {
  query?: Record<string, string | string[] | undefined>
  url?: string
}): string {
  const fromQuery = req.query?.pathname
  if (typeof fromQuery === 'string') return fromQuery
  if (Array.isArray(fromQuery) && fromQuery[0]) return fromQuery[0]
  try {
    const url = new URL(req.url || '', 'http://localhost')
    return url.searchParams.get('pathname') || ''
  } catch {
    return ''
  }
}

export default async function handler(
  req: {
    method?: string
    headers?: Record<string, string | string[] | undefined>
    url?: string
    query?: Record<string, string | string[] | undefined>
  },
  res: {
    setHeader: (k: string, v: string) => void
    status: (n: number) => {
      end: () => void
      json: (b: unknown) => void
      send: (b: string | Buffer) => void
    }
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
    if (!session?.u) {
      res.status(401).json({ error: 'Sign in to download notebook files' })
      return
    }

    const pathname = decodeURIComponent(queryPathname(req)).replace(/^\/+/, '')
    const prefix = `ownlab-accounts/${session.u}/files/`
    if (!pathname || !pathname.startsWith(prefix)) {
      res.status(403).json({ error: 'Not allowed to download this file' })
      return
    }

    const token = blobToken()
    const meta = await head(pathname, { token })
    const downloadUrl = meta.downloadUrl || meta.url
    const upstream = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!upstream.ok) {
      res.status(upstream.status === 404 ? 404 : 502).json({ error: 'File not found' })
      return
    }

    const contentType = meta.contentType || upstream.headers.get('content-type') || 'application/octet-stream'
    const disposition =
      meta.contentDisposition ||
      upstream.headers.get('content-disposition') ||
      `attachment; filename="${pathname.split('/').pop() || 'download'}"`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', disposition)
    res.setHeader('Cache-Control', 'private, no-store')
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.status(200).send(buf)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Download failed' })
  }
}
