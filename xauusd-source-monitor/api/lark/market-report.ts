/**
 * GET/POST /api/lark/market-report
 * - Vercel Cron every 30 minutes → DM Yan Haixiang a market scan card.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 * - Not listed in greeting / capabilities — private desk push only.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
  sendCardToOpenId,
} from './_lib/client.js'
import { allowCronOrDesk, isVercelCron } from './_lib/cronAuth.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import {
  buildMarketCard,
  fetchMarketSnapshot,
  formatMarketAnswer,
  hourlyMarketTitle,
  resolveDailyMarketLang,
  shanghaiHalfHourKey,
} from './_lib/market.js'

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

const SENT_NAME = 'market-halfhour-sent.json'

async function readSent(): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(SENT_NAME)) || {}
}

async function markSent(slotKey: string) {
  const map = await readSent()
  const cutoff = Date.now() - 48 * 3600_000
  for (const [k, ts] of Object.entries(map)) {
    if (typeof ts === 'number' && ts < cutoff) delete map[k]
  }
  map[slotKey] = Date.now()
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
  const body = (req.body || {}) as {
    force?: boolean
    dry?: boolean
    openId?: string
    chatId?: string
    lang?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const slotKey = shanghaiHalfHourKey(now)
  const chat = resolveMarketChatId(body.chatId || String(q.chatId || ''))
  const { lang: marketLang } = await resolveDailyMarketLang({
    chatId: chat.chatId,
    hint: body.lang || String(q.lang || '') || null,
  })

  let markdown = ''
  let card: Record<string, unknown>
  try {
    const snap = await fetchMarketSnapshot()
    const qLabel =
      marketLang === 'en' ? 'market' : marketLang === 'zh-Hant' ? '行情' : '行情'
    markdown = formatMarketAnswer(snap, marketLang, qLabel)
    const intro =
      marketLang === 'en'
        ? '📬 **Half-hourly market push**\n'
        : marketLang === 'zh-Hant'
          ? '📬 **半小時行情推送**\n'
          : '📬 **半小时行情推送**\n'
    card = await buildMarketCard({
      title: hourlyMarketTitle(marketLang),
      snap,
      lang: marketLang,
      question: qLabel,
      mode: 'hourly',
      intro,
      template: 'wathet',
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'market fetch failed',
      slotKey,
      lang: marketLang,
    })
  }

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

  const sent = await readSent()
  // Idempotent for cron and manual — only force=true re-pushes the same slot.
  if (!force && sent[slotKey]) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_this_slot',
      slotKey,
      sentAt: sent[slotKey],
      via: cron ? 'cron' : 'manual',
    })
  }

  // Prefer chat_id (oc_…) DM/group; fall back to open_id if chat send fails and open_id is known
  try {
    await sendCardToChat(chat.chatId, card)
    await markSent(slotKey)
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
      await markSent(slotKey)
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
