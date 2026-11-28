export type Lang = 'en' | 'zh-Hans' | 'zh-Hant'

export type Intent =
  | 'help'
  | 'greeting'
  | 'market'
  | 'investigate'
  | 'followup'
  | 'review'
  | 'clear_review'
  | 'memory_submit'
  | 'skills'
  | 'knowledge'
  | 'archive'
  | 'weekly'
  | 'weekly_opt_log'
  | 'oscillation'
  | 'daily_market'
  | 'inv_report'
  | 'alert_optimize'
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
  | 'oscillation'
  | 'daily_market'
  | 'alert_optimize'

/** One atomic Skill.check step in the guided investigation path. */
export interface GuideStep {
  /** Stable key: `${skillId}:${authorIdx}` */
  id: string
  skillId: string
  /** Display label with skill prefix, e.g. 【L1-01】读取Lark… */
  label: string
  raw: string
  /** false → Skip is free; true → Skip requires a text reply. */
  required: boolean
  status: 'pending' | 'done' | 'skipped'
}

/** After Done → evidence; Skip required → reply; Escalate → feedback; 补充信息 → free evidence. */
export type StepAwaiting =
  | 'none'
  | 'evidence'
  | 'required_skip_reply'
  | 'escalate_feedback'
  | 'supplement'

/** Active escalate handoff while waiting for role feedback. */
export interface EscalationState {
  stepId: string
  stepLabel: string
  stepIndex: number
  roles: string[]
  openIds: string[]
  at: number
}

export interface InvestigationState {
  /**
   * gather_alerts = collecting alert(s) before analysis starts;
   * report_draft = full report shown; chat edits the draft until archive.
   */
  mode: 'idle' | 'gather_alerts' | 'investigate' | 'report_draft'
  facts: string[]
  checkedSteps: string[]
  /** Full turn log for proceed-based investigation reports. */
  interactions: InvestigationInteraction[]
  lastSeverity: string
  lastHits: SkillHit[]
  lastKb: KbHit[]
  lastReportId?: string
  /** Latest full investigation report markdown (editable in report_draft). */
  lastReportMarkdown?: string
  pendingPrompt?: string
  /** Full Skill.check chain for guided Done/Skip flow. */
  pathSteps?: GuideStep[]
  /** Index into pathSteps for the current guide card. */
  pathStepIndex?: number
  /** Waiting for evidence (after Done), required-skip reply, or escalate feedback. */
  stepAwaiting?: StepAwaiting
  /** Current escalate handoff (operator side). */
  escalation?: EscalationState
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

/** Final human verdict after investigation assistance. */
export type RiskVerdict = 'at_risk' | 'no_risk' | 'unclear'

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
  /**
   * Final desk judgment: is there material risk?
   * Counted on the review board and weekly report.
   */
  riskVerdict?: RiskVerdict
  riskVerdictAt?: number
  /** open_id or 'operator' when set via card button. */
  riskVerdictBy?: string
  status: 'open' | 'archived'
  createdAt: number
  updatedAt: number
  lang: Lang
}

export interface BotReply {
  text?: string
  card?: Record<string, unknown>
  /**
   * Extra cards sent after the primary card (e.g. full path overview → step 1 Done/Skip).
   * Dispatchers send these via sendCardToChat so they appear as a new message.
   */
  followUpCards?: Record<string, unknown>[]
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
