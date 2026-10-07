export type PhaseId = 'foundations' | 'architecture' | 'ops' | 'future'

export interface Phase {
  id: PhaseId
  week: number
  title: string
  subtitle: string
  days: number[]
  color: string
}

export interface LessonSection {
  heading: string
  body: string
  bullets?: string[]
}

export interface DayLesson {
  day: number
  phase: PhaseId
  title: string
  subtitle: string
  minutes: number
  outcomes: string[]
  terms: string[]
  sections: LessonSection[]
  poMoves: string[]
  check: string[]
  debugTip?: string
}

export interface GlossaryTerm {
  term: string
  short: string
  detail: string
  related: string[]
  phase: PhaseId
}

export interface UseCase {
  id: string
  title: string
  industry: string
  summary: string
  modules: string[]
  poRisks: string[]
  successMetrics: string[]
  whyInteresting: string
}
