import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  EMPTY_SECTION_EN,
  EMPTY_SECTION_ZH,
  computeSentiment,
  generateHourlyScan,
  loadHourlyReports,
  msUntilNextHourSgt,
  saveHourlyReports,
  type HourlyMarketReport,
  type RankedPoint,
  type ReportSource,
  type SentimentBarometer,
} from '../engine/hourlyScan'
import { useLocale } from '../i18n/locale'
import type { SourceHealth } from '../types'
import { HourlyKlineChart } from './HourlyKlineChart'

function fmtSgt(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SourcesModal({
  open,
  sources,
  highlightIds,
  onClose,
  t,
  lang,
}: {
  open: boolean
  sources: ReportSource[]
  highlightIds?: string[]
  onClose: () => void
  t: (k: string) => string
  lang: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const hi = new Set(highlightIds || [])
  const ordered = [
    ...sources.filter((s) => hi.has(s.id)),
    ...sources.filter((s) => !hi.has(s.id)),
  ]

  return (
    <div className="sources-modal-root" role="presentation">
      <button type="button" className="sources-modal-backdrop" aria-label={t('hourlyClose')} onClick={onClose} />
      <div
        className="sources-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hourly-sources-title"
      >
        <div className="sources-modal-head">
          <h3 id="hourly-sources-title">{t('hourlySourcesTitle')}</h3>
          <button type="button" className="archive-btn" onClick={onClose}>
            {t('hourlyClose')}
          </button>
        </div>
        <p className="sub sources-modal-sub">{t('hourlySourcesSub')}</p>
        {ordered.length === 0 ? (
          <p className="sub">{t('hourlyNoSources')}</p>
        ) : (
          <ul className="sources-modal-list">
            {ordered.map((s) => {
              const healthKey =
                s.health === 'ok'
                  ? 'hourlyHealthOk'
                  : s.health === 'degraded'
                    ? 'hourlyHealthDegraded'
                    : s.health === 'down'
                      ? 'hourlyHealthDown'
                      : 'hourlyHealthUnchecked'
              const kindKey = `hourlyKind_${s.kind}`
              return (
                <li key={s.id} className={hi.has(s.id) ? 'is-highlight' : undefined}>
                  <a
                    className="sources-modal-row"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <img
                      className="sources-modal-logo"
                      src={s.logoUrl}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="sources-modal-copy">
                      <span className="sources-modal-caption-row">
                        <span className="sources-modal-caption">
                          {lang === 'zh-Hant' ? s.captionZh : s.captionEn}
                        </span>
                        <span
                          className={`sources-modal-health health-${s.health || 'unchecked'}`}
                          title={s.detail || undefined}
                        >
                          {t(healthKey)}
                        </span>
                      </span>
                      <span className="sources-modal-meta">
                        <span className="sources-modal-kind">{t(kindKey)}</span>
                        <span className="sources-modal-domain">{s.domain}</span>
                      </span>
                      <span className="sources-modal-refreshed">
                        {t('hourlyLastRefreshed').replace(
                          '{time}',
                          s.checkedAt ? `${fmtSgt(s.checkedAt)} SGT` : '—',
                        )}
                        {typeof s.latencyMs === 'number' ? ` · ${s.latencyMs}ms` : ''}
                      </span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function SectionBlock({
  title,
  points,
  emptyLabel,
  onOpenSources,
  t,
  lang,
}: {
  title: string
  points: RankedPoint[]
  emptyLabel: string
  onOpenSources: (sourceIds: string[]) => void
  t: (k: string) => string
  lang: string
}) {
  return (
    <section className="hourly-section">
      <h3>{title}</h3>
      {points.length === 0 ? (
        <p className="hourly-empty">{emptyLabel}</p>
      ) : (
        <ol className="hourly-points">
          {points.map((p) => (
            <li key={`${p.rank}-${p.en.slice(0, 24)}`}>
              <div className="hourly-point-rank" aria-hidden>
                {p.rank}
              </div>
              <div className="hourly-point-body">
                <p>{lang === 'zh-Hant' ? p.zh : p.en}</p>
                {p.sourceIds.length ? (
                  <button
                    type="button"
                    className="text-link hourly-sources-link"
                    onClick={() => onOpenSources(p.sourceIds)}
                  >
                    {t('hourlyViewSources').replace('{n}', String(p.sourceIds.length))}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function SentimentMeter({ sentiment, lang }: { sentiment: SentimentBarometer; lang: string }) {
  const { t } = useLocale()
  const pct = ((sentiment.score + 100) / 200) * 100
  const defs = lang === 'zh-Hant' ? sentiment.definitionZh : sentiment.definitionEn
  const label = lang === 'zh-Hant' ? sentiment.labelZh : sentiment.labelEn
  const scoreText = sentiment.score > 0 ? `+${sentiment.score}` : String(sentiment.score)

  return (
    <div className="sentiment-meter" tabIndex={0}>
      <div className="sentiment-meter-top">
        <span className="sentiment-meter-title">{t('hourlySentiment')}</span>
        <span className="sentiment-meter-pill" style={{ background: sentiment.color }}>
          {label} · {scoreText}
        </span>
      </div>
      <div
        className="sentiment-track"
        role="meter"
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-valuenow={sentiment.score}
        aria-label={`${t('hourlySentiment')}: ${label} ${scoreText}`}
      >
        <div className="sentiment-track-gradient" aria-hidden />
        <div
          className="sentiment-needle"
          style={{ left: `calc(${pct}% - 7px)`, borderColor: sentiment.color }}
          aria-hidden
        />
      </div>
      <div className="sentiment-scale" aria-hidden>
        <span>−100</span>
        <span>0</span>
        <span>+100</span>
      </div>
      <div className="sentiment-tooltip" role="tooltip">
        <p className="sentiment-tooltip-title">{t('hourlySentimentHow')}</p>
        <ul>
          {defs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ReportCard({
  report,
  onOpenSources,
}: {
  report: HourlyMarketReport
  onOpenSources: (sources: ReportSource[], highlightIds?: string[]) => void
}) {
  const { t, lang } = useLocale()
  const empty = lang === 'zh-Hant' ? EMPTY_SECTION_ZH : EMPTY_SECTION_EN
  const sentiment =
    report.sentiment ?? computeSentiment(report.opportunity || [], report.risk || [])

  return (
    <article className="hourly-card">
      <header className="hourly-card-head">
        <div>
          <p className="hourly-kicker">{t('hourlyReportKicker')}</p>
          <h3>
            {t('hourlyReportTitle')} · {report.hourKey} SGT
          </h3>
          <p className="sub">{fmtSgt(report.createdAt)} SGT</p>
        </div>
        <button
          type="button"
          className="archive-btn"
          onClick={() => onOpenSources(report.sources)}
          disabled={!report.sources.length}
        >
          {t('hourlyAllSources').replace('{n}', String(report.sources.length))}
        </button>
      </header>

      <SentimentMeter sentiment={sentiment} lang={lang} />

      <HourlyKlineChart
        series={report.kline}
        onOpenSource={(id) => onOpenSources(report.sources, [id])}
      />

      <div className="hourly-bilingual-note sub">{t('hourlyBilingualNote')}</div>

      <SectionBlock
        title={t('hourlyTldr')}
        points={report.tldr}
        emptyLabel={empty}
        t={t}
        lang={lang}
        onOpenSources={(ids) => onOpenSources(report.sources, ids)}
      />
      <SectionBlock
        title={t('hourlyOpportunity')}
        points={report.opportunity}
        emptyLabel={empty}
        t={t}
        lang={lang}
        onOpenSources={(ids) => onOpenSources(report.sources, ids)}
      />
      <SectionBlock
        title={t('hourlyRisk')}
        points={report.risk}
        emptyLabel={empty}
        t={t}
        lang={lang}
        onOpenSources={(ids) => onOpenSources(report.sources, ids)}
      />

      <section className="hourly-section hourly-vex">
        <h3>{t('hourlyVexTitle')}</h3>
        <p className="hourly-empty">
          {lang === 'zh-Hant' ? report.vexNoteZh : report.vexNoteEn}
        </p>
      </section>
    </article>
  )
}

export function HourlyScanReport({
  health,
  composite,
  spot,
}: {
  health: SourceHealth[]
  composite: number | null
  spot: number | null
}) {
  const { t, lang } = useLocale()
  const [reports, setReports] = useState<HourlyMarketReport[]>(() => loadHourlyReports())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSources, setModalSources] = useState<ReportSource[]>([])
  const [highlightIds, setHighlightIds] = useState<string[] | undefined>()

  const latest = reports[0] ?? null
  const history = useMemo(() => reports.slice(1, 12), [reports])

  const runScan = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const report = await generateHourlyScan({ health, composite, spot })
      setReports((prev) => {
        // One report per SGT hour — replace if same bucket
        const next = [report, ...prev.filter((r) => r.hourKey !== report.hourKey)].slice(0, 48)
        saveHourlyReports(next)
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [health, composite, spot])

  // Ensure current SGT hour has a report; then wake at the next hour boundary.
  useEffect(() => {
    let cancelled = false
    let timer = 0

    const bucketNow = () => {
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
      })
      const parts = Object.fromEntries(
        fmt.formatToParts(new Date()).map((p) => [p.type, p.value]),
      ) as Record<string, string>
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}`
    }

    const tickHour = async () => {
      if (cancelled) return
      const stored = loadHourlyReports()[0]
      if (!stored || stored.hourKey !== bucketNow()) {
        await runScan()
      }
      if (cancelled) return
      timer = window.setTimeout(() => {
        void tickHour()
      }, msUntilNextHourSgt())
    }

    void tickHour()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [runScan])

  const openSources = (sources: ReportSource[], ids?: string[]) => {
    setModalSources(sources)
    setHighlightIds(ids)
    setModalOpen(true)
  }

  return (
    <div className="panel hourly-scan-panel">
      <div className="hourly-toolbar">
        <div>
          <h2>{t('hourlyTitle')}</h2>
          <p className="sub">{t('hourlySub')}</p>
        </div>
        <button
          type="button"
          className="archive-btn primary-archive"
          disabled={busy}
          onClick={() => void runScan()}
        >
          {busy ? t('hourlyScanning') : t('hourlyScanNow')}
        </button>
      </div>

      {error ? <p className="feed-error">{error}</p> : null}

      {!latest && !busy ? <p className="sub">{t('hourlyEmpty')}</p> : null}
      {latest ? <ReportCard report={latest} onOpenSources={openSources} /> : null}

      {history.length ? (
        <div className="hourly-history">
          <h3>{t('hourlyHistory')}</h3>
          {history.map((r) => (
            <details key={r.id} className="hourly-history-item">
              <summary>
                {r.hourKey} SGT · {fmtSgt(r.createdAt)} ·{' '}
                {lang === 'zh-Hant' ? '要點' : 'points'}{' '}
                {r.tldr.length + r.opportunity.length + r.risk.length}
              </summary>
              <ReportCard report={r} onOpenSources={openSources} />
            </details>
          ))}
        </div>
      ) : null}

      <SourcesModal
        open={modalOpen}
        sources={modalSources}
        highlightIds={highlightIds}
        onClose={() => setModalOpen(false)}
        t={t}
        lang={lang}
      />
    </div>
  )
}
