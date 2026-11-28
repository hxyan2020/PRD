/**
 * Yan Haixiang private desk console — entitled commands + live status.
 * Gate with isLarkAdminUser; prefer p2p DM.
 */
import { listAcceptedWeeklyOpts } from './weeklyOptAccept.js'
import { buildCronHealthReport } from './cronHealth.js'
import { readCronBeatStore } from './cronHeartbeat.js'
import { readDurableJson } from './durableJson.js'
import { formatEast8, shanghaiDayKey } from './market.js'
import {
  listMemorySubmissions,
  type MemorySubmission,
} from './memorySubmit.js'
import { shanghaiHm } from './oscillationAlert.js'
import {
  loadTokenUsage,
  sumLast24h,
  type TokenUsageStore,
} from './tokenUsage.js'
import type { Lang } from './types.js'

const LOG_NAME = 'memory-submission-log.json'

export type MemoryLogStore = { entries: MemorySubmission[] }

export async function listMemorySubmissionLog(limit = 15): Promise<MemorySubmission[]> {
  const log = (await readDurableJson<MemoryLogStore>(LOG_NAME)) || { entries: [] }
  return [...(log.entries || [])].slice(0, Math.min(50, Math.max(1, limit)))
}

function ageLabel(at: number | undefined, now: number, hans: boolean): string {
  if (!at || at <= 0) return hans ? '无记录' : 'none'
  const mins = Math.max(0, Math.round((now - at) / 60_000))
  if (mins < 1) return hans ? '刚刚' : 'just now'
  if (mins < 60) return hans ? `${mins} 分钟前` : `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return hans ? `${hrs} 小时前` : `${hrs}h ago`
  return formatEast8(at)
}

function beatOk(at: number | undefined, now: number, maxAgeMs: number): boolean {
  return Boolean(at && now - at <= maxAgeMs)
}

async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      p,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

type SourceRow = {
  id: string
  label: string
  health: 'ok' | 'warn' | 'down' | 'idle'
  detail: string
  at?: number
}

async function collectMorningSources(now: number): Promise<{
  rows: SourceRow[]
  sentAt?: number
  dayKey: string
}> {
  const dayKey = shanghaiDayKey(now)
  const sentMap =
    (await readDurableJson<Record<string, number>>('market-daily-sent.json')) || {}
  const sentAt = sentMap[dayKey]
  const beats = (await readCronBeatStore()).beats || {}
  const dailyBeat = beats['/api/lark/daily-market-report']?.at

  const { dailyFixedSourcesLive, fetchMarketSnapshot } = await import('./market.js')
  const [fixed, snap] = await Promise.all([
    withTimeout(dailyFixedSourcesLive(), 8_000, []),
    withTimeout(fetchMarketSnapshot().catch(() => null), 10_000, null),
  ])

  const rows: SourceRow[] = []
  const kline = snap?.hourly?.kline as
    | { sourceId?: string; symbol?: string; bars?: unknown[] }
    | undefined
  const venue = kline?.sourceId?.startsWith('okx')
    ? 'OKX'
    : kline?.sourceId?.startsWith('bitget')
      ? 'Bitget'
      : kline?.sourceId?.startsWith('binance') || snap?.binance
        ? 'Binance'
        : snap?.okx
          ? 'OKX'
          : snap?.bitget
            ? 'Bitget'
            : '—'
  const lastPx =
    snap?.binance?.last ?? snap?.okx?.last ?? snap?.bitget?.last ?? undefined
  rows.push({
    id: 'kline',
    label: `K线 · ${venue}`,
    health: snap?.fetchedAt ? 'ok' : 'down',
    detail: snap?.fetchedAt
      ? `last=${lastPx ?? '—'} · ${formatEast8(snap.fetchedAt)}`
      : 'snapshot unavailable',
    at: snap?.fetchedAt,
  })
  rows.push({
    id: 'daily-cron',
    label: '早报 cron',
    health: sentAt
      ? 'ok'
      : beatOk(dailyBeat, now, 26 * 60_000)
        ? 'idle'
        : 'warn',
    detail: sentAt
      ? `今日已推 ${formatEast8(sentAt)}`
      : dailyBeat
        ? `心跳 ${ageLabel(dailyBeat, now, true)}`
        : '无今日推送／心跳',
    at: sentAt || dailyBeat,
  })
  for (const s of fixed.slice(0, 14)) {
    rows.push({
      id: s.id,
      label: s.captionZh || s.captionEn || s.id,
      health: s.health === 'ok' ? 'ok' : 'down',
      detail: s.detail || s.domain || '',
      at: s.checkedAt || now,
    })
  }
  return { rows, sentAt, dayKey }
}

async function collectOscSources(now: number): Promise<{
  rows: SourceRow[]
  lastAlertAt?: number
}> {
  const beats = (await readCronBeatStore()).beats || {}
  const beatAt = beats['/api/lark/oscillation-alert']?.at
  const state =
    (await readDurableJson<{
      lastAlertAt?: number
      lastAlertKey?: string
      demoSentDay?: string
      lastVenue?: string
    }>('oscillation-alert-state.json')) || {}

  const { evaluateOscillation, OSC_NEWS_FEEDS } = await import('./oscillationAlert.js')
  const snap = await withTimeout(
    evaluateOscillation({ demo: false }).catch(() => null),
    12_000,
    null,
  )

  const rows: SourceRow[] = []
  rows.push({
    id: 'osc-heartbeat',
    label: '震荡 cron 心跳',
    health: beatOk(beatAt, now, 22 * 60_000) ? 'ok' : 'down',
    detail: beatAt ? ageLabel(beatAt, now, true) : '无心跳',
    at: beatAt,
  })
  if (snap) {
    rows.push({
      id: 'osc-venue',
      label: snap.venueLabel || snap.venue || 'venue',
      health: 'ok',
      detail: `last=${snap.last} · ${formatEast8(snap.fetchedAt)}`,
      at: snap.fetchedAt,
    })
  } else {
    rows.push({
      id: 'osc-venue',
      label: '行情场馆',
      health: 'warn',
      detail: 'evaluate timeout／失败 — 见心跳',
      at: beatAt,
    })
  }
  const feedCount = Array.isArray(OSC_NEWS_FEEDS) ? OSC_NEWS_FEEDS.length : 0
  rows.push({
    id: 'osc-news',
    label: `新闻源 ×${feedCount}`,
    health: snap ? 'ok' : 'warn',
    detail: state.lastAlertKey
      ? `上次告警键 ${String(state.lastAlertKey).slice(0, 48)}`
      : '无近期 breaking 记录',
    at: state.lastAlertAt,
  })
  return { rows, lastAlertAt: state.lastAlertAt }
}

function mark(h: SourceRow['health']): string {
  if (h === 'ok') return '✅'
  if (h === 'warn') return '⚠️'
  if (h === 'idle') return '➖'
  return '❌'
}

function formatSourceBlock(title: string, rows: SourceRow[], hans: boolean): string {
  if (!rows.length) {
    return [title, hans ? '_暂无源状态_' : '_No source status_'].join('\n')
  }
  return [
    title,
    ...rows.map(
      (r) =>
        `• ${mark(r.health)} **${r.label}** — ${r.detail}${
          r.at ? ` · ${ageLabel(r.at, Date.now(), hans)}` : ''
        }`,
    ),
  ].join('\n')
}

function formatTokenBlock(store: TokenUsageStore, hans: boolean, now: number): string {
  const last24 = sumLast24h(store, now)
  const all = store.allTime
  return hans
    ? [
        '🧮 **Token 消耗**',
        `• **近 24h：** **${last24.total.toLocaleString()}**（prompt ${last24.prompt.toLocaleString()} / completion ${last24.completion.toLocaleString()} · ${last24.calls} 次）`,
        `• **累计：** **${all.total.toLocaleString()}**（${all.calls} 次）`,
        `• **账本更新：** ${ageLabel(store.updatedAt, now, true)}`,
        '• 命令：**Token用量** / `token usage`（完整卡片）',
      ].join('\n')
    : [
        '🧮 **Token usage**',
        `• **Last 24h:** **${last24.total.toLocaleString()}** (prompt ${last24.prompt.toLocaleString()} / completion ${last24.completion.toLocaleString()} · ${last24.calls} calls)`,
        `• **All-time:** **${all.total.toLocaleString()}** (${all.calls} calls)`,
        `• **Ledger:** ${ageLabel(store.updatedAt, now, false)}`,
        '• Cmd: **token usage**',
      ].join('\n')
}

function formatQueueBlock(
  open: MemorySubmission[],
  log: MemorySubmission[],
  hans: boolean,
  now: number,
): string {
  const openLines =
    open.length === 0
      ? [hans ? '_无待审批_' : '_No open submissions_']
      : open.slice(0, 8).map((s, i) => {
          const who = s.submitterName || s.submitterEmail || s.submitterOpenId.slice(0, 12)
          return `${i + 1}. **${s.kind}/${s.op}** \`${s.id}\` · ${who} · ${ageLabel(s.createdAt, now, hans)} · ${s.status}`
        })
  const logLines =
    log.length === 0
      ? [hans ? '_暂无审批日志_' : '_No approval log_']
      : log.slice(0, 6).map((s, i) => {
          const st = s.status === 'approved' ? '✅' : s.status === 'rejected' ? '❌' : '•'
          return `${i + 1}. ${st} **${s.kind}/${s.op}** \`${s.id}\` · ${s.status} · ${ageLabel(s.updatedAt || s.createdAt, now, hans)}`
        })
  return hans
    ? [
        '📥 **Skills／KB 审批**',
        `• **待审批：** **${open.length}**`,
        ...openLines,
        '',
        '• **最近日志：**',
        ...logLines,
        '• 命令：**待审批** / `submissions` · **审批日志** / `submission log`',
      ].join('\n')
    : [
        '📥 **Skills / KB approvals**',
        `• **Open:** **${open.length}**`,
        ...openLines,
        '',
        '• **Recent log:**',
        ...logLines,
        '• Cmds: **submissions** · **submission log**',
      ].join('\n')
}

function entitledCommandsMarkdown(hans: boolean): string {
  if (hans) {
    return [
      '🔐 **你有权使用的命令（私聊）**',
      '',
      '**专属**',
      '• **控制台** / `console` — 本页（数据源 · Cron · Token · 审批）',
      '• **Cron健康** / `cron health` — 半小时健康卡详情',
      '• **Token用量** / `token usage` — 消耗明细卡',
      '• **待审批** / `submissions` — Skills／KB 队列',
      '• **审批日志** / `submission log` — 已批／已拒记录',
      '• **清空复盘** / `clear review` — 清空历史案件（需确认）',
      '',
      '**值班常用**',
      '• **早报** / `daily` — 每日 24h 早报预览',
      '• **震荡行情** / `oscillation` — 振幅／费率／新闻状态',
      '• **周报** / `weekly` · **采纳日志** / `accepted opts`',
      '• **行情** · **排查** · **复盘** · **技能** · **知识库** · **帮助**',
    ].join('\n')
  }
  return [
    '🔐 **Commands you are entitled to (DM)**',
    '',
    '**Admin-only**',
    '• **console** — this desk (sources · cron · token · queue)',
    '• **cron health** — full health card',
    '• **token usage** — consumption card',
    '• **submissions** — Skills/KB queue',
    '• **submission log** — approve/reject history',
    '• **clear review** — wipe historic 复盘 (confirm)',
    '',
    '**Desk**',
    '• **daily** / morning report · **oscillation**',
    '• **weekly** · **accepted opts**',
    '• **market** · **investigate** · **review** · **skills** · **knowledge** · **help**',
  ].join('\n')
}

/** Full private console card for Yan Haixiang. */
export async function buildAdminConsoleCard(args: {
  lang: Lang
  openId?: string
}): Promise<Record<string, unknown>> {
  const lang = args.lang
  const hans = lang === 'zh-Hans' || lang === 'zh-Hant'
  const now = Date.now()

  const [cron, tokenStore, openSubs, logSubs, morning, osc, weekOpts] =
    await Promise.all([
      buildCronHealthReport({ now, adminOpenId: args.openId }),
      loadTokenUsage(),
      listMemorySubmissions({ status: 'open', limit: 20 }),
      listMemorySubmissionLog(10),
      collectMorningSources(now),
      collectOscSources(now),
      listAcceptedWeeklyOpts({ limit: 5 }),
    ])

  const cronMiss = cron.misses.map((m) => m.id)
  const cronLine = hans
    ? cron.allOk
      ? `✅ **Cron 健康：** 全部正常（槽 ${cron.slotKey}）`
      : `🚨 **Cron 健康：** 异常 — ${cronMiss.join(', ') || '见明细'}`
    : cron.allOk
      ? `✅ **Cron health:** all ok (slot ${cron.slotKey})`
      : `🚨 **Cron health:** misses — ${cronMiss.join(', ') || 'see detail'}`

  const cronDetail = cron.jobs
    .slice(0, 12)
    .map((j) => {
      const m = j.ok ? '✅' : j.expected ? '❌' : '➖'
      return `• ${m} **${j.label}** — ${j.detail}`
    })
    .join('\n')

  const body = [
    hans
      ? `🛠️ **V Exchange · Haixiang 私有控制台**`
      : `🛠️ **V Exchange · Haixiang private console**`,
    '',
    `⏱ **${formatEast8(now)}**（东八区 ${shanghaiHm(now)}）`,
    '',
    entitledCommandsMarkdown(hans),
    '',
    formatSourceBlock(
      hans ? '🌅 **早报数据源**' : '🌅 **Morning report sources**',
      morning.rows,
      hans,
    ),
    '',
    formatSourceBlock(
      hans ? '⚠️ **震荡行情数据源**' : '⚠️ **Oscillation sources**',
      osc.rows,
      hans,
    ),
    osc.lastAlertAt
      ? hans
        ? `• 上次震荡推送：${formatEast8(osc.lastAlertAt)}`
        : `• Last osc push: ${formatEast8(osc.lastAlertAt)}`
      : '',
    '',
    cronLine,
    cronDetail,
    '',
    formatTokenBlock(tokenStore, hans, now),
    '',
    formatQueueBlock(openSubs, logSubs, hans, now),
    '',
    hans
      ? `📒 **周报已采纳：** **${weekOpts.length}** 条最近记录（发 **采纳日志** 查看）`
      : `📒 **Weekly opts accepted:** **${weekOpts.length}** recent (send **accepted opts**)`,
    '',
    hans
      ? '_此卡仅你可见用途设计；群聊发「控制台」也会校验身份。_'
      : '_Designed for your DM; group use still checks admin identity._',
  ]
    .filter((l) => l !== '')
    .join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: cron.allOk ? 'turquoise' : 'orange',
      title: {
        tag: 'plain_text',
        content: hans ? 'Haixiang · 私有控制台' : 'Haixiang · private console',
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
              content: hans ? '🔄 刷新' : '🔄 Refresh',
            },
            type: 'primary',
            value: { action: 'admin_console_refresh', lang },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? 'Cron健康' : 'Cron health',
            },
            type: 'default',
            value: { action: 'admin_console_cron', lang },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? 'Token用量' : 'Token usage',
            },
            type: 'default',
            value: { action: 'admin_console_token', lang },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: hans ? '待审批' : 'Submissions',
            },
            type: 'default',
            value: { action: 'admin_console_queue', lang },
          },
        ],
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: hans
              ? 'Yan Haixiang only · 数据源探测有超时保护 · 不替代群推'
              : 'Yan Haixiang only · source probes time-capped · does not re-push groups',
          },
        ],
      },
    ],
  }
}

export async function buildSubmissionQueueCard(
  lang: Lang,
): Promise<Record<string, unknown>> {
  const hans = lang === 'zh-Hans' || lang === 'zh-Hant'
  const now = Date.now()
  const open = await listMemorySubmissions({ status: 'open', limit: 40 })
  const body = formatQueueBlock(open, await listMemorySubmissionLog(12), hans, now)
  return {
    config: { wide_screen_mode: true },
    header: {
      template: open.length ? 'orange' : 'green',
      title: {
        tag: 'plain_text',
        content: hans ? 'Skills／KB · 待审批' : 'Skills/KB · submissions',
      },
    },
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
  }
}

export async function buildSubmissionLogCard(
  lang: Lang,
): Promise<Record<string, unknown>> {
  const hans = lang === 'zh-Hans' || lang === 'zh-Hant'
  const now = Date.now()
  const log = await listMemorySubmissionLog(40)
  const lines =
    log.length === 0
      ? [hans ? '_暂无记录_' : '_Empty_']
      : log.map((s, i) => {
          const st =
            s.status === 'approved' ? '✅' : s.status === 'rejected' ? '❌' : '•'
          const who = s.submitterName || s.submitterOpenId.slice(0, 12)
          const reason = s.rejectReason ? ` · ${s.rejectReason.slice(0, 80)}` : ''
          return `${i + 1}. ${st} **${s.kind}/${s.op}** \`${s.id}\` · ${who} · ${s.status}${reason} · ${ageLabel(s.updatedAt || s.createdAt, now, hans)}`
        })
  const body = [
    hans ? '📒 **审批日志**' : '📒 **Submission log**',
    '',
    ...lines,
  ].join('\n')
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'wathet',
      title: {
        tag: 'plain_text',
        content: hans ? 'Skills／KB · 审批日志' : 'Skills/KB · approval log',
      },
    },
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
  }
}
