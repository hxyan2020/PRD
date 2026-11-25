import cfdQuoteOps from '../_data/cfdQuoteOps.json' with { type: 'json' }
import { cleanLarkMd } from './plain.js'
import type { KbHit, KbItem, Lang, SkillHit, SkillRec } from './types.js'

let skillsCache: SkillRec[] | null = null
let kbCache: KbItem[] | null = null

type CfdPack = {
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
  productLine?: string
}

const cfd = cfdQuoteOps as CfdPack

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
  // Whole-phrase soft boosts for CFD pricing terms
  for (const phrase of [
    'stale',
    'markout',
    'latency',
    'lp',
    'pe',
    'mt',
    '旧价',
    '倒挂',
    '切源',
    '强平',
    '保证金',
    '价差',
    '报价',
    '定价',
  ]) {
    if (queryLower.includes(phrase) && h.includes(phrase)) score += 2
  }
  return score
}

/** Alert / skill codes: CFD RCA ids + legacy VE codes still accepted in pasted alerts. */
const ALERT_CODE_RE =
  /\b(?:sk-[a-z0-9-]+|L[12]-\d{1,2}|L2-[A-F]|IDX-\d{1,2}|PRICE-\d{1,2}|MARK-\d{1,2}|BOOK-\d{1,2}|FUND-\d{1,2}|PEER-\d{1,2}|VE-SOP-\d{1,2}|risk-\d{1,3})\b/gi

export function extractAlertCodes(text: string): string[] {
  return [...new Set((text.match(ALERT_CODE_RE) || []).map((x) => x.toUpperCase()))]
}

function normalizeAlertName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[\s_/·\-—–：:，,。.!！？?·•|]+/g, '')
}

/** Codes listed on a skill (id + matchHints + name). */
function skillAlertCodes(skill: SkillRec): string[] {
  return extractAlertCodes(`${skill.id} ${skill.name} ${skill.matchHints}`)
}

/**
 * Skills are written 1:1 against alert names / codes.
 * Prefer exact name or alert-code hits; only soft-token fallback when neither is present.
 * Soft scoring uses name+hints only — never the long check/action body (that caused Mark/Index/Funding to hit half the catalogue).
 */
function matchSkills(text: string, pool: SkillRec[]): SkillHit[] {
  const queryLower = text.toLowerCase()
  const queryNorm = normalizeAlertName(text)
  const queryCodes = new Set(extractAlertCodes(text))
  const queryTokens = tokenize(text)

  const scored = pool.map((s) => {
    let score = 0
    let deterministic = false

    // 1) Alert-code hit (IDX-01, MARK-01, …) — strongest signal
    const codes = skillAlertCodes(s)
    const codeHits = codes.filter(
      (c) => queryCodes.has(c) || queryLower.includes(c.toLowerCase()),
    )
    if (codeHits.length) {
      score += 100 * codeHits.length
      deterministic = true
    }

    // 2) Full skill / alert name appears in the pasted text
    const name = (s.name || '').trim()
    const nameNorm = normalizeAlertName(name)
    if (nameNorm.length >= 4 && queryNorm.includes(nameNorm)) {
      score += 120
      deterministic = true
    } else if (name.length >= 4 && queryLower.includes(name.toLowerCase())) {
      score += 100
      deterministic = true
    } else {
      // Distinctive name head (before punctuation / slash) e.g.「标记价格降级告警」
      const nameHead = name.split(/[\/／·|]/)[0]?.trim() || ''
      const headNorm = normalizeAlertName(nameHead)
      if (headNorm.length >= 4 && queryNorm.includes(headNorm)) {
        score += 110
        deterministic = true
      }
    }

    // 3) Soft overlap on id / name / hints only (not check / action / opt)
    const softHay = `${s.id} ${s.name} ${s.matchHints}`
    score += scoreAgainst(softHay, queryTokens, queryLower)

    // Distinctive hint keywords / phrases (alert-name aliases). Skip shared desk words.
    const weakHint =
      /^(偏离|监控|告警|价格|资金|异常|失败|超时|恢复|变更|内部|外部|指数|标记|mark|index|funding|price|peer|book|last|mid)$/i
    for (const k of s.matchHints.split(/[\s,/|]+/).filter(Boolean)) {
      if (k.length < 4) continue
      if (/^L[12]-/i.test(k) || extractAlertCodes(k).length) continue
      if (weakHint.test(k)) continue
      if (!queryLower.includes(k.toLowerCase())) continue
      score += k.length >= 6 ? 3 : 2
      // CJK alert aliases (≥4) are treated as name-level hits when unique enough
      if (/[\u4e00-\u9fff]/.test(k) && k.length >= 4) {
        score += 90
        deterministic = true
      }
    }
    // Multi-word English alert aliases in hints
    for (const phrase of [
      'no valid source',
      'single source',
      'empty book',
      'no trade',
    ]) {
      if (
        s.matchHints.toLowerCase().includes(phrase) &&
        queryLower.includes(phrase)
      ) {
        score += 100
        deterministic = true
      }
    }

    return {
      id: s.id,
      name: s.name,
      level: s.level,
      severity: s.severity,
      check: s.check,
      action: s.action,
      score,
      deterministic,
    }
  })

  const strong = scored
    .filter((x) => x.deterministic && x.score >= 100)
    .sort((a, b) => b.score - a.score)

  if (strong.length) {
    // Keep only name/code winners near the top — typically one alert → one L1 skill.
    const best = strong[0]!.score
    return strong
      .filter((x) => x.score >= best - 40)
      .slice(0, 2)
      .map(({ deterministic: _d, ...hit }) => hit)
  }

  // Ambiguous paste (no alert name/code): soft top hits, still capped tightly.
  // If the leader is clearly ahead, treat it as the alert-name winner (one skill).
  const soft = scored
    .filter((x) => x.score > 4)
    .sort((a, b) => b.score - a.score)
  if (!soft.length) return []
  const bestSoft = soft[0]!.score
  const secondSoft = soft[1]?.score ?? 0
  if (bestSoft >= secondSoft + 5) {
    return soft.slice(0, 1).map(({ deterministic: _d, ...hit }) => ({
      ...hit,
      // Promote clear soft leaders so callers treat them as alert-name matches.
      score: Math.max(hit.score, 100),
    }))
  }
  return soft.slice(0, 3).map(({ deterministic: _d, ...hit }) => hit)
}

/**
 * Skills = CFD Broker Pricing RCA playbooks from quote-ops-three
 * (旧价成交 / Bad Tick / LP 切源 / Markout / Stop-out / …).
 * 86 risk scenarios live in the knowledge base, not Skills.
 */
export function loadSkills(): SkillRec[] {
  if (skillsCache) return skillsCache
  skillsCache = (cfd.skills || []).map((s) => ({
    id: s.id,
    level: s.level || 'L1',
    name: s.name,
    severity: s.severity,
    matchHints: s.matchHints || `${s.id} ${s.name}`,
    linkedL1: s.linkedL1 || '',
    check: s.check,
    action: s.action,
    opt: s.opt || '',
  }))
  return skillsCache
}

export function loadKnowledge(): KbItem[] {
  if (kbCache) return kbCache
  kbCache = (cfd.knowledge || []).map((k) => ({
    id: k.id,
    title: k.title,
    body: k.body,
  }))
  return kbCache
}

/** True when the message is (mostly) a catalogue node ID the user wants to open. */
export function looksLikeNodeIdReply(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 64) return false
  // Bare IDs: L1-07, L2-A, ve-doc-alarms, kb_default_0, PRICE-01, …
  return /^(L[12]-\d{1,2}|L2-[A-F]|[A-Za-z][A-Za-z0-9_-]{1,48})$/i.test(t)
}

/**
 * Split Runbook step chains on arrows / semicolons — never collapse into one dense line.
 * Keep admin-menu arrows intact: `后管→合理价格管理` must stay one step.
 */
export function splitSkillSteps(text: string): string[] {
  const protectedText = (text || '')
    .replace(/后管\s*→\s*/g, '后管⟶')
    .replace(/前端\s*→\s*/g, '前端⟶')
  return protectedText
    .split(/\s*(?:→|->|⇒|；|;|\n)+\s*/)
    .map((x) => x.replace(/⟶/g, '→').trim())
    .filter(Boolean)
}

/** Full Skills node body: 后管排查链路 + 决策分支 + 可选，no omission. */
export function formatSkillDetailBody(skill: SkillRec): string {
  const checkSteps = splitSkillSteps(skill.check)
  const actionSteps = splitSkillSteps(skill.action)
  const optSteps = splitSkillSteps(skill.opt)
  const hints = (skill.matchHints || '')
    .split(/[\s,/|]+/)
    .map((x) => x.trim())
    .filter((x) => x && !/^L[12]-/i.test(x) && x.toLowerCase() !== skill.id.toLowerCase())
  const uniqHints = [...new Set(hints)].slice(0, 12)

  return [
    `• **严重度：** **${skill.severity}**`,
    `• **级别：** **${skill.level}**`,
    skill.linkedL1 ? `• **关联 L1：** ${skill.linkedL1}` : '',
    uniqHints.length ? `• **关键词：** ${uniqHints.join(' · ')}` : '',
    '',
    '**检查（后管／前端排查链路）**',
    ...(checkSteps.length
      ? checkSteps.map((x, i) => `${i + 1}. ${x}`)
      : ['• （无排查链路详情）']),
    '',
    '**决策分支（若 / 则 / 否则）**',
    ...(actionSteps.length
      ? actionSteps.map((x) => `• ${x}`)
      : ['• （无决策分支）']),
    '',
    '**可选**',
    ...(optSteps.length ? optSteps.map((x) => `• ${x}`) : ['• （无）']),
  ]
    .filter(Boolean)
    .join('\n')
}

export function resolveNodeById(
  raw: string,
):
  | { kind: 'skill'; id: string; title: string; body: string }
  | { kind: 'knowledge'; id: string; title: string; body: string }
  | null {
  const id = raw.trim().replace(/^[`'"【\[]+|[`'"】\]]+$/g, '')
  if (!id) return null
  const skill = loadSkills().find((s) => s.id.toLowerCase() === id.toLowerCase())
  if (skill) {
    return { kind: 'skill', id: skill.id, title: skill.name, body: formatSkillDetailBody(skill) }
  }
  const kb = loadKnowledge().find((k) => k.id.toLowerCase() === id.toLowerCase())
  if (kb) return { kind: 'knowledge', id: kb.id, title: kb.title, body: kb.body }
  return null
}

export function retrieveRag(text: string): { hits: SkillHit[]; kb: KbHit[]; severity: string } {
  const all = loadSkills()
  const l1Pool = all.filter((s) => s.level === 'L1')
  const l2Pool = all.filter((s) => s.level === 'L2')
  // matchSkills already returns alert-name/code winners (≤2) or a tight soft top (≤3)
  const l1Hits = matchSkills(text, l1Pool)
  const ids = new Set(l1Hits.map((h) => h.id))
  const deterministicL1 = l1Hits.length > 0 && l1Hits[0]!.score >= 100

  const linkedL2 = l2Pool
    .map((s) => ({
      s,
      score: s.linkedL1.split(/\s+/).filter((id) => ids.has(id)).length,
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, deterministicL1 ? 1 : 2)
    .map((o) => ({
      id: o.s.id,
      name: o.s.name,
      level: 'L2' as const,
      severity: o.s.severity,
      check: o.s.check,
      action: o.s.action,
      score: o.score + 2,
    }))

  // When L1 is determined by alert name/code, do not soft-pull unrelated L2.
  const directL2 = deterministicL1
    ? []
    : matchSkills(text, l2Pool)
        .filter((h) => !linkedL2.some((x) => x.id === h.id))
        .slice(0, 1)

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
      const checkLabel = hans
        ? '排查链路（后管／前端）'
        : hant
          ? '排查鏈路（後管／前端）'
          : 'Path (admin / desk)'
      const actionLabel = hans
        ? '决策分支'
        : hant
          ? '決策分支'
          : 'Decision branches'
      const checks = splitSkillSteps(h.check)
      const actions = splitSkillSteps(h.action)
      if (checks.length <= 1) {
        lines.push(`  - **${checkLabel}：** ${h.check}`)
      } else {
        lines.push(`  - **${checkLabel}：**`)
        for (const step of checks) lines.push(`    · ${step}`)
      }
      if (actions.length <= 1) {
        lines.push(`  - **${actionLabel}：** ${h.action}`)
      } else {
        lines.push(`  - **${actionLabel}：**`)
        for (const step of actions) lines.push(`    · ${step}`)
      }
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
        ? '• **知识库：** 无直接摘录；已尝试本地 CFD 定价快照'
        : hant
          ? '• **知識庫：** 無直接摘錄；已嘗試本地 CFD 定價快照'
          : '• **Knowledge:** no direct excerpt; local CFD pricing snapshot was searched',
    )
  }

  if (args.quoteOps) {
    lines.push(hans || hant ? '🔗 **quote-ops CFD 实时 RAG**' : '🔗 **quote-ops CFD live RAG**')
    lines.push(args.quoteOps.slice(0, 1600))
  }

  lines.push(
    hans
      ? '来源：CFD 定价 Skills（RCA Playbooks）+ quote-ops CFD Broker Pricing 知识库（86 风险场景 / LP→PE→MT）。生产写操作／后台／DB 访问需人工审批 — 请联系 **@Yan Haixiang**。'
      : hant
        ? '來源：CFD 定價 Skills（RCA Playbooks）+ quote-ops CFD Broker Pricing 知識庫（86 風險場景 / LP→PE→MT）。生產寫操作／後台／DB 訪問需人工審批 — 請聯繫 **@Yan Haixiang**。'
        : 'Sources: CFD pricing Skills (RCA playbooks) + quote-ops CFD Broker Pricing KB (86 risk scenarios / LP→PE→MT). Production writes / admin / DB access need human approval — contact **@Yan Haixiang**.',
  )

  return cleanLarkMd(lines.join('\n'))
}

const STEP_STOP =
  /^(?:the|and|or|for|with|from|into|请|并|或|及|与|和|后|再|确认|檢查|检查|查看|核对|核對|可选|可選)$/i

function normEvidence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[／/]/g, '/')
    .replace(/[、，,;；]/g, ' ')
    .replace(/\s+/g, '')
    .replace(/ｋ线|k线|k-line/g, 'k线')
}

function stepTokens(step: string): string[] {
  return tokenize(step).filter((w) => w.length >= 2 && !STEP_STOP.test(w))
}

/** True when operator evidence already covers this atomic Skill.check step (order-agnostic). */
export function evidenceCoversStep(step: string, evidenceBlob: string): boolean {
  const blob = normEvidence(evidenceBlob)
  const stepN = normEvidence(step)
  if (blob.includes(stepN) && stepN.length >= 8) return true

  // Phrase anchors that duty officers commonly paraphrase
  const anchors: string[] = []
  if (/前端/.test(step) && /index|mark|k线|成交/i.test(step)) anchors.push('前端', 'index', 'mark', 'k线')
  if (/友商/.test(step)) anchors.push('友商')
  if (/lark/i.test(step) && /剔除|恢复|恢復/.test(step)) anchors.push('lark', '剔除')
  if (/后管|後管/.test(step)) anchors.push('后管', '後管')
  if (anchors.length) {
    const need = Math.min(2, anchors.length)
    const got = anchors.filter((a) => blob.includes(normEvidence(a))).length
    if (got >= need && /前端|友商/.test(step)) {
      // Frontend / peer checks: require at least one price cue too
      if (/前端/.test(step) && !(blob.includes('index') || blob.includes('mark') || blob.includes('k线'))) {
        /* fall through to token overlap */
      } else if (/友商/.test(step) && !blob.includes('友商')) {
        /* fall through */
      } else if (got >= need) {
        return true
      }
    }
  }

  const toks = stepTokens(step)
  if (toks.length < 2) return false
  const hit = toks.filter((w) => blob.includes(normEvidence(w))).length
  // Out-of-order evidence often paraphrases — solid overlap, not the full chain.
  return hit >= Math.max(2, Math.ceil(toks.length * 0.4))
}

function overlapScore(step: string, text: string): number {
  if (!text.trim()) return 0
  const blob = normEvidence(text)
  let score = 0
  for (const w of stepTokens(step)) {
    if (blob.includes(normEvidence(w))) score += w.length >= 3 ? 2 : 1
  }
  if (/前端/.test(step) && blob.includes('前端')) score += 3
  if (/友商/.test(step) && blob.includes('友商')) score += 3
  if (/k线/.test(normEvidence(step)) && blob.includes('k线')) score += 2
  return score
}

export type InvestigationPathPlan = {
  /** Remaining steps, re-ranked for this turn (not Skill.check order). */
  nextSteps: string[]
  /** All Skill.check atomic steps already covered (checked + inferred from evidence). */
  covered: string[]
  /** Newly inferred covered steps from evidence this turn (not previously in checkedSteps). */
  newlyCovered: string[]
  /** True when remaining order differs from Skill.check author order. */
  reordered: boolean
  /** Full Skill.check chain (author order) for the guided overview card. */
  fullSteps: {
    id: string
    skillId: string
    label: string
    raw: string
    required: boolean
    covered: boolean
    authorIdx: number
    latestScore: number
  }[]
}

/** Mark a check atom optional when the step or skill.opt says so. */
export function isOptionalCheckStep(raw: string, skillOpt = ''): boolean {
  if (/【?\s*可选\s*】?|【?\s*可選\s*】?|\(\s*optional\s*\)|\boptional\b/i.test(raw)) {
    return true
  }
  // Skill.opt:「静态配置核查均为【可选】」→ static-config atoms are skippable.
  if (
    /静态配置|靜態配置|static\s*config/i.test(skillOpt) &&
    /可选|可選|optional/i.test(skillOpt) &&
    /静态|靜態|配置核查|配置检查|config\s*check|静态配置|靜態配置/i.test(raw)
  ) {
    return true
  }
  return false
}

/**
 * Plan the next investigation prompts from Skill.check atomic steps.
 * Duty officers paste evidence out of order — skip covered steps, boost steps that
 * match the latest paste, and never dump the full Skill chain as one blob.
 */
export function planInvestigationPath(args: {
  facts: string[]
  hits: SkillHit[]
  checkedSteps: string[]
  lang: 'en' | 'zh-Hans' | 'zh-Hant'
  max?: number
  latestFact?: string
}): InvestigationPathPlan {
  const max = args.max ?? 3
  const zh = args.lang === 'zh-Hans' || args.lang === 'zh-Hant'
  const blob = args.facts.join('\n')
  const latest = (args.latestFact || args.facts.filter((f) => !f.startsWith('[chat-history]')).at(-1) || '').trim()
  const checkedLower = new Set(args.checkedSteps.map((s) => s.toLowerCase().trim()))

  type Ranked = {
    label: string
    raw: string
    skillId: string
    authorIdx: number
    covered: boolean
    wasChecked: boolean
    latestScore: number
  }

  const skillOptById = new Map(loadSkills().map((s) => [s.id, s.opt || '']))
  const ranked: Ranked[] = []
  let authorIdx = 0
  for (const h of args.hits) {
    if (h.level !== 'L1' && ranked.some((r) => r.skillId.startsWith('L1-'))) {
      // Prefer L1 atomic path; L2 stays available if no L1 left.
    }
    const atoms = splitSkillSteps(h.check)
    const parts = atoms.length ? atoms : [h.check]
    for (const raw of parts) {
      const prefix = zh ? `【${h.id}】` : `[${h.id}]`
      const label = `${prefix} ${raw}`
      const wasChecked =
        checkedLower.has(label.toLowerCase()) ||
        checkedLower.has(raw.toLowerCase()) ||
        checkedLower.has(`${h.id}:${raw}`.toLowerCase()) ||
        checkedLower.has(h.id.toLowerCase())
      const covered = wasChecked || evidenceCoversStep(raw, blob)
      ranked.push({
        label,
        raw,
        skillId: h.id,
        authorIdx: authorIdx++,
        covered,
        wasChecked,
        latestScore: overlapScore(raw, latest),
      })
    }
  }

  const covered = ranked.filter((r) => r.covered).map((r) => r.label)
  const newlyCovered = ranked.filter((r) => r.covered && !r.wasChecked).map((r) => r.label)
  const remaining = ranked.filter((r) => !r.covered)

  // Re-rank: prefer steps that the latest paste is talking about, then author order.
  const byAuthor = [...remaining].sort((a, b) => a.authorIdx - b.authorIdx)
  const byLatest = [...remaining].sort((a, b) => {
    if (b.latestScore !== a.latestScore) return b.latestScore - a.latestScore
    return a.authorIdx - b.authorIdx
  })
  // Only call it a reorder when the top remaining step actually changes vs Skill.check order.
  const reordered =
    Boolean(byLatest[0] && byAuthor[0]) &&
    byLatest[0]!.label !== byAuthor[0]!.label &&
    (byLatest[0]!.latestScore || 0) > (byAuthor[0]!.latestScore || 0)

  const chosen = (reordered ? byLatest : byAuthor).slice(0, max)
  const nextSteps = chosen.map((r) => r.label)

  if (!nextSteps.length) {
    if (args.lang === 'zh-Hans') {
      nextSteps.push(
        covered.length
          ? '本 Skill 路径步骤已基本覆盖。请确认决策分支，或贴下一条告警／发 **生成排查报告**。'
          : '请补充：告警原文、合约、指标数值、时间戳，或贴上截图／表格。',
      )
    } else if (args.lang === 'zh-Hant') {
      nextSteps.push(
        covered.length
          ? '本 Skill 路徑步驟已基本覆蓋。請確認決策分支，或貼下一條告警／發 **生成排查報告**。'
          : '請補充：告警原文、合約、指標數值、時間戳，或貼上截圖／表格。',
      )
    } else {
      nextSteps.push(
        covered.length
          ? 'Skill path largely covered. Confirm decision branches, paste another alert, or send **generate investigation report**.'
          : 'Please add: alert text, contract, metric values, timestamps — or paste a screenshot / table.',
      )
    }
  }

  const fullSteps = ranked.map((r) => ({
    id: `${r.skillId}:${r.authorIdx}`,
    skillId: r.skillId,
    label: r.label,
    raw: r.raw,
    required: !isOptionalCheckStep(r.raw, skillOptById.get(r.skillId) || ''),
    covered: r.covered,
    authorIdx: r.authorIdx,
    latestScore: r.latestScore,
  }))

  return { nextSteps, covered, newlyCovered, reordered, fullSteps }
}

/**
 * Adaptive next steps: skip already-checked items, re-rank from latest evidence.
 * Duty officers may paste evidence out of Skill.check order.
 */
export function adaptiveNextSteps(args: {
  facts: string[]
  hits: SkillHit[]
  checkedSteps: string[]
  lang: 'en' | 'zh-Hans' | 'zh-Hant'
  max?: number
  latestFact?: string
}): string[] {
  return planInvestigationPath(args).nextSteps
}

export function preferredActions(
  hits: SkillHit[],
  lang: 'en' | 'zh-Hans' | 'zh-Hant',
  max = 2,
): string[] {
  return hits.slice(0, max).map((h) => {
    const tag =
      lang === 'zh-Hans'
        ? `决策分支（需审批 · 联系 @Yan Haixiang）· ${h.id}`
        : lang === 'zh-Hant'
          ? `決策分支（需審批 · 聯繫 @Yan Haixiang）· ${h.id}`
          : `Decision branch (approval · contact @Yan Haixiang) · ${h.id}`
    return `${tag}: ${h.action}`
  })
}
