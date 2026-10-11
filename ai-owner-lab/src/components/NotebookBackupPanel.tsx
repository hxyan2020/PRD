import { useEffect, useRef, useState } from 'react'
import { notebookStore } from '../hooks/notebookStore'
import { useLanguage } from '../i18n/LanguageContext'
import {
  clearBackupFolder,
  folderBackupSupported,
  getBackupFolderName,
  getPersistentStorageState,
  pickBackupFolder,
  requestPersistentStorage,
} from '../lib/notebookFolderBackup'
import {
  GIST_TOKEN_CREATE_URL,
  getCloudSyncStatus,
  loadGistSettings,
  saveGistSettings,
  verifyGistToken,
} from '../lib/notebookGistSync'

export function NotebookBackupPanel() {
  const { t, lang } = useLanguage()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [persistState, setPersistState] = useState<'granted' | 'prompt' | 'unsupported'>('prompt')
  const [folderName, setFolderName] = useState<string | null>(null)
  const [folderSupported] = useState(() => folderBackupSupported())
  const [gistToken, setGistToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [cloudOn, setCloudOn] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  function refreshCloudStatus() {
    const cloud = getCloudSyncStatus()
    const gist = loadGistSettings()
    setGistToken(gist.token)
    setGistId(gist.gistId)
    setCloudOn(gist.enabled && Boolean(gist.token && gist.gistId))
    setLastSyncedAt(cloud.lastSyncedAt)
  }

  useEffect(() => {
    void getPersistentStorageState().then(setPersistState)
    void getBackupFolderName().then(setFolderName)
    refreshCloudStatus()
  }, [])

  function formatSyncTime(iso: string | null) {
    if (!iso) return t('cloudNeverSynced')
    try {
      return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  async function onEnableCloud() {
    setBusy(true)
    setStatus(null)
    try {
      if (!gistToken.trim()) {
        setStatus(t('cloudTokenRequired'))
        return
      }
      await verifyGistToken(gistToken)
      const result = await notebookStore.enableCloudSync({
        token: gistToken,
        gistId: gistId || undefined,
      })
      setGistId(result.gistId)
      setCloudOn(true)
      setLastSyncedAt(new Date().toISOString())
      setStatus(t('cloudEnabledOk', { id: result.gistId, total: result.total }))
    } catch (err) {
      setStatus(
        t('cloudEnabledFail', {
          error: err instanceof Error ? err.message : 'failed',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  async function onConnectCloud() {
    setBusy(true)
    setStatus(null)
    try {
      if (!gistToken.trim() || !gistId.trim()) {
        setStatus(t('cloudConnectRequired'))
        return
      }
      await verifyGistToken(gistToken)
      const result = await notebookStore.connectCloudSync({
        token: gistToken,
        gistId,
      })
      setGistId(result.gistId)
      setCloudOn(true)
      setLastSyncedAt(new Date().toISOString())
      setStatus(t('cloudConnectOk', { total: result.total }))
    } catch (err) {
      setStatus(
        t('cloudConnectFail', {
          error: err instanceof Error ? err.message : 'failed',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  function onDisableCloud() {
    saveGistSettings({ enabled: false })
    setCloudOn(false)
    setStatus(t('cloudDisabled'))
  }

  async function onCopyCloudId() {
    if (!gistId) return
    try {
      await navigator.clipboard.writeText(gistId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setStatus(t('cloudCopyFail'))
    }
  }

  async function onRequestPersist() {
    setBusy(true)
    setStatus(null)
    try {
      const result = await requestPersistentStorage()
      setPersistState(result === 'granted' ? 'granted' : result === 'denied' ? 'prompt' : 'unsupported')
      setStatus(
        result === 'granted'
          ? t('backupPersistGranted')
          : result === 'denied'
            ? t('backupPersistDenied')
            : t('backupPersistUnsupported'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function onPickFolder() {
    setBusy(true)
    setStatus(null)
    try {
      const picked = await pickBackupFolder()
      if (!picked) {
        setStatus(t('backupFolderCancelled'))
        return
      }
      setFolderName(picked.name)
      const sync = await notebookStore.syncDurableNow()
      setStatus(
        sync.folder
          ? t('backupFolderLinked', { name: picked.name })
          : t('backupFolderLinkedNoWrite', { name: picked.name }),
      )
    } catch {
      setStatus(t('backupFolderFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function onClearFolder() {
    setBusy(true)
    try {
      await clearBackupFolder()
      setFolderName(null)
      setStatus(t('backupFolderCleared'))
    } finally {
      setBusy(false)
    }
  }

  async function onSyncNow() {
    setBusy(true)
    setStatus(null)
    try {
      if (gistToken.trim()) {
        saveGistSettings({
          token: gistToken,
          gistId,
          enabled: cloudOn || Boolean(gistId && gistToken),
        })
      }
      const result = await notebookStore.syncDurableNow()
      const parts: string[] = []
      if (result.gistId) {
        setGistId(result.gistId)
        setCloudOn(true)
        setLastSyncedAt(new Date().toISOString())
        parts.push(t('backupSyncGistOk', { id: result.gistId }))
      } else if (result.gistError) {
        parts.push(t('backupSyncGistFail', { error: result.gistError }))
      }
      if (result.folder) parts.push(t('backupSyncFolderOk'))
      else if (folderName) parts.push(t('backupSyncFolderMiss'))
      if (!parts.length) parts.push(t('backupSyncNothing'))
      setStatus(parts.join(' '))
    } finally {
      setBusy(false)
    }
  }

  async function onPullRemote() {
    setBusy(true)
    setStatus(null)
    try {
      if (gistToken.trim() && gistId.trim()) {
        saveGistSettings({ token: gistToken, gistId, enabled: true })
      }
      const result = await notebookStore.pullRemoteBackups()
      if (result.fromFolder || result.fromGist) {
        if (result.fromGist) {
          setCloudOn(true)
          setLastSyncedAt(new Date().toISOString())
        }
        setStatus(
          t('backupPullOk', {
            total: result.total,
            sources: [
              result.fromGist ? t('backupSourceGist') : '',
              result.fromFolder ? t('backupSourceFolder') : '',
            ]
              .filter(Boolean)
              .join(' + '),
          }),
        )
      } else {
        setStatus(t('backupPullNone'))
      }
    } catch {
      setStatus(t('backupPullNone'))
    } finally {
      setBusy(false)
    }
  }

  function onExportNotes() {
    const json = notebookStore.exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ownlab-notebook-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus(t('backupExportDone'))
  }

  async function onRecoveryDump() {
    setBusy(true)
    setStatus(null)
    try {
      const dump = await notebookStore.dumpRecoveryStorage()
      const blob = new Blob([dump.json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ownlab-recovery-dump-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      if (dump.entryCount > 0) {
        await notebookStore.importBackup(dump.json)
        setStatus(
          t('recoveryDumpFound', {
            count: dump.entryCount,
            sources: dump.sources.join(', ') || 'storage',
          }),
        )
      } else {
        setStatus(t('recoveryDumpEmpty'))
      }
    } catch {
      setStatus(t('recoveryDumpFail'))
    } finally {
      setBusy(false)
    }
  }

  async function onImportFile(file: File | null) {
    if (!file) return
    setBusy(true)
    setStatus(null)
    try {
      const text = await file.text()
      const result = await notebookStore.importBackup(text)
      setStatus(t('recoverNotesFound', { restored: result.total, total: result.total }))
    } catch {
      setStatus(t('recoverNotesNone'))
    } finally {
      setBusy(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  return (
    <section className="notebook-backup" aria-label={t('backupTitle')}>
      <p className="notebook-backup-intro">{t('backupIntro')}</p>

      {status ? (
        <p className="notebook-recover-status" role="status">
          {status}
        </p>
      ) : null}

      <div className={`notebook-backup-card cloud${cloudOn ? ' on' : ''}`}>
        <div className="notebook-backup-card-head">
          <h3>{t('cloudTitle')}</h3>
          {cloudOn ? <span className="notebook-cloud-badge">{t('cloudStatusOn')}</span> : null}
        </div>
        <p>{t('cloudBody')}</p>
        <ol className="notebook-cloud-steps">
          <li>
            {t('cloudStep1')}{' '}
            <a href={GIST_TOKEN_CREATE_URL} target="_blank" rel="noreferrer">
              {t('cloudCreateToken')}
            </a>
          </li>
          <li>{t('cloudStep2')}</li>
          <li>{t('cloudStep3')}</li>
        </ol>

        <label className="notebook-field">
          <span className="notebook-field-label">{t('backupGistToken')}</span>
          <input
            className="notebook-title-input"
            type="password"
            autoComplete="off"
            value={gistToken}
            onChange={(e) => setGistToken(e.target.value)}
            placeholder="ghp_…"
          />
        </label>
        <label className="notebook-field">
          <span className="notebook-field-label">{t('cloudNotebookId')}</span>
          <input
            className="notebook-title-input"
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder={t('cloudNotebookIdPlaceholder')}
          />
        </label>

        <p className="notebook-backup-meta">
          {cloudOn
            ? t('cloudLastSynced', { time: formatSyncTime(lastSyncedAt) })
            : t('cloudStatusOff')}
        </p>

        <div className="notebook-actions">
          <button type="button" className="btn primary" disabled={busy} onClick={() => void onEnableCloud()}>
            {cloudOn ? t('cloudUploadNow') : t('cloudEnable')}
          </button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void onConnectCloud()}>
            {t('cloudConnectDevice')}
          </button>
          {gistId ? (
            <button type="button" className="btn ghost" disabled={busy} onClick={() => void onCopyCloudId()}>
              {copied ? t('cloudCopied') : t('cloudCopyId')}
            </button>
          ) : null}
          {cloudOn ? (
            <button type="button" className="btn ghost" disabled={busy} onClick={onDisableCloud}>
              {t('cloudDisable')}
            </button>
          ) : null}
        </div>

        {cloudOn && gistId ? (
          <p className="notebook-cloud-other-device">{t('cloudOtherDeviceHint', { id: gistId })}</p>
        ) : null}
      </div>

      <div className="notebook-backup-card">
        <h3>{t('backupActionsTitle')}</h3>
        <p>{t('backupActionsBody')}</p>
        <p className="notebook-backup-meta">{t('recoveryDumpHint')}</p>
        <div className="notebook-actions">
          <button type="button" className="btn primary" disabled={busy} onClick={() => void onRecoveryDump()}>
            {t('recoveryDump')}
          </button>
          <button type="button" className="btn primary" disabled={busy} onClick={() => void onSyncNow()}>
            {t('backupSyncNow')}
          </button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void onPullRemote()}>
            {t('backupPullNow')}
          </button>
          <button type="button" className="btn ghost" disabled={busy} onClick={onExportNotes}>
            {t('exportNotes')}
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={busy}
            onClick={() => importInputRef.current?.click()}
          >
            {t('importNotes')}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="notebook-backup-card">
        <h3>{t('backupPersistTitle')}</h3>
        <p>{t('backupPersistBody')}</p>
        <p className="notebook-backup-meta">
          {persistState === 'granted'
            ? t('backupPersistStatusOn')
            : persistState === 'unsupported'
              ? t('backupPersistUnsupported')
              : t('backupPersistStatusOff')}
        </p>
        {persistState !== 'granted' && persistState !== 'unsupported' ? (
          <button type="button" className="btn primary" disabled={busy} onClick={() => void onRequestPersist()}>
            {t('backupPersistEnable')}
          </button>
        ) : null}
      </div>

      <div className="notebook-backup-card">
        <h3>{t('backupFolderTitle')}</h3>
        <p>{t('backupFolderBody')}</p>
        {!folderSupported ? (
          <p className="notebook-backup-meta">{t('backupFolderUnsupported')}</p>
        ) : (
          <>
            <p className="notebook-backup-meta">
              {folderName
                ? t('backupFolderCurrent', { name: folderName })
                : t('backupFolderNone')}
            </p>
            <div className="notebook-actions">
              <button type="button" className="btn primary" disabled={busy} onClick={() => void onPickFolder()}>
                {folderName ? t('backupFolderChange') : t('backupFolderPick')}
              </button>
              {folderName ? (
                <button type="button" className="btn ghost" disabled={busy} onClick={() => void onClearFolder()}>
                  {t('backupFolderClear')}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
