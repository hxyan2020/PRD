import { isZh } from './lang.js'
import { formatNodeBodyForLark } from './plain.js'
import type { IncidentRecord, KbItem, Lang, SkillRec } from './types.js'

const SKILLS_URL = 'https://vex-llm-proxy.vercel.app/#/skills'
const KNOWLEDGE_URL = 'https://vex-llm-proxy.vercel.app/#/knowledge'
const MARKET_URL = 'https://vex-llm-proxy.vercel.app/#/market'
const DASHBOARD_URL = 'https://vex-llm-proxy.vercel.app/#/reports'

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
      ? '尚未匹配'
      : zh
        ? '尚未匹配'
        : 'none matched'
  const kbLine = args.knowledge.length
    ? args.knowledge.slice(0, 3).join(', ')
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
    ? `🧭 **排查路径（下一步）**\n\n${stepMd}`
    : zh
      ? `🧭 **排查路徑（下一步）**\n\n${stepMd}`
      : `🧭 **Investigation path (next)**\n\n${stepMd}`
  const prefLabel = hans
    ? `⚡ **Preferred Action**（需审批）\n\n${actionMd}`
    : zh
      ? `⚡ **Preferred Action**（需審批）\n\n${actionMd}`
      : `⚡ **Preferred Action** (approval required)\n\n${actionMd}`
  const refsFooter = hans
    ? [
        '📎 **参考（文末）**',
        `• **Skills：** ${skillLine}`,
        `• **知识库：** ${kbLine}`,
        `• [打开 Skills 桌面页](${SKILLS_URL}) · [打开知识库桌面页](${KNOWLEDGE_URL})`,
      ].join('\n')
    : zh
      ? [
          '📎 **參考（文末）**',
          `• **Skills：** ${skillLine}`,
          `• **知識庫：** ${kbLine}`,
          `• [打開 Skills 桌面頁](${SKILLS_URL}) · [打開知識庫桌面頁](${KNOWLEDGE_URL})`,
        ].join('\n')
      : [
          '📎 **References (end)**',
          `• **Skills:** ${skillLine}`,
          `• **Knowledge:** ${kbLine}`,
          `• [Open Skills desk](${SKILLS_URL}) · [Open Knowledge desk](${KNOWLEDGE_URL})`,
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
      { tag: 'div', text: { tag: 'lark_md', content: nextLabel } },
      { tag: 'div', text: { tag: 'lark_md', content: prefLabel } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: refsFooter } },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: hans
            ? [
                '⌨️ **操作（文字指令，无需点卡片按钮）**',
                '• 发 **step done** / **已完成此步** — 标记本步完成并刷新路径',
                '• 发 **done** — 结束并归档',
                '• 发 **review** — 打开复盘清单',
              ].join('\n')
            : zh
              ? [
                  '⌨️ **操作（文字指令，無需點卡片按鈕）**',
                  '• 發 **step done** / **已完成此步** — 標記本步完成並刷新路徑',
                  '• 發 **done** — 結束並歸檔',
                  '• 發 **review** — 打開複盤清單',
                ].join('\n')
              : [
                  '⌨️ **Actions (text commands — no card-button callback required)**',
                  '• Send **step done** — mark this step complete and refresh the path',
                  '• Send **done** — close and archive',
                  '• Send **review** — open the review board',
                ].join('\n'),
        },
      },
      // Optional interactive buttons — only when Card Request URL is configured
      // (Lark shows “Card callback isn't configured” otherwise). Enable with LARK_ENABLE_CARD_BUTTONS=1.
      ...(process.env.LARK_ENABLE_CARD_BUTTONS === '1'
        ? [
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
          ]
        : []),
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
    ? `🧩 **Skills＝34 个排查场景**（Runbook V18）\n\n共 **${args.skills.length}** · L1 **${l1.length}**（独立风险事件）· L2 **${l2.length}**（关联排查链路）\n\n贴告警／关键词会 RAG 命中这些场景。**监控指标／可能出现的风险**清单在知识库（发 **knowledge**），不与 Skills 混淆。`
    : zh
      ? `🧩 **Skills＝34 個排查場景**（Runbook V18）\n\n共 **${args.skills.length}** · L1 **${l1.length}**（獨立風險事件）· L2 **${l2.length}**（關聯排查鏈路）\n\n貼告警／關鍵詞會 RAG 命中這些場景。**監控指標／可能出現的風險**清單在知識庫（發 **knowledge**），不與 Skills 混淆。`
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
  // Keep structure (headings / bullets / tables→bullets). Never flatten whitespace.
  const body = formatNodeBodyForLark(args.body, 3600)
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
