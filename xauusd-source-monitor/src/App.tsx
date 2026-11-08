import { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { useLocale } from './i18n/locale'
import type { AppLang } from './i18n/messages'
import { useMonitor } from './hooks/useMonitor'
import { MarketConditionPage } from './pages/MarketConditionPage'
import { SkillsPage } from './pages/SkillsPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { InvestigatePage } from './pages/InvestigatePage'
import { StatsPage } from './pages/StatsPage'

const NAV = [
  { to: '/market', full: 'navMarket', short: 'navMarketShort' },
  { to: '/skills', full: 'navSkills', short: 'navSkillsShort' },
  { to: '/knowledge', full: 'navKnowledge', short: 'navKnowledgeShort' },
  { to: '/investigate', full: 'navInvestigate', short: 'navInvestigateShort' },
  { to: '/stats', full: 'navStats', short: 'navStatsShort' },
] as const

export default function App() {
  const { t, lang, setLang, langLabel } = useLocale()
  const { user, logout } = useAuth()
  const mon = useMonitor(lang)
  const [heroOpen, setHeroOpen] = useState(false)

  if (!user) return <LoginPage />

  const renderNavLinks = (keyPrefix: string) =>
    NAV.map((item) => (
      <NavLink key={`${keyPrefix}${item.to}`} to={item.to} className="nav-item">
        <span className="nav-full">{t(item.full)}</span>
        <span className="nav-short">{t(item.short)}</span>
      </NavLink>
    ))

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <div className="hero-brand-block">
            <p className="brand">{t('brand')}</p>
            <h1 className="product-title">{t('title')}</h1>
          </div>
          <div className="hero-actions">
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
            <div className="user-chip">
              <span className="user-chip-name desktop-copy">
                {user.name} · {user.email}
              </span>
              <span className="user-chip-name mobile-copy">{user.name}</span>
              <button type="button" className="archive-btn" onClick={logout}>
                {t('authLogout')}
              </button>
            </div>
          </div>
        </div>
        <p className="hero-sub desktop-copy">{t('subtitle')}</p>
        <p className="hero-sub mobile-copy">
          {heroOpen ? t('subtitle') : t('subtitleShort')}{' '}
          <button type="button" className="text-link" onClick={() => setHeroOpen((v) => !v)}>
            {heroOpen ? t('less') : t('more')}
          </button>
        </p>
      </header>

      <nav className="nav main-nav desktop-nav" aria-label="Primary">
        {renderNavLinks('d')}
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/market/*" element={<MarketConditionPage mon={mon} />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/investigate" element={<InvestigatePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/" element={<Navigate to="/market" replace />} />
          <Route path="/health" element={<Navigate to="/market/health" replace />} />
          <Route path="/rules" element={<Navigate to="/market/rules" replace />} />
          <Route path="/archive" element={<Navigate to="/market/archive" replace />} />
          <Route path="/briefings" element={<Navigate to="/market" replace />} />
          <Route path="/copilot" element={<Navigate to="/investigate" replace />} />
          <Route path="*" element={<Navigate to="/market" replace />} />
        </Routes>
      </main>

      <nav className="nav bottom-nav mobile-only-flex" aria-label="Primary mobile">
        {renderNavLinks('m')}
      </nav>

      <p className="footer-note desktop-copy">{t('footer')}</p>
      <p className="footer-note mobile-copy">{t('footerShort')}</p>
    </div>
  )
}
