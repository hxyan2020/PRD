import { useState } from 'react'
import { useLocale } from '../i18n/locale'
import type { Briefing, BriefingCitation, CitationCategory } from '../types'

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

function BriefingCard({ briefing: b }: { briefing: Briefing }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const citationCount = b.citations?.length || b.sourcesConsulted?.length || 0
  const previewUrls = (b.citations || []).slice(0, 2).map((c) => c.url)

  return (
    <article className={`briefing ${open ? 'open' : 'collapsed'}`}>
      <button
        type="button"
        className="briefing-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <header>
          <div>
            <span className={`pill ${b.severity}`}>{b.severity}</span>
            <h3 style={{ marginTop: 8 }}>{b.title}</h3>
          </div>
          <time dateTime={new Date(b.createdAt).toISOString()}>
            {fmtSgt(b.createdAt)} SGT
          </time>
        </header>
        <p className="sub briefing-summary">
          {t('trigger')}: {b.triggerReason} · {t('composite')} {b.compositePrice.toFixed(2)} ·{' '}
          {t('breached')}: {b.breachedSources.join(', ') || '—'}
        </p>
        <p className="sub citation-preview">
          {t('citationCount').replace('{n}', String(citationCount))}
          {previewUrls.length ? (
            <>
              {' · '}
              <span className="mono">{previewUrls[0]}</span>
            </>
          ) : null}
        </p>
        <span className="fold-hint">{open ? t('collapseBriefing') : t('expandBriefing')}</span>
      </button>

      {open ? (
        <div className="briefing-body">
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
        </div>
      ) : null}
    </article>
  )
}

export function BriefingArchive({ briefings }: { briefings: Briefing[] }) {
  const { t, lang } = useLocale()
  const visible = briefings.filter((b) => !b.lang || b.lang === lang)

  return (
    <div className="panel">
      <h2>{t('archiveTitle')}</h2>
      <p className="sub">{t('archiveSub')}</p>

      {visible.length === 0 ? (
        <p className="sub">{t('archiveEmpty')}</p>
      ) : (
        visible.map((b) => <BriefingCard key={b.id} briefing={b} />)
      )}
    </div>
  )
}
