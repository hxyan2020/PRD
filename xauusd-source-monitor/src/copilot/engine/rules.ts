import { L1_SKILLS, L2_CHAINS } from '../data/catalog'
import type { SkillOverrides } from '../storage'
import type { KnowledgeItem, L1Skill, RuleAnalysis, SeverityChoice } from '../types'

export function applyOverrides(overrides: SkillOverrides): L1Skill[] {
  return L1_SKILLS.map((s) => ({ ...s, ...overrides[s.id] }))
}

function matchSkills(text: string, skills: L1Skill[]): { s: L1Skill; score: number }[] {
  const t = text.toLowerCase()
  return skills
    .map((s) => {
      const keys = [s.id.toLowerCase(), s.name.toLowerCase(), ...s.name.split(/\s+/)]
      let score = 0
      for (const k of keys) {
        if (k.length >= 2 && t.includes(k)) score += k.length >= 4 ? 2 : 1
      }
      // loose token hits from check path
      for (const w of s.check.split(/[，、；;/\s]+/).filter((x) => x.length >= 3)) {
        if (t.includes(w.toLowerCase())) score += 1
      }
      return { s, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

export function analyzeWithRules(args: {
  text: string
  severity: SeverityChoice
  overrides: SkillOverrides
  knowledge: KnowledgeItem[]
}): RuleAnalysis {
  const skills = applyOverrides(args.overrides)
  const hits = matchSkills(args.text, skills)
  const ids = hits.map((h) => h.s.id)
  const l2 = L2_CHAINS.map((x) => ({
    x,
    score: x.linkedL1.split(/\s+/).filter((id) => ids.includes(id)).length,
  }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  const k = args.knowledge
    .map((x) => ({
      x,
      score: x.title
        .split(/\s+/)
        .filter((w) => w && args.text.toLowerCase().includes(w.toLowerCase())).length,
    }))
    .filter((o) => o.score)
    .slice(0, 4)

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

  const lines = [
    '【建议严重度】' + sev + '（仅基于输入和规则，需当班人员复核）',
    '',
    '【已知事实】',
    args.text || '未提供告警文字。',
    '',
    '【L1 匹配】',
    ...(hits.length
      ? hits.map((h) => `• ${h.s.id} ${h.s.name} [${h.s.severity}]`)
      : ['• 未能可靠匹配。请补充告警原文、合约、数值和时间。']),
    '',
    '【L2 候选链路（非已证实根因）】',
    ...(l2.length
      ? l2.map((o) => `• ${o.x.id} ${o.x.name}；关联 ${o.score} 个 L1`)
      : ['• 目前证据不足，暂不强行聚合。']),
    '',
    '【候选根因 / 验证方向】',
    ...(l2.length
      ? l2.map((o) => `• ${o.x.name}：需要验证其上游故障是否早于下游异常`)
      : ['• 数据源、报价策略、账户风险、撮合/结算或监控自身异常；尚无法确定。']),
    '',
    '【排查路径】',
    ...hits.map((h) => `• ${h.s.id}： ${h.s.check}`),
    ...l2.map((o) => `• ${o.x.id}： ${o.x.check}`),
    '',
    '【Preferred Action（须按权限审批）】',
    ...hits.map((h) => `• ${h.s.id}： ${h.s.action}`),
    ...l2.map((o) => `• ${o.x.id}： ${o.x.action}`),
    '',
    '【后续优化】',
    ...hits.map((h) => `• ${h.s.opt}`),
    ...l2.map((o) => `• ${o.x.opt}`),
    '',
    '【知识库相关条目】',
    ...(k.length
      ? k.map((o) => `• ${o.x.title}：${o.x.body.slice(0, 220)}`)
      : ['• 无关键词匹配；请在知识库补充相关 PRD/SOP。']),
    '',
    '【升级与收口】',
    sev === 'P0'
      ? '• 立即通知 Risk Ops、业务 Owner 和技术值班；不等待 L2 或 AI。'
      : '• 当班确认责任人、业务影响和下一次复核时间。',
    '• 恢复需核对价格/仓位/账务/服务状态，观察稳定后由授权人员关闭。',
    '',
    '【缺失证据】',
    '• 需要准确的 event_time、contract_id、account_id、指标原始值、阈值、上下游日志、已采取动作。',
    '',
    '本段为确定性规则辅助，可与大模型报告对照；不构成已证实根因或自动执行指令。',
  ]

  const skillContext = [
    '## L1 skills matched',
    ...hits.map(
      (h) =>
        `- ${h.s.id} ${h.s.name} [${h.s.severity}]\n  check: ${h.s.check}\n  action: ${h.s.action}\n  opt: ${h.s.opt}`,
    ),
    '## L2 chains',
    ...l2.map(
      (o) =>
        `- ${o.x.id} ${o.x.name}\n  linked: ${o.x.linkedL1}\n  check: ${o.x.check}\n  action: ${o.x.action}\n  opt: ${o.x.opt}`,
    ),
  ].join('\n')

  const kbContext = k.map((o) => `### ${o.x.title}\n${o.x.body}`).join('\n\n')

  return {
    body: lines.join('\n'),
    sev,
    hits: ids,
    l2: l2.map((o) => o.x.id),
    skillContext,
    kbContext,
  }
}
