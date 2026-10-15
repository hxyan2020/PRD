import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

export function AuthBar() {
  const { available, loading, username, login, register, logout } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="auth-bar">
      <button type="button" className="btn ghost auth-btn" onClick={() => setOpen((v) => !v)}>
        {t('authSignIn')}
      </button>
      {open ? (
        <div className="auth-popover" role="dialog" aria-label={t('authSignIn')}>
          <p className="auth-lede">{t('authLede')}</p>
          <div className="auth-mode">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              {t('authSignIn')}
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              {t('authCreateAccount')}
            </button>
          </div>
          <label className="notebook-field">
            <span className="notebook-field-label">{t('authUsername')}</span>
            <input
              className="notebook-title-input"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
            />
          </label>
          <label className="notebook-field">
            <span className="notebook-field-label">{t('authPassword')}</span>
            <input
              className="notebook-title-input"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
          <button type="button" className="btn primary" disabled={busy} onClick={() => void submit()}>
            {busy ? t('authWorking') : mode === 'login' ? t('authSignIn') : t('authCreateAccount')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
