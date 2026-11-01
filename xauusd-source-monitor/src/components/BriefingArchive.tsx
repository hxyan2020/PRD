import { useState } from 'react'
import { isBriefingActive } from '../engine/briefing'
import { useLocale } from '../i18n/locale'
import { severityHintKey, severityLabelKey, severityTone } from '../lib/severity'
import type { Briefing, BriefingCitation, BriefingSeverity, CitationCategory } from '../types'

function fmtSgt(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function categoryKey(cat: CitationCategory): string {
  return `citationCat_${cat}`
}

function SeverityBadge({
  severity,
  t,
  showHint = false,
}: {
  severity: BriefingSeverity
  t: (key: string) => string
  showHint?: boolean
}) {
  const tone = severityTone(severity)
  return (
    <div className={`severity-badge tone-${tone}`}>
      <span className={`pill sev-${tone}`}>{t(severityLabelKey(severity))}</span>
      {showHint ? <span className="sev-hint">{t(severityHintKey(severity))}</span> : null}
    </div>
  )
}

function CitationList({
  citations,
  t,
}: {
  citations: BriefingCitation[]
  t: (key: string) => string
}) {
  const groups: CitationCategory[] = ['price_api', 'venue', 'macro', 'news', 'positioning']
  return (
    <div className="citation-groups">
      {groups.map((cat) => {
        const rows = citations.filter((c) => c.category === cat)
        if (!rows.length) return null
        return (
          <div key={cat} className="citation-group">
            <h5>{t(categoryKey(cat))}</h5>
            <ul className="citation-list">
              {rows.map((c) => (
                <li key={c.id}>
                  <a href={c.url} target="_blank" rel="noreferrer noopener">
                    {c.label}
                  </a>
                  <div className="citation-url">
                    <a href={c.url} target="_blank" rel="noreferrer noopener">
                      {c.url}
                    </a>
                  </div>
                  {c.note ? <div className="citation-note">{c.note}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function BriefingCard({
  briefing: b,
  onArchive,
}: {
  briefing: Briefing
  onArchive: (id: string) => void
}) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const citationCount = b.citations?.length || b.sourcesConsulted?.length || 0
  const previewUrls = (b.citations || []).slice(0, 2).map((c) => c.url)
  const tone = severityTone(b.severity)

  return (
    <article className={`briefing tone-${tone} ${open ? 'open' : 'collapsed'}`}>
      <div className="briefing-actions">
        <button
          type="button"
          className="archive-btn"
          onClick={(e) => {
            e.stopPropagation()
            onArchive(b.id)
          }}
        >
          {t('archiveAction')}
        </button>
      </div>
      <button
        type="button"
        className="briefing-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="briefing-toggle-row">
          <header>
            <div>
              <SeverityBadge severity={b.severity} t={t} showHint />
              <h3 style={{ marginTop: 8 }}>{b.title}</h3>
            </div>
            <time dateTime={new Date(b.createdAt).toISOString()}>
              {fmtSgt(b.createdAt)} SGT
            </time>
          </header>
          <span className={`fold-chevron ${open ? 'open' : ''}`} aria-hidden>
            ▾
          </span>
        </div>
        <p className="sub briefing-summary">
          {t('trigger')}: {b.triggerReason} · {t('composite')} {b.compositePrice.toFixed(2)} ·{' '}
          {t('breached')}: {b.breachedSources.join(', ') || '—'}
        </p>
        {!open ? (
          <p className="sub citation-preview">
            {t('citationCount').replace('{n}', String(citationCount))}
            {previewUrls.length ? (
              <>
                {' · '}
                <span className="mono">{previewUrls[0]}</span>
              </>
            ) : null}
          </p>
        ) : null}
        <span className={`fold-hint ${open ? 'is-open' : ''}`}>
          {open ? t('collapseBriefing') : t('expandBriefing')}
        </span>
      </button>

      {open ? (
        <div className="briefing-body" id={`briefing-body-${b.id}`}>
          <section>
            <h4>{t('whyTitle')}</h4>
            <ul>
              {b.why.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4>{t('impactTitle')}</h4>
            <p className="sub section-cap">{t('impactSub')}</p>
            <ul>
              {b.impact.slice(0, 3).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4>{t('actionsTitle')}</h4>
            <p className="sub section-cap">{t('actionsSub')}</p>
            <ul>
              {b.actions.slice(0, 3).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section className="citations-section">
            <h4>{t('citationsTitle')}</h4>
            <p className="sub" style={{ marginTop: 0 }}>
              {t('citationsSub')}
            </p>
            {b.citations?.length ? (
              <CitationList citations={b.citations} t={t} />
            ) : (
              <ul>
                {b.sourcesConsulted.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </section>
          <div className="briefing-body-actions">
            <button
              type="button"
              className="archive-btn primary-archive"
              onClick={() => onArchive(b.id)}
            >
              {t('archiveAction')}
            </button>
            <button type="button" className="fold-hint is-open bottom-fold" onClick={() => setOpen(false)}>
              {t('collapseBriefing')}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function BriefingArchive({
  briefings,
  onArchive,
}: {
  briefings: Briefing[]
  onArchive: (id: string) => void
}) {
  const { t, lang } = useLocale()
  const forLang = briefings.filter((b) => !b.lang || b.lang === lang)
  const visible = forLang.filter(isBriefingActive)
  const archivedCount = forLang.length - visible.length

  return (
    <div className="panel">
      <h2>{t('archiveTitle')}</h2>
      <p className="sub">{t('archiveSub')}</p>
      {archivedCount > 0 ? (
        <p className="sub archived-count">{t('archivedCount').replace('{n}', String(archivedCount))}</p>
      ) : null}

      <div className="sev-legend" aria-label={t('sevLegendTitle')}>
        <div className="sev-legend-title">{t('sevLegendTitle')}</div>
        {(['critical', 'alert', 'watch'] as BriefingSeverity[]).map((s) => (
          <div key={s} className={`sev-legend-row tone-${severityTone(s)}`}>
            <span className={`pill sev-${severityTone(s)}`}>{t(severityLabelKey(s))}</span>
            <span>{t(severityHintKey(s))}</span>
          </div>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="sub">{t('archiveEmpty')}</p>
      ) : (
        visible.map((b) => <BriefingCard key={b.id} briefing={b} onArchive={onArchive} />)
      )}
    </div>
  )
}
