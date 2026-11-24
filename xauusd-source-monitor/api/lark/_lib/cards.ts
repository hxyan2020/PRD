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
    ? `${emoji} **建议严重度：** **${args.severity}**（需当班确认）`
    : zh
      ? `${emoji} **建議嚴重度：** **${args.severity}**（需當班確認）`
      : `${emoji} **Severity proposal:** **${args.severity}** (on-duty confirm)`
  const nextLabel = hans
    ? `✅ **建议下一步**（已依你的证据调整）\n\n${stepMd}`
    : zh
      ? `✅ **建議下一步**（已依你的證據調整）\n\n${stepMd}`
      : `✅ **Suggested next steps** (adapted to your evidence)\n\n${stepMd}`
  const prefLabel = hans
    ? `⚡ **Preferred Action**（需审批）\n\n${actionMd}`
    : zh
      ? `⚡ **Preferred Action**（需審批）\n\n${actionMd}`
      : `⚡ **Preferred Action** (approval required)\n\n${actionMd}`

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

export function reviewCard(args: { lang: Lang; incidents: IncidentRecord[] }): Record<string, unknown> {
  const zh = isZh(args.lang)
  const hans = args.lang === 'zh-Hans'
  const total = args.incidents.length
  const open = args.incidents.filter((i) => i.status === 'open').length
  const archived = args.incidents.filter((i) => i.status === 'archived').length

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
    ? '📋 **近期告警／报告**'
    : zh
      ? '📋 **近期告警／報告**'
      : '📋 **Recent alerts & reports**'

  const lines =
    args.incidents.length === 0
      ? hans
        ? '_暂无记录 — 发送 **investigate** 并贴告警后，这里会累积可视化与列表。_'
        : zh
          ? '_暫無記錄 — 發送 **investigate** 並貼告警後，這裡會累積可視化與列表。_'
          : '_No records yet — type **investigate** and paste an alert; this board fills as you go._'
      : args.incidents
          .slice(0, 8)
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
            return `${i + 1}. ${se} **${inc.title}**\n• **Severity:** **${inc.severity}** · ${statusIcon} **${inc.status}** · 🕒 ${when} SGT\n• ${inc.summary.slice(0, 140)}`
          })
          .join('\n\n')

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
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `${statusTitle}\n${statusChart}` },
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

export function greetingCard(lang: Lang, body: string): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '你好 · Risk Copilot'
    : zh
      ? '你好 · Risk Copilot'
      : 'Hello · Risk Copilot'
  return simpleCard(title, body, 'turquoise')
}

export function helpCard(lang: Lang, body: string): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans ? '使用说明' : zh ? '使用說明' : 'How to use'
  return simpleCard(title, body, 'blue')
}
