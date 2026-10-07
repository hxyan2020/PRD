import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { LoadingState } from '../components/LoadingState'
import { PaintingCard } from '../components/PaintingCard'
import { StatsCounter } from '../components/StatsCounter'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useI18n } from '../i18n/I18nContext'
import './GalleryPage.css'

const PAGE_SIZE = 48

export function GalleryPage() {
  const { t } = useI18n()
  const store = usePaintingsStore()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('all')
  const [country, setCountry] = useState('all')
  const [lostOnly, setLostOnly] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const deferredQuery = useDeferredValue(query)

  const genres = useMemo(() => {
    const set = new Set<string>()
    for (const p of store.paintings) {
      for (const g of p.genre.split(',').map((x) => x.trim())) if (g) set.add(g)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [store.paintings])

  const countries = useMemo(() => {
    const set = new Set(store.paintings.map((p) => p.painterCountry).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [store.paintings])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return store.paintings.filter((p) => {
      if (lostOnly && !p.lostOrDestroyed) return false
      if (genre !== 'all' && !p.genre.toLowerCase().includes(genre.toLowerCase())) return false
      if (country !== 'all' && p.painterCountry !== country) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.painter.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.placeOfCreation.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q)
      )
    })
  }, [store.paintings, deferredQuery, genre, country, lostOnly])

  const shown = filtered.slice(0, visible)

  return (
    <main className="gallery-page">
      <header className="gallery-hero">
        <p className="eyebrow">{t('theCollection')}</p>
        <h1>{t('browseThousand')}</h1>
        <p>{t('galleryIntro')}</p>
        <div className="stats">
          <StatsCounter />
        </div>
      </header>

      <div className="filters">
        <label className="search">
          <span>{t('search')}</span>
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value
              startTransition(() => {
                setQuery(value)
                setVisible(PAGE_SIZE)
              })
            }}
            placeholder="Mona Lisa, Vermeer, Louvre…"
          />
        </label>
        <label>
          <span>{t('genre')}</span>
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value)
              setVisible(PAGE_SIZE)
            }}
          >
            <option value="all">{t('allGenres')}</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('painterCountry')}</span>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              setVisible(PAGE_SIZE)
            }}
          >
            <option value="all">{t('allCountries')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={lostOnly}
            onChange={(e) => {
              setLostOnly(e.target.checked)
              setVisible(PAGE_SIZE)
            }}
          />
          <span>{t('lostOnly')}</span>
        </label>
      </div>

      {store.status === 'loading' ? <LoadingState label={t('opening')} /> : null}
      {store.status === 'error' ? <p className="error">{store.message}</p> : null}

      {store.status === 'ready' ? (
        <>
          <p className="result-count">{t('showing', { shown: shown.length, total: filtered.length })}</p>
          <div className="gallery-masonry">
            {shown.map((painting) => (
              <PaintingCard key={painting.id} painting={painting} />
            ))}
          </div>
          {visible < filtered.length ? (
            <div className="load-more">
              <button type="button" className="btn primary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                {t('loadMore')}
              </button>
            </div>
          ) : null}
          {filtered.length === 0 ? <p className="empty">{t('noMatch')}</p> : null}
        </>
      ) : null}
    </main>
  )
}
