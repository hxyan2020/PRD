import { Link, useParams } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { getPaintingById, usePaintings } from '../data/usePaintings'
import './PaintingPage.css'

export function PaintingPage() {
  const { id = '' } = useParams()
  const state = usePaintings()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return (
      <main className="painting-page">
        <p className="error">{state.message}</p>
      </main>
    )
  }

  const painting = getPaintingById(state.paintings, id)
  if (!painting) {
    return (
      <main className="painting-page">
        <p className="empty">Painting not found.</p>
        <Link to="/gallery" className="btn ghost">
          Back to gallery
        </Link>
      </main>
    )
  }

  const nearby = state.paintings
    .filter((p) => p.id !== painting.id)
    .filter((p) => p.painter === painting.painter || p.genre.split(',')[0] === painting.genre.split(',')[0])
    .slice(0, 4)

  return (
    <main className="painting-page">
      <section className="painting-hero">
        <div className="painting-frame">
          <img src={painting.imageFull || painting.image} alt={painting.name} />
          {painting.lostOrDestroyed ? <span className="lost-pill">Lost / Destroyed</span> : null}
        </div>
        <div className="painting-summary">
          <p className="rank">Rank #{painting.rank}</p>
          <h1>{painting.name}</h1>
          <p className="painter-line">
            {painting.painter}{' '}
            <span>
              ({painting.painterBirthYear}–{painting.painterDeathYear})
            </span>
          </p>
          <dl className="facts-grid">
            <div>
              <dt>Genre</dt>
              <dd>{painting.genre}</dd>
            </div>
            <div>
              <dt>Painter country</dt>
              <dd>{painting.painterCountry}</dd>
            </div>
            <div>
              <dt>Place of creation</dt>
              <dd>{painting.placeOfCreation}</dd>
            </div>
            <div>
              <dt>Collection / display</dt>
              <dd>{painting.collection}</dd>
            </div>
          </dl>
          <a className="btn ghost" href={painting.imageFull || painting.image} target="_blank" rel="noreferrer">
            Open high-resolution image
          </a>
        </div>
      </section>

      <section className="detail-block">
        <h2>About the painting</h2>
        <p>{painting.intro}</p>
      </section>

      <section className="detail-block painter-block">
        <div>
          <h2>The painter</h2>
          <p className="painter-name">{painting.painter}</p>
          <p className="years">
            {painting.painterBirthYear} – {painting.painterDeathYear} · {painting.painterCountry}
          </p>
          <h3>Anecdote &amp; life note</h3>
          <p>{painting.anecdote}</p>
        </div>
        <div className="photo-rail" aria-label="Photos of the painter">
          {painting.painterPhotos.length > 0 ? (
            painting.painterPhotos.map((src, i) => (
              <figure key={`${src}-${i}`}>
                <img src={src} alt={`${painting.painter} portrait ${i + 1}`} loading="lazy" />
              </figure>
            ))
          ) : (
            <div className="photo-empty">No public-domain portraits found for this painter in Wikidata.</div>
          )}
        </div>
      </section>

      {nearby.length ? (
        <section className="related">
          <h2>Related works</h2>
          <div className="related-grid">
            {nearby.map((p) => (
              <Link key={p.id} to={`/painting/${p.id}`} className="related-card">
                <img src={p.image} alt={p.name} loading="lazy" />
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.painter}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="back-row">
        <Link to="/gallery" className="btn primary">
          Return to gallery
        </Link>
      </div>
    </main>
  )
}
