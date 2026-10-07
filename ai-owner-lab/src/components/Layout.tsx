import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import { SelectionTools } from './SelectionTools'

export function Layout() {
  const { percent, completedCount } = useProgress()
  const { count: notebookCount } = useNotebook()
  const { lang, setLang, t } = useLanguage()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, lang])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  const links = [
    { to: '/', label: t('navHome'), end: true },
    { to: '/curriculum', label: t('navCurriculum') },
    { to: '/tracker', label: t('navTracker') },
    { to: '/notebook', label: t('navNotebook') },
    { to: '/glossary', label: t('navGlossary') },
    { to: '/use-cases', label: t('navUseCases') },
    { to: '/ops', label: t('navOps') },
    { to: '/career', label: t('navCareer') },
  ]

  return (
    <div className="shell">
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            OWNLAB
            <small>{t('brandSub')}</small>
          </span>
        </NavLink>

        <div className="topbar-actions">
          <div className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >
              {t('langEn')}
            </button>
            <button
              type="button"
              className={lang === 'zh' ? 'active' : ''}
              onClick={() => setLang('zh')}
            >
              {t('langZh')}
            </button>
          </div>

          <button
            type="button"
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">{menuOpen ? t('closeMenu') : t('menu')}</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        {menuOpen ? (
          <button
            type="button"
            className="nav-scrim"
            aria-label={t('closeMenu')}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <nav
          id="primary-nav"
          className={`nav ${menuOpen ? 'open' : ''}`}
          aria-label="Primary"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              {link.to === '/tracker' ? (
                <span className="nav-progress" aria-label={`${percent} percent complete`}>
                  {completedCount}/30
                </span>
              ) : null}
              {link.to === '/notebook' && notebookCount > 0 ? (
                <span className="nav-progress" aria-label={`${notebookCount} notebook entries`}>
                  {notebookCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <SelectionTools />
      <footer className="footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  )
}
