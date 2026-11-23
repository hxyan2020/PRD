/**
 * Lark / Feishu event webhook — POST /api/lark/event
 *
 * Subscribe in Lark Developer Console:
 *   Request URL: https://vex-llm-proxy.vercel.app/api/lark/event
 *   Events: im.message.receive_v1, card.action.trigger
 *
 * Env: LARK_APP_ID, LARK_APP_SECRET
 * Optional: LARK_VERIFICATION_TOKEN, LARK_ENCRYPT_KEY, LARK_BOT_OPEN_ID, OPENAI_API_KEY
 *
 * Web SPA remains unchanged at / — this endpoint is additive.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCardAction, handleMessage } from './_lib/agent'
import { larkConfigured, replyCard, replyText, sendCardToChat, sendTextToChat, verifyToken } from './_lib/client'
import { parseIncomingEvent, shouldRespond } from './_lib/parse'

export const config = {
  api: { bodyParser: true },
}

function readBody(req: VercelRequest): Record<string, unknown> {
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return {}
}

async function dispatchReply(
  messageId: string,
  chatId: string,
  reply: { text?: string; card?: Record<string, unknown> },
) {
  if (reply.card) {
    try {
      await replyCard(messageId, reply.card)
      return
    } catch {
      try {
        await sendCardToChat(chatId, reply.card)
        return
      } catch {
        /* fall through to text */
      }
    }
  }
  if (reply.text) {
    try {
      await replyText(messageId, reply.text)
    } catch {
      await sendTextToChat(chatId, reply.text)
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 've-lark-risk-bot',
      larkConfigured: larkConfigured(),
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
      hasVerificationToken: Boolean(process.env.LARK_VERIFICATION_TOKEN),
      endpoints: {
        event: '/api/lark/event',
        incidents: '/api/lark/incidents',
      },
      web: 'https://vex-llm-proxy.vercel.app/',
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = readBody(req)

  // URL verification (challenge)
  if (body.type === 'url_verification' || body.challenge) {
    const token = String(body.token || '')
    if (!verifyToken(token || undefined) && process.env.LARK_VERIFICATION_TOKEN) {
      return res.status(401).json({ error: 'invalid verification token' })
    }
    return res.status(200).json({ challenge: body.challenge })
  }

  // Schema 2.0 envelope
  const header = (body.header || {}) as Record<string, unknown>
  const eventType = String(header.event_type || body.type || '')
  const token = String(header.token || body.token || '')
  if (process.env.LARK_VERIFICATION_TOKEN && !verifyToken(token)) {
    return res.status(401).json({ error: 'invalid verification token' })
  }

  // Ack immediately pattern: Vercel should finish within timeout; we process inline
  // (Lark retries on non-2xx). Return 200 ASAP after work for typical messages.
  try {
    if (eventType === 'im.message.receive_v1' || body.event) {
      const event = (body.event || body) as Record<string, unknown>

      // Card action (schema 2.0 may use card.action.trigger)
      if (eventType === 'card.action.trigger') {
        const operator = (event.operator || {}) as { open_id?: string }
        const action = (event.action || {}) as { value?: Record<string, unknown> }
        const context = (event.context || {}) as {
          open_message_id?: string
          open_chat_id?: string
        }
        const value =
          typeof action.value === 'string'
            ? (JSON.parse(action.value) as Record<string, unknown>)
            : action.value || {}
        const reply = await handleCardAction({
          openId: operator.open_id || 'unknown',
          chatId: context.open_chat_id || '',
          messageId: context.open_message_id || '',
          value,
        })
        if (context.open_message_id && context.open_chat_id) {
          await dispatchReply(context.open_message_id, context.open_chat_id, reply)
        }
        return res.status(200).json({ ok: true })
      }

      if (eventType === 'im.message.receive_v1' || (event as { message?: unknown }).message) {
        const msg = parseIncomingEvent(event)
        if (!msg) return res.status(200).json({ ok: true, skipped: 'parse' })
        if (!shouldRespond(msg)) {
          return res.status(200).json({ ok: true, skipped: 'no_mention' })
        }
        if (!larkConfigured()) {
          return res.status(200).json({
            ok: false,
            error: 'LARK_APP_ID / LARK_APP_SECRET not configured on host',
          })
        }
        const reply = await handleMessage(msg)
        if (reply) await dispatchReply(msg.messageId, msg.chatId, reply)
        return res.status(200).json({ ok: true })
      }
    }

    // Older callback style: { uuid, event: { type, ... } }
    const legacy = body.event as Record<string, unknown> | undefined
    if (legacy && legacy.type === 'message') {
      // Best-effort map — rare
      return res.status(200).json({ ok: true, skipped: 'legacy_message' })
    }

    return res.status(200).json({ ok: true, ignored: eventType || 'unknown' })
  } catch (e) {
    console.error('[lark/event]', e)
    // Still 200 to avoid infinite Lark retries for logic bugs; log for ops.
    return res.status(200).json({
      ok: false,
      error: e instanceof Error ? e.message : 'handler error',
    })
  }
}
