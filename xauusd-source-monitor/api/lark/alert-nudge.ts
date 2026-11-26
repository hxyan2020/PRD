/**
 * GET/POST /api/lark/alert-nudge
 * Vercel Cron every minute:
 * - If an alert armed silence and ≥3 min with no human reply → start @Yan nudges
 * - While active && !acked → push every ~1 min (count only on successful send)
 * Manual: GET ?dry=1; POST { force: true } to send immediately.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
  sendCardToOpenId,
} from './_lib/client.js'
import {
  ALERT_NUDGE_MESSAGE,
  ALERT_NUDGE_MIN_GAP_MS,
  ALERT_NUDGE_SILENCE_MS,
  DEFAULT_ALERT_NUDGE_CHAT_ID,
  ackAlertNudgeDurable,
  armAlertNudgeGroupDemo,
  armAlertNudgeP2pDemo,
  buildAlertNudgeCard,
  claimNudgeSendSlot,
  commitNudgeSendSlot,
  loadNudgeState,
  releaseNudgeSendSlot,
  saveNudgeState,
  shanghaiHm,
  shouldNudgeNow,
  type AlertNudgeState,
} from './_lib/alertNudge.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { readCronHeartbeat, touchCronHeartbeat } from './_lib/cronHeartbeat.js'
import { shanghaiDayKey } from './_lib/market.js'

export const config = {
  maxDuration: 30,
}

function resolveChatId(reqChatId?: string): { chatId: string; source: string } {
  const fromReq = (reqChatId || '').trim()
  if (fromReq) return { chatId: fromReq, source: 'request' }
  const fromEnv = (
    process.env.LARK_ALERT_NUDGE_CHAT_ID ||
    process.env.LARK_DAILY_MARKET_CHAT_ID ||
    ''
  ).trim()
  if (fromEnv) return { chatId: fromEnv, source: 'env' }
  return { chatId: DEFAULT_ALERT_NUDGE_CHAT_ID, source: 'default' }
}

async function activateIfSilent(state: AlertNudgeState, now: number): Promise<AlertNudgeState> {
  if (state.acked || state.active) return state
  if (!shouldNudgeNow(state, now)) return state
  const admin = await resolveAdminOpenId({ preferChatId: state.chatId })
  const next: AlertNudgeState = {
    ...state,
    openId: admin.openId || state.openId,
    active: true,
    armed: false,
    message: state.message || ALERT_NUDGE_MESSAGE,
  }
  await saveNudgeState(next)
  return next
}

/** Patch lastCronAt without clobbering a newer send from a concurrent instance. */
async function touchNudgeLastCron(now: number): Promise<void> {
  const st = await loadNudgeState()
  if (!st) return
  await saveNudgeState({ ...st, lastCronAt: now })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCronRouteHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const cron = isVercelCron(req)
  if (!allowCronOrDesk(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' })
  }

  const q = req.query || {}
  const body = (req.body || {}) as {
    force?: boolean
    dry?: boolean
    chatId?: string
    ack?: boolean
    /** Demo: `p2p` / true → DM Yan; `group` → same loop in the alert group. */
    demo?: boolean | string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'
  const ack = body.ack === true || String(q.ack || '') === '1'
  const demoRaw = String(body.demo ?? q.demo ?? '').trim().toLowerCase()
  const demoP2p = demoRaw === '1' || demoRaw === 'true' || demoRaw === 'p2p'
  const demoGroup = demoRaw === 'group'

  const now = Date.now()
  const chat = resolveChatId(body.chatId || String(q.chatId || ''))
  const day = shanghaiDayKey(now)
  const hm = shanghaiHm(now)

  if (ack) {
    const st = await ackAlertNudgeDurable('manual')
    return res.status(200).json({ ok: true, acked: true, state: st })
  }

  if (cron && !dry) {
    await touchCronHeartbeat('/api/lark/alert-nudge')
  }

  let state = await loadNudgeState()

  // Demo: activate immediately (skips 3min silence). p2p → DM Yan; group → chat card.
  // Re-arm is idempotent when already active (keeps sendCount).
  if ((demoP2p || demoGroup) && !dry) {
    const admin = await resolveAdminOpenId({ preferChatId: chat.chatId })
    if (!admin.openId || !admin.openId.startsWith('ou_')) {
      return res.status(400).json({
        ok: false,
        error: 'LARK_ADMIN_OPEN_ID missing — cannot @Yan for nudge demo',
      })
    }
    if (demoGroup) {
      state = await armAlertNudgeGroupDemo({
        chatId: chat.chatId,
        openId: admin.openId,
        alertPreview: 'DEMO · 群聊每分钟提醒',
      })
    } else {
      state = await armAlertNudgeP2pDemo({
        openId: admin.openId,
        alertPreview: 'DEMO · 私聊每分钟提醒',
      })
    }
  }

  if (dry && !force && !demoP2p && !demoGroup) {
    const previewCount = (state?.sendCount || 0) + 1
    const card = buildAlertNudgeCard({
      openId: state?.openId || '',
      message: ALERT_NUDGE_MESSAGE,
      sendCount: previewCount,
      alertAt: state?.alertAt,
    })
    return res.status(200).json({
      ok: true,
      dry: true,
      day,
      hm,
      silenceMs: ALERT_NUDGE_SILENCE_MS,
      minGapMs: ALERT_NUDGE_MIN_GAP_MS,
      chatId: chat.chatId,
      chatSource: chat.source,
      state,
      shouldNudge: state ? shouldNudgeNow(state, now) : false,
      cronHeartbeat: await readCronHeartbeat(),
      card,
      schedule: `After alert + ${Math.round(ALERT_NUDGE_SILENCE_MS / 60_000)}min silence → @Yan every ~1min until 知道了`,
    })
  }

  if (!state || state.acked) {
    if (cron && !dry) await touchNudgeLastCron(now)
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: !state ? 'no_state' : 'acked',
      state,
      day,
      hm,
    })
  }

  // Force: activate immediately even if silence not elapsed.
  if (force && !state.active && !state.acked) {
    const admin = await resolveAdminOpenId({ preferChatId: state.chatId || chat.chatId })
    state = {
      ...state,
      chatId: state.chatId || chat.chatId,
      openId: admin.openId || state.openId,
      active: true,
      armed: false,
      alertAt: state.alertAt || now,
    }
    await saveNudgeState(state)
  } else {
    state = await activateIfSilent(state, now)
  }

  if (state.acked || !state.active) {
    if (cron && !dry) await touchNudgeLastCron(now)
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: state.acked
        ? 'acked'
        : state.armed
          ? 'waiting_silence'
          : state.humanRespondedAt
            ? 'human_responded'
            : 'inactive',
      silenceMs: ALERT_NUDGE_SILENCE_MS,
      waitLeftMs:
        state.armed && state.alertAt
          ? Math.max(0, ALERT_NUDGE_SILENCE_MS - (now - state.alertAt))
          : 0,
      state,
    })
  }

  if (!larkConfigured()) {
    if (cron && !dry) await touchNudgeLastCron(now)
    return res.status(503).json({ ok: false, error: 'Lark not configured' })
  }

  // Claim slot BEFORE Lark send so concurrent cron/demo cannot emit the same 序号.
  const claim = await claimNudgeSendSlot({ force, now })
  if (!claim.ok) {
    if (cron && !dry) await touchNudgeLastCron(now)
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: claim.reason,
      state: claim.state,
    })
  }

  const admin = await resolveAdminOpenId({
    preferChatId: claim.state.chatId || chat.chatId,
  })
  const openId = admin.openId || claim.state.openId
  const delivery = claim.state.delivery === 'p2p' ? 'p2p' : 'group'
  const card = buildAlertNudgeCard({
    openId,
    message: claim.state.message || ALERT_NUDGE_MESSAGE,
    sendCount: claim.sendCount,
    alertAt: claim.state.alertAt,
  })

  try {
    const sent =
      delivery === 'p2p'
        ? await sendCardToOpenId(openId, card)
        : await sendCardToChat(claim.state.chatId || chat.chatId, card)
    const next = await commitNudgeSendSlot({
      sendCount: claim.sendCount,
      openId,
      chatId: delivery === 'p2p' ? openId : claim.state.chatId || chat.chatId,
      delivery,
      lastSentAt: now,
    })
    if (cron && next) {
      await saveNudgeState({ ...next, lastCronAt: now })
    }
    return res.status(200).json({
      ok: true,
      sent: true,
      delivery,
      demo: demoGroup ? 'group' : demoP2p ? 'p2p' : undefined,
      messageId: sent.messageId,
      state: next,
      day,
      hm,
    })
  } catch (e) {
    await releaseNudgeSendSlot(claim.priorLastSentAt)
    if (cron && !dry) await touchNudgeLastCron(now)
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      state: await loadNudgeState(),
    })
  }
}
