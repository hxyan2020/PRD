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

export async function replyText(messageId: string, text: string) {
  return larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      msg_type: 'text',
      content: JSON.stringify({ text: toPlainText(text) }),
    }),
  })
}

export async function replyCard(messageId: string, card: Record<string, unknown>) {
  return larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      msg_type: 'interactive',
      content: JSON.stringify(plainCard(card)),
    }),
  })
}

export async function sendTextToChat(chatId: string, text: string) {
  return larkFetch(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text: toPlainText(text) }),
    }),
  })
}

export async function sendCardToChat(chatId: string, card: Record<string, unknown>) {
  return larkFetch(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(plainCard(card)),
    }),
  })
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
