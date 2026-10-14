import { useSyncExternalStore } from 'react'
import {
  activeFormula,
  formulaHistory,
  recommendations as seedRecommendations,
  severityAlerts as seedAlerts,
  type FormulaVersionMeta,
  type IncidentAlert,
  type OpsFeedback,
  type Recommendation,
  type SeverityFormula,
  type SeverityLevel,
} from '../../mock/severityData'

// ---------------------------------------------------------------------------
// Formula helpers
// ---------------------------------------------------------------------------

export type FactorContribution = {
  key: string
  weight: number
  rawScore: number
  contribution: number
}

export type ScoredResult = {
  score: number
  severity: SeverityLevel
  contributions: FactorContribution[]
}

export function severityFromScore(score: number, thresholds: SeverityFormula['thresholds']): SeverityLevel {
  if (score >= thresholds.p1) return 'P1'
  if (score >= thresholds.p2) return 'P2'
  if (score >= thresholds.p3) return 'P3'
  return 'P4'
}

/** Apply a formula to a set of raw factor scores. */
export function applyFormula(formula: SeverityFormula, factorScores: Record<string, number>): ScoredResult {
  const contributions: FactorContribution[] = Object.entries(formula.weights).map(([key, weight]) => {
    const rawScore = factorScores[key] ?? 0
    return { key, weight, rawScore, contribution: rawScore * weight }
  })
  const score = contributions.reduce((sum, c) => sum + c.contribution, 0)
  return { score, severity: severityFromScore(score, formula.thresholds), contributions }
}

export const severityColor: Record<SeverityLevel, string> = {
  P1: 'red',
  P2: 'volcano',
  P3: 'gold',
  P4: 'blue',
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SeverityState = {
  formula: SeverityFormula
  formulaHistory: FormulaVersionMeta[]
  alerts: IncidentAlert[]
  recommendations: Recommendation[]
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

let state: SeverityState = {
  formula: clone(activeFormula),
  formulaHistory: clone(formulaHistory),
  alerts: clone(seedAlerts),
  recommendations: clone(seedRecommendations),
}

const listeners = new Set<() => void>()

function emit() {
  state = { ...state }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSeverityState(): SeverityState {
  return useSyncExternalStore(subscribe, () => state)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function submitFeedback(alertId: string, feedback: OpsFeedback) {
  state.alerts = state.alerts.map((a) => (a.id === alertId ? { ...a, feedback } : a))
  emit()
}

/** RO approves a recommendation -> its proposed formula becomes active. */
export function approveRecommendation(recId: string, decidedBy: string, note: string) {
  const rec = state.recommendations.find((r) => r.id === recId)
  if (!rec || rec.status !== 'pending') return

  const newVersion = rec.proposedFormula.version.replace(/\s*\(proposed\)\s*/i, '')
  const decidedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

  state.recommendations = state.recommendations.map((r) =>
    r.id === recId ? { ...r, status: 'approved', decidedBy, decidedAt, decisionNote: note } : r,
  )

  state.formulaHistory = state.formulaHistory.map((m) =>
    m.status === 'active' ? { ...m, status: 'archived' } : m,
  )
  state.formulaHistory = [
    {
      version: newVersion,
      status: 'active',
      effectiveFrom: decidedAt.slice(0, 10),
      author: decidedBy,
      note: rec.summary,
    },
    ...state.formulaHistory,
  ]
  state.formula = { ...clone(rec.proposedFormula), version: newVersion }
  emit()
}

export function rejectRecommendation(recId: string, decidedBy: string, note: string) {
  const decidedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  state.recommendations = state.recommendations.map((r) =>
    r.id === recId ? { ...r, status: 'rejected', decidedBy, decidedAt, decisionNote: note } : r,
  )
  emit()
}

export function resetSeverityStore() {
  state = {
    formula: clone(activeFormula),
    formulaHistory: clone(formulaHistory),
    alerts: clone(seedAlerts),
    recommendations: clone(seedRecommendations),
  }
  emit()
}
