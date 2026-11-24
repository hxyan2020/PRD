/**
 * AIPO Lark API UAT — authorized Wiki/Docs read + chat history (read-only).
 * Soft-fails to null when scopes/tokens are missing so callers can route to @Yan.
 */
import { getTenantToken, larkConfigured } from './client.js'

const LARK_HOST = process.env.LARK_API_HOST || 'https://open.feishu.cn'

type LarkJson = {
  code?: number
  msg?: string
  data?: unknown
}

async function larkGet(path: string): Promise<LarkJson> {
  const token = await getTenantToken()
  const r = await fetch(`${LARK_HOST}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  return (await r.json().catch(() => ({}))) as LarkJson
}

async function larkPost(path: string, body: Record<string, unknown>): Promise<LarkJson> {
  const token = await getTenantToken()
  const r = await fetch(`${LARK_HOST}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await r.json().catch(() => ({}))) as LarkJson
}

export type WikiHit = {
  title: string
  nodeToken?: string
  objToken?: string
  objType?: number | string
  url?: string
  snippet?: string
}

/** Search Lark Wiki / Docs by keyword (requires wiki/docx scopes). */
export async function searchLarkWiki(query: string, limit = 5): Promise<{
  ok: boolean
  hits: WikiHit[]
  error?: string
}> {
  const q = query.trim().slice(0, 200)
  if (!q) return { ok: false, hits: [], error: 'empty query' }
  if (!larkConfigured()) return { ok: false, hits: [], error: 'Lark credentials missing' }

  try {
    // Wiki v2 node search
    const data = await larkPost('/open-apis/wiki/v2/nodes/search', {
      query: q,
      page_size: Math.min(20, Math.max(1, limit)),
    })
    if (typeof data.code === 'number' && data.code !== 0) {
      return { ok: false, hits: [], error: data.msg || `wiki search code ${data.code}` }
    }
    const items =
      (
        data.data as {
          items?: {
            title?: string
            node_id?: string
            node_token?: string
            obj_token?: string
            obj_type?: number | string
            url?: string
            summary?: string
          }[]
        }
      )?.items || []
    const hits: WikiHit[] = items.slice(0, limit).map((it) => ({
      title: it.title || it.node_token || it.obj_token || 'untitled',
      nodeToken: it.node_token || it.node_id,
      objToken: it.obj_token,
      objType: it.obj_type,
      url: it.url,
      snippet: it.summary,
    }))
    return { ok: true, hits }
  } catch (e) {
    return {
      ok: false,
      hits: [],
      error: e instanceof Error ? e.message : 'wiki search failed',
    }
  }
}

/** Read raw text from a Docx document token (read-only). */
export async function readDocxRaw(documentId: string): Promise<{
  ok: boolean
  content: string
  error?: string
}> {
  const id = documentId.trim()
  if (!id) return { ok: false, content: '', error: 'empty document id' }
  if (!larkConfigured()) return { ok: false, content: '', error: 'Lark credentials missing' }
  try {
    const data = await larkGet(
      `/open-apis/docx/v1/documents/${encodeURIComponent(id)}/raw_content`,
    )
    if (typeof data.code === 'number' && data.code !== 0) {
      return { ok: false, content: '', error: data.msg || `docx code ${data.code}` }
    }
    const content = String((data.data as { content?: string })?.content || '').trim()
    return { ok: Boolean(content), content, error: content ? undefined : 'empty document' }
  } catch (e) {
    return {
      ok: false,
      content: '',
      error: e instanceof Error ? e.message : 'docx read failed',
    }
  }
}

/**
 * Fetch recent messages from an authorized chat (group or p2p).
 * Used to ground investigation with thread context — never invents history.
 */
export async function fetchChatHistory(
  chatId: string,
  pageSize = 15,
): Promise<{
  ok: boolean
  lines: string[]
  error?: string
}> {
  const id = chatId.trim()
  if (!id || id.startsWith('smoke_')) return { ok: false, lines: [], error: 'no chat' }
  if (!larkConfigured()) return { ok: false, lines: [], error: 'Lark credentials missing' }
  try {
    const qs = new URLSearchParams({
      container_id_type: 'chat',
      container_id: id,
      page_size: String(Math.min(50, Math.max(1, pageSize))),
      sort_type: 'ByCreateTimeDesc',
    })
    const data = await larkGet(`/open-apis/im/v1/messages?${qs.toString()}`)
    if (typeof data.code === 'number' && data.code !== 0) {
      return { ok: false, lines: [], error: data.msg || `im history code ${data.code}` }
    }
    const items =
      (
        data.data as {
          items?: {
            msg_type?: string
            body?: { content?: string }
            sender?: { id?: string; id_type?: string; sender_type?: string }
            create_time?: string
          }[]
        }
      )?.items || []
    const lines: string[] = []
    for (const it of items.slice(0, pageSize).reverse()) {
      const raw = it.body?.content || ''
      let text = ''
      try {
        const parsed = JSON.parse(raw) as { text?: string; content?: unknown }
        text = String(parsed.text || '').trim()
      } catch {
        text = raw.replace(/\s+/g, ' ').trim().slice(0, 240)
      }
      if (!text) continue
      const who = it.sender?.sender_type === 'app' ? 'bot' : 'user'
      lines.push(`[${who}] ${text.slice(0, 240)}`)
    }
    return { ok: lines.length > 0, lines }
  } catch (e) {
    return {
      ok: false,
      lines: [],
      error: e instanceof Error ? e.message : 'chat history failed',
    }
  }
}

/** Pull query text from a wiki/doc ask (drops leading verbs). */
export function extractWikiQuery(text: string): string {
  return text
    .replace(
      /^(请|請|帮我|幫我|帮忙|麻煩|麻烦)?\s*(查一下|查下|查询|查詢|搜索|搜尋|搜|打开|打開|读取|讀取|看看)?\s*/i,
      '',
    )
    .replace(/^(飞书|飛書|lark|feishu)?\s*(wiki|文档|文檔|知识库文档|知識庫文檔)\s*[：:：]?\s*/i, '')
    .replace(/\bwiki\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}
