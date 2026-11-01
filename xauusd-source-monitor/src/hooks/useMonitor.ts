import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_RULES } from '../config/rules'
import { generateBriefing, loadBriefings, saveBriefings } from '../engine/briefing'
import { buildTick } from '../engine/health'
import { evaluateTrigger, toTriggerEvent } from '../engine/trigger'
import type { AppLang } from '../i18n/messages'
import type { Briefing, MonitorRules, SourceHealth } from '../types'

export function useMonitor(lang: AppLang, initialRules: MonitorRules = DEFAULT_RULES) {
  const [rules, setRules] = useState<MonitorRules>(initialRules)
  const [health, setHealth] = useState<SourceHealth[]>([])
  const [composite, setComposite] = useState<number | null>(null)
  const [spot, setSpot] = useState<number | null>(null)
  const [tickAt, setTickAt] = useState<number | null>(null)
  const [anchorsLive, setAnchorsLive] = useState({ okx: false, bitget: false, spot: false })
  const [briefings, setBriefings] = useState<Briefing[]>(() => loadBriefings())
  const [lastTriggerReason, setLastTriggerReason] = useState('')
  const [compositeMoveBps5m, setCompositeMoveBps5m] = useState(0)
  const [polling, setPolling] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forceStress, setForceStress] = useState(false)

  const historyRef = useRef<{ t: number; px: number }[]>([])
  const lastBriefingAt = useRef(0)
  const lastSeverity = useRef<Briefing['severity'] | null>(null)
  const busy = useRef(false)
  const langRef = useRef(lang)
  langRef.current = lang

  const tick = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const result = await buildTick(rules)
      let healthRows = result.health
      if (forceStress && result.composite != null) {
        healthRows = result.health.map((h) => {
          if (h.kind !== 'lp' && h.id !== 'BINANCE' && h.id !== 'BYBIT') return h
          const px = result.composite! * (1 + (h.kind === 'lp' ? 0.0022 : 0.0018))
          const deviationBps = ((px - result.composite!) / result.composite!) * 10_000
          return {
            ...h,
            price: px,
            deviationBps,
            health: 'alert' as const,
            score: Math.max(10, h.score - 40),
            consecutiveBreaches: h.consecutiveBreaches + 1,
          }
        })
      }

      setHealth(healthRows)
      setComposite(result.composite)
      setSpot(result.spot)
      setTickAt(result.tickAt)
      setAnchorsLive(result.anchorsLive)
      setError(null)

      if (result.composite != null) {
        historyRef.current = [
          ...historyRef.current.filter((p) => result.tickAt - p.t < 30 * 60_000),
          { t: result.tickAt, px: result.composite },
        ]
      }

      const evalResult = evaluateTrigger(
        healthRows,
        result.composite,
        historyRef.current,
        rules,
        result.tickAt,
        langRef.current,
      )
      setLastTriggerReason(evalResult.reason)
      setCompositeMoveBps5m(evalResult.compositeMoveBps5m)

      if (evalResult.shouldFire && result.composite != null) {
        const since = result.tickAt - lastBriefingAt.current
        const escalate =
          lastSeverity.current != null &&
          severityRank(evalResult.severity) > severityRank(lastSeverity.current)
        if (since >= rules.cooldownMs || escalate || lastBriefingAt.current === 0) {
          const trigger = toTriggerEvent(evalResult, result.composite, result.tickAt)
          const briefing = generateBriefing({
            trigger,
            health: healthRows,
            composite: result.composite,
            spot: result.spot,
            history: historyRef.current,
            lang: langRef.current,
          })
          lastBriefingAt.current = result.tickAt
          lastSeverity.current = evalResult.severity
          setBriefings((prev) => {
            const next = [briefing, ...prev.filter((b) => b.id !== briefing.id)].slice(0, 100)
            saveBriefings(next)
            return next
          })
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tick failed')
    } finally {
      busy.current = false
    }
  }, [forceStress, rules])

  useEffect(() => {
    if (!polling) return
    void tick()
    const id = window.setInterval(() => void tick(), rules.pollIntervalMs)
    return () => window.clearInterval(id)
  }, [polling, rules.pollIntervalMs, tick])

  return {
    rules,
    setRules,
    health,
    composite,
    spot,
    tickAt,
    anchorsLive,
    briefings,
    lastTriggerReason,
    compositeMoveBps5m,
    polling,
    setPolling,
    error,
    forceStress,
    setForceStress,
    refresh: tick,
  }
}

function severityRank(s: Briefing['severity']): number {
  return s === 'watch' ? 1 : s === 'alert' ? 2 : 3
}
