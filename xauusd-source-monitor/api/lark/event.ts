/**
 * Lark / Feishu event webhook — POST /api/lark/event
 *
 * Subscribe in Lark Developer Console:
 *   Event Request URL: https://vex-llm-proxy.vercel.app/api/lark/event
 *   Events: im.message.receive_v1, card.action.trigger
 *   Card Request URL (消息卡片请求网址): same URL (or /api/lark/card)
 *   — without Card Request URL, tapping buttons shows
 *     “Card callback isn't configured”. Investigation cards ship
 *     step / report / archive / review buttons that call this handler.
 *
 * Minimum secrets: LARK_APP_ID + LARK_APP_SECRET (set on Vercel).
 * Optional: LARK_VERIFICATION_TOKEN (recommended), LARK_BOT_OPEN_ID (auto-fetched).
 * Keep Encrypt Key OFF in Lark console (encrypt envelope not supported).
 *
 * Web SPA remains unchanged at / — this endpoint is additive.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { waitUntil } from '@vercel/functions'
import { handleCardAction, handleMessage } from './_lib/agent.js'
import {
  fetchUserDisplayName,
  isEncryptedEnvelope,
  larkConfigured,
  looksLikeAdminName,
  probeLarkConnection,
  rememberAdminOpenId,
  resolveBotOpenId,
  verifyToken,
} from './_lib/client.js'
import { claimOnce } from './_lib/dedupe.js'
import { logInbound, readInbound } from './_lib/inboundLog.js'
import { parseIncomingEvent, shouldRespond } from './_lib/parse.js'
import { dispatchReplyWithTypingEffect, startTypingSession } from './_lib/typing.js'

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

/**
 * Send outbound reply with typing indicator + progressive reveal.
 * Do NOT fall back from reply→sendChat after a successful first post (double-post risk).
 */
async function dispatchReply(
  messageId: string,
  chatId: string,
  reply: {
    text?: string
    card?: Record<string, unknown>
    followUpCards?: Record<string, unknown>[]
  },
): Promise<{ ok: boolean; via?: string; error?: string }> {
  const result = await dispatchReplyWithTypingEffect(messageId, chatId, reply)
  if (!result.ok) {
    console.error('[lark/dispatch] failed', result.error || 'unknown')
  }
  return result
}

function dedupeKey(header: Record<string, unknown>, messageId?: string, cardToken?: string) {
  const eventId = String(header.event_id || '')
  if (eventId) return `evt:${eventId}`
  if (cardToken) return `card:${cardToken}`
  if (messageId) return `msg:${messageId}`
  return ''
}

/** Shared card-action path for event subscription + Card Request URL callbacks. */
async function handleCardActionRequest(
  _req: VercelRequest,
  res: VercelResponse,
  args: {
    header: Record<string, unknown>
    event: Record<string, unknown>
    eventType: string
  },
) {
  const operator = (args.event.operator || {}) as { open_id?: string }
  const action = (args.event.action || args.event) as {
    value?: Record<string, unknown> | string
    tag?: string
  }
  const context = (args.event.context || {}) as {
    open_message_id?: string
    open_chat_id?: string
  }
  // Legacy Card Request URL may put ids on the root event
  const openId =
    operator.open_id ||
    String(args.event.open_id || args.event.openId || 'unknown')
  const messageId =
    context.open_message_id ||
    String(args.event.open_message_id || args.event.openMessageId || '')
  const chatId =
    context.open_chat_id ||
    String(args.event.open_chat_id || args.event.openChatId || args.event.chat_id || '')
  let value: Record<string, unknown> = {}
  try {
    value =
      typeof action.value === 'string'
        ? (JSON.parse(action.value) as Record<string, unknown>)
        : (action.value as Record<string, unknown>) || {}
  } catch {
    value = {}
  }
  const key = dedupeKey(
    args.header,
    messageId,
    `${messageId}:${String(value.action || '')}:${String(value.incidentId || '')}:${String(value.bar || '')}`,
  )
  if (key && !claimOnce(key)) {
    logInbound({
      at: new Date().toISOString(),
      kind: 'card_action',
      eventType: args.eventType,
      messageId,
      result: 'skipped:deduped',
    })
    return res.status(200).json({
      toast: { type: 'info', content: 'Already handled' },
    })
  }

  // Market K-line interval switch — MUST ack Feishu within 3s (error 200341 on timeout).
  // Rebuild fetches OKX + hourly scan (often >3s); toast first, then delayed-update via
  // callback token (interactive/v1/card/update). Message PUT alone often leaves the
  // chart stuck on the old interval after a toast-only ack.
  const isKlineTf = String(value.action || '') === 'market_kline_tf'
  if (isKlineTf) {
    const bar = String(value.bar || '1H')
    // card.action.trigger → event.token; Card Request URL → body.token on event root
    const callbackToken = String(
      args.event.token || (args.event as { action_token?: string }).action_token || '',
    ).trim()
    waitUntil(
      (async () => {
        try {
          // Feishu: delayed update must run AFTER the toast HTTP response, not in parallel.
          await new Promise((r) => setTimeout(r, 150))
          const reply = await handleCardAction({
            openId,
            chatId,
            messageId,
            value,
          })
          if (!reply.card) {
            logInbound({
              at: new Date().toISOString(),
              kind: 'card_action',
              eventType: args.eventType,
              openId,
              chatId,
              messageId,
              result: 'fail:kline_tf_no_card',
            })
            return
          }
          const { updateCardByCallbackToken, updateMessageCard } = await import(
            './_lib/client.js'
          )
          let via = 'callback_token'
          if (callbackToken) {
            await updateCardByCallbackToken(callbackToken, reply.card, {
              openIds: openId.startsWith('ou_') ? [openId] : [],
            })
          } else if (messageId) {
            via = 'message_put_fallback'
            await updateMessageCard(messageId, reply.card)
          } else {
            logInbound({
              at: new Date().toISOString(),
              kind: 'card_action',
              eventType: args.eventType,
              openId,
              chatId,
              messageId,
              result: 'fail:kline_tf_no_token_or_message',
            })
            return
          }
          logInbound({
            at: new Date().toISOString(),
            kind: 'card_action',
            eventType: args.eventType,
            openId,
            chatId,
            messageId,
            result: `ok:kline_tf_async:${bar}:${via}`,
          })
        } catch (e) {
          logInbound({
            at: new Date().toISOString(),
            kind: 'card_action',
            eventType: args.eventType,
            error: e instanceof Error ? e.message : 'kline tf error',
            result: 'error:kline_tf_async',
          })
        }
      })(),
    )
    return res.status(200).json({
      toast: {
        type: 'info',
        content: `Switching to ${bar}…`,
        i18n: {
          zh_cn: `正在切换到 ${bar}…`,
          zh_hk: `正在切換到 ${bar}…`,
          zh_tw: `正在切換到 ${bar}…`,
          en_us: `Switching to ${bar}…`,
        },
      },
    })
  }

  // Nudge「知道了」must durable-ack BEFORE toast — waitUntil alone raced cron
  // when Blob writes failed silently and state lived only in /tmp.
  const isNudgeAck = String(value.action || '') === 'alert_nudge_ack'
  if (isNudgeAck) {
    try {
      const reply = await handleCardAction({
        openId,
        chatId,
        messageId,
        value,
      })
      if (messageId || chatId) {
        waitUntil(dispatchReply(messageId, chatId, reply).then(() => undefined))
      }
      logInbound({
        at: new Date().toISOString(),
        kind: 'card_action',
        eventType: args.eventType,
        openId,
        chatId,
        messageId,
        result: 'ok:nudge_ack_sync',
      })
      return res.status(200).json({
        toast: {
          type: 'success',
          content: 'Stopped',
          i18n: { zh_cn: '已停止提醒', zh_hk: '已停止提醒', en_us: 'Stopped' },
        },
      })
    } catch (e) {
      logInbound({
        at: new Date().toISOString(),
        kind: 'card_action',
        eventType: args.eventType,
        error: e instanceof Error ? e.message : 'nudge ack error',
        result: 'error',
      })
      return res.status(200).json({
        toast: {
          type: 'error',
          content: 'Stop failed',
          i18n: { zh_cn: '停止失败，请回复：知道了', zh_hk: '停止失敗，請回覆：知道了', en_us: 'Reply 知道了' },
        },
      })
    }
  }

  waitUntil(
    (async () => {
      const typing = startTypingSession(messageId)
      try {
        const reply = await handleCardAction({
          openId,
          chatId,
          messageId,
          value,
        })
        await typing.stop()
        let dispatched = { ok: false as boolean, via?: string, error?: string }
        if (messageId || chatId) {
          dispatched = await dispatchReply(messageId, chatId, reply)
        }
        logInbound({
          at: new Date().toISOString(),
          kind: 'card_action',
          eventType: args.eventType,
          openId,
          chatId,
          messageId,
          result: dispatched.ok
            ? `ok:${dispatched.via}`
            : `fail:${dispatched.error || 'no_dispatch'}`,
        })
      } catch (e) {
        await typing.stop()
        logInbound({
          at: new Date().toISOString(),
          kind: 'card_action',
          eventType: args.eventType,
          error: e instanceof Error ? e.message : 'card error',
          result: 'error',
        })
      }
    })(),
  )
  // Feishu expects a toast (or card) on card callback — not only {ok:true}
  return res.status(200).json({
    toast: {
      type: 'success',
      content: 'OK',
      i18n: { zh_cn: '已处理', zh_hk: '已處理', en_us: 'Done' },
    },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const probe = await probeLarkConnection()
    const secretsOk = larkConfigured()
    const recent = readInbound(15)
    const eventsSeen = recent.length > 0
    const chatReady = probe.tokenOk && (probe.chatCount > 0 || eventsSeen)
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
      eventsDelivered: eventsSeen,
      recentInbound: recent,
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
          : !eventsSeen
            ? 'CRITICAL: No Lark events have hit this webhook. In Developer Console → Event Subscription: choose “Send to developer server” (NOT long connection), set Request URL to https://vex-llm-proxy.vercel.app/api/lark/event, pass verification, Keep Encrypt Key OFF, subscribe im.message.receive_v1, then save & publish. Message the bot again.'
            : 'Events are arriving. @ the bot in a group or message it in DM.',
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = readBody(req)
  logInbound({
    at: new Date().toISOString(),
    kind: 'post_raw',
    eventType: String((body.header as { event_type?: string } | undefined)?.event_type || body.type || ''),
    textPreview: body.encrypt ? '[encrypted]' : body.challenge ? '[challenge]' : undefined,
  })

  if (isEncryptedEnvelope(body)) {
    logInbound({
      at: new Date().toISOString(),
      kind: 'encrypt_rejected',
      result: 'need_encrypt_off',
    })
    return res.status(200).json({
      ok: false,
      error:
        'Encrypted Lark event received, but decrypt is not enabled. In Lark Developer Console → Event Subscription, turn Encrypt Key OFF (or leave empty), then re-save the Request URL.',
    })
  }

  // Resolve bot open_id before parse so group @ matching is precise (not "any @").
  if (larkConfigured()) {
    try {
      const id = await resolveBotOpenId()
      if (id) process.env.LARK_BOT_OPEN_ID = id
    } catch {
      /* soft-fail — parse falls back to bot display-name match */
    }
  }

  // URL verification (challenge)
  if (body.type === 'url_verification' || body.challenge) {
    const token = String(body.token || '')
    if (!verifyToken(token || undefined) && process.env.LARK_VERIFICATION_TOKEN) {
      logInbound({ at: new Date().toISOString(), kind: 'challenge_reject', result: 'bad_token' })
      return res.status(401).json({ error: 'invalid verification token' })
    }
    logInbound({ at: new Date().toISOString(), kind: 'challenge_ok', result: 'verified' })
    return res.status(200).json({ challenge: body.challenge })
  }

  // Schema 2.0 envelope
  const header = (body.header || {}) as Record<string, unknown>
  const eventType = String(header.event_type || body.type || '')
  const token = String(header.token || body.token || '')
  if (process.env.LARK_VERIFICATION_TOKEN && !verifyToken(token)) {
    logInbound({ at: new Date().toISOString(), kind: 'auth_reject', eventType, result: 'bad_token' })
    return res.status(401).json({ error: 'invalid verification token' })
  }

  // Ack 200 fast (Lark retries on slow/non-2xx → duplicate replies). Heavy work via waitUntil.
  try {
    if (eventType === 'im.message.receive_v1' || body.event) {
      const event = (body.event || body) as Record<string, unknown>

      // Card action (schema 2.0 event subscription)
      if (eventType === 'card.action.trigger') {
        return handleCardActionRequest(req, res, {
          header,
          event,
          eventType,
        })
      }

      if (eventType === 'im.message.receive_v1' || (event as { message?: unknown }).message) {
        const msg = parseIncomingEvent(event)
        if (!msg) {
          logInbound({
            at: new Date().toISOString(),
            kind: 'message',
            eventType,
            result: 'skipped:parse_or_bot',
          })
          return res.status(200).json({ ok: true, skipped: 'parse_or_bot' })
        }
        const key = dedupeKey(header, msg.messageId)
        if (key && !claimOnce(key)) {
          logInbound({
            at: new Date().toISOString(),
            kind: 'message',
            eventType,
            messageId: msg.messageId,
            chatId: msg.chatId,
            openId: msg.openId,
            textPreview: msg.text.slice(0, 80),
            result: 'skipped:deduped',
          })
          return res.status(200).json({ ok: true, deduped: true })
        }
        if (!shouldRespond(msg)) {
          logInbound({
            at: new Date().toISOString(),
            kind: 'message',
            eventType,
            chatType: msg.chatType,
            chatId: msg.chatId,
            openId: msg.openId,
            textPreview: msg.text.slice(0, 80),
            result: 'skipped:no_mention',
          })
          return res.status(200).json({ ok: true, skipped: 'no_mention' })
        }
        if (!larkConfigured()) {
          logInbound({
            at: new Date().toISOString(),
            kind: 'message',
            eventType,
            result: 'fail:not_configured',
          })
          return res.status(200).json({
            ok: false,
            error: 'LARK_APP_ID / LARK_APP_SECRET not configured on host',
          })
        }
        waitUntil(
          (async () => {
            const typing = startTypingSession(msg.messageId)
            try {
              // Learn Yan’s open_id when he messages (name match) so cron can DM without env
              if (msg.openId && msg.openId !== 'unknown') {
                try {
                  const nm = await fetchUserDisplayName(msg.openId)
                  if (looksLikeAdminName(nm)) rememberAdminOpenId(msg.openId, 'inbound_name')
                } catch {
                  /* ignore */
                }
              }
              const reply = await handleMessage(msg)
              await typing.stop()
              const dispatched = reply
                ? await dispatchReply(msg.messageId, msg.chatId, reply)
                : { ok: false, error: 'null_reply' }
              logInbound({
                at: new Date().toISOString(),
                kind: 'message',
                eventType,
                chatType: msg.chatType,
                chatId: msg.chatId,
                openId: msg.openId,
                messageId: msg.messageId,
                textPreview: msg.text.slice(0, 80),
                result: dispatched.ok
                  ? `ok:${dispatched.via}`
                  : `fail:${dispatched.error || 'unknown'}`,
                error: dispatched.ok ? undefined : dispatched.error,
              })
            } catch (e) {
              await typing.stop()
              logInbound({
                at: new Date().toISOString(),
                kind: 'handler_error',
                eventType,
                messageId: msg.messageId,
                error: e instanceof Error ? e.message : 'handler error',
                result: 'error',
              })
            }
          })(),
        )
        return res.status(200).json({ ok: true, accepted: true })
      }
    }

    // Card Request URL callback (no header.event_type) — open_message_id + action.value
    if (
      body.action ||
      body.open_message_id ||
      (body.event &&
        typeof body.event === 'object' &&
        ((body.event as Record<string, unknown>).action ||
          (body.event as Record<string, unknown>).open_message_id))
    ) {
      const event = (body.event && typeof body.event === 'object'
        ? body.event
        : body) as Record<string, unknown>
      return handleCardActionRequest(req, res, {
        header,
        event,
        eventType: eventType || 'card.request_url',
      })
    }

    // Older callback style: { uuid, event: { type, ... } }
    const legacy = body.event as Record<string, unknown> | undefined
    if (legacy && legacy.type === 'message') {
      logInbound({ at: new Date().toISOString(), kind: 'legacy_message', result: 'skipped' })
      return res.status(200).json({ ok: true, skipped: 'legacy_message' })
    }

    logInbound({
      at: new Date().toISOString(),
      kind: 'ignored',
      eventType: eventType || 'unknown',
      result: 'ignored',
    })
    return res.status(200).json({ ok: true, ignored: eventType || 'unknown' })
  } catch (e) {
    console.error('[lark/event]', e)
    logInbound({
      at: new Date().toISOString(),
      kind: 'handler_error',
      error: e instanceof Error ? e.message : 'handler error',
      result: 'error',
    })
    // Still 200 to avoid infinite Lark retries for logic bugs; log for ops.
    return res.status(200).json({
      ok: false,
      error: e instanceof Error ? e.message : 'handler error',
    })
  }
}
