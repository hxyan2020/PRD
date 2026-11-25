/**
 * Half-hourly cron / bot health snapshot for Yan Haixiang.
 * Flags jobs that should have fired but have no proof of delivery.
 */
import { ALERT_NUDGE_DAY, ALERT_NUDGE_START_HM, loadNudgeState } from './alertNudge.js'
import { atOpenIdMarkdown } from './client.js'
import { simpleCard } from './cards.js'
import { readCronBeatStore, type CronBeatStore } from './cronHeartbeat.js'
import { readDurableJson } from './durableJson.js'
import { shanghaiDayKey, shanghaiHalfHourKey, formatEast8 } from './market.js'
import {
  OSC_DEMO_DAY,
  OSC_DEMO_START_HM,
  isOscDemoSlot,
  shanghaiHm,
} from './oscillationAlert.js'
import { shanghaiWeekKey } from './weeklyReport.js'
import { DAILY_MARKET_START_HM, isDailyMarketSlot } from '../daily-market-report.js'
import { WEEKLY_DEMO_DAY, WEEKLY_DEMO_START_HM, isWeeklyDemoSlot } from '../weekly-demo.js'

export type CronJobHealth = {
  id: string
  label: string
  schedule: string
  expected: boolean
  ok: boolean
  detail: string
  lastAt?: number
  lastHm?: string
}

export type CronHealthReport = {
  at: number
  day: string
  hm: string
  slotKey: string
  botOk: boolean
  allOk: boolean
  jobs: CronJobHealth[]
  misses: CronJobHealth[]
  markdown: string
  card: Record<string, unknown>
}

const GRACE_MS = 3 * 60_000

function isShanghaiFriday(ts: number): boolean {
  try {
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      weekday: 'short',
    }).format(new Date(ts))
    return wd === 'Fri'
  } catch {
    return new Date(ts).getUTCDay() === 5
  }
}

function ageMin(at: number | undefined, now: number): string {
  if (!at) return '从未'
  const m = Math.max(0, Math.round((now - at) / 60_000))
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  return `${Math.round(m / 60)} 小时前`
}

function slotStartMs(slotKey: string): number {
  // slotKey e.g. 2026-11-25T13:30 Asia/Shanghai → UTC-8
  const m = slotKey.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!m) return 0
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const h = Number(m[4])
  const mi = Number(m[5])
  return Date.UTC(y, mo - 1, d, h, mi, 0, 0) - 8 * 3600_000
}

async function readSentMap(name: string): Promise<Record<string, number>> {
  return (await readDurableJson<Record<string, number>>(name)) || {}
}

export async function buildCronHealthReport(args?: {
  now?: number
  adminOpenId?: string
}): Promise<CronHealthReport> {
  const now = args?.now ?? Date.now()
  const day = shanghaiDayKey(now)
  const hm = shanghaiHm(now)
  const slotKey = shanghaiHalfHourKey(now)
  const store = await readCronBeatStore()
  const beats = store.beats || {}

  const halfSent = await readSentMap('market-halfhour-sent.json')
  const dailySent = await readSentMap('market-daily-sent.json')
  const weeklySent = await readSentMap('weekly-sent.json')
  const weeklyDemo = (await readDurableJson<{ day?: string; at?: number }>('weekly-demo-sent.json')) || {}
  const oscState =
    (await readDurableJson<{
      lastAlertAt?: number
      demoSentDay?: string
      lastAlertKey?: string
    }>('oscillation-alert-state.json')) || {}
  const nudge = await loadNudgeState()

  const jobs: CronJobHealth[] = []

  // —— cron-tick (every 5m) ——
  {
    const b = beats['/api/lark/cron-tick']
    const maxAge = 10 * 60_000
    // Also accept any recent fan-out child beat (proves relay ran even if tick pointer raced).
    const childFresh = Object.entries(beats).some(
      ([p, meta]) => p !== '/api/lark/cron-tick' && meta?.at && now - meta.at <= maxAge,
    )
    const ok = Boolean((b?.at && now - b.at <= maxAge) || childFresh)
    jobs.push({
      id: 'cron-tick',
      label: 'cron-tick 兜底',
      schedule: '每 5 分钟',
      expected: true,
      ok,
      detail: ok
        ? b?.at && now - b.at <= maxAge
          ? `心跳正常（${ageMin(b?.at, now)}）`
          : `扇出子任务心跳正常（tick 指针 ${ageMin(b?.at, now)}）`
        : `心跳过期／缺失（上次 ${ageMin(b?.at, now)}）— 公网扇出可能中断`,
      lastAt: b?.at,
      lastHm: b?.hm,
    })
  }

  // —— half-hour market ——
  {
    const slotStart = slotStartMs(slotKey)
    const due = now >= slotStart + GRACE_MS
    const sentAt = halfSent[slotKey]
    const ok = !due || Boolean(sentAt)
    jobs.push({
      id: 'market-report',
      label: '半小时行情',
      schedule: '每 30 分钟 → Yan DM',
      expected: due,
      ok,
      detail: sentAt
        ? `本槽 ${slotKey} 已推送（${formatEast8(sentAt)}）`
        : due
          ? `本槽 ${slotKey} 未推送（应在整点／半点后推送）`
          : `本槽 ${slotKey} 宽限中（开槽后 3 分钟内）`,
      lastAt: sentAt,
    })
  }

  // —— daily morning ——
  {
    const expected = isDailyMarketSlot(now) && hm >= addHmGrace(DAILY_MARKET_START_HM, 5)
    const sentAt = dailySent[day]
    const ok = !expected || Boolean(sentAt)
    jobs.push({
      id: 'daily-market-report',
      label: '每日早报',
      schedule: `每天 ${DAILY_MARKET_START_HM} CST → 群`,
      expected,
      ok,
      detail: sentAt
        ? `今日 ${day} 已推送（${formatEast8(sentAt)}）`
        : expected
          ? `今日 ${day} 早报未推送（应 ≥${DAILY_MARKET_START_HM}）`
          : hm < DAILY_MARKET_START_HM
            ? `未到 ${DAILY_MARKET_START_HM} 窗口`
            : `窗口内宽限中`,
      lastAt: sentAt,
    })
  }

  // —— weekly report (Fri 16:00) ——
  {
    const weekKey = shanghaiWeekKey(now)
    const expected =
      isShanghaiFriday(now) && hm >= addHmGrace('16:00', 5)
    const sentAt = weeklySent[weekKey]
    const ok = !expected || Boolean(sentAt)
    jobs.push({
      id: 'weekly-report',
      label: '正式周报',
      schedule: '每周五 16:00 CST → Yan DM',
      expected,
      ok,
      detail: sentAt
        ? `${weekKey} 已推送（${formatEast8(sentAt)}）`
        : expected
          ? `${weekKey} 周五周报未推送`
          : isShanghaiFriday(now)
            ? `周五未到 16:00`
            : `非周五（${weekKey}）`,
      lastAt: sentAt,
    })
  }

  // —— weekly demo ——
  {
    const expected =
      day === WEEKLY_DEMO_DAY &&
      hm >= addHmGrace(WEEKLY_DEMO_START_HM, 5) &&
      hm < '18:00'
    const sent = weeklyDemo.day === WEEKLY_DEMO_DAY
    const ok = !expected || sent
    jobs.push({
      id: 'weekly-demo',
      label: '周报 DEMO',
      schedule: `${WEEKLY_DEMO_DAY} ${WEEKLY_DEMO_START_HM} CST`,
      expected,
      ok,
      detail: sent
        ? `DEMO 日已推送`
        : expected
          ? `DEMO 槽未推送（${WEEKLY_DEMO_START_HM}–18:00）`
          : day === WEEKLY_DEMO_DAY
            ? isWeeklyDemoSlot(now)
              ? `DEMO 宽限中`
              : `未到 DEMO 槽`
            : `非 DEMO 日`,
      lastAt: weeklyDemo.at,
    })
  }

  // —— oscillation ——
  {
    const b = beats['/api/lark/oscillation-alert']
    const maxAge = 20 * 60_000
    const heartOk = Boolean(b?.at && now - b.at <= maxAge)
    const demoExpected =
      day === OSC_DEMO_DAY &&
      hm >= addHmGrace(OSC_DEMO_START_HM, 5) &&
      hm < '18:00'
    const demoOk = !demoExpected || oscState.demoSentDay === OSC_DEMO_DAY
    const ok = heartOk && demoOk
    jobs.push({
      id: 'oscillation-alert',
      label: '震荡预警',
      schedule: '每 15 分钟（有触发才推）',
      expected: true,
      ok,
      detail: [
        heartOk ? `心跳正常（${ageMin(b?.at, now)}）` : `心跳过期（上次 ${ageMin(b?.at, now)}）`,
        demoExpected
          ? oscState.demoSentDay === OSC_DEMO_DAY
            ? '今日 DEMO 已发'
            : '今日 DEMO 槽未发'
          : day === OSC_DEMO_DAY && isOscDemoSlot(now)
            ? 'DEMO 宽限中'
            : '',
      ]
        .filter(Boolean)
        .join('；'),
      lastAt: b?.at ?? oscState.lastAlertAt,
      lastHm: b?.hm,
    })
  }

  // —— alert nudge ——
  {
    const campaign =
      day === ALERT_NUDGE_DAY &&
      hm >= ALERT_NUDGE_START_HM &&
      hm < '18:00'
    const acked = Boolean(nudge?.acked)
    const b = beats['/api/lark/alert-nudge']
    const last = nudge?.lastCronAt || nudge?.lastSentAt || b?.at
    const activeLoop = campaign && !acked && Boolean(nudge?.active)
    const loopOk = !activeLoop || Boolean(last && now - last <= 3 * 60_000)
    const ok = !campaign || acked || loopOk
    jobs.push({
      id: 'alert-nudge',
      label: '告警提醒 DEMO',
      schedule: `${ALERT_NUDGE_DAY} ${ALERT_NUDGE_START_HM} 起每分钟`,
      expected: campaign && !acked,
      ok,
      detail: acked
        ? `已 ack（推送 ${nudge?.sendCount ?? 0} 次）`
        : !campaign
          ? day === ALERT_NUDGE_DAY
            ? hm < ALERT_NUDGE_START_HM
              ? `未到 ${ALERT_NUDGE_START_HM}`
              : `已过窗口`
            : `非活动日`
          : loopOk
            ? `循环中 · 最近 ${ageMin(last, now)}`
            : `循环中断 · 最近 ${ageMin(last, now)}`,
      lastAt: last,
    })
  }

  // —— bot / lark config ——
  {
    const hasApp = Boolean(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET)
    jobs.push({
      id: 'bot',
      label: 'Bot / Lark 凭证',
      schedule: '常驻',
      expected: true,
      ok: hasApp,
      detail: hasApp ? 'LARK_APP_ID／SECRET 已配置' : '缺少 LARK_APP_ID／LARK_APP_SECRET',
    })
  }

  const misses = jobs.filter((j) => j.expected && !j.ok)
  const botOk = jobs.find((j) => j.id === 'bot')?.ok !== false
  const allOk = misses.length === 0 && botOk

  const atLine = args?.adminOpenId ? `${atOpenIdMarkdown(args.adminOpenId)} ` : ''
  const lines: string[] = []
  if (allOk) {
    lines.push(
      `✅ **Cron 健康 · 全部正常**`,
      '',
      `⏱ **检查时间：** **${formatEast8(now)}**（东八区）· 槽 **${slotKey}**`,
      `• Bot 在线；各定时任务按计划运行／已幂等跳过。`,
      '',
    )
  } else {
    lines.push(
      `🚨 **Cron 健康告警 · 有任务未按计划推送**`,
      '',
      `${atLine}请值班处理。`,
      '',
      `⏱ **检查时间：** **${formatEast8(now)}**（东八区）· 槽 **${slotKey}**`,
      '',
      '**未按计划：**',
      ...misses.map((m) => `• ❌ **${m.label}** — ${m.detail}`),
      '',
    )
  }
  lines.push('**明细：**')
  for (const j of jobs) {
    const mark = j.ok ? '✅' : j.expected ? '❌' : '➖'
    lines.push(`• ${mark} **${j.label}**（${j.schedule}）— ${j.detail}`)
  }
  lines.push('', '• 来源：`cron-tick` 心跳 + 各任务 sent-state（幂等记账）')

  const markdown = lines.join('\n')
  const card = simpleCard(
    allOk ? 'Cron 健康 · 全部正常' : 'Cron 健康告警',
    markdown,
    allOk ? 'green' : 'red',
  )

  return {
    at: now,
    day,
    hm,
    slotKey,
    botOk,
    allOk,
    jobs,
    misses,
    markdown,
    card,
  }
}

/** Add minutes to HH:MM (string compare safe for same-day). */
function addHmGrace(hm: string, minutes: number): string {
  const [h, m] = hm.split(':').map(Number)
  const total = (h || 0) * 60 + (m || 0) + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** Exported for tests — evaluate without Feishu send. */
export async function evaluateCronHealth(now = Date.now()): Promise<CronHealthReport> {
  return buildCronHealthReport({ now })
}

export type { CronBeatStore }
