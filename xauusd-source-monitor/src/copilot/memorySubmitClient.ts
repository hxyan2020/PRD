import { loadSettings } from './storage'

export type WebMemoryKind = 'skill' | 'knowledge'
export type WebMemoryOp = 'create' | 'update' | 'delete' | 'append'

export async function submitMemoryProposal(input: {
  kind: WebMemoryKind
  op: WebMemoryOp
  payload: Record<string, unknown>
  note?: string
  submitterName?: string
  submitterEmail?: string
  lang?: string
}): Promise<{ ok: boolean; itemId?: string; error?: string }> {
  const settings = loadSettings()
  const base = (settings.proxyBase || '').replace(/\/$/, '')
  const url = `${base}/api/lark/memory-submit`
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (settings.deskToken) headers['X-Desk-Token'] = settings.deskToken
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        kind: input.kind,
        op: input.op,
        payload: input.payload,
        note: input.note,
        submitterOpenId: `web:${input.submitterEmail || 'anonymous'}`,
        submitterName: input.submitterName,
        submitterEmail: input.submitterEmail,
        lang: input.lang || 'zh-Hans',
        notifyAdmin: true,
      }),
    })
    const j = (await r.json()) as { ok?: boolean; item?: { id?: string }; error?: string }
    if (!r.ok || !j.ok) {
      return { ok: false, error: j.error || `HTTP ${r.status}` }
    }
    return { ok: true, itemId: j.item?.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'submit failed' }
  }
}
