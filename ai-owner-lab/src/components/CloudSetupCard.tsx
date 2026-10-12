import { useState } from 'react'
import { notebookStore } from '../hooks/notebookStore'
import { useLanguage } from '../i18n/LanguageContext'
import { GIST_TOKEN_CREATE_URL, verifyGistToken } from '../lib/notebookGistSync'

type Props = {
  onEnabled?: () => void
}

/** Sticky setup card until cloud sync is turned on — required for cross-device saves. */
export function CloudSetupCard({ onEnabled }: Props) {
  const { t } = useLanguage()
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function enable() {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      if (!token.trim()) {
        setError(t('cloudTokenRequired'))
        return
      }
      await verifyGistToken(token)
      const result = await notebookStore.enableCloudSync({ token })
      setSuccess(
        result.restoredFromCloud
          ? t('cloudEnabledRestoredOk', {
              id: result.gistId,
              total: result.total,
              cloud: result.cloudNoteCount,
            })
          : t('cloudEnabledOk', { id: result.gistId, total: result.total }),
      )
      setToken('')
      onEnabled?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloudEnabledFail', { error: 'failed' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="notebook-cloud-setup" aria-label={t('cloudRequiredTitle')}>
      <div className="notebook-cloud-setup-head">
        <h2>{t('cloudRequiredTitle')}</h2>
        <p>{t('cloudRequiredBody')}</p>
        <p className="notebook-cloud-setup-note">{t('cloudNoLoginHint')}</p>
      </div>
      <ol className="notebook-cloud-steps">
        <li>
          {t('cloudStep1')}{' '}
          <a href={GIST_TOKEN_CREATE_URL} target="_blank" rel="noreferrer">
            {t('cloudCreateToken')}
          </a>
        </li>
        <li>{t('cloudRequiredStep2')}</li>
        <li>{t('cloudRequiredStep3')}</li>
      </ol>
      <label className="notebook-field">
        <span className="notebook-field-label">{t('backupGistToken')}</span>
        <input
          className="notebook-title-input"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void enable()
            }
          }}
        />
      </label>
      {error ? (
        <p className="notebook-composer-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="notebook-recover-status" role="status">
          {success}
        </p>
      ) : null}
      <div className="notebook-actions">
        <button type="button" className="btn primary" disabled={busy} onClick={() => void enable()}>
          {busy ? t('cloudSyncing') : t('cloudEnable')}
        </button>
      </div>
    </section>
  )
}
