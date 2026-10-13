import { useState } from 'react'
import { notebookStore } from '../hooks/notebookStore'
import { useLanguage } from '../i18n/LanguageContext'
import { GIST_TOKEN_CREATE_URL, verifyGistToken } from '../lib/notebookGistSync'

type Props = {
  onEnabled?: () => void
  /** Empty notebook on a new device — restore only, never invent an empty cloud book. */
  restoreMode?: boolean
}

/** Sticky setup card until cloud sync is turned on — required for cross-device saves. */
export function CloudSetupCard({ onEnabled, restoreMode = false }: Props) {
  const { t } = useLanguage()
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
      const result = await notebookStore.enableCloudSync({
        token,
        gistId: gistId || undefined,
        allowCreateEmpty: !restoreMode,
      })
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
      // Keep the success line visible before the parent hides this card.
      window.setTimeout(() => onEnabled?.(), result.restoredFromCloud ? 2200 : 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloudEnabledFail', { error: 'failed' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className={`notebook-cloud-setup${restoreMode ? ' restore' : ''}`}
      aria-label={restoreMode ? t('cloudRestoreTitle') : t('cloudRequiredTitle')}
    >
      <div className="notebook-cloud-setup-head">
        <h2>{restoreMode ? t('cloudRestoreTitle') : t('cloudRequiredTitle')}</h2>
        <p>{restoreMode ? t('cloudRestoreBody') : t('cloudRequiredBody')}</p>
        <p className="notebook-cloud-setup-note">{t('cloudNoLoginHint')}</p>
      </div>

      <label className="notebook-field">
        <span className="notebook-field-label">{t('backupGistToken')}</span>
        <input
          className="notebook-title-input"
          type="password"
          autoComplete="off"
          enterKeyHint="go"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_…"
          autoFocus={restoreMode}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void enable()
            }
          }}
        />
      </label>

      <p className="notebook-cloud-token-hint">
        {t('cloudStep1')}{' '}
        <a href={GIST_TOKEN_CREATE_URL} target="_blank" rel="noreferrer">
          {t('cloudCreateToken')}
        </a>
        {t('cloudTokenHintSuffix')}
      </p>

      <button
        type="button"
        className="btn ghost notebook-cloud-advanced-toggle"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? t('cloudHideAdvanced') : t('cloudShowAdvanced')}
      </button>
      {showAdvanced ? (
        <label className="notebook-field">
          <span className="notebook-field-label">{t('cloudNotebookId')}</span>
          <input
            className="notebook-title-input"
            type="text"
            autoComplete="off"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder={t('cloudNotebookIdPlaceholder')}
          />
        </label>
      ) : null}

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
          {busy ? t('cloudSyncing') : restoreMode ? t('cloudRestore') : t('cloudEnable')}
        </button>
      </div>
    </section>
  )
}
