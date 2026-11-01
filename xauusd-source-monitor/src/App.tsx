import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BriefingArchive } from './components/BriefingArchive'
import { HealthDashboard } from './components/HealthDashboard'
import { RulesPanel } from './components/RulesPanel'
import { useLocale } from './i18n/locale'
import type { AppLang } from './i18n/messages'
import { useMonitor } from './hooks/useMonitor'

export default function App() {
  const { t, lang, setLang, langLabel } = useLocale()
  const mon = useMonitor(lang)

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <p className="brand">{t('brand')}</p>
          <div className="lang-switch" role="group" aria-label="Language">
            {(Object.keys(langLabel) as AppLang[]).map((code) => (
              <button
                key={code}
                type="button"
                className={lang === code ? 'active' : ''}
                onClick={() => setLang(code)}
              >
                {langLabel[code]}
              </button>
            ))}
          </div>
        </div>
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </header>

      <nav className="nav">
        <NavLink to="/" end>
          {t('navHealth')}
        </NavLink>
        <NavLink to="/rules">{t('navRules')}</NavLink>
        <NavLink to="/briefings">{t('navBriefings')}</NavLink>
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
        <Route path="/rules" element={<RulesPanel rules={mon.rules} setRules={mon.setRules} />} />
        <Route path="/briefings" element={<BriefingArchive briefings={mon.briefings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <p className="footer-note">{t('footer')}</p>
    </div>
  )
}
