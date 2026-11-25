/**
 * GET/POST /api/lark/alert-nudge
 * - Vercel Cron every minute: on campaign day (default 2026-11-25) after 08:30 CST,
 *   @mention in group every ~60s until「知道了」(or 18:00 CST safety stop).
 * - Other days: no-op. Manual: GET ?dry=1; POST { force: true }.
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
} from './_lib/client.js'
import {
  ALERT_NUDGE_DAY,
  ALERT_NUDGE_MESSAGE,
  ALERT_NUDGE_START_HM,
  DEFAULT_ALERT_NUDGE_CHAT_ID,
  ackAlertNudgeDurable,
  buildAlertNudgeCard,
  isCampaignDay,
  loadNudgeState,
  nudgeWindowExpired,
  nudgeWindowOpen,
  saveNudgeState,
  shanghaiHm,
  type AlertNudgeState,
} from './_lib/alertNudge.js'
import { shanghaiDayKey } from './_lib/market.js'

export const config = {
  maxDuration: 30,
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function authorize(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || ''
  const auth = String(req.headers.authorization || '')
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return true
  const provided = String(req.headers['x-desk-token'] || '')
  return safeEqual(expected, provided)
}

function isVercelCron(req: VercelRequest): boolean {
  return String(req.headers['x-vercel-cron'] || '') === '1'
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

async function ensureActiveState(args: {
  chatId: string
  force: boolean
  now: number
}): Promise<AlertNudgeState | null> {
  let state = await loadNudgeState()

  if (state?.acked && state.dayKey === ALERT_NUDGE_DAY && !args.force) return state

  if (args.force || (nudgeWindowOpen(args.now) && !nudgeWindowExpired(args.now))) {
    const admin = await resolveAdminOpenId()
    if (!state || state.dayKey !== ALERT_NUDGE_DAY) {
      // New campaign day — start count at 0
      state = {
        dayKey: ALERT_NUDGE_DAY,
        chatId: args.chatId,
        openId: admin.openId || state?.openId || '',
        message: ALERT_NUDGE_MESSAGE,
        active: true,
        acked: false,
        startedAt: Date.now(),
        sendCount: 0,
      }
      await saveNudgeState(state)
    } else {
      // Same day: never reset sendCount; never clear acked via force
      state = {
        ...state,
        chatId: args.chatId || state.chatId,
        openId: admin.openId || state.openId,
        message: state.message || ALERT_NUDGE_MESSAGE,
        active: !state.acked,
        startedAt: state.startedAt || Date.now(),
      }
      await saveNudgeState(state)
    }
  }
  return state
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const cron = isVercelCron(req)
  if (!cron && !authorize(req)) return res.status(401).json({ error: 'Unauthorized' })

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

  if (!force && !cron) {
    const state = await loadNudgeState()
    const card = buildAlertNudgeCard({
      openId: state?.openId || '',
      message: ALERT_NUDGE_MESSAGE,
      sendCount: (state?.sendCount || 0) + 1,
    })
    return res.status(200).json({
      ok: true,
      dry: true,
      day,
      hm,
      campaignDay: ALERT_NUDGE_DAY,
      startHm: ALERT_NUDGE_START_HM,
      isCampaignDay: isCampaignDay(now),
      windowOpen: nudgeWindowOpen(now),
      windowExpired: nudgeWindowExpired(now),
      chatId: chat.chatId,
      chatSource: chat.source,
      state,
      card,
      schedule: `Every minute on ${ALERT_NUDGE_DAY} from ${ALERT_NUDGE_START_HM} until 知道了 (or 18:00)`,
    })
  }

  if (cron && !force) {
    if (!isCampaignDay(now)) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'not_campaign_day',
        day,
        hm,
        campaignDay: ALERT_NUDGE_DAY,
      })
    }
    if (!nudgeWindowOpen(now) || nudgeWindowExpired(now)) {
      const st = await loadNudgeState()
      if (st?.active && nudgeWindowExpired(now)) {
        await saveNudgeState({ ...st, active: false })
      }
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: nudgeWindowExpired(now) ? 'expired' : 'before_start',
        day,
        hm,
      })
    }
  }

  const state = await ensureActiveState({ chatId: chat.chatId, force, now })
  if (!state) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'no_state', day, hm })
  }

  if (state.acked || !state.active) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: state.acked ? 'acked' : 'inactive',
      state,
    })
  }

  if (!force && state.lastSentAt && now - state.lastSentAt < 55_000) {
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

  const sendCount = (state.sendCount || 0) + 1
  const card = buildAlertNudgeCard({
    openId: state.openId,
    message: state.message || ALERT_NUDGE_MESSAGE,
    sendCount,
  })

  try {
    const sent = await sendCardToChat(state.chatId || chat.chatId, card)
    const next: AlertNudgeState = {
      ...state,
      chatId: state.chatId || chat.chatId,
      sendCount,
      lastSentAt: Date.now(),
      startedAt: state.startedAt || Date.now(),
      active: true,
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
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      state,
    })
  }
}
