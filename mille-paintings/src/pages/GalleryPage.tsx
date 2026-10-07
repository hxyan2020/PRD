import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { LoadingState } from '../components/LoadingState'
import { PaintingCard } from '../components/PaintingCard'
import { usePaintings } from '../data/usePaintings'
import './GalleryPage.css'

const PAGE_SIZE = 48

export function GalleryPage() {
  const state = usePaintings()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('all')
  const [country, setCountry] = useState('all')
  const [lostOnly, setLostOnly] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const deferredQuery = useDeferredValue(query)

  const genres = useMemo(() => {
    if (state.status !== 'ready') return []
    const set = new Set<string>()
    for (const p of state.paintings) {
      for (const g of p.genre.split(',').map((x) => x.trim())) {
        if (g) set.add(g)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [state])

  const countries = useMemo(() => {
    if (state.status !== 'ready') return []
    const set = new Set(state.paintings.map((p) => p.painterCountry).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [state])

  const filtered = useMemo(() => {
    if (state.status !== 'ready') return []
    const q = deferredQuery.trim().toLowerCase()
    return state.paintings.filter((p) => {
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
  }, [state, deferredQuery, genre, country, lostOnly])

  const shown = filtered.slice(0, visible)

  return (
    <main className="gallery-page">
      <header className="gallery-hero">
        <p className="eyebrow">The collection</p>
        <h1>Browse the thousand</h1>
        <p>
          Search by title, painter, museum, or place. Each entry carries the painting image, artist
          life dates, creation place, current collection, genre, story, and painter portraits.
        </p>
      </header>

      <div className="filters">
        <label className="search">
          <span>Search</span>
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
          <span>Genre</span>
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value)
              setVisible(PAGE_SIZE)
            }}
          >
            <option value="all">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Painter country</span>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              setVisible(PAGE_SIZE)
            }}
          >
            <option value="all">All countries</option>
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
          <span>Lost / destroyed only</span>
        </label>
      </div>

      {state.status === 'loading' ? <LoadingState /> : null}
      {state.status === 'error' ? <p className="error">{state.message}</p> : null}

      {state.status === 'ready' ? (
        <>
          <p className="result-count">
            Showing {shown.length} of {filtered.length} paintings
          </p>
          <div className="gallery-masonry">
            {shown.map((painting) => (
              <PaintingCard key={painting.id} painting={painting} />
            ))}
          </div>
          {visible < filtered.length ? (
            <div className="load-more">
              <button type="button" className="btn primary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more
              </button>
            </div>
          ) : null}
          {filtered.length === 0 ? <p className="empty">No paintings match these filters.</p> : null}
        </>
      ) : null}
    </main>
  )
}
