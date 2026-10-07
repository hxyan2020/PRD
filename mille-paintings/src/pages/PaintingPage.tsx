import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FullscreenViewer } from '../components/FullscreenViewer'
import { LoadingState } from '../components/LoadingState'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useI18n } from '../i18n/I18nContext'
import './PaintingPage.css'

export function PaintingPage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const store = usePaintingsStore()
  const [fullscreen, setFullscreen] = useState(false)
  const [saved, setSaved] = useState(false)

  const painting = store.paintings.find((p) => p.id === id)

  useEffect(() => {
    if (painting) {
      store.trackView(painting.id)
      setSaved(store.collected(painting.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painting?.id])

  if (store.status === 'loading') return <LoadingState label={t('opening')} />
  if (store.status === 'error') {
    return (
      <main className="painting-page">
        <p className="error">{store.message}</p>
      </main>
    )
  }

  if (!painting) {
    return (
      <main className="painting-page">
        <p className="empty">{t('notFound')}</p>
        <Link to="/gallery" className="btn ghost">
          {t('returnGallery')}
        </Link>
      </main>
    )
  }

  const nearby = store.paintings
    .filter((p) => p.id !== painting.id)
    .filter(
      (p) =>
        p.painter === painting.painter ||
        p.genre.split(',')[0] === painting.genre.split(',')[0],
    )
    .slice(0, 4)

  return (
    <main className="painting-page">
      <section className="painting-hero">
        <button type="button" className="painting-frame" onClick={() => setFullscreen(true)}>
          <img src={painting.imageFull || painting.image} alt={painting.name} />
          {painting.lostOrDestroyed ? <span className="lost-pill">{t('lostDestroyed')}</span> : null}
        </button>
        <div className="painting-summary">
          <p className="rank">{t('rank', { n: painting.rank || '—' })}</p>
          <h1>{painting.name}</h1>
          <p className="painter-line">
            {painting.painter}{' '}
            <span>
              ({painting.painterBirthYear}–{painting.painterDeathYear})
            </span>
          </p>
          <dl className="facts-grid">
            <div>
              <dt>{t('genre')}</dt>
              <dd>{painting.genre}</dd>
            </div>
            <div>
              <dt>{t('painterCountry')}</dt>
              <dd>{painting.painterCountry}</dd>
            </div>
            <div>
              <dt>{t('placeOfCreation')}</dt>
              <dd>{painting.placeOfCreation}</dd>
            </div>
            <div>
              <dt>{t('collectionDisplay')}</dt>
              <dd>{painting.collection}</dd>
            </div>
          </dl>
          <div className="summary-actions">
            <button type="button" className="btn primary" onClick={() => setFullscreen(true)}>
              {t('fullscreen')}
            </button>
            <button
              type="button"
              className={`btn ghost ${saved ? 'active' : ''}`}
              onClick={() => setSaved(store.toggleCollect(painting.id))}
            >
              {saved ? t('collected') : t('collect')}
            </button>
            <a
              className="btn ghost"
              href={painting.imageFull || painting.image}
              target="_blank"
              rel="noreferrer"
            >
              {t('openHiRes')}
            </a>
          </div>
        </div>
      </section>

      <section className="detail-block">
        <h2>{t('aboutPainting')}</h2>
        <p>{painting.intro}</p>
      </section>

      <section className="detail-block painter-block">
        <div>
          <h2>{t('thePainter')}</h2>
          <p className="painter-name">{painting.painter}</p>
          <p className="years">
            {painting.painterBirthYear} – {painting.painterDeathYear} · {painting.painterCountry}
          </p>
          <h3>{t('anecdote')}</h3>
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
            <div className="photo-empty">{t('noPortraits')}</div>
          )}
        </div>
      </section>

      {nearby.length ? (
        <section className="related">
          <h2>{t('related')}</h2>
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
          {t('returnGallery')}
        </Link>
      </div>

      <FullscreenViewer painting={painting} open={fullscreen} onClose={() => setFullscreen(false)} />
    </main>
  )
}
