import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BriefingArchive } from './components/BriefingArchive'
import { HealthDashboard } from './components/HealthDashboard'
import { RulesPanel } from './components/RulesPanel'
import { useMonitor } from './hooks/useMonitor'

export default function App() {
  const mon = useMonitor()

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="brand">V Exchange</p>
        <h1>XAUUSD source monitor</h1>
        <p>
          Real-time health for MVP perpetual gold venues (exchanges + LPs). When multiple sources
          breach thresholds, the monitor investigates microstructure, basis, and session context
          and publishes an actionable briefing.
        </p>
      </header>

      <nav className="nav">
        <NavLink to="/" end>
          Health
        </NavLink>
        <NavLink to="/rules">Rules</NavLink>
        <NavLink to="/briefings">Briefings</NavLink>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <HealthDashboard
              health={mon.health}
              composite={mon.composite}
              spot={mon.spot}
              tickAt={mon.tickAt}
              compositeMoveBps5m={mon.compositeMoveBps5m}
              lastTriggerReason={mon.lastTriggerReason}
              anchorsLive={mon.anchorsLive}
              polling={mon.polling}
              setPolling={mon.setPolling}
              forceStress={mon.forceStress}
              setForceStress={mon.setForceStress}
              refresh={mon.refresh}
              error={mon.error}
            />
          }
        />
        <Route
          path="/rules"
          element={<RulesPanel rules={mon.rules} setRules={mon.setRules} />}
        />
        <Route path="/briefings" element={<BriefingArchive briefings={mon.briefings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <p className="footer-note">
        Public permanent page for XAUUSD MVP perp ops. Live anchors: OKX XAU-USDT-SWAP, Bitget
        XAUUSDT, gold-api XAU spot. Derived mirrors cover BINANCE / BYBIT / indexes / ISPRIME /
        STARPRIME / VELOCITY when venue CORS or geo blocks prevent direct browser pulls.
      </p>
    </div>
  )
}
