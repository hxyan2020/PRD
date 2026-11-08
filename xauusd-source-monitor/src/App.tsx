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

export default function App() {
  const { t, lang, setLang, langLabel } = useLocale()
  const { user, logout } = useAuth()
  const mon = useMonitor(lang)
  const [heroOpen, setHeroOpen] = useState(false)

  if (!user) return <LoginPage />

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <p className="brand">{t('brand')}</p>
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
              <span className="sub">
                {user.name} · {user.email}
              </span>
              <button type="button" className="archive-btn" onClick={logout}>
                {t('authLogout')}
              </button>
            </div>
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
        <NavLink to="/market">{t('navMarket')}</NavLink>
        <NavLink to="/skills">{t('navSkills')}</NavLink>
        <NavLink to="/knowledge">{t('navKnowledge')}</NavLink>
        <NavLink to="/investigate">{t('navInvestigate')}</NavLink>
        <NavLink to="/stats">{t('navStats')}</NavLink>
      </nav>

      <Routes>
        <Route path="/market/*" element={<MarketConditionPage mon={mon} />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/investigate" element={<InvestigatePage />} />
        <Route path="/stats" element={<StatsPage />} />
        {/* Legacy redirects */}
        <Route path="/" element={<Navigate to="/market" replace />} />
        <Route path="/health" element={<Navigate to="/market/health" replace />} />
        <Route path="/rules" element={<Navigate to="/market/rules" replace />} />
        <Route path="/archive" element={<Navigate to="/market/archive" replace />} />
        <Route path="/briefings" element={<Navigate to="/market" replace />} />
        <Route path="/copilot" element={<Navigate to="/investigate" replace />} />
        <Route path="*" element={<Navigate to="/market" replace />} />
      </Routes>

      <p className="footer-note desktop-copy">{t('footer')}</p>
      <p className="footer-note mobile-copy">{t('footerShort')}</p>
    </div>
  )
}
