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
import { loadGistSettings, saveGistSettings } from '../lib/notebookGistSync'

export function NotebookBackupPanel() {
  const { t } = useLanguage()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [persistState, setPersistState] = useState<'granted' | 'prompt' | 'unsupported'>('prompt')
  const [folderName, setFolderName] = useState<string | null>(null)
  const [folderSupported] = useState(() => folderBackupSupported())
  const [gistToken, setGistToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [gistEnabled, setGistEnabled] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getPersistentStorageState().then(setPersistState)
    void getBackupFolderName().then(setFolderName)
    const gist = loadGistSettings()
    setGistToken(gist.token)
    setGistId(gist.gistId)
    setGistEnabled(gist.enabled)
  }, [])

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

  function onSaveGist() {
    const next = saveGistSettings({
      token: gistToken,
      gistId,
      enabled: gistEnabled,
    })
    setGistToken(next.token)
    setGistId(next.gistId)
    setGistEnabled(next.enabled)
    setStatus(t('backupGistSaved'))
  }

  async function onSyncNow() {
    setBusy(true)
    setStatus(null)
    try {
      saveGistSettings({ token: gistToken, gistId, enabled: gistEnabled })
      const result = await notebookStore.syncDurableNow()
      const parts: string[] = []
      if (result.folder) parts.push(t('backupSyncFolderOk'))
      else if (folderName) parts.push(t('backupSyncFolderMiss'))
      if (result.gistId) {
        setGistId(result.gistId)
        parts.push(t('backupSyncGistOk', { id: result.gistId }))
      } else if (gistEnabled && result.gistError) {
        parts.push(t('backupSyncGistFail', { error: result.gistError }))
      } else if (!gistEnabled && !result.folder) {
        parts.push(t('backupSyncNothing'))
      }
      setStatus(parts.join(' '))
    } finally {
      setBusy(false)
    }
  }

  async function onPullRemote() {
    setBusy(true)
    setStatus(null)
    try {
      saveGistSettings({ token: gistToken, gistId, enabled: gistEnabled })
      const result = await notebookStore.pullRemoteBackups()
      if (result.fromFolder || result.fromGist) {
        setStatus(
          t('backupPullOk', {
            total: result.total,
            sources: [result.fromFolder ? t('backupSourceFolder') : '', result.fromGist ? t('backupSourceGist') : '']
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

      <div className="notebook-backup-card">
        <h3>{t('backupGistTitle')}</h3>
        <p>{t('backupGistBody')}</p>
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
          <span className="notebook-field-label">{t('backupGistId')}</span>
          <input
            className="notebook-title-input"
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder={t('backupGistIdPlaceholder')}
          />
        </label>
        <label className="notebook-backup-check">
          <input
            type="checkbox"
            checked={gistEnabled}
            onChange={(e) => setGistEnabled(e.target.checked)}
          />
          <span>{t('backupGistEnable')}</span>
        </label>
        <div className="notebook-actions">
          <button type="button" className="btn ghost" disabled={busy} onClick={onSaveGist}>
            {t('backupGistSave')}
          </button>
        </div>
      </div>

      <div className="notebook-backup-card">
        <h3>{t('backupActionsTitle')}</h3>
        <p>{t('backupActionsBody')}</p>
        <div className="notebook-actions">
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
    </section>
  )
}
