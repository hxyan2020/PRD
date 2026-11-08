import { useEffect, useState } from 'react'
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
  { to: '/investigate', full: 'navInvestigate', short: 'navInvestigateShort' },
  { to: '/market', full: 'navMarket', short: 'navMarketShort' },
  { to: '/skills', full: 'navSkills', short: 'navSkillsShort' },
  { to: '/knowledge', full: 'navKnowledge', short: 'navKnowledgeShort' },
  { to: '/stats', full: 'navStats', short: 'navStatsShort' },
] as const

export default function App() {
  const { t, lang, setLang, langLabel } = useLocale()
  const { user, logout } = useAuth()
  const mon = useMonitor(lang)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  if (!user) return <LoginPage />

  const renderNavLinks = (keyPrefix: string, onNavigate?: () => void) =>
    NAV.map((item) => (
      <NavLink
        key={`${keyPrefix}${item.to}`}
        to={item.to}
        className="nav-item"
        onClick={() => onNavigate?.()}
      >
        <span className="nav-full">{t(item.full)}</span>
        <span className="nav-short">{t(item.short)}</span>
      </NavLink>
    ))

  const langSwitch = (
    <div className="lang-switch" role="group" aria-label={t('menuLanguage')}>
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
  )

  return (
    <div className="app-shell">
      <header className="hero topbar">
        <div className="topbar-row">
          <div className="hero-brand-block">
            <p className="brand">{t('brand')}</p>
            <h1 className="product-title desktop-copy">{t('title')}</h1>
          </div>

          <div className="hero-actions desktop-only-flex">
            {langSwitch}
            <div className="user-chip">
              <span className="user-chip-name">
                {user.name} · {user.email}
              </span>
              <button type="button" className="archive-btn" onClick={logout}>
                {t('authLogout')}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="hamburger mobile-only-flex"
            aria-label={menuOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={menuOpen}
            aria-controls="app-menu-drawer"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={`hamburger-lines${menuOpen ? ' open' : ''}`} aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
        <p className="hero-sub desktop-copy">{t('subtitle')}</p>
      </header>

      {menuOpen ? (
        <div
          className="menu-backdrop mobile-only-flex"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        id="app-menu-drawer"
        className={`menu-drawer mobile-only-flex${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="menu-drawer-head">
          <div>
            <p className="brand menu-brand">{t('brand')}</p>
            <p className="menu-title">{t('title')}</p>
          </div>
          <button
            type="button"
            className="archive-btn"
            onClick={() => setMenuOpen(false)}
          >
            {t('menuClose')}
          </button>
        </div>

        <section className="menu-section">
          <h3>{t('menuAccount')}</h3>
          <p className="menu-user-name">{user.name}</p>
          <p className="menu-user-email">{user.email}</p>
          <button
            type="button"
            className="archive-btn menu-logout"
            onClick={() => {
              setMenuOpen(false)
              logout()
            }}
          >
            {t('authLogout')}
          </button>
        </section>

        <section className="menu-section">
          <h3>{t('menuLanguage')}</h3>
          {langSwitch}
        </section>

        <section className="menu-section menu-nav-section">
          <h3>{t('menuNav')}</h3>
          <nav className="menu-nav" aria-label="Menu navigation">
            {renderNavLinks('menu', () => setMenuOpen(false))}
          </nav>
        </section>

        <section className="menu-section">
          <h3>{t('menuAbout')}</h3>
          <p className="menu-about">{t('subtitle')}</p>
        </section>
      </aside>

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
          <Route path="/" element={<Navigate to="/investigate" replace />} />
          <Route path="/health" element={<Navigate to="/market/health" replace />} />
          <Route path="/rules" element={<Navigate to="/market/rules" replace />} />
          <Route path="/archive" element={<Navigate to="/market/archive" replace />} />
          <Route path="/briefings" element={<Navigate to="/market" replace />} />
          <Route path="/copilot" element={<Navigate to="/investigate" replace />} />
          <Route path="*" element={<Navigate to="/investigate" replace />} />
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
