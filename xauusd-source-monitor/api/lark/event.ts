/**
 * Lark / Feishu event webhook — POST /api/lark/event
 *
 * Subscribe in Lark Developer Console:
 *   Request URL: https://vex-llm-proxy.vercel.app/api/lark/event
 *   Events: im.message.receive_v1, card.action.trigger
 *
 * Minimum secrets: LARK_APP_ID + LARK_APP_SECRET (set on Vercel).
 * Optional: LARK_VERIFICATION_TOKEN (recommended), LARK_BOT_OPEN_ID (auto-fetched).
 * Keep Encrypt Key OFF in Lark console (encrypt envelope not supported).
 *
 * Web SPA remains unchanged at / — this endpoint is additive.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCardAction, handleMessage } from './_lib/agent.js'
import {
  isEncryptedEnvelope,
  larkConfigured,
  probeLarkConnection,
  replyCard,
  replyText,
  resolveBotOpenId,
  sendCardToChat,
  sendTextToChat,
  verifyToken,
} from './_lib/client.js'
import { parseIncomingEvent, shouldRespond } from './_lib/parse.js'

const APP_ID = process.env.LARK_APP_ID || ''
const BOT_APPLINK_FEISHU = APP_ID
  ? `https://applink.feishu.cn/client/bot/open?appId=${APP_ID}`
  : ''
const BOT_APPLINK_LARK = APP_ID
  ? `https://applink.larksuite.com/client/bot/open?appId=${APP_ID}`
  : ''

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
    const probe = await probeLarkConnection()
    const secretsOk = larkConfigured()
    const chatReady = probe.tokenOk && probe.chatCount > 0
    return res.status(200).json({
      ok: true,
      service: 've-lark-risk-bot',
      larkConfigured: secretsOk,
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
      hasVerificationToken: Boolean(process.env.LARK_VERIFICATION_TOKEN),
      hasEncryptKey: Boolean(process.env.LARK_ENCRYPT_KEY),
      encryptSupported: false,
      readyForConversation: secretsOk && probe.tokenOk,
      chatReady,
      missingSecrets: [
        !process.env.LARK_APP_ID ? 'LARK_APP_ID' : '',
        !process.env.LARK_APP_SECRET ? 'LARK_APP_SECRET' : '',
      ].filter(Boolean),
      bot: {
        name: probe.botName || null,
        openId: probe.botOpenId || process.env.LARK_BOT_OPEN_ID || null,
        tokenOk: probe.tokenOk,
        chatCount: probe.chatCount,
        chatNames: probe.chatNames,
        error: probe.error || null,
        openDmFeishu: BOT_APPLINK_FEISHU || null,
        openDmLark: BOT_APPLINK_LARK || null,
      },
      webhook: 'https://vex-llm-proxy.vercel.app/api/lark/event',
      endpoints: {
        event: '/api/lark/event',
        incidents: '/api/lark/incidents',
      },
      web: 'https://vex-llm-proxy.vercel.app/',
      nextStep: !secretsOk
        ? 'Set LARK_APP_ID + LARK_APP_SECRET on Vercel.'
        : !probe.tokenOk
          ? `Lark token failed: ${probe.error || 'check App ID/Secret'}`
          : probe.chatCount === 0
            ? 'Server is connected. Open a DM with the bot (applink) or add it to a group, then ensure Event Subscription URL is set. Keep Encrypt Key OFF.'
            : 'Connected. @ the bot in a group or message it in DM.',
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = readBody(req)

  if (isEncryptedEnvelope(body)) {
    return res.status(200).json({
      ok: false,
      error:
        'Encrypted Lark event received, but decrypt is not enabled. In Lark Developer Console → Event Subscription, turn Encrypt Key OFF (or leave empty), then re-save the Request URL.',
    })
  }

  // Warm bot open_id cache (non-blocking best-effort) so group @ matching improves after first events
  if (larkConfigured() && !process.env.LARK_BOT_OPEN_ID) {
    void resolveBotOpenId().then((id) => {
      if (id) process.env.LARK_BOT_OPEN_ID = id
    })
  }

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
