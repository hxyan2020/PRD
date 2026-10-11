import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CountryFlags } from '../components/CountryFlags'
import { FullscreenViewer } from '../components/FullscreenViewer'
import { LoadingState } from '../components/LoadingState'
import { SafeImage } from '../components/SafeImage'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useLocalizedPainting } from '../hooks/useLocalizedPainting'
import { useI18n } from '../i18n/I18nContext'
import { displayImageUrl, hiResImageUrl, imageCandidates, withCommonsWidth } from '../lib/images'
import './PaintingPage.css'

export function PaintingPage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const store = usePaintingsStore()
  const [fullscreen, setFullscreen] = useState(false)
  const [saved, setSaved] = useState(false)

  const base = store.paintings.find((p) => p.id === id)
  const { painting, loading: localizing } = useLocalizedPainting(base)

  useEffect(() => {
    if (base) {
      store.trackView(base.id)
      setSaved(store.collected(base.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base?.id])

  if (store.status === 'loading') return <LoadingState label={t('opening')} />
  if (store.status === 'error') {
    return (
      <main className="painting-page">
        <p className="error">{store.message}</p>
      </main>
    )
  }

  if (!base || !painting) {
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
    .filter((p) => p.id !== base.id)
    .filter(
      (p) =>
        p.painter === base.painter ||
        p.genre.split(',')[0] === base.genre.split(',')[0],
    )
    .slice(0, 4)

  return (
    <main className="painting-page">
      <section className="painting-hero">
        <button type="button" className="painting-frame" onClick={() => setFullscreen(true)}>
          <SafeImage
            src={displayImageUrl(painting)}
            candidates={imageCandidates(painting)}
            alt={painting.name}
          />
          {painting.lostOrDestroyed ? <span className="lost-pill">{t('lostDestroyed')}</span> : null}
        </button>
        <div className="painting-summary">
          <p className="rank">{t('rank', { n: painting.rank || '—' })}</p>
          <h1>{painting.name}</h1>
          {localizing ? <p className="localize-hint">{t('loadingTranslation')}</p> : null}
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
              <dd>
                <CountryFlags
                  country={base.painterCountry}
                  displayName={painting.painterCountry}
                  label
                />
              </dd>
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
              onClick={() => setSaved(store.toggleCollect(base.id))}
            >
              {saved ? t('collected') : t('collect')}
            </button>
            <a
              className="btn ghost"
              href={hiResImageUrl(painting)}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              onClick={(e) => {
                const href = hiResImageUrl(painting)
                if (!href) {
                  e.preventDefault()
                  setFullscreen(true)
                  return
                }
                e.currentTarget.href = href
              }}
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
            {painting.painterBirthYear} – {painting.painterDeathYear} ·{' '}
            <CountryFlags
              country={base.painterCountry}
              displayName={painting.painterCountry}
              label
              size="sm"
            />
          </p>
          <h3>{t('anecdote')}</h3>
          <p>{painting.anecdote}</p>
        </div>
        <div className="photo-rail" aria-label="Photos of the painter">
          {painting.painterPhotos.length > 0 ? (
            painting.painterPhotos.map((src, i) => (
              <figure key={`${src}-${i}`}>
                <SafeImage
                  src={withCommonsWidth(src, 800)}
                  alt={`${painting.painter} portrait ${i + 1}`}
                  loading="lazy"
                />
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
              <LocalizedRelatedCard key={p.id} id={p.id} fallbackName={p.name} fallbackPainter={p.painter} image={p} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="back-row">
        <Link to="/gallery" className="btn primary">
          {t('returnGallery')}
        </Link>
      </div>

      <FullscreenViewer
        painting={painting}
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        collected={saved}
        onCollect={() => setSaved(store.toggleCollect(base.id))}
      />
    </main>
  )
}

function LocalizedRelatedCard({
  id,
  fallbackName,
  fallbackPainter,
  image,
}: {
  id: string
  fallbackName: string
  fallbackPainter: string
  image: { image: string; imageFull: string; name: string }
}) {
  const store = usePaintingsStore()
  const base = store.paintings.find((p) => p.id === id)
  const { painting } = useLocalizedPainting(base)
  return (
    <Link to={`/painting/${id}`} className="related-card">
      <SafeImage
        src={displayImageUrl(image)}
        candidates={imageCandidates(image)}
        alt={painting?.name || fallbackName}
        loading="lazy"
      />
      <div>
        <h3>{painting?.name || fallbackName}</h3>
        <p>{painting?.painter || fallbackPainter}</p>
      </div>
    </Link>
  )
}
