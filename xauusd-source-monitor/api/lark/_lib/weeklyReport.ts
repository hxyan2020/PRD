/**
 * Weekly ops digest for Yan Haixiang — events handled + recommendations.
 * Window: last 7 days ending at `now`, labeled in Asia/Shanghai (东八区).
 */
import type { IncidentRecord, Lang } from './types.js'

export type WeeklyWindow = {
  sinceMs: number
  untilMs: number
  label: string
  weekKey: string
}

function shanghaiParts(ms: number): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date(ms))
  const get = (t: string) => parts.find((p) => p.type === t)?.value || ''
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

function shanghaiDayKey(ms: number): string {
  const { y, m, d } = shanghaiParts(ms)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** ISO-like week key in Asia/Shanghai (YYYY-Www) for dedupe. */
export function shanghaiWeekKey(ms = Date.now()): string {
  const { y, m, d, weekday } = shanghaiParts(ms)
  // Thursday-based ISO week approx in local calendar date
  const utc = Date.UTC(y, m - 1, d)
  const dayNum = weekday === 0 ? 7 : weekday
  const thursday = new Date(utc + (4 - dayNum) * 86_400_000)
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((thursday.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Rolling 7-day window ending at `now` (东八区 labels). */
export function weeklyWindow(now = Date.now()): WeeklyWindow {
  const untilMs = now
  const sinceMs = now - 7 * 86_400_000
  const label = `${shanghaiDayKey(sinceMs)} → ${shanghaiDayKey(untilMs)}（东八区）`
  return { sinceMs, untilMs, label, weekKey: shanghaiWeekKey(now) }
}

function severityBucket(sev: string): string {
  const s = (sev || '').toUpperCase()
  if (s.includes('P0')) return 'P0'
  if (s.includes('P1')) return 'P1'
  if (s.includes('P2')) return 'P2'
  if (s.includes('P3')) return 'P3'
  return '其他'
}

function dedupeLines(lines: string[], max = 12): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of lines) {
    const t = raw.replace(/\s+/g, ' ').trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

export type WeeklyReportPayload = {
  window: WeeklyWindow
  incidents: IncidentRecord[]
  open: number
  archived: number
  bySeverity: Record<string, number>
  topSkills: { id: string; count: number }[]
  recommendations: string[]
  markdown: string
  empty: boolean
}

/** Build zh-Hans weekly digest (primary audience: Yan Haixiang). */
export function buildWeeklyReport(
  incidents: IncidentRecord[],
  now = Date.now(),
  lang: Lang = 'zh-Hans',
): WeeklyReportPayload {
  const window = weeklyWindow(now)
  const weekIncidents = incidents
    .filter((r) => Math.max(r.createdAt, r.updatedAt) >= window.sinceMs)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const open = weekIncidents.filter((r) => r.status === 'open').length
  const archived = weekIncidents.filter((r) => r.status === 'archived').length
  const bySeverity: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, 其他: 0 }
  const skillCount = new Map<string, number>()
  const recs: string[] = []

  for (const inc of weekIncidents) {
    bySeverity[severityBucket(inc.severity)] = (bySeverity[severityBucket(inc.severity)] || 0) + 1
    for (const s of inc.skills || []) {
      skillCount.set(s, (skillCount.get(s) || 0) + 1)
    }
    for (const r of inc.recommendations || []) recs.push(r)
  }

  const topSkills = [...skillCount.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const recommendations = dedupeLines(recs, 12)

  const markdown = formatWeeklyMarkdown({
    lang,
    window,
    incidents: weekIncidents,
    open,
    archived,
    bySeverity,
    topSkills,
    recommendations,
  })

  return {
    window,
    incidents: weekIncidents,
    open,
    archived,
    bySeverity,
    topSkills,
    recommendations,
    markdown,
    empty: weekIncidents.length === 0,
  }
}

function formatWeeklyMarkdown(args: {
  lang: Lang
  window: WeeklyWindow
  incidents: IncidentRecord[]
  open: number
  archived: number
  bySeverity: Record<string, number>
  topSkills: { id: string; count: number }[]
  recommendations: string[]
}): string {
  const hans = args.lang === 'zh-Hans' || args.lang === 'zh-Hant'
  const total = args.incidents.length
  const sevLine = ['P0', 'P1', 'P2', 'P3', '其他']
    .filter((k) => (args.bySeverity[k] || 0) > 0)
    .map((k) => `**${k}** ${args.bySeverity[k]}`)
    .join(' · ')

  const skillLine = args.topSkills.length
    ? args.topSkills.map((s) => `**${s.id}**×${s.count}`).join(' · ')
    : hans
      ? '无'
      : 'none'

  const eventLines =
    total === 0
      ? [
          hans
            ? '_本周暂无已记录排查事件（serverless 临时存储；若本周确有会话，请以看板为准）。_'
            : '_No recorded investigations this week (ephemeral serverless store; check the desk board if sessions happened)._',
        ]
      : args.incidents.slice(0, 15).map((inc, i) => {
          const when = new Date(inc.updatedAt).toLocaleString(hans ? 'zh-CN' : 'en-SG', {
            timeZone: 'Asia/Shanghai',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          const status = hans
            ? inc.status === 'open'
              ? '进行中'
              : '已归档'
            : inc.status
          return [
            `${i + 1}. **${inc.title.slice(0, 64)}**`,
            `• **严重度：** **${inc.severity}** · **状态：** ${status} · 🕒 ${when} CST`,
            inc.skills?.length ? `• **Skills：** ${inc.skills.slice(0, 4).join(', ')}` : null,
            `• ${inc.summary.replace(/\s+/g, ' ').trim().slice(0, 160)}`,
          ]
            .filter(Boolean)
            .join('\n')
        })

  const recLines =
    args.recommendations.length === 0
      ? [hans ? '_暂无汇总建议 — 本周无 Preferred Action / 下一步记录。_' : '_No aggregated recommendations._']
      : args.recommendations.map((r) => `• ${r.slice(0, 220)}`)

  if (hans) {
    return [
      '📊 **V Exchange Risk Copilot · 周报**',
      '',
      `• **周期：** ${args.window.label}`,
      `• **收件人：** **@Yan Haixiang**`,
      '',
      '📈 **本周概览**',
      '',
      `• **处理事件：** **${total}**（进行中 **${args.open}** / 已归档 **${args.archived}**）`,
      `• **严重度分布：** ${sevLine || '无'}`,
      `• **高频 Skills：** ${skillLine}`,
      '',
      '📋 **本周事件**',
      '',
      ...eventLines,
      '',
      '💡 **建议汇总**',
      '',
      ...recLines,
      '',
      '🔗 **看板：** https://vex-llm-proxy.vercel.app/#/reports',
      '',
      '_自动推送：每周五 16:00（东八区）。也可发送 **weekly** / **周报** 立即查看。_',
    ].join('\n')
  }

  return [
    '📊 **V Exchange Risk Copilot · Weekly report**',
    '',
    `• **Window:** ${args.window.label}`,
    `• **To:** **@Yan Haixiang**`,
    '',
    '📈 **Overview**',
    '',
    `• **Events:** **${total}** (open **${args.open}** / archived **${args.archived}**)`,
    `• **Severity:** ${sevLine || 'none'}`,
    `• **Top skills:** ${skillLine}`,
    '',
    '📋 **Events this week**',
    '',
    ...eventLines,
    '',
    '💡 **Recommendations**',
    '',
    ...recLines,
    '',
    '🔗 **Board:** https://vex-llm-proxy.vercel.app/#/reports',
    '',
    '_Auto-push: Fridays 16:00 Asia/Shanghai. Or send **weekly** anytime._',
  ].join('\n')
}

export function weeklyReportCard(markdown: string, empty: boolean): Record<string, unknown> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: empty ? 'grey' : 'blue',
      title: { tag: 'plain_text', content: 'V Exchange · 每周周报' },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: markdown } },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '推送对象：Yan Haixiang · 时区：东八区 · 周期：近 7 日',
          },
        ],
      },
    ],
  }
}
