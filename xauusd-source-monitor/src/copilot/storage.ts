import { DEFAULT_KB } from './data/catalog'
import type { CopilotSettings, IncidentRecord, KnowledgeItem, L1Skill } from './types'

const HISTORY_KEY = 'vex_risk_copilot_history_v1'
const KB_KEY = 'vex_risk_copilot_kb_v1'
const SKILL_OVERRIDES_KEY = 'vex_risk_copilot_skill_overrides_v1'
const SETTINGS_KEY = 'vex_risk_copilot_settings_v1'
/** Shared with xauusd-source-monitor briefings */
export const BRIEFINGS_KEY = 'xauusd-monitor-briefings-v8'

const DEFAULT_SETTINGS: CopilotSettings = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  openaiKey: '',
  anthropicKey: '',
  geminiKey: '',
  openrouterKey: '',
  proxyBase: '',
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

export function loadKnowledge(): KnowledgeItem[] {
  const stored = readJson<KnowledgeItem[] | null>(KB_KEY, null)
  if (!stored?.length) return DEFAULT_KB.map((k) => ({ ...k }))
  return stored
}

export function saveKnowledge(list: KnowledgeItem[]) {
  writeJson(KB_KEY, list)
}

export type SkillOverrides = Record<
  string,
  Partial<Pick<L1Skill, 'severity' | 'check' | 'action' | 'opt'>>
>

export function loadSkillOverrides(): SkillOverrides {
  return readJson(SKILL_OVERRIDES_KEY, {})
}

export function saveSkillOverrides(v: SkillOverrides) {
  writeJson(SKILL_OVERRIDES_KEY, v)
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
