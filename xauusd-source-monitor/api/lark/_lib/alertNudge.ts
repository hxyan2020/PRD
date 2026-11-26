/**
 * Group alert silence nudge:
 * After a group alert, if no human (non-alert) reply for 3 minutes, @Yan every ~1 min
 * until「知道了」. Send count increments only on successful pushes.
 * On ack, report alert→ack latency to the @mentioned person.
 */
import { shanghaiDayKey } from './market.js'
import { readDurableJson, readTmpJson, writeDurableJson, writeTmpJson } from './durableJson.js'

export const DEFAULT_ALERT_NUDGE_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

/** Silence after alert before first nudge (ms). */
export const ALERT_NUDGE_SILENCE_MS = Math.max(
  30_000,
  Number(process.env.LARK_ALERT_NUDGE_SILENCE_MS || '') || 3 * 60_000,
)

/**
 * Min gap between nudge pushes (ms).
 * Default 45s so a Vercel `* * * * *` tick after a send near :59 still fires
 * the next minute (55s was skipping the immediate next cron → “missing #3”).
 */
export const ALERT_NUDGE_MIN_GAP_MS = Math.max(
  30_000,
  Number(process.env.LARK_ALERT_NUDGE_MIN_GAP_MS || '') || 45_000,
)

export const ALERT_NUDGE_MESSAGE =
  (process.env.LARK_ALERT_NUDGE_MESSAGE || '').trim() ||
  '新告警已超过 3 分钟无人响应，请尽快查看'

/** @deprecated campaign-day demo; kept for smoke/cron-health compat. */
export const ALERT_NUDGE_DAY =
  (process.env.LARK_ALERT_NUDGE_DAY || '').trim() || '2026-11-25'
/** @deprecated */
export const ALERT_NUDGE_START_HM =
  (process.env.LARK_ALERT_NUDGE_START || '').trim() || '08:30'

const STATE_NAME = 'alert-nudge-state.json'

export type AlertNudgeState = {
  dayKey: string
  chatId: string
  /** Yan Haixiang open_id (ou_…) */
  openId: string
  message: string
  /** group = send to chat_id; p2p = DM open_id (private demo) */
  delivery?: 'group' | 'p2p'
  /** Alert seen; waiting for 3min silence */
  armed: boolean
  /** Actively sending minute nudges */
  active: boolean
  acked: boolean
  ackedAt?: number
  ackedBy?: string
  /** When the arming alert arrived */
  alertAt: number
  alertPreview?: string
  /** Human non-alert reply before first nudge → cancel arm */
  humanRespondedAt?: number
  /** First successful nudge send */
  nudgeStartedAt?: number
  lastSentAt?: number
  lastCronAt?: number
  /** Successful push count only */
  sendCount: number
  /** alertAt → ackedAt */
  ackLatencyMs?: number
}

/** Sync tmp cache — smoke / same-instance only. Prefer loadNudgeState in handlers. */
export function readNudgeState(): AlertNudgeState | null {
  return readTmpJson<AlertNudgeState>(STATE_NAME)
}

/** Sync tmp write — smoke only. Prefer saveNudgeState in handlers. */
export function writeNudgeState(state: AlertNudgeState) {
  writeTmpJson(STATE_NAME, state)
}

export async function loadNudgeState(): Promise<AlertNudgeState | null> {
  return readDurableJson<AlertNudgeState>(STATE_NAME)
}

export async function saveNudgeState(state: AlertNudgeState): Promise<void> {
  await writeDurableJson(STATE_NAME, state)
}

export function shanghaiHm(ts: number = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(ts))
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
    const hour = get('hour') === '24' ? '00' : get('hour')
    return `${hour}:${get('minute')}`
  } catch {
    const d = new Date(ts)
    return `${String(d.getUTCHours() + 8).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
}

function hmToMinutes(hm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim())
  if (!m) return 0
  return Number(m[1]) * 60 + Number(m[2])
}

/** @deprecated campaign helpers — always false for day gating in new model. */
export function isCampaignDay(ts: number = Date.now()): boolean {
  return shanghaiDayKey(ts) === ALERT_NUDGE_DAY
}

/** @deprecated */
export function nudgeWindowOpen(ts: number = Date.now()): boolean {
  if (!isCampaignDay(ts)) return false
  return hmToMinutes(shanghaiHm(ts)) >= hmToMinutes(ALERT_NUDGE_START_HM)
}

/** @deprecated */
export function nudgeWindowExpired(ts: number = Date.now()): boolean {
  const day = shanghaiDayKey(ts)
  if (day > ALERT_NUDGE_DAY) return true
  if (day < ALERT_NUDGE_DAY) return false
  return hmToMinutes(shanghaiHm(ts)) >= hmToMinutes('18:00')
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h} 小时 ${m} 分 ${s} 秒`
  if (m > 0) return `${m} 分 ${s} 秒`
  return `${s} 秒`
}

export function buildAlertNudgeCard(args: {
  openId: string
  message: string
  sendCount: number
  alertAt?: number
}): Record<string, unknown> {
  const at =
    args.openId && args.openId.startsWith('ou_')
      ? `<at id="${args.openId}"></at>`
      : '**@Yan Haixiang**'
  const silenceMin = Math.round(ALERT_NUDGE_SILENCE_MS / 60_000)
  const body = [
    `🚨 **新告警无人响应提醒**（第 **${args.sendCount}** 次）`,
    '',
    `${at} ${args.message}`,
    args.alertAt
      ? `• 告警触发：${shanghaiHm(args.alertAt)}（东八区）· 已静默 ≥${silenceMin} 分钟`
      : `• 告警后静默 ≥${silenceMin} 分钟仍无人响应`,
    '',
    '点下面 **知道了** 停止提醒；或直接回复：**知道了**',
  ].join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'red',
      title: { tag: 'plain_text', content: '新告警来啦' },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            type: 'primary',
            text: { tag: 'plain_text', content: '知道了' },
            value: { action: 'alert_nudge_ack' },
          },
        ],
      },
    ],
  }
}

/** Ack confirmation + TTR for the @mentioned person. */
export function buildAlertNudgeAckCard(args: {
  openId: string
  alertAt: number
  ackedAt: number
  sendCount: number
  alertPreview?: string
}): Record<string, unknown> {
  const latency = Math.max(0, args.ackedAt - args.alertAt)
  const at =
    args.openId && args.openId.startsWith('ou_')
      ? `<at id="${args.openId}"></at>`
      : '**@Yan Haixiang**'
  const preview = (args.alertPreview || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const body = [
    `${at} ✅ **已停止提醒**`,
    '',
    `• 告警触发：**${shanghaiHm(args.alertAt)}**（东八区）`,
    `• 点击知道了：**${shanghaiHm(args.ackedAt)}**（东八区）`,
    `• 总用时：**${formatDurationMs(latency)}**`,
    `• 提醒推送：**${args.sendCount}** 次（仅成功送达计数）`,
    preview ? `• 告警摘要：_${preview}_` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'green',
      title: { tag: 'plain_text', content: '提醒已确认' },
    },
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: body } }],
  }
}

function emptyState(partial?: Partial<AlertNudgeState>): AlertNudgeState {
  return {
    dayKey: shanghaiDayKey(Date.now()),
    chatId: DEFAULT_ALERT_NUDGE_CHAT_ID,
    openId: '',
    message: ALERT_NUDGE_MESSAGE,
    armed: false,
    active: false,
    acked: false,
    alertAt: 0,
    sendCount: 0,
    ...partial,
  }
}

/** Sync ack for smoke — tmp only. */
export function ackAlertNudge(openId: string): AlertNudgeState | null {
  const cur = readNudgeState()
  const base = cur || emptyState({ openId: openId || '' })
  const ackedAt = Date.now()
  const next: AlertNudgeState = {
    ...base,
    armed: false,
    active: false,
    acked: true,
    ackedAt,
    ackedBy: openId || base.ackedBy,
    ackLatencyMs: base.alertAt ? Math.max(0, ackedAt - base.alertAt) : undefined,
  }
  writeNudgeState(next)
  return next
}

export async function ackAlertNudgeDurable(openId: string): Promise<AlertNudgeState | null> {
  const cur = await loadNudgeState()
  const base = cur || emptyState({ openId: openId || '' })
  const ackedAt = Date.now()
  const next: AlertNudgeState = {
    ...base,
    armed: false,
    active: false,
    acked: true,
    ackedAt,
    ackedBy: openId || base.ackedBy,
    ackLatencyMs: base.alertAt ? Math.max(0, ackedAt - base.alertAt) : undefined,
  }
  await saveNudgeState(next)
  return next
}

export function isNudgeActive(): boolean {
  const s = readNudgeState()
  return Boolean(s?.active && !s.acked)
}

export async function isNudgeActiveDurable(): Promise<boolean> {
  const s = await loadNudgeState()
  return Boolean(s?.active && !s.acked)
}

export async function isNudgeArmedOrActiveDurable(): Promise<boolean> {
  const s = await loadNudgeState()
  return Boolean(s && !s.acked && (s.armed || s.active))
}

/**
 * Arm (or re-arm) after a group alert. Resets the 3-minute silence clock.
 * If already actively nudging, keep the loop (do not reset sendCount).
 */
export async function armAlertNudgeFromGroupAlert(args: {
  chatId: string
  openId: string
  alertAt?: number
  alertPreview?: string
  delivery?: 'group' | 'p2p'
}): Promise<AlertNudgeState> {
  const now = args.alertAt || Date.now()
  const cur = await loadNudgeState()
  if (cur?.active && !cur.acked) {
    // Keep nudging; refresh preview only.
    const next: AlertNudgeState = {
      ...cur,
      chatId: args.chatId || cur.chatId,
      openId: args.openId || cur.openId,
      delivery: args.delivery || cur.delivery || 'group',
      alertPreview: args.alertPreview || cur.alertPreview,
      lastCronAt: cur.lastCronAt,
    }
    await saveNudgeState(next)
    return next
  }
  const next: AlertNudgeState = {
    dayKey: shanghaiDayKey(now),
    chatId: args.chatId,
    openId: args.openId,
    message: ALERT_NUDGE_MESSAGE,
    delivery: args.delivery || 'group',
    armed: true,
    active: false,
    acked: false,
    alertAt: now,
    alertPreview: (args.alertPreview || '').slice(0, 200),
    humanRespondedAt: undefined,
    nudgeStartedAt: undefined,
    lastSentAt: undefined,
    sendCount: 0,
    ackLatencyMs: undefined,
    ackedAt: undefined,
    ackedBy: undefined,
  }
  await saveNudgeState(next)
  return next
}

/** Private-chat demo: arm + activate immediately for DM to Yan. */
export async function armAlertNudgeP2pDemo(args: {
  openId: string
  alertAt?: number
  alertPreview?: string
  message?: string
}): Promise<AlertNudgeState> {
  const cur = await loadNudgeState()
  // Idempotent: re-demo must NOT reset sendCount (that caused duplicate「第 1 次」).
  if (cur?.active && !cur.acked && cur.delivery === 'p2p') {
    const kept: AlertNudgeState = {
      ...cur,
      openId: args.openId || cur.openId,
      chatId: args.openId || cur.chatId,
      alertPreview: args.alertPreview || cur.alertPreview,
      message: args.message || cur.message,
    }
    await saveNudgeState(kept)
    return kept
  }
  const now = args.alertAt || Date.now() - ALERT_NUDGE_SILENCE_MS - 5_000
  const next: AlertNudgeState = {
    dayKey: shanghaiDayKey(Date.now()),
    chatId: args.openId,
    openId: args.openId,
    message: args.message || '【私聊演示】模拟告警后 3 分钟无人响应 — 请点知道了停止',
    delivery: 'p2p',
    armed: false,
    active: true,
    acked: false,
    alertAt: now,
    alertPreview: args.alertPreview || 'DEMO · Mark vs Index 48bps（私聊）',
    sendCount: 0,
  }
  await saveNudgeState(next)
  return next
}

/** Group-chat demo: arm + activate immediately; cards go to the alert group. */
export async function armAlertNudgeGroupDemo(args: {
  chatId: string
  openId: string
  alertAt?: number
  alertPreview?: string
  message?: string
}): Promise<AlertNudgeState> {
  const cur = await loadNudgeState()
  // Idempotent: concurrent/repeat demo=group must keep sendCount + lastSentAt.
  if (cur?.active && !cur.acked && (cur.delivery || 'group') === 'group') {
    const kept: AlertNudgeState = {
      ...cur,
      chatId: args.chatId || cur.chatId,
      openId: args.openId || cur.openId,
      delivery: 'group',
      alertPreview: args.alertPreview || cur.alertPreview,
      message: args.message || cur.message,
    }
    await saveNudgeState(kept)
    return kept
  }
  const now = args.alertAt || Date.now() - ALERT_NUDGE_SILENCE_MS - 5_000
  const next: AlertNudgeState = {
    dayKey: shanghaiDayKey(Date.now()),
    chatId: args.chatId,
    openId: args.openId,
    message:
      args.message || '【群聊演示】模拟告警后 3 分钟无人响应 — 请点知道了停止',
    delivery: 'group',
    armed: false,
    active: true,
    acked: false,
    alertAt: now,
    alertPreview: args.alertPreview || 'DEMO · Mark vs Index 48bps（群聊）',
    sendCount: 0,
  }
  await saveNudgeState(next)
  return next
}

/**
 * Reserve the next send slot before calling Lark.
 * Sets lastSentAt immediately so a concurrent cron/demo cannot emit the same序号.
 * On send failure, call releaseNudgeSendSlot with the prior lastSentAt.
 */
export async function claimNudgeSendSlot(args?: {
  force?: boolean
  now?: number
  minGapMs?: number
}): Promise<
  | { ok: true; state: AlertNudgeState; sendCount: number; priorLastSentAt?: number }
  | { ok: false; reason: string; state: AlertNudgeState | null }
> {
  const now = args?.now || Date.now()
  const minGap = args?.minGapMs ?? ALERT_NUDGE_MIN_GAP_MS
  const cur = await loadNudgeState()
  if (!cur || cur.acked || !cur.active) {
    return {
      ok: false,
      reason: !cur ? 'no_state' : cur.acked ? 'acked' : 'inactive',
      state: cur,
    }
  }
  if (!args?.force && cur.lastSentAt && now - cur.lastSentAt < minGap) {
    return { ok: false, reason: 'throttle', state: cur }
  }
  const sendCount = (cur.sendCount || 0) + 1
  const reserved: AlertNudgeState = {
    ...cur,
    lastSentAt: now,
    // Keep sendCount until success — card uses claimed sendCount; durable count
    // advances only in commitNudgeSendSlot after Lark returns OK.
  }
  await saveNudgeState(reserved)
  return {
    ok: true,
    state: reserved,
    sendCount,
    priorLastSentAt: cur.lastSentAt,
  }
}

/** Commit sendCount after a successful Lark push. */
export async function commitNudgeSendSlot(args: {
  sendCount: number
  openId: string
  chatId: string
  delivery: 'group' | 'p2p'
  lastSentAt?: number
}): Promise<AlertNudgeState | null> {
  const cur = await loadNudgeState()
  if (!cur) return null
  const next: AlertNudgeState = {
    ...cur,
    openId: args.openId || cur.openId,
    chatId: args.chatId || cur.chatId,
    delivery: args.delivery,
    sendCount: Math.max(cur.sendCount || 0, args.sendCount),
    lastSentAt: args.lastSentAt || cur.lastSentAt || Date.now(),
    nudgeStartedAt: cur.nudgeStartedAt || args.lastSentAt || Date.now(),
    active: true,
    armed: false,
  }
  await saveNudgeState(next)
  return next
}

/** Roll back lastSentAt if Lark send failed after claim. */
export async function releaseNudgeSendSlot(priorLastSentAt?: number): Promise<void> {
  const cur = await loadNudgeState()
  if (!cur) return
  await saveNudgeState({
    ...cur,
    lastSentAt: priorLastSentAt,
  })
}

/** Sync variant for smoke. */
export function armAlertNudge(args: {
  chatId: string
  openId: string
  alertAt?: number
  alertPreview?: string
}): AlertNudgeState {
  const now = args.alertAt || Date.now()
  const cur = readNudgeState()
  if (cur?.active && !cur.acked) {
    const next = { ...cur, chatId: args.chatId || cur.chatId, openId: args.openId || cur.openId }
    writeNudgeState(next)
    return next
  }
  const next: AlertNudgeState = {
    dayKey: shanghaiDayKey(now),
    chatId: args.chatId,
    openId: args.openId,
    message: ALERT_NUDGE_MESSAGE,
    armed: true,
    active: false,
    acked: false,
    alertAt: now,
    alertPreview: (args.alertPreview || '').slice(0, 200),
    sendCount: 0,
  }
  writeNudgeState(next)
  return next
}

/**
 * Human (non-alert) message in the group before nudging starts → cancel arm.
 * Does not stop an already-active nudge loop (only 知道了 does).
 */
export async function noteGroupHumanResponseDurable(args: {
  chatId: string
  at?: number
}): Promise<AlertNudgeState | null> {
  const cur = await loadNudgeState()
  if (!cur || cur.acked) return cur
  if (cur.chatId && args.chatId && cur.chatId !== args.chatId) return cur
  if (cur.active) return cur
  if (!cur.armed) return cur
  const next: AlertNudgeState = {
    ...cur,
    armed: false,
    humanRespondedAt: args.at || Date.now(),
  }
  await saveNudgeState(next)
  return next
}

export function noteGroupHumanResponse(args: { chatId: string; at?: number }): AlertNudgeState | null {
  const cur = readNudgeState()
  if (!cur || cur.acked || cur.active || !cur.armed) return cur
  if (cur.chatId && args.chatId && cur.chatId !== args.chatId) return cur
  const next: AlertNudgeState = {
    ...cur,
    armed: false,
    humanRespondedAt: args.at || Date.now(),
  }
  writeNudgeState(next)
  return next
}

/** Whether silence has elapsed and we should start / continue nudging. */
export function shouldNudgeNow(state: AlertNudgeState, now: number = Date.now()): boolean {
  if (state.acked) return false
  if (state.active) return true
  if (!state.armed || !state.alertAt) return false
  if (state.humanRespondedAt) return false
  return now - state.alertAt >= ALERT_NUDGE_SILENCE_MS
}

/**
 * 「知道了」with optional leading @mentions (bot display names may contain spaces,
 * e.g.「@VE AI风控小助手 知道了」). Must not match real questions.
 */
export function looksLikeNudgeAck(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  return /^(?:@_user_\d+\s+|@.+\s+)*(知道了|知道啦|收到|got\s*it|ok|okay)\s*[!.。！~]*$/i.test(
    t,
  )
}

/**「新告警／这个提醒是什么」— explain the nudge card, not small-talk. */
export function looksLikeNudgeExplainQuestion(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  if (
    /(新告警|新警告|这个提醒|這個提醒|刚才的提醒|剛才的提醒|告警提醒).{0,12}(是什么|是什麼|什么意思|什麼意思|怎么回事|怎麼回事|为什么|為什麼)/i.test(
      t,
    )
  ) {
    return true
  }
  if (
    /(是什么|是什麼|什么意思|什麼意思).{0,8}(新告警|新警告|提醒)/i.test(t) ||
    /^(新告警|新警告)\s*(是什么|是什麼)?\s*[?？]?$/i.test(t)
  ) {
    return true
  }
  return false
}

export function formatNudgeExplainReply(
  lang: 'en' | 'zh-Hans' | 'zh-Hant',
  state: AlertNudgeState | null,
): string {
  const count = state?.sendCount || 0
  const active = Boolean(state?.active && !state?.acked)
  const armed = Boolean(state?.armed && !state?.acked && !state?.active)
  const silenceMin = Math.round(ALERT_NUDGE_SILENCE_MS / 60_000)
  if (lang === 'zh-Hans') {
    return [
      '🚨 **「新告警来啦」提醒是什么**',
      '',
      `• 群里出现告警后，若 **${silenceMin} 分钟内**没有任何人类回复（报警本身不计），就会 @Yan 每分钟提醒。`,
      '• 点 **知道了**（或回复「知道了」）才停止；点击后会回报从告警到确认的总用时与推送次数。',
      armed ? `• 当前：已记录告警，静默倒计时中。` : '',
      count > 0 ? `• 目前已成功推送 **${count}** 次${active ? '，仍在提醒中' : ''}。` : '',
      !armed && !active ? '• 当前没有进行中的提醒。' : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🚨 **「新告警來啦」提醒是什麼**',
      '',
      `• 群裡出現告警後，若 **${silenceMin} 分鐘內**沒有任何人類回覆（報警本身不計），就會 @Yan 每分鐘提醒。`,
      '• 點 **知道了** 才停止；會回報從告警到確認的總用時與推送次數。',
      count > 0 ? `• 目前已成功推送 **${count}** 次${active ? '，仍在提醒中' : ''}。` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    '🚨 **What the alert nudge is**',
    '',
    `• After a group alert, if no human reply for **${silenceMin} minutes** (alerts don’t count), @Yan is nudged every minute.`,
    '• Tap **知道了** to stop; you’ll get alert→ack latency and push count.',
    count > 0
      ? `• Sent **${count}** successful push(es)${active ? '; still nudging' : ''}.`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}
