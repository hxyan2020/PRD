import { useState } from 'react'
import { notebookStore } from '../hooks/notebookStore'
import { useLanguage } from '../i18n/LanguageContext'
import { GIST_TOKEN_CREATE_URL, verifyGistToken } from '../lib/notebookGistSync'
import {
  generateCloudKey,
  isVercelNotebookHost,
  loadVercelSyncSettings,
} from '../lib/notebookVercelSync'

type Props = {
  onEnabled?: () => void
  /** Empty notebook on a new device — restore only, never invent an empty cloud book. */
  restoreMode?: boolean
}

/** Sticky setup card until cloud sync is turned on — required for cross-device saves. */
export function CloudSetupCard({ onEnabled, restoreMode = false }: Props) {
  const { t } = useLanguage()
  const vercelHost = isVercelNotebookHost()
  const [useVercel, setUseVercel] = useState(vercelHost)
  const [cloudKey, setCloudKey] = useState(() => loadVercelSyncSettings().cloudKey || '')
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  async function enableVercel() {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      let key = cloudKey.trim()
      if (!key && !restoreMode) {
        key = generateCloudKey()
        setCloudKey(key)
      }
      if (!key.trim()) {
        setError(t('vercelCloudKeyRequired'))
        return
      }
      const result = await notebookStore.enableVercelCloudSync({
        cloudKey: key,
        allowCreateEmpty: !restoreMode,
      })
      setSuccess(
        result.restoredFromCloud
          ? t('vercelEnabledRestoredOk', {
              total: result.total,
              cloud: result.cloudNoteCount,
            })
          : t('vercelEnabledOk', { total: result.total, key: result.cloudKey }),
      )
      window.setTimeout(() => onEnabled?.(), result.restoredFromCloud ? 2200 : 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloudEnabledFail', { error: 'failed' }))
    } finally {
      setBusy(false)
    }
  }

  async function enableGist() {
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
      window.setTimeout(() => onEnabled?.(), result.restoredFromCloud ? 2200 : 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloudEnabledFail', { error: 'failed' }))
    } finally {
      setBusy(false)
    }
  }

  async function enable() {
    if (useVercel) await enableVercel()
    else await enableGist()
  }

  return (
    <section
      className={`notebook-cloud-setup${restoreMode ? ' restore' : ''}`}
      aria-label={restoreMode ? t('cloudRestoreTitle') : t('cloudRequiredTitle')}
    >
      <div className="notebook-cloud-setup-head">
        <h2>{restoreMode ? t('cloudRestoreTitle') : t('cloudRequiredTitle')}</h2>
        <p>
          {useVercel
            ? restoreMode
              ? t('vercelRestoreBody')
              : t('vercelRequiredBody')
            : restoreMode
              ? t('cloudRestoreBody')
              : t('cloudRequiredBody')}
        </p>
        <p className="notebook-cloud-setup-note">
          {useVercel ? t('vercelNoLoginHint') : t('cloudNoLoginHint')}
        </p>
      </div>

      {vercelHost ? (
        <div className="notebook-actions" style={{ marginBottom: '0.75rem' }}>
          <button
            type="button"
            className={`btn ${useVercel ? 'primary' : 'ghost'}`}
            onClick={() => setUseVercel(true)}
          >
            {t('vercelCloudTab')}
          </button>
          <button
            type="button"
            className={`btn ${!useVercel ? 'primary' : 'ghost'}`}
            onClick={() => setUseVercel(false)}
          >
            {t('gistCloudTab')}
          </button>
        </div>
      ) : null}

      {useVercel ? (
        <>
          <label className="notebook-field">
            <span className="notebook-field-label">{t('vercelCloudKey')}</span>
            <input
              className="notebook-title-input"
              type="text"
              autoComplete="off"
              enterKeyHint="go"
              spellCheck={false}
              value={cloudKey}
              onChange={(e) => setCloudKey(e.target.value)}
              placeholder={t('vercelCloudKeyPlaceholder')}
              autoFocus={restoreMode}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void enable()
                }
              }}
            />
          </label>
          <p className="notebook-cloud-token-hint">{t('vercelCloudKeyHint')}</p>
          {!restoreMode ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setCloudKey(generateCloudKey())}
            >
              {t('vercelGenerateKey')}
            </button>
          ) : null}
        </>
      ) : (
        <>
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
        </>
      )}

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
