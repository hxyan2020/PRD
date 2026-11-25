/**
 * Durable proof that Vercel Cron / cron-tick reached Lark handlers.
 * Stores a per-path map so health checks can verify each job.
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import { shanghaiDayKey } from './market.js'
import { shanghaiHm } from './oscillationAlert.js'

const HEARTBEAT_NAME = 'cron-heartbeat.json'

export type CronBeatMeta = {
  at: number
  day: string
  hm: string
  /** HTTP status from fan-out / handler, when known */
  status?: number
  outcome?: 'sent' | 'skipped' | 'ok' | 'error'
  reason?: string
}

export type CronHeartbeat = CronBeatMeta & {
  /** Last path that wrote (legacy single-beat field). */
  path: string
}

export type CronBeatStore = {
  updatedAt: number
  /** Latest path that touched the store */
  path: string
  at: number
  day: string
  hm: string
  beats: Record<string, CronBeatMeta>
}

function emptyStore(): CronBeatStore {
  const now = Date.now()
  return {
    updatedAt: now,
    path: '',
    at: now,
    day: shanghaiDayKey(now),
    hm: shanghaiHm(now),
    beats: {},
  }
}

export async function readCronBeatStore(): Promise<CronBeatStore> {
  const raw = await readDurableJson<CronBeatStore | CronHeartbeat>(HEARTBEAT_NAME)
  if (!raw) return emptyStore()
  if ('beats' in raw && raw.beats && typeof raw.beats === 'object') {
    return raw as CronBeatStore
  }
  // Migrate legacy single-beat shape
  const legacy = raw as CronHeartbeat
  const store = emptyStore()
  if (legacy.path) {
    store.path = legacy.path
    store.at = legacy.at
    store.day = legacy.day
    store.hm = legacy.hm
    store.updatedAt = legacy.at
    store.beats[legacy.path] = {
      at: legacy.at,
      day: legacy.day,
      hm: legacy.hm,
    }
  }
  return store
}

export async function touchCronHeartbeat(
  path: string,
  extra?: { status?: number; outcome?: CronBeatMeta['outcome']; reason?: string },
): Promise<CronHeartbeat> {
  const store = await readCronBeatStore()
  const at = Date.now()
  const day = shanghaiDayKey(at)
  const hm = shanghaiHm(at)
  const meta: CronBeatMeta = {
    at,
    day,
    hm,
    status: extra?.status,
    outcome: extra?.outcome,
    reason: extra?.reason,
  }
  store.beats[path] = meta
  store.updatedAt = at
  store.path = path
  store.at = at
  store.day = day
  store.hm = hm
  await writeDurableJson(HEARTBEAT_NAME, store)
  return { path, ...meta }
}

/** Legacy: last overall heartbeat (most recent path). */
export async function readCronHeartbeat(): Promise<CronHeartbeat | null> {
  const store = await readCronBeatStore()
  if (!store.path) return null
  const beat = store.beats[store.path]
  return {
    path: store.path,
    at: beat?.at ?? store.at,
    day: beat?.day ?? store.day,
    hm: beat?.hm ?? store.hm,
    status: beat?.status,
    outcome: beat?.outcome,
    reason: beat?.reason,
  }
}
