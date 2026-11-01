import { XAUUSD_SOURCES } from '../config/sources'
import type { MonitorRules, SourceHealth, SourceQuote } from '../types'
import { fetchAnchors, seededNoise } from './feeds'

function median(nums: number[]): number | null {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

function scoreHealth(level: SourceHealth['health'], absDevBps: number | null, latencyMs: number | null): number {
  let score = 100
  if (level === 'offline') return 5
  if (level === 'stale') score -= 45
  if (level === 'alert') score -= 40
  if (level === 'watch') score -= 18
  if (absDevBps != null) score -= Math.min(30, absDevBps * 0.8)
  if (latencyMs != null && latencyMs > 1500) score -= 10
  if (latencyMs != null && latencyMs > 3000) score -= 15
  return Math.max(0, Math.min(100, Math.round(score)))
}

export interface TickResult {
  quotes: SourceQuote[]
  health: SourceHealth[]
  composite: number | null
  spot: number | null
  anchorsLive: { okx: boolean; bitget: boolean; spot: boolean }
  tickAt: number
}

const breachMemory = new Map<string, number>()

export async function buildTick(rules: MonitorRules, now = Date.now()): Promise<TickResult> {
  const anchors = await fetchAnchors()
  const liveBases = [anchors.okx, anchors.bitget, anchors.spot].filter(
    (n): n is number => n != null && Number.isFinite(n),
  )
  const anchorMid = median(liveBases)

  const quotes: SourceQuote[] = XAUUSD_SOURCES.map((src) => {
    if (src.id === 'OKEX' && anchors.okx != null) {
      return {
        id: src.id,
        price: anchors.okx,
        updatedAt: now,
        latencyMs: anchors.latency.okx ?? null,
        mode: 'live',
      }
    }
    if (src.id === 'BITGET' && anchors.bitget != null) {
      return {
        id: src.id,
        price: anchors.bitget,
        updatedAt: now,
        latencyMs: anchors.latency.bitget ?? null,
        mode: 'live',
      }
    }
    if (src.id === 'RC_INDEX' && anchors.spot != null) {
      // Spot gold as composite-index style reference
      return {
        id: src.id,
        price: anchors.spot,
        updatedAt: now,
        latencyMs: anchors.latency.spot ?? null,
        mode: 'live',
      }
    }
    if (src.id === 'LMAX' && anchors.spot != null) {
      const noise = seededNoise(src.id, now, src.noiseBps)
      return {
        id: src.id,
        price: anchors.spot * (1 + (src.basisBps + noise) / 10_000),
        updatedAt: now,
        latencyMs: anchors.latency.spot ?? null,
        mode: 'derived',
      }
    }

    if (anchorMid == null) {
      return {
        id: src.id,
        price: null,
        updatedAt: now,
        latencyMs: null,
        mode: 'offline',
        error: 'no live anchors',
      }
    }

    const noise = seededNoise(src.id, now, src.noiseBps)
    // Mild stress injection: occasionally widen a subset of venues so rules can demonstrate
    const stress =
      Math.floor(now / 60_000) % 17 === 0 && (src.kind === 'lp' || src.id.includes('BINANCE'))
        ? seededNoise(`${src.id}-stress`, now, 22)
        : 0

    return {
      id: src.id,
      price: anchorMid * (1 + (src.basisBps + noise + stress) / 10_000),
      updatedAt: now,
      latencyMs: Math.round(80 + Math.abs(seededNoise(src.id, now, 40))),
      mode: 'derived',
    }
  })

  const healthyPrices = quotes
    .filter((q) => q.price != null && q.mode !== 'offline')
    .map((q) => q.price!)
  const composite = median(healthyPrices)

  const health: SourceHealth[] = quotes.map((q) => {
    const def = XAUUSD_SOURCES.find((s) => s.id === q.id)!
    let deviationBps: number | null = null
    let level: SourceHealth['health'] = 'healthy'

    if (q.price == null || q.mode === 'offline') {
      level = 'offline'
      breachMemory.set(q.id, 0)
    } else if (now - q.updatedAt > rules.staleAfterMs) {
      level = 'stale'
    } else if (composite != null) {
      deviationBps = ((q.price - composite) / composite) * 10_000
      const abs = Math.abs(deviationBps)
      if (abs >= rules.alertDeviationBps) level = 'alert'
      else if (abs >= rules.watchDeviationBps) level = 'watch'
      else level = 'healthy'
    }

    const prev = breachMemory.get(q.id) ?? 0
    const consecutive =
      level === 'alert' || level === 'watch' ? prev + 1 : 0
    breachMemory.set(q.id, consecutive)

    return {
      ...q,
      label: def.label,
      kind: def.kind,
      deviationBps,
      health: level,
      score: scoreHealth(level, deviationBps != null ? Math.abs(deviationBps) : null, q.latencyMs),
      consecutiveBreaches: consecutive,
    }
  })

  return {
    quotes,
    health,
    composite,
    spot: anchors.spot,
    anchorsLive: {
      okx: anchors.okx != null,
      bitget: anchors.bitget != null,
      spot: anchors.spot != null,
    },
    tickAt: now,
  }
}
