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
  const zh = args.lang === 'zh-Hant'
  const stepMd = args.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const actionMd = args.actions.map((a) => `• ${a}`).join('\n') || (zh ? '• （暫無）' : '• (none yet)')
  const skillLine = args.skills.length
    ? args.skills.join(', ')
    : zh
      ? '尚未匹配 Skill — 請補充證據'
      : 'No skill match yet — add evidence'
  const kbLine = args.knowledge.length ? args.knowledge.join(', ') : zh ? '無' : 'none'

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
          content: zh
            ? `**建議嚴重度：** ${args.severity}（需當班確認）\n\n${args.summary}`
            : `**Severity proposal:** ${args.severity} (on-duty confirm)\n\n${args.summary}`,
        },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: zh ? `**建議下一步（已依你的證據調整）**\n${stepMd}` : `**Suggested next steps (adapted to your evidence)**\n${stepMd}`,
        },
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: zh ? `**Preferred Action（需審批）**\n${actionMd}` : `**Preferred Action (approval required)**\n${actionMd}`,
        },
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: zh
              ? `Skills: ${skillLine} · RAG: ${kbLine}`
              : `Skills: ${skillLine} · RAG: ${kbLine}`,
          },
        ],
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: zh ? '已完成此步' : 'Step done' },
            type: 'primary',
            value: {
              action: 'step_done',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: zh ? '歸檔報告' : 'Archive report' },
            type: 'default',
            value: {
              action: 'archive',
              incidentId: args.incidentId || '',
            },
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: zh ? '複盤清單' : 'Review list' },
            type: 'default',
            value: { action: 'review' },
          },
        ],
      },
    ],
  }
}

export function reviewCard(args: { lang: Lang; incidents: IncidentRecord[] }): Record<string, unknown> {
  const zh = args.lang === 'zh-Hant'
  const lines =
    args.incidents.length === 0
      ? zh
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
        content: zh ? '事故／報告複盤' : 'Incident & report review',
      },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: zh
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
