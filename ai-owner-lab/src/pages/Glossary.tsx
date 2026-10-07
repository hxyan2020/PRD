import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchGlossaryLang } from '../data/content'
import { useLanguage } from '../i18n/LanguageContext'

export function Glossary() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [query, setQuery] = useState(initial)
  const { lang, t } = useLanguage()
  const results = useMemo(() => searchGlossaryLang(lang, query), [lang, query])

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('glossaryEyebrow')}</p>
        <h1>{t('glossaryTitle')}</h1>
        <p className="section-lede">{t('glossaryLede')}</p>
        <label className="search">
          <span className="sr-only">{t('glossaryTitle')}</span>
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value
              setQuery(value)
              if (value) setParams({ q: value })
              else setParams({})
            }}
            placeholder={t('searchGlossary')}
          />
        </label>
      </header>

      <div className="glossary-list">
        {results.map((term) => (
          <article key={term.term} className="glossary-item" id={term.term}>
            <h2>{term.term}</h2>
            <p className="glossary-short">{term.short}</p>
            <p>{term.detail}</p>
            <p className="related">
              {t('related')}: {term.related.join(' · ')} · <em>{term.phase}</em>
            </p>
          </article>
        ))}
        {results.length === 0 ? <p>{t('noTerms')}</p> : null}
      </div>
    </div>
  )
}
