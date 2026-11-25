/**
 * GET/POST /api/lark/token-usage-report
 * - Daily private DM to Yan Haixiang with agent token usage.
 * - Window: from **18:00 SGT** (Asia/Singapore = UTC+8), catch-up until next day
 *   (idempotent via dayKey).
 * - Vercel Cron: `0 10 * * *` UTC (= 18:00 SGT) + cron-tick fan-out.
 * - Manual: GET ?dry=1 preview; POST { force: true } re-send (desk token when set).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { simpleCard } from './_lib/cards.js'
import { larkConfigured, resolveAdminOpenId, sendCardToOpenId } from './_lib/client.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { touchCronHeartbeat } from './_lib/cronHeartbeat.js'
import { readDurableJson, writeDurableJson } from './_lib/durableJson.js'
import { shanghaiDayKey } from './_lib/market.js'
import { shanghaiHm } from './_lib/oscillationAlert.js'
import { formatTokenUsageDailyReport } from './_lib/tokenUsage.js'
import type { Lang } from './_lib/types.js'

/** 18:00 SGT (= Asia/Shanghai UTC+8 wall clock). Override with LARK_TOKEN_USAGE_START. */
export const TOKEN_USAGE_START_HM =
  (process.env.LARK_TOKEN_USAGE_START || '').trim() || '18:00'

/** True once the 18:00 SGT slot has opened (idempotent via dayKey sent-state). */
export function isTokenUsageSlot(ts: number = Date.now()): boolean {
  return shanghaiHm(ts) >= TOKEN_USAGE_START_HM
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

function resolveLang(hint?: string): Lang {
  const h = (hint || '').trim().toLowerCase()
  if (h === 'en' || h.startsWith('en-')) return 'en'
  if (h === 'zh-hant' || h === 'zh-tw' || h === 'zh-hk') return 'zh-Hant'
  return 'zh-Hans'
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
    openId?: string
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
  const dayKey = shanghaiDayKey(now)
  const lang = resolveLang(body.lang || String(q.lang || ''))
  const report = await formatTokenUsageDailyReport(lang, dayKey)
  const card = simpleCard(report.title, report.markdown, 'purple')

  const resolvedEarly = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId()

  if (dry && !cron) {
    return res.status(200).json({
      ok: true,
      dry: true,
      dayKey,
      hm: shanghaiHm(now),
      startHm: TOKEN_USAGE_START_HM,
      isTokenUsageSlot: isTokenUsageSlot(now),
      lang,
      title: report.title,
      markdown: report.markdown,
      card,
      schedule: 'Daily 18:00 SGT (cron: 0 10 * * * UTC; cron-tick catch-up after 18:00)',
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
      dayKey,
      dryPreview: report.markdown,
    })
  }

  // Cron / cron-tick: do not fire before 18:00 SGT. Catch-up after is OK (dayKey).
  if (cron && !force && !isTokenUsageSlot(now)) {
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: 200,
      outcome: 'skipped',
      reason: 'before_token_usage_slot',
    })
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'before_token_usage_slot',
      dayKey,
      hm: shanghaiHm(now),
      startHm: TOKEN_USAGE_START_HM,
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
    })
  }

  if (!resolvedEarly.openId) {
    return res.status(400).json({
      ok: false,
      error:
        'Admin open_id missing. Set LARK_ADMIN_OPEN_ID (Yan Haixiang) or LARK_ADMIN_EMAIL on Vercel.',
      dayKey,
      dryPreview: report.markdown,
    })
  }

  try {
    await sendCardToOpenId(resolvedEarly.openId, card)
    const persisted = await markSent(dayKey)
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: persisted ? 200 : 502,
      outcome: 'sent',
      reason: persisted ? 'healthy' : 'sent_but_blob_failed',
    })
    if (!persisted) {
      return res.status(502).json({
        ok: false,
        sent: true,
        error: 'token_usage_sent_state_blob_failed',
        dayKey,
      })
    }
    return res.status(200).json({
      ok: true,
      sent: true,
      dayKey,
      recipientOpenId: resolvedEarly.openId.slice(0, 8) + '…',
      recipientSource: resolvedEarly.source,
    })
  } catch (e) {
    await touchCronHeartbeat('/api/lark/token-usage-report', {
      status: 502,
      outcome: 'error',
      reason: e instanceof Error ? e.message : 'send failed',
    })
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
      dayKey,
    })
  }
}
