export type LlmProvider = 'rules' | 'openai' | 'anthropic' | 'gemini' | 'openrouter'

export type SeverityChoice = '自动建议' | 'P0' | 'P1' | 'P2' | 'P3'

export type SkillLevel = 'L1' | 'L2'

export interface L1Skill {
  id: string
  name: string
  severity: string
  check: string
  action: string
  opt: string
}

export interface L2Chain {
  id: string
  name: string
  linkedL1: string
  check: string
  action: string
  opt: string
}

/** Editable skill record (L1 or L2) persisted in browser storage. */
export interface SkillRecord {
  id: string
  level: SkillLevel
  name: string
  severity: string
  description: string
  matchHints: string
  linkedL1: string
  check: string
  action: string
  opt: string
  disabled: boolean
  archivedAt?: number
  custom: boolean
  updatedAt: number
}

/** Flat legacy knowledge item (migrated into tree). */
export interface KnowledgeItem {
  id: string
  title: string
  body: string
  updatedAt: number
}

/** Tree knowledge node for RAG visualisation + retrieval. */
export interface KbNode {
  id: string
  parentId: string | null
  title: string
  body: string
  order: number
  updatedAt: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  at: number
}

export interface TimelineEvent {
  at: number
  label: string
}

export interface SkillHitRef {
  id: string
  name: string
  level: SkillLevel
  severity?: string
}

export interface KnowledgeHitRef {
  id: string
  title: string
  path: string
}

export interface IncidentRecord {
  id: string
  createdAt: number
  title: string
  facts: string
  severity: string
  provider: LlmProvider
  modelLabel: string
  report: string
  hits: string[]
  l2: string[]
  imageDataUrl?: string | null
  imageDataUrls?: string[]
  /** Linked XAUUSD briefing ids used as input */
  briefingIds?: string[]
  messages?: ChatMessage[]
  /** Archive gates weekly optimisation inputs only — stats always count. */
  archivedAt?: number
  thinking?: string[]
  timeline?: TimelineEvent[]
  skillsUsed?: SkillHitRef[]
  knowledgeUsed?: KnowledgeHitRef[]
  nextSteps?: string[]
  /** Candidate / stated root causes shown first in the report UI. */
  rootCauses?: string[]
  /** Investigation path steps shown after root cause. */
  pathSteps?: string[]
  /** Language of the user input — reply language follows this, not UI locale. */
  replyLang?: 'en' | 'zh-Hant'
  /** False when no catalog skill confidently matched the alert. */
  skillMatched?: boolean
  /** External UI / docs / news pages attached for verification. */
  externalPages?: { label: string; url: string }[]
}

export interface CopilotSettings {
  provider: LlmProvider
  /** Model id within provider, e.g. gpt-4o-mini */
  model: string
  /** BYOK — stored only in this browser */
  openaiKey: string
  anthropicKey: string
  geminiKey: string
  openrouterKey: string
  /** Optional custom proxy base, e.g. https://xxx.vercel.app */
  proxyBase: string
  /** Desk auth token for managed LLM gateway (from llm-config.json). */
  deskToken: string
}

export interface RuleAnalysis {
  body: string
  sev: string
  hits: string[]
  l2: string[]
  skillContext: string
  kbContext: string
  thinking: string[]
  timeline: TimelineEvent[]
  skillsUsed: SkillHitRef[]
  knowledgeUsed: KnowledgeHitRef[]
  nextSteps: string[]
  rootCauses: string[]
  pathSteps: string[]
  /** True when at least one L1 skill confidently matched the alert. */
  skillMatched: boolean
}
