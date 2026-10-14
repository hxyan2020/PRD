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
import {
  getCloudSyncStatus,
  loadGistSettings,
  type OwnlabGistMatch,
} from '../lib/notebookGistSync'

type PullSummary = {
  localBefore: number
  cloudCount: number
  total: number
  switchedGist: boolean
  gistSummaries?: OwnlabGistMatch[]
  error?: string
  ok: boolean
}

async function pullUnionCloud(): Promise<PullSummary> {
  return notebookStore.pullCloudForExport()
}

/**
 * Build a public, copy-friendly HTML of all notebook notes (images embedded).
 * Auto-merges every OWNLAB cloud gist + local snapshots, then can publish a
 * public GitHub link so notes are reachable on any phone.
 */
export function NotesPublicHtml() {
  const { t, lang } = useLanguage()
  const { ready, entries, categories, count } = useNotebook()
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudCount, setCloudCount] = useState<number | null>(null)
  const [localBefore, setLocalBefore] = useState<number | null>(null)
  const [gistSummaries, setGistSummaries] = useState<OwnlabGistMatch[]>([])
  const [publicLink, setPublicLink] = useState<string | null>(null)
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
    setGistSummaries(result.gistSummaries ?? [])
    setCloudReady(true)
    if (!result.ok && result.error) {
      setStatus(result.error)
      return
    }
    if ((result.gistSummaries?.length ?? 0) > 1) {
      setStatus(
        translate('publicHtmlMergedGists', {
          gists: result.gistSummaries!.length,
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
    } else if (result.switchedGist) {
      setStatus(
        translate('publicHtmlSwitchedGist', {
          before: result.localBefore,
          cloud: result.cloudCount,
          total: result.total,
        }),
      )
    } else {
      setStatus(translate('publicHtmlCloudPulled', { total: result.total }))
    }
  }

  async function refreshFromCloud() {
    setBusy(true)
    setStatus(null)
    setPublicLink(null)
    try {
      if (!loadGistSettings().token) {
        setCloudReady(true)
        setStatus(t('publicHtmlNeedCloud'))
        return
      }
      applyPullResult(await pullUnionCloud())
    } catch (err) {
      setCloudReady(true)
      setStatus(err instanceof Error ? err.message : t('publicHtmlCloudFail'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!ready) return
    if (!loadGistSettings().token) {
      setCloudReady(true)
      return
    }
    let cancelled = false
    setBusy(true)
    setCloudReady(false)
    void pullUnionCloud()
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

  async function onPublishLink() {
    if (!html || count === 0) {
      setStatus(t('publicHtmlNoNotes'))
      return
    }
    setPublishing(true)
    setStatus(null)
    try {
      const published = await notebookStore.publishNotesPublicLink(html)
      const link = published.rawUrl || published.htmlUrl
      setPublicLink(link)
      setStatus(t('publicHtmlPublished', { n: published.noteCount }))
      try {
        await navigator.clipboard.writeText(link)
      } catch {
        /* user can copy from the visible link */
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t('publicHtmlPublishFail'))
    } finally {
      setPublishing(false)
    }
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
          className="btn primary"
          disabled={actionsDisabled || publishing}
          onClick={() => void onPublishLink()}
        >
          {publishing ? t('cloudSyncing') : t('publicHtmlPublish')}
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

      {publicLink ? (
        <p className="notes-public-link" role="status">
          {t('publicHtmlLinkLabel')}{' '}
          <a href={publicLink} target="_blank" rel="noreferrer">
            {publicLink}
          </a>
        </p>
      ) : null}

      {status ? (
        <p className="notebook-recover-status" role="status">
          {status}
        </p>
      ) : null}

      {gistSummaries.length > 0 ? (
        <section className="notes-public-gists" aria-label={t('publicHtmlGistsTitle')}>
          <h2>{t('publicHtmlGistsTitle')}</h2>
          <ul>
            {gistSummaries.map((g) => (
              <li key={g.gistId}>
                <code>{g.gistId.slice(0, 12)}…</code> — {t('publicHtmlGistCount', { n: g.noteCount })}
                {g.htmlUrl ? (
                  <>
                    {' '}
                    <a href={g.htmlUrl} target="_blank" rel="noreferrer">
                      gist
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="notes-public-help-note">{t('publicHtmlGistsHint')}</p>
        </section>
      ) : null}

      {cloudReady &&
      cloudCount != null &&
      count > 0 &&
      gistSummaries.length > 0 &&
      Math.max(...gistSummaries.map((g) => g.noteCount), 0) === cloudCount &&
      cloudCount === count ? (
        <p className="notebook-composer-error" role="alert">
          {t('publicHtmlCloudOnlyPartial', { cloud: cloudCount, total: count })}
        </p>
      ) : null}

      <section className="notes-public-help" aria-label={t('publicHtmlHowTitle')}>
        <h2>{t('publicHtmlHowTitle')}</h2>
        <ol>
          <li>{t('publicHtmlHow1')}</li>
          <li>{t('publicHtmlHow2')}</li>
          <li>{t('publicHtmlHow3')}</li>
          <li>{t('publicHtmlHow4')}</li>
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
