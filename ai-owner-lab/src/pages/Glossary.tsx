import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchGlossary } from '../data/glossary'

export function Glossary() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [query, setQuery] = useState(initial)

  const results = useMemo(() => searchGlossary(query), [query])

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Reference</p>
        <h1>Glossary</h1>
        <p className="section-lede">
          The vocabulary you need in design reviews, incidents, and vendor calls — without needing to
          implement the systems yourself.
        </p>
        <label className="search">
          <span className="sr-only">Search glossary</span>
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value
              setQuery(value)
              if (value) setParams({ q: value })
              else setParams({})
            }}
            placeholder="Search terms — RAG, hallucination, MCP…"
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
              Related: {term.related.join(' · ')} · <em>{term.phase}</em>
            </p>
          </article>
        ))}
        {results.length === 0 ? <p>No terms match.</p> : null}
      </div>
    </div>
  )
}
