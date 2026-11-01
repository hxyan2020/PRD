export type LlmProvider = 'rules' | 'openai' | 'anthropic' | 'gemini' | 'openrouter'

export type SeverityChoice = '自动建议' | 'P0' | 'P1' | 'P2' | 'P3'

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

export interface KnowledgeItem {
  id: string
  title: string
  body: string
  updatedAt: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  at: number
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
  /** Linked XAUUSD briefing ids used as input */
  briefingIds?: string[]
  messages?: ChatMessage[]
  archivedAt?: number
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
}

export interface RuleAnalysis {
  body: string
  sev: string
  hits: string[]
  l2: string[]
  skillContext: string
  kbContext: string
}
