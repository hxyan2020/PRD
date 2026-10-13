import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { notebookStore } from '../hooks/notebookStore'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildPublicNotesHtml,
  downloadPublicNotesHtml,
  openPublicNotesHtml,
} from '../lib/notebookPublicHtml'
import { getCloudSyncStatus, loadGistSettings } from '../lib/notebookGistSync'

type PullSummary = {
  localBefore: number
  cloudCount: number
  total: number
  switchedGist: boolean
  error?: string
  ok: boolean
}

async function pullRichestCloud(): Promise<PullSummary> {
  return notebookStore.pullCloudForExport()
}

/**
 * Build a public, copy-friendly HTML of all notebook notes (images embedded).
 * Auto-pulls the richest cloud notebook on open so a phone with a partial local
 * cache (e.g. 8 notes) still exports the full set (e.g. 15).
 */
export function NotesPublicHtml() {
  const { t, lang } = useLanguage()
  const { ready, entries, categories, count } = useNotebook()
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudCount, setCloudCount] = useState<number | null>(null)
  const [localBefore, setLocalBefore] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const tRef = useRef(t)
  tRef.current = t

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

  function applyPullResult(result: PullSummary, translate = t) {
    setLocalBefore(result.localBefore)
    setCloudCount(result.cloudCount)
    setCloudReady(true)
    if (!result.ok) {
      setStatus(result.error || translate('publicHtmlCloudFail'))
      return
    }
    if (result.switchedGist) {
      setStatus(
        translate('publicHtmlSwitchedGist', {
          before: result.localBefore,
          cloud: result.cloudCount,
          total: result.total,
        }),
      )
    } else if (result.cloudCount > result.localBefore) {
      setStatus(
        translate('publicHtmlMergedMore', {
          before: result.localBefore,
          cloud: result.cloudCount,
          total: result.total,
        }),
      )
    } else if (result.total < result.cloudCount) {
      setStatus(
        translate('publicHtmlStillShort', { total: result.total, cloud: result.cloudCount }),
      )
    } else {
      setStatus(translate('publicHtmlCloudPulled', { total: result.total }))
    }
  }

  async function refreshFromCloud() {
    setBusy(true)
    setStatus(null)
    try {
      if (!loadGistSettings().token) {
        setCloudReady(true)
        setStatus(t('publicHtmlNeedCloud'))
        return
      }
      applyPullResult(await pullRichestCloud())
    } catch (err) {
      setCloudReady(true)
      setStatus(err instanceof Error ? err.message : t('publicHtmlCloudFail'))
    } finally {
      setBusy(false)
    }
  }

  // Auto-pull richest cloud notebook when the page becomes ready.
  // Do not gate on a ref — React Strict Mode remounts would skip the real pull
  // and leave the phone stuck on its partial local cache (e.g. 8 of 15).
  useEffect(() => {
    if (!ready) return
    if (!loadGistSettings().token) {
      setCloudReady(true)
      return
    }
    let cancelled = false
    setBusy(true)
    setCloudReady(false)
    void pullRichestCloud()
      .then((result) => {
        if (cancelled) return
        applyPullResult(result, tRef.current)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCloudReady(true)
        setStatus(err instanceof Error ? err.message : tRef.current('publicHtmlCloudFail'))
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [ready])

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
  const hasToken = Boolean(loadGistSettings().token)
  const waitingOnCloud = hasToken && !cloudReady
  const actionsDisabled = !ready || busy || waitingOnCloud || count === 0

  return (
    <div className="notes-public-page">
      <header className="notes-public-hero">
        <p className="eyebrow">
          <Link to="/notebook">{t('publicHtmlBack')}</Link>
        </p>
        <h1>{t('publicHtmlTitle')}</h1>
        <p>{t('publicHtmlBody')}</p>
        <p className="notes-public-count">
          {!ready || waitingOnCloud
            ? t('publicHtmlLoadingCloud')
            : t('publicHtmlCountDetail', {
                n: count,
                cloud: cloudCount ?? '—',
                before: localBefore ?? count,
              })}
          {cloud.configured || hasToken ? ` · ${t('cloudSynced')}` : ''}
        </p>
      </header>

      <div className="notes-public-actions">
        <button type="button" className="btn primary" disabled={actionsDisabled} onClick={onOpen}>
          {waitingOnCloud || busy ? t('cloudSyncing') : t('publicHtmlOpen')}
        </button>
        <button type="button" className="btn" disabled={actionsDisabled} onClick={onDownload}>
          {t('publicHtmlDownload')}
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={!ready || busy || !hasToken}
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

      {cloudReady && cloudCount != null && count < cloudCount ? (
        <p className="notebook-composer-error" role="alert">
          {t('publicHtmlStillShort', { total: count, cloud: cloudCount })}
        </p>
      ) : null}

      <section className="notes-public-help" aria-label={t('publicHtmlHowTitle')}>
        <h2>{t('publicHtmlHowTitle')}</h2>
        <ol>
          <li>{t('publicHtmlHow1')}</li>
          <li>{t('publicHtmlHow2')}</li>
          <li>{t('publicHtmlHow3')}</li>
        </ol>
        <p className="notes-public-help-note">{t('publicHtmlHowCloud')}</p>
      </section>

      {count > 0 && previewHtml && !waitingOnCloud ? (
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
