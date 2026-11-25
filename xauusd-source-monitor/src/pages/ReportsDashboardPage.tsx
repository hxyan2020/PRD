import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/locale'
import { loadHistory, weeklyOptimisationCandidates } from '../copilot/storage'
import type { IncidentRecord as DeskIncident } from '../copilot/types'

export type LarkIncident = {
  id: string
  title: string
  facts: string[]
  severity: string
  skills: string[]
  knowledge: string[]
  summary: string
  recommendations: string[]
  riskVerdict?: 'at_risk' | 'no_risk' | 'unclear'
  status: 'open' | 'archived'
  createdAt: number
  updatedAt: number
  lang?: string
}

export type DashboardRow = {
  id: string
  source: 'desk' | 'lark'
  title: string
  severity: string
  status: 'open' | 'archived'
  riskVerdict?: 'at_risk' | 'no_risk' | 'unclear' | 'unset'
  summary: string
  skills: string[]
  createdAt: number
  updatedAt: number
  recommendations: string[]
  factsPreview: string
}

type StatusFilter = 'all' | 'open' | 'archived'
type SourceFilter = 'all' | 'desk' | 'lark'

function sgt(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dayKeySgt(ts: number) {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
}

function normalizeSeverity(raw: string) {
  const s = (raw || '').toUpperCase()
  if (s.includes('P0') || s.includes('緊急') || s.includes('紧急')) return 'P0'
  if (s.includes('P1')) return 'P1'
  if (s.includes('P2')) return 'P2'
  if (s.includes('P3')) return 'P3'
  return raw || '—'
}

function deskToRow(h: DeskIncident): DashboardRow {
  return {
    id: `desk:${h.id}`,
    source: 'desk',
    title: h.title || 'Untitled',
    severity: normalizeSeverity(h.severity),
    status: h.archivedAt ? 'archived' : 'open',
    riskVerdict: 'unset',
    summary: (h.report || '').slice(0, 280),
    skills: [
      ...(h.skillsUsed?.map((s) => s.id) || []),
      ...(h.hits || []),
      ...(h.l2 || []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    createdAt: h.createdAt,
    updatedAt: h.archivedAt || h.createdAt,
    recommendations: h.nextSteps || [],
    factsPreview: (h.facts || '').slice(0, 220),
  }
}

function larkToRow(h: LarkIncident): DashboardRow {
  return {
    id: `lark:${h.id}`,
    source: 'lark',
    title: h.title || h.id,
    severity: normalizeSeverity(h.severity),
    status: h.status === 'archived' ? 'archived' : 'open',
    riskVerdict: h.riskVerdict || 'unset',
    summary: (h.summary || '').slice(0, 280),
    skills: h.skills || [],
    createdAt: h.createdAt,
    updatedAt: h.updatedAt || h.createdAt,
    recommendations: h.recommendations || [],
    factsPreview: (h.facts || []).join(' · ').slice(0, 220),
  }
}

function riskVerdictLabelUi(v: DashboardRow['riskVerdict'], zh: boolean) {
  if (v === 'at_risk') return zh ? '有风险' : 'At risk'
  if (v === 'no_risk') return zh ? '无风险' : 'No risk'
  if (v === 'unclear') return zh ? '尚不明确' : 'Unclear'
  return zh ? '未判定' : 'Unset'
}

async function fetchLarkIncidents(): Promise<{
  rows: LarkIncident[]
  ok: boolean
}> {
  try {
    const { loadSettings, applyManagedLlmConfig } = await import('../copilot/storage')
    const settings = await applyManagedLlmConfig(loadSettings())
    const headers: Record<string, string> = {}
    if (settings.deskToken?.trim()) {
      headers['X-Desk-Token'] = settings.deskToken.trim()
    }
    const r = await fetch('/api/lark/incidents?limit=100&status=all', { headers })
    if (!r.ok) return { rows: [], ok: false }
    const data = (await r.json()) as { incidents?: LarkIncident[] }
    const rows = Array.isArray(data.incidents) ? data.incidents : []
    return { rows, ok: true }
  } catch {
    return { rows: [], ok: false }
  }
}

export function ReportsDashboardPage() {
  const { t, lang } = useLocale()
  const zh = lang === 'zh-Hant'
  const [tick, setTick] = useState(0)
  const [lark, setLark] = useState<LarkIncident[]>([])
  const [larkState, setLarkState] = useState<'idle' | 'loading' | 'ok' | 'empty' | 'error'>('idle')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [sevFilter, setSevFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const desk = useMemo(() => {
    void tick
    return loadHistory()
  }, [tick])

  useEffect(() => {
    let cancelled = false
    setLarkState('loading')
    ;(async () => {
      const { rows, ok } = await fetchLarkIncidents()
      if (cancelled) return
      setLark(rows)
      if (!ok) setLarkState('error')
      else setLarkState(rows.length ? 'ok' : 'empty')
    })()
    return () => {
      cancelled = true
    }
  }, [tick])

  const rows = useMemo(() => {
    const merged = [...desk.map(deskToRow), ...lark.map(larkToRow)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    )
    const q = query.trim().toLowerCase()
    return merged.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
      if (sevFilter !== 'all' && r.severity !== sevFilter) return false
      if (!q) return true
      const hay = `${r.title} ${r.summary} ${r.skills.join(' ')} ${r.factsPreview}`.toLowerCase()
      return hay.includes(q)
    })
  }, [desk, lark, statusFilter, sourceFilter, sevFilter, query])

  const selected = rows.find((r) => r.id === selectedId) || null

  const viz = useMemo(() => {
    const all = [...desk.map(deskToRow), ...lark.map(larkToRow)]
    const bySeverity: Record<string, number> = {}
    const byRisk: Record<string, number> = {
      at_risk: 0,
      no_risk: 0,
      unclear: 0,
      unset: 0,
    }
    const byDay: Record<string, number> = {}
    const skillMap = new Map<string, { count: number; name?: string; level?: string }>()
    let open = 0
    let archived = 0
    for (const r of all) {
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1
      const rv = r.riskVerdict || 'unset'
      byRisk[rv] = (byRisk[rv] || 0) + 1
      if (r.status === 'open') open += 1
      else archived += 1
      const day = dayKeySgt(r.updatedAt)
      byDay[day] = (byDay[day] || 0) + 1
      for (const s of r.skills.slice(0, 8)) {
        const cur = skillMap.get(s) || { count: 0 }
        cur.count += 1
        skillMap.set(s, cur)
      }
    }
    // Enrich with desk skill names / levels when available (former Realtime Stats)
    for (const h of desk) {
      const used = h.skillsUsed?.length
        ? h.skillsUsed
        : [
            ...h.hits.map((id) => ({ id, name: id, level: 'L1' })),
            ...h.l2.map((id) => ({ id, name: id, level: 'L2' })),
          ]
      for (const s of used) {
        const cur = skillMap.get(s.id) || { count: 0 }
        cur.name = s.name || cur.name
        cur.level = s.level || cur.level
        skillMap.set(s.id, cur)
      }
    }
    const dayKeys = Object.keys(byDay).sort()
    const lastDays = dayKeys.slice(-14)
    const maxDay = Math.max(1, ...lastDays.map((d) => byDay[d] || 0))
    const skills = [...skillMap.entries()]
      .map(([id, meta]) => ({
        id,
        count: meta.count,
        name: meta.name,
        level: meta.level,
        rate: all.length ? Math.round((meta.count / all.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
    return {
      total: all.length,
      open,
      archived,
      weeklyOpt: weeklyOptimisationCandidates(desk).length,
      desk: desk.length,
      lark: lark.length,
      bySeverity,
      byRisk,
      lastDays,
      byDay,
      maxDay,
      skills,
    }
  }, [desk, lark])

  const sevOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of [...desk.map(deskToRow), ...lark.map(larkToRow)]) set.add(r.severity)
    return ['all', ...[...set].sort()]
  }, [desk, lark])

  return (
    <div className="panel reports-dashboard">
      <div className="investigate-head">
        <div>
          <h2>{t('reportsTitle')}</h2>
          <p className="sub">{t('reportsSub')}</p>
        </div>
        <div className="reports-head-actions">
          <button
            type="button"
            className="archive-btn"
            onClick={() => setTick((n) => n + 1)}
          >
            {t('reportsRefresh')}
          </button>
          <Link className="archive-btn" to="/investigate">
            {t('navInvestigate')}
          </Link>
        </div>
      </div>

      <div className="stats-grid reports-kpi">
        <div className="stat-card">
          <span className="stat-label">{t('reportsTotal')}</span>
          <strong className="stat-value">{viz.total}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('reportsOpen')}</span>
          <strong className="stat-value">{viz.open}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('reportsArchived')}</span>
          <strong className="stat-value">{viz.archived}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('statsWeeklyOpt')}</span>
          <strong className="stat-value">{viz.weeklyOpt}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('reportsSources')}</span>
          <strong className="stat-value reports-sources-value">
            {viz.desk}
            <span className="reports-sources-sep">/</span>
            {viz.lark}
          </strong>
          <span className="reports-sources-hint">
            {zh ? '桌面 / Lark' : 'Desk / Lark'}
            {larkState === 'loading' ? ` · ${t('reportsLoadingLark')}` : ''}
            {larkState === 'error' ? ` · ${t('reportsLarkUnavailable')}` : ''}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('reportsAtRisk')}</span>
          <strong className="stat-value">{viz.byRisk.at_risk}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('reportsNoRisk')}</span>
          <strong className="stat-value">{viz.byRisk.no_risk}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('reportsRiskUnset')}</span>
          <strong className="stat-value">{viz.byRisk.unclear + viz.byRisk.unset}</strong>
        </div>
      </div>

      <div className="reports-viz-grid">
        <section className="reports-viz-panel">
          <h3>{t('reportsBySeverity')}</h3>
          <div className="stats-bars">
            {Object.keys(viz.bySeverity).length === 0 ? (
              <p className="sub">{t('reportsEmpty')}</p>
            ) : (
              Object.entries(viz.bySeverity)
                .sort((a, b) => b[1] - a[1])
                .map(([sev, n]) => (
                  <div key={sev} className="stats-bar-row">
                    <span className={`pill sev-${sev.toLowerCase()}`}>{sev}</span>
                    <div className="stats-bar-track">
                      <div
                        className="stats-bar-fill"
                        style={{
                          width: `${viz.total ? (n / viz.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="mono">{n}</span>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="reports-viz-panel">
          <h3>{t('reportsTimeline')}</h3>
          {viz.lastDays.length === 0 ? (
            <p className="sub">{t('reportsEmpty')}</p>
          ) : (
            <div className="reports-day-chart" role="img" aria-label={t('reportsTimeline')}>
              {viz.lastDays.map((d) => {
                const n = viz.byDay[d] || 0
                const pct = Math.max(8, Math.round((n / viz.maxDay) * 100))
                return (
                  <div key={d} className="reports-day-col" title={`${d}: ${n}`}>
                    <div className="reports-day-bar-wrap">
                      <div className="reports-day-bar" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="reports-day-label">{d.slice(5)}</span>
                    <span className="reports-day-count mono">{n}</span>
                  </div>
                )
              })}
            </div>
          )}
          <p className="reports-caption">{t('reportsTimelineCaption')}</p>
        </section>
      </div>

      <section className="reports-viz-panel">
        <h3>{t('statsSkillHits')}</h3>
        {viz.skills.length === 0 ? (
          <p className="sub">{t('reportsEmpty')}</p>
        ) : (
          <div className="stats-table reports-skill-rates">
            {viz.skills.map((row) => (
              <div key={row.id} className="item-row">
                <span>
                  {row.level ? `[${row.level}] ` : ''}
                  {row.id}
                  {row.name && row.name !== row.id ? ` ${row.name}` : ''}
                </span>
                <span className="mono">
                  {row.count} · {row.rate}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="reports-filters">
        <label>
          <span>{t('reportsFilterStatus')}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">{t('reportsFilterAll')}</option>
            <option value="open">{t('reportsOpen')}</option>
            <option value="archived">{t('reportsArchived')}</option>
          </select>
        </label>
        <label>
          <span>{t('reportsFilterSource')}</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
          >
            <option value="all">{t('reportsFilterAll')}</option>
            <option value="desk">{t('reportsSourceDesk')}</option>
            <option value="lark">{t('reportsSourceLark')}</option>
          </select>
        </label>
        <label>
          <span>{t('reportsFilterSeverity')}</span>
          <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
            {sevOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? t('reportsFilterAll') : s}
              </option>
            ))}
          </select>
        </label>
        <label className="reports-search">
          <span>{t('reportsSearch')}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('reportsSearchPh')}
          />
        </label>
      </div>

      <div className="reports-split">
        <section className="reports-list">
          <h3>
            {t('reportsListTitle')}{' '}
            <span className="mono">({rows.length})</span>
          </h3>
          {rows.length === 0 ? (
            <p className="sub">{t('reportsEmpty')}</p>
          ) : (
            <ul className="reports-list-ul">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`reports-list-item${selectedId === r.id ? ' active' : ''}`}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div className="reports-list-top">
                      <span className={`pill sev-${r.severity.toLowerCase()}`}>{r.severity}</span>
                      <span className={`pill source-${r.source}`}>
                        {r.source === 'desk' ? t('reportsSourceDesk') : t('reportsSourceLark')}
                      </span>
                      <span className="pill status-pill">
                        {r.status === 'open' ? t('reportsOpen') : t('reportsArchived')}
                      </span>
                      <span className="pill status-pill">
                        {riskVerdictLabelUi(r.riskVerdict, zh)}
                      </span>
                      <span className="mono reports-list-time">{sgt(r.updatedAt)} SGT</span>
                    </div>
                    <strong className="reports-list-title">{r.title}</strong>
                    <p className="reports-list-summary">{r.summary || r.factsPreview || '—'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="reports-detail">
          <h3>{t('reportsDetailTitle')}</h3>
          {!selected ? (
            <p className="sub">{t('reportsDetailEmpty')}</p>
          ) : (
            <div className="reports-detail-body">
              <p className="reports-detail-kicker">
                <span className={`pill sev-${selected.severity.toLowerCase()}`}>
                  {selected.severity}
                </span>{' '}
                ·{' '}
                {selected.source === 'desk' ? t('reportsSourceDesk') : t('reportsSourceLark')} ·{' '}
                {selected.status === 'open' ? t('reportsOpen') : t('reportsArchived')}
              </p>
              <h4>{selected.title}</h4>
              <p className="mono reports-detail-meta">
                {t('reportsCreated')}: {sgt(selected.createdAt)} SGT
                <br />
                {t('reportsUpdated')}: {sgt(selected.updatedAt)} SGT
              </p>
              <h5>{t('reportsFacts')}</h5>
              <p className="reports-detail-block">{selected.factsPreview || '—'}</p>
              <h5>{t('reportsConclusion')}</h5>
              <p className="reports-detail-block">{selected.summary || '—'}</p>
              <h5>{t('reportsNextSteps')}</h5>
              {selected.recommendations.length ? (
                <ol className="reports-steps">
                  {selected.recommendations.slice(0, 8).map((s, i) => (
                    <li key={`${selected.id}-step-${i}`}>{s}</li>
                  ))}
                </ol>
              ) : (
                <p className="sub">—</p>
              )}
              <h5>{t('reportsSkills')}</h5>
              <div className="reports-skill-cloud">
                {selected.skills.length ? (
                  selected.skills.map((s) => (
                    <span key={s} className="reports-skill-chip">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="sub">—</span>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="reports-footnote">{t('reportsFootnote')}</p>
    </div>
  )
}
