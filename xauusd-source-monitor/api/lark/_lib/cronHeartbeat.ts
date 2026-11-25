/**
 * Durable proof that Vercel Cron / cron-tick reached Lark handlers.
 * One blob file per path so concurrent serverless writers cannot wipe siblings.
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import { shanghaiDayKey } from './market.js'
import { shanghaiHm } from './oscillationAlert.js'

const LEGACY_NAME = 'cron-heartbeat.json'
const BEAT_PREFIX = 'cron-beat__'

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

const TRACKED_PATHS = [
  '/api/lark/cron-tick',
  '/api/lark/alert-nudge',
  '/api/lark/oscillation-alert',
  '/api/lark/market-report',
  '/api/lark/weekly-demo',
  '/api/lark/daily-market-report',
  '/api/lark/weekly-report',
  '/api/lark/cron-health',
] as const

function beatFileFor(path: string): string {
  return `${BEAT_PREFIX}${path.replace(/\W+/g, '_').replace(/^_|_$/g, '')}.json`
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
  const store = emptyStore()
  let latestAt = 0
  let latestPath = ''

  for (const path of TRACKED_PATHS) {
    const one = await readDurableJson<CronBeatMeta & { path?: string }>(beatFileFor(path))
    if (!one?.at) continue
    store.beats[path] = {
      at: one.at,
      day: one.day || shanghaiDayKey(one.at),
      hm: one.hm || shanghaiHm(one.at),
      status: one.status,
      outcome: one.outcome,
      reason: one.reason,
    }
    if (one.at >= latestAt) {
      latestAt = one.at
      latestPath = path
    }
  }

  // Legacy single-file fallback (pre per-path migration)
  if (!latestPath) {
    const legacy = await readDurableJson<CronHeartbeat | CronBeatStore>(LEGACY_NAME)
    if (legacy) {
      if ('beats' in legacy && legacy.beats && typeof legacy.beats === 'object') {
        for (const [p, meta] of Object.entries(legacy.beats)) {
          if (!meta?.at) continue
          store.beats[p] = meta
          if (meta.at >= latestAt) {
            latestAt = meta.at
            latestPath = p
          }
        }
      } else if ((legacy as CronHeartbeat).path) {
        const l = legacy as CronHeartbeat
        store.beats[l.path] = {
          at: l.at,
          day: l.day,
          hm: l.hm,
          status: l.status,
          outcome: l.outcome,
          reason: l.reason,
        }
        latestAt = l.at
        latestPath = l.path
      }
    }
  }

  if (latestPath) {
    store.path = latestPath
    store.at = latestAt
    store.updatedAt = latestAt
    store.day = store.beats[latestPath]?.day || shanghaiDayKey(latestAt)
    store.hm = store.beats[latestPath]?.hm || shanghaiHm(latestAt)
  }
  return store
}

export async function touchCronHeartbeat(
  path: string,
  extra?: { status?: number; outcome?: CronBeatMeta['outcome']; reason?: string },
): Promise<CronHeartbeat & { blobOk: boolean }> {
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
  const blobOk = await writeDurableJson(beatFileFor(path), { path, ...meta })
  // Keep legacy pointer for older readers (best-effort; may race but per-path files are source of truth)
  await writeDurableJson(LEGACY_NAME, { path, ...meta }).catch(() => undefined)
  if (!blobOk) {
    console.error('[cronHeartbeat] blob write failed for', path)
  }
  return { path, ...meta, blobOk }
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
