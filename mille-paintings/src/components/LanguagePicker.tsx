import { useEffect, useRef, useState } from 'react'
import { LANGUAGES, flagUrl, resolveLang } from '../i18n/languages'
import { useI18n } from '../i18n/I18nContext'
import './LanguagePicker.css'

export function LanguagePicker() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = resolveLang(lang)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className={`lang-picker ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        onClick={() => setOpen((v) => !v)}
      >
        <img
          className="lang-flag"
          src={flagUrl(current.flagCode, 40)}
          alt=""
          width={20}
          height={15}
          loading="lazy"
        />
        <span className="lang-name">{current.name}</span>
        <span className="lang-caret" aria-hidden="true" />
      </button>
      {open ? (
        <ul className="lang-menu" role="listbox" aria-label={t('language')}>
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                className={l.code === lang ? 'active' : ''}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
              >
                <img
                  className="lang-flag"
                  src={flagUrl(l.flagCode, 40)}
                  alt=""
                  width={20}
                  height={15}
                  loading="lazy"
                />
                <span>{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
