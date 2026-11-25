/**
 * AIPO Lark API UAT — authorized Wiki/Docs read (read-only).
 *
 * Important: POST /wiki/v2/nodes/search requires user_access_token only and
 * returns 99991663 ("Invalid access token…") when called with tenant_access_token.
 * Bot identity uses tenant_access_token via:
 *   - GET  /wiki/v2/spaces
 *   - POST /search/v2/doc_wiki/search  (search:docs:read)
 *   - GET  /wiki/v2/spaces/get_node
 *   - GET  /docx/v1/documents/:id/raw_content
 *
 * Soft-fails with actionable errors when scopes / wiki membership are missing.
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

export type WikiSpace = {
  spaceId: string
  name: string
  description?: string
}

function configuredSpaceIds(): string[] {
  const raw = (process.env.LARK_WIKI_SPACE_IDS || '').trim()
  if (!raw) return []
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function stripHighlight(s: string | undefined): string {
  return String(s || '')
    .replace(/<\/?h>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** List wiki spaces the app bot can see (tenant token). */
export async function listWikiSpaces(limit = 20): Promise<{
  ok: boolean
  spaces: WikiSpace[]
  error?: string
}> {
  if (!larkConfigured()) return { ok: false, spaces: [], error: 'Lark credentials missing' }
  try {
    const data = await larkGet(
      `/open-apis/wiki/v2/spaces?page_size=${Math.min(50, Math.max(1, limit))}`,
    )
    if (typeof data.code === 'number' && data.code !== 0) {
      return { ok: false, spaces: [], error: data.msg || `wiki spaces code ${data.code}` }
    }
    const items =
      (
        data.data as {
          items?: { space_id?: string; name?: string; description?: string }[]
        }
      )?.items || []
    const spaces: WikiSpace[] = items
      .map((it) => ({
        spaceId: String(it.space_id || '').trim(),
        name: String(it.name || it.space_id || 'wiki').trim(),
        description: it.description,
      }))
      .filter((s) => s.spaceId)
    return { ok: true, spaces }
  } catch (e) {
    return {
      ok: false,
      spaces: [],
      error: e instanceof Error ? e.message : 'wiki spaces failed',
    }
  }
}

/**
 * Resolve a wiki node_token → obj_token (docx document id) for content read.
 * Wiki URLs use node_token; docx APIs need the underlying obj_token.
 */
export async function resolveWikiNode(nodeToken: string): Promise<{
  ok: boolean
  nodeToken?: string
  objToken?: string
  objType?: string | number
  title?: string
  spaceId?: string
  error?: string
}> {
  const token = nodeToken.trim()
  if (!token) return { ok: false, error: 'empty node token' }
  if (!larkConfigured()) return { ok: false, error: 'Lark credentials missing' }
  try {
    const data = await larkGet(
      `/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(token)}`,
    )
    if (typeof data.code === 'number' && data.code !== 0) {
      return { ok: false, error: data.msg || `wiki get_node code ${data.code}` }
    }
    const node = (data.data as { node?: Record<string, unknown> })?.node || {}
    const objToken = String(node.obj_token || '').trim()
    return {
      ok: Boolean(objToken),
      nodeToken: String(node.node_token || token),
      objToken: objToken || undefined,
      objType: (node.obj_type as string | number | undefined) ?? undefined,
      title: node.title ? String(node.title) : undefined,
      spaceId: node.space_id ? String(node.space_id) : undefined,
      error: objToken ? undefined : 'wiki node has no obj_token',
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'wiki get_node failed',
    }
  }
}

/**
 * Search authorized Wiki / Docs with tenant_access_token.
 * Uses search/v2/doc_wiki/search (NOT wiki/v2/nodes/search).
 */
export async function searchLarkWiki(query: string, limit = 5): Promise<{
  ok: boolean
  hits: WikiHit[]
  error?: string
  spaceIds?: string[]
  hint?: string
}> {
  const q = query.trim().slice(0, 30)
  if (!q) return { ok: false, hits: [], error: 'empty query' }
  if (!larkConfigured()) return { ok: false, hits: [], error: 'Lark credentials missing' }

  try {
    let spaceIds = configuredSpaceIds()
    if (!spaceIds.length) {
      const listed = await listWikiSpaces(50)
      if (!listed.ok) {
        return {
          ok: false,
          hits: [],
          error: listed.error || 'wiki spaces unavailable',
          hint: 'wiki_membership',
        }
      }
      spaceIds = listed.spaces.map((s) => s.spaceId)
    }

    if (!spaceIds.length) {
      return {
        ok: true,
        hits: [],
        spaceIds: [],
        hint: 'wiki_membership',
      }
    }

    const body: Record<string, unknown> = {
      query: q,
      page_size: Math.min(20, Math.max(1, limit)),
      wiki_filter: { space_ids: spaceIds.slice(0, 50) },
    }

    const data = await larkPost('/open-apis/search/v2/doc_wiki/search', body)
    if (typeof data.code === 'number' && data.code !== 0) {
      return {
        ok: false,
        hits: [],
        error: data.msg || `doc_wiki search code ${data.code}`,
        spaceIds,
        hint:
          data.code === 99991672 || /scope|permission|权限/i.test(String(data.msg || ''))
            ? 'missing_search_scope'
            : undefined,
      }
    }

    const units =
      (
        data.data as {
          res_units?: {
            title_highlighted?: string
            summary_highlighted?: string
            entity_type?: string
            result_meta?: {
              token?: string
              url?: string
              doc_types?: string
              title?: string
            }
          }[]
        }
      )?.res_units || []

    const hits: WikiHit[] = units.slice(0, limit).map((u) => {
      const meta = u.result_meta || {}
      const title = stripHighlight(u.title_highlighted) || meta.title || meta.token || 'untitled'
      const token = String(meta.token || '').trim()
      const isWiki = String(u.entity_type || '').toUpperCase() === 'WIKI'
      return {
        title,
        nodeToken: isWiki ? token || undefined : undefined,
        objToken: !isWiki ? token || undefined : undefined,
        objType: meta.doc_types || u.entity_type,
        url: meta.url,
        snippet: stripHighlight(u.summary_highlighted).slice(0, 240) || undefined,
      }
    })

    // Resolve wiki node_tokens → obj_token for excerpt reads
    for (const hit of hits) {
      if (hit.objToken || !hit.nodeToken) continue
      const resolved = await resolveWikiNode(hit.nodeToken)
      if (resolved.ok && resolved.objToken) {
        hit.objToken = resolved.objToken
        if (resolved.title) hit.title = resolved.title
      }
    }

    if (!hits.length && !spaceIds.length) {
      return {
        ok: true,
        hits: [],
        spaceIds,
        hint: 'wiki_membership',
        error: undefined,
      }
    }

    return { ok: true, hits, spaceIds }
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
 * Read a pasted Feishu docx or wiki link (tenant token).
 * Wiki URLs need get_node first; docx URLs use the path token directly.
 */
export async function readLarkDocByToken(args: {
  token: string
  kind?: string
}): Promise<{
  ok: boolean
  content: string
  title?: string
  url?: string
  error?: string
}> {
  const token = args.token.trim()
  const kind = (args.kind || '').toLowerCase()
  if (!token) return { ok: false, content: '', error: 'empty token' }

  let docId = token
  let title: string | undefined
  if (kind === 'wiki' || (!kind && token.length >= 10)) {
    const node = await resolveWikiNode(token)
    if (node.ok && node.objToken) {
      docId = node.objToken
      title = node.title
    } else if (kind === 'wiki') {
      return { ok: false, content: '', error: node.error || 'wiki node unresolved' }
    }
  }

  const raw = await readDocxRaw(docId)
  return {
    ok: raw.ok,
    content: raw.content,
    title,
    error: raw.error,
  }
}

/**
 * Setup checklist when the bot has credentials but no wiki visibility.
 * Shown in Feishu cards — do not invent document content.
 */
export function wikiAccessSetupHint(lang: 'zh-Hans' | 'zh-Hant' | 'en'): string {
  if (lang === 'zh-Hans') {
    return [
      '🛠️ **开通步骤（应用身份 / tenant）**',
      '1. 开发者后台给本应用开通：`search:docs:read`、Wiki 只读、云文档只读，并**发布版本**。',
      '2. 建一个含本机器人为成员的群，在目标知识库「成员设置」里把该群加成**可阅读**成员；或把应用加成文档协作者（… → 添加文档应用）。',
      '3. 可选：在 Vercel 设置 `LARK_WIKI_SPACE_IDS`（逗号分隔 space_id）缩小搜索范围。',
      '4. 也可直接把 **文档链接** 发给我，我按授权读取正文摘要。',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🛠️ **開通步驟（應用身份 / tenant）**',
      '1. 開發者後台開通：`search:docs:read`、Wiki 唯讀、雲文件唯讀，並**發布版本**。',
      '2. 建立含本機器人的群，於知識庫「成員設定」將該群加為**可閱讀**；或把應用加為文件協作者。',
      '3. 可選：Vercel 設定 `LARK_WIKI_SPACE_IDS`。',
      '4. 也可直接傳 **文件連結**，我按授權讀取摘要。',
    ].join('\n')
  }
  return [
    '🛠️ **Setup (app / tenant identity)**',
    '1. Enable `search:docs:read` + Wiki/Docs read scopes on the app and **publish**.',
    '2. Add a group that includes this bot as a **read** member of the Wiki space, or add the app as a doc collaborator.',
    '3. Optional: set `LARK_WIKI_SPACE_IDS` on Vercel.',
    '4. Or paste a **doc link** and I’ll summarize within authorized scope.',
  ].join('\n')
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
