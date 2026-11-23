import l1Raw from './l1.json'
import l2Raw from './l2.json'
import kbRaw from './kbDefaults.json'
import veQuoteOps from './veQuoteOps.json'
import type { KnowledgeItem, L1Skill, L2Chain, SkillRecord } from '../types'

export const L1_SKILLS: L1Skill[] = (l1Raw as string[][]).map((r) => ({
  id: r[0]!,
  name: r[1]!,
  severity: r[2]!,
  check: r[3]!,
  action: r[4]!,
  opt: r[5]!,
}))

export const L2_CHAINS: L2Chain[] = (l2Raw as string[][]).map((r) => ({
  id: r[0]!,
  name: r[1]!,
  linkedL1: r[2]!,
  check: r[3]!,
  action: r[4]!,
  opt: r[5]!,
}))

const baseKb: KnowledgeItem[] = (kbRaw as { title: string; body: string }[]).map(
  (k, i) => ({
    id: `kb_default_${i}`,
    title: k.title,
    body: k.body,
    updatedAt: 0,
  }),
)

type VePack = {
  source?: string
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

const ve = veQuoteOps as unknown as VePack

/** V Exchange perpetual articles from quote-ops-three (excludes CFD Broker Pricing). */
export const VE_QUOTE_OPS_KB: KnowledgeItem[] = (ve.knowledge || []).map((k) => ({
  id: k.id,
  title: k.title,
  body: k.body,
  updatedAt: Number(k.updatedAt || 0) || 0,
}))

/** SOP / AI-skill playbooks derived from the V Exchange folder on quote-ops. */
export const VE_QUOTE_OPS_SKILLS: SkillRecord[] = (ve.skills || []).map((s) => ({
  id: s.id,
  level: s.level === 'L2' ? 'L2' : 'L1',
  name: s.name,
  severity: s.severity,
  description: s.name,
  matchHints: s.matchHints || `${s.id} ${s.name}`,
  linkedL1: s.linkedL1 || '',
  check: s.check,
  action: s.action,
  opt: s.opt,
  disabled: false,
  custom: false,
  updatedAt: 0,
}))

export const VE_QUOTE_OPS_SOURCE =
  ve.source || 'https://quote-ops-three.vercel.app/api/kb'

/** Built-in flat KB = legacy defaults + quote-ops V Exchange articles. */
export const DEFAULT_KB: KnowledgeItem[] = [...baseKb, ...VE_QUOTE_OPS_KB]
