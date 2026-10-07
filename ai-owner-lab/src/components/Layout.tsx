import { NavLink, Outlet } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import { SelectionTools } from './SelectionTools'

export function Layout() {
  const { percent, completedCount } = useProgress()
  const { count: notebookCount } = useNotebook()
  const { lang, setLang, t } = useLanguage()

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
        <div className="topbar-right">
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
          <nav className="nav" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
        </div>
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
