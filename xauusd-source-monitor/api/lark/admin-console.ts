/**
 * GET/POST /api/lark/admin-console
 * Build (dry) or push Yan Haixiang’s private desk console via open_id DM.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, resolveAdminOpenId, sendCardToOpenId } from './_lib/client.js'
import { allowCronOrDesk, isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import { buildAdminConsoleCard } from './_lib/adminConsole.js'
import type { Lang } from './_lib/types.js'

export const config = {
  maxDuration: 60,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCronRouteHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (!allowCronOrDesk(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' })
  }

  const cron = isVercelCron(req)
  const q = req.query || {}
  const body = (req.body || {}) as {
    dry?: boolean
    force?: boolean
    openId?: string
    lang?: string
  }
  const dry =
    String(q.dry || '') === '1' ||
    body.dry === true ||
    (req.method === 'GET' && !cron && String(q.send || '') !== '1')
  const lang: Lang =
    body.lang === 'en' || body.lang === 'zh-Hant' || String(q.lang || '') === 'en'
      ? ((body.lang || q.lang) as Lang)
      : 'zh-Hans'

  const admin = body.openId?.trim()
    ? { openId: body.openId.trim(), source: 'request' }
    : await resolveAdminOpenId()

  const card = await buildAdminConsoleCard({
    lang,
    openId: admin.openId || undefined,
  })

  if (dry) {
    return res.status(200).json({
      ok: true,
      dry: true,
      recipientOpenId: admin.openId
        ? admin.openId.slice(0, 8) + '…'
        : null,
      recipientSource: admin.source,
      card,
    })
  }

  if (!larkConfigured()) {
    return res.status(503).json({ ok: false, error: 'Lark not configured' })
  }
  if (!admin.openId || !admin.openId.startsWith('ou_')) {
    return res.status(400).json({
      ok: false,
      error: 'LARK_ADMIN_OPEN_ID missing — cannot DM Haixiang',
    })
  }

  try {
    const sent = await sendCardToOpenId(admin.openId, card)
    return res.status(200).json({
      ok: true,
      sent: true,
      messageId: sent.messageId,
      via: 'open_id',
      recipientOpenId: admin.openId.slice(0, 8) + '…',
      recipientSource: admin.source,
    })
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'send failed',
    })
  }
}
