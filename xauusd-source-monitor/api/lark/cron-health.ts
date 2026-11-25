/**
 * GET/POST /api/lark/cron-health
 * - Every 30 minutes → DM Yan Haixiang a cron/bot health card.
 * - If any scheduled push is missing, card is red and @mentions Yan.
 * - Also reachable via cron-tick (health-first fan-out + force catch-up).
 *
 * Stability:
 * - Slot / miss-set dedupe avoids spam within a half-hour window.
 * - If no successful DM for STALE_CATCHUP_MS (incl. never-sent), always
 *   re-raise — do not stay silent when the schedule / tick went quiet.
 * - Sent-state Blob write failures surface as 502 so the next tick retries.
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
/** Dedicated key so slot/miss stamps cannot mask “never delivered”. */
const DELIVERY_KEY = '__last_delivery__'
/** If no health DM for this long, push again even if slot/miss dedupe would skip. */
const STALE_CATCHUP_MS = 35 * 60_000
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

async function markSent(slotKey: string): Promise<boolean> {
  const map = await readSent()
  const cutoff = Date.now() - 48 * 3600_000
  for (const [k, ts] of Object.entries(map)) {
    if (k === DELIVERY_KEY) continue
    if (typeof ts === 'number' && ts < cutoff) delete map[k]
  }
  const now = Date.now()
  map[slotKey] = now
  map[DELIVERY_KEY] = now
  return writeDurableJson(SENT_NAME, map)
}

function lastDeliveryAt(sent: Record<string, number>): number {
  const dedicated = sent[DELIVERY_KEY]
  if (typeof dedicated === 'number' && dedicated > 0) return dedicated
  const vals = Object.entries(sent)
    .filter(([k, t]) => k !== DELIVERY_KEY && typeof t === 'number' && t > 0)
    .map(([, t]) => t as number)
  return vals.length ? Math.max(...vals) : 0
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
    await touchCronHeartbeat('/api/lark/cron-health', {
      outcome: 'ok',
      reason: force ? 'invoke_force' : 'invoke',
    })
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
      schedule: 'Every 30 minutes → Yan Haixiang (raise on miss); 35m silence catch-up',
      chatId: chat.chatId,
      chatSource: chat.source,
      staleCatchupMs: STALE_CATCHUP_MS,
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
  const lastSentAt = lastDeliveryAt(sent)
  // Never-sent OR silence ≥ 35m → always catch up (do not require lastSentAt > 0).
  const staleCatchup =
    !force && (lastSentAt === 0 || now - lastSentAt >= STALE_CATCHUP_MS)
  const catchup = force || staleCatchup
  // Healthy reports: once per half-hour slot. Miss alerts: once per miss-set per slot.
  const missKey = `miss:${slotKey}:${report.misses
    .map((m) => m.id)
    .sort()
    .join('+')}`
  if (!catchup && report.allOk && sent[slotKey]) {
    await touchCronHeartbeat('/api/lark/cron-health', {
      status: 200,
      outcome: 'skipped',
      reason: 'already_sent_healthy_slot',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_healthy_slot',
      slotKey,
      allOk: true,
      lastSentAt,
      via: cron ? 'cron' : 'manual',
    })
  }
  if (!catchup && !report.allOk && sent[missKey]) {
    await touchCronHeartbeat('/api/lark/cron-health', {
      status: 200,
      outcome: 'skipped',
      reason: 'already_raised_this_miss_set',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_raised_this_miss_set',
      slotKey,
      misses: report.misses.map((m) => m.id),
      lastSentAt,
      via: cron ? 'cron' : 'manual',
    })
  }

  const stampKey = report.allOk ? slotKey : missKey

  try {
    await sendCardToChat(chat.chatId, report.card)
    const persisted = await markSent(stampKey)
    if (staleCatchup) await markSent(`catchup:${slotKey}`)
    await touchCronHeartbeat('/api/lark/cron-health', {
      status: persisted ? 200 : 502,
      outcome: report.allOk ? 'ok' : 'sent',
      reason: !persisted
        ? 'sent_but_blob_failed'
        : staleCatchup
          ? `stale_catchup:${report.allOk ? 'healthy' : report.misses.map((m) => m.id).join(',')}`
          : force
            ? `force:${report.allOk ? 'healthy' : report.misses.map((m) => m.id).join(',')}`
            : report.allOk
              ? 'healthy'
              : `miss:${report.misses.map((m) => m.id).join(',')}`,
    })
    if (!persisted) {
      return res.status(502).json({
        ok: false,
        sent: true,
        error: 'health_sent_state_blob_failed',
        raised: !report.allOk,
        staleCatchup,
        slotKey,
        allOk: report.allOk,
        misses: report.misses.map((m) => m.id),
      })
    }
    return res.status(200).json({
      ok: true,
      sent: true,
      raised: !report.allOk,
      staleCatchup,
      force,
      slotKey,
      allOk: report.allOk,
      misses: report.misses.map((m) => m.id),
      via: 'chat_id',
      recipientChatId: chat.chatId.slice(0, 10) + '…',
    })
  } catch (chatErr) {
    if (!admin.openId) {
      await touchCronHeartbeat('/api/lark/cron-health', {
        status: 502,
        outcome: 'error',
        reason: chatErr instanceof Error ? chatErr.message : 'send failed',
      })
      return res.status(502).json({
        ok: false,
        error: chatErr instanceof Error ? chatErr.message : 'send failed',
        slotKey,
        allOk: report.allOk,
      })
    }
    try {
      await sendCardToOpenId(admin.openId, report.card)
      const persisted = await markSent(stampKey)
      await touchCronHeartbeat('/api/lark/cron-health', {
        status: persisted ? 200 : 502,
        outcome: report.allOk ? 'ok' : 'sent',
        reason: persisted ? 'open_id_fallback' : 'open_id_fallback_blob_failed',
      })
      if (!persisted) {
        return res.status(502).json({
          ok: false,
          sent: true,
          error: 'health_sent_state_blob_failed',
          raised: !report.allOk,
          slotKey,
          allOk: report.allOk,
          misses: report.misses.map((m) => m.id),
          via: 'open_id_fallback',
        })
      }
      return res.status(200).json({
        ok: true,
        sent: true,
        raised: !report.allOk,
        staleCatchup,
        force,
        slotKey,
        allOk: report.allOk,
        misses: report.misses.map((m) => m.id),
        via: 'open_id_fallback',
      })
    } catch (e) {
      await touchCronHeartbeat('/api/lark/cron-health', {
        status: 502,
        outcome: 'error',
        reason: e instanceof Error ? e.message : 'send failed',
      })
      return res.status(502).json({
        ok: false,
        error: e instanceof Error ? e.message : 'send failed',
        slotKey,
        allOk: report.allOk,
      })
    }
  }
}
