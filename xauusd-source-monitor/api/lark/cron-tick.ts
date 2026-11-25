/**
 * GET/POST /api/lark/cron-tick
 * Single entry cron that fans out to all Lark push jobs on the *public*
 * production alias (never the SSO-protected deployment host).
 *
 * Schedule: every 5 minutes. Handlers stay idempotent.
 *
 * Stability (permanent — keep every cron from going quiet):
 * 1. cron-health awaited FIRST (cannot be starved by OKX / market).
 * 2. Remaining jobs in parallel with per-child timeout.
 * 3. Any non-200 OR stale beat → force=1 retry (watchdog pass).
 * 4. Overall tick fails closed unless every path ends 200.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { readCronBeatStore, touchCronHeartbeat } from './_lib/cronHeartbeat.js'

export const config = {
  maxDuration: 120,
}

const PUBLIC_BASE = 'https://vex-llm-proxy.vercel.app'
const HEALTH_PATH = '/api/lark/cron-health'
/** Per-child HTTP budget — leave headroom under maxDuration for a retry pass. */
const CHILD_TIMEOUT_MS = 22_000
/** Default: if no beat for this long, force a catch-up hit. */
const DEFAULT_STALE_MS = 12 * 60_000

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

/** Path → max allowed beat age before watchdog force. */
const STALE_MS: Record<string, number> = {
  [HEALTH_PATH]: 22 * 60_000,
  '/api/lark/alert-nudge': 8 * 60_000,
  '/api/lark/oscillation-alert': 18 * 60_000,
  '/api/lark/market-report': 35 * 60_000,
  '/api/lark/weekly-demo': 25 * 60_000,
  '/api/lark/daily-market-report': 25 * 60_000,
  '/api/lark/weekly-report': 25 * 60_000,
}

type HitResult = {
  path: string
  status: number
  body: string
  forced?: boolean
  pass: 'primary' | 'watchdog'
}

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
  opts?: { force?: boolean; pass?: HitResult['pass'] },
): Promise<HitResult> {
  const pass = opts?.pass || 'primary'
  const qs = opts?.force ? '?force=1' : ''
  const url = `${PUBLIC_BASE}${path}${qs}`
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'x-vercel-cron': '1',
        'user-agent': 'vex-lark-cron-tick/4',
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
      reason: opts?.force
        ? `force:${pass}:${reason || outcome}`
        : `${pass}:${reason || outcome}`,
    })
    return { path, status: r.status, body, forced: Boolean(opts?.force), pass }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch failed'
    await touchCronHeartbeat(path, {
      status: 0,
      outcome: 'error',
      reason: `${pass}:${msg}`,
    })
    return { path, status: 0, body: msg, forced: Boolean(opts?.force), pass }
  }
}

async function beatAgeMs(path: string, now = Date.now()): Promise<number> {
  const store = await readCronBeatStore()
  const at = store.beats[path]?.at
  if (!at) return Number.POSITIVE_INFINITY
  return Math.max(0, now - at)
}

function needsWatchdog(path: string, primary: HitResult | undefined, ageMs: number): boolean {
  if (!primary || primary.status !== 200) return true
  const limit = STALE_MS[path] ?? DEFAULT_STALE_MS
  return ageMs >= limit
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
      schedule:
        'Every 5 min → health-first, parallel others, watchdog force on fail/stale',
      healthFirst: true,
      watchdog: true,
      childTimeoutMs: CHILD_TIMEOUT_MS,
      staleMs: STALE_MS,
    })
  }

  const results: HitResult[] = []
  const watchdogForced: string[] = []

  // Phase 1: always finish cron-health before slower siblings.
  const healthPrimary = await hitPath(HEALTH_PATH, { pass: 'primary' })
  results.push(healthPrimary)

  const healthAge = await beatAgeMs(HEALTH_PATH)
  if (needsWatchdog(HEALTH_PATH, healthPrimary, healthAge)) {
    // Health uses force so 35m silence / miss dedupe cannot keep the DM quiet.
    const forced = await hitPath(HEALTH_PATH, { force: true, pass: 'watchdog' })
    results.push(forced)
    watchdogForced.push(HEALTH_PATH)
  }

  // Phase 2: remaining jobs in parallel (bounded per-child timeout).
  const primaryOthers = await Promise.all(
    OTHER_PATHS.map((path) => hitPath(path, { pass: 'primary' })),
  )
  results.push(...primaryOthers)

  // Phase 3: watchdog — retry any path that failed or whose beat is still stale.
  // Non-health retries are idempotent (no force) so a late response after a
  // successful send cannot double-push market / daily / weekly cards.
  const storeAges = await Promise.all(
    OTHER_PATHS.map(async (path) => [path, await beatAgeMs(path)] as const),
  )
  const ageByPath = Object.fromEntries(storeAges)
  const primaryByPath = Object.fromEntries(primaryOthers.map((r) => [r.path, r]))

  const retryTargets = OTHER_PATHS.filter((path) =>
    needsWatchdog(path, primaryByPath[path], ageByPath[path] ?? Number.POSITIVE_INFINITY),
  )

  if (retryTargets.length) {
    const retried = await Promise.all(
      retryTargets.map((path) => hitPath(path, { force: false, pass: 'watchdog' })),
    )
    results.push(...retried)
    watchdogForced.push(...retryTargets)
  }

  // Final status: every PATH must have a successful (200) result in the last attempt.
  const lastByPath = new Map<string, HitResult>()
  for (const r of results) lastByPath.set(r.path, r)
  const finalOk = PATHS.every((p) => lastByPath.get(p)?.status === 200)

  await touchCronHeartbeat('/api/lark/cron-tick', {
    status: finalOk ? 200 : 502,
    outcome: finalOk ? 'ok' : 'error',
    reason: finalOk
      ? watchdogForced.length
        ? `fanout_ok_watchdog:${watchdogForced.length}`
        : 'fanout_ok_health_first'
      : `fanout_partial_fail:${PATHS.filter((p) => lastByPath.get(p)?.status !== 200).join(',')}`,
  })

  return res.status(finalOk ? 200 : 502).json({
    ok: finalOk,
    via: 'cron-tick',
    healthFirst: true,
    watchdog: true,
    watchdogForced,
    healthBeatAgeMs: healthAge,
    results,
  })
}
