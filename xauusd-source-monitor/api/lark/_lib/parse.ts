import type { IncomingMessage } from './types.js'
import { fetchMessageItems, type LarkMessageItem } from './client.js'
import { looksLikeIncidentEvidence } from './scope.js'

/** Our own cron / desk pushes — never treat as inbound alerts (echo loop). */
export function looksLikeOurOutboundCard(text: string): boolean {
  return /小时行情|小時行情|Half-hourly market|每日\s*24h|每日早报|每日早報|Cron 健康|震荡行情|震盪行情|每周复盘|每週複盤|告警提醒|知道了|已升级等待反馈|已升級等待反饋|Investigation escalate|排查升级|排查升級|V Exchange Risk Copilot/i.test(
    text,
  )
}

/**
 * Group auto-capture: alert cards / pastes that should start investigation
 * without an @mention. Excludes our own outbound cards.
 */
export function looksLikeGroupAutoAlert(msg: {
  text: string
  messageType: string
}): boolean {
  const text = (msg.text || '').trim()
  if (!text || looksLikeOurOutboundCard(text)) return false
  if (
    msg.messageType === 'interactive' ||
    msg.messageType === 'merge_forward' ||
    /\[(forwarded_card|merge_forward|replied_alert)\]/i.test(text)
  ) {
    return (
      looksLikeIncidentEvidence(text) ||
      /预警|預警|告警|报警|報警|价差|價差|\balert\b|监控|監控/i.test(text)
    )
  }
  return looksLikeIncidentEvidence(text)
}

/**
 * Group chats share one investigation session so an auto-captured alert and
 * later @bot replies from any participant continue the same case.
 */
export function sessionOpenIdFor(chatType: string, openId: string): string {
  const ct = (chatType || '').toLowerCase()
  if (ct === 'group' || ct === 'topic' || ct === 'topic_group') return '__group__'
  return openId || 'unknown'
}

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

/** Doc / chat share cards — keep title / url / preview snippets when present. */
export function extractShareHint(contentJson: string, messageType: string): string {
  try {
    const parsed = JSON.parse(contentJson) as Record<string, unknown>
    const bits: string[] = [`[share:${messageType}]`]
    const push = (v: unknown) => {
      if (typeof v === 'string' && v.trim()) bits.push(v.trim())
    }
    push(parsed.title)
    push(parsed.file_name)
    push(parsed.name)
    push(parsed.url)
    push(parsed.link)
    push(parsed.document_id)
    push(parsed.file_key)
    // Nested preview / content fields some Feishu share payloads use
    const preview = parsed.preview || parsed.content || parsed.extra
    if (typeof preview === 'string') push(preview)
    if (preview && typeof preview === 'object') {
      const o = preview as Record<string, unknown>
      push(o.title)
      push(o.text)
      push(o.summary)
      push(o.url)
    }
    return bits.join('\n').replace(/\n+/g, '\n').trim()
  } catch {
    /* ignore */
  }
  return `[share:${messageType}]`
}

/**
 * Flatten a forwarded / shared Feishu interactive card into readable alert text.
 * Received card JSON differs from builder JSON — walk common title/text/content fields.
 */
export function extractInteractiveCardText(contentJson: string): string {
  const parts: string[] = []
  const push = (v: unknown) => {
    if (typeof v !== 'string') return
    const s = v.trim()
    if (
      !s ||
      s.length > 800 ||
      /^https?:\/\//i.test(s) ||
      /^[A-Za-z0-9_-]{24,}$/.test(s) ||
      /^img_/i.test(s)
    ) {
      return
    }
    parts.push(s)
  }
  try {
    const root = JSON.parse(contentJson) as Record<string, unknown>
    const walk = (v: unknown, depth: number) => {
      if (depth > 10 || v == null) return
      if (typeof v === 'string') {
        push(v)
        return
      }
      if (Array.isArray(v)) {
        for (const x of v) walk(x, depth + 1)
        return
      }
      if (typeof v !== 'object') return
      const o = v as Record<string, unknown>
      const take = (val: unknown) => {
        if (typeof val === 'string') push(val)
        else if (val && typeof val === 'object') walk(val, depth + 1)
      }
      // Prefer human-facing keys (string or nested plain_text / lark_md objects).
      take(o.content)
      take(o.text)
      take(o.title)
      if (o.header) walk(o.header, depth + 1)
      if (o.elements) walk(o.elements, depth + 1)
      if (o.fields) walk(o.fields, depth + 1)
      if (o.columns) walk(o.columns, depth + 1)
      if (o.rows) walk(o.rows, depth + 1)
      // Schema-2 / nested card wrappers
      if (o.card) walk(o.card, depth + 1)
      if (o.data) walk(o.data, depth + 1)
      if (o.body) walk(o.body, depth + 1)
      for (const [k, val] of Object.entries(o)) {
        if (
          /token|key|id|secret|cipher|url|href|multi_url|img|image|option|value|action|template|tag|type|color|behaviors|is_short/i.test(
            k,
          )
        ) {
          continue
        }
        if (
          k === 'content' ||
          k === 'text' ||
          k === 'title' ||
          k === 'header' ||
          k === 'elements' ||
          k === 'fields' ||
          k === 'columns' ||
          k === 'rows' ||
          k === 'card' ||
          k === 'data' ||
          k === 'body'
        ) {
          continue
        }
        walk(val, depth + 1)
      }
    }
    walk(root, 0)
  } catch {
    return ''
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    const k = p.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000)
}

/** True when this mention targets our bot (open_id or known display name). */
export function mentionIsOurBot(
  m: { id?: { open_id?: string }; name?: string; key?: string },
  botOpenId: string = (process.env.LARK_BOT_OPEN_ID || '').trim(),
): boolean {
  const oid = (m.id?.open_id || '').trim()
  if (botOpenId) return Boolean(oid && oid === botOpenId)
  const name = String(m.name || '').trim()
  if (!name) return false
  return /VE\s*AI|风控小助手|Risk\s*Copilot|vex.?llm.?proxy/i.test(name)
}

export function parseIncomingEvent(event: Record<string, unknown>): IncomingMessage | null {
  const message = event.message as Record<string, unknown> | undefined
  const sender = event.sender as Record<string, unknown> | undefined
  if (!message) return null

  const senderId = (sender?.sender_id || {}) as Record<string, string>
  const openId = senderId.open_id || senderId.user_id || 'unknown'
  const senderType = String(sender?.sender_type || 'user').toLowerCase()
  const messageType = String(message.message_type || 'text')
  const botOpenId = process.env.LARK_BOT_OPEN_ID || ''

  // System notices only — user-forwarded interactive alert cards must still be parsed.
  if (messageType === 'system') {
    return null
  }

  // Never process our own bot echoes (prevent greeting / card loops).
  // Other apps may post alert cards into groups — filtered after text extraction.
  if (botOpenId && openId === botOpenId) {
    return null
  }

  const rawContent = String(message.content || '')
  const mentions = (message.mentions || []) as { id?: { open_id?: string }; name?: string; key?: string }[]
  // Groups must @ *this* bot — @another human must NOT trigger a reply.
  // When LARK_BOT_OPEN_ID is unset, soft-match known bot display names only (never "any @").
  const mentionedBot = mentions.some((m) => mentionIsOurBot(m, botOpenId))

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
    // Forwarded alert / ops cards (sender=user). Keep a marker even when the event
    // payload has no readable body — handleMessage will re-fetch via message API.
    const flat = extractInteractiveCardText(rawContent)
    text = flat ? `[forwarded_card]\n${flat}` : '[forwarded_card]'
  } else if (messageType === 'merge_forward') {
    // Event content is a fixed placeholder; expand children in handleMessage.
    text = '[merge_forward]'
  } else if (
    messageType === 'share_chat' ||
    messageType === 'share_user' ||
    messageType === 'folder' ||
    messageType === 'drive' ||
    messageType === 'docx'
  ) {
    text =
      extractTextContent(rawContent) ||
      extractPostText(rawContent) ||
      extractShareHint(rawContent, messageType)
  } else {
    text =
      extractTextContent(rawContent) ||
      extractPostText(rawContent) ||
      extractShareHint(rawContent, messageType) ||
      `[${messageType}]`
  }

  // Strip @_user_1 style mention placeholders
  text = text.replace(/@_user_\d+/g, '').trim()

  const isAppOrBot = senderType === 'bot' || senderType === 'app'
  if (isAppOrBot) {
    const draft = { text, messageType }
    if (looksLikeOurOutboundCard(text) || !looksLikeGroupAutoAlert(draft)) {
      return null
    }
  }

  const parentId = String(message.parent_id || '').trim() || undefined
  const rootId = String(message.root_id || '').trim() || undefined

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
    parentId,
    rootId,
  }
}

export function shouldRespond(msg: IncomingMessage): boolean {
  // Always respond in DM
  if (msg.chatType === 'p2p') return true
  // Groups: @ our bot (not @another person)
  if (msg.mentionedBot) return true
  // Multi-participant groups: auto-capture alert posts → investigation
  if (looksLikeGroupAutoAlert(msg)) return true
  // Ops override (not recommended)
  if (process.env.LARK_REPLY_ALL_GROUP === '1') return true
  return false
}

function flattenLarkMessageItem(item: LarkMessageItem): string {
  const mt = String(item.msg_type || '')
  const content = String(item.body?.content || '')
  if (!content) return ''
  if (mt === 'interactive') {
    const flat = extractInteractiveCardText(content)
    return flat ? `[forwarded_card]\n${flat}` : ''
  }
  if (mt === 'text') return extractTextContent(content)
  if (mt === 'post') return extractPostText(content)
  if (mt === 'image') return '[image attachment]'
  if (mt === 'file' || mt === 'media') return extractFileHint(content)
  if (mt === 'merge_forward') return ''
  return (
    extractTextContent(content) ||
    extractPostText(content) ||
    extractInteractiveCardText(content) ||
    extractShareHint(content, mt)
  )
}

/**
 * Expand forwarded cards / merge_forward / reply-to-alert into readable evidence text.
 * Feishu event payloads often omit card body; GET message returns it (and children).
 */
export async function enrichIncomingEvidence(msg: IncomingMessage): Promise<IncomingMessage> {
  const needsCardFetch =
    msg.messageType === 'interactive' ||
    msg.messageType === 'merge_forward' ||
    /^\[(forwarded_card|merge_forward)\]/i.test(msg.text || '')
  const replyTarget = (msg.parentId || msg.rootId || '').trim()
  const thinText =
    !(msg.text || '').trim() ||
    /^\[(forwarded_card|merge_forward)\]\s*$/i.test((msg.text || '').trim()) ||
    /Merged and Forwarded Message/i.test(msg.text || '')

  let enriched = (msg.text || '').trim()

  if (needsCardFetch && msg.messageId) {
    try {
      const items = await fetchMessageItems(msg.messageId, { userCardContent: true })
      const parts: string[] = []
      for (const it of items) {
        if (it.deleted) continue
        if (String(it.msg_type || '') === 'merge_forward') continue
        const flat = flattenLarkMessageItem(it)
        if (flat.trim()) parts.push(flat.trim())
      }
      if (parts.length) {
        enriched = parts.join('\n\n')
        if (msg.messageType === 'merge_forward' && !enriched.startsWith('[')) {
          enriched = `[merge_forward]\n${enriched}`
        } else if (msg.messageType === 'interactive' && !enriched.includes('[forwarded_card]')) {
          enriched = `[forwarded_card]\n${enriched}`
        }
      }
    } catch {
      /* keep event text — permission may be missing */
    }
  }

  // Reply-to-alert: pull parent/root card/text when the reply body is thin.
  if (replyTarget && thinText) {
    try {
      const items = await fetchMessageItems(replyTarget, { userCardContent: true })
      const parts: string[] = []
      for (const it of items) {
        if (it.deleted) continue
        if (String(it.msg_type || '') === 'merge_forward') continue
        const flat = flattenLarkMessageItem(it)
        if (flat.trim()) parts.push(flat.trim())
      }
      if (parts.length) {
        const parentBlob = parts.join('\n\n')
        enriched = enriched
          ? `${enriched}\n\n[replied_alert]\n${parentBlob}`
          : `[replied_alert]\n${parentBlob}`
      }
    } catch {
      /* ignore */
    }
  }

  if (enriched === (msg.text || '').trim()) return msg
  return { ...msg, text: enriched, rawContent: enriched || msg.rawContent }
}
