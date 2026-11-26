import { isZh } from './lang.js'
import { formatNodeBodyForLark } from './plain.js'
import {
  countRiskVerdicts,
  riskVerdictEmoji,
  riskVerdictLabel,
  suggestRiskVerdict,
} from './riskVerdict.js'
import type {
  GuideStep,
  IncidentRecord,
  KbItem,
  Lang,
  RiskVerdict,
  SkillRec,
} from './types.js'

const SKILLS_URL = 'https://vex-llm-proxy.vercel.app/#/skills'
const KNOWLEDGE_URL = 'https://vex-llm-proxy.vercel.app/#/knowledge'
const MARKET_URL = 'https://vex-llm-proxy.vercel.app/#/market'
const DASHBOARD_URL = 'https://vex-llm-proxy.vercel.app/#/reports'
const ALERT_OPTIMIZE_URL = 'https://vex-llm-proxy.vercel.app/#/alert-optimize'

/** Desk entry for alert-threshold / CSV+API analysis. */
export function alertOptimizeCard(lang: Lang): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '告警优化'
    : zh
      ? '告警優化'
      : 'Alert optimize'
  const body = hans
    ? [
        '🛠️ **告警优化／通用分析（桌面）**',
        '',
        '页面两个入口：',
        '• **告警优化** — 三槽数据源（底层数据／告警日志／人工标注是否有效，至少一项）→ 可选告警名称 → 多选优化方向（阈值／窗口／扫描频率／未监控风险…）→ 按排查路径产出',
        '• **通用分析** — CSV／API + 自由问题 → 读到什么／图表／答案／数据问题／假设',
        '',
        '均可一键报告／复制。',
        '',
        `[打开告警优化页](${ALERT_OPTIMIZE_URL})`,
      ].join('\n')
    : zh
      ? [
          '🛠️ **告警優化／通用分析（桌面）**',
          '',
          '兩個入口：**告警優化**（三槽數據 + 告警名／優化方向）與 **通用分析**（CSV／API + 問題）；均含圖表與一鍵報告／複製。',
          '',
          `[打開告警優化頁](${ALERT_OPTIMIZE_URL})`,
        ].join('\n')
      : [
          '🛠️ **Alert optimize / General analysis (web desk)**',
          '',
          'Two entries:',
          '• **Alert optimize** — three slots (underlying / alert logs / human labels; ≥1) → optional alert name → multi-select directions → investigation path',
          '• **General analysis** — CSV/API + free-form question → readback / charts / answer / issues / assumptions',
          '',
          'One-click report / copy on both.',
          '',
          `[Open Alert optimize](${ALERT_OPTIMIZE_URL})`,
        ].join('\n')
  return simpleCard(title, body, 'turquoise')
}

function severityEmoji(sev: string): string {
  const s = (sev || '').toUpperCase()
  if (s.includes('P0')) return '🔴'
  if (s.includes('P1')) return '🟠'
  if (s.includes('P2')) return '🔵'
  if (s.includes('P3')) return '⚪'
  return '📌'
}

/** Bold skill id for scannable steps (renders via lark_md). */
function formatStepLine(raw: string, index: number): string {
  const m = raw.match(/^(\[[^\]]+\]|【[^】]+】)\s*(.*)$/)
  if (m) return `${index + 1}. **${m[1]}** ${m[2]}`
  return `${index + 1}. ${raw}`
}

function formatActionLine(raw: string): string {
  const m = raw.match(/^(.*?)(·\s*)([A-Z0-9_-]+)(:\s*)(.*)$/i)
  if (m) return `• **${m[3]}** — ${m[5]}`
  return `• ${raw}`
}

export function investigationCard(args: {
  lang: Lang
  title: string
  severity: string
  summary: string
  nextSteps: string[]
  actions: string[]
  skills: string[]
  knowledge: string[]
  incidentId?: string
  riskVerdict?: RiskVerdict
  /** First report in a case — remind user they can paste another alert into the same review. */
  showAddAlertHint?: boolean
}): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const suggested = suggestRiskVerdict(args.severity)
  const verdictLine = args.riskVerdict
    ? hans
      ? `${riskVerdictEmoji(args.riskVerdict)} **最终判定：** **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
      : zh
        ? `${riskVerdictEmoji(args.riskVerdict)} **最終判定：** **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
        : `${riskVerdictEmoji(args.riskVerdict)} **Final verdict:** **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
    : hans
      ? `⚖️ **最终判定（必选，计入复盘／周报）：** 尚未选定 — 建议参考严重度倾向 **${riskVerdictLabel(suggested, args.lang)}**`
      : zh
        ? `⚖️ **最終判定（必選，計入複盤／週報）：** 尚未選定 — 建議參考嚴重度傾向 **${riskVerdictLabel(suggested, args.lang)}**`
        : `⚖️ **Final verdict (required for board/weekly stats):** unset — severity soft-suggests **${riskVerdictLabel(suggested, args.lang)}**`
  const emoji = severityEmoji(args.severity)
  const skillLine = args.skills.length
    ? args.skills.join(', ')
    : hans
      ? '尚未匹配'
      : zh
        ? '尚未匹配'
        : 'none matched'
  // Path is rendered once on investigationPathOverviewCard — never again here.
  // Preferred Action removed — decisions live under 排查路径与决策.
  void args.knowledge
  void args.nextSteps
  void args.actions

  const sevLabel = hans
    ? `${emoji} **建议严重度：** **${args.severity}**（需当班确认）`
    : zh
      ? `${emoji} **建議嚴重度：** **${args.severity}**（需當班確認）`
      : `${emoji} **Severity proposal:** **${args.severity}** (on-duty confirm)`
  const refsFooter = hans
    ? [
        '📎 **参考（文末）**',
        `• **Skills：** ${skillLine}`,
        `• [打开 Skills 桌面页](${SKILLS_URL})`,
      ].join('\n')
    : zh
      ? [
          '📎 **參考（文末）**',
          `• **Skills：** ${skillLine}`,
          `• [打開 Skills 桌面頁](${SKILLS_URL})`,
        ].join('\n')
      : [
          '📎 **References (end)**',
          `• **Skills:** ${skillLine}`,
          `• [Open Skills desk](${SKILLS_URL})`,
        ].join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: args.severity === 'P0' ? 'red' : args.severity === 'P1' ? 'orange' : 'blue',
      title: { tag: 'plain_text', content: args.title },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `${sevLabel}\n\n${args.summary}`,
        },
      },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: refsFooter } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: verdictLine } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '判定：有风险' : zh ? '判定：有風險' : 'Verdict: At risk',
            },
            type: args.riskVerdict === 'at_risk' ? 'primary' : 'danger',
            value: {
              action: 'set_risk_verdict',
              verdict: 'at_risk',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '判定：无风险' : zh ? '判定：無風險' : 'Verdict: No risk',
            },
            type: args.riskVerdict === 'no_risk' ? 'primary' : 'default',
            value: {
              action: 'set_risk_verdict',
              verdict: 'no_risk',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '尚不明确' : zh ? '尚不明確' : 'Unclear',
            },
            type: args.riskVerdict === 'unclear' ? 'primary' : 'default',
            value: {
              action: 'set_risk_verdict',
              verdict: 'unclear',
              incidentId: args.incidentId || '',
            },
          },
        ],
      },
      ...(args.showAddAlertHint
        ? [
            { tag: 'hr' },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: hans
                  ? [
                      '💡 **提示：**',
                      '• 直接跟我说下一步／贴新告警／截图，我会继续协助排查（不必点「完成此步」）。',
                      '• 排查告一段落后点 **结束排查并生成报告** — 先出全文，你可再改，再归档。',
                      '• 归档前请完成 **最终判定（有／无风险）** — 会计入复盘与周报。',
                    ].join('\n')
                  : zh
                    ? [
                        '💡 **提示：**',
                        '• 直接跟我說下一步／貼新告警／截圖，我會繼續協助排查（不必點「完成此步」）。',
                        '• 排查告一段落後點 **結束排查並生成報告** — 先出全文，你可再改，再歸檔。',
                        '• 歸檔前請完成 **最終判定（有／無風險）** — 會計入複盤與週報。',
                      ].join('\n')
                    : [
                        '💡 **Tip:**',
                        '• Keep chatting / paste alerts — I’ll continue the investigation (no step-done button).',
                        '• When ready, tap **End & generate report** — full text first, you can edit, then archive.',
                        '• Set a **final risk verdict** before archive — counted on the board and weekly report.',
                      ].join('\n'),
              },
            },
          ]
        : []),
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? '⌨️ **操作** — 自由对话继续排查；结束后点下方按钮出报告全文'
            : zh
              ? '⌨️ **操作** — 自由對話繼續排查；結束後點下方按鈕出報告全文'
              : '⌨️ **Actions** — keep chatting to investigate; tap below when ready for the full report',
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans
                ? '结束排查并生成报告'
                : zh
                  ? '結束排查並生成報告'
                  : 'End & generate report',
            },
            type: 'primary',
            value: {
              action: 'end_and_report',
              incidentId: args.incidentId || '',
            },
          },
        ],
      },
    ],
  }
}

function formatGuidePathLines(steps: GuideStep[], lang: Lang): string {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  if (!steps.length) {
    return hans
      ? '_暂无 Skill.check 步骤 — 请补充告警原文。_'
      : zh
        ? '_暫無 Skill.check 步驟 — 請補充告警原文。_'
        : '_No Skill.check steps yet — paste the alert text._'
  }
  return steps
    .map((s, i) => {
      const mark =
        s.status === 'done'
          ? '✅'
          : s.status === 'skipped'
            ? '⏭'
            : '⬜'
      const opt = s.required
        ? hans
          ? '必做'
          : zh
            ? '必做'
            : 'required'
        : hans
          ? '可选'
          : zh
            ? '可選'
            : 'optional'
      const m = s.label.match(/^(\[[^\]]+\]|【[^】]+】)\s*(.*)$/)
      const body = m ? `**${m[1]}** ${m[2]}` : s.label
      return `${mark} ${i + 1}. ${body} _(${opt})_`
    })
    .join('\n')
}

/** Normalize Skill.action atom for display: 「若A：则B」→「A → B」. */
export function formatDecisionBranchLine(raw: string): string {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (!t) return t
  const m = t.match(/^(.+?)[：:]\s*(.+)$/)
  if (m) return `${m[1]!.trim()} → ${m[2]!.trim()}`
  return t
}

/**
 * One organic block: Skill.check path + Skill.action decisions together.
 */
export function formatPathWithDecisions(args: {
  lang: Lang
  steps: GuideStep[]
  decisionBranches?: string[]
}): string {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const pathMd = formatGuidePathLines(args.steps, args.lang)
  const doneCount = args.steps.filter((s) => s.status === 'done' || s.status === 'skipped').length
  const branches = (args.decisionBranches || []).map(formatDecisionBranchLine).filter(Boolean)
  const head = hans
    ? `🧭 **排查路径与决策**（${doneCount}/${args.steps.length}）`
    : zh
      ? `🧭 **排查路徑與決策**（${doneCount}/${args.steps.length}）`
      : `🧭 **Path & decisions** (${doneCount}/${args.steps.length})`
  if (!branches.length) {
    return `${head}\n\n${pathMd}`
  }
  const decHead = hans
    ? '↳ **决策（随本链路推进）**'
    : zh
      ? '↳ **決策（隨本鏈路推進）**'
      : '↳ **Decisions (with this path)**'
  const decLines = branches.map((b) => `• ${b}`).join('\n')
  return `${head}\n\n${pathMd}\n\n${decHead}\n${decLines}`
}

/**
 * Pre-analysis gate: stash alert(s), ask for more, start only on button.
 */
export function alertGatherCard(args: {
  lang: Lang
  alerts: string[]
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const n = args.alerts.length
  const title = hans
    ? '收到告警 — 是否还有其他？'
    : zh
      ? '收到告警 — 是否還有其他？'
      : 'Alert received — any more?'
  const list =
    args.alerts
      .map((a, i) => {
        const one = a.replace(/\s+/g, ' ').trim().slice(0, 160)
        return `${i + 1}. ${one}${a.trim().length > 160 ? '…' : ''}`
      })
      .join('\n') || (hans ? '（暂无）' : zh ? '（暫無）' : '(none)')
  const body = hans
    ? [
        `📥 **已收集 ${n} 条告警**（可继续粘贴更多，串联分析）`,
        '',
        list,
        '',
        '还有其他告警要一起看吗？没有的话点 **开始分析**。',
      ].join('\n')
    : zh
      ? [
          `📥 **已收集 ${n} 條告警**（可繼續貼上更多，串聯分析）`,
          '',
          list,
          '',
          '還有其他告警要一起看嗎？沒有的話點 **開始分析**。',
        ].join('\n')
      : [
          `📥 **Collected ${n} alert(s)** — paste more to analyze together.`,
          '',
          list,
          '',
          'Any more alerts? If not, tap **Start analysis**.',
        ].join('\n')
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'wathet',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '开始分析' : zh ? '開始分析' : 'Start analysis',
            },
            type: 'primary',
            value: { action: 'start_analysis' },
          },
        ],
      },
    ],
  }
}

/**
 * Message 1: full排查链路 overview (path listed once).
 * Followed by investigationStepGuideCard as a second message.
 */
export function investigationPathOverviewCard(args: {
  lang: Lang
  title: string
  severity: string
  summary: string
  steps: GuideStep[]
  actions: string[]
  /** Skill.action atoms — rendered with the path as one organic block. */
  decisionBranches?: string[]
  skills: string[]
  knowledge: string[]
  incidentId?: string
  riskVerdict?: RiskVerdict
  showAddAlertHint?: boolean
  /** 1-based index promised for the follow-up step card (defaults to 1). */
  nextStepNumber?: number
}): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const suggested = suggestRiskVerdict(args.severity)
  const verdictLine = args.riskVerdict
    ? hans
      ? `${riskVerdictEmoji(args.riskVerdict)} **最终判定：** **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
      : zh
        ? `${riskVerdictEmoji(args.riskVerdict)} **最終判定：** **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
        : `${riskVerdictEmoji(args.riskVerdict)} **Final verdict:** **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
    : hans
      ? `⚖️ **最终判定（必选，计入复盘／周报）：** 尚未选定 — 建议参考严重度倾向 **${riskVerdictLabel(suggested, args.lang)}**`
      : zh
        ? `⚖️ **最終判定（必選，計入複盤／週報）：** 尚未選定 — 建議參考嚴重度傾向 **${riskVerdictLabel(suggested, args.lang)}**`
        : `⚖️ **Final verdict (required for board/weekly stats):** unset — severity soft-suggests **${riskVerdictLabel(suggested, args.lang)}**`
  const emoji = severityEmoji(args.severity)
  const skillLine = args.skills.length
    ? args.skills.join(', ')
    : hans
      ? '尚未匹配'
      : zh
        ? '尚未匹配'
        : 'none matched'
  // No 知识库 titles in investigate body — desk link stays for navigation only via Skills.
  // Preferred Action removed — decisions live under 排查路径与决策.
  void args.knowledge
  void args.actions
  const sevLabel = hans
    ? `${emoji} **建议严重度：** **${args.severity}**（需当班确认）`
    : zh
      ? `${emoji} **建議嚴重度：** **${args.severity}**（需當班確認）`
      : `${emoji} **Severity proposal:** **${args.severity}** (on-duty confirm)`
  const pathLabel = formatPathWithDecisions({
    lang: args.lang,
    steps: args.steps,
    decisionBranches: args.decisionBranches,
  })
  const refsFooter = hans
    ? [
        '📎 **参考（文末）**',
        `• **Skills：** ${skillLine}`,
        `• [打开 Skills 桌面页](${SKILLS_URL})`,
      ].join('\n')
    : zh
      ? [
          '📎 **參考（文末）**',
          `• **Skills：** ${skillLine}`,
          `• [打開 Skills 桌面頁](${SKILLS_URL})`,
        ].join('\n')
      : [
          '📎 **References (end)**',
          `• **Skills:** ${skillLine}`,
          `• [Open Skills desk](${SKILLS_URL})`,
        ].join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: args.severity === 'P0' ? 'red' : args.severity === 'P1' ? 'orange' : 'blue',
      title: { tag: 'plain_text', content: args.title },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `${sevLabel}\n\n${args.summary}`,
        },
      },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: pathLabel } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: refsFooter } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: verdictLine } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '判定：有风险' : zh ? '判定：有風險' : 'Verdict: At risk',
            },
            type: args.riskVerdict === 'at_risk' ? 'primary' : 'danger',
            value: {
              action: 'set_risk_verdict',
              verdict: 'at_risk',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '判定：无风险' : zh ? '判定：無風險' : 'Verdict: No risk',
            },
            type: args.riskVerdict === 'no_risk' ? 'primary' : 'default',
            value: {
              action: 'set_risk_verdict',
              verdict: 'no_risk',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '尚不明确' : zh ? '尚不明確' : 'Unclear',
            },
            type: args.riskVerdict === 'unclear' ? 'primary' : 'default',
            value: {
              action: 'set_risk_verdict',
              verdict: 'unclear',
              incidentId: args.incidentId || '',
            },
          },
        ],
      },
      ...(args.showAddAlertHint
        ? [
            { tag: 'hr' },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: (() => {
                  const n = Math.max(1, Math.floor(args.nextStepNumber || 1))
                  return hans
                    ? `💡 **下一条消息**会给出第 ${n} 步。`
                    : zh
                      ? `💡 **下一則訊息**會給出第 ${n} 步。`
                      : `💡 **Next message** starts step ${n}.`
                })(),
              },
            },
          ]
        : []),
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans
                ? '结束排查并生成报告'
                : zh
                  ? '結束排查並生成報告'
                  : 'End & generate report',
            },
            type: 'primary',
            value: {
              action: 'end_and_report',
              incidentId: args.incidentId || '',
            },
          },
        ],
      },
    ],
  }
}

/** Message 2+: current step with 已完成 / 跳过 [/ 升级]. */
export function investigationStepGuideCard(args: {
  lang: Lang
  step: GuideStep
  stepIndex: number
  totalSteps: number
  incidentId?: string
  /** When set, show 升级 button targeting these roles (RC/BIT/…). */
  escalateRoles?: string[]
  /** Skill.action atoms — shown with this step as one path+decision unit. */
  decisionBranches?: string[]
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const n = args.stepIndex + 1
  const roles = (args.escalateRoles || []).filter(Boolean)
  const showEscalate = roles.length > 0
  const rolesLabel = roles.join('/')
  const optBadge = args.step.required
    ? hans
      ? '必做'
      : zh
        ? '必做'
        : 'Required'
    : hans
      ? '可选'
      : zh
        ? '可選'
        : 'Optional'
  const title = hans
    ? `排查步骤 ${n}/${args.totalSteps}`
    : zh
      ? `排查步驟 ${n}/${args.totalSteps}`
      : `Investigation step ${n}/${args.totalSteps}`
  const branches = (args.decisionBranches || []).map(formatDecisionBranchLine).filter(Boolean)
  const decBlock = branches.length
    ? [
        '',
        hans
          ? '↳ **本链路决策（随路径）**'
          : zh
            ? '↳ **本鏈路決策（隨路徑）**'
            : '↳ **Path decisions**',
        ...branches.map((b) => `• ${b}`),
      ]
    : []
  // Buttons only — no 已完成／跳过／升级 prose under the step line.
  const body = hans
    ? [
        `📍 **当前步骤（${optBadge}）**`,
        '',
        formatStepLine(args.step.label, args.stepIndex),
        ...decBlock,
      ].join('\n')
    : zh
      ? [
          `📍 **當前步驟（${optBadge}）**`,
          '',
          formatStepLine(args.step.label, args.stepIndex),
          ...decBlock,
        ].join('\n')
      : [
          `📍 **Current step (${optBadge})**`,
          '',
          formatStepLine(args.step.label, args.stepIndex),
          ...decBlock,
        ].join('\n')

  const actions: Record<string, unknown>[] = [
    {
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: hans ? '已完成' : zh ? '已完成' : 'Done',
      },
      type: 'primary',
      value: {
        action: 'guide_step_done',
        stepId: args.step.id,
        incidentId: args.incidentId || '',
      },
    },
    {
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: hans ? '跳过' : zh ? '跳過' : 'Skip',
      },
      type: 'default',
      value: {
        action: 'guide_step_skip',
        stepId: args.step.id,
        incidentId: args.incidentId || '',
      },
    },
  ]
  if (showEscalate) {
    actions.push({
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: hans ? '升级' : zh ? '升級' : 'Escalate',
      },
      type: 'danger',
      value: {
        action: 'guide_step_escalate',
        stepId: args.step.id,
        incidentId: args.incidentId || '',
        roles: rolesLabel,
      },
    })
  }

  return {
    config: { wide_screen_mode: true },
    header: {
      template: args.step.required ? 'orange' : 'turquoise',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions,
      },
    ],
  }
}

/** After Done: require evidence before advancing. */
export function investigationEvidencePromptCard(args: {
  lang: Lang
  step: GuideStep
  stepIndex: number
  totalSteps: number
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const title = hans
    ? '请补齐证据'
    : zh
      ? '請補齊證據'
      : 'Add evidence'
  const body = hans
    ? [
        `✅ 已标记第 **${args.stepIndex + 1}/${args.totalSteps}** 步完成。`,
        '',
        `步骤：${args.step.label}`,
        '',
        '请直接回复本步的 **证据**（截图说明／数值／核对结论）。收到后我会进入下一步。',
      ].join('\n')
    : zh
      ? [
          `✅ 已標記第 **${args.stepIndex + 1}/${args.totalSteps}** 步完成。`,
          '',
          `步驟：${args.step.label}`,
          '',
          '請直接回覆本步的 **證據**。收到後我會進入下一步。',
        ].join('\n')
      : [
          `✅ Marked step **${args.stepIndex + 1}/${args.totalSteps}** done.`,
          '',
          `Step: ${args.step.label}`,
          '',
          'Reply with **evidence** for this step (screenshot notes / numbers / findings). I’ll advance after that.',
        ].join('\n')
  return simpleCard(title, body, 'wathet')
}

/** Operator side after tapping 升级. */
export function investigationEscalatedWaitingCard(args: {
  lang: Lang
  step: GuideStep
  stepIndex: number
  totalSteps: number
  roles: string[]
  notifiedCount: number
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const rolesLabel = args.roles.join('/') || 'RC'
  const title = hans
    ? '已升级等待反馈'
    : zh
      ? '已升級等待反饋'
      : 'Escalated — awaiting feedback'
  const body = hans
    ? [
        `🚨 第 **${args.stepIndex + 1}/${args.totalSteps}** 步已升级给 **${rolesLabel}**（已通知 ${args.notifiedCount} 人）。`,
        '',
        `步骤：${args.step.label}`,
        '',
        '对方会收到本步说明与完整排查时间线／记录。',
        '',
        '⏳ **已升级等待反馈** — 收到对方结论后，请直接回复本对话；我会记入时间线并继续下一步。',
      ].join('\n')
    : zh
      ? [
          `🚨 第 **${args.stepIndex + 1}/${args.totalSteps}** 步已升級給 **${rolesLabel}**（已通知 ${args.notifiedCount} 人）。`,
          '',
          `步驟：${args.step.label}`,
          '',
          '對方會收到本步說明與完整排查時間線／記錄。',
          '',
          '⏳ **已升級等待反饋** — 收到對方結論後，請直接回覆本對話；我會記入時間線並繼續下一步。',
        ].join('\n')
      : [
          `🚨 Step **${args.stepIndex + 1}/${args.totalSteps}** escalated to **${rolesLabel}** (notified ${args.notifiedCount}).`,
          '',
          `Step: ${args.step.label}`,
          '',
          'They received this step plus the full investigation timeline.',
          '',
          '⏳ **Escalated — awaiting feedback.** Paste their reply here to log it and advance.',
        ].join('\n')
  return simpleCard(title, body, 'red')
}

/** Escalatee DM: current step + facts + full interaction timeline. */
export function investigationEscalateBriefingCard(args: {
  lang: Lang
  roles: string[]
  stepLabel: string
  stepIndex: number
  totalSteps: number
  incidentId?: string
  operatorName?: string
  factsMarkdown: string
  timelineMarkdown: string
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const rolesLabel = args.roles.join('/') || 'RC'
  const who = args.operatorName || (hans || zh ? '值班同学' : 'operator')
  const title = hans
    ? `排查升级 · ${rolesLabel}`
    : zh
      ? `排查升級 · ${rolesLabel}`
      : `Investigation escalate · ${rolesLabel}`
  const body = hans
    ? [
        `📬 **${who}** 在根因排查中升级给你（角色：**${rolesLabel}**）。`,
        '',
        `📍 **当前步骤 ${args.stepIndex + 1}/${args.totalSteps}**`,
        args.stepLabel,
        args.incidentId ? `\n事故 ID：\`${args.incidentId}\`` : '',
        '',
        '**已摄入事实／证据：**',
        args.factsMarkdown || '（暂无）',
        '',
        '**排查时间线／记录：**',
        args.timelineMarkdown || '（暂无）',
        '',
        '请直接回复本 Bot 你的结论／反馈；会回传给升级方并写入时间线。',
      ]
        .filter((l) => l !== '')
        .join('\n')
    : zh
      ? [
          `📬 **${who}** 在根因排查中升級給你（角色：**${rolesLabel}**）。`,
          '',
          `📍 **當前步驟 ${args.stepIndex + 1}/${args.totalSteps}**`,
          args.stepLabel,
          args.incidentId ? `\n事故 ID：\`${args.incidentId}\`` : '',
          '',
          '**已攝入事實／證據：**',
          args.factsMarkdown || '（暫無）',
          '',
          '**排查時間線／記錄：**',
          args.timelineMarkdown || '（暫無）',
          '',
          '請直接回覆本 Bot 你的結論／反饋；會回傳給升級方並寫入時間線。',
        ]
          .filter((l) => l !== '')
          .join('\n')
      : [
          `📬 **${who}** escalated this investigation to you (**${rolesLabel}**).`,
          '',
          `📍 **Current step ${args.stepIndex + 1}/${args.totalSteps}**`,
          args.stepLabel,
          args.incidentId ? `\nIncident: \`${args.incidentId}\`` : '',
          '',
          '**Facts / evidence:**',
          args.factsMarkdown || '(none)',
          '',
          '**Timeline / records:**',
          args.timelineMarkdown || '(none)',
          '',
          'Reply to this Bot with your feedback — it will be logged and sent back to the operator.',
        ]
          .filter((l) => l !== '')
          .join('\n')
  return simpleCard(title, body, 'orange')
}

/** After Skip on a required step: must reply. */
export function investigationRequiredSkipPromptCard(args: {
  lang: Lang
  step: GuideStep
  stepIndex: number
  totalSteps: number
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const title = hans
    ? '必做步需说明'
    : zh
      ? '必做步需說明'
      : 'Required step — reply needed'
  const body = hans
    ? [
        `⏭ 第 **${args.stepIndex + 1}/${args.totalSteps}** 步为 **必做**，不能直接跳过。`,
        '',
        `步骤：${args.step.label}`,
        '',
        '请回复跳过原因或替代核对结论；收到后才会进入下一步。',
      ].join('\n')
    : zh
      ? [
          `⏭ 第 **${args.stepIndex + 1}/${args.totalSteps}** 步為 **必做**，不能直接跳過。`,
          '',
          `步驟：${args.step.label}`,
          '',
          '請回覆跳過原因或替代核對結論；收到後才會進入下一步。',
        ].join('\n')
      : [
          `⏭ Step **${args.stepIndex + 1}/${args.totalSteps}** is **required** — cannot skip silently.`,
          '',
          `Step: ${args.step.label}`,
          '',
          'Reply with why you’re skipping or an alternate check result; then I’ll advance.',
        ].join('\n')
  return simpleCard(title, body, 'orange')
}

/** All guide steps finished. */
export function investigationGuideCompleteCard(args: {
  lang: Lang
  incidentId?: string
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const title = hans
    ? '排查链路已走完'
    : zh
      ? '排查鏈路已走完'
      : 'Investigation path complete'
  const body = hans
    ? '全部步骤已完成或跳过。可点 **结束排查并生成报告** 出全文，或继续贴补充证据。'
    : zh
      ? '全部步驟已完成或跳過。可點 **結束排查並生成報告** 出全文，或繼續貼補充證據。'
      : 'All steps done or skipped. Tap **End & generate report** for the full text, or keep pasting evidence.'
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'green',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans
                ? '结束排查并生成报告'
                : zh
                  ? '結束排查並生成報告'
                  : 'End & generate report',
            },
            type: 'primary',
            value: {
              action: 'end_and_report',
              incidentId: args.incidentId || '',
            },
          },
        ],
      },
    ],
  }
}

/** Full report draft after「结束排查并生成报告」— edit via chat or archive. */
export function investigationReportDraftCard(args: {
  lang: Lang
  title: string
  body: string
  incidentId?: string
  riskVerdict?: RiskVerdict
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const tip = hans
    ? [
        '📝 **排查报告草稿**',
        '• 直接发文字告诉我怎么改（例如「把结论改成无风险」「补上 LP 延迟」），我会更新全文。',
        '• 确认无误后点 **归档并完成复盘**。',
        args.riskVerdict
          ? `• 当前最终判定：${riskVerdictEmoji(args.riskVerdict)} **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
          : '• 归档前若未判定，会先请你选择有／无风险。',
      ].join('\n')
    : zh
      ? [
          '📝 **排查報告草稿**',
          '• 直接發文字告訴我怎麼改，我會更新全文。',
          '• 確認無誤後點 **歸檔並完成複盤**。',
          args.riskVerdict
            ? `• 當前最終判定：${riskVerdictEmoji(args.riskVerdict)} **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
            : '• 歸檔前若未判定，會先請你選擇有／無風險。',
        ].join('\n')
      : [
          '📝 **Investigation report draft**',
          '• Chat edits (e.g. “change conclusion to no risk”) — I’ll refresh the full text.',
          '• When ready, tap **Archive & finish review**.',
          args.riskVerdict
            ? `• Current verdict: ${riskVerdictEmoji(args.riskVerdict)} **${riskVerdictLabel(args.riskVerdict, args.lang)}**`
            : '• If verdict unset, you’ll be asked before archive.',
        ].join('\n')
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: {
        tag: 'plain_text',
        content: (hans ? '排查报告' : zh ? '排查報告' : 'Investigation report').slice(0, 50),
      },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: tip } },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${args.title}**\n\n${args.body}`.slice(0, 11000),
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '归档并完成复盘' : zh ? '歸檔並完成複盤' : 'Archive & finish review',
            },
            type: 'primary',
            value: {
              action: 'archive',
              incidentId: args.incidentId || '',
            },
          },
        ],
      },
    ],
  }
}

/** Shown when archiving without a final risk verdict. */
export function riskVerdictPromptCard(args: {
  lang: Lang
  incidentId: string
  title?: string
  thenArchive?: boolean
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const then = args.thenArchive ? 'archive' : ''
  const body = hans
    ? [
        '⚖️ **归档前请完成最终判定**',
        args.title ? `• **案件：** ${args.title}` : null,
        '该判定会计入 **复盘看板** 与 **周报** 的「有风险／无风险」统计。',
        '请选择一项：',
      ]
        .filter(Boolean)
        .join('\n')
    : zh
      ? [
          '⚖️ **歸檔前請完成最終判定**',
          args.title ? `• **案件：** ${args.title}` : null,
          '該判定會計入 **複盤看板** 與 **週報** 的「有風險／無風險」統計。',
          '請選擇一項：',
        ]
          .filter(Boolean)
          .join('\n')
      : [
          '⚖️ **Set a final risk verdict before archive**',
          args.title ? `• **Case:** ${args.title}` : null,
          'This is counted on the **review board** and **weekly report**.',
          'Pick one:',
        ]
          .filter(Boolean)
          .join('\n')
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'orange',
      title: {
        tag: 'plain_text',
        content: hans ? '最终判定' : zh ? '最終判定' : 'Final risk verdict',
      },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '有风险并归档' : zh ? '有風險並歸檔' : 'At risk → archive',
            },
            type: 'danger',
            value: {
              action: 'set_risk_verdict',
              verdict: 'at_risk',
              incidentId: args.incidentId,
              then,
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '无风险并归档' : zh ? '無風險並歸檔' : 'No risk → archive',
            },
            type: 'primary',
            value: {
              action: 'set_risk_verdict',
              verdict: 'no_risk',
              incidentId: args.incidentId,
              then,
            },
          },
        ],
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '尚不明确并归档' : zh ? '尚不明確並歸檔' : 'Unclear → archive',
            },
            type: 'default',
            value: {
              action: 'set_risk_verdict',
              verdict: 'unclear',
              incidentId: args.incidentId,
              then,
            },
          },
        ],
      },
    ],
  }
}

/** Unicode bar for in-card charts (Lark has no canvas). */
function bar(n: number, max: number, width = 10): string {
  const filled = max <= 0 ? 0 : Math.max(0, Math.round((n / max) * width))
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}`
}

function sgtDayKey(ts: number): string {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
}

function kpiColumn(label: string, value: string): Record<string, unknown> {
  return {
    tag: 'column',
    width: 'weighted',
    weight: 1,
    vertical_align: 'top',
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `${label}\n**${value}**`,
        },
      },
    ],
  }
}

export function reviewCard(args: {
  lang: Lang
  incidents: IncidentRecord[]
  /** Shown after archive — e.g. 已完成复盘 */
  doneBanner?: string
}): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const total = args.incidents.length
  const open = args.incidents.filter((i) => i.status === 'open').length
  const archived = args.incidents.filter((i) => i.status === 'archived').length
  const riskCounts = countRiskVerdicts(args.incidents)
  const riskMax = Math.max(
    1,
    riskCounts.at_risk,
    riskCounts.no_risk,
    riskCounts.unclear,
    riskCounts.unset,
  )
  const riskChart = hans
    ? [
        `🔴 有风险 ${bar(riskCounts.at_risk, riskMax)} **${riskCounts.at_risk}**`,
        `🟢 无风险 ${bar(riskCounts.no_risk, riskMax)} **${riskCounts.no_risk}**`,
        `🟡 尚不明确 ${bar(riskCounts.unclear, riskMax)} **${riskCounts.unclear}**`,
        `⚪ 未判定 ${bar(riskCounts.unset, riskMax)} **${riskCounts.unset}**`,
      ].join('\n')
    : zh
      ? [
          `🔴 有風險 ${bar(riskCounts.at_risk, riskMax)} **${riskCounts.at_risk}**`,
          `🟢 無風險 ${bar(riskCounts.no_risk, riskMax)} **${riskCounts.no_risk}**`,
          `🟡 尚不明確 ${bar(riskCounts.unclear, riskMax)} **${riskCounts.unclear}**`,
          `⚪ 未判定 ${bar(riskCounts.unset, riskMax)} **${riskCounts.unset}**`,
        ].join('\n')
      : [
          `🔴 At risk  ${bar(riskCounts.at_risk, riskMax)} **${riskCounts.at_risk}**`,
          `🟢 No risk  ${bar(riskCounts.no_risk, riskMax)} **${riskCounts.no_risk}**`,
          `🟡 Unclear  ${bar(riskCounts.unclear, riskMax)} **${riskCounts.unclear}**`,
          `⚪ Unset    ${bar(riskCounts.unset, riskMax)} **${riskCounts.unset}**`,
        ].join('\n')
  const riskTitle = hans
    ? '⚖️ **最终判定（有无风险）**'
    : zh
      ? '⚖️ **最終判定（有無風險）**'
      : '⚖️ **Final risk verdict**'

  const bySev: Record<string, number> = {}
  for (const inc of args.incidents) {
    const key = (inc.severity || '—').toUpperCase()
    bySev[key] = (bySev[key] || 0) + 1
  }
  // Always show P0–P3 rails so empty boards still look like a viz
  for (const sev of ['P0', 'P1', 'P2', 'P3']) {
    if (bySev[sev] == null) bySev[sev] = 0
  }
  const sevMax = Math.max(1, ...Object.values(bySev))
  const sevOrder = ['P0', 'P1', 'P2', 'P3', ...Object.keys(bySev).filter((k) => !/^P[0-3]$/.test(k))]
  const sevChart = sevOrder
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .map((sev) => {
      const n = bySev[sev] || 0
      return `${severityEmoji(sev)} ${sev.padEnd(4)} ${bar(n, sevMax)} **${n}**`
    })
    .join('\n')

  const statusMax = Math.max(1, open, archived)
  const statusChart = hans
    ? `🟢 进行中 ${bar(open, statusMax)} **${open}**\n📦 已归档 ${bar(archived, statusMax)} **${archived}**`
    : zh
      ? `🟢 進行中 ${bar(open, statusMax)} **${open}**\n📦 已歸檔 ${bar(archived, statusMax)} **${archived}**`
      : `🟢 Open     ${bar(open, statusMax)} **${open}**\n📦 Archived ${bar(archived, statusMax)} **${archived}**`

  // Last 7 SGT days activity sparkline
  const dayCounts: Record<string, number> = {}
  for (const inc of args.incidents) {
    const d = sgtDayKey(inc.updatedAt)
    dayCounts[d] = (dayCounts[d] || 0) + 1
  }
  const days: string[] = []
  const now = Date.now()
  for (let i = 6; i >= 0; i--) {
    days.push(sgtDayKey(now - i * 86_400_000))
  }
  const dayMax = Math.max(1, ...days.map((d) => dayCounts[d] || 0))
  const dayChart = days
    .map((d) => {
      const n = dayCounts[d] || 0
      const md = d.slice(5) // MM-DD
      return `${md} ${bar(n, dayMax, 8)} **${n}**`
    })
    .join('\n')

  const listTitle = hans
    ? '📋 **近期告警／报告**（点下方按钮查看完整内容）'
    : zh
      ? '📋 **近期告警／報告**（點下方按鈕查看完整內容）'
      : '📋 **Recent alerts & reports** (tap a button below for the full report)'

  const topIncidents = args.incidents.slice(0, 8)
  const lines =
    topIncidents.length === 0
      ? hans
        ? '_暂无记录 — 发送 **investigate** 并贴告警后，这里会累积可视化与列表。_'
        : zh
          ? '_暫無記錄 — 發送 **investigate** 並貼告警後，這裡會累積可視化與列表。_'
          : '_No records yet — type **investigate** and paste an alert; this board fills as you go._'
      : topIncidents
          .map((inc, i) => {
            const when = new Date(inc.updatedAt).toLocaleString('en-SG', {
              timeZone: 'Asia/Singapore',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            const se = severityEmoji(inc.severity)
            const statusIcon = inc.status === 'open' ? '🟢' : '📦'
            const statusLabel = hans
              ? inc.status === 'open'
                ? '进行中'
                : '已归档'
              : zh
                ? inc.status === 'open'
                  ? '進行中'
                  : '已歸檔'
                : inc.status
            const rv = `${riskVerdictEmoji(inc.riskVerdict)} ${riskVerdictLabel(inc.riskVerdict, args.lang)}`
            return `${i + 1}. ${se} **${inc.title}**\n• **${inc.severity}** · ${statusIcon} ${statusLabel} · ${rv} · 🕒 ${when} SGT\n• ${inc.summary.slice(0, 120)}`
          })
          .join('\n\n')

  const openButtons = topIncidents.map((inc, i) => {
    const label = truncateBtnLabel(
      hans || zh ? `${i + 1}. 查看完整` : `${i + 1}. Open full`,
      inc.title,
      40,
    )
    return {
      tag: 'button',
      text: { tag: 'plain_text', content: label },
      type: i === 0 ? 'primary' : 'default',
      value: { action: 'open_incident', incidentId: inc.id },
    }
  })
  // Feishu action rows: up to ~3 buttons per row for mobile readability.
  const openActionRows: Record<string, unknown>[] = []
  for (let i = 0; i < openButtons.length; i += 2) {
    openActionRows.push({
      tag: 'action',
      actions: openButtons.slice(i, i + 2),
    })
  }

  const intro = hans
    ? '🗂️ **Lark 侧告警／报告可视化**（下方为看板；桌面完整版链接见卡片底部）'
    : zh
      ? '🗂️ **Lark 側告警／報告可視化**（下方為看板；桌面完整版連結見卡片底部）'
      : '🗂️ **Lark alerts & reports visualization** (board below; full desk link at the bottom)'

  const sevTitle = hans ? '📉 **按严重度**' : zh ? '📉 **按嚴重度**' : '📉 **By severity**'
  const statusTitle = hans ? '📊 **按状态**' : zh ? '📊 **按狀態**' : '📊 **By status**'
  const dayTitle = hans
    ? '📅 **近 7 日活跃（SGT）**'
    : zh
      ? '📅 **近 7 日活躍（SGT）**'
      : '📅 **Last 7 days (SGT)**'

  const labelTotal = hans ? '合计' : zh ? '合計' : 'Total'
  const labelOpen = hans ? '进行中' : zh ? '進行中' : 'Open'
  const labelArchived = hans ? '已归档' : zh ? '已歸檔' : 'Archived'
  const labelAtRisk = hans ? '有风险' : zh ? '有風險' : 'At risk'
  const labelNoRisk = hans ? '无风险' : zh ? '無風險' : 'No risk'

  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'turquoise',
      title: {
        tag: 'plain_text',
        content: hans
          ? '告警／报告看板'
          : zh
            ? '告警／報告看板'
            : 'Alerts & reports dashboard',
      },
    },
    elements: [
      ...(args.doneBanner
        ? [
            {
              tag: 'div',
              text: { tag: 'lark_md', content: args.doneBanner },
            },
            { tag: 'hr' },
          ]
        : []),
      { tag: 'div', text: { tag: 'lark_md', content: intro } },
      {
        tag: 'column_set',
        flex_mode: 'none',
        background_style: 'grey',
        columns: [
          kpiColumn(labelTotal, String(total)),
          kpiColumn(labelOpen, String(open)),
          kpiColumn(labelArchived, String(archived)),
        ],
      },
      {
        tag: 'column_set',
        flex_mode: 'none',
        background_style: 'grey',
        columns: [
          kpiColumn(labelAtRisk, String(riskCounts.at_risk)),
          kpiColumn(labelNoRisk, String(riskCounts.no_risk)),
          kpiColumn(
            hans ? '未判定' : zh ? '未判定' : 'Unset',
            String(riskCounts.unclear + riskCounts.unset),
          ),
        ],
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `${statusTitle}\n${statusChart}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `${riskTitle}\n${riskChart}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `${sevTitle}\n${sevChart}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `${dayTitle}\n${dayChart}` },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `${listTitle}\n\n${lines}` },
      },
      ...openActionRows,
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? `[打开看板桌面页](${DASHBOARD_URL})`
            : zh
              ? `[打開看板桌面頁](${DASHBOARD_URL})`
              : `[Open dashboard desk](${DASHBOARD_URL})`,
        },
      },
    ],
  }
}

function truncateBtnLabel(prefix: string, title: string, max: number): string {
  const clean = (title || '').replace(/\s+/g, ' ').trim()
  const base = `${prefix} · ${clean}`
  if (base.length <= max) return base
  const room = Math.max(4, max - prefix.length - 3)
  return `${prefix} · ${clean.slice(0, room)}…`
}

/** Full incident report card opened from the review board. */
export function incidentDetailCard(args: {
  lang: Lang
  incident: IncidentRecord
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const inc = args.incident
  const se = severityEmoji(inc.severity)
  const when = new Date(inc.updatedAt).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const created = new Date(inc.createdAt).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const statusLabel = hans
    ? inc.status === 'open'
      ? '进行中'
      : '已归档'
    : zh
      ? inc.status === 'open'
        ? '進行中'
        : '已歸檔'
      : inc.status === 'open'
        ? 'open'
        : 'archived'
  const facts =
    (inc.facts || [])
      .filter((f) => f && !f.startsWith('[chat-history]'))
      .map((f, i) => `${i + 1}. ${f.replace(/\s+/g, ' ').trim().slice(0, 500)}`)
      .join('\n') || (hans || zh ? '（无）' : '(none)')
  const recs =
    (inc.recommendations || []).map((r) => `• ${r}`).join('\n') ||
    (hans || zh ? '• （无）' : '• (none)')
  const skills = (inc.skills || []).join(', ') || (hans || zh ? '尚未匹配' : 'none')
  const kb = (inc.knowledge || []).slice(0, 5).join(', ') || (hans || zh ? '无' : 'none')
  const interactions = Array.isArray(inc.interactions) ? inc.interactions : []
  const timeline =
    interactions.length === 0
      ? hans || zh
        ? '（尚无互动日志）'
        : '(no interaction log yet)'
      : interactions
          .slice(-40)
          .map((it, i) => {
            const who =
              it.role === 'user'
                ? hans || zh
                  ? '用户'
                  : 'User'
                : it.role === 'bot'
                  ? hans || zh
                    ? '助手'
                    : 'Bot'
                  : 'System'
            const at = new Date(it.at).toLocaleString('en-SG', {
              timeZone: 'Asia/Singapore',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            return `${i + 1}. [${at}] ${who}/${it.kind}: ${String(it.text || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 400)}`
          })
          .join('\n')

  const verdictBlock = `${riskVerdictEmoji(inc.riskVerdict)} **${hans ? '最终判定' : zh ? '最終判定' : 'Final verdict'}:** **${riskVerdictLabel(inc.riskVerdict, args.lang)}**`
  const body = hans
    ? [
        `${se} **严重度：** **${inc.severity}** · ${statusLabel}`,
        verdictBlock,
        `• **ID：** \`${inc.id}\``,
        `• **创建：** ${created} SGT`,
        `• **更新：** ${when} SGT`,
        '',
        '📋 **完整摘要**',
        inc.summary || '（无）',
        '',
        '📥 **摄入告警／证据**',
        facts,
        '',
        '⚡ **Preferred / 建议动作**',
        recs,
        '',
        `🧩 **Skills：** ${skills}`,
        `📚 **知识库：** ${kb}`,
        '',
        '🕒 **互动时间线**',
        timeline,
        '',
        `[打开看板桌面页](${DASHBOARD_URL})`,
      ].join('\n')
    : zh
      ? [
          `${se} **嚴重度：** **${inc.severity}** · ${statusLabel}`,
          verdictBlock,
          `• **ID：** \`${inc.id}\``,
          `• **建立：** ${created} SGT`,
          `• **更新：** ${when} SGT`,
          '',
          '📋 **完整摘要**',
          inc.summary || '（無）',
          '',
          '📥 **攝入告警／證據**',
          facts,
          '',
          '⚡ **Preferred / 建議動作**',
          recs,
          '',
          `🧩 **Skills：** ${skills}`,
          `📚 **知識庫：** ${kb}`,
          '',
          '🕒 **互動時間線**',
          timeline,
          '',
          `[打開看板桌面頁](${DASHBOARD_URL})`,
        ].join('\n')
      : [
          `${se} **Severity:** **${inc.severity}** · ${statusLabel}`,
          verdictBlock,
          `• **ID:** \`${inc.id}\``,
          `• **Created:** ${created} SGT`,
          `• **Updated:** ${when} SGT`,
          '',
          '📋 **Full summary**',
          inc.summary || '(none)',
          '',
          '📥 **Alerts / evidence**',
          facts,
          '',
          '⚡ **Preferred actions**',
          recs,
          '',
          `🧩 **Skills:** ${skills}`,
          `📚 **Knowledge:** ${kb}`,
          '',
          '🕒 **Interaction timeline**',
          timeline,
          '',
          `[Open dashboard desk](${DASHBOARD_URL})`,
        ].join('\n')

  const title = hans
    ? `报告详情 · ${inc.title}`.slice(0, 50)
    : zh
      ? `報告詳情 · ${inc.title}`.slice(0, 50)
      : `Report · ${inc.title}`.slice(0, 50)

  return {
    config: { wide_screen_mode: true },
    header: {
      template: inc.status === 'archived' ? 'grey' : inc.severity?.includes('P0') ? 'red' : 'blue',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? '⚖️ **改判／补判**（计入复盘与周报）'
            : zh
              ? '⚖️ **改判／補判**（計入複盤與週報）'
              : '⚖️ **Set / change verdict** (board + weekly stats)',
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '有风险' : zh ? '有風險' : 'At risk',
            },
            type: 'danger',
            value: { action: 'set_risk_verdict', verdict: 'at_risk', incidentId: inc.id },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '无风险' : zh ? '無風險' : 'No risk',
            },
            type: 'primary',
            value: { action: 'set_risk_verdict', verdict: 'no_risk', incidentId: inc.id },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '尚不明确' : zh ? '尚不明確' : 'Unclear',
            },
            type: 'default',
            value: { action: 'set_risk_verdict', verdict: 'unclear', incidentId: inc.id },
          },
        ],
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '返回看板' : zh ? '返回看板' : 'Back to board',
            },
            type: 'default',
            value: { action: 'review' },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '结束归档' : zh ? '結束歸檔' : 'Archive',
            },
            type: 'danger',
            value: { action: 'archive', incidentId: inc.id },
          },
        ],
      },
    ],
  }
}

/** Interactive card with lark_md so bold / bullets / spacing render in Lark. */
export function simpleCard(title: string, body: string, template = 'blue'): Record<string, unknown> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template,
      title: { tag: 'plain_text', content: title },
    },
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
  }
}

/** Clickable desk links (lark_md markdown links — note/plain_text is not tappable). */
function deskFooterNote(lang: Lang): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const text = hans
    ? `桌面完整页 · [Skills](${SKILLS_URL}) · [知识库](${KNOWLEDGE_URL}) · [看板](${DASHBOARD_URL}) · [行情](${MARKET_URL})`
    : zh
      ? `桌面完整頁 · [Skills](${SKILLS_URL}) · [知識庫](${KNOWLEDGE_URL}) · [看板](${DASHBOARD_URL}) · [行情](${MARKET_URL})`
      : `Full desk · [Skills](${SKILLS_URL}) · [Knowledge](${KNOWLEDGE_URL}) · [Board](${DASHBOARD_URL}) · [Market](${MARKET_URL})`
  return {
    tag: 'div',
    text: { tag: 'lark_md', content: text },
  }
}

export function greetingCard(lang: Lang, body: string): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '你好 · Risk Copilot'
    : zh
      ? '你好 · Risk Copilot'
      : 'Hello · Risk Copilot'
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'turquoise',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      deskFooterNote(lang),
    ],
  }
}

export function helpCard(lang: Lang, body: string): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans ? '使用说明' : zh ? '使用說明' : 'How to use'
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      deskFooterNote(lang),
    ],
  }
}

/** In-Lark Skills catalogue preview; desk URL only in footer. */
export function skillsCatalogCard(args: {
  lang: Lang
  skills: SkillRec[]
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const l1 = args.skills.filter((s) => s.level === 'L1' || /^L1-/i.test(s.id))
  const l2 = args.skills.filter((s) => s.level === 'L2' || /^L2-/i.test(s.id))
  const line = (s: SkillRec) =>
    `• **${s.id}** · ${s.name}${s.severity ? ` · ${s.severity}` : ''}`

  const intro = hans
    ? `🧩 **技能＝34 个排查场景**（Runbook V18）\n\n共 **${args.skills.length}** · L1 **${l1.length}**（独立风险事件）· L2 **${l2.length}**（关联排查链路）\n\n贴告警／关键词会 RAG 命中这些场景。**监控指标／可能出现的风险**清单在知识库（发 **知识库**），不与技能混淆。`
    : zh
      ? `🧩 **技能＝34 個排查場景**（Runbook V18）\n\n共 **${args.skills.length}** · L1 **${l1.length}**（獨立風險事件）· L2 **${l2.length}**（關聯排查鏈路）\n\n貼告警／關鍵詞會 RAG 命中這些場景。**監控指標／可能出現的風險**清單在知識庫（發 **知識庫**），不與技能混淆。`
      : `🧩 **Skills = 34 investigation scenarios** (Runbook V18)\n\n**${args.skills.length}** total · L1 **${l1.length}** (standalone) · L2 **${l2.length}** (chains)\n\nAlerts/keywords RAG-match these. The **monitoring / possible-risks** inventory lives in Knowledge (send **knowledge**) — not Skills.`

  const openHint = hans
    ? '💬 **打开节点：** 直接回复某个 **ID**（如 `L1-07` / `L2-A`）查看该场景详情。'
    : zh
      ? '💬 **打開節點：** 直接回覆某個 **ID**（如 `L1-07` / `L2-A`）查看該場景詳情。'
      : '💬 **Open a node:** reply with an **ID** (e.g. `L1-07` / `L2-A`) to open that scenario.'

  const body = [
    intro,
    '',
    hans || zh ? '**L1 排查场景（28）**' : '**L1 scenarios (28)**',
    ...l1.map(line),
    '',
    hans || zh ? '**L2 关联链路（6）**' : '**L2 chains (6)**',
    ...l2.map(line),
    '',
    openHint,
  ].join('\n')

  const title = hans
    ? 'Skills · 34 排查场景'
    : zh
      ? 'Skills · 34 排查場景'
      : 'Skills · 34 scenarios'
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'indigo',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? `[打开 Skills 桌面页](${SKILLS_URL})`
            : zh
              ? `[打開 Skills 桌面頁](${SKILLS_URL})`
              : `[Open Skills desk](${SKILLS_URL})`,
        },
      },
    ],
  }
}

/** In-Lark knowledge / RAG preview; desk URL only in footer. */
export function knowledgeCatalogCard(args: {
  lang: Lang
  knowledge: KbItem[]
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const ve = args.knowledge.filter((k) => /^ve-doc-/i.test(k.id) || /v\s*exchange|永续|永續/i.test(k.title))
  const pick = (ve.length ? ve : args.knowledge).slice(0, 12)
  const lines = pick
    .map((k) => {
      const excerpt = k.body.replace(/\s+/g, ' ').trim().slice(0, 140)
      return `• **${k.id}** · ${k.title}\n  ${excerpt}${k.body.length > 140 ? '…' : ''}`
    })
    .join('\n\n')

  const intro = hans
    ? `📚 **RAG 知识库（Lark 预览）**\n\n共 **${args.knowledge.length}** 篇（含「可能出现的风险」指标清单与 quote-ops 永续知识）。排查与问答会自动检索。`
    : zh
      ? `📚 **RAG 知識庫（Lark 預覽）**\n\n共 **${args.knowledge.length}** 篇（含「可能出現的風險」指標清單與 quote-ops 永續知識）。排查與問答會自動檢索。`
      : `📚 **RAG knowledge base (Lark preview)**\n\n**${args.knowledge.length}** articles (incl. possible-risks inventory + quote-ops perpetual KB).`

  const openHint = hans
    ? '💬 **打开节点：** 直接回复某个 **ID**（如 `ve-doc-alarms` / `kb_default_0`）查看全文。'
    : zh
      ? '💬 **打開節點：** 直接回覆某個 **ID**（如 `ve-doc-alarms` / `kb_default_0`）查看全文。'
      : '💬 **Open a node:** reply with an **ID** (e.g. `ve-doc-alarms` / `kb_default_0`) to open the full article.'

  const title = hans ? '知识库／RAG' : zh ? '知識庫／RAG' : 'Knowledge / RAG'
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'purple',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `${intro}\n\n${hans || zh ? '**节点**' : '**Nodes**'}\n\n${lines || '• —'}\n\n${openHint}`,
        },
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? `[打开知识库桌面页](${KNOWLEDGE_URL})`
            : zh
              ? `[打開知識庫桌面頁](${KNOWLEDGE_URL})`
              : `[Open Knowledge desk](${KNOWLEDGE_URL})`,
        },
      },
    ],
  }
}

/** Detail card when user replies with a Skills / KB node ID. */
export function nodeDetailCard(args: {
  lang: Lang
  kind: 'skill' | 'knowledge'
  id: string
  title: string
  body: string
}): Record<string, unknown> {
  const hans = args.lang === 'zh-Hans'
  const zh = isZh(args.lang)
  const header =
    args.kind === 'skill'
      ? `Skill · ${args.id}`
      : hans
        ? `知识节点 · ${args.id}`
        : zh
          ? `知識節點 · ${args.id}`
          : `Knowledge · ${args.id}`
  // Skills must keep every Check/Action/Opt step — use a high cap; never omit mid-step.
  const body = formatNodeBodyForLark(args.body, args.kind === 'skill' ? 12000 : 8000)
  const hint = hans
    ? '_回复其他 ID 继续打开节点；发 **skills** / **knowledge** 返回目录。_'
    : zh
      ? '_回覆其他 ID 繼續打開節點；發 **skills** / **knowledge** 返回目錄。_'
      : '_Reply with another ID to open a node; send **skills** / **knowledge** for the catalogue._'
  return {
    config: { wide_screen_mode: true },
    header: {
      template: args.kind === 'skill' ? 'indigo' : 'purple',
      title: { tag: 'plain_text', content: header },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${args.title}**\n\n${body}\n\n${hint}`,
        },
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content:
            args.kind === 'skill'
              ? hans
                ? `[打开 Skills 桌面页](${SKILLS_URL})`
                : zh
                  ? `[打開 Skills 桌面頁](${SKILLS_URL})`
                  : `[Open Skills desk](${SKILLS_URL})`
              : hans
                ? `[打开知识库桌面页](${KNOWLEDGE_URL})`
                : zh
                  ? `[打開知識庫桌面頁](${KNOWLEDGE_URL})`
                  : `[Open Knowledge desk](${KNOWLEDGE_URL})`,
        },
      },
    ],
  }
}
