/**
 * Claim-once guard for Lark webhook retries / duplicate deliveries.
 * Local: in-memory + /tmp exclusive create (warm instance).
 * Cross-instance: Vercel Blob exclusive put when BLOB_READ_WRITE_TOKEN is set.
 */
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { put } from '@vercel/blob'
import { readDurableJson, writeTmpJson } from './durableJson.js'

const DIR = '/tmp/ve-lark-dedupe'
const mem = new Map<string, number>()
const DEFAULT_TTL_MS = 20 * 60 * 1000

function ensure() {
  try {
    mkdirSync(DIR, { recursive: true })
  } catch {
    /* ignore */
  }
}

function fileFor(key: string) {
  const h = createHash('sha1').update(key).digest('hex')
  return join(DIR, h)
}

function hashKey(key: string) {
  return createHash('sha1').update(key).digest('hex')
}

function durableName(key: string) {
  return `dedupe-${hashKey(key)}.json`
}

function purge(now: number, ttlMs: number) {
  for (const [k, t] of mem) {
    if (now - t > ttlMs) mem.delete(k)
  }
}

/**
 * Feishu delivers message events at-least-once; redelivery can mint a new
 * `event_id` for the same `message_id`. Prefer message_id for im.message.*
 * (cardToken present → card action path; keep composite card: key).
 */
export function dedupeKey(
  header: Record<string, unknown>,
  messageId?: string,
  cardToken?: string,
) {
  const mid = (messageId || '').trim()
  if (mid && !cardToken) return `msg:${mid}`
  if (cardToken) return `card:${cardToken}`
  const eventId = String(header.event_id || '').trim()
  if (eventId) return `evt:${eventId}`
  if (mid) return `msg:${mid}`
  return ''
}

/**
 * Returns true if this key is newly claimed (caller should process).
 * Returns false if already seen within TTL (caller must skip / ack only).
 */
export function claimOnce(key: string, ttlMs = DEFAULT_TTL_MS): boolean {
  if (!key) return true
  const now = Date.now()
  purge(now, ttlMs)

  const prev = mem.get(key)
  if (prev && now - prev < ttlMs) return false

  ensure()
  const path = fileFor(key)
  try {
    writeFileSync(path, String(now), { flag: 'wx' })
    mem.set(key, now)
    return true
  } catch {
    try {
      const raw = readFileSync(path, 'utf8')
      const t = Number(raw) || 0
      if (now - t < ttlMs) {
        mem.set(key, t)
        return false
      }
      // expired — reclaim
      writeFileSync(path, String(now))
      mem.set(key, now)
      return true
    } catch {
      mem.set(key, now)
      return true
    }
  }
}

/**
 * Cross-instance claim: local first, then Blob exclusive create.
 * Falls back to local-only when Blob token is missing.
 */
export async function claimOnceDurable(
  key: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<boolean> {
  if (!key) return true
  if (!claimOnce(key, ttlMs)) return false

  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim()
  if (!token) return true

  const name = durableName(key)
  const now = Date.now()
  try {
    const existing = await readDurableJson<{ at: number; key: string }>(name)
    if (existing?.at && now - existing.at < ttlMs) {
      mem.set(key, existing.at)
      return false
    }
  } catch {
    /* try exclusive put */
  }

  const body = JSON.stringify({ at: now, key })
  try {
    await put(`ve-lark-durable/${name}`, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json',
      token,
    })
    writeTmpJson(name, { at: now, key })
    return true
  } catch {
    // Exclusive create failed → usually another instance already claimed.
    try {
      const again = await readDurableJson<{ at: number; key: string }>(name)
      if (again?.at && now - again.at < ttlMs) {
        mem.set(key, again.at)
        return false
      }
    } catch {
      /* ignore */
    }
    // Blob exclusive create unsupported / flaky — keep local claim so we still process once.
    try {
      await put(`ve-lark-durable/${name}`, body, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        token,
      })
      writeTmpJson(name, { at: now, key })
    } catch {
      /* keep local claim */
    }
    return true
  }
}

/** Test helper */
export function releaseClaim(key: string) {
  mem.delete(key)
  try {
    unlinkSync(fileFor(key))
  } catch {
    /* ignore */
  }
}

/**
 * Strict claim for cron / fan-out pushes (daily / weekly / osc).
 * Unlike `claimOnceDurable`, exclusive-create failure means **another
 * instance already claimed** — we never overwrite-and-proceed, so two
 * concurrent cron-tick / Vercel cron invocations cannot both send.
 */
export async function claimPushOnce(
  key: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<boolean> {
  if (!key) return true
  if (!claimOnce(key, ttlMs)) return false

  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim()
  if (!token) return true

  const name = durableName(key)
  const now = Date.now()
  try {
    const existing = await readDurableJson<{ at: number; key: string }>(name)
    if (existing?.at && now - existing.at < ttlMs) {
      mem.set(key, existing.at)
      return false
    }
  } catch {
    /* try exclusive put */
  }

  const body = JSON.stringify({ at: now, key })
  try {
    await put(`ve-lark-durable/${name}`, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json',
      token,
    })
    writeTmpJson(name, { at: now, key })
    return true
  } catch {
    // Exclusive create failed: either another instance claimed, or Blob is down.
    try {
      const again = await readDurableJson<{ at: number; key: string }>(name)
      if (again?.at && now - again.at < ttlMs) {
        mem.set(key, again.at)
        releaseClaim(key)
        return false
      }
    } catch {
      /* ignore */
    }
    // Blob auth/network flaky — keep the local claim so a single instance still
    // sends once. Cross-instance safety needs a working Blob token.
    writeTmpJson(name, { at: now, key })
    return true
  }
}

/** Release a push claim so a failed send can be retried by the next tick. */
export async function releasePushClaim(key: string): Promise<void> {
  releaseClaim(key)
  const name = durableName(key)
  // Always clear local tmp so the next claimOnce/claimPushOnce can proceed
  // even when Blob put is denied / offline.
  writeTmpJson(name, { at: 0, key, released: true })
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim()
  if (!token) return
  const body = JSON.stringify({ at: 0, key, released: true })
  try {
    await put(`ve-lark-durable/${name}`, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      token,
    })
  } catch {
    /* best-effort */
  }
}
