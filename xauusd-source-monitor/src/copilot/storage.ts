import { canEditContentMemory, type UserRole } from '../auth/users'
import { DEFAULT_KB, L1_SKILLS, L2_CHAINS } from './data/catalog'
import type {
  CopilotSettings,
  IncidentRecord,
  KbNode,
  KnowledgeItem,
  SkillRecord,
} from './types'

const AUTH_SESSION_KEY = 'vex_risk_tool_session_v1'

/** Hard gate for Skills / KB / skill-override writes — Yan Haixiang only. */
function assertContentAdminWrite(surface: string) {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) throw new Error(`content_admin_required:${surface}`)
    const session = JSON.parse(raw) as { email?: string; role?: UserRole }
    if (
      !canEditContentMemory({
        email: String(session.email || ''),
        role: (session.role || 'analyst') as UserRole,
      })
    ) {
      throw new Error(`content_admin_required:${surface}`)
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('content_admin_required:')) throw err
    throw new Error(`content_admin_required:${surface}`)
  }
}

const HISTORY_KEY = 'vex_risk_copilot_history_v1'
const KB_KEY = 'vex_risk_copilot_kb_v1'
const KB_TREE_KEY = 'vex_risk_copilot_kb_tree_v1'
const SKILLS_KEY = 'vex_risk_copilot_skills_v1'
const SKILL_OVERRIDES_KEY = 'vex_risk_copilot_skill_overrides_v1'
const SETTINGS_KEY = 'vex_risk_copilot_settings_v1'
const PERIODIC_DIGESTS_KEY = 'vex_risk_periodic_digests_v1'
/** Shared with xauusd-source-monitor briefings */
export const BRIEFINGS_KEY = 'xauusd-monitor-briefings-v8'

declare const __VEX_LLM_PROXY_BASE__: string

function builtInProxyBase(): string {
  if (typeof __VEX_LLM_PROXY_BASE__ === 'string' && __VEX_LLM_PROXY_BASE__.trim()) {
    return __VEX_LLM_PROXY_BASE__.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return 'http://127.0.0.1:8791'
  }
  return ''
}

const DEFAULT_SETTINGS: CopilotSettings = {
  /** Prefer real LLM via managed gateway; falls back to local rules if offline. */
  provider: 'openai',
  model: 'gpt-4o-mini',
  openaiKey: '',
  anthropicKey: '',
  geminiKey: '',
  openrouterKey: '',
  /** Managed /api/chat base — filled from llm-config.json or build define. */
  proxyBase: builtInProxyBase(),
  deskToken: '',
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadHistory(): IncidentRecord[] {
  return readJson(HISTORY_KEY, [])
}

export function saveHistory(list: IncidentRecord[]) {
  writeJson(HISTORY_KEY, list.slice(0, 200))
}

/** @deprecated flat KB — prefer loadKnowledgeTree */
export function loadKnowledge(): KnowledgeItem[] {
  const stored = readJson<KnowledgeItem[] | null>(KB_KEY, null)
  if (!stored?.length) return DEFAULT_KB.map((k) => ({ ...k }))
  return stored
}

export function saveKnowledge(list: KnowledgeItem[]) {
  assertContentAdminWrite('knowledge')
  writeJson(KB_KEY, list)
}

export function defaultKnowledgeTree(): KbNode[] {
  const rootId = 'kb_root'
  const now = Date.now()
  const nodes: KbNode[] = [
    {
      id: rootId,
      parentId: null,
      title: 'V Exchange Risk Knowledge',
      body: 'Root of the RAG knowledge tree used by Investigate.',
      order: 0,
      updatedAt: now,
    },
  ]
  DEFAULT_KB.forEach((k, i) => {
    nodes.push({
      id: k.id,
      parentId: rootId,
      title: k.title,
      body: k.body,
      order: i + 1,
      updatedAt: k.updatedAt || now,
    })
  })
  return nodes
}

function migrateFlatToTree(flat: KnowledgeItem[]): KbNode[] {
  const rootId = 'kb_root'
  const now = Date.now()
  return [
    {
      id: rootId,
      parentId: null,
      title: 'V Exchange Risk Knowledge',
      body: 'Root of the RAG knowledge tree used by Investigate.',
      order: 0,
      updatedAt: now,
    },
    ...flat.map((k, i) => ({
      id: k.id,
      parentId: rootId,
      title: k.title,
      body: k.body,
      order: i + 1,
      updatedAt: k.updatedAt || now,
    })),
  ]
}

export function loadKnowledgeTree(): KbNode[] {
  const stored = readJson<KbNode[] | null>(KB_TREE_KEY, null)
  if (stored?.length) return stored
  const flat = readJson<KnowledgeItem[] | null>(KB_KEY, null)
  if (flat?.length) {
    const tree = migrateFlatToTree(flat)
    writeJson(KB_TREE_KEY, tree)
    return tree
  }
  return defaultKnowledgeTree()
}

export function saveKnowledgeTree(nodes: KbNode[]) {
  assertContentAdminWrite('knowledge')
  writeJson(KB_TREE_KEY, nodes)
  // Keep flat mirror for older analyze paths / RAG flatten
  const docs = nodes.filter((n) => n.parentId != null && n.body.trim())
  writeJson(
    KB_KEY,
    docs.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      updatedAt: n.updatedAt,
    })),
  )
}

export function kbPath(nodes: KbNode[], id: string): string {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const parts: string[] = []
  let cur = byId.get(id)
  while (cur) {
    parts.unshift(cur.title)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  return parts.join(' / ')
}

export function flattenKbDocs(nodes: KbNode[]): KnowledgeItem[] {
  return nodes
    .filter((n) => n.parentId != null && n.body.trim())
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      updatedAt: n.updatedAt,
    }))
}

export type SkillOverrides = Record<
  string,
  Partial<Pick<SkillRecord, 'severity' | 'check' | 'action' | 'opt' | 'name' | 'description' | 'matchHints' | 'disabled' | 'archivedAt'>>
>

export function loadSkillOverrides(): SkillOverrides {
  return readJson(SKILL_OVERRIDES_KEY, {})
}

export function saveSkillOverrides(v: SkillOverrides) {
  assertContentAdminWrite('memory')
  writeJson(SKILL_OVERRIDES_KEY, v)
}

export function defaultSkills(): SkillRecord[] {
  const now = 0
  /** Real alert/event titles & OCR phrases → which skill owns the investigation. */
  const hintBoost: Record<string, string> = {
    'IDX-01':
      '指数源变更剔除告警 指数源剔除 剔除告警 剔除 BYBIT_INDEX OKX_INDEX source removal removed constituent',
    'IDX-02':
      '指数源变更恢复告警 指数源恢复 恢复告警 恢复 BYBIT_INDEX source recovery recovered constituent',
    'IDX-05': 'Index 无有效源 无有效源 no valid source',
    'IDX-06':
      '指数价格线性过渡开始 线性过渡开始 线性过渡 平滑开始 linear transition start',
    'IDX-07':
      '指数价格线性过渡结束 线性过渡结束 线性过渡 平滑结束 linear transition end',
    'IDX-08': '仅一家有效指数源 单源 single source',
    'MARK-01': 'Mark 计算降级 mark degraded Mark计算降级',
    'PRICE-01': 'Mark vs Index mark/index Mark/Index 偏离',
    'PRICE-10': 'Mark vs Index PRICE-10 mark index deviation',
  }
  const descBoost: Record<string, string> = {
    'IDX-01': '排查「指数源变更剔除告警」类事件（成分被剔除）',
    'IDX-02': '排查「指数源变更恢复告警」类事件（成分恢复）',
    'IDX-05': '排查「无有效指数源」类告警',
    'IDX-06': '排查「指数价格线性过渡开始」告警',
    'IDX-07': '排查「指数价格线性过渡结束」告警',
    'IDX-08': '排查「仅一家有效指数源」告警',
    'MARK-01': '排查 Mark 计算降级类告警',
    'PRICE-01': '排查 Mark vs Index 偏离类告警',
  }
  const l1: SkillRecord[] = L1_SKILLS.map((s) => ({
    id: s.id,
    level: 'L1',
    name: s.name,
    severity: s.severity,
    description: descBoost[s.id] || `排查与 ${s.name} 对齐的告警／事件`,
    matchHints: `${s.id} ${s.name} ${hintBoost[s.id] || ''}`.trim(),
    linkedL1: '',
    check: s.check,
    action: s.action,
    opt: s.opt,
    disabled: false,
    custom: false,
    updatedAt: now,
  }))
  const l2: SkillRecord[] = L2_CHAINS.map((s) => ({
    id: s.id,
    level: 'L2',
    name: s.name,
    severity: 'P2',
    description: `L2 链路：在命中 L1（${s.linkedL1 || '—'}）后展开`,
    matchHints: `${s.id} ${s.name} ${s.linkedL1}`,
    linkedL1: s.linkedL1,
    check: s.check,
    action: s.action,
    opt: s.opt,
    disabled: false,
    custom: false,
    updatedAt: now,
  }))
  return [...l1, ...l2]
}

export function loadSkills(): SkillRecord[] {
  const stored = readJson<SkillRecord[] | null>(SKILLS_KEY, null)
  if (stored?.length) return stored
  // Migrate legacy overrides onto defaults once
  const overrides = loadSkillOverrides()
  const base = defaultSkills()
  if (!Object.keys(overrides).length) return base
  return base.map((s) => {
    const o = overrides[s.id]
    if (!o) return s
    return { ...s, ...o, updatedAt: Date.now() }
  })
}

export function saveSkills(list: SkillRecord[]) {
  assertContentAdminWrite('skills')
  writeJson(SKILLS_KEY, list)
}

export function loadSettings(): CopilotSettings {
  const stored = readJson<Partial<CopilotSettings>>(SETTINGS_KEY, {})
  const merged: CopilotSettings = { ...DEFAULT_SETTINGS, ...stored }
  // Prefer managed proxy over empty / stale local overrides that block autoconnect.
  if (!merged.proxyBase.trim()) {
    merged.proxyBase = builtInProxyBase()
  }
  // Desk is pre-connected — clear leftover BYOK keys so the UI never depends on them.
  merged.openaiKey = ''
  merged.anthropicKey = ''
  merged.geminiKey = ''
  merged.openrouterKey = ''
  if (merged.provider === 'rules') {
    merged.provider = 'openai'
    merged.model = merged.model || 'gpt-4o-mini'
  }
  return merged
}

export function saveSettings(s: CopilotSettings) {
  writeJson(SETTINGS_KEY, s)
}

/** Pull managed proxy URL from public/llm-config.json (no secrets in the file). */
export async function applyManagedLlmConfig(
  current: CopilotSettings,
): Promise<CopilotSettings> {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const url = `${base}llm-config.json?v=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return current
    const cfg = (await res.json()) as {
      provider?: CopilotSettings['provider']
      model?: string
      proxyBase?: string
      deskToken?: string
    }
    const next: CopilotSettings = {
      ...current,
      provider: cfg.provider || current.provider || 'openai',
      model: cfg.model || current.model || 'gpt-4o-mini',
      proxyBase: (cfg.proxyBase || current.proxyBase || '').replace(/\/$/, ''),
      deskToken: (cfg.deskToken || current.deskToken || '').trim(),
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
      openrouterKey: '',
    }
    saveSettings(next)
    return next
  } catch {
    return current
  }
}

export interface ImportedBriefingCitation {
  id?: string
  label: string
  url: string
  category?: string
  note?: string
}

export interface ImportedBriefing {
  id: string
  title: string
  severity?: string
  triggerReason?: string
  causes?: string[]
  observations?: string[]
  why?: string[]
  impact?: string[]
  actions?: string[]
  breachedSources?: string[]
  compositePrice?: number
  createdAt?: number
  archivedAt?: number
  lang?: string
  /** Clickable deep links from Market Condition scan */
  citations?: ImportedBriefingCitation[]
  /** Legacy string lines that may embed URLs */
  sourcesConsulted?: string[]
}

export function loadMonitorBriefings(): ImportedBriefing[] {
  return readJson(BRIEFINGS_KEY, [])
}

/** Archived RCAs only — inputs for future weekly optimisation jobs. */
export function weeklyOptimisationCandidates(history: IncidentRecord[]): IncidentRecord[] {
  return history.filter((h) => !!h.archivedAt)
}

/** Snapshot of a periodic / stats digest operators can re-open and review. */
export interface PeriodicDigest {
  id: string
  createdAt: number
  windowLabel: string
  totalRca: number
  openRca: number
  archivedRca: number
  weeklyOptCount: number
  topSeverity: string
  skillHighlights: { id: string; name: string; level: string; count: number }[]
  weeklyOptItems: {
    id: string
    title: string
    severity: string
    archivedAt: number
    reportExcerpt: string
    skills: string[]
  }[]
  notes: string
}

export function loadPeriodicDigests(): PeriodicDigest[] {
  return readJson<PeriodicDigest[]>(PERIODIC_DIGESTS_KEY, [])
}

export function savePeriodicDigests(list: PeriodicDigest[]) {
  writeJson(PERIODIC_DIGESTS_KEY, list.slice(0, 40))
}

export function buildPeriodicDigest(
  history: IncidentRecord[],
  windowLabel = 'current browser history',
): PeriodicDigest {
  const weekly = weeklyOptimisationCandidates(history)
  const open = history.filter((h) => !h.archivedAt)
  const bySeverity: Record<string, number> = {}
  for (const h of history) {
    bySeverity[h.severity] = (bySeverity[h.severity] || 0) + 1
  }
  const topSeverity =
    Object.entries(bySeverity).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const hitMap = new Map<string, { id: string; name: string; level: string; count: number }>()
  for (const h of history) {
    for (const s of h.skillsUsed || []) {
      const key = `${s.level}:${s.id}`
      const cur = hitMap.get(key) || { id: s.id, name: s.name, level: s.level, count: 0 }
      cur.count += 1
      hitMap.set(key, cur)
    }
  }
  const skillHighlights = [...hitMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)

  return {
    id: `dig_${Date.now()}`,
    createdAt: Date.now(),
    windowLabel,
    totalRca: history.length,
    openRca: open.length,
    archivedRca: weekly.length,
    weeklyOptCount: weekly.length,
    topSeverity,
    skillHighlights,
    weeklyOptItems: weekly
      .slice()
      .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0))
      .slice(0, 20)
      .map((h) => ({
        id: h.id,
        title: h.title,
        severity: h.severity,
        archivedAt: h.archivedAt || h.createdAt,
        reportExcerpt: String(h.report || '').slice(0, 600),
        skills: (h.skillsUsed || []).map((s) => s.id),
      })),
    notes:
      weekly.length === 0
        ? 'No archived RCAs yet — archive Investigate reports to feed weekly optimisation review.'
        : `Review ${weekly.length} archived RCA(s) as weekly optimisation inputs. Confirm Skill hits and approval-gated actions before changing production rules.`,
  }
}

export function savePeriodicDigest(digest: PeriodicDigest) {
  const next = [digest, ...loadPeriodicDigests().filter((d) => d.id !== digest.id)]
  savePeriodicDigests(next)
  return digest
}
