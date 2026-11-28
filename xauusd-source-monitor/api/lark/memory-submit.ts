/**
 * POST /api/lark/memory-submit — web/Lark desk: propose Skills/KB change.
 * GET  /api/lark/memory-submit — list open submissions (desk token).
 *
 * Auth: X-Desk-Token when DESK_GATEWAY_TOKEN is set; cron header also allowed.
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveAdminOpenId, sendCardToOpenId } from './_lib/client.js'
import { isVercelCron, setCronRouteHeaders } from './_lib/cronAuth.js'
import {
  memoryAdminReviewCard,
  memorySubmitterAckCard,
} from './_lib/memorySubmitCards.js'
import {
  createMemorySubmission,
  listMemorySubmissions,
  type MemoryKind,
  type MemoryOp,
  type MemoryKbPayload,
  type MemorySkillPayload,
} from './_lib/memorySubmit.js'
import type { Lang } from './_lib/types.js'

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function authorize(req: VercelRequest): boolean {
  if (isVercelCron(req)) return true
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return true
  const provided = String(req.headers['x-desk-token'] || '')
  return safeEqual(expected, provided)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCronRouteHeaders(res)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Desk-Token, Authorization',
  )
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (!authorize(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const status = String(req.query.status || 'open') as
      | 'open'
      | 'pending'
      | 'approved'
      | 'rejected'
      | 'deleted'
    const limit = Math.min(100, Number(req.query.limit || 50))
    const items = await listMemorySubmissions({
      status: status === 'open' ? 'open' : (status as 'pending'),
      limit,
    })
    return res.status(200).json({ ok: true, items })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' })
  }

  const body = (req.body || {}) as {
    kind?: string
    op?: string
    payload?: MemorySkillPayload | MemoryKbPayload
    note?: string
    submitterOpenId?: string
    submitterName?: string
    submitterEmail?: string
    lang?: string
    notifyAdmin?: boolean
  }

  const kind = (body.kind === 'knowledge' ? 'knowledge' : 'skill') as MemoryKind
  const op = (
    ['create', 'update', 'delete', 'append'].includes(String(body.op || ''))
      ? body.op
      : 'update'
  ) as MemoryOp
  const payload = body.payload
  if (!payload || !String((payload as { id?: string }).id || '').trim()) {
    return res.status(400).json({ error: 'payload.id required' })
  }

  const submitterOpenId = String(body.submitterOpenId || 'web_user').trim()
  const item = await createMemorySubmission({
    kind,
    op,
    payload,
    note: body.note,
    submitterOpenId,
    submitterName: body.submitterName,
    submitterEmail: body.submitterEmail,
    source: 'web',
  })

  const lang: Lang =
    body.lang === 'en' || body.lang === 'zh-Hant' ? body.lang : 'zh-Hans'

  let adminNotified = false
  if (body.notifyAdmin !== false) {
    try {
      const admin = await resolveAdminOpenId()
      if (admin.openId) {
        await sendCardToOpenId(admin.openId, memoryAdminReviewCard(lang, item))
        adminNotified = true
      }
    } catch {
      /* ignore notify failures */
    }
  }

  return res.status(200).json({
    ok: true,
    item,
    adminNotified,
    ackCard: memorySubmitterAckCard(lang, item),
  })
}
