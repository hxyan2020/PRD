/**
 * Smoke: Haixiang private console intents + card shape.
 * Run: npx tsx scripts/smoke-haixiang-console.ts
 */
import { classifyIntent } from '../api/lark/_lib/scope.ts'
import { buildAdminConsoleCard } from '../api/lark/_lib/adminConsole.ts'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const opts = {
    inInvestigateSession: false,
    mentionedBot: true,
    chatType: 'p2p' as const,
  }
  const cases: Array<[string, string]> = [
    ['控制台', 'admin_console'],
    ['console', 'admin_console'],
    ['Cron健康', 'cron_health'],
    ['cron health', 'cron_health'],
    ['Token用量', 'token_usage'],
    ['待审批', 'memory_queue'],
    ['审批日志', 'memory_log'],
  ]
  for (const [text, want] of cases) {
    const got = classifyIntent(text, opts)
    assert(got === want, `${text} → ${got} (want ${want})`)
  }

  const card = await buildAdminConsoleCard({
    lang: 'zh-Hans',
    openId: 'ou_smoke_admin',
  })
  const js = JSON.stringify(card)
  assert(js.includes('私有控制台') || js.includes('Haixiang'), 'console title')
  assert(js.includes('admin_console_refresh'), 'refresh button')
  assert(js.includes('早报') || js.includes('Morning'), 'morning sources section')
  assert(js.includes('震荡') || js.includes('Oscillation'), 'osc section')
  assert(js.includes('Cron') || js.includes('cron'), 'cron section')
  assert(js.includes('Token'), 'token section')
  assert(js.includes('审批') || js.includes('Skills'), 'queue section')

  console.log('HAIXIANG_CONSOLE_SMOKE_OK', {
    elements: Array.isArray(card.elements) ? card.elements.length : 0,
    bytes: js.length,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
