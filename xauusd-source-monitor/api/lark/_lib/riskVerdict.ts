import type { IncidentRecord, Lang, RiskVerdict } from './types.js'

export type RiskVerdictCounts = {
  at_risk: number
  no_risk: number
  unclear: number
  unset: number
}

export function normalizeRiskVerdict(raw: unknown): RiskVerdict | null {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
  if (s === 'at_risk' || s === 'risk' || s === 'yes' || s === '有风险' || s === '有風險') {
    return 'at_risk'
  }
  if (
    s === 'no_risk' ||
    s === 'norisk' ||
    s === 'no' ||
    s === '无风险' ||
    s === '無風險' ||
    s === '没有风险' ||
    s === '沒有風險'
  ) {
    return 'no_risk'
  }
  if (s === 'unclear' || s === 'unknown' || s === '尚不明确' || s === '尚不明確' || s === '待确认') {
    return 'unclear'
  }
  return null
}

export function riskVerdictLabel(v: RiskVerdict | null | undefined, lang: Lang): string {
  const hans = lang === 'zh-Hans'
  const zh = lang === 'zh-Hans' || lang === 'zh-Hant'
  if (v === 'at_risk') return hans ? '有风险' : zh ? '有風險' : 'At risk'
  if (v === 'no_risk') return hans ? '无风险' : zh ? '無風險' : 'No risk'
  if (v === 'unclear') return hans ? '尚不明确' : zh ? '尚不明確' : 'Unclear'
  return hans ? '未判定' : zh ? '未判定' : 'Unset'
}

export function riskVerdictEmoji(v: RiskVerdict | null | undefined): string {
  if (v === 'at_risk') return '🔴'
  if (v === 'no_risk') return '🟢'
  if (v === 'unclear') return '🟡'
  return '⚪'
}

export function countRiskVerdicts(incidents: IncidentRecord[]): RiskVerdictCounts {
  const out: RiskVerdictCounts = { at_risk: 0, no_risk: 0, unclear: 0, unset: 0 }
  for (const inc of incidents) {
    if (inc.riskVerdict === 'at_risk') out.at_risk += 1
    else if (inc.riskVerdict === 'no_risk') out.no_risk += 1
    else if (inc.riskVerdict === 'unclear') out.unclear += 1
    else out.unset += 1
  }
  return out
}

/** Soft suggestion only — never auto-write without human confirm. */
export function suggestRiskVerdict(severity: string): RiskVerdict {
  const s = (severity || '').toUpperCase()
  if (s.includes('P0') || s.includes('P1')) return 'at_risk'
  if (s.includes('P3')) return 'no_risk'
  return 'unclear'
}
