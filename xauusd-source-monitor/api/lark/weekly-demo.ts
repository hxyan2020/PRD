/**
 * GET/POST /api/lark/weekly-demo
 * - One-shot 【DEMO】每周复盘 → Feishu group at 2026-11-25 16:00 Asia/Shanghai.
 * - Cron every 15 min; handler no-ops except demo day 16:00–16:14.
 * - Manual: GET ?dry=1; POST { force: true }.
 */
import { timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, sendCardToChat } from './_lib/client.js'
import { listIncidents } from './_lib/store.js'
import { buildWeeklyReport, weeklyReportCard } from './_lib/weeklyReport.js'
import { shanghaiDayKey } from './_lib/market.js'
import { shanghaiHm } from './_lib/oscillationAlert.js'

/** Same group as daily market / oscillation alerts */
export const DEFAULT_WEEKLY_DEMO_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

export const WEEKLY_DEMO_DAY =
  (process.env.LARK_WEEKLY_DEMO_DAY || '').trim() || '2026-11-25'
export const WEEKLY_DEMO_START_HM =
  (process.env.LARK_WEEKLY_DEMO_START || '').trim() || '16:00'

export const config = {
  maxDuration: 60,
}

const MARK_DIR = join(tmpdir(), 've-lark-store')
const STATE_FILE = join(MARK_DIR, 'weekly-demo-sent.json')

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

export function isWeeklyDemoSlot(ts: number = Date.now()): boolean {
  if (shanghaiDayKey(ts) !== WEEKLY_DEMO_DAY) return false
  const hm = shanghaiHm(ts)
  return hm >= '16:00' && hm <= '16:14'
}

function readSentDay(): string {
  try {
    if (!existsSync(STATE_FILE)) return ''
    const j = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as { day?: string }
    return j.day || ''
  } catch {
    return ''
  }
}

function markSent(day: string) {
  try {
    if (!existsSync(MARK_DIR)) mkdirSync(MARK_DIR, { recursive: true })
    writeFileSync(STATE_FILE, JSON.stringify({ day, at: Date.now() }))
  } catch {
    /* ignore */
  }
}

function resolveChatId(req?: string): string {
  return (
    (req || '').trim() ||
    (process.env.LARK_WEEKLY_DEMO_CHAT_ID || '').trim() ||
    (process.env.LARK_DAILY_MARKET_CHAT_ID || '').trim() ||
    DEFAULT_WEEKLY_DEMO_CHAT_ID
  )
}

function buildDemoCard(): { markdown: string; card: Record<string, unknown>; empty: boolean } {
  const report = buildWeeklyReport(listIncidents({ status: 'all', limit: 200 }), Date.now(), 'zh-Hans')
  const intro = [
    '🧪 **【DEMO】每周复盘**（明天东八区 16:00 演练推送）',
    '',
    '以下为近 7 日值班／排查汇总样例样式；正式版每周五 16:00 推送给值班。',
    '',
  ].join('\n')
  const markdown = `${intro}${report.markdown}`
  const card = weeklyReportCard(markdown, report.empty)
  // Orange header to mark demo
  const header = card.header as { template?: string; title?: { content?: string } }
  if (header) {
    header.template = 'orange'
    if (header.title) header.title.content = '【DEMO】每周复盘'
  }
  return { markdown, card, empty: report.empty }
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
  const body = (req.body || {}) as { force?: boolean; dry?: boolean; chatId?: string }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const day = shanghaiDayKey(now)
  const hm = shanghaiHm(now)
  const chatId = resolveChatId(body.chatId || String(q.chatId || ''))
  const { markdown, card, empty } = buildDemoCard()
  const already = readSentDay() === WEEKLY_DEMO_DAY

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      day,
      hm,
      demoDay: WEEKLY_DEMO_DAY,
      demoStart: WEEKLY_DEMO_START_HM,
      isDemoSlot: isWeeklyDemoSlot(now),
      alreadySent: already,
      chatId,
      empty,
      markdown,
      card,
      schedule: `Once on ${WEEKLY_DEMO_DAY} ${WEEKLY_DEMO_START_HM} Asia/Shanghai → group`,
    })
  }

  if (cron && !force) {
    if (!isWeeklyDemoSlot(now)) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'not_demo_slot',
        day,
        hm,
        demoDay: WEEKLY_DEMO_DAY,
      })
    }
    if (already) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'demo_already_sent',
        day,
      })
    }
  }

  if (!force && already && !cron) {
    // allow force only
  }

  if (!force && already) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'demo_already_sent',
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({ ok: false, error: 'Lark not configured', markdown })
  }

  try {
    const sent = await sendCardToChat(chatId, card)
    markSent(WEEKLY_DEMO_DAY)
    return res.status(200).json({
      ok: true,
      sent: true,
      demo: true,
      messageId: sent.messageId,
      chatId,
      day,
      hm,
      empty,
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
    })
  }
}
