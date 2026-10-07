import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { LanguagePicker } from './LanguagePicker'
import { StatsCounter } from './StatsCounter'
import './SiteHeader.css'

export function SiteHeader() {
  const { t } = useI18n()
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

      <div className="header-stats-slot">
        <StatsCounter />
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
        <LanguagePicker />
      </div>
    </header>
  )
}
