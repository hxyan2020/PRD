/**
 * Weekly ops digest for Yan Haixiang — events handled + recommendations.
 * Window: last 7 days ending at `now`, labeled in Asia/Shanghai (东八区).
 */
import { countRiskVerdicts, riskVerdictEmoji, riskVerdictLabel, type RiskVerdictCounts } from './riskVerdict.js'
import type { IncidentRecord, Lang, RiskVerdict } from './types.js'

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
  byRiskVerdict: RiskVerdictCounts
  topSkills: { id: string; count: number }[]
  recommendations: string[]
  markdown: string
  empty: boolean
}

/**
 * Synthetic week of incidents for DEMO cards (not persisted).
 * Covers Mark/Index, Funding, LP, and source-drop style desk scenarios.
 */
export function virtualWeeklyIncidents(now = Date.now()): IncidentRecord[] {
  const day = 86_400_000
  const mk = (
    i: number,
    args: {
      title: string
      severity: string
      skills: string[]
      summary: string
      recommendations: string[]
      status: 'open' | 'archived'
      daysAgo: number
      riskVerdict: RiskVerdict
    },
  ): IncidentRecord => {
    const t = now - args.daysAgo * day - i * 3_600_000
    return {
      id: `demo_wk_${i}`,
      chatId: 'demo_chat',
      openId: 'demo_user',
      title: args.title,
      facts: [args.summary],
      severity: args.severity,
      skills: args.skills,
      knowledge: [],
      summary: args.summary,
      recommendations: args.recommendations,
      riskVerdict: args.riskVerdict,
      riskVerdictAt: t + 40 * 60_000,
      riskVerdictBy: 'demo',
      status: args.status,
      createdAt: t,
      updatedAt: t + 45 * 60_000,
      lang: 'zh-Hans',
    }
  }

  return [
    mk(1, {
      title: 'Mark vs Index 偏离 48bps · IDX-01 被剔除',
      severity: 'P0',
      skills: ['L1-15', 'L1-13', 'L2-A'],
      summary:
        '指数源 IDX-01 超时后仅剩单一有效源；Mark 相对 Index 跳至 48bps，触发无有效源告警。',
      recommendations: [
        '核对剩余 Index 成分与权重，确认 IDX-01 剔除是否符合熔断规则',
        '与行情／风控确认是否临时下调整合阈值直至源恢复',
      ],
      status: 'archived',
      daysAgo: 1,
      riskVerdict: 'at_risk',
    }),
    mk(2, {
      title: '外部 Funding 偏差超阈 · XAU-USDT-SWAP',
      severity: 'P1',
      skills: ['L1-16', 'L1-17', 'L2-B'],
      summary:
        '平台 Funding 与 OKX／Bybit 同周期差值连续 3 档超阈；Average Premium Index 同步偏高。',
      recommendations: [
        '比对友商结算周期与基础费率参数',
        '确认是否需人工复核 Premium／Clamp 配置',
      ],
      status: 'archived',
      daysAgo: 2,
      riskVerdict: 'at_risk',
    }),
    mk(3, {
      title: 'LP 接仓失败重试堆积',
      severity: 'P1',
      skills: ['L1-24', 'L1-25', 'L2-E'],
      summary: '主 LP 通道超时，备用路由接仓成功率降至 72%；风控队列出现积压告警。',
      recommendations: [
        '切换／限流主 LP，观察备用通道延迟与拒单率',
        '核对 API key／IP 白名单与错误码分布',
      ],
      status: 'open',
      daysAgo: 3,
      riskVerdict: 'unclear',
    }),
    mk(4, {
      title: '现货源短时断流 · Kitco／金 API',
      severity: 'P2',
      skills: ['L1-08', 'L1-09'],
      summary: '现货锚点连续 2 分钟无心跳；永续 Index 仍由交易所源支撑，未触发强平异常。',
      recommendations: ['观察源恢复后健康分是否回升', '必要时临时降低现货锚点权重'],
      status: 'archived',
      daysAgo: 4,
      riskVerdict: 'no_risk',
    }),
    mk(5, {
      title: 'ADL 预警演练 · 模拟高杠杆拥挤',
      severity: 'P2',
      skills: ['L1-04', 'L1-05'],
      summary: '演练场景：名义敞口集中度升高，ADL 队列进入观察档（未实盘触发）。',
      recommendations: ['保留演练日志供周五复盘', '核对 ADL 阈值与通知模板'],
      status: 'archived',
      daysAgo: 5,
      riskVerdict: 'no_risk',
    }),
  ]
}

/** DEMO weekly digest: virtual incidents + orange 【DEMO】 framing. */
export function buildWeeklyDemoReport(
  now = Date.now(),
  lang: Lang = 'zh-Hans',
  adminOpenId?: string,
): WeeklyReportPayload {
  const report = buildWeeklyReport(virtualWeeklyIncidents(now), now, lang, adminOpenId)
  const intro = [
    '🧪 **【DEMO】每周复盘**（虚拟样例数据 · 非正式周报）',
    '',
    '以下为近 7 日值班／排查汇总**样式演练**；正式版每周五 16:00 推送给值班。',
    '',
  ].join('\n')
  const markdown = `${intro}${report.markdown}`
  return { ...report, markdown, empty: false }
}

/** Build zh-Hans weekly digest (primary audience: Yan Haixiang). */
export function buildWeeklyReport(
  incidents: IncidentRecord[],
  now = Date.now(),
  lang: Lang = 'zh-Hans',
  adminOpenId?: string,
): WeeklyReportPayload {
  const window = weeklyWindow(now)
  const weekIncidents = incidents
    .filter((r) => Math.max(r.createdAt, r.updatedAt) >= window.sinceMs)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const open = weekIncidents.filter((r) => r.status === 'open').length
  const archived = weekIncidents.filter((r) => r.status === 'archived').length
  const bySeverity: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, 其他: 0 }
  const byRiskVerdict = countRiskVerdicts(weekIncidents)
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
    byRiskVerdict,
    topSkills,
    recommendations,
    adminOpenId,
  })

  return {
    window,
    incidents: weekIncidents,
    open,
    archived,
    bySeverity,
    byRiskVerdict,
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
  byRiskVerdict: RiskVerdictCounts
  topSkills: { id: string; count: number }[]
  recommendations: string[]
  adminOpenId?: string
}): string {
  const hans = args.lang === 'zh-Hans' || args.lang === 'zh-Hant'
  const total = args.incidents.length
  const id = (args.adminOpenId || '').trim()
  const atAdmin =
    id && id.startsWith('ou_') ? `<at id="${id}"></at>` : '**@Yan Haixiang**'
  const sevLine = ['P0', 'P1', 'P2', 'P3', '其他']
    .filter((k) => (args.bySeverity[k] || 0) > 0)
    .map((k) => `**${k}** ${args.bySeverity[k]}`)
    .join(' · ')
  const rv = args.byRiskVerdict
  const riskLine = hans
    ? `🔴有风险 **${rv.at_risk}** · 🟢无风险 **${rv.no_risk}** · 🟡尚不明确 **${rv.unclear}** · ⚪未判定 **${rv.unset}**`
    : `🔴 at risk **${rv.at_risk}** · 🟢 no risk **${rv.no_risk}** · 🟡 unclear **${rv.unclear}** · ⚪ unset **${rv.unset}**`

  const skillLine = args.topSkills.length
    ? args.topSkills.map((s) => `**${s.id}**×${s.count}`).join(' · ')
    : hans
      ? '无'
      : 'none'

  const eventLines =
    total === 0
      ? [
          hans
            ? '_本周暂无已记录排查事件（若本周确有会话，请以看板为准）。_'
            : '_No recorded investigations this week (check the desk board if sessions happened)._',
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
          const verdict = `${riskVerdictEmoji(inc.riskVerdict)} ${riskVerdictLabel(inc.riskVerdict, args.lang)}`
          return [
            `${i + 1}. **${inc.title.slice(0, 64)}**`,
            hans
              ? `• **严重度：** **${inc.severity}** · **状态：** ${status} · **判定：** ${verdict} · 🕒 ${when} CST`
              : `• **Severity:** **${inc.severity}** · **Status:** ${status} · **Verdict:** ${verdict} · 🕒 ${when} CST`,
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
      `• **收件人：** ${atAdmin}`,
      '',
      '📈 **本周概览**',
      '',
      `• **处理事件：** **${total}**（进行中 **${args.open}** / 已归档 **${args.archived}**）`,
      `• **最终判定：** ${riskLine}`,
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
    `• **To:** ${atAdmin}`,
    '',
    '📈 **Overview**',
    '',
    `• **Events:** **${total}** (open **${args.open}** / archived **${args.archived}**)`,
    `• **Risk verdicts:** ${riskLine}`,
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
            content: '推送对象：风控群 + Yan Haixiang · 时区：东八区 · 周期：近 7 日',
          },
        ],
      },
    ],
  }
}

/** Severity distribution — Feishu chart (VChart bar). Client ≥ 7.1. */
export function weeklySeverityChartElement(
  bySeverity: Record<string, number>,
): Record<string, unknown> {
  const values = ['P0', 'P1', 'P2', 'P3', '其他']
    .map((sev) => ({ sev, value: bySeverity[sev] || 0 }))
    .filter((r) => r.value > 0)
  const data = values.length ? values : [{ sev: '无', value: 0 }]
  return {
    tag: 'chart',
    aspect_ratio: '16:9',
    color_theme: 'brand',
    preview: true,
    chart_spec: {
      type: 'bar',
      title: { text: '严重度分布（DEMO）' },
      data: { values: data },
      xField: 'sev',
      yField: 'value',
      label: { visible: true },
    },
  }
}

/** Events per Shanghai calendar day — Feishu chart (VChart line). */
export function weeklyEventsTrendChartElement(
  incidents: IncidentRecord[],
  window: WeeklyWindow,
): Record<string, unknown> {
  const counts = new Map<string, number>()
  // Fill every day in the 7-day window so the axis is continuous
  for (let t = window.sinceMs; t <= window.untilMs; t += 86_400_000) {
    counts.set(shanghaiDayKey(t).slice(5), 0) // MM-DD
  }
  for (const inc of incidents) {
    const key = shanghaiDayKey(Math.max(inc.createdAt, inc.updatedAt)).slice(5)
    if (!counts.has(key)) counts.set(key, 0)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const values = [...counts.entries()].map(([day, value]) => ({ day, value }))
  return {
    tag: 'chart',
    aspect_ratio: '16:9',
    color_theme: 'rainbow',
    preview: true,
    chart_spec: {
      type: 'line',
      title: { text: '近 7 日事件数（DEMO）' },
      data: { values },
      xField: 'day',
      yField: 'value',
      label: { visible: true },
      point: { visible: true },
    },
  }
}

/**
 * DEMO card with VChart severity bar + daily event line.
 * Falls back gracefully on Feishu < 7.1 (placeholder upgrade hint).
 */
export function weeklyDemoCard(report: WeeklyReportPayload): Record<string, unknown> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'orange',
      title: { tag: 'plain_text', content: '【DEMO】每周复盘' },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content:
            '🧪 **图表演练**（飞书卡片 VChart · 客户端 ≥ 7.1 可交互放大）\n• 严重度柱状图 · 近 7 日事件折线',
        },
      },
      weeklySeverityChartElement(report.bySeverity),
      weeklyEventsTrendChartElement(report.incidents, report.window),
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: report.markdown } },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: 'DEMO 虚拟数据 · 推送对象：Yan Haixiang · 东八区 · 非正式周五周报',
          },
        ],
      },
    ],
  }
}
