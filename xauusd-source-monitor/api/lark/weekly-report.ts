/**
 * GET/POST /api/lark/weekly-report
 * - Vercel Cron (Fridays 08:00 UTC = 16:00 Asia/Shanghai) pushes digest to Yan Haixiang.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 */
import { timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, resolveAdminOpenId, sendCardToOpenId } from './_lib/client.js'
import { listIncidents } from './_lib/store.js'
import { buildWeeklyReport, weeklyReportCard } from './_lib/weeklyReport.js'

const MARK_DIR = join(tmpdir(), 've-lark-store')
const SENT_FILE = join(MARK_DIR, 'weekly-sent.json')

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function authorize(req: VercelRequest): boolean {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set
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

function readSent(): Record<string, number> {
  try {
    if (!existsSync(SENT_FILE)) return {}
    return JSON.parse(readFileSync(SENT_FILE, 'utf8')) as Record<string, number>
  } catch {
    return {}
  }
}

function markSent(weekKey: string) {
  try {
    if (!existsSync(MARK_DIR)) mkdirSync(MARK_DIR, { recursive: true })
    const map = readSent()
    map[weekKey] = Date.now()
    writeFileSync(SENT_FILE, JSON.stringify(map))
  } catch {
    /* ignore */
  }
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
  const body = (req.body || {}) as { force?: boolean; dry?: boolean; openId?: string }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const incidents = listIncidents({ status: 'all', limit: 200 })
  const report = buildWeeklyReport(incidents, now, 'zh-Hans')
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

  const sent = readSent()
  if (!force && sent[report.window.weekKey] && cron) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_this_week',
      weekKey: report.window.weekKey,
      sentAt: sent[report.window.weekKey],
    })
  }

  const resolved = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId()

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
    markSent(report.window.weekKey)
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
