import type { BriefingSeverity } from '../types'

/** Traffic-light mapping for V Exchange ops. */
export type SeverityTone = 'red' | 'yellow' | 'green'

export function severityTone(s: BriefingSeverity): SeverityTone {
  if (s === 'critical') return 'red'
  if (s === 'alert') return 'yellow'
  return 'green'
}

export function severityLabelKey(s: BriefingSeverity): string {
  return `sev_${severityTone(s)}`
}

export function severityHintKey(s: BriefingSeverity): string {
  return `sevHint_${severityTone(s)}`
}
