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
} from './_lib/client.js'
import {
  ALERT_NUDGE_MESSAGE,
  ALERT_NUDGE_MIN_GAP_MS,
  ALERT_NUDGE_SILENCE_MS,
  DEFAULT_ALERT_NUDGE_CHAT_ID,
  ackAlertNudgeDurable,
  buildAlertNudgeCard,
  loadNudgeState,
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
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'
  const ack = body.ack === true || String(q.ack || '') === '1'

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
    const st = await loadNudgeState()
    if (st) {
      await saveNudgeState({ ...st, lastCronAt: now })
    }
  }

  let state = await loadNudgeState()

  if (dry && !force) {
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

  if (!force && state.lastSentAt && now - state.lastSentAt < ALERT_NUDGE_MIN_GAP_MS) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'throttle',
      state,
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({ ok: false, error: 'Lark not configured' })
  }

  // Resolve Yan open_id right before send so @mention is real.
  const admin = await resolveAdminOpenId({ preferChatId: state.chatId || chat.chatId })
  const openId = admin.openId || state.openId
  const sendCount = (state.sendCount || 0) + 1
  const card = buildAlertNudgeCard({
    openId,
    message: state.message || ALERT_NUDGE_MESSAGE,
    sendCount,
    alertAt: state.alertAt,
  })

  try {
    const sent = await sendCardToChat(state.chatId || chat.chatId, card)
    const next: AlertNudgeState = {
      ...state,
      chatId: state.chatId || chat.chatId,
      openId,
      sendCount,
      lastSentAt: Date.now(),
      nudgeStartedAt: state.nudgeStartedAt || Date.now(),
      active: true,
      armed: false,
    }
    await saveNudgeState(next)
    return res.status(200).json({
      ok: true,
      sent: true,
      messageId: sent.messageId,
      state: next,
      day,
      hm,
    })
  } catch (e) {
    // Do NOT increment sendCount on failure — count stays accurate.
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      state,
    })
  }
}
