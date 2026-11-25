/**
 * GET/POST /api/lark/daily-market-report
 * - Vercel Cron every day 09:00 Asia/Shanghai (01:00 UTC) → group 24h market digest.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 * - Idempotent: without force, already-sent dayKey is skipped (cron AND manual) so
 *   verify/retry curls cannot double-push the morning card.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { atOpenIdMarkdown, larkConfigured, resolveAdminOpenId, sendCardToChat } from './_lib/client.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import {
  buildMarketCard,
  dailyMarketIntro,
  dailyMarketTitle,
  fetchMarketSnapshot,
  formatDaily24hMarketAnswerAsync,
  resolveDailyMarketLang,
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

const SENT_NAME = 'market-daily-sent.json'

async function readSent(): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(SENT_NAME)) || {}
}

async function markSent(dayKey: string) {
  const map = await readSent()
  const cutoff = Date.now() - 14 * 24 * 3600_000
  for (const [k, ts] of Object.entries(map)) {
    if (typeof ts === 'number' && ts < cutoff) delete map[k]
  }
  map[dayKey] = Date.now()
  await writeDurableJson(SENT_NAME, map)
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
    chatId?: string
    lang?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  const now = Date.now()
  const dayKey = shanghaiDayKey(now)
  const chat = resolveDailyChatId(body.chatId || String(q.chatId || ''))
  const langHint = body.lang || String(q.lang || '')
  let markdown = ''
  let card: Record<string, unknown>
  let adminOpenId = ''
  let adminSource = 'missing'
  let marketLang: 'en' | 'zh-Hans' | 'zh-Hant' = 'zh-Hans'
  let langSource = 'default_zh_hans'
  try {
    const admin = await resolveAdminOpenId({ preferChatId: chat.chatId })
    adminOpenId = admin.openId
    adminSource = admin.source
    const resolvedLang = await resolveDailyMarketLang({
      chatId: chat.chatId,
      openId: adminOpenId,
      hint: langHint || null,
    })
    marketLang = resolvedLang.lang
    langSource = resolvedLang.source
    const at = atOpenIdMarkdown(adminOpenId)
    const snap = await fetchMarketSnapshot()
    // Fresh snapshot; language follows user/chat (简体 ≠ 繁體 ≠ en).
    // Source links are 404-checked before cite (async).
    markdown = await formatDaily24hMarketAnswerAsync(snap, marketLang)
    card = await buildMarketCard({
      title: dailyMarketTitle(marketLang),
      snap,
      lang: marketLang,
      mode: 'daily',
      intro: dailyMarketIntro(marketLang, dayKey, at),
      template: 'wathet',
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'market fetch failed',
      dayKey,
      lang: marketLang,
      langSource,
    })
  }

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      dayKey,
      lang: marketLang,
      langSource,
      markdown,
      card,
      schedule: 'Daily 09:00 Asia/Shanghai (cron: 0 1 * * * UTC)',
      chatId: chat.chatId,
      chatSource: chat.source,
      adminOpenId: adminOpenId ? adminOpenId.slice(0, 8) + '…' : null,
      adminSource,
      hasRealAt: Boolean(adminOpenId?.startsWith('ou_')),
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

  const sent = await readSent()
  // Skip for both cron and manual unless force=true — prevents double-push from
  // verify curls / accidental POST after a successful send the same day.
  if (!force && sent[dayKey]) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_today',
      dayKey,
      sentAt: sent[dayKey],
      via: cron ? 'cron' : 'manual',
    })
  }

  try {
    await sendCardToChat(chat.chatId, card)
    await markSent(dayKey)
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
