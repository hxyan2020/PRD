import { DEFAULT_KB, L1_SKILLS, L2_CHAINS } from './data/catalog'
import type {
  CopilotSettings,
  IncidentRecord,
  KbNode,
  KnowledgeItem,
  SkillRecord,
} from './types'

const HISTORY_KEY = 'vex_risk_copilot_history_v1'
const KB_KEY = 'vex_risk_copilot_kb_v1'
const KB_TREE_KEY = 'vex_risk_copilot_kb_tree_v1'
const SKILLS_KEY = 'vex_risk_copilot_skills_v1'
const SKILL_OVERRIDES_KEY = 'vex_risk_copilot_skill_overrides_v1'
const SETTINGS_KEY = 'vex_risk_copilot_settings_v1'
/** Shared with xauusd-source-monitor briefings */
export const BRIEFINGS_KEY = 'xauusd-monitor-briefings-v8'

declare const __VEX_LLM_PROXY_BASE__: string

const DEFAULT_SETTINGS: CopilotSettings = {
  /** Prefer real LLM; falls back to local rules if no key / proxy. */
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  openaiKey: '',
  anthropicKey: '',
  geminiKey: '',
  openrouterKey: '',
  /** Optional hosted /api/chat base (Vercel or local llm-proxy). */
  proxyBase: typeof __VEX_LLM_PROXY_BASE__ === 'string' ? __VEX_LLM_PROXY_BASE__ : '',
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
  writeJson(SKILL_OVERRIDES_KEY, v)
}

export function defaultSkills(): SkillRecord[] {
  const now = 0
  const l1: SkillRecord[] = L1_SKILLS.map((s) => ({
    id: s.id,
    level: 'L1',
    name: s.name,
    severity: s.severity,
    description: s.name,
    matchHints: `${s.id} ${s.name}`,
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
    description: s.name,
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
  writeJson(SKILLS_KEY, list)
}

export function loadSettings(): CopilotSettings {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) }
}

export function saveSettings(s: CopilotSettings) {
  writeJson(SETTINGS_KEY, s)
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
}

export function loadMonitorBriefings(): ImportedBriefing[] {
  return readJson(BRIEFINGS_KEY, [])
}

/** Archived RCAs only — inputs for future weekly optimisation jobs. */
export function weeklyOptimisationCandidates(history: IncidentRecord[]): IncidentRecord[] {
  return history.filter((h) => !!h.archivedAt)
}
