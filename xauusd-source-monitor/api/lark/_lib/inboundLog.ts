/**
 * Ephemeral inbound event ring for ops diagnosis (per serverless instance).
 * Survives warm instances; resets on cold start. Enough to confirm whether Lark
 * is delivering webhooks after Event Subscription is configured.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MAX = 30
const DIR = '/tmp/ve-lark'
const FILE = join(DIR, 'inbound.jsonl')

export type InboundEntry = {
  at: string
  kind: string
  eventType?: string
  chatType?: string
  messageId?: string
  chatId?: string
  openId?: string
  textPreview?: string
  result?: string
  error?: string
}

function ensure() {
  try {
    mkdirSync(DIR, { recursive: true })
  } catch {
    /* ignore */
  }
}

export function logInbound(entry: InboundEntry) {
  ensure()
  try {
    appendFileSync(FILE, `${JSON.stringify(entry)}\n`, 'utf8')
  } catch {
    /* ignore */
  }
  console.log('[lark/inbound]', JSON.stringify(entry))
}

export function readInbound(limit = 20): InboundEntry[] {
  ensure()
  try {
    const raw = readFileSync(FILE, 'utf8')
    const lines = raw.split('\n').filter(Boolean)
    return lines
      .slice(-Math.min(MAX, limit))
      .map((l) => {
        try {
          return JSON.parse(l) as InboundEntry
        } catch {
          return null
        }
      })
      .filter(Boolean) as InboundEntry[]
  } catch {
    return []
  }
}

export function clearInbound() {
  ensure()
  try {
    writeFileSync(FILE, '', 'utf8')
  } catch {
    /* ignore */
  }
}
