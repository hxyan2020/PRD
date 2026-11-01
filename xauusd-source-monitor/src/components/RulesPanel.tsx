import type { ChangeEvent } from 'react'
import { RULE_COPY } from '../config/rules'
import type { MonitorRules } from '../types'

export function RulesPanel(props: {
  rules: MonitorRules
  setRules: (r: MonitorRules) => void
}) {
  const { rules, setRules } = props

  const num =
    (key: keyof MonitorRules) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      if (!Number.isFinite(v)) return
      setRules({ ...rules, [key]: v })
    }

  return (
    <>
      <div className="panel">
        <h2>Trigger rules</h2>
        <p className="sub">
          Defined for XAUUSD MVP perp across exchanges + LPs. Briefings fire only when multi-source
          or composite-shock conditions clear — not on a single noisy venue.
        </p>
        <div className="rules-grid">
          {RULE_COPY.map((r) => (
            <article key={r.id} className="rule-card">
              <h3>{r.title}</h3>
              <p>{r.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Tunable thresholds</h2>
        <p className="sub">Changes apply to the live evaluator in this browser session.</p>
        <div className="form-grid">
          <label>
            Watch deviation (bps)
            <input
              type="number"
              value={rules.watchDeviationBps}
              onChange={num('watchDeviationBps')}
            />
          </label>
          <label>
            Alert deviation (bps)
            <input
              type="number"
              value={rules.alertDeviationBps}
              onChange={num('alertDeviationBps')}
            />
          </label>
          <label>
            Min alert sources
            <input type="number" value={rules.minAlertSources} onChange={num('minAlertSources')} />
          </label>
          <label>
            Min exchange watch
            <input
              type="number"
              value={rules.minExchangeWatch}
              onChange={num('minExchangeWatch')}
            />
          </label>
          <label>
            Min LP watch
            <input type="number" value={rules.minLpWatch} onChange={num('minLpWatch')} />
          </label>
          <label>
            Composite 5m move (bps)
            <input
              type="number"
              value={rules.compositeMoveBps5m}
              onChange={num('compositeMoveBps5m')}
            />
          </label>
          <label>
            Stale after (ms)
            <input type="number" value={rules.staleAfterMs} onChange={num('staleAfterMs')} />
          </label>
          <label>
            Cooldown (ms)
            <input type="number" value={rules.cooldownMs} onChange={num('cooldownMs')} />
          </label>
          <label>
            Poll interval (ms)
            <input type="number" value={rules.pollIntervalMs} onChange={num('pollIntervalMs')} />
          </label>
        </div>
      </div>
    </>
  )
}
