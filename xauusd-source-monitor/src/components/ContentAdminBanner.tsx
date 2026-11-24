import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { CONTENT_ADMIN } from '../auth/users'
import { useLocale } from '../i18n/locale'
import {
  loadContentRaises,
  openContentRaises,
  raiseContentChange,
  resolveContentRaise,
  type ContentRaiseSurface,
} from '../copilot/storage'

/** View-only raise form for operators + pending inbox for Yan Haixiang. */
export function ContentAdminBanner({ surface }: { surface: ContentRaiseSurface }) {
  const { user, canEditContent } = useAuth()
  const [tick, setTick] = useState(0)
  const raises = useMemo(() => {
    void tick
    return loadContentRaises().filter((r) => r.surface === surface)
  }, [surface, tick])
  const open = raises.filter((r) => r.status === 'open')

  if (canEditContent) {
    return (
      <AdminRaiseInbox
        surface={surface}
        open={open}
        onRefresh={() => setTick(Date.now())}
      />
    )
  }

  return (
    <OperatorRaisePanel
      surface={surface}
      openCount={open.filter((r) => r.raisedByEmail === user?.email.toLowerCase()).length}
      onSubmitted={() => setTick(Date.now())}
    />
  )
}

function OperatorRaisePanel({
  surface,
  openCount,
  onSubmitted,
}: {
  surface: ContentRaiseSurface
  openCount: number
  onSubmitted: () => void
}) {
  const { t } = useLocale()
  const { user } = useAuth()
  const [summary, setSummary] = useState('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [doneId, setDoneId] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!user) {
      setError(t('authFailed'))
      return
    }
    try {
      const row = raiseContentChange({
        surface,
        summary,
        detail,
        raisedByEmail: user.email,
        raisedByName: user.name,
      })
      setSummary('')
      setDetail('')
      setDoneId(row.id)
      onSubmitted()
    } catch {
      setError(t('adminRaiseNeedSummary'))
    }
  }

  return (
    <aside className="admin-gate-banner admin-raise-panel" role="region" aria-label={t('adminRaiseTitle')}>
      <div className="admin-raise-copy">
        <p className="admin-gate-text">{t('adminOnlyWrite')}</p>
        <p className="sub">
          {t('adminRaiseHint').replace('{admin}', CONTENT_ADMIN.name)}
          {openCount > 0
            ? ` · ${t('adminRaiseYourOpen').replace('{n}', String(openCount))}`
            : ''}
        </p>
      </div>
      <form className="admin-raise-form" onSubmit={onSubmit}>
        <label className="std-field full">
          <span>{t('adminRaiseSummary')}</span>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t('adminRaiseSummaryPh')}
            required
          />
        </label>
        <label className="std-field full">
          <span>{t('adminRaiseDetail')}</span>
          <textarea
            rows={3}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t('adminRaiseDetailPh')}
          />
        </label>
        {error ? <p className="feed-error">{error}</p> : null}
        {doneId ? (
          <p className="sub">{t('adminRaiseSubmitted').replace('{id}', doneId)}</p>
        ) : null}
        <button type="submit" className="archive-btn primary-archive">
          {t('adminRaiseSubmit')}
        </button>
      </form>
    </aside>
  )
}

function AdminRaiseInbox({
  surface,
  open,
  onRefresh,
}: {
  surface: ContentRaiseSurface
  open: ReturnType<typeof openContentRaises>
  onRefresh: () => void
}) {
  const { t } = useLocale()
  const { user } = useAuth()
  if (!open.length) {
    return (
      <aside className="admin-gate-banner admin-raise-inbox quiet" role="status">
        <p className="admin-gate-text">{t('adminRaiseInboxEmpty')}</p>
      </aside>
    )
  }

  return (
    <aside className="admin-gate-banner admin-raise-inbox" role="region" aria-label={t('adminRaiseInboxTitle')}>
      <p className="admin-gate-text">
        {t('adminRaiseInboxTitle').replace('{n}', String(open.length))}
      </p>
      <ul className="admin-raise-list">
        {open.map((r) => (
          <li key={r.id} className="admin-raise-item">
            <div>
              <strong>{r.summary}</strong>
              <p className="sub">
                {r.raisedByName} · {r.raisedByEmail} ·{' '}
                {new Date(r.createdAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT
                · {r.id}
              </p>
              {r.detail ? <p className="admin-raise-detail">{r.detail}</p> : null}
            </div>
            <div className="std-card-actions">
              <button
                type="button"
                className="archive-btn primary-archive"
                onClick={() => {
                  if (!user) return
                  resolveContentRaise(r.id, 'done', { email: user.email })
                  onRefresh()
                }}
              >
                {t('adminRaiseMarkDone')}
              </button>
              <button
                type="button"
                className="archive-btn"
                onClick={() => {
                  if (!user) return
                  resolveContentRaise(r.id, 'dismissed', { email: user.email })
                  onRefresh()
                }}
              >
                {t('adminRaiseDismiss')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="sub">{t('adminRaiseInboxHint').replace('{surface}', surface)}</p>
    </aside>
  )
}
