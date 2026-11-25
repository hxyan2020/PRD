/**
 * Durable JSON across Vercel serverless instances via Blob.
 * Falls back to /tmp when BLOB_READ_WRITE_TOKEN is missing (local/smoke).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { list, put } from '@vercel/blob'

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

export async function readDurableJson<T>(name: string): Promise<T | null> {
  const token = blobToken()
  if (token) {
    try {
      const { blobs } = await list({ prefix: blobPathname(name), token, limit: 5 })
      const hit = blobs.find((b) => b.pathname === blobPathname(name)) || blobs[0]
      if (hit?.url) {
        const res = await fetch(hit.url, { cache: 'no-store' })
        if (res.ok) {
          const data = (await res.json()) as T
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

export async function writeDurableJson(name: string, value: unknown): Promise<void> {
  writeTmpJson(name, value)
  const token = blobToken()
  if (!token) return
  try {
    await put(blobPathname(name), JSON.stringify(value), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      token,
    })
  } catch {
    /* keep tmp copy */
  }
}
