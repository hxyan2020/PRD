/**
 * Group-chat demo: push minute-nudge cards to the alert group (第1次 / 第2次).
 * Usage: npx tsx scripts/demo-nudge-group.ts
 * Optional: DEMO_NUDGE_GAP_MS=5000 (default 8s between pushes for desk demo)
 * Optional: LARK_ALERT_NUDGE_CHAT_ID / LARK_DAILY_MARKET_CHAT_ID for target group
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
    if (!m) continue
    const key = m[1]!
    let val = m[2] || ''
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

async function main() {
  const { resolveAdminOpenId, sendCardToChat, larkConfigured } = await import(
    '../api/lark/_lib/client'
  )
  const {
    ALERT_NUDGE_SILENCE_MS,
    DEFAULT_ALERT_NUDGE_CHAT_ID,
    armAlertNudgeGroupDemo,
    buildAlertNudgeCard,
    loadNudgeState,
    saveNudgeState,
  } = await import('../api/lark/_lib/alertNudge')

  if (!larkConfigured()) {
    console.error('Lark not configured (LARK_APP_ID / LARK_APP_SECRET)')
    process.exit(1)
  }

  const chatId = (
    process.env.LARK_ALERT_NUDGE_CHAT_ID ||
    process.env.LARK_DAILY_MARKET_CHAT_ID ||
    DEFAULT_ALERT_NUDGE_CHAT_ID
  ).trim()
  if (!chatId.startsWith('oc_')) {
    console.error('Group chat id missing (LARK_ALERT_NUDGE_CHAT_ID / LARK_DAILY_MARKET_CHAT_ID)')
    process.exit(1)
  }

  const admin = await resolveAdminOpenId({ preferChatId: chatId })
  if (!admin.openId?.startsWith('ou_')) {
    console.error('LARK_ADMIN_OPEN_ID missing')
    process.exit(1)
  }

  const gap = Math.max(3_000, Number(process.env.DEMO_NUDGE_GAP_MS || '') || 8_000)
  const alertAt = Date.now() - ALERT_NUDGE_SILENCE_MS - 5_000
  let state = await armAlertNudgeGroupDemo({
    chatId,
    openId: admin.openId,
    alertAt,
    alertPreview: 'DEMO · Mark vs Index 48bps（群聊每分钟提醒）',
    message: '【群聊演示】模拟告警后 3 分钟无人响应 — 请点「知道了」停止提醒',
  })
  console.log('armed group demo', {
    chatId: chatId.slice(0, 12) + '…',
    openId: admin.openId.slice(0, 10) + '…',
    source: admin.source,
    alertAt: new Date(alertAt).toISOString(),
    gapMs: gap,
  })

  for (let i = 1; i <= 2; i++) {
    const before = await loadNudgeState()
    if (before?.acked) {
      console.log('already acked — stop demo loop')
      break
    }
    const sendCount = (before?.sendCount || 0) + 1
    const card = buildAlertNudgeCard({
      openId: admin.openId,
      message: state.message,
      sendCount,
      alertAt: state.alertAt,
    })
    const sent = await sendCardToChat(chatId, card)
    state = {
      ...state,
      ...(before || {}),
      delivery: 'group',
      active: true,
      armed: false,
      acked: false,
      sendCount,
      lastSentAt: Date.now(),
      nudgeStartedAt: before?.nudgeStartedAt || Date.now(),
      openId: admin.openId,
      chatId,
    }
    await saveNudgeState(state)
    console.log(`sent #${sendCount}`, { messageId: sent.messageId, delivery: 'group' })
    if (i < 2) {
      console.log(`waiting ${gap}ms before next push…`)
      await new Promise((r) => setTimeout(r, gap))
    }
  }

  console.log('Done. Check the Feishu group — tap 知道了 to stop + see TTR.')
  console.log('Further minute pushes: cron /api/lark/alert-nudge while active && !acked.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
