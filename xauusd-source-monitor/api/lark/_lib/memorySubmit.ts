/**
 * Skills / KB change submissions → Haixiang approval queue.
 * Approved patches land in durable overlays merged into Lark loadSkills/loadKnowledge.
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import type { KbItem, Lang, SkillRec } from './types.js'

const QUEUE_NAME = 'memory-submissions.json'
const LOG_NAME = 'memory-submission-log.json'
const SKILL_OVERLAY_NAME = 'memory-skills-overlay.json'
const KB_OVERLAY_NAME = 'memory-kb-overlay.json'

export type MemoryKind = 'skill' | 'knowledge'
export type MemoryOp = 'create' | 'update' | 'delete' | 'append'
export type MemorySubmissionStatus =
  | 'pending'
  | 'awaiting_reject_reason'
  | 'awaiting_edit'
  | 'approved'
  | 'rejected'
  | 'deleted'

export type MemorySkillPayload = {
  id: string
  level?: 'L1' | 'L2'
  name?: string
  severity?: string
  matchHints?: string
  linkedL1?: string
  check?: string
  action?: string
  opt?: string
}

export type MemoryKbPayload = {
  id: string
  title?: string
  body?: string
  /** When append: text to append to existing body. */
  appendText?: string
}

export type MemorySubmission = {
  id: string
  kind: MemoryKind
  op: MemoryOp
  /** Proposed patch (skill fields or kb fields). */
  payload: MemorySkillPayload | MemoryKbPayload
  /** Free-text note from submitter. */
  note?: string
  submitterOpenId: string
  submitterName?: string
  submitterEmail?: string
  source: 'lark' | 'web'
  createdAt: number
  updatedAt: number
  status: MemorySubmissionStatus
  rejectReason?: string
  approvedAt?: number
  approvedBy?: string
  /** Final payload after Haixiang edit (if any). */
  finalPayload?: MemorySkillPayload | MemoryKbPayload
  /** Applied node id (may equal payload.id). */
  appliedNodeId?: string
}

type QueueStore = Record<string, MemorySubmission>
type LogStore = { entries: MemorySubmission[] }
type SkillOverlayStore = {
  upserts: Record<string, SkillRec>
  deleted: string[]
}
type KbOverlayStore = {
  upserts: Record<string, KbItem>
  deleted: string[]
}

let skillOverlayCache: SkillOverlayStore | null = null
let kbOverlayCache: KbOverlayStore | null = null
let overlayHydrated = false

function newId(): string {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

async function readQueue(): Promise<QueueStore> {
  return (await readDurableJson<QueueStore>(QUEUE_NAME)) || {}
}

async function writeQueue(store: QueueStore): Promise<boolean> {
  return writeDurableJson(QUEUE_NAME, store)
}

async function appendLog(item: MemorySubmission): Promise<void> {
  const log = (await readDurableJson<LogStore>(LOG_NAME)) || { entries: [] }
  log.entries = [item, ...(log.entries || [])].slice(0, 500)
  await writeDurableJson(LOG_NAME, log)
}

export async function hydrateMemoryOverlays(): Promise<void> {
  if (overlayHydrated) return
  try {
    skillOverlayCache =
      (await readDurableJson<SkillOverlayStore>(SKILL_OVERLAY_NAME)) || {
        upserts: {},
        deleted: [],
      }
    kbOverlayCache =
      (await readDurableJson<KbOverlayStore>(KB_OVERLAY_NAME)) || {
        upserts: {},
        deleted: [],
      }
  } catch {
    skillOverlayCache = { upserts: {}, deleted: [] }
    kbOverlayCache = { upserts: {}, deleted: [] }
  }
  overlayHydrated = true
}

/** Sync peek after hydrateMemoryOverlays (or empty defaults). */
export function peekSkillOverlay(): SkillOverlayStore {
  return skillOverlayCache || { upserts: {}, deleted: [] }
}

export function peekKbOverlay(): KbOverlayStore {
  return kbOverlayCache || { upserts: {}, deleted: [] }
}

export function invalidateSkillsKbCaches(): void {
  // Caller (skills.ts) clears its module caches when overlays change.
}

async function persistSkillOverlay(store: SkillOverlayStore): Promise<void> {
  skillOverlayCache = store
  await writeDurableJson(SKILL_OVERLAY_NAME, store)
}

async function persistKbOverlay(store: KbOverlayStore): Promise<void> {
  kbOverlayCache = store
  await writeDurableJson(KB_OVERLAY_NAME, store)
}

export async function listMemorySubmissions(opts?: {
  status?: MemorySubmissionStatus | 'open'
  limit?: number
}): Promise<MemorySubmission[]> {
  const store = await readQueue()
  const limit = opts?.limit ?? 50
  let rows = Object.values(store)
  if (opts?.status === 'open') {
    rows = rows.filter((r) =>
      ['pending', 'awaiting_reject_reason', 'awaiting_edit'].includes(r.status),
    )
  } else if (opts?.status) {
    rows = rows.filter((r) => r.status === opts.status)
  }
  return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
}

export async function getMemorySubmission(
  id: string,
): Promise<MemorySubmission | null> {
  const store = await readQueue()
  return store[id] || null
}

export async function createMemorySubmission(input: {
  kind: MemoryKind
  op: MemoryOp
  payload: MemorySkillPayload | MemoryKbPayload
  note?: string
  submitterOpenId: string
  submitterName?: string
  submitterEmail?: string
  source: 'lark' | 'web'
}): Promise<MemorySubmission> {
  const store = await readQueue()
  const now = Date.now()
  const item: MemorySubmission = {
    id: newId(),
    kind: input.kind,
    op: input.op,
    payload: input.payload,
    note: (input.note || '').trim() || undefined,
    submitterOpenId: input.submitterOpenId,
    submitterName: input.submitterName,
    submitterEmail: input.submitterEmail,
    source: input.source,
    createdAt: now,
    updatedAt: now,
    status: 'pending',
  }
  store[item.id] = item
  await writeQueue(store)
  return item
}

export async function updateMemorySubmission(
  id: string,
  patch: Partial<MemorySubmission>,
): Promise<MemorySubmission | null> {
  const store = await readQueue()
  const cur = store[id]
  if (!cur) return null
  const next = { ...cur, ...patch, id: cur.id, updatedAt: Date.now() }
  store[id] = next
  await writeQueue(store)
  return next
}

export async function deleteMemorySubmission(
  id: string,
  byOpenId: string,
): Promise<{ ok: boolean; item?: MemorySubmission; error?: string }> {
  const store = await readQueue()
  const cur = store[id]
  if (!cur) return { ok: false, error: 'not_found' }
  if (cur.submitterOpenId !== byOpenId && cur.status === 'pending') {
    // Submitter may delete own pending; admin path uses status deleted separately.
  }
  if (
    cur.submitterOpenId !== byOpenId &&
    !['pending', 'awaiting_reject_reason', 'awaiting_edit'].includes(cur.status)
  ) {
    return { ok: false, error: 'forbidden' }
  }
  // Only submitter can soft-delete their pending proposal.
  if (cur.submitterOpenId !== byOpenId) {
    return { ok: false, error: 'forbidden' }
  }
  if (!['pending', 'awaiting_edit', 'awaiting_reject_reason'].includes(cur.status)) {
    return { ok: false, error: 'not_pending' }
  }
  const next = { ...cur, status: 'deleted' as const, updatedAt: Date.now() }
  store[id] = next
  await writeQueue(store)
  await appendLog(next)
  return { ok: true, item: next }
}

export function deskNodeUrl(kind: MemoryKind, nodeId: string): string {
  const base =
    kind === 'skill'
      ? 'https://vex-llm-proxy.vercel.app/#/skills'
      : 'https://vex-llm-proxy.vercel.app/#/knowledge'
  return `${base}?node=${encodeURIComponent(nodeId)}`
}

export function parentDeskUrl(kind: MemoryKind): string {
  return kind === 'skill'
    ? 'https://vex-llm-proxy.vercel.app/#/skills'
    : 'https://vex-llm-proxy.vercel.app/#/knowledge'
}

/** Advise where the change should land in the catalogue. */
export function adviseMemoryPath(
  item: MemorySubmission,
  currentSkills: SkillRec[],
  currentKb: KbItem[],
  lang: Lang,
): { path: string; pre: string; post: string } {
  if (item.kind === 'skill') {
    const p = item.finalPayload || item.payload
    const skill = p as MemorySkillPayload
    const existing = currentSkills.find(
      (s) => s.id.toLowerCase() === String(skill.id || '').toLowerCase(),
    )
    const level = skill.level || existing?.level || 'L1'
    const path =
      lang === 'zh-Hans'
        ? `Skills → **${level}** → 节点 **${skill.id}**`
        : lang === 'zh-Hant'
          ? `Skills → **${level}** → 節點 **${skill.id}**`
          : `Skills → **${level}** → node **${skill.id}**`
    const pre = existing
      ? formatSkillSnapshot(existing)
      : lang === 'zh-Hans'
        ? '（新建 — 当前无此节点）'
        : lang === 'zh-Hant'
          ? '（新建 — 當前無此節點）'
          : '(new — node does not exist yet)'
    const post =
      item.op === 'delete'
        ? lang === 'zh-Hans'
          ? `将删除节点 **${skill.id}**`
          : lang === 'zh-Hant'
            ? `將刪除節點 **${skill.id}**`
            : `Will delete node **${skill.id}**`
        : formatSkillSnapshot(mergeSkill(existing, skill))
    return { path, pre, post }
  }

  const p = (item.finalPayload || item.payload) as MemoryKbPayload
  const existing = currentKb.find(
    (k) => k.id.toLowerCase() === String(p.id || '').toLowerCase(),
  )
  const path =
    lang === 'zh-Hans'
      ? `知识库 → 节点 **${p.id}**`
      : lang === 'zh-Hant'
        ? `知識庫 → 節點 **${p.id}**`
        : `Knowledge → node **${p.id}**`
  const pre = existing
    ? `**${existing.title}**\n${(existing.body || '').slice(0, 800)}`
    : lang === 'zh-Hans'
      ? '（新建 — 当前无此节点）'
      : lang === 'zh-Hant'
        ? '（新建 — 當前無此節點）'
        : '(new — node does not exist yet)'
  let postBody = p.body ?? existing?.body ?? ''
  if (item.op === 'append' && p.appendText) {
    postBody = `${existing?.body || ''}\n\n${p.appendText}`.trim()
  }
  const post =
    item.op === 'delete'
      ? lang === 'zh-Hans'
        ? `将删除节点 **${p.id}**`
        : lang === 'zh-Hant'
          ? `將刪除節點 **${p.id}**`
          : `Will delete node **${p.id}**`
      : `**${p.title || existing?.title || p.id}**\n${postBody.slice(0, 800)}`
  return { path, pre, post }
}

function formatSkillSnapshot(s: SkillRec): string {
  return [
    `**${s.id}** · ${s.name} · ${s.level} · ${s.severity}`,
    s.matchHints ? `hints: ${s.matchHints}` : '',
    s.check ? `check: ${s.check.slice(0, 240)}` : '',
    s.action ? `action: ${s.action.slice(0, 240)}` : '',
    s.opt ? `opt: ${s.opt.slice(0, 160)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function mergeSkill(
  existing: SkillRec | undefined,
  patch: MemorySkillPayload,
): SkillRec {
  return {
    id: patch.id || existing?.id || 'UNKNOWN',
    level: patch.level || existing?.level || 'L1',
    name: patch.name || existing?.name || patch.id || 'Untitled',
    severity: patch.severity || existing?.severity || 'P2',
    matchHints: patch.matchHints ?? existing?.matchHints ?? '',
    linkedL1: patch.linkedL1 ?? existing?.linkedL1 ?? '',
    check: patch.check ?? existing?.check ?? '',
    action: patch.action ?? existing?.action ?? '',
    opt: patch.opt ?? existing?.opt ?? '',
  }
}

/**
 * Apply an approved submission into durable overlays.
 * Returns applied node id (or parent catalogue for deletes).
 */
export async function applyMemorySubmission(
  item: MemorySubmission,
  currentSkills: SkillRec[],
  currentKb: KbItem[],
): Promise<{ nodeId: string; kind: MemoryKind }> {
  await hydrateMemoryOverlays()
  const payload = (item.finalPayload || item.payload) as
    | MemorySkillPayload
    | MemoryKbPayload

  if (item.kind === 'skill') {
    const p = payload as MemorySkillPayload
    const id = String(p.id || '').trim()
    const skills = peekSkillOverlay()
    if (item.op === 'delete') {
      const deleted = new Set(skills.deleted || [])
      deleted.add(id)
      const upserts = { ...(skills.upserts || {}) }
      delete upserts[id]
      await persistSkillOverlay({ upserts, deleted: [...deleted] })
      return { nodeId: id, kind: 'skill' }
    }
    const existing =
      currentSkills.find((s) => s.id.toLowerCase() === id.toLowerCase()) ||
      skills.upserts[id]
    const merged = mergeSkill(existing, p)
    const deleted = (skills.deleted || []).filter(
      (x) => x.toLowerCase() !== id.toLowerCase(),
    )
    await persistSkillOverlay({
      upserts: { ...(skills.upserts || {}), [merged.id]: merged },
      deleted,
    })
    return { nodeId: merged.id, kind: 'skill' }
  }

  const p = payload as MemoryKbPayload
  const id = String(p.id || '').trim()
  const kb = peekKbOverlay()
  if (item.op === 'delete') {
    const deleted = new Set(kb.deleted || [])
    deleted.add(id)
    const upserts = { ...(kb.upserts || {}) }
    delete upserts[id]
    await persistKbOverlay({ upserts, deleted: [...deleted] })
    return { nodeId: id, kind: 'knowledge' }
  }
  const existing =
    currentKb.find((k) => k.id.toLowerCase() === id.toLowerCase()) ||
    kb.upserts[id]
  let body = p.body ?? existing?.body ?? ''
  if (item.op === 'append' && p.appendText) {
    body = `${existing?.body || ''}\n\n${p.appendText}`.trim()
  }
  const next: KbItem = {
    id,
    title: p.title || existing?.title || id,
    body,
  }
  const deleted = (kb.deleted || []).filter(
    (x) => x.toLowerCase() !== id.toLowerCase(),
  )
  await persistKbOverlay({
    upserts: { ...(kb.upserts || {}), [id]: next },
    deleted,
  })
  return { nodeId: id, kind: 'knowledge' }
}

export async function finalizeApprovedSubmission(
  id: string,
  adminOpenId: string,
  currentSkills: SkillRec[],
  currentKb: KbItem[],
  finalPayload?: MemorySkillPayload | MemoryKbPayload,
): Promise<MemorySubmission | null> {
  let item = await getMemorySubmission(id)
  if (!item) return null
  if (finalPayload) {
    item = (await updateMemorySubmission(id, { finalPayload })) || item
  }
  const applied = await applyMemorySubmission(item, currentSkills, currentKb)
  const next = await updateMemorySubmission(id, {
    status: 'approved',
    approvedAt: Date.now(),
    approvedBy: adminOpenId,
    appliedNodeId: applied.nodeId,
    finalPayload: finalPayload || item.finalPayload || item.payload,
  })
  if (next) await appendLog(next)
  return next
}

export async function finalizeRejectedSubmission(
  id: string,
  reason: string,
): Promise<MemorySubmission | null> {
  const next = await updateMemorySubmission(id, {
    status: 'rejected',
    rejectReason: reason.trim(),
  })
  if (next) await appendLog(next)
  return next
}

export async function findAwaitingAdminSubmission(
  adminOpenId: string,
): Promise<MemorySubmission | null> {
  const open = await listMemorySubmissions({ status: 'open', limit: 100 })
  return (
    open.find(
      (s) =>
        (s.status === 'awaiting_reject_reason' || s.status === 'awaiting_edit') &&
        // Any admin edit/reject in flight — only one expected at a time.
        true,
    ) || null
  )
}

export function formatSubmissionSummary(
  item: MemorySubmission,
  lang: Lang,
): string {
  const when = new Date(item.createdAt).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  })
  const who =
    item.submitterName ||
    item.submitterEmail ||
    (item.submitterOpenId
      ? `${item.submitterOpenId.slice(0, 10)}…`
      : 'unknown')
  const kind =
    item.kind === 'skill'
      ? lang === 'en'
        ? 'Skill'
        : '技能'
      : lang === 'en'
        ? 'Knowledge'
        : lang === 'zh-Hant'
          ? '知識庫'
          : '知识库'
  const op = item.op
  const id =
    (item.payload as { id?: string }).id || item.appliedNodeId || '—'
  const note = item.note ? `\n• Note: ${item.note}` : ''
  if (lang === 'zh-Hans') {
    return [
      `• **类型：** ${kind}／${op}`,
      `• **节点：** ${id}`,
      `• **提交人：** ${who}`,
      `• **时间：** ${when}（东八区）`,
      `• **来源：** ${item.source}`,
      note,
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      `• **類型：** ${kind}／${op}`,
      `• **節點：** ${id}`,
      `• **提交人：** ${who}`,
      `• **時間：** ${when}（東八區）`,
      `• **來源：** ${item.source}`,
      note,
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    `• **Kind:** ${kind} / ${op}`,
    `• **Node:** ${id}`,
    `• **Submitter:** ${who}`,
    `• **When:** ${when} (Asia/Shanghai)`,
    `• **Source:** ${item.source}`,
    note,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Parse a free-text Lark proposal into a rough submission draft. */
export function parseLarkMemoryProposal(text: string): {
  kind: MemoryKind
  op: MemoryOp
  payload: MemorySkillPayload | MemoryKbPayload
  note: string
} | null {
  const t = text.trim()
  if (!t) return null
  const isKb =
    /知识库|知識庫|\bkb\b|knowledge/i.test(t) && !/技能|skill/i.test(t.slice(0, 40))
  const kind: MemoryKind = isKb ? 'knowledge' : 'skill'
  const op: MemoryOp = /删除|刪除|delete|remove/i.test(t)
    ? 'delete'
    : /追加|append|补充|補充/i.test(t)
      ? 'append'
      : /新建|创建|add\b|new\b/i.test(t)
        ? 'create'
        : 'update'

  const idMatch =
    t.match(
      /\b(L[12]-\d{1,2}|L2-[A-F]|ve-doc-[a-z0-9_-]+|kb_default_\d+|kb_[a-z0-9_-]+)\b/i,
    ) || t.match(/(?:节点|節點|id|ID)\s*[:：#]?\s*([A-Za-z][A-Za-z0-9_-]{1,48})/)
  const id =
    idMatch?.[1] ||
    (kind === 'skill'
      ? `L1-CUSTOM-${Date.now().toString(36).slice(-4).toUpperCase()}`
      : `kb_${Date.now().toString(36)}`)

  // Body: after first newline or after separator
  const parts = t.split(/\n+|——+|---+/).map((x) => x.trim()).filter(Boolean)
  const body = parts.slice(1).join('\n').trim() || parts[0] || t

  if (kind === 'skill') {
    const nameMatch = t.match(/(?:名称|名稱|name)\s*[:：]\s*(.+)/i)
    return {
      kind,
      op,
      payload: {
        id,
        name: nameMatch?.[1]?.trim() || id,
        level: /L2/i.test(t) ? 'L2' : 'L1',
        severity: (t.match(/\bP[0-3]\b/) || ['P2'])[0]!,
        check: op === 'delete' ? '' : body.slice(0, 4000),
        action: '',
        opt: '',
        matchHints: id,
      },
      note: t.slice(0, 500),
    }
  }
  const titleMatch = t.match(/(?:标题|標題|title)\s*[:：]\s*(.+)/i)
  return {
    kind,
    op,
    payload: {
      id,
      title: titleMatch?.[1]?.trim() || id,
      body: op === 'append' ? undefined : body.slice(0, 8000),
      appendText: op === 'append' ? body.slice(0, 8000) : undefined,
    },
    note: t.slice(0, 500),
  }
}
