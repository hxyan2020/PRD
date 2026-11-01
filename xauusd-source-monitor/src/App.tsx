import { useState } from 'react'
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
  const [heroOpen, setHeroOpen] = useState(false)

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
        <p className="hero-sub desktop-copy">{t('subtitle')}</p>
        <p className="hero-sub mobile-copy">
          {heroOpen ? t('subtitle') : t('subtitleShort')}{' '}
          <button type="button" className="text-link" onClick={() => setHeroOpen((v) => !v)}>
            {heroOpen ? t('less') : t('more')}
          </button>
        </p>
      </header>

      <nav className="nav">
        <NavLink to="/" end>
          {t('navBriefings')}
        </NavLink>
        <NavLink to="/health">{t('navHealth')}</NavLink>
        <NavLink to="/rules">{t('navRules')}</NavLink>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <BriefingArchive briefings={mon.briefings} onArchive={mon.archiveBriefing} />
          }
        />
        <Route
          path="/health"
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
              priceHistory={mon.priceHistory}
              briefings={mon.briefings}
            />
          }
        />
        <Route path="/rules" element={<RulesPanel rules={mon.rules} setRules={mon.setRules} />} />
        <Route path="/briefings" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <p className="footer-note desktop-copy">{t('footer')}</p>
      <p className="footer-note mobile-copy">{t('footerShort')}</p>
    </div>
  )
}
