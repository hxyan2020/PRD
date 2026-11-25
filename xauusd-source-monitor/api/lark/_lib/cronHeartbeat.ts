/**
 * Durable proof that Vercel Cron reached a Lark handler.
 * Written on every cron invocation (including skipped no-ops).
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import { shanghaiDayKey } from './market.js'
import { shanghaiHm } from './oscillationAlert.js'

const HEARTBEAT_NAME = 'cron-heartbeat.json'

export type CronHeartbeat = {
  path: string
  at: number
  day: string
  hm: string
}

export async function touchCronHeartbeat(path: string): Promise<CronHeartbeat> {
  const beat: CronHeartbeat = {
    path,
    at: Date.now(),
    day: shanghaiDayKey(),
    hm: shanghaiHm(),
  }
  await writeDurableJson(HEARTBEAT_NAME, beat)
  return beat
}

export async function readCronHeartbeat(): Promise<CronHeartbeat | null> {
  return readDurableJson<CronHeartbeat>(HEARTBEAT_NAME)
}
