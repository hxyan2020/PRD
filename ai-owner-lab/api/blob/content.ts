/**
 * Same-origin stream of a private notebook file (images / attachments).
 * Safari often fails fetching cross-origin signed Blob URLs ("Load failed");
 * streaming through Edge keeps the download same-origin.
 *
 * Edge runtime + raw fetch only (no @vercel/blob SDK — Node modules).
 */
export const config = {
  runtime: 'edge',
  maxDuration: 60,
}

const SESSION_COOKIE = 'ownlab_session'
const BLOB_API = 'https://vercel.com/api/blob'

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32)
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

function b64urlFromBytes(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes)
  let bin = ''
  for (let i = 0; i < arr.length; i += 1) bin += String.fromCharCode(arr[i]!)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function b64urlDecodeToString(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
  return atob(padded)
}

function storeIdFromToken(token: string): string | null {
  const match = /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(token)
  return match?.[1] || null
}

async function verifySessionEdge(
  token: string | null,
  secret: string,
): Promise<{ u: string } | null> {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
    const expected = b64urlFromBytes(mac)
    if (expected.length !== sig.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    if (diff !== 0) return null
    const payload = JSON.parse(b64urlDecodeToString(body)) as { u?: string; e?: number }
    if (!payload.u || typeof payload.e !== 'number' || payload.e < Date.now()) return null
    return { u: payload.u }
  } catch {
    return null
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const secret = process.env.OWNLAB_AUTH_SECRET
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!secret || !blobToken) {
    return Response.json({ error: 'Server auth/storage is not configured' }, { status: 500 })
  }

  const session = await verifySessionEdge(
    readCookie(req.headers.get('cookie'), SESSION_COOKIE),
    secret,
  )
  if (!session?.u) {
    return Response.json({ error: 'Sign in required' }, { status: 401 })
  }

  const url = new URL(req.url)
  const pathname = decodeURIComponent(url.searchParams.get('pathname') || '').replace(/^\/+/, '')
  const prefix = `ownlab-accounts/${normalizeUsername(session.u)}/files/`
  if (!pathname || !pathname.startsWith(prefix)) {
    return Response.json({ error: 'Not allowed to download this file' }, { status: 403 })
  }

  const storeId = process.env.BLOB_STORE_ID || storeIdFromToken(blobToken)
  if (!storeId) {
    return Response.json({ error: 'Blob store id missing' }, { status: 500 })
  }

  let contentType = 'application/octet-stream'
  let etag: string | null = null
  try {
    const metaRes = await fetch(`${BLOB_API}?url=${encodeURIComponent(pathname)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${blobToken}` },
    })
    if (metaRes.status === 404) {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }
    if (!metaRes.ok) {
      const text = await metaRes.text()
      return Response.json(
        { error: text || `Blob meta failed (${metaRes.status})` },
        { status: 502 },
      )
    }
    const meta = (await metaRes.json()) as { contentType?: string; etag?: string }
    if (typeof meta.contentType === 'string' && meta.contentType) contentType = meta.contentType
    if (typeof meta.etag === 'string') etag = meta.etag
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Blob meta failed' },
      { status: 502 },
    )
  }

  const blobUrl = `https://${storeId}.private.blob.vercel-storage.com/${pathname}?cache=0`
  const blobRes = await fetch(blobUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${blobToken}` },
  })
  if (blobRes.status === 404) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }
  if (!blobRes.ok || !blobRes.body) {
    return Response.json(
      { error: `File download failed (${blobRes.status})` },
      { status: 502 },
    )
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'private, no-store',
    // No Content-Length — Safari aborts streams when declared length mismatches.
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
  })
  if (etag) headers.set('ETag', etag)

  return new Response(blobRes.body, { status: 200, headers })
}
