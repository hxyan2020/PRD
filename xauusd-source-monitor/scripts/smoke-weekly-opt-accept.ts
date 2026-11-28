/**
 * Local smoke: weekly opt tick buttons + durable accept log.
 * Run: npx tsx scripts/smoke-weekly-opt-accept.ts
 */
import {
  buildWeeklyReport,
  weeklyReportCard,
  virtualWeeklyIncidents,
} from '../api/lark/_lib/weeklyReport.ts'
import {
  acceptWeeklyOpt,
  acceptedRecIdsForWeek,
  listAcceptedWeeklyOpts,
} from '../api/lark/_lib/weeklyOptAccept.ts'
import { classifyIntent } from '../api/lark/_lib/scope.ts'

async function main() {
  const opts = {
    inInvestigateSession: false,
    mentionedBot: true,
    chatType: 'p2p' as const,
  }
  for (const t of ['采纳日志', 'accepted opts', '週報採納', '周报']) {
    console.log('intent', t, '→', classifyIntent(t, opts))
  }

  const report = buildWeeklyReport(
    virtualWeeklyIncidents(),
    Date.now(),
    'zh-Hans',
    'ou_test',
  )
  console.log(
    'recs',
    report.recommendationItems.length,
    report.recommendationItems[0]?.text?.slice(0, 40),
  )
  const card = weeklyReportCard(report, { lang: 'zh-Hans' })
  const js = JSON.stringify(card)
  console.log(
    'has_accept_btn',
    js.includes('weekly_opt_accept'),
    'btn_count',
    (js.match(/weekly_opt_accept/g) || []).length,
  )

  const item = report.recommendationItems[0]
  if (!item) throw new Error('no recommendation items')
  const a1 = await acceptWeeklyOpt({
    weekKey: report.window.weekKey,
    text: item.text,
    recId: item.id,
    acceptedBy: 'ou_a',
    acceptedByName: 'A',
  })
  const a2 = await acceptWeeklyOpt({
    weekKey: report.window.weekKey,
    text: item.text,
    recId: item.id,
    acceptedBy: 'ou_a',
  })
  const ids = await acceptedRecIdsForWeek(report.window.weekKey)
  const list = await listAcceptedWeeklyOpts({ weekKey: report.window.weekKey })
  const ok = a1.ok && !a1.already && a2.already && ids.has(item.id) && list.length >= 1
  console.log({
    ok,
    already: a2.already,
    ids: [...ids],
    listN: list.length,
    entryId: a1.entry.id,
  })
  if (!ok) process.exit(1)
  console.log('WEEKLY_OPT_ACCEPT_SMOKE_OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
