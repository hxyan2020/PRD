import { isZh } from './lang.js'
import type { IncidentRecord, Lang } from './types.js'

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
}): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const stepMd = args.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const actionMd =
    args.actions.map((a) => `• ${a}`).join('\n') ||
    (hans ? '• （暂无）' : zh ? '• （暫無）' : '• (none yet)')
  const skillLine = args.skills.length
    ? args.skills.join(', ')
    : hans
      ? '尚未匹配 Skill — 请补充证据'
      : zh
        ? '尚未匹配 Skill — 請補充證據'
        : 'No skill match yet — add evidence'
  const kbLine = args.knowledge.length
    ? args.knowledge.join(', ')
    : hans
      ? '无'
      : zh
        ? '無'
        : 'none'

  const sevLabel = hans
    ? `**建议严重度：** ${args.severity}（需当班确认）`
    : zh
      ? `**建議嚴重度：** ${args.severity}（需當班確認）`
      : `**Severity proposal:** ${args.severity} (on-duty confirm)`
  const nextLabel = hans
    ? `**建议下一步（已依你的证据调整）**\n${stepMd}`
    : zh
      ? `**建議下一步（已依你的證據調整）**\n${stepMd}`
      : `**Suggested next steps (adapted to your evidence)**\n${stepMd}`
  const prefLabel = hans
    ? `**Preferred Action（需审批）**\n${actionMd}`
    : zh
      ? `**Preferred Action（需審批）**\n${actionMd}`
      : `**Preferred Action (approval required)**\n${actionMd}`

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
      { tag: 'div', text: { tag: 'lark_md', content: nextLabel } },
      { tag: 'div', text: { tag: 'lark_md', content: prefLabel } },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `Skills: ${skillLine} · RAG: ${kbLine}`,
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
              content: hans ? '已完成此步' : zh ? '已完成此步' : 'Step done',
            },
            type: 'primary',
            value: {
              action: 'step_done',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '归档报告' : zh ? '歸檔報告' : 'Archive report',
            },
            type: 'default',
            value: {
              action: 'archive',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '复盘清单' : zh ? '複盤清單' : 'Review list',
            },
            type: 'default',
            value: { action: 'review' },
          },
        ],
      },
    ],
  }
}

export function reviewCard(args: { lang: Lang; incidents: IncidentRecord[] }): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const lines =
    args.incidents.length === 0
      ? hans
        ? '_尚无归档／进行中的事故。开始排查后会自动累积。_'
        : zh
          ? '_尚無歸檔／進行中的事故。開始排查後會自動累積。_'
          : '_No open/archived incidents yet. They accumulate as you investigate._'
      : args.incidents
          .slice(0, 15)
          .map((inc, i) => {
            const when = new Date(inc.updatedAt).toISOString().slice(0, 16).replace('T', ' ')
            return `${i + 1}. **${inc.title}** · ${inc.severity} · ${inc.status} · ${when} UTC\n${inc.summary.slice(0, 160)}`
          })
          .join('\n\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'turquoise',
      title: {
        tag: 'plain_text',
        content: hans ? '事故／报告复盘' : zh ? '事故／報告複盤' : 'Incident & report review',
      },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? '以下为近期累积的事故与报告，供定期回顾。点开细节可继续补充证据。'
            : zh
              ? '以下為近期累積的事故與報告，供定期回顧。點開細節可繼續補充證據。'
              : 'Recent accumulated incidents and reports for periodic review. Add evidence anytime to continue.',
        },
      },
      { tag: 'div', text: { tag: 'lark_md', content: lines } },
    ],
  }
}

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
