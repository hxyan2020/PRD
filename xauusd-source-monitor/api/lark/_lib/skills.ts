import l1Raw from '../_data/l1.json' with { type: 'json' }
import l2Raw from '../_data/l2.json' with { type: 'json' }
import kbRaw from '../_data/kbDefaults.json' with { type: 'json' }
import veQuoteOps from '../_data/veQuoteOps.json' with { type: 'json' }
import { cleanLarkMd } from './plain.js'
import type { KbHit, KbItem, Lang, SkillHit, SkillRec } from './types.js'

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

/** Latin words + CJK runs / bi- / trigrams for bilingual risk text. */
export function tokenize(text: string): string[] {
  const t = text.toLowerCase()
  const out = new Set<string>()
  for (const w of t.split(/[^a-z0-9_%.\-]+/i)) {
    if (w.length >= 2) out.add(w)
  }
  const cjk = t.match(/[\u4e00-\u9fff]+/g) || []
  for (const run of cjk) {
    if (run.length >= 2) out.add(run)
    for (let i = 0; i < run.length; i++) {
      out.add(run[i]!)
      if (i + 1 < run.length) out.add(run.slice(i, i + 2))
      if (i + 2 < run.length) out.add(run.slice(i, i + 3))
    }
  }
  return [...out]
}

function scoreAgainst(haystack: string, queryTokens: string[], queryLower: string): number {
  const h = haystack.toLowerCase()
  let score = 0
  for (const tok of queryTokens) {
    if (tok.length < 2) continue
    if (!h.includes(tok)) continue
    if (/[\u4e00-\u9fff]/.test(tok)) {
      score += tok.length >= 3 ? 3 : 2
    } else {
      score += tok.length >= 4 ? 2 : 1
    }
  }
  // Whole-phrase soft boosts for common VE terms
  for (const phrase of [
    'mark',
    'index',
    'funding',
    'adl',
    '无有效源',
    '接仓',
    '强平',
    '偏离',
    '溢价',
    '永续',
  ]) {
    if (queryLower.includes(phrase) && h.includes(phrase)) score += 2
  }
  return score
}

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
  const queryLower = text.toLowerCase()
  const queryTokens = tokenize(text)
  return pool
    .map((s) => {
      const hay = `${s.id} ${s.name} ${s.matchHints} ${s.check} ${s.action} ${s.opt}`
      let score = scoreAgainst(hay, queryTokens, queryLower)
      // keep legacy id/name includes for latin ids like IDX-01
      const keys = [s.id.toLowerCase(), s.name.toLowerCase(), ...s.matchHints.split(/[\s,/|]+/).filter(Boolean)]
      for (const k of keys) {
        if (k.length >= 2 && queryLower.includes(k.toLowerCase())) score += k.length >= 4 ? 2 : 1
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

  const queryLower = text.toLowerCase()
  const queryTokens = tokenize(text)
  const kb = loadKnowledge()
    .map((item) => {
      const hay = `${item.id} ${item.title} ${item.body}`
      const score = scoreAgainst(hay, queryTokens, queryLower)
      return { ...item, score }
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

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
 * Always-on answer block from Skills + KB (+ optional live quote-ops).
 * Used so the bot can fulfill user needs even when LLM is down.
 */
export function formatRagAnswer(args: {
  lang: Lang
  question: string
  hits: SkillHit[]
  kb: KbHit[]
  severity: string
  quoteOps?: string | null
}): string {
  const hans = args.lang === 'zh-Hans'
  const hant = args.lang === 'zh-Hant'
  const lines: string[] = []

  lines.push(
    hans
      ? '📚 **知识库／Skills 检索结果**'
      : hant
        ? '📚 **知識庫／Skills 檢索結果**'
        : '📚 **Knowledge / Skills retrieval**',
  )
  lines.push(
    hans
      ? `• **建议严重度：** **${args.severity}**`
      : hant
        ? `• **建議嚴重度：** **${args.severity}**`
        : `• **Severity proposal:** **${args.severity}**`,
  )

  if (args.hits.length) {
    lines.push(hans || hant ? '🧩 **Skills 命中**' : '🧩 **Skills hit**')
    for (const h of args.hits.slice(0, 4)) {
      lines.push(`• **${h.id} · ${h.name}**`)
      lines.push(
        hans
          ? `  - **检查：** ${h.check}`
          : hant
            ? `  - **檢查：** ${h.check}`
            : `  - **Check:** ${h.check}`,
      )
      lines.push(
        hans
          ? `  - **建议（需审批）：** ${h.action}`
          : hant
            ? `  - **建議（需審批）：** ${h.action}`
            : `  - **Action (approval):** ${h.action}`,
      )
    }
  } else {
    lines.push(
      hans
        ? '• **Skills：** 无高置信命中 — 请补充告警字段或输入 **investigate**'
        : hant
          ? '• **Skills：** 無高置信命中 — 請補充告警欄位或輸入 **investigate**'
          : '• **Skills:** no high-confidence hit — add alert fields or type **investigate**',
    )
  }

  if (args.kb.length) {
    lines.push(hans || hant ? '📖 **知识库摘录**' : '📖 **Knowledge excerpts**')
    for (const k of args.kb.slice(0, 3)) {
      const excerpt = k.body.replace(/\s+/g, ' ').trim().slice(0, 420)
      lines.push(`• **${k.title}**`)
      lines.push(`  ${excerpt}${k.body.length > 420 ? '…' : ''}`)
    }
  } else {
    lines.push(
      hans
        ? '• **知识库：** 无直接摘录；已尝试本地 VE 永续快照'
        : hant
          ? '• **知識庫：** 無直接摘錄；已嘗試本地 VE 永續快照'
          : '• **Knowledge:** no direct excerpt; local VE perpetual snapshot was searched',
    )
  }

  if (args.quoteOps) {
    lines.push(hans || hant ? '🔗 **quote-ops 实时 RAG**' : '🔗 **quote-ops live RAG**')
    lines.push(args.quoteOps.slice(0, 1600))
  }

  lines.push(
    hans
      ? '来源：desk L1/L2 Skills + quote-ops V Exchange 永续知识（已排除 CFD）。生产写操作需人工审批。'
      : hant
        ? '來源：desk L1/L2 Skills + quote-ops V Exchange 永續知識（已排除 CFD）。生產寫操作需人工審批。'
        : 'Sources: desk L1/L2 Skills + quote-ops V Exchange perpetual KB (CFD excluded). Production writes need human approval.',
  )

  return cleanLarkMd(lines.join('\n'))
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
    const checkTokens = tokenize(h.check).filter((w) => w.length >= 2)
    const covered = checkTokens.filter((w) => blob.includes(w.toLowerCase())).length
    if (covered >= Math.max(2, Math.ceil(checkTokens.length * 0.35))) {
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
