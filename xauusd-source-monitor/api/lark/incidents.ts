/**
 * GET /api/lark/incidents — list accumulated incidents for review (desk token).
 * POST /api/lark/incidents — simulate a bot turn for smoke tests (desk token).
 *
 * Auth: X-Desk-Token must match DESK_GATEWAY_TOKEN when that env is set.
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleMessage } from './_lib/agent.js'
import { listIncidentsDurable } from './_lib/store.js'
import type { IncomingMessage } from './_lib/types.js'

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function authorize(req: VercelRequest): boolean {
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return true // allow local/smoke when desk token unset
  const provided = String(req.headers['x-desk-token'] || '')
  return safeEqual(expected, provided)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token')
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (!authorize(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const status = String(req.query.status || 'all') as 'open' | 'archived' | 'all'
    const limit = Math.min(100, Number(req.query.limit || 50))
    return res.status(200).json({
      ok: true,
      incidents: await listIncidentsDurable({ status, limit }),
    })
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as {
      text?: string
      messageType?: string
      chatId?: string
      openId?: string
      chatType?: string
    }
    const text = String(body.text || '').trim()
    if (!text) return res.status(400).json({ error: 'text required' })

    const msg: IncomingMessage = {
      messageId: `sim_${Date.now()}`,
      chatId: body.chatId || 'sim_chat',
      chatType: body.chatType || 'p2p',
      openId: body.openId || 'sim_user',
      messageType: body.messageType || 'text',
      text,
      mentionedBot: true,
      rawContent: JSON.stringify({ text }),
    }
    const reply = await handleMessage(msg)
    return res.status(200).json({
      ok: true,
      reply,
      incidents: await listIncidentsDurable({ limit: 10 }),
    })
  }

  return res.status(405).json({ error: 'GET or POST only' })
}
