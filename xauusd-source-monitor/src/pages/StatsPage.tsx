import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/locale'
import { loadHistory, weeklyOptimisationCandidates } from '../copilot/storage'
import type { IncidentRecord } from '../copilot/types'

function refreshMs() {
  return Date.now()
}

export function StatsPage() {
  const { t } = useLocale()
  const [tick, setTick] = useState(refreshMs)
  const history = useMemo(() => {
    void tick
    return loadHistory()
  }, [tick])

  const stats = useMemo(() => computeStats(history), [history])

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
