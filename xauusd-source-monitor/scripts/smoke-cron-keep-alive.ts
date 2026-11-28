/**
 * Smoke: cron schedule order + stale nudge expire + health lastTs max.
 * Run: npx tsx scripts/smoke-cron-keep-alive.ts
 */
import { readFileSync } from 'node:fs'
import {
  ALERT_NUDGE_STALE_MS,
  expireStaleNudgeDurable,
  saveNudgeState,
  type AlertNudgeState,
} from '../api/lark/_lib/alertNudge.ts'
import { shanghaiDayKey } from '../api/lark/_lib/market.ts'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const vercel = JSON.parse(
    readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
  ) as { crons: { path: string; schedule: string }[] }
  const paths = vercel.crons.map((c) => c.path)
  assert(paths[0] === '/api/lark/cron-tick', 'cron-tick must be first in vercel.json')
  assert(paths.includes('/api/lark/cron-health'), 'cron-health scheduled')
  assert(paths.includes('/api/lark/oscillation-alert'), 'oscillation scheduled')
  assert(paths.includes('/api/lark/daily-market-report'), 'daily scheduled')
  assert(paths.includes('/api/lark/weekly-report'), 'weekly scheduled')
  assert(paths.includes('/api/lark/token-usage-report'), 'token scheduled')
  assert(paths.includes('/api/lark/alert-nudge'), 'nudge scheduled')
  assert(
    vercel.crons.filter((c) => c.path.includes('daily-market')).length >= 3,
    'daily needs 09:00 + catch-up slots',
  )

  const tickSrc = readFileSync(new URL('../api/lark/cron-tick.ts', import.meta.url), 'utf8')
  assert(tickSrc.includes('PATHS'), 'cron-tick fan-out present')
  assert(tickSrc.includes('/api/lark/cron-health'), 'health in fan-out')
  assert(tickSrc.includes('tick_start_manual'), 'manual heartbeat path')

  const tokenSrc = readFileSync(
    new URL('../api/lark/token-usage-report.ts', import.meta.url),
    'utf8',
  )
  assert(tokenSrc.includes('claimPushOnce'), 'token usage claim-before-send')

  const healthSrc = readFileSync(
    new URL('../api/lark/_lib/cronHealth.ts', import.meta.url),
    'utf8',
  )
  assert(
    /Math\.max\(\s*nudge\?\.lastCronAt/.test(healthSrc),
    'health uses max lastTs',
  )
  assert(healthSrc.includes('expireStaleNudgeDurable'), 'health expires stale nudge')

  // Stale-by-day expire
  const yesterday = shanghaiDayKey(Date.now() - 36 * 3600_000)
  const stuck: AlertNudgeState = {
    dayKey: yesterday,
    chatId: 'oc_smoke',
    openId: 'ou_smoke',
    message: 'stuck',
    delivery: 'group',
    armed: false,
    active: true,
    acked: false,
    alertAt: Date.now() - 30 * 3600_000,
    lastCronAt: Date.now() - 3 * 3600_000,
    lastSentAt: Date.now() - 3 * 3600_000,
    sendCount: 5,
  }
  await saveNudgeState(stuck)
  const exp = await expireStaleNudgeDurable(Date.now())
  assert(exp.expired && exp.state?.acked === true, 'stale day nudge must expire')
  assert(ALERT_NUDGE_STALE_MS >= 60 * 60_000, 'stale window >= 1h')

  console.log('CRON_KEEP_ALIVE_SMOKE_OK', {
    cronCount: vercel.crons.length,
    first: paths[0],
    staleMs: ALERT_NUDGE_STALE_MS,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
