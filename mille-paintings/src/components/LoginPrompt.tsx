import { useI18n } from '../i18n/I18nContext'
import './LoginPrompt.css'

export type LoginPromptReason = 'collect' | 'prefs'

type Props = {
  open: boolean
  reason: LoginPromptReason
  onCancel: () => void
  onSignIn: () => void
}

export function LoginPrompt({ open, reason, onCancel, onSignIn }: Props) {
  const { t } = useI18n()
  if (!open) return null

  return (
    <div className="login-prompt-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="login-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="login-prompt-eyebrow">{t('navAccount')}</p>
        <h2 id="login-prompt-title">{t('loginPromptTitle')}</h2>
        <p>{reason === 'collect' ? t('loginPromptCollect') : t('loginPromptPrefs')}</p>
        <div className="login-prompt-actions">
          <button type="button" className="btn primary" onClick={onSignIn}>
            {t('authSignIn')}
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            {t('loginPromptCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
