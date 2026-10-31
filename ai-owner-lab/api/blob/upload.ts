/**
 * Client-token endpoint for direct browser → Vercel Blob uploads.
 * Files never pass through the serverless body (supports large docs/zips).
 */
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { blobToken, corsAuth, sessionFromRequest } from '../_lib/auth.js'

/** Effectively unlimited for product use (Blob multipart ceiling). */
const MAX_BYTES = 5 * 1024 * 1024 * 1024 * 1024 // 5 TiB

export default async function handler(
  req: {
    method?: string
    headers?: Record<string, string | string[] | undefined>
    body?: unknown
  },
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
    const session = sessionFromRequest(req)
    if (!session?.u) {
      res.status(401).json({ error: 'Sign in to upload files to your notebook' })
      return
    }
    const username = session.u
    const filesPrefix = `ownlab-accounts/${username}/files/`
    const notebookPath = `ownlab-accounts/${username}/notebook.json`

    const body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as HandleUploadBody)
        : (req.body as HandleUploadBody)

    // No onUploadCompleted — that forces a post-upload callback hop to this
    // serverless function and adds latency for every picture.
    const jsonResponse = await handleUpload({
      body,
      request: req as never,
      token: blobToken(),
      onBeforeGenerateToken: async (pathname) => {
        const clean = String(pathname || '').replace(/^\/+/, '')
        // Large notebooks bypass the 4.5MB serverless PUT limit via direct Blob upload.
        if (clean === notebookPath) {
          return {
            access: 'private',
            addRandomSuffix: false,
            allowOverwrite: true,
            maximumSizeInBytes: MAX_BYTES,
            tokenPayload: JSON.stringify({ username, kind: 'notebook' }),
          }
        }
        if (!clean.startsWith(filesPrefix)) {
          throw new Error('Upload path must be under your account folder')
        }
        return {
          access: 'private',
          addRandomSuffix: true,
          allowOverwrite: false,
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({ username }),
        }
      },
    })

    res.status(200).json(jsonResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload token failed'
    const status = /sign in|unauthorized|path must/i.test(message) ? 401 : 400
    res.status(status).json({ error: message })
  }
}
