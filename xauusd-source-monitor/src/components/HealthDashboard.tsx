import { useLocale } from '../i18n/locale'
import type { SourceHealth, SourceKind } from '../types'

function fmtPx(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

function fmtBps(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}`
}

function fmtTime(ts: number | null, compact = false) {
  if (!ts) return '—'
  if (compact) {
    return new Date(ts).toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
  })
}

export function HealthDashboard(props: {
  health: SourceHealth[]
  composite: number | null
  spot: number | null
  tickAt: number | null
  compositeMoveBps5m: number
  lastTriggerReason: string
  anchorsLive: { okx: boolean; bitget: boolean; spot: boolean }
  polling: boolean
  setPolling: (v: boolean) => void
  forceStress: boolean
  setForceStress: (v: boolean) => void
  refresh: () => void
  error: string | null
}) {
  const { t } = useLocale()
  const {
    health,
    composite,
    spot,
    tickAt,
    compositeMoveBps5m,
    lastTriggerReason,
    anchorsLive,
    polling,
    setPolling,
    forceStress,
    setForceStress,
    refresh,
    error,
  } = props

  const avgScore =
    health.length === 0
      ? 0
      : Math.round(health.reduce((s, h) => s + h.score, 0) / health.length)
  const alertCount = health.filter((h) => h.health === 'alert').length
  const liveCount = health.filter((h) => h.mode === 'live').length

  const kindLabel = (k: SourceKind) => {
    if (k === 'exchange') return t('kindExchange')
    if (k === 'exchange_index') return t('kindExchangeIndex')
    if (k === 'lp') return t('kindLp')
    return t('kindComposite')
  }

  const healthLabel = (h: SourceHealth['health']) => {
    if (h === 'healthy') return t('healthHealthy')
    if (h === 'watch') return t('healthWatch')
    if (h === 'alert') return t('healthAlert')
    if (h === 'stale') return t('healthStale')
    return t('healthOffline')
  }

  const modeLabel = (m: SourceHealth['mode']) => {
    if (m === 'live') return t('modeLive')
    if (m === 'derived') return t('modeDerived')
    return t('modeOffline')
  }

  return (
    <div className="panel">
      <h2>{t('healthTitle')}</h2>
      <p className="sub desktop-copy">{t('healthSub')}</p>

      <div className="toolbar">
        <span className="pill healthy status-pill" style={{ gap: 8 }}>
          {polling ? <span className="pulse" /> : null}
          {polling ? t('livePolling') : t('paused')}
        </span>
        <button type="button" className="primary" onClick={() => refresh()}>
          {t('refreshNow')}
        </button>
        <button type="button" onClick={() => setPolling(!polling)}>
          {polling ? t('pause') : t('resume')}
        </button>
        <button
          type="button"
          className={forceStress ? 'primary' : 'ghost'}
          onClick={() => setForceStress(!forceStress)}
        >
          {forceStress ? t('stressOn') : t('stressOff')}
        </button>
      </div>

      {error ? (
        <p className="sub" style={{ color: 'var(--critical)' }}>
          {t('feedError')}: {error}
        </p>
      ) : null}

      <div className="stats">
        <div className="stat">
          <div className="label">{t('composite')}</div>
          <div className="value">{fmtPx(composite)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('spotXau')}</div>
          <div className="value">{fmtPx(spot)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('move5m')}</div>
          <div className="value">{fmtBps(compositeMoveBps5m)} bps</div>
        </div>
        <div className="stat">
          <div className="label">{t('healthAvg')}</div>
          <div className="value">{avgScore}</div>
        </div>
        <div className="stat">
          <div className="label">{t('alertsLive')}</div>
          <div className="value">
            {alertCount} / {liveCount}
          </div>
        </div>
        <div className="stat">
          <div className="label">{t('lastTick')}</div>
          <div className="value tick-value">
            <span className="desktop-copy">{fmtTime(tickAt)}</span>
            <span className="mobile-copy">{fmtTime(tickAt, true)}</span>
          </div>
        </div>
      </div>

      <p className="sub trigger-line">
        {t('triggerEvaluator')}: <strong>{lastTriggerReason || t('waitingEval')}</strong>
        <span className="anchor-line">
          {t('anchors')} — OKX {anchorsLive.okx ? '●' : '○'} · Bitget {anchorsLive.bitget ? '●' : '○'}{' '}
          · Spot {anchorsLive.spot ? '●' : '○'}
        </span>
      </p>

      <div className="table-wrap desktop-only">
        <table>
          <thead>
            <tr>
              <th>{t('colSource')}</th>
              <th>{t('colKind')}</th>
              <th>{t('colPrice')}</th>
              <th>{t('colDev')}</th>
              <th>{t('colHealth')}</th>
              <th>{t('colScore')}</th>
              <th>{t('colMode')}</th>
              <th>{t('colLatency')}</th>
            </tr>
          </thead>
          <tbody>
            {health.map((h) => (
              <tr key={h.id}>
                <td>
                  <strong>{h.label}</strong>
                </td>
                <td>{kindLabel(h.kind)}</td>
                <td className="mono">{fmtPx(h.price)}</td>
                <td className="mono">{fmtBps(h.deviationBps)}</td>
                <td>
                  <span className={`pill ${h.health}`}>{healthLabel(h.health)}</span>
                </td>
                <td>
                  <div className="bar" title={`${h.score}`}>
                    <span style={{ width: `${h.score}%` }} />
                  </div>
                </td>
                <td>{modeLabel(h.mode)}</td>
                <td className="mono">{h.latencyMs != null ? `${Math.round(h.latencyMs)}ms` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="source-cards mobile-only">
        {health.map((h) => (
          <article key={h.id} className={`source-card tone-${h.health}`}>
            <header>
              <div>
                <strong>{h.label}</strong>
                <div className="source-meta">
                  {kindLabel(h.kind)} · {modeLabel(h.mode)}
                </div>
              </div>
              <span className={`pill ${h.health}`}>{healthLabel(h.health)}</span>
            </header>
            <div className="metric-grid">
              <div>
                <span className="metric-label">{t('colPrice')}</span>
                <span className="mono metric-value">{fmtPx(h.price)}</span>
              </div>
              <div>
                <span className="metric-label">{t('colDev')}</span>
                <span className="mono metric-value">{fmtBps(h.deviationBps)}</span>
              </div>
              <div>
                <span className="metric-label">{t('colScore')}</span>
                <span className="mono metric-value">{h.score}</span>
                <div className="bar">
                  <span style={{ width: `${h.score}%` }} />
                </div>
              </div>
              <div>
                <span className="metric-label">{t('colLatency')}</span>
                <span className="mono metric-value">
                  {h.latencyMs != null ? `${Math.round(h.latencyMs)}ms` : '—'}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
