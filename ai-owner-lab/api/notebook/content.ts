/**
 * Same-origin stream of the account notebook.json.
 * Mobile Safari often fails cross-origin Blob signed-URL fetches with "Load failed";
 * streaming through Edge avoids that and the Node 4.5MB response cap.
 *
 * Keep this file free of node: imports — it runs on the Edge runtime.
 */
import { get, head } from '@vercel/blob'

export const config = {
  runtime: 'edge',
}

const SESSION_COOKIE = 'ownlab_session'

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32)
}

function accountNotebookPath(username: string): string {
  return `ownlab-accounts/${normalizeUsername(username)}/notebook.json`
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
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!secret || !token) {
    return Response.json({ error: 'Server auth/storage is not configured' }, { status: 500 })
  }

  const session = await verifySessionEdge(
    readCookie(req.headers.get('cookie'), SESSION_COOKIE),
    secret,
  )
  if (!session?.u) {
    return Response.json({ error: 'Sign in required' }, { status: 401 })
  }

  const pathname = accountNotebookPath(session.u)
  try {
    await head(pathname, { token })
  } catch {
    return Response.json({ error: 'No notebook saved for this account yet' }, { status: 404 })
  }

  const result = await get(pathname, { access: 'private', token, useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return Response.json({ error: 'Cloud notebook missing' }, { status: 404 })
  }

  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
  })
  if (result.blob.etag) headers.set('ETag', result.blob.etag)
  if (typeof result.blob.size === 'number') {
    headers.set('Content-Length', String(result.blob.size))
  }
  if (result.blob.uploadedAt) {
    const uploadedAt =
      result.blob.uploadedAt instanceof Date
        ? result.blob.uploadedAt.toISOString()
        : String(result.blob.uploadedAt)
    headers.set('X-Ownlab-Uploaded-At', uploadedAt)
  }

  return new Response(result.stream, { status: 200, headers })
}
