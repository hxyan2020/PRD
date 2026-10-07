import { Link } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { usePaintings } from '../data/usePaintings'
import './HomePage.css'

export function HomePage() {
  const state = usePaintings()
  const hero = state.status === 'ready' ? state.paintings[0] : null
  const featured = state.status === 'ready' ? state.paintings.slice(1, 7) : []

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          {hero ? (
            <img src={hero.imageFull || hero.image} alt="" className="hero-image" />
          ) : (
            <div className="hero-fallback" />
          )}
          <div className="hero-veil" />
        </div>
        <div className="hero-copy">
          <p className="brand-hero">Mille</p>
          <h1>One thousand paintings that shaped human vision</h1>
          <p className="lede">
            A living atlas of the most widely known works in history — images, makers, museums, and
            the stories that still travel with them.
          </p>
          <div className="hero-actions">
            <Link to="/gallery" className="btn primary">
              Enter the gallery
            </Link>
            {hero ? (
              <Link to={`/painting/${hero.id}`} className="btn ghost">
                Begin with {hero.name}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="home-strip">
        <div className="home-strip-inner">
          <div>
            <h2>Curated by cultural reach</h2>
            <p>
              Ranked by Wikipedia sitelinks across languages — a practical proxy for which paintings
              have traveled farthest through human memory.
            </p>
          </div>
          <ul className="facts">
            <li>
              <strong>{state.status === 'ready' ? state.paintings.length : '—'}</strong>
              <span>works</span>
            </li>
            <li>
              <strong>11</strong>
              <span>fields each</span>
            </li>
            <li>
              <strong>HD</strong>
              <span>Commons images</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>Featured from the thousand</h2>
          <p>Step into a handful of the highest-ranked works, then open the full collection.</p>
        </div>
        {state.status === 'loading' ? <LoadingState /> : null}
        {state.status === 'error' ? <p className="error">{state.message}</p> : null}
        {state.status === 'ready' ? (
          <div className="featured-grid">
            {featured.map((painting, index) => (
              <Link
                key={painting.id}
                to={`/painting/${painting.id}`}
                className="featured-item"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <img src={painting.image} alt={painting.name} loading="lazy" />
                <div>
                  <span>#{painting.rank}</span>
                  <h3>{painting.name}</h3>
                  <p>{painting.painter}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
        <div className="featured-cta">
          <Link to="/gallery" className="btn primary">
            Browse all {state.status === 'ready' ? state.paintings.length : '1000'}
          </Link>
        </div>
      </section>
    </main>
  )
}
