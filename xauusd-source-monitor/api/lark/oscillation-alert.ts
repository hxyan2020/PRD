/**
 * GET/POST /api/lark/oscillation-alert
 * - Cron every 15 min: evaluate Binance (OKX backup) vol / funding / news;
 *   on trigger, push card to group + Yan DM.
 * - Demo: 2026-11-25 10:00 Asia/Shanghai — force a DEMO card once.
 * - Manual: GET ?dry=1; POST { force: true, demo: true }.
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
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import {
  DEFAULT_OSC_DM_CHAT_ID,
  DEFAULT_OSC_GROUP_CHAT_ID,
  OSC_DEMO_DAY,
  OSC_DEMO_START_HM,
  buildOscillationAlertCard,
  evaluateOscillation,
  isOscDemoSlot,
  shanghaiHm,
  shouldFireAlert,
  type OscillationSnapshot,
} from './_lib/oscillationAlert.js'
import { shanghaiDayKey } from './_lib/market.js'

export const config = {
  maxDuration: 60,
}

const OSC_STATE_NAME = 'oscillation-alert-state.json'

type OscState = {
  lastAlertKey?: string
  lastAlertAt?: number
  demoSentDay?: string
}

async function readState(): Promise<OscState> {
  return (await readDurableJson<OscState>(OSC_STATE_NAME)) || {}
}

async function writeState(s: OscState): Promise<void> {
  await writeDurableJson(OSC_STATE_NAME, s)
}

function resolveGroupChatId(req?: string): string {
  return (
    (req || '').trim() ||
    (process.env.LARK_OSC_GROUP_CHAT_ID || '').trim() ||
    (process.env.LARK_DAILY_MARKET_CHAT_ID || '').trim() ||
    DEFAULT_OSC_GROUP_CHAT_ID
  )
}

function resolveDmChatId(req?: string): string {
  return (
    (req || '').trim() ||
    (process.env.LARK_OSC_DM_CHAT_ID || '').trim() ||
    (process.env.LARK_MARKET_CHAT_ID || '').trim() ||
    DEFAULT_OSC_DM_CHAT_ID
  )
}

function alertDedupeKey(snap: OscillationSnapshot): string {
  const day = shanghaiDayKey(snap.fetchedAt)
  const kinds = [...snap.triggers].filter((t) => t !== 'demo').sort().join('+') || 'demo'
  // Bucket to ~1h so we don't spam every 15m for the same condition
  const hour = shanghaiHm(snap.fetchedAt).slice(0, 2)
  return `${day}T${hour}:${kinds}`
}

async function dualPush(card: Record<string, unknown>, groupId: string, dmChatId: string) {
  const results: { channel: string; ok: boolean; error?: string }[] = []
  try {
    await sendCardToChat(groupId, card)
    results.push({ channel: 'group', ok: true })
  } catch (e) {
    results.push({
      channel: 'group',
      ok: false,
      error: e instanceof Error ? e.message : 'group send failed',
    })
  }
  try {
    await sendCardToChat(dmChatId, card)
    results.push({ channel: 'dm_chat', ok: true })
  } catch (e) {
    const err1 = e instanceof Error ? e.message : 'dm chat failed'
    try {
      const admin = await resolveAdminOpenId()
      if (!admin.openId) throw new Error(err1)
      await sendCardToOpenId(admin.openId, card)
      results.push({ channel: 'dm_open_id', ok: true })
    } catch (e2) {
      results.push({
        channel: 'dm',
        ok: false,
        error: e2 instanceof Error ? e2.message : err1,
      })
    }
  }
  return results
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
    demo?: boolean
    groupChatId?: string
    dmChatId?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'
  const forceDemo = body.demo === true || String(q.demo || '') === '1'

  // Always record a beat on real invokes (cron + desk). Dry preview stays quiet.
  // Health treats a 20m silence as miss — no_trigger skips must still heartbeat.
  if (!dry) {
    await touchCronHeartbeat('/api/lark/oscillation-alert', {
      outcome: 'ok',
      reason: cron ? (force ? 'invoke_force' : 'invoke') : 'desk',
    })
  }

  const now = Date.now()
  const day = shanghaiDayKey(now)
  const hm = shanghaiHm(now)
  const groupId = resolveGroupChatId(body.groupChatId || String(q.groupChatId || ''))
  const dmChatId = resolveDmChatId(body.dmChatId || String(q.dmChatId || ''))
  const state = await readState()
  const admin = await resolveAdminOpenId({ preferChatId: groupId })

  const wantDemo =
    forceDemo || (cron && isOscDemoSlot(now) && state.demoSentDay !== OSC_DEMO_DAY)

  let snap: OscillationSnapshot
  try {
    snap = await evaluateOscillation({ demo: wantDemo || (force && forceDemo) })
    if (wantDemo) snap = { ...snap, demo: true, triggers: [...new Set([...snap.triggers, 'demo' as const])] }
  } catch (e) {
    if (!dry) {
      await touchCronHeartbeat('/api/lark/oscillation-alert', {
        status: 502,
        outcome: 'error',
        reason: e instanceof Error ? e.message : 'evaluate failed',
      })
    }
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'evaluate failed',
    })
  }

  const card = buildOscillationAlertCard(snap, admin.openId)

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      day,
      hm,
      demoDay: OSC_DEMO_DAY,
      demoStart: OSC_DEMO_START_HM,
      isDemoSlot: isOscDemoSlot(now),
      shouldFire: shouldFireAlert(snap),
      snap,
      card,
      groupId,
      dmChatId,
      adminOpenId: admin.openId ? admin.openId.slice(0, 8) + '…' : null,
      adminSource: admin.source,
      hasRealAt: Boolean(admin.openId?.startsWith('ou_')),
      schedule: 'Every 15 min + demo 10:00 CST on campaign day',
    })
  }

  if (!wantDemo && !shouldFireAlert(snap) && !force) {
    if (!dry) {
      await touchCronHeartbeat('/api/lark/oscillation-alert', {
        status: 200,
        outcome: 'skipped',
        reason: 'no_trigger',
      })
    }
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'no_trigger',
      snap,
      day,
      hm,
    })
  }

  // Dedupe live alerts (not demo)
  if (!wantDemo && !force) {
    const key = alertDedupeKey(snap)
    if (state.lastAlertKey === key && state.lastAlertAt && now - state.lastAlertAt < 50 * 60_000) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'deduped',
        key,
        state,
      })
    }
  }

  if (wantDemo && !force && state.demoSentDay === OSC_DEMO_DAY) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'demo_already_sent',
      state,
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({ ok: false, error: 'Lark not configured', snap })
  }

  const results = await dualPush(card, groupId, dmChatId)
  const anyOk = results.some((r) => r.ok)
  if (anyOk) {
    const next: OscState = {
      ...state,
      lastAlertKey: alertDedupeKey(snap),
      lastAlertAt: Date.now(),
    }
    if (wantDemo || snap.demo) next.demoSentDay = OSC_DEMO_DAY
    await writeState(next)
  }

  return res.status(anyOk ? 200 : 502).json({
    ok: anyOk,
    sent: anyOk,
    demo: snap.demo,
    results,
    snap,
    day,
    hm,
  })
}
