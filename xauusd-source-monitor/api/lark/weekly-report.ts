/**
 * GET/POST /api/lark/weekly-report
 * - Vercel Cron (Fridays 08:00 UTC = 16:00 Asia/Shanghai) pushes digest to Yan Haixiang.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, resolveAdminOpenId, sendCardToOpenId } from './_lib/client.js'
import { allowCronOrDesk, isVercelCron } from './_lib/cronAuth.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import { listIncidents } from './_lib/store.js'
import { buildWeeklyReport, weeklyReportCard } from './_lib/weeklyReport.js'

const SENT_NAME = 'weekly-sent.json'

async function readSent(): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(SENT_NAME)) || {}
}

async function markSent(weekKey: string) {
  const map = await readSent()
  map[weekKey] = Date.now()
  await writeDurableJson(SENT_NAME, map)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const cron = isVercelCron(req)
  if (!allowCronOrDesk(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' })
  }

  const q = req.query || {}
  const body = (req.body || {}) as { force?: boolean; dry?: boolean; openId?: string }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const resolvedEarly = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId()
  const incidents = listIncidents({ status: 'all', limit: 200 })
  const report = buildWeeklyReport(incidents, now, 'zh-Hans', resolvedEarly.openId)
  const card = weeklyReportCard(report.markdown, report.empty)

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      weekKey: report.window.weekKey,
      label: report.window.label,
      count: report.incidents.length,
      empty: report.empty,
      markdown: report.markdown,
      card,
      schedule: 'Fridays 16:00 Asia/Shanghai (cron: 0 8 * * 5 UTC)',
      recipient: 'Yan Haixiang',
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

  const sent = await readSent()
  if (!force && sent[report.window.weekKey] && cron) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_this_week',
      weekKey: report.window.weekKey,
      sentAt: sent[report.window.weekKey],
    })
  }

  const resolved = resolvedEarly

  if (!resolved.openId) {
    return res.status(400).json({
      ok: false,
      error:
        'Admin open_id missing. Set LARK_ADMIN_OPEN_ID (Yan Haixiang) or LARK_ADMIN_EMAIL on Vercel.',
      weekKey: report.window.weekKey,
      dryPreview: report.markdown,
    })
  }

  try {
    await sendCardToOpenId(resolved.openId, card)
    await markSent(report.window.weekKey)
    return res.status(200).json({
      ok: true,
      sent: true,
      weekKey: report.window.weekKey,
      label: report.window.label,
      count: report.incidents.length,
      empty: report.empty,
      recipientOpenId: resolved.openId.slice(0, 8) + '…',
      recipientSource: resolved.source,
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      weekKey: report.window.weekKey,
    })
  }
}
