/**
 * GET/POST /api/lark/weekly-report
 * - Vercel Cron (Fridays 08:00 UTC = 16:00 Asia/Shanghai) pushes digest to
 *   Feishu group + Yan Haixiang DM.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
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
import { claimPushOnce, releasePushClaim } from './_lib/dedupe.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import { shanghaiDayKey } from './_lib/market.js'
import { listIncidentsDurable } from './_lib/store.js'
import {
  buildWeeklyDemoReport,
  buildWeeklyReport,
  weeklyDemoCard,
  weeklyReportCard,
} from './_lib/weeklyReport.js'

/** Same risk group as daily morning / oscillation alerts. */
export const DEFAULT_WEEKLY_GROUP_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

/** Friday in Asia/Shanghai (0=Sun … 5=Fri). */
function isShanghaiFriday(ts: number = Date.now()): boolean {
  try {
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      weekday: 'short',
    }).format(new Date(ts))
    return wd === 'Fri'
  } catch {
    return new Date(ts).getUTCDay() === 5
  }
}

const SENT_NAME = 'weekly-sent.json'

async function readSent(): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(SENT_NAME)) || {}
}

async function markSent(weekKey: string): Promise<boolean> {
  const map = await readSent()
  map[weekKey] = Date.now()
  return writeDurableJson(SENT_NAME, map)
}

function resolveGroupChatId(req?: string): string {
  return (
    (req || '').trim() ||
    (process.env.LARK_WEEKLY_GROUP_CHAT_ID || '').trim() ||
    (process.env.LARK_DAILY_MARKET_CHAT_ID || '').trim() ||
    DEFAULT_WEEKLY_GROUP_CHAT_ID
  )
}

async function dualPush(
  card: Record<string, unknown>,
  groupId: string,
  openId: string | undefined,
): Promise<{ channel: string; ok: boolean; error?: string }[]> {
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
  if (openId) {
    try {
      await sendCardToOpenId(openId, card)
      results.push({ channel: 'dm_open_id', ok: true })
    } catch (e) {
      results.push({
        channel: 'dm_open_id',
        ok: false,
        error: e instanceof Error ? e.message : 'open_id send failed',
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
    openId?: string
    groupChatId?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1' && String(q.demo || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'
  const demo = body.demo === true || String(q.demo || '') === '1'
  const groupId = resolveGroupChatId(
    body.groupChatId || String(q.groupChatId || ''),
  )

  if (cron && !dry) {
    await touchCronHeartbeat('/api/lark/weekly-report', {
      outcome: 'ok',
      reason: force ? 'invoke_force' : 'invoke',
    })
  }

  const now = Date.now()
  const resolvedEarly = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId({ preferChatId: groupId })
  const incidents = await listIncidentsDurable({ status: 'all', limit: 200 })
  const report = demo
    ? buildWeeklyDemoReport(now, 'zh-Hans', resolvedEarly.openId)
    : buildWeeklyReport(incidents, now, 'zh-Hans', resolvedEarly.openId)
  const card = demo ? weeklyDemoCard(report) : weeklyReportCard(report.markdown, report.empty)

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      demo,
      weekKey: report.window.weekKey,
      label: report.window.label,
      count: report.incidents.length,
      empty: report.empty,
      markdown: report.markdown,
      card,
      schedule: demo
        ? 'Manual DEMO → group + Yan DM (virtual incidents)'
        : 'Fridays 16:00 Asia/Shanghai → group + Yan DM (cron: 0 8 * * 5 UTC)',
      recipient: 'group + Yan Haixiang',
      groupChatId: groupId.slice(0, 10) + '…',
      recipientOpenId: resolvedEarly.openId
        ? resolvedEarly.openId.slice(0, 8) + '…'
        : null,
      recipientSource: resolvedEarly.source,
      hasRealAt: Boolean(resolvedEarly.openId?.startsWith('ou_')),
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'LARK_APP_ID / LARK_APP_SECRET missing',
      weekKey: report.window.weekKey,
      dryPreview: report.markdown,
    })
  }

  // Cron schedule is Friday-only; still guard so fan-out / mistaken triggers cannot mid-week push.
  // DEMO pushes are always explicit (demo=1) and skip the Friday gate.
  if (cron && !force && !demo && !isShanghaiFriday(now)) {
    await touchCronHeartbeat('/api/lark/weekly-report', {
      status: 200,
      outcome: 'skipped',
      reason: 'not_friday_cst',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'not_friday_cst',
      day: shanghaiDayKey(now),
      weekKey: report.window.weekKey,
    })
  }

  const sent = await readSent()
  // Cron AND manual (unless force/demo) — same as daily, so verify curls cannot double-push.
  if (!force && !demo && sent[report.window.weekKey]) {
    await touchCronHeartbeat('/api/lark/weekly-report', {
      status: 200,
      outcome: 'skipped',
      reason: 'already_sent_this_week',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_this_week',
      weekKey: report.window.weekKey,
      sentAt: sent[report.window.weekKey],
      via: cron ? 'cron' : 'manual',
    })
  }

  const resolved = resolvedEarly
  if (!groupId && !resolved.openId) {
    return res.status(400).json({
      ok: false,
      error:
        'No weekly recipient. Set LARK_WEEKLY_GROUP_CHAT_ID / LARK_DAILY_MARKET_CHAT_ID or LARK_ADMIN_OPEN_ID.',
      weekKey: report.window.weekKey,
      dryPreview: report.markdown,
    })
  }

  const pushClaimKey = `push:weekly:${report.window.weekKey}${demo ? ':demo' : ''}`
  if (!force) {
    const claimed = await claimPushOnce(pushClaimKey, 8 * 24 * 3600_000)
    if (!claimed) {
      await touchCronHeartbeat('/api/lark/weekly-report', {
        status: 200,
        outcome: 'skipped',
        reason: 'claim_held',
      })
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'claim_held',
        weekKey: report.window.weekKey,
        via: cron ? 'cron' : 'manual',
      })
    }
  }

  try {
    const results = await dualPush(card, groupId, resolved.openId)
    const anyOk = results.some((r) => r.ok)
    if (!anyOk) {
      if (!force) await releasePushClaim(pushClaimKey)
      await touchCronHeartbeat('/api/lark/weekly-report', {
        status: 502,
        outcome: 'error',
        reason: 'send_failed',
      })
      return res.status(502).json({
        ok: false,
        error: 'send failed',
        results,
        weekKey: report.window.weekKey,
      })
    }

    // DEMO must not consume the real Friday weekly-sent slot.
    let persisted = true
    if (!demo) persisted = await markSent(report.window.weekKey)
    await touchCronHeartbeat('/api/lark/weekly-report', {
      status: persisted ? 200 : 502,
      outcome: 'sent',
      reason: persisted ? (demo ? 'demo' : 'healthy') : 'sent_but_blob_failed',
    })
    if (!persisted) {
      return res.status(502).json({
        ok: false,
        sent: true,
        error: 'weekly_sent_state_blob_failed',
        weekKey: report.window.weekKey,
        results,
      })
    }
    return res.status(200).json({
      ok: true,
      sent: true,
      demo,
      weekKey: report.window.weekKey,
      label: report.window.label,
      count: report.incidents.length,
      empty: report.empty,
      results,
      via: results
        .filter((r) => r.ok)
        .map((r) => r.channel)
        .join('+'),
      groupChatId: groupId.slice(0, 10) + '…',
      recipientOpenId: resolved.openId
        ? resolved.openId.slice(0, 8) + '…'
        : null,
      recipientSource: resolved.source,
    })
  } catch (e) {
    if (!force) await releasePushClaim(pushClaimKey)
    await touchCronHeartbeat('/api/lark/weekly-report', {
      status: 502,
      outcome: 'error',
      reason: e instanceof Error ? e.message : 'send failed',
    })
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      weekKey: report.window.weekKey,
    })
  }
}
