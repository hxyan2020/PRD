/**
 * GET/POST /api/lark/cron-health
 * - Every 30 minutes → DM Yan Haixiang a cron/bot health card.
 * - If any scheduled push is missing, card is red and @mentions Yan.
 * - Also reachable via cron-tick (half-hour slot dedupe).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
  sendCardToOpenId,
} from './_lib/client.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { touchCronHeartbeat } from './_lib/cronHeartbeat.js'
import { buildCronHealthReport } from './_lib/cronHealth.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import { shanghaiHalfHourKey } from './_lib/market.js'

export const config = {
  maxDuration: 60,
}

const SENT_NAME = 'cron-health-sent.json'
/** Same DM chat as half-hour market when set. */
const DEFAULT_HEALTH_CHAT_ID = 'oc_430fae67dd06b70f65b726b1673ef40e'

function resolveChatId(req?: string): { chatId: string; source: string } {
  const fromReq = (req || '').trim()
  if (fromReq) return { chatId: fromReq, source: 'request' }
  const fromEnv = (
    process.env.LARK_CRON_HEALTH_CHAT_ID ||
    process.env.LARK_MARKET_CHAT_ID ||
    process.env.LARK_ADMIN_CHAT_ID ||
    ''
  ).trim()
  if (fromEnv) return { chatId: fromEnv, source: 'env' }
  return { chatId: DEFAULT_HEALTH_CHAT_ID, source: 'default' }
}

async function readSent(): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(SENT_NAME)) || {}
}

async function markSent(slotKey: string) {
  const map = await readSent()
  const cutoff = Date.now() - 48 * 3600_000
  for (const [k, ts] of Object.entries(map)) {
    if (typeof ts === 'number' && ts < cutoff) delete map[k]
  }
  map[slotKey] = Date.now()
  await writeDurableJson(SENT_NAME, map)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCronRouteHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (!allowCronOrDesk(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' })
  }

  const cron = isVercelCron(req)
  const q = req.query || {}
  const body = (req.body || {}) as {
    force?: boolean
    dry?: boolean
    chatId?: string
    openId?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const slotKey = shanghaiHalfHourKey(now)
  const chat = resolveChatId(body.chatId || String(q.chatId || ''))
  const admin = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId()

  if (cron && !dry) {
    await touchCronHeartbeat('/api/lark/cron-health')
  }

  const report = await buildCronHealthReport({
    now,
    adminOpenId: admin.openId,
  })

  if (dry && !force) {
    return res.status(200).json({
      ok: true,
      dry: true,
      slotKey,
      allOk: report.allOk,
      misses: report.misses.map((m) => m.id),
      jobs: report.jobs,
      markdown: report.markdown,
      card: report.card,
      schedule: 'Every 30 minutes → Yan Haixiang (raise on miss)',
      chatId: chat.chatId,
      chatSource: chat.source,
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Lark not configured',
      slotKey,
      allOk: report.allOk,
      misses: report.misses.map((m) => m.id),
    })
  }

  const sent = await readSent()
  // Healthy reports: once per half-hour slot. Miss alerts: always push (force or new miss).
  const missKey = `miss:${slotKey}:${report.misses
    .map((m) => m.id)
    .sort()
    .join('+')}`
  if (!force && report.allOk && sent[slotKey]) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_healthy_slot',
      slotKey,
      allOk: true,
      via: cron ? 'cron' : 'manual',
    })
  }
  if (!force && !report.allOk && sent[missKey]) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_raised_this_miss_set',
      slotKey,
      misses: report.misses.map((m) => m.id),
      via: cron ? 'cron' : 'manual',
    })
  }

  try {
    await sendCardToChat(chat.chatId, report.card)
    // Healthy: once per slot. Miss raise: dedupe by miss-set key (allow green recovery later).
    if (report.allOk) await markSent(slotKey)
    else await markSent(missKey)
    await touchCronHeartbeat('/api/lark/cron-health', {
      status: 200,
      outcome: report.allOk ? 'ok' : 'sent',
      reason: report.allOk ? 'healthy' : `miss:${report.misses.map((m) => m.id).join(',')}`,
    })
    return res.status(200).json({
      ok: true,
      sent: true,
      raised: !report.allOk,
      slotKey,
      allOk: report.allOk,
      misses: report.misses.map((m) => m.id),
      via: 'chat_id',
      recipientChatId: chat.chatId.slice(0, 10) + '…',
    })
  } catch (chatErr) {
    if (!admin.openId) {
      return res.status(502).json({
        ok: false,
        error: chatErr instanceof Error ? chatErr.message : 'send failed',
        slotKey,
        allOk: report.allOk,
      })
    }
    try {
      await sendCardToOpenId(admin.openId, report.card)
      if (report.allOk) await markSent(slotKey)
      else await markSent(missKey)
      return res.status(200).json({
        ok: true,
        sent: true,
        raised: !report.allOk,
        slotKey,
        allOk: report.allOk,
        misses: report.misses.map((m) => m.id),
        via: 'open_id_fallback',
      })
    } catch (e) {
      return res.status(502).json({
        ok: false,
        error: e instanceof Error ? e.message : 'send failed',
        slotKey,
        allOk: report.allOk,
      })
    }
  }
}
