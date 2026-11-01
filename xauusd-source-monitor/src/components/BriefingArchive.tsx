import { useLocale } from '../i18n/locale'
import type { Briefing } from '../types'

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
        visible.map((b) => (
          <article key={b.id} className="briefing">
            <header>
              <div>
                <span className={`pill ${b.severity}`}>{b.severity}</span>
                <h3 style={{ marginTop: 8 }}>{b.title}</h3>
              </div>
              <time dateTime={new Date(b.createdAt).toISOString()}>
                {fmtSgt(b.createdAt)} SGT
              </time>
            </header>
            <p className="sub" style={{ margin: 0 }}>
              {t('trigger')}: {b.triggerReason} · {t('composite')} {b.compositePrice.toFixed(2)} ·{' '}
              {t('breached')}: {b.breachedSources.join(', ') || '—'}
            </p>

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
              <ul>
                {b.impact.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>{t('actionsTitle')}</h4>
              <ul>
                {b.actions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>{t('consultedTitle')}</h4>
              <ul>
                {b.sourcesConsulted.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          </article>
        ))
      )}
    </div>
  )
}
