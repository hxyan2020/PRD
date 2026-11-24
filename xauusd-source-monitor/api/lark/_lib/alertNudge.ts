/**
 * One-shot group alert nudge: @mention + message at a single Shanghai wall time.
 * Default campaign: 2026-11-25 08:30 Asia/Shanghai — send once, no repeat.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { shanghaiDayKey } from './market.js'

export const DEFAULT_ALERT_NUDGE_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

/** One-shot campaign day (Asia/Shanghai calendar). */
export const ALERT_NUDGE_DAY =
  (process.env.LARK_ALERT_NUDGE_DAY || '').trim() || '2026-11-25'
export const ALERT_NUDGE_START_HM =
  (process.env.LARK_ALERT_NUDGE_START || '').trim() || '08:30'
export const ALERT_NUDGE_MESSAGE =
  (process.env.LARK_ALERT_NUDGE_MESSAGE || '').trim() ||
  'Haixiang 新告警来啦 快来看看'

const MARK_DIR = join(tmpdir(), 've-lark-store')
const STATE_FILE = join(MARK_DIR, 'alert-nudge-state.json')

export type AlertNudgeState = {
  dayKey: string
  chatId: string
  openId: string
  message: string
  /** True after the single send (or manual ack) */
  sent: boolean
  sentAt?: number
  acked: boolean
  ackedAt?: number
  ackedBy?: string
  sendCount: number
}

function ensureDir() {
  if (!existsSync(MARK_DIR)) mkdirSync(MARK_DIR, { recursive: true })
}

export function readNudgeState(): AlertNudgeState | null {
  try {
    if (!existsSync(STATE_FILE)) return null
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as AlertNudgeState
  } catch {
    return null
  }
}

export function writeNudgeState(state: AlertNudgeState) {
  try {
    ensureDir()
    writeFileSync(STATE_FILE, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

/** Asia/Shanghai wall HH:mm (24h). */
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

/** True only on the campaign calendar day in Asia/Shanghai. */
export function isCampaignDay(ts: number = Date.now()): boolean {
  return shanghaiDayKey(ts) === ALERT_NUDGE_DAY
}

/**
 * Cron targets 08:30 CST once. Allow 08:30–08:32 so a slightly late
 * invocation still sends; `alreadySentToday` prevents duplicates.
 */
export function isNudgeSendSlot(ts: number = Date.now()): boolean {
  if (!isCampaignDay(ts)) return false
  const hm = shanghaiHm(ts)
  if (hm === ALERT_NUDGE_START_HM) return true
  // Default start 08:30 → accept through 08:32
  return hm === '08:30' || hm === '08:31' || hm === '08:32'
}

export function alreadySentToday(): boolean {
  const s = readNudgeState()
  return Boolean(s?.sent && s.dayKey === ALERT_NUDGE_DAY)
}

export function buildAlertNudgeCard(args: {
  openId: string
  message: string
}): Record<string, unknown> {
  const at =
    args.openId && args.openId !== 'unknown'
      ? `<at id="${args.openId}"></at>`
      : '**@Haixiang**'
  const body = [
    '🚨 **新告警提醒**',
    '',
    `${at} ${args.message}`,
    '',
    '点 **知道了** 确认收到；或直接回复：**知道了**',
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

export function ackAlertNudge(openId: string): AlertNudgeState | null {
  const cur = readNudgeState()
  const base: AlertNudgeState = cur || {
    dayKey: ALERT_NUDGE_DAY,
    chatId: DEFAULT_ALERT_NUDGE_CHAT_ID,
    openId: openId || '',
    message: ALERT_NUDGE_MESSAGE,
    sent: true,
    sendCount: 0,
    acked: false,
  }
  const next: AlertNudgeState = {
    ...base,
    acked: true,
    ackedAt: Date.now(),
    ackedBy: openId || base.ackedBy,
  }
  writeNudgeState(next)
  return next
}

export function isNudgeActive(): boolean {
  const s = readNudgeState()
  // Still treat as “active” for text-ack if sent but not acked (same day)
  return Boolean(s && s.dayKey === ALERT_NUDGE_DAY && s.sent && !s.acked)
}

export function looksLikeNudgeAck(text: string): boolean {
  const t = (text || '').trim()
  return /^(知道了|知道啦|收到|got\s*it|ok|okay)\s*[!.。！~]*$/i.test(t)
}
