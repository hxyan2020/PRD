/**
 * Smoke: failed crons listed under「未按计划」must not repeat in「明细」.
 * Run: npx tsx scripts/smoke-cron-health-dedupe.ts
 */
import { buildCronHealthReport } from '../api/lark/_lib/cronHealth.ts'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const report = await buildCronHealthReport({ now: Date.now() })
  const md = report.markdown
  assert(md.includes('**明细：**'), 'missing 明细 section')
  const detailIdx = md.indexOf('**明细：**')
  const above = md.slice(0, detailIdx)
  const below = md.slice(detailIdx)

  if (report.misses.length === 0) {
    assert(!/失败项见上方/.test(below), 'no-miss report should not show dedupe note')
    console.log('no misses — OK (all healthy or none expected)')
  } else {
    assert(above.includes('**未按计划：**'), 'misses must appear under 未按计划')
    for (const m of report.misses) {
      assert(above.includes(`**${m.label}**`), `missing above: ${m.label}`)
      assert(!below.includes(`**${m.label}**`), `repeated in 明细: ${m.label}`)
    }
    assert(/失败项见上方/.test(below), 'dedupe note missing in 明细')
  }

  // Synthetic check of formatter contract via source
  const src = await (await import('node:fs/promises')).readFile(
    new URL('../api/lark/_lib/cronHealth.ts', import.meta.url),
    'utf8',
  )
  assert(src.includes('missIds.has(j.id)'), 'formatter must skip miss ids in 明细')
  assert(src.includes('失败项见上方'), 'formatter must note failures are above')

  console.log('CRON_HEALTH_DEDUPE_SMOKE_OK', {
    allOk: report.allOk,
    misses: report.misses.map((m) => m.id),
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
