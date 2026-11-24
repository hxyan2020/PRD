import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useLocale } from '../i18n/locale'
import {
  buildPeriodicDigest,
  loadHistory,
  loadPeriodicDigests,
  savePeriodicDigest,
  weeklyOptimisationCandidates,
  type PeriodicDigest,
} from '../copilot/storage'
import type { IncidentRecord } from '../copilot/types'

function refreshMs() {
  return Date.now()
}

export function StatsPage() {
  const { t } = useLocale()
  const location = useLocation()
  const [tick, setTick] = useState(refreshMs)
  const [openDigestId, setOpenDigestId] = useState<string | null>(null)
  const [openWeeklyId, setOpenWeeklyId] = useState<string | null>(null)
  const history = useMemo(() => {
    void tick
    return loadHistory()
  }, [tick])
  const digests = useMemo(() => {
    void tick
    return loadPeriodicDigests()
  }, [tick])

  const stats = useMemo(() => computeStats(history), [history])
  const weekly = useMemo(() => weeklyOptimisationCandidates(history), [history])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const wantsReview =
      params.get('review') === 'periodic' ||
      params.get('focus') === 'periodic' ||
      location.hash === '#periodic-review'
    if (!wantsReview) return
    const el = document.getElementById('periodic-review')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.search, location.hash])

  const generateDigest = () => {
    const digest = savePeriodicDigest(
      buildPeriodicDigest(history, t('statsPeriodicWindowNow')),
    )
    setOpenDigestId(digest.id)
    setTick(refreshMs())
  }

  return (
    <div className="panel stats-page">
      <div className="investigate-head">
        <div>
          <h2>{t('statsTitle')}</h2>
          <p className="sub">{t('statsSub')}</p>
        </div>
        <button type="button" className="archive-btn" onClick={() => setTick(refreshMs())}>
          {t('statsRefresh')}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">{t('statsTotalRca')}</span>
          <strong className="stat-value">{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('statsOpen')}</span>
          <strong className="stat-value">{stats.open}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('statsArchived')}</span>
          <strong className="stat-value">{stats.archived}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('statsWeeklyOpt')}</span>
          <strong className="stat-value">{stats.weeklyOpt}</strong>
        </div>
      </div>

      <section id="periodic-review" className="stats-periodic">
        <div className="investigate-head">
          <div>
            <h3>{t('statsPeriodicTitle')}</h3>
            <p className="sub">{t('statsPeriodicSub')}</p>
          </div>
          <button type="button" className="archive-btn primary-archive" onClick={generateDigest}>
            {t('statsPeriodicGenerate')}
          </button>
        </div>

        <h4>{t('statsWeeklyReviewTitle')}</h4>
        {weekly.length === 0 ? (
          <p className="sub">{t('statsWeeklyReviewEmpty')}</p>
        ) : (
          <div className="stats-review-list">
            {weekly.slice(0, 20).map((h) => {
              const open = openWeeklyId === h.id
              return (
                <article key={h.id} className={`stats-review-card${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="stats-review-toggle"
                    onClick={() => setOpenWeeklyId(open ? null : h.id)}
                  >
                    <span>
                      <span className="pill sev-yellow">{h.severity}</span> {h.title}
                    </span>
                    <span className="sub mono">
                      {new Date(h.archivedAt || h.createdAt).toLocaleString('en-SG', {
                        timeZone: 'Asia/Singapore',
                      })}{' '}
                      SGT · {open ? '▾' : '▸'}
                    </span>
                  </button>
                  {open ? (
                    <div className="stats-review-body">
                      <p className="sub">
                        {(h.skillsUsed || []).map((s) => s.id).join(' · ') || t('investigateNoneMatched')}
                      </p>
                      <pre className="copilot-report stats-review-pre">
                        {String(h.report || '').slice(0, 1200) || '—'}
                      </pre>
                      <NavLink className="archive-btn" to="/investigate">
                        {t('statsOpenInvestigate')}
                      </NavLink>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}

        <h4>{t('statsDigestHistoryTitle')}</h4>
        {digests.length === 0 ? (
          <p className="sub">{t('statsDigestHistoryEmpty')}</p>
        ) : (
          <div className="stats-review-list">
            {digests.map((d) => (
              <DigestCard
                key={d.id}
                digest={d}
                open={openDigestId === d.id}
                onToggle={() => setOpenDigestId(openDigestId === d.id ? null : d.id)}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      <h3>{t('statsBySeverity')}</h3>
      <div className="stats-bars">
        {Object.entries(stats.bySeverity).map(([sev, n]) => (
          <div key={sev} className="stats-bar-row">
            <span className="pill sev-yellow">{sev}</span>
            <div className="stats-bar-track">
              <div
                className="stats-bar-fill"
                style={{ width: `${stats.total ? (n / stats.total) * 100 : 0}%` }}
              />
            </div>
            <span className="mono">{n}</span>
          </div>
        ))}
        {!Object.keys(stats.bySeverity).length ? <p className="sub">{t('statsEmpty')}</p> : null}
      </div>

      <h3>{t('statsSkillHits')}</h3>
      <div className="stats-table">
        {stats.skillHits.length === 0 ? (
          <p className="sub">{t('statsEmpty')}</p>
        ) : (
          stats.skillHits.slice(0, 12).map((row) => (
            <div key={row.id} className="item-row">
              <span>
                [{row.level}] {row.id} {row.name}
              </span>
              <span className="mono">
                {row.count} · {row.rate}%
              </span>
            </div>
          ))
        )}
      </div>

      <h3>{t('statsRecentTimeline')}</h3>
      <ol className="investigate-timeline">
        {stats.recent.map((h) => (
          <li key={h.id}>
            <span className="mono">
              {new Date(h.createdAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT
            </span>{' '}
            · <span className="pill sev-yellow">{h.severity}</span> · {h.title}
            {h.archivedAt ? ` · ${t('investigateArchivedBadge')}` : ` · ${t('investigateOpenBadge')}`}
          </li>
        ))}
        {!stats.recent.length ? <li className="sub">{t('statsEmpty')}</li> : null}
      </ol>
    </div>
  )
}

function DigestCard({
  digest,
  open,
  onToggle,
  t,
}: {
  digest: PeriodicDigest
  open: boolean
  onToggle: () => void
  t: (k: string) => string
}) {
  return (
    <article className={`stats-review-card${open ? ' open' : ''}`}>
      <button type="button" className="stats-review-toggle" onClick={onToggle}>
        <span>
          {t('statsDigestLabel')} · {digest.windowLabel} · {digest.weeklyOptCount}{' '}
          {t('statsWeeklyOpt')}
        </span>
        <span className="sub mono">
          {new Date(digest.createdAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT
          · {open ? '▾' : '▸'}
        </span>
      </button>
      {open ? (
        <div className="stats-review-body">
          <p>
            RCA {digest.totalRca} · open {digest.openRca} · archived {digest.archivedRca} · top{' '}
            {digest.topSeverity}
          </p>
          <p className="sub">{digest.notes}</p>
          {digest.skillHighlights.length ? (
            <ul className="investigate-list">
              {digest.skillHighlights.map((s) => (
                <li key={`${s.level}-${s.id}`}>
                  [{s.level}] {s.id} {s.name} · {s.count}
                </li>
              ))}
            </ul>
          ) : null}
          {digest.weeklyOptItems.length ? (
            <>
              <h4>{t('statsWeeklyReviewTitle')}</h4>
              <ul className="investigate-list">
                {digest.weeklyOptItems.map((item) => (
                  <li key={item.id}>
                    <span className="pill sev-yellow">{item.severity}</span> {item.title}
                    {item.skills.length ? ` · ${item.skills.join(', ')}` : ''}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function computeStats(history: IncidentRecord[]) {
  const total = history.length
  const open = history.filter((h) => !h.archivedAt).length
  const archived = history.filter((h) => h.archivedAt).length
  const weeklyOpt = weeklyOptimisationCandidates(history).length

  const bySeverity: Record<string, number> = {}
  for (const h of history) {
    bySeverity[h.severity] = (bySeverity[h.severity] || 0) + 1
  }

  const hitMap = new Map<string, { id: string; name: string; level: string; count: number }>()
  for (const h of history) {
    const used = h.skillsUsed?.length
      ? h.skillsUsed
      : [
          ...h.hits.map((id) => ({ id, name: id, level: 'L1' })),
          ...h.l2.map((id) => ({ id, name: id, level: 'L2' })),
        ]
    for (const s of used) {
      const key = `${s.level}:${s.id}`
      const cur = hitMap.get(key) || { id: s.id, name: s.name, level: s.level, count: 0 }
      cur.count += 1
      hitMap.set(key, cur)
    }
  }

  const skillHits = [...hitMap.values()]
    .map((row) => ({
      ...row,
      rate: total ? Math.round((row.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const recent = [...history].sort((a, b) => b.createdAt - a.createdAt).slice(0, 15)

  return { total, open, archived, weeklyOpt, bySeverity, skillHits, recent }
}
