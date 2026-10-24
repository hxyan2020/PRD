import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../data/AuthProvider'
import { useI18n } from '../i18n/I18nContext'
import './AuthPage.css'

type Mode = 'signin' | 'signup'

function authErrorMessage(t: (k: string) => string, err: unknown): string {
  const code = err instanceof Error ? err.message : ''
  switch (code) {
    case 'invalid_email':
      return t('authErrorEmail')
    case 'weak_password':
      return t('authErrorPassword')
    case 'email_taken':
      return t('authErrorTaken')
    case 'invalid_credentials':
      return t('authErrorCredentials')
    default:
      return t('authErrorGeneric')
  }
}

export function AuthPage() {
  const { t } = useI18n()
  const { user, ready, signIn, signUp, signOut, cloudEnabled, syncing } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) {
    return (
      <main className="auth-page">
        <p className="auth-muted">{t('opening')}</p>
      </main>
    )
  }

  if (user) {
    return (
      <main className="auth-page">
        <header>
          <p className="eyebrow">{t('navAccount')}</p>
          <h1>{t('authSignedInTitle')}</h1>
          <p>{t('authSignedInLede')}</p>
        </header>
        <section className="auth-card">
          <p className="auth-email">{user.email}</p>
          <p className="auth-muted">
            {cloudEnabled ? t('authCloudOn') : t('authCloudOff')}
          </p>
          <div className="auth-actions">
            <button
              type="button"
              className="btn ghost"
              disabled={busy || syncing}
              onClick={async () => {
                setBusy(true)
                await signOut()
                setBusy(false)
              }}
            >
              {t('authSignOut')}
            </button>
            <Link to="/collection" className="btn primary">
              {t('navCollection')}
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
      navigate('/collection', { replace: true })
    } catch (err) {
      setError(authErrorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <header>
        <p className="eyebrow">{t('navAccount')}</p>
        <h1>{mode === 'signup' ? t('authSignUpTitle') : t('authSignInTitle')}</h1>
        <p>{mode === 'signup' ? t('authSignUpLede') : t('authSignInLede')}</p>
      </header>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={mode === 'signin' ? 'on' : ''}
            onClick={() => {
              setMode('signin')
              setError('')
            }}
          >
            {t('authSignIn')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'on' : ''}
            onClick={() => {
              setMode('signup')
              setError('')
            }}
          >
            {t('authSignUp')}
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>{t('authEmail')}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span>{t('authPassword')}</span>
            <input
              type="password"
              name="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('authPasswordHint')}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" className="btn primary" disabled={busy || syncing}>
            {busy || syncing
              ? t('authWorking')
              : mode === 'signup'
                ? t('authCreateAccount')
                : t('authSignIn')}
          </button>
        </form>
        <p className="auth-muted">{cloudEnabled ? t('authCloudOn') : t('authLocalNote')}</p>
      </section>
    </main>
  )
}

/** Guard helper if a route should require login later. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/account" replace />
  return <>{children}</>
}
