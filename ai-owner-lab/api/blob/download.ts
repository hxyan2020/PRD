/**
 * Issue a short-lived signed download URL for a private notebook attachment.
 * Browser downloads go straight to Blob storage (no serverless body size cap).
 */
import { head, issueSignedToken, presignUrl, getDownloadUrl } from '@vercel/blob'
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

function wantsRedirect(req: {
  query?: Record<string, string | string[] | undefined>
  url?: string
  headers?: Record<string, string | string[] | undefined>
}): boolean {
  try {
    const url = new URL(req.url || '', 'http://localhost')
    if (url.searchParams.get('redirect') === '1') return true
  } catch {
    /* ignore */
  }
  const accept = req.headers?.accept
  const value = Array.isArray(accept) ? accept.join(',') : String(accept || '')
  // Direct navigation / <a href> prefers HTML; XHR/fetch usually sends application/json
  return value.includes('text/html') && !value.includes('application/json')
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
    redirect?: (status: number, url: string) => void
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
    try {
      await head(pathname, { token })
    } catch {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const signed = await issueSignedToken({
      token,
      pathname,
      operations: ['get'],
      validUntil: Date.now() + 15 * 60 * 1000,
    })
    const { presignedUrl } = await presignUrl(signed, {
      access: 'private',
      operation: 'get',
      pathname,
      useCache: false,
    })
    const downloadUrl = getDownloadUrl(presignedUrl)

    if (wantsRedirect(req)) {
      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('Location', downloadUrl)
      res.status(302).end()
      return
    }

    res.setHeader('Cache-Control', 'private, no-store')
    res.status(200).json({ url: downloadUrl, pathname })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Download failed' })
  }
}
