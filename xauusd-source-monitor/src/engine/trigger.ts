import type { AppLang } from '../i18n/messages'
import type { BriefingSeverity, MonitorRules, SourceHealth, TriggerEvent } from '../types'

export interface TriggerEval {
  shouldFire: boolean
  severity: BriefingSeverity
  reason: string
  breachedSources: string[]
  compositeMoveBps5m: number
}

export function evaluateTrigger(
  health: SourceHealth[],
  composite: number | null,
  compositeHistory: { t: number; px: number }[],
  rules: MonitorRules,
  now = Date.now(),
  lang: AppLang = 'en',
): TriggerEval {
  const alertSources = health.filter((h) => h.health === 'alert')
  const watchOrWorse = health.filter((h) => h.health === 'alert' || h.health === 'watch')
  const exchangeWatch = watchOrWorse.filter(
    (h) => h.kind === 'exchange' || h.kind === 'exchange_index',
  )
  const lpWatch = watchOrWorse.filter((h) => h.kind === 'lp')

  let compositeMoveBps5m = 0
  if (composite != null && compositeHistory.length) {
    const older = [...compositeHistory].reverse().find((p) => now - p.t >= 5 * 60_000)
    const ref = older ?? compositeHistory[0]
    if (ref) compositeMoveBps5m = ((composite - ref.px) / ref.px) * 10_000
  }

  const breached = [...new Set([...alertSources, ...watchOrWorse].map((h) => h.id))]
  const zh = lang === 'zh-Hant'

  if (alertSources.length >= rules.minAlertSources) {
    const severity: BriefingSeverity =
      alertSources.length >= 5 || Math.abs(compositeMoveBps5m) >= rules.compositeMoveBps5m
        ? 'critical'
        : 'alert'
    return {
      shouldFire: true,
      severity,
      reason: zh
        ? `${alertSources.length} 個來源處於告警（需 ≥${rules.minAlertSources}）`
        : `${alertSources.length} sources in Alert (≥${rules.minAlertSources} required)`,
      breachedSources: alertSources.map((h) => h.id),
      compositeMoveBps5m,
    }
  }

  if (
    exchangeWatch.length >= rules.minExchangeWatch &&
    lpWatch.length >= rules.minLpWatch
  ) {
    return {
      shouldFire: true,
      severity: 'watch',
      reason: zh
        ? `跨層級錯位：${exchangeWatch.length} 個交易所 + ${lpWatch.length} 個 LP 處於觀察/告警`
        : `Cross-tier dislocation: ${exchangeWatch.length} exchange + ${lpWatch.length} LP at Watch/Alert`,
      breachedSources: breached,
      compositeMoveBps5m,
    }
  }

  if (Math.abs(compositeMoveBps5m) >= rules.compositeMoveBps5m) {
    return {
      shouldFire: true,
      severity: Math.abs(compositeMoveBps5m) >= rules.compositeMoveBps5m * 1.5 ? 'critical' : 'alert',
      reason: zh
        ? `綜合價 5 分鐘變動 ${compositeMoveBps5m.toFixed(1)} bps（閾值 ${rules.compositeMoveBps5m} bps）`
        : `Composite moved ${compositeMoveBps5m.toFixed(1)} bps over 5m (threshold ${rules.compositeMoveBps5m} bps)`,
      breachedSources: watchOrWorse.map((h) => h.id),
      compositeMoveBps5m,
    }
  }

  return {
    shouldFire: false,
    severity: 'watch',
    reason: zh ? '未觸發' : 'No trigger',
    breachedSources: [],
    compositeMoveBps5m,
  }
}

export function toTriggerEvent(
  evalResult: TriggerEval,
  composite: number,
  now = Date.now(),
): TriggerEvent {
  return {
    id: `trg_${now}`,
    firedAt: now,
    severity: evalResult.severity,
    reason: evalResult.reason,
    breachedSources: evalResult.breachedSources,
    compositePrice: composite,
    compositeMoveBps5m: evalResult.compositeMoveBps5m,
  }
}
