/**
 * Feishu / Lark “typing” UX:
 * 1) Native typing status on the user’s message (best-effort)
 * 2) Typing emoji reaction fallback
 * 3) Progressive reveal for plain-text replies only
 *
 * Interactive cards (greeting menu, market, skills…) are sent in one shot —
 * Feishu card PATCH often stalls mid-stream and left greetings stuck as
 * “我是 **V Exchange ▍” without the command directory.
 */

import {
  addMessageReaction,
  deleteMessageReaction,
  replyCard,
  replyText,
  sendCardToChat,
  sendTextToChat,
  setMessageTypingStatus,
  updateMessageText,
} from './client.js'
import { simpleCard } from './cards.js'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Split full text into growing prefixes for a human-like reveal. */
export function typingPrefixes(
  full: string,
  opts?: { maxSteps?: number; minChunk?: number },
): string[] {
  const text = full || ''
  if (!text) return ['']
  const maxSteps = opts?.maxSteps ?? 22
  const minChunk = opts?.minChunk ?? 2
  if (text.length <= 16) return [text]
  const step = Math.max(minChunk, Math.ceil(text.length / maxSteps))
  const out: string[] = []
  for (let i = step; i < text.length; i += step) out.push(text.slice(0, i))
  out.push(text)
  return out
}

export function typingStepDelayMs(steps: number): number {
  if (steps <= 1) return 0
  // Cap total animation ~1.6s so serverless stay-alive stays sane
  return Math.min(90, Math.max(28, Math.floor(1600 / steps)))
}

/**
 * Menu / catalog cards must never be progressively truncated.
 * Kept for tests / callers that inspect card shape.
 */
export function isMenuOrCatalogCard(card: Record<string, unknown>): boolean {
  const header = card.header as { title?: { content?: string } } | undefined
  const title = header?.title?.content || ''
  if (
    /Risk Copilot|使用说明|How to use|小时行情|Hourly|Skills|知识库|知識庫|Knowledge|Investigation|排查|看板|Dashboard|周报|週報|Weekly/i.test(
      title,
    )
  ) {
    return true
  }
  const elements = card.elements
  // Greeting / help with desk footer = 2+ blocks → full send
  if (Array.isArray(elements) && elements.length > 1) return true
  const body = extractCardTypingBody(card)?.body || ''
  // Command directory bullets
  if (/📈|🔍|🧩|📚|^\s*•\s*\*\*/m.test(body) && body.length > 200) return true
  return false
}

/** Prefer the first lark_md div as the “body” (inspect / tests). */
export function extractCardTypingBody(
  card: Record<string, unknown>,
): { body: string; apply: (partial: string) => Record<string, unknown> } | null {
  const elements = card.elements
  if (!Array.isArray(elements) || !elements.length) return null
  let idx = -1
  let body = ''
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as { tag?: string; text?: { tag?: string; content?: string } }
    if (el?.tag === 'div' && el.text?.tag === 'lark_md' && typeof el.text.content === 'string') {
      idx = i
      body = el.text.content
      break
    }
  }
  if (idx < 0 || body.length < 24) return null
  return {
    body,
    apply: (partial: string) => {
      const clone = structuredClone(card) as {
        elements: { tag?: string; text?: { tag?: string; content?: string } }[]
      }
      const el = clone.elements[idx]
      if (el?.text) {
        el.text.content = partial.length < body.length ? `${partial} ▍` : partial
      }
      return clone as Record<string, unknown>
    },
  }
}

type TypingHandle = {
  stop: () => Promise<void>
}

/**
 * Show “正在输入…” on the user’s inbound message while we think.
 * Soft-fails if the tenant lacks the API / reaction scope.
 */
export function startTypingSession(userMessageId: string): TypingHandle {
  if (!userMessageId || process.env.LARK_TYPING_EFFECT === '0') {
    return { stop: async () => undefined }
  }

  let stopped = false
  let reactionId: string | null = null
  let timer: ReturnType<typeof setInterval> | null = null

  const pulse = async () => {
    if (stopped) return
    try {
      await setMessageTypingStatus(userMessageId, true)
    } catch {
      /* native typing may be unavailable — reaction fallback below */
    }
  }

  void (async () => {
    await pulse()
    try {
      reactionId = await addMessageReaction(userMessageId, 'Typing')
    } catch {
      reactionId = null
    }
    // Native status auto-clears ~10s — refresh while work continues
    timer = setInterval(() => {
      void pulse()
    }, 8_000)
  })()

  return {
    stop: async () => {
      if (stopped) return
      stopped = true
      if (timer) clearInterval(timer)
      timer = null
      try {
        await setMessageTypingStatus(userMessageId, false)
      } catch {
        /* ignore */
      }
      if (reactionId) {
        try {
          await deleteMessageReaction(userMessageId, reactionId)
        } catch {
          /* ignore */
        }
        reactionId = null
      }
    },
  }
}

async function sendCardOnce(args: {
  seedMessageId: string | undefined
  chatId: string
  card: Record<string, unknown>
  viaReply: boolean
}): Promise<{ ok: boolean; via: string; error?: string }> {
  try {
    if (args.viaReply && args.seedMessageId) {
      await replyCard(args.seedMessageId, args.card)
      return { ok: true, via: 'replyCard' }
    }
    await sendCardToChat(args.chatId, args.card)
    return { ok: true, via: 'sendCardToChat' }
  } catch (e) {
    return { ok: false, via: 'card', error: e instanceof Error ? e.message : String(e) }
  }
}

async function revealText(args: {
  seedMessageId: string | undefined
  chatId: string
  full: string
  viaReply: boolean
}): Promise<{ ok: boolean; via: string; error?: string }> {
  const prefixes = typingPrefixes(args.full)
  const delay = typingStepDelayMs(prefixes.length)
  const first = prefixes[0] || args.full

  let botMessageId = ''
  try {
    if (args.viaReply && args.seedMessageId) {
      const r = await replyText(args.seedMessageId, first)
      botMessageId = r.messageId || ''
    } else {
      const r = await sendTextToChat(args.chatId, first)
      botMessageId = r.messageId || ''
    }
  } catch (e) {
    return { ok: false, via: 'text', error: e instanceof Error ? e.message : String(e) }
  }

  if (!botMessageId || prefixes.length <= 1) {
    return { ok: true, via: args.viaReply ? 'replyText' : 'sendTextToChat' }
  }

  for (let i = 1; i < prefixes.length; i++) {
    if (delay) await sleep(delay)
    try {
      await updateMessageText(botMessageId, prefixes[i]!)
    } catch {
      try {
        await updateMessageText(botMessageId, args.full)
      } catch {
        /* ignore — first chunk already delivered */
      }
      break
    }
  }
  // Guarantee final full text (no stuck cursor / truncation)
  try {
    await updateMessageText(botMessageId, args.full)
  } catch {
    /* ignore */
  }
  return { ok: true, via: args.viaReply ? 'replyText:typed' : 'sendTextToChat:typed' }
}

/**
 * Dispatch reply with typing indicator + safe reveal.
 * Cards (esp. greeting directory) are always sent complete.
 */
async function dispatchFollowUpCards(
  chatId: string,
  cards: Record<string, unknown>[] | undefined,
): Promise<{ ok: boolean; via?: string; error?: string }> {
  if (!cards?.length) return { ok: true, via: 'followUp:none' }
  try {
    for (const card of cards) {
      // Always a new chat message so the step guide appears after the path overview.
      await sendCardToChat(chatId, card)
    }
    return { ok: true, via: `followUp:${cards.length}` }
  } catch (e) {
    return { ok: false, via: 'followUp', error: e instanceof Error ? e.message : String(e) }
  }
}

export async function dispatchReplyWithTypingEffect(
  messageId: string,
  chatId: string,
  reply: {
    text?: string
    card?: Record<string, unknown>
    followUpCards?: Record<string, unknown>[]
  },
): Promise<{ ok: boolean; via?: string; error?: string }> {
  if (process.env.LARK_TYPING_EFFECT === '0') {
    try {
      if (reply.card) {
        const primary = await sendCardOnce({
          seedMessageId: messageId,
          chatId,
          card: reply.card,
          viaReply: Boolean(messageId),
        })
        if (!primary.ok) return primary
        const follow = await dispatchFollowUpCards(chatId, reply.followUpCards)
        if (!follow.ok) return follow
        return {
          ok: true,
          via: [primary.via, follow.via].filter(Boolean).join('+'),
        }
      }
      if (reply.text) {
        if (messageId) {
          await replyText(messageId, reply.text)
          const follow = await dispatchFollowUpCards(chatId, reply.followUpCards)
          if (!follow.ok) return follow
          return { ok: true, via: ['replyText', follow.via].filter(Boolean).join('+') }
        }
        await sendTextToChat(chatId, reply.text)
        const follow = await dispatchFollowUpCards(chatId, reply.followUpCards)
        if (!follow.ok) return follow
        return { ok: true, via: ['sendTextToChat', follow.via].filter(Boolean).join('+') }
      }
      if (reply.followUpCards?.length) {
        return dispatchFollowUpCards(chatId, reply.followUpCards)
      }
      return { ok: false, error: 'empty reply' }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  if (reply.card) {
    // Never progressive-type interactive cards — greeting menus were getting stuck mid-stream
    const primary = await sendCardOnce({
      seedMessageId: messageId,
      chatId,
      card: reply.card,
      viaReply: Boolean(messageId),
    })
    if (!primary.ok) return primary
    const follow = await dispatchFollowUpCards(chatId, reply.followUpCards)
    if (!follow.ok) return follow
    return {
      ok: true,
      via: [primary.via, follow.via].filter(Boolean).join('+'),
    }
  }
  if (reply.text) {
    const primary = await revealText({
      seedMessageId: messageId,
      chatId,
      full: reply.text,
      viaReply: Boolean(messageId),
    })
    if (!primary.ok) return primary
    const follow = await dispatchFollowUpCards(chatId, reply.followUpCards)
    if (!follow.ok) return follow
    return {
      ok: true,
      via: [primary.via, follow.via].filter(Boolean).join('+'),
    }
  }
  if (reply.followUpCards?.length) {
    return dispatchFollowUpCards(chatId, reply.followUpCards)
  }
  return { ok: false, error: 'empty reply' }
}

/** Tiny placeholder card used only if we ever need an immediate ack (unused by default). */
export function typingPlaceholderCard(title: string): Record<string, unknown> {
  return simpleCard(title, '▍', 'wathet')
}
