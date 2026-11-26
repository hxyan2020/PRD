/**
 * GET/POST /api/lark/token-usage-report
 * - Daily 18:00 Asia/Singapore → DM Yan Haixiang only (private desk push).
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send.
 * - Idempotent dayKey; cron-tick catch-up after 18:00 SGT if :00 UTC fire missed.
 * - Not shown on greeting cards.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { simpleCard } from './_lib/cards.js'
import {
  larkConfigured,
  resolveAdminOpenId,
  sendCardToChat,
  sendCardToOpenId,
} from './_lib/client.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { touchCronHeartbeat } from './_lib/cronHeartbeat.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import { resolveDailyMarketLang } from './_lib/market.js'
import type { Lang } from './_lib/types.js'
import {
  TOKEN_USAGE_START_HM,
  formatTokenUsageReport,
  isTokenUsageSlot,
  loadTokenUsage,
  recordTokenUsage,
  sgtDayKey,
  sgtHm,
  sumLast24h,
  tokenUsageReportTitle,
} from './_lib/tokenUsage.js'

/** Same Yan DM chat as half-hour market when set. */
export const DEFAULT_TOKEN_USAGE_CHAT_ID = 'oc_430fae67dd06b70f65b726b1673ef40e'

function resolveChatId(reqChatId?: string): { chatId: string; source: string } {
  const fromReq = (reqChatId || '').trim()
  if (fromReq) return { chatId: fromReq, source: 'request' }
  const fromEnv = (
    process.env.LARK_TOKEN_USAGE_CHAT_ID ||
    process.env.LARK_MARKET_CHAT_ID ||
    process.env.LARK_ADMIN_CHAT_ID ||
    ''
  ).trim()
  if (fromEnv) return { chatId: fromEnv, source: 'env' }
  return { chatId: DEFAULT_TOKEN_USAGE_CHAT_ID, source: 'default' }
}

export const config = {
  maxDuration: 60,
}

const SENT_NAME = 'token-usage-daily-sent.json'

async function readSent(): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(SENT_NAME)) || {}
}

async function markSent(dayKey: string): Promise<boolean> {
  const map = await readSent()
  const cutoff = Date.now() - 14 * 24 * 3600_000
  for (const [k, ts] of Object.entries(map)) {
    if (typeof ts === 'number' && ts < cutoff) delete map[k]
  }
  map[dayKey] = Date.now()
  return writeDurableJson(SENT_NAME, map)
}

export { isTokenUsageSlot, TOKEN_USAGE_START_HM }

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
    openId?: string
    chatId?: string
    lang?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const force = body.force === true || String(q.force || '') === '1'

  if (cron && !dry) {
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      outcome: 'ok',
      reason: force ? 'invoke_force' : 'invoke',
    })
  }

  const now = Date.now()
  const dayKey = sgtDayKey(now)
  const chat = resolveChatId(body.chatId || String(q.chatId || ''))
  const adminEarly = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId({ preferChatId: chat.chatId })
  const { lang: marketLang, source: langSource } = await resolveDailyMarketLang({
    chatId: chat.chatId,
    openId: adminEarly.openId,
    hint: body.lang || String(q.lang || '') || null,
  })
  const lang = marketLang as Lang

  let markdown = ''
  let card: Record<string, unknown>
  try {
    markdown = await formatTokenUsageReport(lang)
    card = simpleCard(tokenUsageReportTitle(lang), markdown, 'indigo')
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'token usage build failed',
      dayKey,
      lang,
    })
  }

  // dry=1 always returns preview (even with x-vercel-cron) — never send / never skip.
  if (dry) {
    // Optional blob write probe: ?touch=1 records 1+1 tokens (cron/desk only).
    let touched = false
    if (String(q.touch || '') === '1' || body.touch === true) {
      touched = await recordTokenUsage({
        prompt: 1,
        completion: 1,
        source: 'other',
      })
      markdown = await formatTokenUsageReport(lang)
      card = simpleCard(tokenUsageReportTitle(lang), markdown, 'indigo')
    }
    const store = await loadTokenUsage()
    const last24 = sumLast24h(store, now)
    return res.status(200).json({
      ok: true,
      dry: true,
      dayKey,
      hm: sgtHm(now),
      startHm: TOKEN_USAGE_START_HM,
      isTokenSlot: isTokenUsageSlot(now),
      touched,
      markdown,
      card,
      lang,
      langSource,
      store: {
        allTime: store.allTime,
        last24,
        hourBuckets: Object.keys(store.hours).length,
        updatedAt: store.updatedAt,
      },
      schedule: `Daily ${TOKEN_USAGE_START_HM} Asia/Singapore (cron: 0 10 * * * UTC; cron-tick catch-up after 18:00)`,
      recipient: 'Yan Haixiang',
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

  // Cron / cron-tick: do not fire before 18:00 SGT. Catch-up after is OK.
  if (cron && !force && !isTokenUsageSlot(now)) {
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: 200,
      outcome: 'skipped',
      reason: 'before_token_slot',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'before_token_slot',
      dayKey,
      hm: sgtHm(now),
      startHm: TOKEN_USAGE_START_HM,
      via: 'cron',
    })
  }

  const sent = await readSent()
  if (!force && sent[dayKey]) {
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: 200,
      outcome: 'skipped',
      reason: 'already_sent_today',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'already_sent_today',
      dayKey,
      sentAt: sent[dayKey],
      via: cron ? 'cron' : 'manual',
    })
  }

  const admin =
    adminEarly.openId
      ? adminEarly
      : body.openId?.trim()
        ? { openId: body.openId.trim(), source: 'request' }
        : await resolveAdminOpenId({ preferChatId: chat.chatId })

  async function finishSent(via: string, extra: Record<string, string> = {}) {
    const persisted = await markSent(dayKey)
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: persisted ? 200 : 502,
      outcome: 'sent',
      reason: persisted ? via : 'sent_but_blob_failed',
    })
    if (!persisted) {
      return res.status(502).json({
        ok: false,
        sent: true,
        error: 'token_usage_sent_state_blob_failed',
        dayKey,
        via,
        ...extra,
      })
    }
    return res.status(200).json({
      ok: true,
      sent: true,
      dayKey,
      lang,
      langSource,
      via,
      ...extra,
    })
  }

  // Prefer Yan open_id 私聊 (same as cron-health). Chat-id is fallback only.
  if (admin.openId) {
    try {
      await sendCardToOpenId(admin.openId, card)
      return await finishSent('open_id', {
        recipientOpenId: admin.openId.slice(0, 8) + '…',
        recipientSource: admin.source,
      })
    } catch (openErr) {
      console.error(
        '[token-usage] open_id send failed, trying chat_id',
        openErr instanceof Error ? openErr.message : openErr,
      )
    }
  }

  try {
    await sendCardToChat(chat.chatId, card)
    return await finishSent('chat_id', {
      recipientChatId: chat.chatId.slice(0, 10) + '…',
      recipientSource: chat.source,
    })
  } catch (chatErr) {
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: 502,
      outcome: 'error',
      reason: chatErr instanceof Error ? chatErr.message : 'send failed',
    })
    return res.status(502).json({
      ok: false,
      error: chatErr instanceof Error ? chatErr.message : 'send failed',
      dayKey,
      chatId: chat.chatId,
      triedOpenId: Boolean(admin.openId),
      hint: 'Set LARK_ADMIN_OPEN_ID or LARK_TOKEN_USAGE_CHAT_ID on Vercel.',
    })
  }
}
