import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { notebookStore } from '../hooks/notebookStore'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildPublicNotesHtml,
  downloadPublicNotesHtml,
  openPublicNotesHtml,
} from '../lib/notebookPublicHtml'
import {
  GIST_TOKEN_CREATE_URL,
  loadGistSettings,
  saveGistSettings,
  verifyGistToken,
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

const COPY_FILE = 'ownlab-notes-copy.html'

async function fetchPublicCopyHtml(gistId: string): Promise<string> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!response.ok) {
    throw new Error(`Could not open shared notes (${response.status})`)
  }
  const data = (await response.json()) as {
    files?: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>
  }
  const file = data.files?.[COPY_FILE] || Object.values(data.files || {})[0]
  if (!file) throw new Error('Shared notes file missing')
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url)
    if (!raw.ok) throw new Error('Could not download full shared notes')
    return raw.text()
  }
  if (!file.content) throw new Error('Shared notes are empty')
  return file.content
}

function sharePageUrl(gistId: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/notes-html?gist=${encodeURIComponent(gistId)}`
}

/**
 * Recover notes from cloud/local and send a shareable OWNLAB copy link.
 * Also opens shared links: #/notes-html?gist=<publicGistId>
 */
export function NotesPublicHtml() {
  const { t, lang } = useLanguage()
  const { ready, entries, categories, count } = useNotebook()
  const [searchParams] = useSearchParams()
  const sharedGistId = searchParams.get('gist')?.trim() || ''

  const [token, setToken] = useState(() => loadGistSettings().token)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudCount, setCloudCount] = useState<number | null>(null)
  const [localBefore, setLocalBefore] = useState<number | null>(null)
  const [gistSummaries, setGistSummaries] = useState<OwnlabGistMatch[]>([])
  const [publicLink, setPublicLink] = useState<string | null>(null)
  const [sharedHtml, setSharedHtml] = useState<string>('')
  const [sharedError, setSharedError] = useState<string | null>(null)
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

  // Viewer mode: open a public copy link without needing a token.
  useEffect(() => {
    if (!sharedGistId) return
    let cancelled = false
    setSharedError(null)
    setBusy(true)
    void fetchPublicCopyHtml(sharedGistId)
      .then((doc) => {
        if (cancelled) return
        setSharedHtml(doc)
        setStatus(tRef.current('publicHtmlSharedLoaded'))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSharedError(err instanceof Error ? err.message : tRef.current('publicHtmlSharedFail'))
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [sharedGistId])

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
    } else {
      setStatus(translate('publicHtmlCloudPulled', { total: result.total }))
    }
  }

  useEffect(() => {
    if (!ready || sharedGistId) return
    if (!loadGistSettings().token) {
      setCloudReady(true)
      return
    }
    let cancelled = false
    setBusy(true)
    setCloudReady(false)
    void notebookStore
      .pullCloudForExport()
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
  }, [ready, sharedGistId])

  async function recoverAndSendLink() {
    setBusy(true)
    setStatus(null)
    setPublicLink(null)
    try {
      const trimmed = token.trim()
      if (!trimmed) {
        setStatus(t('cloudTokenRequired'))
        return
      }
      await verifyGistToken(trimmed)
      saveGistSettings({ token: trimmed, enabled: true })
      const pulled = await notebookStore.pullCloudForExport()
      applyPullResult(pulled)

      const latest = notebookStore.get()
      const cats = notebookStore.getCategories()
      if (latest.length === 0) {
        setStatus(t('publicHtmlNoNotes'))
        return
      }
      const doc = buildPublicNotesHtml(latest, cats, {
        lang,
        title: lang === 'zh' ? 'OWNLAB 笔记' : 'OWNLAB notes',
      })
      const published = await notebookStore.publishNotesPublicLink(doc)
      const link = sharePageUrl(published.gistId)
      setPublicLink(link)
      setStatus(t('publicHtmlPublished', { n: published.noteCount }))
      try {
        await navigator.clipboard.writeText(link)
      } catch {
        /* ignore */
      }
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'OWNLAB notes',
            text: t('publicHtmlShareText', { n: published.noteCount }),
            url: link,
          })
        } catch {
          /* user cancelled share sheet */
        }
      }
    } catch (err) {
      setCloudReady(true)
      setStatus(err instanceof Error ? err.message : t('publicHtmlPublishFail'))
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!publicLink) return
    try {
      await navigator.clipboard.writeText(publicLink)
      setStatus(t('publicHtmlLinkCopied'))
    } catch {
      setStatus(t('publicHtmlLinkCopyFail'))
    }
  }

  async function shareLink() {
    if (!publicLink || typeof navigator.share !== 'function') return
    try {
      await navigator.share({
        title: 'OWNLAB notes',
        text: t('publicHtmlShareText', { n: count }),
        url: publicLink,
      })
    } catch {
      /* cancelled */
    }
  }

  // Shared-viewer mode
  if (sharedGistId) {
    return (
      <div className="notes-public-page">
        <header className="notes-public-hero">
          <p className="eyebrow">
            <Link to="/notebook">{t('publicHtmlBack')}</Link>
          </p>
          <h1>{t('publicHtmlSharedTitle')}</h1>
          <p>{t('publicHtmlSharedBody')}</p>
        </header>
        {busy ? <p className="notes-public-count">{t('publicHtmlLoadingCloud')}</p> : null}
        {sharedError ? (
          <p className="notebook-composer-error" role="alert">
            {sharedError}
          </p>
        ) : null}
        {status ? (
          <p className="notebook-recover-status" role="status">
            {status}
          </p>
        ) : null}
        {sharedHtml ? (
          <iframe
            title={t('publicHtmlSharedTitle')}
            className="notes-public-frame notes-public-frame-tall"
            sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
            srcDoc={sharedHtml}
          />
        ) : null}
      </div>
    )
  }

  const hasToken = Boolean(loadGistSettings().token || token.trim())
  const waitingOnCloud = Boolean(loadGistSettings().token) && !cloudReady

  return (
    <div className="notes-public-page">
      <header className="notes-public-hero">
        <p className="eyebrow">
          <Link to="/notebook">{t('publicHtmlBack')}</Link>
        </p>
        <h1>{t('publicHtmlSendTitle')}</h1>
        <p>{t('publicHtmlSendBody')}</p>
        <p className="notes-public-count">
          {!ready || waitingOnCloud
            ? t('publicHtmlLoadingCloud')
            : t('publicHtmlCountDetail', {
                n: count,
                cloud: cloudCount ?? '—',
                before: localBefore ?? count,
              })}
        </p>
      </header>

      <section className="notes-public-send" aria-label={t('publicHtmlSendTitle')}>
        <label className="notebook-field">
          <span className="notebook-field-label">{t('backupGistToken')}</span>
          <input
            className="notebook-title-input"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_…"
          />
        </label>
        <p className="notebook-cloud-token-hint">
          {t('cloudStep1')}{' '}
          <a href={GIST_TOKEN_CREATE_URL} target="_blank" rel="noreferrer">
            {t('cloudCreateToken')}
          </a>
          {t('cloudTokenHintSuffix')}
        </p>
        <div className="notes-public-actions">
          <button
            type="button"
            className="btn primary"
            disabled={!ready || busy || !token.trim()}
            onClick={() => void recoverAndSendLink()}
          >
            {busy ? t('cloudSyncing') : t('publicHtmlSendCta')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!ready || busy || count === 0}
            onClick={() => {
              downloadPublicNotesHtml(html)
              setStatus(t('publicHtmlDownloaded', { n: count }))
            }}
          >
            {t('publicHtmlDownload')}
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={!ready || busy || count === 0}
            onClick={() => openPublicNotesHtml(html)}
          >
            {t('publicHtmlOpen')}
          </button>
        </div>
      </section>

      {publicLink ? (
        <section className="notes-public-link-card" aria-label={t('publicHtmlLinkLabel')}>
          <h2>{t('publicHtmlLinkReady')}</h2>
          <p className="notes-public-link">
            <a href={publicLink} target="_blank" rel="noreferrer">
              {publicLink}
            </a>
          </p>
          <div className="notes-public-actions">
            <a className="btn primary" href={publicLink} target="_blank" rel="noreferrer">
              {t('publicHtmlOpenLink')}
            </a>
            <button type="button" className="btn" onClick={() => void copyLink()}>
              {t('publicHtmlCopyLink')}
            </button>
            {typeof navigator.share === 'function' ? (
              <button type="button" className="btn ghost" onClick={() => void shareLink()}>
                {t('publicHtmlShareLink')}
              </button>
            ) : null}
          </div>
        </section>
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
              </li>
            ))}
          </ul>
          <p className="notes-public-help-note">{t('publicHtmlGistsHint')}</p>
        </section>
      ) : null}

      {!hasToken ? (
        <p className="notebook-composer-error" role="alert">
          {t('publicHtmlNeedCloud')}
        </p>
      ) : null}

      <section className="notes-public-help" aria-label={t('publicHtmlHowTitle')}>
        <h2>{t('publicHtmlHowTitle')}</h2>
        <ol>
          <li>{t('publicHtmlSendHow1')}</li>
          <li>{t('publicHtmlSendHow2')}</li>
          <li>{t('publicHtmlSendHow3')}</li>
        </ol>
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
