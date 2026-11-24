/**
 * GET/POST /api/lark/alert-nudge
 * - Vercel Cron at 08:30 Asia/Shanghai (`30 0 * * *` UTC): on campaign day only,
 *   send one @mention card to the group — no repeats.
 * - Manual: GET ?dry=1 preview; POST { force: true } send now.
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
  ackAlertNudge,
  alreadySentToday,
  buildAlertNudgeCard,
  isCampaignDay,
  isNudgeSendSlot,
  readNudgeState,
  shanghaiHm,
  writeNudgeState,
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
    const st = ackAlertNudge('manual')
    return res.status(200).json({ ok: true, acked: true, state: st })
  }

  if (!force && !cron) {
    const state = readNudgeState()
    const admin = state?.openId
      ? { openId: state.openId }
      : await resolveAdminOpenId().catch(() => ({ openId: '' }))
    const card = buildAlertNudgeCard({
      openId: admin.openId || '',
      message: ALERT_NUDGE_MESSAGE,
    })
    return res.status(200).json({
      ok: true,
      dry: true,
      day,
      hm,
      campaignDay: ALERT_NUDGE_DAY,
      startHm: ALERT_NUDGE_START_HM,
      isCampaignDay: isCampaignDay(now),
      isSendSlot: isNudgeSendSlot(now),
      alreadySent: alreadySentToday(),
      chatId: chat.chatId,
      chatSource: chat.source,
      state,
      card,
      schedule: `Once on ${ALERT_NUDGE_DAY} ${ALERT_NUDGE_START_HM} Asia/Shanghai (cron: 30 0 * * * UTC)`,
    })
  }

  // Cron: only the campaign day + 08:30 slot
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
    if (!isNudgeSendSlot(now)) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'not_0830_slot',
        day,
        hm,
      })
    }
    if (alreadySentToday()) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'already_sent',
        state: readNudgeState(),
      })
    }
  }

  if (!force && alreadySentToday()) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent',
      state: readNudgeState(),
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({ ok: false, error: 'Lark not configured' })
  }

  const admin = await resolveAdminOpenId()
  const card = buildAlertNudgeCard({
    openId: admin.openId,
    message: ALERT_NUDGE_MESSAGE,
  })

  try {
    const sent = await sendCardToChat(chat.chatId, card)
    const next: AlertNudgeState = {
      dayKey: ALERT_NUDGE_DAY,
      chatId: chat.chatId,
      openId: admin.openId,
      message: ALERT_NUDGE_MESSAGE,
      sent: true,
      sentAt: Date.now(),
      acked: false,
      sendCount: 1,
    }
    writeNudgeState(next)
    return res.status(200).json({
      ok: true,
      sent: true,
      messageId: sent.messageId,
      state: next,
      day,
      hm,
      openIdSource: admin.source,
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
    })
  }
}
