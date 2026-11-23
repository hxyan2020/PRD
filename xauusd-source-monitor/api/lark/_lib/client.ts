/**
 * Lark / Feishu Open API helpers.
 * Env: LARK_APP_ID, LARK_APP_SECRET (required for outbound replies).
 * Optional: LARK_VERIFICATION_TOKEN, LARK_ENCRYPT_KEY.
 */

let cachedToken: { token: string; expireAt: number } | null = null

const LARK_HOST = process.env.LARK_API_HOST || 'https://open.feishu.cn'

export function larkConfigured() {
  return Boolean(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET)
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
      content: JSON.stringify({ text }),
    }),
  })
}

export async function replyCard(messageId: string, card: Record<string, unknown>) {
  return larkFetch(`/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      msg_type: 'interactive',
      content: JSON.stringify(card),
    }),
  })
}

export async function sendTextToChat(chatId: string, text: string) {
  return larkFetch(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  })
}

export async function sendCardToChat(chatId: string, card: Record<string, unknown>) {
  return larkFetch(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
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
  if (!expected) return true // allow if not configured (dev)
  return Boolean(token && token === expected)
}
