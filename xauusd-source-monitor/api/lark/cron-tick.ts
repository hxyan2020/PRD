/**
 * GET/POST /api/lark/cron-tick
 * Single entry cron that fans out to all Lark push jobs on the *public*
 * production alias (never the SSO-protected deployment host).
 *
 * Schedule: every 5 minutes. Handlers stay idempotent.
 * Fan-out is parallel so a slow child (e.g. oscillation OKX fetch) cannot
 * starve cron-health / market-report at the end of a sequential list.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { touchCronHeartbeat } from './_lib/cronHeartbeat.js'

export const config = {
  maxDuration: 120,
}

const PUBLIC_BASE = 'https://vex-llm-proxy.vercel.app'

/**
 * All Lark push jobs — each handler is idempotent / self-gated.
 * cron-health is first so half-hour status DMs still fire when other
 * children are slow or time out.
 */
const PATHS = [
  '/api/lark/cron-health',
  '/api/lark/alert-nudge',
  '/api/lark/oscillation-alert',
  '/api/lark/market-report',
  '/api/lark/weekly-demo',
  '/api/lark/daily-market-report',
  '/api/lark/weekly-report',
] as const

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

async function hitPath(path: string): Promise<{ path: string; status: number; body: string }> {
  try {
    const r = await fetch(`${PUBLIC_BASE}${path}`, {
      method: 'GET',
      headers: {
        'x-vercel-cron': '1',
        'user-agent': 'vex-lark-cron-tick/2',
        'cache-control': 'no-store',
      },
      cache: 'no-store',
    })
    const body = (await r.text()).slice(0, 240)
    const { outcome, reason } = parseOutcome(body)
    await touchCronHeartbeat(path, {
      status: r.status,
      outcome: r.status >= 500 ? 'error' : outcome,
      reason,
    })
    return { path, status: r.status, body }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch failed'
    await touchCronHeartbeat(path, { status: 0, outcome: 'error', reason: msg })
    return { path, status: 0, body: msg }
  }
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
    await touchCronHeartbeat('/api/lark/cron-tick', { outcome: 'ok' })
  }

  if (dry) {
    return res.status(200).json({
      ok: true,
      dry: true,
      paths: PATHS,
      base: PUBLIC_BASE,
      schedule: 'Every 5 min → parallel fan-out on public alias (cron-health first)',
      parallel: true,
    })
  }

  // Fire all children in parallel — wall clock ≈ slowest child, not sum.
  const settled = await Promise.all(PATHS.map((path) => hitPath(path)))
  const results = [...settled]

  const ok = results.every((r) => r.status === 200 || r.status === 502)
  await touchCronHeartbeat('/api/lark/cron-tick', {
    status: ok ? 200 : 502,
    outcome: ok ? 'ok' : 'error',
    reason: ok ? 'fanout_ok_parallel' : 'fanout_partial_fail',
  })
  return res.status(ok ? 200 : 502).json({
    ok,
    via: 'cron-tick',
    parallel: true,
    results,
  })
}
