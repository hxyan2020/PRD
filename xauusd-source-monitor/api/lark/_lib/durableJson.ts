/**
 * Durable JSON across Vercel serverless instances via Blob.
 * Falls back to /tmp when BLOB_READ_WRITE_TOKEN is missing (local/smoke).
 *
 * Store may be private — put/get must use access:'private' + token auth.
 * Public put fails on private stores and was silently dropping ack state
 * (card「知道了」looked OK on one instance while cron kept firing).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { get, list, put } from '@vercel/blob'

const TMP_DIR = join(tmpdir(), 've-lark-store')

function tmpPath(name: string) {
  return join(TMP_DIR, name)
}

function ensureTmp() {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })
}

export function readTmpJson<T>(name: string): T | null {
  try {
    const p = tmpPath(name)
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    return null
  }
}

export function writeTmpJson(name: string, value: unknown) {
  try {
    ensureTmp()
    writeFileSync(tmpPath(name), JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function blobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || '').trim()
}

function blobPathname(name: string): string {
  return `ve-lark-durable/${name}`
}

async function readFromBlobUrl<T>(url: string, token: string): Promise<T | null> {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

export async function readDurableJson<T>(name: string): Promise<T | null> {
  const token = blobToken()
  if (token) {
    try {
      const result = await get(blobPathname(name), { access: 'private', token })
      if (result?.statusCode === 200 && result.stream) {
        const text = await new Response(result.stream).text()
        const data = JSON.parse(text) as T
        writeTmpJson(name, data)
        return data
      }
    } catch {
      /* try list + authed fetch */
    }
    try {
      const { blobs } = await list({ prefix: blobPathname(name), token, limit: 5 })
      const hit = blobs.find((b) => b.pathname === blobPathname(name)) || blobs[0]
      if (hit?.url) {
        const data = await readFromBlobUrl<T>(hit.url, token)
        if (data != null) {
          writeTmpJson(name, data)
          return data
        }
      }
    } catch {
      /* fall through to tmp */
    }
  }
  return readTmpJson<T>(name)
}

/**
 * Persist JSON. Always writes /tmp. When BLOB_READ_WRITE_TOKEN is set, also
 * writes Blob and returns whether that remote write succeeded.
 * Callers that need cross-instance durability (cron beats / sent maps) must
 * treat `false` as failure so the next tick can retry.
 */
export async function writeDurableJson(name: string, value: unknown): Promise<boolean> {
  writeTmpJson(name, value)
  const token = blobToken()
  if (!token) return true
  const body = JSON.stringify(value)
  const base = {
    addRandomSuffix: false as const,
    allowOverwrite: true as const,
    contentType: 'application/json',
    token,
  }
  try {
    await put(blobPathname(name), body, { ...base, access: 'private' })
    return true
  } catch (privateErr) {
    try {
      await put(blobPathname(name), body, { ...base, access: 'public' })
      return true
    } catch {
      console.error(
        '[durableJson] blob write failed',
        name,
        privateErr instanceof Error ? privateErr.message : privateErr,
      )
      return false
    }
  }
}
