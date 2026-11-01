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
  return (
    <div className="panel">
      <h2>Briefing archive</h2>
      <p className="sub">
        Auto-generated when multi-source rules fire. Timestamps in Asia/Singapore. Stored in this
        browser; seed history included for continuity.
      </p>

      {briefings.length === 0 ? (
        <p className="sub">No briefings yet. Enable Stress demo on Health if you want a sample fire.</p>
      ) : (
        briefings.map((b) => (
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
              Trigger: {b.triggerReason} · Composite {b.compositePrice.toFixed(2)} · Breached:{' '}
              {b.breachedSources.join(', ') || '—'}
            </p>

            <section>
              <h4>Why prices moved</h4>
              <ul>
                {b.why.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Impact on V Exchange</h4>
              <ul>
                {b.impact.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Next steps / safeguards</h4>
              <ul>
                {b.actions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Sources consulted</h4>
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
