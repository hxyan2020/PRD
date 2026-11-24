/**
 * GET/POST /api/lark/daily-market-report
 * - Vercel Cron every day 09:00 Asia/Shanghai (01:00 UTC) → group 24h market digest.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 */
import { timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, sendCardToChat } from './_lib/client.js'
import {
  buildMarketCard,
  fetchMarketSnapshot,
  formatDaily24hMarketAnswer,
  LARK_MARKET_LANG,
  shanghaiDayKey,
} from './_lib/market.js'

/** Target Feishu group for morning 24h digest — override with LARK_DAILY_MARKET_CHAT_ID. */
export const DEFAULT_DAILY_MARKET_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

function resolveDailyChatId(reqChatId?: string): { chatId: string; source: string } {
  const fromReq = (reqChatId || '').trim()
  if (fromReq) return { chatId: fromReq, source: 'request' }
  const fromEnv = (process.env.LARK_DAILY_MARKET_CHAT_ID || '').trim()
  if (fromEnv) return { chatId: fromEnv, source: 'env' }
  return { chatId: DEFAULT_DAILY_MARKET_CHAT_ID, source: 'default' }
}

export const config = {
  maxDuration: 60,
}

const MARK_DIR = join(tmpdir(), 've-lark-store')
const SENT_FILE = join(MARK_DIR, 'market-daily-sent.json')

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

function readSent(): Record<string, number> {
  try {
    if (!existsSync(SENT_FILE)) return {}
    return JSON.parse(readFileSync(SENT_FILE, 'utf8')) as Record<string, number>
  } catch {
    return {}
  }
}

function markSent(dayKey: string) {
  try {
    if (!existsSync(MARK_DIR)) mkdirSync(MARK_DIR, { recursive: true })
    const map = readSent()
    const cutoff = Date.now() - 14 * 24 * 3600_000
    for (const [k, ts] of Object.entries(map)) {
      if (typeof ts === 'number' && ts < cutoff) delete map[k]
    }
    map[dayKey] = Date.now()
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
  const body = (req.body || {}) as { force?: boolean; dry?: boolean; chatId?: string }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const dayKey = shanghaiDayKey(now)
  const chat = resolveDailyChatId(body.chatId || String(q.chatId || ''))

  let markdown = ''
  let card: Record<string, unknown>
  try {
    const snap = await fetchMarketSnapshot()
    markdown = formatDaily24hMarketAnswer(snap, LARK_MARKET_LANG)
    card = await buildMarketCard({
      title: '每日 24h 行情早报',
      snap,
      lang: LARK_MARKET_LANG,
      mode: 'daily',
      intro: '🌅 **每日早报 · 过去 24 小时行情**（东八区每天 **09:00** 自动推送）\n',
      template: 'wathet',
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'market fetch failed',
      dayKey,
    })
  }

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      dayKey,
      markdown,
      card,
      schedule: 'Daily 09:00 Asia/Shanghai (cron: 0 1 * * * UTC)',
      chatId: chat.chatId,
      chatSource: chat.source,
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'LARK_APP_ID / LARK_APP_SECRET missing',
      dayKey,
      dryPreview: markdown,
    })
  }

  const sent = readSent()
  if (!force && sent[dayKey] && cron) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_today',
      dayKey,
      sentAt: sent[dayKey],
    })
  }

  try {
    await sendCardToChat(chat.chatId, card)
    markSent(dayKey)
    return res.status(200).json({
      ok: true,
      sent: true,
      dayKey,
      recipientChatId: chat.chatId.slice(0, 10) + '…',
      recipientSource: chat.source,
      via: 'chat_id',
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      dayKey,
      chatId: chat.chatId,
    })
  }
}
