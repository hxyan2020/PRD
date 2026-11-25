/**
 * Tomorrow-only group alert nudge: from 08:30 CST, @mention every ~1 min
 * until「知道了」. Default day: 2026-11-25 Asia/Shanghai.
 *
 * State is stored in Vercel Blob (durable across instances). /tmp is only a cache.
 */
import { shanghaiDayKey } from './market.js'
import { readDurableJson, readTmpJson, writeDurableJson, writeTmpJson } from './durableJson.js'

export const DEFAULT_ALERT_NUDGE_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

export const ALERT_NUDGE_DAY =
  (process.env.LARK_ALERT_NUDGE_DAY || '').trim() || '2026-11-25'
export const ALERT_NUDGE_START_HM =
  (process.env.LARK_ALERT_NUDGE_START || '').trim() || '08:30'
export const ALERT_NUDGE_MESSAGE =
  (process.env.LARK_ALERT_NUDGE_MESSAGE || '').trim() ||
  'Haixiang 新告警来啦 快来看看'

const STATE_NAME = 'alert-nudge-state.json'

export type AlertNudgeState = {
  dayKey: string
  chatId: string
  openId: string
  message: string
  /** Cron keeps sending while active && !acked */
  active: boolean
  acked: boolean
  ackedAt?: number
  ackedBy?: string
  startedAt?: number
  lastSentAt?: number
  sendCount: number
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

export function isCampaignDay(ts: number = Date.now()): boolean {
  return shanghaiDayKey(ts) === ALERT_NUDGE_DAY
}

/** Campaign day after 08:30 CST (inclusive). */
export function nudgeWindowOpen(ts: number = Date.now()): boolean {
  if (!isCampaignDay(ts)) return false
  return hmToMinutes(shanghaiHm(ts)) >= hmToMinutes(ALERT_NUDGE_START_HM)
}

/** Safety stop end of campaign day 18:00 CST. */
export function nudgeWindowExpired(ts: number = Date.now()): boolean {
  const day = shanghaiDayKey(ts)
  if (day > ALERT_NUDGE_DAY) return true
  if (day < ALERT_NUDGE_DAY) return false
  return hmToMinutes(shanghaiHm(ts)) >= hmToMinutes('18:00')
}

export function buildAlertNudgeCard(args: {
  openId: string
  message: string
  sendCount: number
}): Record<string, unknown> {
  const at =
    args.openId && args.openId !== 'unknown'
      ? `<at id="${args.openId}"></at>`
      : '**@Haixiang**'
  const body = [
    `🚨 **新告警提醒**（第 ${args.sendCount} 次）`,
    '',
    `${at} ${args.message}`,
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

/** Sync ack for smoke — tmp only. */
export function ackAlertNudge(openId: string): AlertNudgeState | null {
  const cur = readNudgeState()
  const base: AlertNudgeState = cur || {
    dayKey: ALERT_NUDGE_DAY,
    chatId: DEFAULT_ALERT_NUDGE_CHAT_ID,
    openId: openId || '',
    message: ALERT_NUDGE_MESSAGE,
    active: false,
    acked: false,
    sendCount: 0,
  }
  const next: AlertNudgeState = {
    ...base,
    active: false,
    acked: true,
    ackedAt: Date.now(),
    ackedBy: openId || base.ackedBy,
  }
  writeNudgeState(next)
  return next
}

export async function ackAlertNudgeDurable(openId: string): Promise<AlertNudgeState | null> {
  const cur = await loadNudgeState()
  const base: AlertNudgeState = cur || {
    dayKey: ALERT_NUDGE_DAY,
    chatId: DEFAULT_ALERT_NUDGE_CHAT_ID,
    openId: openId || '',
    message: ALERT_NUDGE_MESSAGE,
    active: false,
    acked: false,
    sendCount: 0,
  }
  const next: AlertNudgeState = {
    ...base,
    active: false,
    acked: true,
    ackedAt: Date.now(),
    ackedBy: openId || base.ackedBy,
  }
  await saveNudgeState(next)
  return next
}

export function isNudgeActive(): boolean {
  const s = readNudgeState()
  return Boolean(s?.active && !s.acked && s.dayKey === ALERT_NUDGE_DAY)
}

export async function isNudgeActiveDurable(): Promise<boolean> {
  const s = await loadNudgeState()
  return Boolean(s?.active && !s.acked && s.dayKey === ALERT_NUDGE_DAY)
}

export function looksLikeNudgeAck(text: string): boolean {
  const t = (text || '').trim()
  return /^(知道了|知道啦|收到|got\s*it|ok|okay)\s*[!.。！~]*$/i.test(t)
}
