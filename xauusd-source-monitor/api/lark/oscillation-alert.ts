/**
 * GET/POST /api/lark/oscillation-alert
 * - Cron every 10 min (+ cron-tick / ping keep-alive): evaluate Binance (OKX backup) vol / funding / news;
 *   on trigger, push card to risk **group only** (no Yan / Haixiang DM).
 * - Demo: 2026-11-25 10:00 Asia/Shanghai — force a DEMO card once.
 * - Manual: GET ?dry=1; POST { force: true, demo: true }.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
} from './_lib/client.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { touchCronHeartbeat } from './_lib/cronHeartbeat.js'
import { claimPushOnce, releasePushClaim } from './_lib/dedupe.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import {
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

function alertDedupeKey(snap: OscillationSnapshot): string {
  const day = shanghaiDayKey(snap.fetchedAt)
  const kinds = [...snap.triggers].filter((t) => t !== 'demo').sort().join('+') || 'demo'
  // Bucket to ~1h so we don't spam every 10m for the same condition
  const hour = shanghaiHm(snap.fetchedAt).slice(0, 2)
  let key = `${day}T${hour}:${kinds}`
  // Distinct major-news shocks in the same hour still fire; identical headline stays quiet.
  if (snap.triggers.includes('breaking_news') && snap.newsHeadline) {
    const slug = snap.newsHeadline
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')
      .slice(0, 48)
    if (slug) key += `:${slug}`
  }
  return key
}

/** Group only — Yan / Haixiang DM explicitly disabled for 震荡行情. */
async function pushToGroup(card: Record<string, unknown>, groupId: string) {
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
    ping?: boolean
    groupChatId?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'
  const forceDemo = body.demo === true || String(q.demo || '') === '1'
  const ping = String(q.ping || '') === '1' || body.ping === true

  // Always record a beat on real invokes (cron + desk). Dry preview stays quiet.
  // Health treats a 20m silence as miss — ping / no_trigger / dedupe must still beat.
  async function beat(
    extra: { status?: number; outcome?: 'sent' | 'skipped' | 'ok' | 'error'; reason?: string } = {},
  ) {
    if (dry) return
    await touchCronHeartbeat('/api/lark/oscillation-alert', {
      outcome: extra.outcome || 'ok',
      status: extra.status,
      reason:
        extra.reason ||
        (ping ? 'ping' : cron ? (force ? 'invoke_force' : 'invoke') : 'desk'),
    })
  }

  // Ultra-fast keep-alive for cron-tick when evaluate must not run (never silent).
  if (ping && !dry) {
    await beat({ outcome: 'ok', reason: 'ping' })
    return res.status(200).json({ ok: true, ping: true, at: Date.now() })
  }

  await beat()

  const now = Date.now()
  const day = shanghaiDayKey(now)
  const hm = shanghaiHm(now)
  const groupId = resolveGroupChatId(body.groupChatId || String(q.groupChatId || ''))
  const state = await readState()
  // open_id used only for in-card @mention in the group — never for a separate DM.
  const admin = await resolveAdminOpenId({ preferChatId: groupId })

  const wantDemo =
    forceDemo || (cron && isOscDemoSlot(now) && state.demoSentDay !== OSC_DEMO_DAY)

  let snap: OscillationSnapshot
  try {
    snap = await evaluateOscillation({ demo: wantDemo || (force && forceDemo) })
    if (wantDemo) snap = { ...snap, demo: true, triggers: [...new Set([...snap.triggers, 'demo' as const])] }
  } catch (e) {
    await beat({
      status: 502,
      outcome: 'error',
      reason: e instanceof Error ? e.message : 'evaluate failed',
    })
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
      recipient: 'group only (no Yan DM)',
      adminOpenId: admin.openId ? admin.openId.slice(0, 8) + '…' : null,
      adminSource: admin.source,
      hasRealAt: Boolean(admin.openId?.startsWith('ou_')),
      schedule: 'Every 10 min + demo 10:00 CST on campaign day → group only',
    })
  }

  if (!wantDemo && !shouldFireAlert(snap) && !force) {
    await beat({ status: 200, outcome: 'skipped', reason: 'no_trigger' })
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
  const alertKey = alertDedupeKey(snap)
  if (!wantDemo && !force) {
    if (state.lastAlertKey === alertKey && state.lastAlertAt && now - state.lastAlertAt < 50 * 60_000) {
      await beat({ status: 200, outcome: 'skipped', reason: 'deduped' })
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'deduped',
        key: alertKey,
        state,
      })
    }
  }

  if (wantDemo && !force && state.demoSentDay === OSC_DEMO_DAY) {
    await beat({ status: 200, outcome: 'skipped', reason: 'demo_already_sent' })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'demo_already_sent',
      state,
    })
  }

  if (!larkConfigured()) {
    await beat({ status: 503, outcome: 'error', reason: 'lark_not_configured' })
    return res.status(503).json({ ok: false, error: 'Lark not configured', snap })
  }

  // Cross-instance lock so cron + cron-tick cannot both push the same alert key.
  const pushClaimKey = wantDemo
    ? `push:osc-demo:${OSC_DEMO_DAY}`
    : `push:osc:${alertKey}`
  if (!force) {
    const claimed = await claimPushOnce(pushClaimKey, wantDemo ? 36 * 3600_000 : 55 * 60_000)
    if (!claimed) {
      await beat({ status: 200, outcome: 'skipped', reason: 'claim_held' })
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'claim_held',
        key: alertKey,
        via: cron ? 'cron' : 'manual',
      })
    }
  }

  const results = await pushToGroup(card, groupId)
  const anyOk = results.some((r) => r.ok)
  if (anyOk) {
    const next: OscState = {
      ...state,
      lastAlertKey: alertKey,
      lastAlertAt: Date.now(),
    }
    if (wantDemo || snap.demo) next.demoSentDay = OSC_DEMO_DAY
    await writeState(next)
  } else if (!force) {
    await releasePushClaim(pushClaimKey)
  }

  await beat({
    status: anyOk ? 200 : 502,
    outcome: anyOk ? 'sent' : 'error',
    reason: anyOk ? (snap.demo ? 'demo_sent' : 'alert_sent') : 'send_failed',
  })

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
