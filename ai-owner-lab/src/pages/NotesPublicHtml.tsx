import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { notebookStore } from '../hooks/notebookStore'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildPublicNotesHtml,
  downloadPublicNotesHtml,
  openPublicNotesHtml,
} from '../lib/notebookPublicHtml'
import { getCloudSyncStatus, loadGistSettings, pullGistBackup } from '../lib/notebookGistSync'

/**
 * Build a public, copy-friendly HTML of all notebook notes (images embedded).
 * Uses local notes, optionally refreshing from cloud first.
 */
export function NotesPublicHtml() {
  const { t, lang } = useLanguage()
  const { ready, entries, categories, count } = useNotebook()
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')

  const html = useMemo(() => {
    if (!ready) return ''
    return buildPublicNotesHtml(entries, categories, {
      lang,
      title: lang === 'zh' ? 'OWNLAB 笔记' : 'OWNLAB notes',
    })
  }, [ready, entries, categories, lang])

  useEffect(() => {
    setPreviewHtml(html)
  }, [html])

  async function refreshFromCloud() {
    setBusy(true)
    setStatus(null)
    try {
      const settings = loadGistSettings()
      if (!settings.token || !settings.gistId) {
        setStatus(t('publicHtmlNeedCloud'))
        return
      }
      const gistJson = await pullGistBackup(settings)
      if (!gistJson) {
        setStatus(t('publicHtmlCloudEmpty'))
        return
      }
      const result = await notebookStore.importBackup(gistJson, { syncCloud: false })
      setStatus(t('publicHtmlCloudPulled', { total: result.total }))
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t('publicHtmlCloudFail'))
    } finally {
      setBusy(false)
    }
  }

  function onDownload() {
    if (!html || count === 0) {
      setStatus(t('publicHtmlNoNotes'))
      return
    }
    downloadPublicNotesHtml(html)
    setStatus(t('publicHtmlDownloaded', { n: count }))
  }

  function onOpen() {
    if (!html || count === 0) {
      setStatus(t('publicHtmlNoNotes'))
      return
    }
    openPublicNotesHtml(html)
    setStatus(t('publicHtmlOpened', { n: count }))
  }

  const cloud = getCloudSyncStatus()

  return (
    <div className="notes-public-page">
      <header className="notes-public-hero">
        <p className="eyebrow">
          <Link to="/notebook">{t('publicHtmlBack')}</Link>
        </p>
        <h1>{t('publicHtmlTitle')}</h1>
        <p>{t('publicHtmlBody')}</p>
        <p className="notes-public-count">
          {ready ? t('publicHtmlCount', { n: count }) : t('publicHtmlLoading')}
          {cloud.configured ? ` · ${t('cloudSynced')}` : ''}
        </p>
      </header>

      <div className="notes-public-actions">
        <button type="button" className="btn primary" disabled={!ready || busy || count === 0} onClick={onOpen}>
          {t('publicHtmlOpen')}
        </button>
        <button type="button" className="btn" disabled={!ready || busy || count === 0} onClick={onDownload}>
          {t('publicHtmlDownload')}
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={!ready || busy || !cloud.configured}
          onClick={() => void refreshFromCloud()}
        >
          {busy ? t('cloudSyncing') : t('publicHtmlPullCloud')}
        </button>
      </div>

      {status ? (
        <p className="notebook-recover-status" role="status">
          {status}
        </p>
      ) : null}

      <section className="notes-public-help" aria-label={t('publicHtmlHowTitle')}>
        <h2>{t('publicHtmlHowTitle')}</h2>
        <ol>
          <li>{t('publicHtmlHow1')}</li>
          <li>{t('publicHtmlHow2')}</li>
          <li>{t('publicHtmlHow3')}</li>
        </ol>
      </section>

      {count > 0 && previewHtml ? (
        <section className="notes-public-preview" aria-label={t('publicHtmlPreview')}>
          <h2>{t('publicHtmlPreview')}</h2>
          <iframe
            title={t('publicHtmlPreview')}
            className="notes-public-frame"
            sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
            srcDoc={previewHtml}
          />
        </section>
      ) : null}
    </div>
  )
}
