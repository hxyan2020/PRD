/**
 * Weekly report optimisation accepts — durable append-only log.
 * Users tick recommendations on the weekly card; each accept is recorded
 * (weekKey, text, who, when) and idempotent per week+recId.
 */
import { createHash } from 'node:crypto'
import { readDurableJson, writeDurableJson } from './durableJson.js'

const LOG_NAME = 'weekly-opt-accept-log.json'
const STATE_NAME = 'weekly-opt-accept-state.json'

export type WeeklyOptAcceptEntry = {
  id: string
  weekKey: string
  recId: string
  text: string
  acceptedAt: number
  acceptedBy: string
  acceptedByName?: string
  source: 'weekly_card' | 'demo' | 'command'
}

type LogStore = { entries: WeeklyOptAcceptEntry[] }
/** weekKey → recId → entry id (idempotent ticks). */
type StateStore = Record<string, Record<string, string>>

function newId(): string {
  return `wopt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Stable short id for a recommendation line (same text → same id). */
export function weeklyOptRecId(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim().toLowerCase()
  return createHash('sha1').update(t).digest('hex').slice(0, 12)
}

export async function listAcceptedWeeklyOpts(opts?: {
  weekKey?: string
  limit?: number
}): Promise<WeeklyOptAcceptEntry[]> {
  const log = (await readDurableJson<LogStore>(LOG_NAME)) || { entries: [] }
  let entries = [...(log.entries || [])]
  const weekKey = (opts?.weekKey || '').trim()
  if (weekKey) entries = entries.filter((e) => e.weekKey === weekKey)
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 50))
  return entries.slice(0, limit)
}

export async function acceptedRecIdsForWeek(weekKey: string): Promise<Set<string>> {
  const state = (await readDurableJson<StateStore>(STATE_NAME)) || {}
  const map = state[weekKey] || {}
  return new Set(Object.keys(map))
}

export async function acceptWeeklyOpt(input: {
  weekKey: string
  text: string
  recId?: string
  acceptedBy: string
  acceptedByName?: string
  source?: WeeklyOptAcceptEntry['source']
}): Promise<{ ok: true; entry: WeeklyOptAcceptEntry; already: boolean }> {
  const weekKey = String(input.weekKey || '').trim() || 'unknown'
  const text = String(input.text || '').replace(/\s+/g, ' ').trim()
  if (!text) {
    throw new Error('optimisation text required')
  }
  const recId = (input.recId || '').trim() || weeklyOptRecId(text)

  const state = (await readDurableJson<StateStore>(STATE_NAME)) || {}
  const weekMap = { ...(state[weekKey] || {}) }
  if (weekMap[recId]) {
    const log = (await readDurableJson<LogStore>(LOG_NAME)) || { entries: [] }
    const existing =
      (log.entries || []).find((e) => e.id === weekMap[recId]) ||
      (log.entries || []).find((e) => e.weekKey === weekKey && e.recId === recId)
    if (existing) {
      return { ok: true, entry: existing, already: true }
    }
  }

  const entry: WeeklyOptAcceptEntry = {
    id: newId(),
    weekKey,
    recId,
    text: text.slice(0, 500),
    acceptedAt: Date.now(),
    acceptedBy: String(input.acceptedBy || '').trim() || 'unknown',
    acceptedByName: input.acceptedByName?.trim() || undefined,
    source: input.source || 'weekly_card',
  }

  const log = (await readDurableJson<LogStore>(LOG_NAME)) || { entries: [] }
  log.entries = [entry, ...(log.entries || [])].slice(0, 1000)
  await writeDurableJson(LOG_NAME, log)

  weekMap[recId] = entry.id
  state[weekKey] = weekMap
  await writeDurableJson(STATE_NAME, state)

  return { ok: true, entry, already: false }
}
