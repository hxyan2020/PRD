import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

export function AuthBar() {
  const { available, loading, username, login, register, logout } = useAuth()
  const { t } = useLanguage()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!available) return null

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await login(user, password)
      else await register(user, password)
      setPassword('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('authFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="auth-bar muted">{t('authChecking')}</div>
  }

  if (username) {
    return (
      <div className="auth-bar">
        <span className="auth-user" title={t('authSignedInHint')}>
          {username}
        </span>
        <button type="button" className="btn ghost auth-btn" onClick={() => void logout()}>
          {t('authSignOut')}
        </button>
      </div>
    )
  }

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="auth-modal-root" role="presentation">
            <button
              type="button"
              className="auth-modal-scrim"
              aria-label={t('closeMenu')}
              onClick={() => setOpen(false)}
            />
            <div
              className="auth-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="auth-modal-head">
                <h2 id={titleId}>{mode === 'login' ? t('authSignIn') : t('authCreateAccount')}</h2>
                <button
                  type="button"
                  className="btn ghost auth-modal-close"
                  onClick={() => setOpen(false)}
                >
                  {t('closeMenu')}
                </button>
              </div>
              <p className="auth-lede">{t('authLede')}</p>
              <div className="auth-mode" role="tablist" aria-label={t('authSignIn')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => setMode('login')}
                >
                  {t('authSignIn')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={mode === 'register' ? 'active' : ''}
                  onClick={() => setMode('register')}
                >
                  {t('authCreateAccount')}
                </button>
              </div>
              <label className="notebook-field">
                <span className="notebook-field-label">{t('authUsername')}</span>
                <input
                  className="notebook-title-input auth-input"
                  autoComplete="username"
                  enterKeyHint="next"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="notebook-field">
                <span className="notebook-field-label">{t('authPassword')}</span>
                <input
                  className="notebook-title-input auth-input"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  enterKeyHint="go"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void submit()
                    }
                  }}
                />
              </label>
              {error ? (
                <p className="notebook-composer-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                className="btn primary auth-submit"
                disabled={busy}
                onClick={() => void submit()}
              >
                {busy
                  ? t('authWorking')
                  : mode === 'login'
                    ? t('authSignIn')
                    : t('authCreateAccount')}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="auth-bar">
      <button type="button" className="btn ghost auth-btn" onClick={() => setOpen(true)}>
        {t('authSignIn')}
      </button>
      {dialog}
    </div>
  )
}
