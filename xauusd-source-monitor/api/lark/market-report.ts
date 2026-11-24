/**
 * GET/POST /api/lark/market-report
 * - Vercel Cron every 30 minutes → DM Yan Haixiang a market scan card.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 */
import { timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
  sendCardToOpenId,
} from './_lib/client.js'
import { simpleCard } from './_lib/cards.js'
import { fetchMarketSnapshot, formatMarketAnswer, shanghaiHalfHourKey } from './_lib/market.js'

/** Yan Haixiang Feishu chat (DM) — override with LARK_MARKET_CHAT_ID / LARK_ADMIN_CHAT_ID. */
export const DEFAULT_MARKET_CHAT_ID = 'oc_430fae67dd06b70f65b726b1673ef40e'

function resolveMarketChatId(reqChatId?: string): { chatId: string; source: string } {
  const fromReq = (reqChatId || '').trim()
  if (fromReq) return { chatId: fromReq, source: 'request' }
  const fromEnv = (
    process.env.LARK_MARKET_CHAT_ID ||
    process.env.LARK_ADMIN_CHAT_ID ||
    ''
  ).trim()
  if (fromEnv) return { chatId: fromEnv, source: 'env' }
  return { chatId: DEFAULT_MARKET_CHAT_ID, source: 'default' }
}

export const config = {
  maxDuration: 60,
}

const MARK_DIR = join(tmpdir(), 've-lark-store')
const SENT_FILE = join(MARK_DIR, 'market-halfhour-sent.json')

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

function markSent(slotKey: string) {
  try {
    if (!existsSync(MARK_DIR)) mkdirSync(MARK_DIR, { recursive: true })
    const map = readSent()
    // Keep last ~48 hours of keys only
    const cutoff = Date.now() - 48 * 3600_000
    for (const [k, ts] of Object.entries(map)) {
      if (typeof ts === 'number' && ts < cutoff) delete map[k]
    }
    map[slotKey] = Date.now()
    writeFileSync(SENT_FILE, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function buildPushCard(markdown: string) {
  const intro = [
    '📬 **半小时定时行情**（自动推送给 **@Yan Haixiang**）',
    '',
  ].join('\n')
  return simpleCard('半小时行情推送', `${intro}${markdown}`, 'wathet')
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
  const body = (req.body || {}) as {
    force?: boolean
    dry?: boolean
    openId?: string
    chatId?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const slotKey = shanghaiHalfHourKey(now)

  let markdown = ''
  let card: Record<string, unknown>
  try {
    const snap = await fetchMarketSnapshot()
    markdown = formatMarketAnswer(snap, 'zh-Hans', '行情')
    card = buildPushCard(markdown)
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'market fetch failed',
      slotKey,
    })
  }

  const chat = resolveMarketChatId(body.chatId || String(q.chatId || ''))

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      slotKey,
      markdown,
      card,
      schedule: 'Every 30 minutes (cron: */30 * * * *)',
      recipient: 'Yan Haixiang',
      chatId: chat.chatId,
      chatSource: chat.source,
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'LARK_APP_ID / LARK_APP_SECRET missing',
      slotKey,
      dryPreview: markdown,
    })
  }

  const sent = readSent()
  if (!force && sent[slotKey] && cron) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_this_slot',
      slotKey,
      sentAt: sent[slotKey],
    })
  }

  // Prefer chat_id (oc_…) DM/group; fall back to open_id if chat send fails and open_id is known
  try {
    await sendCardToChat(chat.chatId, card)
    markSent(slotKey)
    return res.status(200).json({
      ok: true,
      sent: true,
      slotKey,
      recipientChatId: chat.chatId.slice(0, 10) + '…',
      recipientSource: chat.source,
      via: 'chat_id',
    })
  } catch (chatErr) {
    const resolved = body.openId?.trim()
      ? { openId: body.openId.trim(), source: 'request' }
      : await resolveAdminOpenId()
    if (!resolved.openId) {
      return res.status(502).json({
        ok: false,
        error: chatErr instanceof Error ? chatErr.message : 'send to chat failed',
        slotKey,
        chatId: chat.chatId,
        hint: 'Set LARK_MARKET_CHAT_ID or LARK_ADMIN_OPEN_ID on Vercel if this persists.',
      })
    }
    try {
      await sendCardToOpenId(resolved.openId, card)
      markSent(slotKey)
      return res.status(200).json({
        ok: true,
        sent: true,
        slotKey,
        recipientOpenId: resolved.openId.slice(0, 8) + '…',
        recipientSource: resolved.source,
        via: 'open_id_fallback',
        chatError: chatErr instanceof Error ? chatErr.message : String(chatErr),
      })
    } catch (e) {
      return res.status(502).json({
        ok: false,
        error: e instanceof Error ? e.message : 'send failed',
        slotKey,
      })
    }
  }
}
