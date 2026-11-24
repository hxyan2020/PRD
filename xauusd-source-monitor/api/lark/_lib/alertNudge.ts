/**
 * Group alert nudge: @mention + message, re-send every minute until「知道了」.
 * State lives in /tmp (same pattern as market cron dedupe) — best-effort on serverless.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { shanghaiDayKey } from './market.js'

export const DEFAULT_ALERT_NUDGE_CHAT_ID = 'oc_eb8eba24ff99a2c3ea3c9439750d65cd'

/** One-shot campaign: tomorrow morning 08:30 Asia/Shanghai (2026-11-25). */
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
  /** When true, cron keeps sending every ~60s */
  active: boolean
  acked: boolean
  ackedAt?: number
  ackedBy?: string
  startedAt?: number
  lastSentAt?: number
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

function hmToMinutes(hm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim())
  if (!m) return 0
  return Number(m[1]) * 60 + Number(m[2])
}

/** True once Shanghai clock is on the campaign day and past the start HH:mm. */
export function nudgeWindowOpen(ts: number = Date.now()): boolean {
  const day = shanghaiDayKey(ts)
  if (day !== ALERT_NUDGE_DAY) return false
  return hmToMinutes(shanghaiHm(ts)) >= hmToMinutes(ALERT_NUDGE_START_HM)
}

/** Stop auto-nag after 18:00 CST even if never acked (safety). */
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
  // Feishu lark_md @mention — open_id on `id`
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

export function ackAlertNudge(openId: string): AlertNudgeState | null {
  const cur = readNudgeState()
  if (!cur) return null
  const next: AlertNudgeState = {
    ...cur,
    active: false,
    acked: true,
    ackedAt: Date.now(),
    ackedBy: openId || cur.ackedBy,
  }
  writeNudgeState(next)
  return next
}

export function isNudgeActive(): boolean {
  const s = readNudgeState()
  return Boolean(s?.active && !s.acked)
}

/** Whether the user text should stop the nudge (知道了 / got it). */
export function looksLikeNudgeAck(text: string): boolean {
  const t = (text || '').trim()
  return /^(知道了|知道啦|收到|got\s*it|ok|okay)\s*[!.。！~]*$/i.test(t)
}
