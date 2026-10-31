import { getUseCases } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

export function UseCases() {
  const { lang, t } = useLanguage()
  const useCases = getUseCases(lang)

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('useCasesEyebrow')}</p>
        <h1>{t('useCasesTitle')}</h1>
        <p className="section-lede">{t('useCasesLede')}</p>
      </header>

      <div className="usecase-list">
        {useCases.map((uc) => (
          <article key={uc.id} className="usecase">
            <p className="eyebrow">{uc.industry}</p>
            <h2>{uc.title}</h2>
            <p>{uc.summary}</p>
            <div className="usecase-cols">
              <div>
                <h3>{t('modules')}</h3>
                <ul>
                  {uc.modules.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{t('poRisks')}</h3>
                <ul>
                  {uc.poRisks.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{t('successMetrics')}</h3>
                <ul>
                  {uc.successMetrics.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="why">
              <strong>{t('whyMatters')}</strong> {uc.whyInteresting}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
