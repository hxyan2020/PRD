export type Lang = 'en' | 'zh-Hans' | 'zh-Hant'

export type Intent =
  | 'help'
  | 'market'
  | 'investigate'
  | 'followup'
  | 'review'
  | 'archive'
  | 'offtopic'
  | 'ack_mention'
  | 'general_risk'

export interface SkillRec {
  id: string
  level: 'L1' | 'L2'
  name: string
  severity: string
  matchHints: string
  linkedL1: string
  check: string
  action: string
  opt: string
}

export interface KbItem {
  id: string
  title: string
  body: string
}

export interface SkillHit {
  id: string
  name: string
  level: 'L1' | 'L2'
  severity: string
  check: string
  action: string
  score: number
}

export interface KbHit {
  id: string
  title: string
  body: string
  score: number
}

export interface InvestigationState {
  mode: 'idle' | 'investigate'
  facts: string[]
  checkedSteps: string[]
  lastSeverity: string
  lastHits: SkillHit[]
  lastKb: KbHit[]
  lastReportId?: string
  pendingPrompt?: string
  /** Last detected user language — card actions and short replies reuse this. */
  preferredLang?: Lang
  updatedAt: number
}

export interface IncidentRecord {
  id: string
  chatId: string
  openId: string
  title: string
  facts: string[]
  severity: string
  skills: string[]
  knowledge: string[]
  summary: string
  recommendations: string[]
  status: 'open' | 'archived'
  createdAt: number
  updatedAt: number
  lang: Lang
}

export interface BotReply {
  text?: string
  card?: Record<string, unknown>
}

export interface IncomingMessage {
  messageId: string
  chatId: string
  chatType: 'p2p' | 'group' | string
  openId: string
  messageType: string
  text: string
  imageKey?: string
  mentionedBot: boolean
  rawContent: string
}
