/**
 * GET/POST /api/lark/weekly-demo
 * - One-shot 【DEMO】每周复盘 → Feishu group at 2026-11-25 16:00 Asia/Shanghai.
 * - Cron every 15 min; handler no-ops except demo day after 16:00 until sent (≤18:00).
 * - Manual: GET ?dry=1; POST { force: true }.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, resolveAdminOpenId, sendCardToChat } from './_lib/client.js'
import { allowCronOrDesk, isVercelCron } from './_lib/cronAuth.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
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

const STATE_NAME = 'weekly-demo-sent.json'

export function isWeeklyDemoSlot(ts: number = Date.now()): boolean {
  if (shanghaiDayKey(ts) !== WEEKLY_DEMO_DAY) return false
  const hm = shanghaiHm(ts)
  // Catch-up after 16:00 until 18:00 CST (idempotent via sent-day state).
  return hm >= WEEKLY_DEMO_START_HM && hm < '18:00'
}

async function readSentDay(): Promise<string> {
  const j = await readDurableJson<{ day?: string }>(STATE_NAME)
  return j?.day || ''
}

async function markSent(day: string) {
  await writeDurableJson(STATE_NAME, { day, at: Date.now() })
}

function resolveChatId(req?: string): string {
  return (
    (req || '').trim() ||
    (process.env.LARK_WEEKLY_DEMO_CHAT_ID || '').trim() ||
    (process.env.LARK_DAILY_MARKET_CHAT_ID || '').trim() ||
    DEFAULT_WEEKLY_DEMO_CHAT_ID
  )
}

function buildDemoCard(adminOpenId?: string): {
  markdown: string
  card: Record<string, unknown>
  empty: boolean
} {
  const report = buildWeeklyReport(
    listIncidents({ status: 'all', limit: 200 }),
    Date.now(),
    'zh-Hans',
    adminOpenId,
  )
  const intro = [
    '🧪 **【DEMO】每周复盘**（今天东八区 16:00 演练推送）',
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
  if (!allowCronOrDesk(req)) return res.status(401).json({ error: 'Unauthorized' })
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
  const admin = await resolveAdminOpenId({ preferChatId: chatId })
  const { markdown, card, empty } = buildDemoCard(admin.openId)
  const already = (await readSentDay()) === WEEKLY_DEMO_DAY

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
      adminOpenId: admin.openId ? admin.openId.slice(0, 8) + '…' : null,
      adminSource: admin.source,
      hasRealAt: Boolean(admin.openId?.startsWith('ou_')),
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
    await markSent(WEEKLY_DEMO_DAY)
    return res.status(200).json({
      ok: true,
      sent: true,
      demo: true,
      messageId: sent.messageId,
      chatId,
      day,
      hm,
      empty,
      adminSource: admin.source,
      hasRealAt: Boolean(admin.openId?.startsWith('ou_')),
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
    })
  }
}
