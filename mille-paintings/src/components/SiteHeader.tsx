import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LANGUAGES } from '../i18n/translations'
import { useI18n } from '../i18n/I18nContext'
import { usePaintingsStore } from '../data/PaintingsProvider'
import './SiteHeader.css'

export function SiteHeader() {
  const { t, lang, setLang } = useI18n()
  const { stats } = usePaintingsStore()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const close = () => setOpen(false)

  return (
    <header className="site-header">
      <Link to="/" className="brand" onClick={close}>
        <span className="brand-mark">{t('brand')}</span>
        <span className="brand-sub">{t('brandSub')}</span>
      </Link>

      <div className="header-stats" aria-label="activity">
        {t('statsLine', { viewed: stats.viewed, collected: stats.collected })}
      </div>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-label={open ? t('close') : t('menu')}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`header-panel ${open ? 'open' : ''}`}>
        <nav className="nav" onClick={close}>
          <NavLink to="/" end>
            {t('navHome')}
          </NavLink>
          <NavLink to="/today">{t('navToday')}</NavLink>
          <NavLink to="/gallery">{t('navGallery')}</NavLink>
          <NavLink to="/collection">{t('navCollection')}</NavLink>
          <NavLink to="/preferences">{t('navPrefs')}</NavLink>
        </nav>
        <label className="lang-picker">
          <span className="sr-only">{t('language')}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('language')}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}
