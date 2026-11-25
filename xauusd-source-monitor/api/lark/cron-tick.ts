/**
 * GET/POST /api/lark/cron-tick
 * Single entry cron that fans out to all Lark push jobs on the *public*
 * production alias (never the SSO-protected deployment host).
 *
 * Schedule: every 5 minutes. Handlers stay idempotent.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { touchCronHeartbeat } from './_lib/cronHeartbeat.js'

export const config = {
  maxDuration: 60,
}

const PUBLIC_BASE = 'https://vex-llm-proxy.vercel.app'

/**
 * All Lark push jobs — each handler is idempotent / self-gated:
 * - alert-nudge: campaign window + ack
 * - oscillation-alert: trigger / demo slot
 * - market-report: half-hour slot
 * - weekly-demo: 16:00 CST demo day
 * - daily-market-report: ≥09:00 CST + dayKey
 * - weekly-report: Friday CST + weekKey
 */
const PATHS = [
  '/api/lark/alert-nudge',
  '/api/lark/oscillation-alert',
  '/api/lark/market-report',
  '/api/lark/weekly-demo',
  '/api/lark/daily-market-report',
  '/api/lark/weekly-report',
] as const

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
    await touchCronHeartbeat('/api/lark/cron-tick')
  }

  if (dry) {
    return res.status(200).json({
      ok: true,
      dry: true,
      paths: PATHS,
      base: PUBLIC_BASE,
      schedule: 'Every 5 min → fan-out on public alias',
    })
  }

  const results: { path: string; status: number; body: string }[] = []
  for (const path of PATHS) {
    try {
      const r = await fetch(`${PUBLIC_BASE}${path}`, {
        method: 'GET',
        headers: {
          'x-vercel-cron': '1',
          'user-agent': 'vex-lark-cron-tick/1',
          'cache-control': 'no-store',
        },
        cache: 'no-store',
      })
      const body = (await r.text()).slice(0, 240)
      results.push({ path, status: r.status, body })
    } catch (e) {
      results.push({
        path,
        status: 0,
        body: e instanceof Error ? e.message : 'fetch failed',
      })
    }
  }

  const ok = results.every((r) => r.status === 200 || r.status === 502)
  return res.status(ok ? 200 : 502).json({ ok, via: 'cron-tick', results })
}
