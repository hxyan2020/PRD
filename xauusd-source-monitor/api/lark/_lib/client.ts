/**
 * Lark / Feishu Open API helpers.
 * Minimum secrets for live replies: LARK_APP_ID + LARK_APP_SECRET.
 * Optional: LARK_VERIFICATION_TOKEN, LARK_BOT_OPEN_ID (auto-fetched when unset).
 * Do NOT enable Encrypt Key in Lark console unless LARK_ENCRYPT_KEY decrypt is added.
 */

import { plainCard, toPlainText } from './plain.js'

let cachedToken: { token: string; expireAt: number } | null = null
let cachedBotOpenId: { id: string; expireAt: number } | null = null

/** Override with https://open.larksuite.com for international Lark tenants. */
const LARK_HOST = process.env.LARK_API_HOST || 'https://open.feishu.cn'

export function larkConfigured() {
  return Boolean(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET)
}

/** True when Lark sent an encrypted envelope we cannot read without Encrypt Key support. */
export function isEncryptedEnvelope(body: Record<string, unknown>): boolean {
  return Boolean(body.encrypt && typeof body.encrypt === 'string' && !body.challenge && !body.header)
}

export async function getTenantToken(): Promise<string> {
  const appId = process.env.LARK_APP_ID || ''
  const appSecret = process.env.LARK_APP_SECRET || ''
  if (!appId || !appSecret) throw new Error('LARK_APP_ID / LARK_APP_SECRET not configured')

  if (cachedToken && Date.now() < cachedToken.expireAt - 60_000) {
    return cachedToken.token
  }

  const r = await fetch(`${LARK_HOST}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  })
  const data = (await r.json()) as {
    code?: number
    msg?: string
    tenant_access_token?: string
    expire?: number
  }
  if (!r.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(data.msg || `tenant token failed (${r.status})`)
  }
  cachedToken = {
    token: data.tenant_access_token,
    expireAt: Date.now() + (data.expire || 7200) * 1000,
  }
  return cachedToken.token
}

async function larkFetch(path: string, init: RequestInit = {}) {
  const token = await getTenantToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  }
  const r = await fetch(`${LARK_HOST}${path}`, { ...init, headers })
  const data = (await r.json().catch(() => ({}))) as {
    code?: number
    msg?: string
    data?: unknown
  }
  if (!r.ok || (typeof data.code === 'number' && data.code !== 0)) {
    throw new Error(data.msg || `Lark API ${path} failed (${r.status})`)
  }
  return data
}

function extractMessageId(data: unknown): string {
  const d = data as { data?: { message_id?: string } }
  return (d?.data?.message_id || '').trim()
}

export type LarkSendResult = { messageId: string; raw: unknown }

export async function replyText(messageId: string, text: string): Promise<LarkSendResult> {
  const raw = await larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      msg_type: 'text',
      content: JSON.stringify({ text: toPlainText(text) }),
    }),
  })
  return { messageId: extractMessageId(raw), raw }
}

export async function replyCard(
  messageId: string,
  card: Record<string, unknown>,
): Promise<LarkSendResult> {
  const raw = await larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      msg_type: 'interactive',
      content: JSON.stringify(plainCard(card)),
    }),
  })
  return { messageId: extractMessageId(raw), raw }
}

export async function sendTextToChat(chatId: string, text: string): Promise<LarkSendResult> {
  const raw = await larkFetch(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text: toPlainText(text) }),
    }),
  })
  return { messageId: extractMessageId(raw), raw }
}

export async function sendCardToChat(
  chatId: string,
  card: Record<string, unknown>,
): Promise<LarkSendResult> {
  const raw = await larkFetch(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(plainCard(card)),
    }),
  })
  return { messageId: extractMessageId(raw), raw }
}

/** Native “正在输入…” on the referenced user message (auto-clears ~10s). Soft-fail at call sites. */
export async function setMessageTypingStatus(messageId: string, typing: boolean): Promise<void> {
  await larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/typing`, {
    method: 'POST',
    body: JSON.stringify({ typing_status: typing ? 1 : 0 }),
  })
}

/** Fallback typing cue when native status API is unavailable. Returns reaction_id. */
export async function addMessageReaction(
  messageId: string,
  emojiType = 'Typing',
): Promise<string | null> {
  const raw = await larkFetch(
    `/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ reaction_type: { emoji_type: emojiType } }),
    },
  )
  const d = raw as { data?: { reaction_id?: string } }
  return (d.data?.reaction_id || '').trim() || null
}

export async function deleteMessageReaction(messageId: string, reactionId: string): Promise<void> {
  await larkFetch(
    `/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(reactionId)}`,
    { method: 'DELETE' },
  )
}

/** Patch an already-sent text message (progressive typing). */
export async function updateMessageText(messageId: string, text: string): Promise<void> {
  await larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      msg_type: 'text',
      content: JSON.stringify({ text: toPlainText(text) }),
    }),
  })
}

/** Patch an already-sent interactive card (progressive typing). */
export async function updateMessageCard(
  messageId: string,
  card: Record<string, unknown>,
): Promise<void> {
  await larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      msg_type: 'interactive',
      content: JSON.stringify(plainCard(card)),
    }),
  })
}

/** DM a user by open_id (admin weekly push). */
export async function sendCardToOpenId(openId: string, card: Record<string, unknown>) {
  return larkFetch(`/open-apis/im/v1/messages?receive_id_type=open_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: openId,
      msg_type: 'interactive',
      content: JSON.stringify(plainCard(card)),
    }),
  })
}

export async function sendTextToOpenId(openId: string, text: string) {
  return larkFetch(`/open-apis/im/v1/messages?receive_id_type=open_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text: toPlainText(text) }),
    }),
  })
}

const ADMIN_NAME_RE = /Yan\s*Haixiang|严海翔|嚴海翔|海翔/i

/** Warm-instance cache after we resolve Yan once (cron / DM). */
let cachedAdminOpenId: { openId: string; source: string; expireAt: number } | null = null

/**
 * Resolve Yan Haixiang (or configured admin) open_id for weekly / 30-min market push.
 * Prefers env → email → p2p chat named Yan → remembered cache.
 */
export async function resolveAdminOpenId(): Promise<{ openId: string; source: string }> {
  const fromEnv = (
    process.env.LARK_ADMIN_OPEN_ID ||
    process.env.LARK_YAN_OPEN_ID ||
    ''
  ).trim()
  if (fromEnv) return { openId: fromEnv, source: 'env' }

  if (cachedAdminOpenId && Date.now() < cachedAdminOpenId.expireAt) {
    return { openId: cachedAdminOpenId.openId, source: cachedAdminOpenId.source }
  }

  const email = (process.env.LARK_ADMIN_EMAIL || '').trim()
  if (email && larkConfigured()) {
    try {
      const data = (await larkFetch('/open-apis/contact/v3/users/batch_get_id?user_id_type=open_id', {
        method: 'POST',
        body: JSON.stringify({ emails: [email], include_resigned: false }),
      })) as {
        data?: { user_list?: { email?: string; user_id?: string }[] }
      }
      const hit = (data.data?.user_list || []).find((u) => u.user_id)
      if (hit?.user_id) {
        cachedAdminOpenId = {
          openId: hit.user_id,
          source: 'email',
          expireAt: Date.now() + 6 * 3600_000,
        }
        return { openId: hit.user_id, source: 'email' }
      }
    } catch {
      /* missing contact scope — fall through */
    }
  }

  if (larkConfigured()) {
    try {
      const fromChat = await resolveAdminFromP2pChats()
      if (fromChat) {
        cachedAdminOpenId = {
          openId: fromChat,
          source: 'p2p_chat',
          expireAt: Date.now() + 6 * 3600_000,
        }
        return { openId: fromChat, source: 'p2p_chat' }
      }
    } catch {
      /* ignore */
    }
  }
  return { openId: '', source: 'missing' }
}

/** Remember Yan’s open_id when he DMs the bot (warm cache for upcoming cron). */
export function rememberAdminOpenId(openId: string, source = 'inbound'): void {
  const id = (openId || '').trim()
  if (!id || id === 'unknown') return
  cachedAdminOpenId = { openId: id, source, expireAt: Date.now() + 24 * 3600_000 }
}

export function looksLikeAdminName(name: string | null | undefined): boolean {
  return Boolean(name && ADMIN_NAME_RE.test(name))
}

async function resolveAdminFromP2pChats(): Promise<string | null> {
  const botId = (await resolveBotOpenId().catch(() => '')) || ''
  const chats = (await larkFetch('/open-apis/im/v1/chats?page_size=50', { method: 'GET' })) as {
    data?: { items?: { chat_id?: string; name?: string; chat_mode?: string }[] }
  }
  const items = chats.data?.items || []
  for (const c of items) {
    const mode = (c.chat_mode || '').toLowerCase()
    const name = c.name || ''
    const looksP2p = mode === 'p2p' || ADMIN_NAME_RE.test(name)
    if (!looksP2p && !ADMIN_NAME_RE.test(name)) continue
    if (!ADMIN_NAME_RE.test(name) && mode !== 'p2p') continue
    if (!c.chat_id) continue
    try {
      const mem = (await larkFetch(
        `/open-apis/im/v1/chats/${encodeURIComponent(c.chat_id)}/members?member_id_type=open_id&page_size=20`,
        { method: 'GET' },
      )) as {
        data?: { items?: { member_id?: string; name?: string }[] }
      }
      for (const m of mem.data?.items || []) {
        const mid = (m.member_id || '').trim()
        if (!mid || mid === botId) continue
        if (ADMIN_NAME_RE.test(m.name || '') || ADMIN_NAME_RE.test(name)) return mid
        if (mode === 'p2p' && ADMIN_NAME_RE.test(name)) return mid
      }
    } catch {
      /* need im:chat.members scope — skip */
    }
  }
  return null
}

const userNameCache = new Map<string, { name: string; expireAt: number }>()

/** Best-effort display name for casual “我是谁” replies (needs contact scope). */
export async function fetchUserDisplayName(openId: string): Promise<string | null> {
  const id = (openId || '').trim()
  if (!id || id === 'unknown') return null
  const hit = userNameCache.get(id)
  if (hit && Date.now() < hit.expireAt) return hit.name
  if (!larkConfigured()) return null
  try {
    const data = (await larkFetch(
      `/open-apis/contact/v3/users/${encodeURIComponent(id)}?user_id_type=open_id`,
      { method: 'GET' },
    )) as {
      data?: {
        user?: {
          name?: string
          en_name?: string
          nickname?: string
        }
      }
    }
    const u = data.data?.user
    const name = (u?.name || u?.nickname || u?.en_name || '').trim()
    if (!name) return null
    userNameCache.set(id, { name, expireAt: Date.now() + 30 * 60_000 })
    return name
  } catch {
    return null
  }
}

/** Download image bytes for a message resource (image_key). */
export async function downloadMessageImage(messageId: string, imageKey: string): Promise<Buffer> {
  const token = await getTenantToken()
  const url = `${LARK_HOST}/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/resources/${encodeURIComponent(imageKey)}?type=image`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`image download failed (${r.status})`)
  return Buffer.from(await r.arrayBuffer())
}

export function verifyToken(token: string | undefined): boolean {
  const expected = process.env.LARK_VERIFICATION_TOKEN || ''
  if (!expected) return true // allow if not configured — ID/secret alone is enough
  return Boolean(token && token === expected)
}

/**
 * Bot open_id for precise @-mention matching.
 * Prefers LARK_BOT_OPEN_ID; otherwise fetches via bot/v3/info (cached).
 */
type BotInfo = { openId: string; appName: string }

async function fetchBotInfo(): Promise<BotInfo> {
  const data = (await larkFetch('/open-apis/bot/v3/info', { method: 'GET' })) as {
    bot?: { open_id?: string; app_name?: string }
    data?: { bot?: { open_id?: string; app_name?: string }; open_id?: string }
  }
  const bot = data.bot || data.data?.bot || {}
  return {
    openId: bot.open_id || data.data?.open_id || '',
    appName: bot.app_name || '',
  }
}

export async function resolveBotOpenId(): Promise<string> {
  const fromEnv = (process.env.LARK_BOT_OPEN_ID || '').trim()
  if (fromEnv) return fromEnv
  if (cachedBotOpenId && Date.now() < cachedBotOpenId.expireAt) return cachedBotOpenId.id
  if (!larkConfigured()) return ''
  try {
    const info = await fetchBotInfo()
    if (info.openId) {
      cachedBotOpenId = { id: info.openId, expireAt: Date.now() + 6 * 60 * 60 * 1000 }
      return info.openId
    }
  } catch {
    /* soft-fail — parse.ts falls back to any @mention */
  }
  return ''
}

/** Live connectivity probe used by GET /api/lark/event. */
export async function probeLarkConnection(): Promise<{
  tokenOk: boolean
  botName: string
  botOpenId: string
  chatCount: number
  chatNames: string[]
  error?: string
}> {
  if (!larkConfigured()) {
    return {
      tokenOk: false,
      botName: '',
      botOpenId: '',
      chatCount: 0,
      chatNames: [],
      error: 'LARK_APP_ID / LARK_APP_SECRET missing',
    }
  }
  try {
    await getTenantToken()
    const info = await fetchBotInfo()
    if (info.openId) {
      cachedBotOpenId = { id: info.openId, expireAt: Date.now() + 6 * 60 * 60 * 1000 }
      if (!process.env.LARK_BOT_OPEN_ID) process.env.LARK_BOT_OPEN_ID = info.openId
    }
    let chatCount = 0
    let chatNames: string[] = []
    try {
      const chats = (await larkFetch('/open-apis/im/v1/chats?page_size=50', { method: 'GET' })) as {
        data?: { items?: { name?: string; chat_id?: string }[] }
      }
      const items = chats.data?.items || []
      chatCount = items.length
      chatNames = items.map((c) => c.name || c.chat_id || '').filter(Boolean).slice(0, 10)
    } catch {
      /* listing chats needs im:chat scope — soft fail */
    }
    return {
      tokenOk: true,
      botName: info.appName || 'VE AI风控小助手',
      botOpenId: info.openId,
      chatCount,
      chatNames,
    }
  } catch (e) {
    return {
      tokenOk: false,
      botName: '',
      botOpenId: '',
      chatCount: 0,
      chatNames: [],
      error: e instanceof Error ? e.message : 'probe failed',
    }
  }
}
