/**
 * Feishu / Lark “typing” UX:
 * 1) Native typing status on the user’s message (best-effort)
 * 2) Typing emoji reaction fallback
 * 3) Progressive message updates so the bot reply appears to type out
 */

import {
  addMessageReaction,
  deleteMessageReaction,
  replyCard,
  replyText,
  sendCardToChat,
  sendTextToChat,
  setMessageTypingStatus,
  updateMessageCard,
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

/** Prefer the first lark_md div as the “body” for progressive card typing. */
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
      // Last resort: ignore mid-stream update failures; final content may be partial
      try {
        await updateMessageText(botMessageId, args.full)
      } catch {
        /* ignore */
      }
      break
    }
  }
  return { ok: true, via: args.viaReply ? 'replyText:typed' : 'sendTextToChat:typed' }
}

async function revealCard(args: {
  seedMessageId: string | undefined
  chatId: string
  card: Record<string, unknown>
  viaReply: boolean
}): Promise<{ ok: boolean; via: string; error?: string }> {
  const typed = extractCardTypingBody(args.card)
  if (!typed) {
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

  const prefixes = typingPrefixes(typed.body)
  const delay = typingStepDelayMs(prefixes.length)
  const firstCard = typed.apply(prefixes[0] || typed.body)

  let botMessageId = ''
  try {
    if (args.viaReply && args.seedMessageId) {
      const r = await replyCard(args.seedMessageId, firstCard)
      botMessageId = r.messageId || ''
    } else {
      const r = await sendCardToChat(args.chatId, firstCard)
      botMessageId = r.messageId || ''
    }
  } catch (e) {
    return { ok: false, via: 'card', error: e instanceof Error ? e.message : String(e) }
  }

  if (!botMessageId || prefixes.length <= 1) {
    return { ok: true, via: args.viaReply ? 'replyCard' : 'sendCardToChat' }
  }

  for (let i = 1; i < prefixes.length; i++) {
    if (delay) await sleep(delay)
    try {
      await updateMessageCard(botMessageId, typed.apply(prefixes[i]!))
    } catch {
      try {
        await updateMessageCard(botMessageId, args.card)
      } catch {
        /* ignore */
      }
      break
    }
  }
  return { ok: true, via: args.viaReply ? 'replyCard:typed' : 'sendCardToChat:typed' }
}

/**
 * Dispatch reply with progressive typing. Caller should stop the inbound typing session first
 * (or right as we start) so “正在输入” becomes the growing message.
 */
export async function dispatchReplyWithTypingEffect(
  messageId: string,
  chatId: string,
  reply: { text?: string; card?: Record<string, unknown> },
): Promise<{ ok: boolean; via?: string; error?: string }> {
  if (process.env.LARK_TYPING_EFFECT === '0') {
    try {
      if (reply.card) {
        if (messageId) {
          await replyCard(messageId, reply.card)
          return { ok: true, via: 'replyCard' }
        }
        await sendCardToChat(chatId, reply.card)
        return { ok: true, via: 'sendCardToChat' }
      }
      if (reply.text) {
        if (messageId) {
          await replyText(messageId, reply.text)
          return { ok: true, via: 'replyText' }
        }
        await sendTextToChat(chatId, reply.text)
        return { ok: true, via: 'sendTextToChat' }
      }
      return { ok: false, error: 'empty reply' }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  if (reply.card) {
    return revealCard({
      seedMessageId: messageId,
      chatId,
      card: reply.card,
      viaReply: Boolean(messageId),
    })
  }
  if (reply.text) {
    return revealText({
      seedMessageId: messageId,
      chatId,
      full: reply.text,
      viaReply: Boolean(messageId),
    })
  }
  return { ok: false, error: 'empty reply' }
}

/** Tiny placeholder card used only if we ever need an immediate ack (unused by default). */
export function typingPlaceholderCard(title: string): Record<string, unknown> {
  return simpleCard(title, '▍', 'wathet')
}
