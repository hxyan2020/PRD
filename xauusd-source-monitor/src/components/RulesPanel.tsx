import type { ChangeEvent } from 'react'
import { useLocale } from '../i18n/locale'
import { RULE_KEYS } from '../i18n/messages'
import type { MonitorRules } from '../types'

export function RulesPanel(props: {
  rules: MonitorRules
  setRules: (r: MonitorRules) => void
}) {
  const { t } = useLocale()
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
        <h2>{t('rulesTitle')}</h2>
        <p className="sub">{t('rulesSub')}</p>
        <div className="rules-grid">
          {RULE_KEYS.map((r) => (
            <article key={r.id} className="rule-card">
              <h3>{t(r.title)}</h3>
              <p>{t(r.detail)}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>{t('tunableTitle')}</h2>
        <p className="sub">{t('tunableSub')}</p>
        <div className="form-grid">
          <label>
            {t('watchDev')}
            <input
              type="number"
              value={rules.watchDeviationBps}
              onChange={num('watchDeviationBps')}
            />
          </label>
          <label>
            {t('alertDev')}
            <input
              type="number"
              value={rules.alertDeviationBps}
              onChange={num('alertDeviationBps')}
            />
          </label>
          <label>
            {t('minAlertSources')}
            <input type="number" value={rules.minAlertSources} onChange={num('minAlertSources')} />
          </label>
          <label>
            {t('minExchangeWatch')}
            <input
              type="number"
              value={rules.minExchangeWatch}
              onChange={num('minExchangeWatch')}
            />
          </label>
          <label>
            {t('minLpWatch')}
            <input type="number" value={rules.minLpWatch} onChange={num('minLpWatch')} />
          </label>
          <label>
            {t('compositeMove')}
            <input
              type="number"
              value={rules.compositeMoveBps5m}
              onChange={num('compositeMoveBps5m')}
            />
          </label>
          <label>
            {t('staleAfter')}
            <input type="number" value={rules.staleAfterMs} onChange={num('staleAfterMs')} />
          </label>
          <label>
            {t('cooldown')}
            <input type="number" value={rules.cooldownMs} onChange={num('cooldownMs')} />
          </label>
          <label>
            {t('pollInterval')}
            <input type="number" value={rules.pollIntervalMs} onChange={num('pollIntervalMs')} />
          </label>
        </div>
      </div>
    </>
  )
}
