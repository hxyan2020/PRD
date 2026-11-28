/**
 * Claim-once guard for Lark webhook retries / duplicate deliveries.
 * Uses in-memory + /tmp exclusive create so warm instances skip repeats.
 */
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

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

function purge(now: number, ttlMs: number) {
  for (const [k, t] of mem) {
    if (now - t > ttlMs) mem.delete(k)
  }
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

/** Test helper */
export function releaseClaim(key: string) {
  mem.delete(key)
  try {
    unlinkSync(fileFor(key))
  } catch {
    /* ignore */
  }
}
