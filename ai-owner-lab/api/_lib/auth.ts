import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { head, put } from '@vercel/blob'

export const SESSION_COOKIE = 'ownlab_session'
const SESSION_DAYS = 90

export type AuthUserRecord = {
  username: string
  passwordHash: string
  salt: string
  createdAt: string
}

export type SessionPayload = {
  u: string
  e: number
}

type ReqReq = {
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

type ResLike = {
  setHeader: (k: string, v: string) => void
  status: (n: number) => {
    end: () => void
    json: (b: unknown) => void
    send: (b: string) => void
  }
}

export function blobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  return token
}

export function authSecret(): string {
  const secret = process.env.OWNLAB_AUTH_SECRET
  if (!secret) throw new Error('OWNLAB_AUTH_SECRET is not configured')
  return secret
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32)
}

export function userPath(username: string): string {
  return `ownlab-users/${normalizeUsername(username)}.json`
}

export function accountNotebookPath(username: string): string {
  return `ownlab-accounts/${normalizeUsername(username)}/notebook.json`
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

export function verifyPassword(password: string, record: AuthUserRecord): boolean {
  const next = hashPassword(password, record.salt)
  const a = Buffer.from(next, 'hex')
  const b = Buffer.from(record.passwordHash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function createUserRecord(username: string, password: string): AuthUserRecord {
  const salt = randomBytes(16).toString('hex')
  return {
    username: normalizeUsername(username),
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  }
}

export async function loadUser(username: string): Promise<AuthUserRecord | null> {
  const token = blobToken()
  const pathname = userPath(username)
  try {
    const meta = await head(pathname, { token })
    const url = meta.downloadUrl || meta.url
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    return (await res.json()) as AuthUserRecord
  } catch {
    return null
  }
}

export async function saveUser(record: AuthUserRecord): Promise<void> {
  const token = blobToken()
  await put(userPath(record.username), JSON.stringify(record), {
    access: 'private',
    token,
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64url')
}

export function signSession(username: string): string {
  const payload: SessionPayload = {
    u: normalizeUsername(username),
    e: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  }
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', authSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', authSecret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.u || typeof payload.e !== 'number' || payload.e < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function readCookie(req: ReqReq, name: string): string | null {
  const raw = req.headers?.cookie
  const cookieHeader = Array.isArray(raw) ? raw.join(';') : raw
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function sessionFromRequest(req: ReqReq): SessionPayload | null {
  return verifySessionToken(readCookie(req, SESSION_COOKIE))
}

export function setSessionCookie(res: ResLike, token: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
  )
}

export function clearSessionCookie(res: ResLike) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  )
}

export function readJsonBody(req: ReqReq): Record<string, unknown> {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof req.body === 'object') return req.body as Record<string, unknown>
  return {}
}

export function corsAuth(res: ResLike) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-ownlab-cloud-key, If-Match',
  )
}
