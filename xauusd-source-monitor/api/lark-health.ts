/**
 * GET /api/lark-health — lightweight readiness for Lark ops dashboards.
 * Mirrors key fields from GET /api/lark/event without the heavy probe when possible.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { larkConfigured, probeLarkConnection } from './lark/_lib/client.js'
import { readInbound } from './lark/_lib/inboundLog.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })
  const probe = await probeLarkConnection()
  const recent = readInbound(5)
  return res.status(200).json({
    ok: true,
    service: 'quote-lark-bot',
    mode: 've-risk-copilot',
    openai: Boolean(process.env.OPENAI_API_KEY),
    larkWebhook: true,
    larkConfigured: larkConfigured(),
    tokenOk: probe.tokenOk,
    botName: probe.botName || null,
    eventsDelivered: recent.length > 0,
    webhook: 'https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event',
    webhookAliases: [
      'https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event',
      'https://quote-ai-troubleshooting-bot.vercel.app/api/lark/events',
    ],
    deskBase: 'https://quote-ai-troubleshooting-bot.vercel.app',
    runtime: 'vercel',
  })
}
