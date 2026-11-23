import type { IncomingMessage } from './types.js'

function walkPostNodes(nodes: unknown, out: string[]) {
  if (!Array.isArray(nodes)) return
  for (const n of nodes) {
    if (Array.isArray(n)) {
      walkPostNodes(n, out)
      continue
    }
    if (!n || typeof n !== 'object') continue
    const o = n as Record<string, unknown>
    const tag = String(o.tag || '')
    if (tag === 'text' && typeof o.text === 'string') out.push(o.text)
    if (tag === 'a' && typeof o.text === 'string') out.push(o.text)
    if (tag === 'at' && typeof o.user_name === 'string') out.push(`@${o.user_name}`)
    if (tag === 'emotion' && typeof o.emoji_type === 'string') out.push(`[${o.emoji_type}]`)
    // Feishu table cells often nest text under td / tr style structures
    if (o.text && typeof o.text === 'object') walkPostNodes([o.text], out)
    if (Array.isArray(o.content)) walkPostNodes(o.content, out)
    if (Array.isArray(o.elements)) walkPostNodes(o.elements, out)
  }
}

export function extractPostText(contentJson: string): string {
  try {
    const parsed = JSON.parse(contentJson) as {
      title?: unknown
      content?: unknown
      zh_cn?: { title?: unknown; content?: unknown }
      en_us?: { title?: unknown; content?: unknown }
    }
    const parts: string[] = []
    const block = parsed.zh_cn || parsed.en_us || parsed
    if (block.title) walkPostNodes([block.title], parts)
    if (block.content) walkPostNodes(block.content as unknown[], parts)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  } catch {
    return contentJson
  }
}

export function extractTextContent(contentJson: string): string {
  try {
    const parsed = JSON.parse(contentJson) as { text?: string }
    return String(parsed.text || '').trim()
  } catch {
    return contentJson.trim()
  }
}

export function extractImageKey(contentJson: string): string | undefined {
  try {
    const parsed = JSON.parse(contentJson) as { image_key?: string }
    return parsed.image_key
  } catch {
    return undefined
  }
}

/** Spreadsheet / file share — keep file name hint if present. */
export function extractFileHint(contentJson: string): string {
  try {
    const parsed = JSON.parse(contentJson) as { file_name?: string; file_key?: string }
    if (parsed.file_name) return `[file: ${parsed.file_name}]`
    if (parsed.file_key) return `[file: ${parsed.file_key}]`
  } catch {
    /* ignore */
  }
  return '[file attachment]'
}

export function parseIncomingEvent(event: Record<string, unknown>): IncomingMessage | null {
  const message = event.message as Record<string, unknown> | undefined
  const sender = event.sender as Record<string, unknown> | undefined
  if (!message) return null

  const senderId = (sender?.sender_id || {}) as Record<string, string>
  const openId = senderId.open_id || senderId.user_id || 'unknown'
  const messageType = String(message.message_type || 'text')
  const rawContent = String(message.content || '')
  const mentions = (message.mentions || []) as { id?: { open_id?: string }; name?: string; key?: string }[]
  // Precise match when bot open_id known (env or caller-injected); else any @mention key.
  const botOpenId = process.env.LARK_BOT_OPEN_ID || ''
  const mentionedBot =
    mentions.some((m) => {
      if (botOpenId && m.id?.open_id === botOpenId) return true
      // Soft match: any @ in the message (typical when ops @ the bot in a group)
      return Boolean(m.key)
    }) || false

  let text = ''
  let imageKey: string | undefined

  if (messageType === 'text') {
    text = extractTextContent(rawContent)
  } else if (messageType === 'post') {
    text = extractPostText(rawContent)
  } else if (messageType === 'image') {
    imageKey = extractImageKey(rawContent)
    text = ''
  } else if (messageType === 'file' || messageType === 'media') {
    text = extractFileHint(rawContent)
  } else if (messageType === 'interactive') {
    text = '[card interaction]'
  } else {
    text = extractTextContent(rawContent) || extractPostText(rawContent) || `[${messageType}]`
  }

  // Strip @_user_1 style mention placeholders
  text = text.replace(/@_user_\d+/g, '').trim()

  return {
    messageId: String(message.message_id || ''),
    chatId: String(message.chat_id || ''),
    chatType: String(message.chat_type || 'p2p'),
    openId,
    messageType,
    text,
    imageKey,
    mentionedBot: mentionedBot || String(message.chat_type) === 'p2p',
    rawContent,
  }
}

export function shouldRespond(msg: IncomingMessage): boolean {
  // Always respond in DM
  if (msg.chatType === 'p2p') return true
  // Groups: only when @mentioned (or explicit mention config soft-match)
  if (msg.mentionedBot) return true
  // If LARK_REPLY_ALL_GROUP=1, respond to all (ops override)
  if (process.env.LARK_REPLY_ALL_GROUP === '1') return true
  return false
}
