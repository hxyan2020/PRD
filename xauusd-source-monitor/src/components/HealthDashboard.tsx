import { KIND_LABEL } from '../config/sources'
import type { SourceHealth } from '../types'

function fmtPx(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

function fmtBps(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}`
}

function fmtTime(ts: number | null) {
  if (!ts) return '—'
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

  return (
    <>
      <div className="panel">
        <h2>Live source health — XAUUSD</h2>
        <p className="sub">
          Composite median of healthy venues. Live anchors: OKX / Bitget / gold spot. Other
          exchange indexes &amp; LPs are derived mirrors when direct public feeds are unavailable.
        </p>

        <div className="toolbar">
          <span className="pill healthy" style={{ gap: 8 }}>
            {polling ? <span className="pulse" /> : null}
            {polling ? 'Live polling' : 'Paused'}
          </span>
          <button type="button" className="primary" onClick={() => refresh()}>
            Refresh now
          </button>
          <button type="button" onClick={() => setPolling(!polling)}>
            {polling ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            className={forceStress ? 'primary' : 'ghost'}
            onClick={() => setForceStress(!forceStress)}
            title="Widen BINANCE/BYBIT/LP quotes to demonstrate multi-source trigger"
          >
            {forceStress ? 'Stress demo ON' : 'Stress demo'}
          </button>
        </div>

        {error ? (
          <p className="sub" style={{ color: 'var(--critical)' }}>
            Feed error: {error}
          </p>
        ) : null}

        <div className="stats">
          <div className="stat">
            <div className="label">Composite</div>
            <div className="value">{fmtPx(composite)}</div>
          </div>
          <div className="stat">
            <div className="label">Spot XAU</div>
            <div className="value">{fmtPx(spot)}</div>
          </div>
          <div className="stat">
            <div className="label">5m move</div>
            <div className="value">{fmtBps(compositeMoveBps5m)} bps</div>
          </div>
          <div className="stat">
            <div className="label">Health avg</div>
            <div className="value">{avgScore}</div>
          </div>
          <div className="stat">
            <div className="label">Alerts / live</div>
            <div className="value">
              {alertCount} / {liveCount}
            </div>
          </div>
          <div className="stat">
            <div className="label">Last tick (SGT)</div>
            <div className="value" style={{ fontSize: '0.85rem' }}>
              {fmtTime(tickAt)}
            </div>
          </div>
        </div>

        <p className="sub" style={{ marginBottom: 8 }}>
          Trigger evaluator: <strong>{lastTriggerReason}</strong>
          <br />
          Anchors — OKX {anchorsLive.okx ? '●' : '○'} · Bitget {anchorsLive.bitget ? '●' : '○'} ·
          Spot {anchorsLive.spot ? '●' : '○'}
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Kind</th>
                <th>Price</th>
                <th>Dev (bps)</th>
                <th>Health</th>
                <th>Score</th>
                <th>Mode</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {health.map((h) => (
                <tr key={h.id}>
                  <td>
                    <strong>{h.label}</strong>
                  </td>
                  <td>{KIND_LABEL[h.kind]}</td>
                  <td className="mono">{fmtPx(h.price)}</td>
                  <td className="mono">{fmtBps(h.deviationBps)}</td>
                  <td>
                    <span className={`pill ${h.health}`}>{h.health}</span>
                  </td>
                  <td>
                    <div className="bar" title={`${h.score}`}>
                      <span style={{ width: `${h.score}%` }} />
                    </div>
                  </td>
                  <td>{h.mode}</td>
                  <td className="mono">{h.latencyMs != null ? `${Math.round(h.latencyMs)}ms` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
