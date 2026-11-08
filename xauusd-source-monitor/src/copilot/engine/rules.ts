import { kbPath } from '../storage'
import type {
  KbNode,
  KnowledgeItem,
  KnowledgeHitRef,
  L1Skill,
  RuleAnalysis,
  SeverityChoice,
  SkillHitRef,
  SkillRecord,
  TimelineEvent,
} from '../types'

export function skillsToL1(active: SkillRecord[]): L1Skill[] {
  return active
    .filter((s) => s.level === 'L1' && !s.disabled && !s.archivedAt)
    .map((s) => ({
      id: s.id,
      name: s.name,
      severity: s.severity,
      check: s.check,
      action: s.action,
      opt: s.opt,
    }))
}

function matchSkills(
  text: string,
  skills: SkillRecord[],
): { s: SkillRecord; score: number }[] {
  const t = text.toLowerCase()
  return skills
    .filter((s) => !s.disabled && !s.archivedAt)
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
      return { s, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

function matchKnowledge(
  text: string,
  knowledge: KnowledgeItem[],
  tree?: KbNode[],
): { item: KnowledgeItem; score: number; path: string }[] {
  const t = text.toLowerCase()
  return knowledge
    .map((x) => {
      const titleHits = x.title
        .split(/\s+/)
        .filter((w) => w && t.includes(w.toLowerCase())).length
      const bodyHit = x.body
        .split(/[\s，、。；;]+/)
        .filter((w) => w.length >= 4 && t.includes(w.toLowerCase())).length
      const score = titleHits * 2 + Math.min(bodyHit, 3)
      return {
        item: x,
        score,
        path: tree ? kbPath(tree, x.id) : x.title,
      }
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export function analyzeWithRules(args: {
  text: string
  severity: SeverityChoice
  skills: SkillRecord[]
  knowledge: KnowledgeItem[]
  tree?: KbNode[]
  startedAt?: number
}): RuleAnalysis {
  const startedAt = args.startedAt ?? Date.now()
  const l1Pool = args.skills.filter((s) => s.level === 'L1')
  const l2Pool = args.skills.filter((s) => s.level === 'L2')
  const hits = matchSkills(args.text, l1Pool)
  const ids = hits.map((h) => h.s.id)

  const l2 = l2Pool
    .filter((x) => !x.disabled && !x.archivedAt)
    .map((x) => ({
      x,
      score: x.linkedL1.split(/\s+/).filter((id) => ids.includes(id)).length,
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  // Also allow direct L2 name/id hits
  const directL2 = matchSkills(args.text, l2Pool).filter(
    (h) => !l2.some((o) => o.x.id === h.s.id),
  )
  for (const d of directL2.slice(0, 2)) {
    l2.push({ x: d.s, score: d.score })
  }

  const k = matchKnowledge(args.text, args.knowledge, args.tree)

  const p0 =
    hits.some((h) => h.s.severity === 'P0') ||
    /ADL失败|全部.*源.*失败|错误强平|强平失败|无有效源|对冲失控|排查後未發現|no clear cause/i.test(
      args.text,
    )
  const sev =
    args.severity === '自动建议'
      ? p0
        ? 'P0'
        : hits.some((h) => h.s.severity === 'P1')
          ? 'P1'
          : hits.length
            ? 'P2'
            : '待判定'
      : args.severity

  const thinking: string[] = [
    'Ingest alert text / OCR facts and optional briefing import.',
    hits.length
      ? `Matched ${hits.length} L1 skill(s) by id/name/check tokens.`
      : 'No confident L1 skill match — need clearer alert text, contract, and metric values.',
    l2.length
      ? `Aggregated ${l2.length} L2 chain candidate(s) from linked L1 / direct hits.`
      : 'Insufficient linked L1 evidence to force an L2 root-cause chain.',
    k.length
      ? `Retrieved ${k.length} knowledge-tree document(s) for RAG context.`
      : 'No knowledge-tree keyword hit — answer stays conservative.',
    'Distinguish confirmed facts vs hypotheses; do not invent admin-DB answers (Phase 2).',
    `Severity proposal: ${sev} (human on-duty must confirm).`,
  ]

  const timeline: TimelineEvent[] = [
    { at: startedAt, label: 'RCA triggered — facts ingested' },
    { at: startedAt + 1, label: 'Skills matching (L1 → L2)' },
    { at: startedAt + 2, label: 'Knowledge tree RAG retrieval' },
    { at: startedAt + 3, label: `Severity proposal ${sev}` },
    { at: startedAt + 4, label: 'Recommended next steps drafted' },
  ]

  const skillsUsed: SkillHitRef[] = [
    ...hits.map((h) => ({
      id: h.s.id,
      name: h.s.name,
      level: 'L1' as const,
      severity: h.s.severity,
    })),
    ...l2.map((o) => ({
      id: o.x.id,
      name: o.x.name,
      level: 'L2' as const,
      severity: o.x.severity,
    })),
  ]

  const knowledgeUsed: KnowledgeHitRef[] = k.map((o) => ({
    id: o.item.id,
    title: o.item.title,
    path: o.path,
  }))

  const nextSteps = [
    ...hits.map((h) => `${h.s.id}: ${h.s.check}`),
    ...l2.map((o) => `${o.x.id}: ${o.x.check}`),
    ...hits.map((h) => `${h.s.id} preferred action (approval required): ${h.s.action}`),
    ...l2.map((o) => `${o.x.id} preferred action (approval required): ${o.x.action}`),
  ]
  if (!nextSteps.length) {
    nextSteps.push(
      'Collect event_time, contract_id, account_id, raw metric, threshold, upstream/downstream logs.',
      'Re-run Investigate after adding OCR text or a Market Condition briefing.',
      'Escalate to Risk Ops if market impact is unclear — do not invent admin DB answers (Phase 2).',
    )
  }

  const lines = [
    '【建议严重度】' + sev + '（仅基于输入和规则，需当班人员复核）',
    '',
    '【思考过程】',
    ...thinking.map((x) => `• ${x}`),
    '',
    '【时间线】',
    ...timeline.map(
      (e) =>
        `• ${new Date(e.at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT — ${e.label}`,
    ),
    '',
    '【已知事实】',
    args.text || '未提供告警文字。',
    '',
    '【使用的 Skills】',
    ...(skillsUsed.length
      ? skillsUsed.map((s) => `• [${s.level}] ${s.id} ${s.name}${s.severity ? ` (${s.severity})` : ''}`)
      : ['• 未能可靠匹配。请补充告警原文、合约、数值和时间。']),
    '',
    '【使用的知识树节点】',
    ...(knowledgeUsed.length
      ? knowledgeUsed.map((n) => `• ${n.path}`)
      : ['• 无关键词匹配；请在 Knowledge Base 补充相关节点。']),
    '',
    '【候选根因 / 验证方向】',
    ...(l2.length
      ? l2.map((o) => `• ${o.x.name}：需要验证其上游故障是否早于下游异常`)
      : ['• 数据源、报价策略、账户风险、撮合/结算或监控自身异常；尚无法确定。']),
    '',
    '【分步推荐下一步】',
    ...nextSteps.map((s, i) => `${i + 1}. ${s}`),
    '',
    '【后续优化（仅归档 RCA 进入周优化输入）】',
    ...hits.map((h) => `• ${h.s.opt}`),
    ...l2.map((o) => `• ${o.x.opt}`),
    '',
    '【升级与收口】',
    sev === 'P0'
      ? '• 立即通知 Risk Ops、业务 Owner 和技术值班；不等待 L2 或 AI。'
      : '• 当班确认责任人、业务影响和下一次复核时间。',
    '• 恢复需核对价格/仓位/账务/服务状态，观察稳定后由授权人员关闭。',
    '',
    '【缺失证据 / 诚实边界】',
    '• 需要准确的 event_time、contract_id、account_id、指标原始值、阈值、上下游日志、已采取动作。',
    '• 内部管理台 / 账户数据库检索为 Phase 2 — 本助手不会编造 admin DB 答案。',
    '',
    '本段为确定性规则辅助；不构成已证实根因或自动执行指令。实时统计会计入每一次触发的 RCA；仅归档后才进入周优化输入。',
  ]

  const skillContext = [
    '## Skills used',
    ...skillsUsed.map((s) => `- [${s.level}] ${s.id} ${s.name}`),
    '## L1 detail',
    ...hits.map(
      (h) =>
        `- ${h.s.id} ${h.s.name} [${h.s.severity}]\n  check: ${h.s.check}\n  action: ${h.s.action}\n  opt: ${h.s.opt}`,
    ),
    '## L2 detail',
    ...l2.map(
      (o) =>
        `- ${o.x.id} ${o.x.name}\n  linked: ${o.x.linkedL1}\n  check: ${o.x.check}\n  action: ${o.x.action}\n  opt: ${o.x.opt}`,
    ),
  ].join('\n')

  const kbContext = k.map((o) => `### ${o.path}\n${o.item.body}`).join('\n\n')

  return {
    body: lines.join('\n'),
    sev,
    hits: ids,
    l2: l2.map((o) => o.x.id),
    skillContext,
    kbContext,
    thinking,
    timeline,
    skillsUsed,
    knowledgeUsed,
    nextSteps,
  }
}

/** Rules-mode follow-up that refuses invented admin answers. */
export function followUpWithRules(question: string, activeFacts: string): string {
  const q = question.trim()
  const lower = q.toLowerCase()
  const wantsAdmin =
    /admin|账号|账户|仓位|持仓|数据库|db\b|sql|后台|管理台|内部数据|拉取|查询用户/i.test(q)
  const lines = [
    '【追问回复 · 本地规则】',
    '',
    `问题：${q}`,
    '',
  ]
  if (wantsAdmin) {
    lines.push(
      '我不确定，也无法在本阶段检索内部管理台或账户数据库。',
      '内部 admin 信息检索属于 Phase 2 — 请勿假设我已访问生产数据。',
      '请改用当班 Risk Ops 工具链，或把已知截图/指标粘贴到 Investigate 事实框后重新分析。',
    )
  } else if (!activeFacts.trim()) {
    lines.push(
      '当前事故缺少事实输入，我无法可靠回答。',
      '请补充告警原文、合约、数值与时间戳后重新运行分析。',
    )
  } else if (/为什么|why|怎么|how|根因|root/i.test(lower)) {
    lines.push(
      '基于已保存事实，我只能复述规则匹配结论，不能发明新根因。',
      '若 Skills / Knowledge Base 未覆盖该场景，答案即为「不确定」。',
      '请在 Skills 或知识树补充节点后再分析，或升级人工排查。',
      '',
      '提醒：内部 admin 信息检索为 Phase 2。',
    )
  } else {
    lines.push(
      '我只能依据本次 RCA 已匹配的 Skills 与知识树节点解释报告内容。',
      '若问题超出已提供证据，我的诚实回答是：不知道。',
      '内部管理台 / DB 拉取属于 Phase 2，不会编造。',
    )
  }
  return lines.join('\n')
}
