import kbRaw from './kbDefaults.json'
import skills34Raw from './skills34.json'
import veQuoteOps from './veQuoteOps.json'
import type { KnowledgeItem, SkillRecord } from '../types'

type Skills34Pack = {
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

/** Runbook V18: 28 L1 + 6 L2 = 34 investigation scenarios (Skills). */
export const SKILLS_34: SkillRecord[] = ((skills34Raw as Skills34Pack).skills || []).map(
  (s) => ({
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
  }),
)

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

export const VE_QUOTE_OPS_SOURCE =
  ve.source || 'https://quote-ops-three.vercel.app/api/kb'

/** Built-in flat KB = legacy defaults + quote-ops V Exchange articles. */
export const DEFAULT_KB: KnowledgeItem[] = [...baseKb, ...VE_QUOTE_OPS_KB]
