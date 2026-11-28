import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { probeInfoSources } from '../engine/infoProbes'
import { useLocale } from '../i18n/locale'
import type { InfoSourceKind, InfoSourceProbe, SourceHealth } from '../types'

function fmtSgt(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function SourceGroup({
  title,
  sub,
  count,
  defaultOpen,
  children,
}: {
  title: string
  sub: string
  count?: number
  defaultOpen: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`info-group ${open ? 'open' : 'collapsed'}`}>
      <button type="button" className="info-group-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <h3>
          {title} {count != null ? <span className="kind-count">({count})</span> : null}
        </h3>
        <span className={`fold-chevron ${open ? 'open' : ''}`} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <>
          <p className="sub">{sub}</p>
          {children}
        </>
      ) : null}
    </div>
  )
}

export function InfoSourcesPanel({ monitorHealth }: { monitorHealth?: SourceHealth[] }) {
  const { t, lang } = useLocale()
  const [rows, setRows] = useState<InfoSourceProbe[]>([])
  const [busy, setBusy] = useState(false)
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = () => setCompact(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const run = useCallback(async () => {
    setBusy(true)
    try {
      const next = await probeInfoSources(lang)
      setRows(next)
    } finally {
      setBusy(false)
    }
  }, [lang])

  useEffect(() => {
    void run()
    const id = window.setInterval(() => void run(), 60_000)
    return () => window.clearInterval(id)
  }, [run])

  const groups: InfoSourceKind[] = ['price', 'venue', 'macro', 'policy', 'news']

  const summary = useMemo(() => {
    const ok = rows.filter((r) => r.status === 'ok').length
    const degraded = rows.filter((r) => r.status === 'degraded').length
    const down = rows.filter((r) => r.status === 'down').length
    return { ok, degraded, down, total: rows.length }
  }, [rows])

  const checkLabel = (c: InfoSourceProbe['check']) => {
    if (c === 'json') return t('checkJson')
    if (c === 'cors_opaque') return t('checkOpaque')
    return t('checkHttp')
  }

  return (
    <div className="panel" id="info-sources">
      <h2>{t('infoSourcesTitle')}</h2>
      <p className="sub desktop-copy">{t('infoSourcesSub')}</p>
      <p className="sub mobile-copy">{t('infoSourcesSubShort')}</p>

      <div className="info-summary">
        <div className="stat">
          <div className="label">{t('infoTotal')}</div>
          <div className="value">{summary.total || '—'}</div>
        </div>
        <div className="stat">
          <div className="label">{t('probe_ok')}</div>
          <div className="value">{summary.ok}</div>
        </div>
        <div className="stat">
          <div className="label">{t('probe_degraded')}</div>
          <div className="value">{summary.degraded}</div>
        </div>
        <div className="stat">
          <div className="label">{t('probe_down')}</div>
          <div className="value">{summary.down}</div>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" className="primary" onClick={() => void run()} disabled={busy}>
          {busy ? t('probing') : t('probeNow')}
        </button>
      </div>

      {monitorHealth && monitorHealth.length > 0 ? (
        <SourceGroup
          title={t('infoKind_monitor')}
          sub={t('infoKind_monitorSub')}
          count={monitorHealth.length}
          defaultOpen={!compact}
        >
          <div className="info-cards">
            {monitorHealth.map((h) => (
              <article
                key={h.id}
                className={`info-card status-${h.health === 'healthy' ? 'ok' : h.health === 'watch' ? 'degraded' : 'down'}`}
              >
                <header>
                  <strong>
                    {h.label} · {h.id}
                  </strong>
                  <span className={`pill ${h.health}`}>{h.health}</span>
                </header>
                <div className="source-row">
                  <span>{t('colPrice')}</span>
                  <span className="mono">{h.price != null ? h.price.toFixed(2) : '—'}</span>
                </div>
                <div className="source-row">
                  <span>{t('colDev')}</span>
                  <span className="mono">
                    {h.deviationBps != null
                      ? `${h.deviationBps >= 0 ? '+' : ''}${h.deviationBps.toFixed(1)}`
                      : '—'}
                  </span>
                </div>
                <div className="source-row">
                  <span>{t('colMode')}</span>
                  <span className="mono">{h.mode}</span>
                </div>
                <div className="citation-note">
                  {t('infoMonitorCheck')}: score {h.score} ·{' '}
                  {h.latencyMs != null ? `${Math.round(h.latencyMs)}ms` : '—'}
                </div>
              </article>
            ))}
          </div>
        </SourceGroup>
      ) : null}

      {groups.map((kind) => {
        const list = rows.filter((r) => r.kind === kind)
        if (!list.length) return null
        return (
          <SourceGroup
            key={kind}
            title={t(`infoKind_${kind}`)}
            sub={t(`infoKind_${kind}Sub`)}
            count={list.length}
            defaultOpen={!compact && (kind === 'price' || kind === 'news')}
          >
            <div className="info-cards">
              {list.map((r) => (
                <article key={r.id} className={`info-card status-${r.status}`}>
                  <header>
                    <strong>{r.label}</strong>
                    <span
                      className={`pill ${
                        r.status === 'ok' ? 'healthy' : r.status === 'degraded' ? 'watch' : 'alert'
                      }`}
                    >
                      {t(`probe_${r.status}`)}
                    </span>
                  </header>
                  <div className="source-row">
                    <span>{t('infoCheckMethod')}</span>
                    <span>{checkLabel(r.check)}</span>
                  </div>
                  <div className="source-row">
                    <span>{t('colLatency')}</span>
                    <span className="mono">
                      {r.latencyMs != null ? `${r.latencyMs}ms` : '—'}
                    </span>
                  </div>
                  <div className="source-row">
                    <span>{t('infoCheckedAt')}</span>
                    <span className="mono">{fmtSgt(r.checkedAt)} SGT</span>
                  </div>
                  {r.detail ? <div className="citation-note">{r.detail}</div> : null}
                  <a className="info-link" href={r.url} target="_blank" rel="noreferrer noopener">
                    {r.url}
                  </a>
                </article>
              ))}
            </div>
          </SourceGroup>
        )
      })}
    </div>
  )
}
