/**
 * GET/POST /api/lark/cron-tick
 * Single entry cron that fans out to all Lark push jobs on the *public*
 * production alias (never the SSO-protected deployment host).
 *
 * Schedule: every 5 minutes. Handlers stay idempotent.
 *
 * Stability:
 * - cron-health is awaited FIRST (not parallel) so half-hour status DMs
 *   cannot be starved by slow OKX / market children.
 * - If health beat is still stale after the primary hit, force=1 catch-up.
 * - Per-child timeout so one hang cannot burn maxDuration.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { readCronBeatStore, touchCronHeartbeat } from './_lib/cronHeartbeat.js'

export const config = {
  maxDuration: 120,
}

const PUBLIC_BASE = 'https://vex-llm-proxy.vercel.app'
const HEALTH_PATH = '/api/lark/cron-health'
/** If health beat older than this, force a catch-up DM. */
const HEALTH_STALE_MS = 22 * 60_000
/** Per-child HTTP budget — leave headroom under maxDuration. */
const CHILD_TIMEOUT_MS = 25_000

/**
 * Remaining Lark push jobs — each handler is idempotent / self-gated.
 * Health is handled separately (awaited first).
 */
const OTHER_PATHS = [
  '/api/lark/alert-nudge',
  '/api/lark/oscillation-alert',
  '/api/lark/market-report',
  '/api/lark/weekly-demo',
  '/api/lark/daily-market-report',
  '/api/lark/weekly-report',
] as const

export const PATHS = [HEALTH_PATH, ...OTHER_PATHS] as const

function parseOutcome(body: string): {
  outcome: 'sent' | 'skipped' | 'ok' | 'error'
  reason?: string
} {
  try {
    const j = JSON.parse(body) as {
      ok?: boolean
      sent?: boolean
      skipped?: boolean
      raised?: boolean
      reason?: string
      error?: string
    }
    if (j.error || j.ok === false) return { outcome: 'error', reason: j.error || j.reason }
    if (j.sent) return { outcome: 'sent', reason: j.raised ? 'raised' : j.reason }
    if (j.skipped) return { outcome: 'skipped', reason: j.reason }
    return { outcome: 'ok', reason: j.reason }
  } catch {
    return { outcome: 'error', reason: 'non_json' }
  }
}

async function hitPath(
  path: string,
  opts?: { force?: boolean },
): Promise<{ path: string; status: number; body: string; forced?: boolean }> {
  const qs = opts?.force ? '?force=1' : ''
  const url = `${PUBLIC_BASE}${path}${qs}`
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'x-vercel-cron': '1',
        'user-agent': 'vex-lark-cron-tick/3',
        'cache-control': 'no-store',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(CHILD_TIMEOUT_MS),
    })
    const body = (await r.text()).slice(0, 240)
    const { outcome, reason } = parseOutcome(body)
    await touchCronHeartbeat(path, {
      status: r.status,
      outcome: r.status >= 500 ? 'error' : outcome,
      reason: opts?.force ? `force:${reason || outcome}` : reason,
    })
    return { path, status: r.status, body, forced: Boolean(opts?.force) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch failed'
    await touchCronHeartbeat(path, { status: 0, outcome: 'error', reason: msg })
    return { path, status: 0, body: msg, forced: Boolean(opts?.force) }
  }
}

async function healthBeatAgeMs(now = Date.now()): Promise<number> {
  const store = await readCronBeatStore()
  const at = store.beats[HEALTH_PATH]?.at
  if (!at) return Number.POSITIVE_INFINITY
  return Math.max(0, now - at)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCronRouteHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (!allowCronOrDesk(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' })
  }

  const cron = isVercelCron(req)
  const q = req.query || {}
  const dry = String(q.dry || '') === '1'

  if (cron && !dry) {
    await touchCronHeartbeat('/api/lark/cron-tick', { outcome: 'ok', reason: 'tick_start' })
  }

  if (dry) {
    return res.status(200).json({
      ok: true,
      dry: true,
      paths: PATHS,
      base: PUBLIC_BASE,
      schedule: 'Every 5 min → health-first then parallel others on public alias',
      healthFirst: true,
      childTimeoutMs: CHILD_TIMEOUT_MS,
      healthStaleMs: HEALTH_STALE_MS,
    })
  }

  const results: { path: string; status: number; body: string; forced?: boolean }[] = []

  // Phase 1: always finish cron-health before slower siblings.
  const healthPrimary = await hitPath(HEALTH_PATH)
  results.push(healthPrimary)

  // Phase 1b: if health proof is still stale, force a catch-up DM.
  const age = await healthBeatAgeMs()
  let healthForced = false
  if (age >= HEALTH_STALE_MS || healthPrimary.status !== 200) {
    const forced = await hitPath(HEALTH_PATH, { force: true })
    results.push(forced)
    healthForced = true
  }

  // Phase 2: remaining jobs in parallel (bounded per-child timeout).
  const others = await Promise.all(OTHER_PATHS.map((path) => hitPath(path)))
  results.push(...others)

  const ok = results.every((r) => r.status === 200 || r.status === 502)
  await touchCronHeartbeat('/api/lark/cron-tick', {
    status: ok ? 200 : 502,
    outcome: ok ? 'ok' : 'error',
    reason: ok
      ? healthForced
        ? 'fanout_ok_health_forced'
        : 'fanout_ok_health_first'
      : 'fanout_partial_fail',
  })
  return res.status(ok ? 200 : 502).json({
    ok,
    via: 'cron-tick',
    healthFirst: true,
    healthForced,
    healthBeatAgeMs: age,
    results,
  })
}
