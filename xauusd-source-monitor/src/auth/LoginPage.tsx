import { useState, type FormEvent } from 'react'
import { useLocale } from '../i18n/locale'
import { DEMO_USERS, isHytechEmail } from './users'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { t, lang, setLang, langLabel } = useLocale()
  const { login } = useAuth()
  const [email, setEmail] = useState(DEMO_USERS[0]!.email)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isHytechEmail(email)) {
      setError(t('authHytechOnly'))
      return
    }
    const res = login(email, password)
    if (!res.ok) {
      setError(t(res.error === 'invalid_email' ? 'authHytechOnly' : 'authFailed'))
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-top">
          <p className="brand">{t('brand')}</p>
          <div className="lang-switch" role="group" aria-label="Language">
            {(Object.keys(langLabel) as Array<'en' | 'zh-Hant'>).map((code) => (
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
        </div>
        <h1>{t('authTitle')}</h1>
        <p className="sub">{t('authSub')}</p>
        <form onSubmit={onSubmit} className="login-form">
          <label className="field-label" htmlFor="login-email">
            {t('authEmail')}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@hytech.com"
          />
          <label className="field-label" htmlFor="login-password">
            {t('authPassword')}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="feed-error">{error}</p> : null}
          <button type="submit" className="archive-btn primary-archive login-submit">
            {t('authLogin')}
          </button>
        </form>
        <p className="sub login-hint">{t('authDemoHint')}</p>
      </div>
    </div>
  )
}
