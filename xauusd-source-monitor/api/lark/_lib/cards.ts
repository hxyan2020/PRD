import { isZh } from './lang.js'
import type { IncidentRecord, Lang } from './types.js'

function severityEmoji(sev: string): string {
  const s = (sev || '').toUpperCase()
  if (s.includes('P0')) return '🔴'
  if (s.includes('P1')) return '🟠'
  if (s.includes('P2')) return '🔵'
  if (s.includes('P3')) return '⚪'
  return '📌'
}

/** Plain-text step line (no markdown). */
function formatStepLine(raw: string, index: number): string {
  const m = raw.match(/^(\[[^\]]+\]|【[^】]+】)\s*(.*)$/)
  if (m) return `${index + 1}. ${m[1]} ${m[2]}`
  return `${index + 1}. ${raw}`
}

function formatActionLine(raw: string): string {
  const m = raw.match(/^(.*?)(·\s*)([A-Z0-9_-]+)(:\s*)(.*)$/i)
  if (m) return `• ${m[3]} — ${m[5]}`
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
}): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const emoji = severityEmoji(args.severity)
  const stepMd = args.nextSteps.map((s, i) => formatStepLine(s, i)).join('\n')
  const actionMd =
    args.actions.map((a) => formatActionLine(a)).join('\n') ||
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
    ? `${emoji} 建议严重度：${args.severity}（需当班确认）`
    : zh
      ? `${emoji} 建議嚴重度：${args.severity}（需當班確認）`
      : `${emoji} Severity proposal: ${args.severity} (on-duty confirm)`
  const nextLabel = hans
    ? `✅ 建议下一步（已依你的证据调整）\n${stepMd}`
    : zh
      ? `✅ 建議下一步（已依你的證據調整）\n${stepMd}`
      : `✅ Suggested next steps (adapted to your evidence)\n${stepMd}`
  const prefLabel = hans
    ? `⚡ Preferred Action（需审批）\n${actionMd}`
    : zh
      ? `⚡ Preferred Action（需審批）\n${actionMd}`
      : `⚡ Preferred Action (approval required)\n${actionMd}`

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
          tag: 'plain_text',
          content: `${sevLabel}\n\n${args.summary}`,
        },
      },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'plain_text', content: nextLabel } },
      { tag: 'div', text: { tag: 'plain_text', content: prefLabel } },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `🧩 Skills: ${skillLine} · 📚 RAG: ${kbLine}`,
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

const DASHBOARD_URL = 'https://vex-llm-proxy.vercel.app/#/reports'

export function reviewCard(args: { lang: Lang; incidents: IncidentRecord[] }): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const open = args.incidents.filter((i) => i.status === 'open').length
  const archived = args.incidents.filter((i) => i.status === 'archived').length
  const bySev: Record<string, number> = {}
  for (const inc of args.incidents) {
    bySev[inc.severity || '—'] = (bySev[inc.severity || '—'] || 0) + 1
  }
  const sevLine = Object.entries(bySev)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k}×${n}`)
    .join(' · ')

  const lines =
    args.incidents.length === 0
      ? hans
        ? '尚无归档／进行中的事故。开始排查后会自动累积。'
        : zh
          ? '尚無歸檔／進行中的事故。開始排查後會自動累積。'
          : 'No open/archived incidents yet. They accumulate as you investigate.'
      : args.incidents
          .slice(0, 12)
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
            return `${i + 1}. ${se} ${inc.title}\n• Severity: ${inc.severity} · ${statusIcon} ${inc.status} · 🕒 ${when} SGT\n• ${inc.summary.slice(0, 140)}`
          })
          .join('\n\n')

  const kpi = hans
    ? `📊 看板摘要\n• 合计：${args.incidents.length}\n• 进行中：${open}\n• 已归档：${archived}${sevLine ? `\n• 严重度：${sevLine}` : ''}`
    : zh
      ? `📊 看板摘要\n• 合計：${args.incidents.length}\n• 進行中：${open}\n• 已歸檔：${archived}${sevLine ? `\n• 嚴重度：${sevLine}` : ''}`
      : `📊 Dashboard\n• Total: ${args.incidents.length}\n• Open: ${open}\n• Archived: ${archived}${sevLine ? `\n• Severity: ${sevLine}` : ''}`

  const intro = hans
    ? `🗂️ 以下为 Lark 侧近期累积的告警与报告。\n• 完整可视化看板（桌面 RCA + Lark）：${DASHBOARD_URL}`
    : zh
      ? `🗂️ 以下為 Lark 側近期累積的告警與報告。\n• 完整可視化看板（桌面 RCA + Lark）：${DASHBOARD_URL}`
      : `🗂️ Lark-side alerts & reports below.\n• Full visualization (desk RCA + Lark): ${DASHBOARD_URL}`

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
      { tag: 'div', text: { tag: 'plain_text', content: intro } },
      { tag: 'div', text: { tag: 'plain_text', content: kpi } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'plain_text', content: lines } },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: DASHBOARD_URL,
          },
        ],
      },
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
    elements: [{ tag: 'div', text: { tag: 'plain_text', content: body } }],
  }
}
