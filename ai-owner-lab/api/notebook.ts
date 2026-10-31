/**
 * Cross-device notebook backup on Vercel Blob.
 * Preferred auth: signed session cookie (account login).
 * Fallback: shared cloud key header `x-ownlab-cloud-key`.
 *
 * Large notebooks must NOT pass through the serverless request/response body
 * (Vercel ~4.5MB). GET returns a signed Blob URL; clients upload via Blob client.
 */
import { createHash } from 'node:crypto'
import { getDownloadUrl, head, issueSignedToken, put, presignUrl } from '@vercel/blob'
import {
  accountNotebookPath,
  blobToken,
  corsAuth,
  sessionFromRequest,
} from './_lib/auth.js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
}

const MIN_KEY_LEN = 8
const MAX_BODY_CHARS = 4_500_000

function pathnameForKey(cloudKey: string): string {
  const hash = createHash('sha256').update(cloudKey, 'utf8').digest('hex')
  return `ownlab-notebooks/${hash}.json`
}

function readCloudKey(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const raw = req.headers?.['x-ownlab-cloud-key']
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value.trim() : ''
}

function resolvePathname(req: {
  headers?: Record<string, string | string[] | undefined>
}): { pathname: string; mode: 'account' | 'key' } | { error: string; status: number } {
  const session = sessionFromRequest(req)
  if (session?.u) {
    return { pathname: accountNotebookPath(session.u), mode: 'account' }
  }
  const cloudKey = readCloudKey(req)
  if (cloudKey.length >= MIN_KEY_LEN) {
    return { pathname: pathnameForKey(cloudKey), mode: 'key' }
  }
  return {
    status: 401,
    error:
      'Sign in to sync notes across devices, or send x-ownlab-cloud-key (advanced).',
  }
}

export default async function handler(
  req: {
    method?: string
    headers?: Record<string, string | string[] | undefined>
    body?: unknown
  },
  res: {
    setHeader: (k: string, v: string) => void
    status: (n: number) => {
      end: () => void
      json: (b: unknown) => void
      send: (b: string) => void
    }
  },
) {
  corsAuth(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  let token: string
  try {
    token = blobToken()
  } catch {
    res.status(500).json({ error: 'Vercel Blob is not configured on this deployment' })
    return
  }

  const resolved = resolvePathname(req)
  if ('error' in resolved) {
    res.status(resolved.status).json({ error: resolved.error })
    return
  }
  const { pathname, mode } = resolved

  try {
    if (req.method === 'GET') {
      let meta: { uploadedAt?: Date | string; size?: number }
      try {
        meta = await head(pathname, { token })
      } catch {
        res.status(404).json({
          error:
            mode === 'account'
              ? 'No notebook saved for this account yet'
              : 'No notebook saved for this cloud key yet',
        })
        return
      }

      // Signed URL — browser downloads from Blob CDN (no serverless response cap).
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
      const uploadedAt =
        meta.uploadedAt instanceof Date
          ? meta.uploadedAt.toISOString()
          : typeof meta.uploadedAt === 'string'
            ? meta.uploadedAt
            : null

      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.status(200).json({
        url: downloadUrl,
        pathname,
        mode,
        uploadedAt,
        size: typeof meta.size === 'number' ? meta.size : null,
      })
      return
    }

    if (req.method === 'PUT') {
      const body =
        typeof req.body === 'string'
          ? req.body
          : req.body == null
            ? ''
            : JSON.stringify(req.body)
      if (!body || body.length > MAX_BODY_CHARS) {
        res.status(400).json({
          error:
            'Notebook payload missing or too large — use account Blob upload for big notebooks',
        })
        return
      }
      try {
        const parsed = JSON.parse(body) as { entries?: unknown }
        if (!Array.isArray(parsed.entries)) {
          res.status(400).json({ error: 'Invalid notebook JSON (entries required)' })
          return
        }
      } catch {
        res.status(400).json({ error: 'Invalid notebook JSON' })
        return
      }

      const result = await put(pathname, body, {
        access: 'private',
        token,
        contentType: 'application/json; charset=utf-8',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
      const etag = createHash('sha256').update(body).digest('hex')
      res.setHeader('ETag', etag)
      res.status(200).json({
        ok: true,
        mode,
        pathname: result.pathname,
        etag,
        uploadedAt: new Date().toISOString(),
      })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage error'
    res.status(500).json({ error: message })
  }
}
