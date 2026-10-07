import { useCases } from '../data/useCases'

export function UseCases() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Field examples</p>
        <h1>Interesting AI use cases</h1>
        <p className="section-lede">
          Study how modules, risks, and metrics fit together — then steal the patterns for your own
          PRD.
        </p>
      </header>

      <div className="usecase-list">
        {useCases.map((uc) => (
          <article key={uc.id} className="usecase">
            <p className="eyebrow">{uc.industry}</p>
            <h2>{uc.title}</h2>
            <p>{uc.summary}</p>
            <div className="usecase-cols">
              <div>
                <h3>Modules</h3>
                <ul>
                  {uc.modules.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>PO risks</h3>
                <ul>
                  {uc.poRisks.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Success metrics</h3>
                <ul>
                  {uc.successMetrics.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="why">
              <strong>Why it matters:</strong> {uc.whyInteresting}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
