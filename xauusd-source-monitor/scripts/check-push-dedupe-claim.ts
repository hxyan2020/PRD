import {
  claimPushOnce,
  releasePushClaim,
  claimOnce,
  releaseClaim,
} from '../api/lark/_lib/dedupe.ts'
import { readFileSync } from 'node:fs'

async function main() {
  const key = `check_push_${Date.now()}`
  const a = await claimPushOnce(key, 30_000)
  const b = await claimPushOnce(key, 30_000)
  console.log('claim', a, b)
  await releasePushClaim(key)
  const c = await claimPushOnce(key, 30_000)
  console.log('after_release', c)
  await releasePushClaim(key)

  // Strict: claimOnceDurable-style overwrite must NOT exist in claimPushOnce source
  const src = readFileSync(new URL('../api/lark/_lib/dedupe.ts', import.meta.url), 'utf8')
  const pushFn = src.slice(src.indexOf('export async function claimPushOnce'), src.indexOf('export async function releasePushClaim'))
  const noOverwrite = !/allowOverwrite:\s*true/.test(pushFn)
  console.log('push_fn_no_overwrite', noOverwrite)

  const daily = readFileSync(new URL('../api/lark/daily-market-report.ts', import.meta.url), 'utf8')
  const weekly = readFileSync(new URL('../api/lark/weekly-report.ts', import.meta.url), 'utf8')
  const osc = readFileSync(new URL('../api/lark/oscillation-alert.ts', import.meta.url), 'utf8')
  const market = readFileSync(new URL('../api/lark/market-report.ts', import.meta.url), 'utf8')

  const wired =
    daily.includes('claimPushOnce') &&
    daily.includes('push:daily-market:') &&
    weekly.includes('claimPushOnce') &&
    !/sent\[report\.window\.weekKey\]\s*&&\s*cron/.test(weekly) &&
    osc.includes('push:osc:') &&
    market.includes('push:market-halfhour:')

  console.log('wired', wired)

  // local claimOnce still works
  const lk = `local_${Date.now()}`
  console.log('local', claimOnce(lk), claimOnce(lk) === false)
  releaseClaim(lk)

  if (!(a && !b && c && noOverwrite && wired)) {
    console.error('FAIL')
    process.exit(1)
  }
  console.log('PASS')
}
main()
