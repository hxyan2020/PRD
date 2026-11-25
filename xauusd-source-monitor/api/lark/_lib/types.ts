export type Lang = 'en' | 'zh-Hans' | 'zh-Hant'

export type Intent =
  | 'help'
  | 'greeting'
  | 'market'
  | 'investigate'
  | 'followup'
  | 'review'
  | 'skills'
  | 'knowledge'
  | 'archive'
  | 'weekly'
  | 'inv_report'
  | 'offtopic'
  | 'safety'
  | 'ack_mention'
  | 'general_risk'

/** One user/bot turn captured during an investigation case. */
export interface InvestigationInteraction {
  at: number
  role: 'user' | 'bot' | 'system'
  /** alert | note | question | step_done | command | report | other */
  kind: string
  text: string
  messageId?: string
}

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

/** Soft-matched command waiting for user yes/no before running. */
export type PendingCommandIntent =
  | 'market'
  | 'investigate'
  | 'review'
  | 'skills'
  | 'knowledge'
  | 'weekly'

export interface InvestigationState {
  mode: 'idle' | 'investigate'
  facts: string[]
  checkedSteps: string[]
  /** Full turn log for proceed-based investigation reports. */
  interactions: InvestigationInteraction[]
  lastSeverity: string
  lastHits: SkillHit[]
  lastKb: KbHit[]
  lastReportId?: string
  pendingPrompt?: string
  /** Soft command awaiting confirm (yes → run; no → chat). */
  pendingCommand?: PendingCommandIntent
  pendingCommandText?: string
  pendingCommandAt?: number
  /** Last detected user language — card actions and short replies reuse this. */
  preferredLang?: Lang
  /** Last image/file/share digest — used when user asks “能读取吗” without re-attaching. */
  lastAttachmentSummary?: string
  lastAttachmentKind?: string
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
  /** Snapshot of the interaction log when the case was last updated. */
  interactions?: InvestigationInteraction[]
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
  /** Parent message id when the user replied to another message (e.g. alert card). */
  parentId?: string
  /** Root message id of a reply thread, when present. */
  rootId?: string
}
