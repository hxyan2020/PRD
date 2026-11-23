import l1Raw from '../_data/l1.json' with { type: 'json' }
import l2Raw from '../_data/l2.json' with { type: 'json' }
import kbRaw from '../_data/kbDefaults.json' with { type: 'json' }
import veQuoteOps from '../_data/veQuoteOps.json' with { type: 'json' }
import type { KbHit, KbItem, SkillHit, SkillRec } from './types.js'

let skillsCache: SkillRec[] | null = null
let kbCache: KbItem[] | null = null

type VePack = {
  knowledge?: { id: string; title: string; body: string }[]
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

const ve = veQuoteOps as VePack

export function loadSkills(): SkillRec[] {
  if (skillsCache) return skillsCache
  const l1 = (l1Raw as string[][]).map((r) => ({
    id: r[0]!,
    level: 'L1' as const,
    name: r[1]!,
    severity: r[2]!,
    matchHints: `${r[0]} ${r[1]}`,
    linkedL1: '',
    check: r[3]!,
    action: r[4]!,
    opt: r[5]!,
  }))
  const l2 = (l2Raw as string[][]).map((r) => ({
    id: r[0]!,
    level: 'L2' as const,
    name: r[1]!,
    severity: 'P2',
    matchHints: `${r[0]} ${r[1]} ${r[2]}`,
    linkedL1: r[2]!,
    check: r[3]!,
    action: r[4]!,
    opt: r[5]!,
  }))
  const veSkills: SkillRec[] = (ve.skills || []).map((s) => ({
    id: s.id,
    level: s.level,
    name: s.name,
    severity: s.severity,
    matchHints: s.matchHints || `${s.id} ${s.name}`,
    linkedL1: s.linkedL1 || '',
    check: s.check,
    action: s.action,
    opt: s.opt,
  }))
  const seen = new Set([...l1, ...l2].map((s) => s.id))
  skillsCache = [...l1, ...l2, ...veSkills.filter((s) => !seen.has(s.id))]
  return skillsCache
}

export function loadKnowledge(): KbItem[] {
  if (kbCache) return kbCache
  const base = (kbRaw as { title: string; body: string }[]).map((k, i) => ({
    id: `kb_default_${i}`,
    title: k.title,
    body: k.body,
  }))
  const veKb: KbItem[] = (ve.knowledge || []).map((k) => ({
    id: k.id,
    title: k.title,
    body: k.body,
  }))
  kbCache = [...base, ...veKb]
  return kbCache
}

function matchSkills(text: string, pool: SkillRec[]): SkillHit[] {
  const t = text.toLowerCase()
  return pool
    .map((s) => {
      const keys = [
        s.id.toLowerCase(),
        s.name.toLowerCase(),
        ...s.name.split(/\s+/),
        ...s.matchHints.split(/[\s,/|]+/).filter(Boolean),
      ]
      let score = 0
      for (const k of keys) {
        if (k.length >= 2 && t.includes(k.toLowerCase())) score += k.length >= 4 ? 2 : 1
      }
      for (const w of s.check.split(/[，、；;/\s]+/).filter((x) => x.length >= 3)) {
        if (t.includes(w.toLowerCase())) score += 1
      }
      return {
        id: s.id,
        name: s.name,
        level: s.level,
        severity: s.severity,
        check: s.check,
        action: s.action,
        score,
      }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function retrieveRag(text: string): { hits: SkillHit[]; kb: KbHit[]; severity: string } {
  const all = loadSkills()
  const l1Pool = all.filter((s) => s.level === 'L1')
  const l2Pool = all.filter((s) => s.level === 'L2')
  const l1Hits = matchSkills(text, l1Pool).slice(0, 6)
  const ids = new Set(l1Hits.map((h) => h.id))

  const linkedL2 = l2Pool
    .map((s) => ({
      s,
      score: s.linkedL1.split(/\s+/).filter((id) => ids.has(id)).length,
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((o) => ({
      id: o.s.id,
      name: o.s.name,
      level: 'L2' as const,
      severity: o.s.severity,
      check: o.s.check,
      action: o.s.action,
      score: o.score + 2,
    }))

  const directL2 = matchSkills(text, l2Pool)
    .filter((h) => !linkedL2.some((x) => x.id === h.id))
    .slice(0, 2)

  const hits = [...l1Hits, ...linkedL2, ...directL2]

  const kb = loadKnowledge()
    .map((item) => {
      const t = text.toLowerCase()
      const titleHits = item.title
        .split(/\s+/)
        .filter((w) => w && t.includes(w.toLowerCase())).length
      const bodyHit = item.body
        .split(/[\s，、。；;]+/)
        .filter((w) => w.length >= 4 && t.includes(w.toLowerCase())).length
      return { ...item, score: titleHits * 2 + Math.min(bodyHit, 3) }
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  const p0 =
    hits.some((h) => h.severity === 'P0') ||
    /ADL失败|全部.*源.*失败|错误强平|强平失败|无有效源|对冲失控|no clear cause/i.test(text)
  const severity = p0
    ? 'P0'
    : hits.some((h) => h.severity === 'P1')
      ? 'P1'
      : hits.length
        ? 'P2'
        : '待判定'

  return { hits, kb, severity }
}

/**
 * Adaptive next steps: skip already-checked items, prefer highest-score L1 checks,
 * and rephrase based on new evidence — never dump the full skill catalogue.
 */
export function adaptiveNextSteps(args: {
  facts: string[]
  hits: SkillHit[]
  checkedSteps: string[]
  lang: 'en' | 'zh-Hans' | 'zh-Hant'
  max?: number
}): string[] {
  const max = args.max ?? 3
  const blob = args.facts.join('\n').toLowerCase()
  const checked = new Set(args.checkedSteps.map((s) => s.toLowerCase()))
  const steps: string[] = []
  const zh = args.lang === 'zh-Hans' || args.lang === 'zh-Hant'

  for (const h of args.hits) {
    if (steps.length >= max) break
    const checkKey = `${h.id}:${h.check}`.toLowerCase()
    if (checked.has(checkKey) || checked.has(h.id.toLowerCase())) continue
    const checkTokens = h.check.split(/[，、；;,/\s]+/).filter((w) => w.length >= 4)
    const covered = checkTokens.filter((w) => blob.includes(w.toLowerCase())).length
    if (covered >= Math.max(2, Math.ceil(checkTokens.length * 0.4))) {
      continue
    }
    const prefix = zh ? `【${h.id}】` : `[${h.id}]`
    steps.push(`${prefix} ${h.check}`)
  }

  if (!steps.length) {
    if (args.lang === 'zh-Hans') {
      steps.push('请补充：告警原文、合约、指标数值、时间戳，或贴上截图／表格。')
    } else if (args.lang === 'zh-Hant') {
      steps.push('請補充：告警原文、合約、指標數值、時間戳，或貼上截圖／表格。')
    } else {
      steps.push(
        'Please add: alert text, contract, metric values, timestamps — or paste a screenshot / table.',
      )
    }
  }
  return steps
}

export function preferredActions(
  hits: SkillHit[],
  lang: 'en' | 'zh-Hans' | 'zh-Hant',
  max = 2,
): string[] {
  return hits.slice(0, max).map((h) => {
    const tag =
      lang === 'zh-Hans'
        ? `建议（需审批）· ${h.id}`
        : lang === 'zh-Hant'
          ? `建議（需審批）· ${h.id}`
          : `Preferred action (approval) · ${h.id}`
    return `${tag}: ${h.action}`
  })
}
