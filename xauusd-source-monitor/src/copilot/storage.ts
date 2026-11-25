import {
  DEFAULT_KB,
  SKILLS_34,
  VE_QUOTE_OPS_KB,
  VE_QUOTE_OPS_SOURCE,
} from './data/catalog'
import { PERM_VERCEL_ORIGIN } from './engine/llm'
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

function builtInProxyBase(): string {
  if (typeof __VEX_LLM_PROXY_BASE__ === 'string' && __VEX_LLM_PROXY_BASE__.trim()) {
    return __VEX_LLM_PROXY_BASE__.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    // Same-origin /api/chat on the permanent Vercel host.
    if (host.endsWith('vercel.app')) return ''
    if (host === 'localhost' || host === '127.0.0.1') return 'http://127.0.0.1:8791'
  }
  // GitHub Pages / other static hosts → permanent Vercel gateway.
  return PERM_VERCEL_ORIGIN
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

const AUTH_SESSION_KEY = 'vex_risk_tool_session_v1'

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

/** Skills / RAG knowledge / memory writes — admin session only. */
export function canAdminWriteMemory(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return false
    const session = JSON.parse(raw) as { role?: string }
    return session?.role === 'admin'
  } catch {
    return false
  }
}

function requireAdminWrite(): boolean {
  if (canAdminWriteMemory()) return true
  if (typeof console !== 'undefined') {
    console.warn('[vex] blocked non-admin write to skills/RAG/memory')
  }
  return false
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
  if (!requireAdminWrite()) return
  writeJson(KB_KEY, list)
}

export function defaultKnowledgeTree(): KbNode[] {
  const rootId = 'kb_root'
  const veFolderId = 'kb_cfd_quote_ops'
  const now = Date.now()
  const legacy = DEFAULT_KB.filter((k) => !k.id.startsWith('ve-doc-'))
  const nodes: KbNode[] = [
    {
      id: rootId,
      parentId: null,
      title: 'CFD Pricing Risk Knowledge',
      body: 'Root of the CFD Broker Pricing RAG knowledge tree used by Investigate.',
      order: 0,
      updatedAt: now,
    },
  ]
  legacy.forEach((k, i) => {
    nodes.push({
      id: k.id,
      parentId: rootId,
      title: k.title,
      body: k.body,
      order: i + 1,
      updatedAt: k.updatedAt || now,
    })
  })
  nodes.push({
    id: veFolderId,
    parentId: rootId,
    title: 'CFD Pricing · quote-ops',
    body: `Synced from ${VE_QUOTE_OPS_SOURCE} (product line cfd-broker only).`,
    order: legacy.length + 1,
    updatedAt: now,
  })
  VE_QUOTE_OPS_KB.forEach((k, i) => {
    nodes.push({
      id: k.id,
      parentId: veFolderId,
      title: k.title,
      body: k.body,
      order: i + 1,
      updatedAt: k.updatedAt || now,
    })
  })
  return nodes
}

/** Ensure quote-ops CFD Pricing nodes exist even when an older tree is in localStorage. */
function mergeVeQuoteOpsTree(nodes: KbNode[]): KbNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  let changed = false
  for (const n of defaultKnowledgeTree()) {
    if (n.id === 'kb_root') continue
    if (!byId.has(n.id) && (n.id === 'kb_ve_quote_ops' || n.id === 'kb_cfd_quote_ops' || /^(risk-|pipeline-|db-|article-|sk-)/.test(n.id))) {
      byId.set(n.id, n)
      changed = true
    }
  }
  return changed ? [...byId.values()] : nodes
}

function migrateFlatToTree(flat: KnowledgeItem[]): KbNode[] {
  const rootId = 'kb_root'
  const now = Date.now()
  return [
    {
      id: rootId,
      parentId: null,
      title: 'CFD Pricing Risk Knowledge',
      body: 'Root of the CFD Broker Pricing RAG knowledge tree used by Investigate.',
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
  if (stored?.length) {
    const merged = mergeVeQuoteOpsTree(stored)
    if (merged !== stored) writeJson(KB_TREE_KEY, merged)
    return merged
  }
  const flat = readJson<KnowledgeItem[] | null>(KB_KEY, null)
  if (flat?.length) {
    const tree = mergeVeQuoteOpsTree(migrateFlatToTree(flat))
    writeJson(KB_TREE_KEY, tree)
    return tree
  }
  return defaultKnowledgeTree()
}

export function saveKnowledgeTree(nodes: KbNode[]) {
  if (!requireAdminWrite()) return
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
  if (!requireAdminWrite()) return
  writeJson(SKILL_OVERRIDES_KEY, v)
}

export function defaultSkills(): SkillRecord[] {
  // Skills = Runbook V18 的 34 个排查场景；监控指标清单在知识库
  return SKILLS_34.map((s) => ({ ...s }))
}

export function loadSkills(): SkillRecord[] {
  const stored = readJson<SkillRecord[] | null>(SKILLS_KEY, null)
  const overrides = loadSkillOverrides()
  const base = defaultSkills()
  const apply = (list: SkillRecord[]) =>
    list.map((s) => {
      const o = overrides[s.id]
      if (!o) return s
      return { ...s, ...o, updatedAt: Date.now() }
    })

  if (!stored?.length) return apply(base)

  // Migrate old 97-metric dumps → 34 scenarios; keep only custom extras
  const baseIds = new Set(base.map((s) => s.id))
  const customs = stored.filter((s) => s.custom && !baseIds.has(s.id))
  const byId = new Map(base.map((s) => [s.id, s]))
  for (const s of stored) {
    if (baseIds.has(s.id) && s.custom) byId.set(s.id, s)
  }
  const merged = [...byId.values(), ...customs]
  writeJson(SKILLS_KEY, merged)
  return apply(merged)
}

export function saveSkills(list: SkillRecord[]) {
  if (!requireAdminWrite()) return
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
    const fromCfg = (cfg.proxyBase ?? '').trim().replace(/\/$/, '')
    let proxyBase = fromCfg
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
      // Permanent Vercel SPA uses same-origin /api/chat — ignore absolute proxyBase.
      proxyBase = ''
    } else if (!proxyBase) {
      proxyBase = builtInProxyBase()
    }
    const next: CopilotSettings = {
      ...current,
      provider: cfg.provider || current.provider || 'openai',
      model: cfg.model || current.model || 'gpt-4o-mini',
      proxyBase,
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
