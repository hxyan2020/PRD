import cfdQuoteOps from './cfdQuoteOps.json'
import type { KnowledgeItem, SkillRecord } from '../types'

type CfdPack = {
  source?: string
  productLine?: string
  knowledge?: { id: string; title: string; body: string; updatedAt?: number }[]
  skills?: {
    id: string
    level: 'L1' | 'L2'
    name: string
    severity: string
    matchHints?: string
    linkedL1?: string
    check: string
    action: string
    opt: string
  }[]
}

const cfd = cfdQuoteOps as unknown as CfdPack

/** CFD Broker Pricing RCA playbooks from quote-ops-three. */
export const CFD_PRICING_SKILLS: SkillRecord[] = (cfd.skills || []).map((s) => ({
  id: s.id,
  level: s.level === 'L2' ? 'L2' : 'L1',
  name: s.name,
  severity: s.severity,
  description: s.name,
  matchHints: s.matchHints || `${s.id} ${s.name}`,
  linkedL1: s.linkedL1 || '',
  check: s.check,
  action: s.action,
  opt: s.opt || '',
  disabled: false,
  custom: false,
  updatedAt: 0,
}))

/** Alias kept for older imports. */
export const SKILLS_34 = CFD_PRICING_SKILLS

/** CFD Pricing articles / 86 risks / pipeline / DB from quote-ops-three. */
export const CFD_QUOTE_OPS_KB: KnowledgeItem[] = (cfd.knowledge || []).map((k) => ({
  id: k.id,
  title: k.title,
  body: k.body,
  updatedAt: Number(k.updatedAt || 0) || 0,
}))

export const VE_QUOTE_OPS_KB = CFD_QUOTE_OPS_KB

export const CFD_QUOTE_OPS_SOURCE =
  cfd.source || 'https://quote-ops-three.vercel.app/api/kb'

export const VE_QUOTE_OPS_SOURCE = CFD_QUOTE_OPS_SOURCE

/** Built-in flat KB = CFD Broker Pricing snapshot only. */
export const DEFAULT_KB: KnowledgeItem[] = [...CFD_QUOTE_OPS_KB]
