import l1Raw from './l1.json'
import l2Raw from './l2.json'
import kbRaw from './kbDefaults.json'
import type { KnowledgeItem, L1Skill, L2Chain } from '../types'

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

export const DEFAULT_KB: KnowledgeItem[] = (kbRaw as { title: string; body: string }[]).map(
  (k, i) => ({
    id: `kb_default_${i}`,
    title: k.title,
    body: k.body,
    updatedAt: 0,
  }),
)
