import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { SafeImage } from '../components/SafeImage'
import { StatsCounter } from '../components/StatsCounter'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useLocalizedPaintings } from '../hooks/useLocalizedPaintings'
import { useI18n } from '../i18n/I18nContext'
import { dailyHomeSelection } from '../lib/dailyRotation'
import { displayImageUrl } from '../lib/images'
import { todayKey } from '../lib/storage'
import './HomePage.css'

export function HomePage() {
  const { t } = useI18n()
  const store = usePaintingsStore()
  const day = todayKey()
  const { hero, featured } = useMemo(
    () =>
      store.status === 'ready'
        ? dailyHomeSelection(store.paintings, day)
        : { hero: null, featured: [] },
    [store.status, store.paintings, day],
  )
  const { paintings: localizedFeatured } = useLocalizedPaintings(featured)
  const { paintings: localizedHero } = useLocalizedPaintings(hero ? [hero] : [])
  const heroLocalized = localizedHero[0] || hero

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          {hero ? (
            <SafeImage
              src={displayImageUrl(hero)}
              fallbackSrc={hero.image}
              alt=""
              className="hero-image"
            />
          ) : (
            <div className="hero-fallback" />
          )}
          <div className="hero-veil" />
        </div>
        <div className="hero-copy">
          <p className="brand-hero">{t('brand')}</p>
          <h1>{t('heroTitle')}</h1>
          <p className="lede">{t('heroLede')}</p>
          <div className="hero-actions">
            <Link to="/today" className="btn primary">
              {t('navToday')}
            </Link>
            <Link to="/gallery" className="btn ghost">
              {t('enterGallery')}
            </Link>
            {heroLocalized ? (
              <Link to={`/painting/${heroLocalized.id}`} className="btn ghost">
                {t('beginWith', { name: heroLocalized.name })}
              </Link>
            ) : null}
          </div>
          <div className="hero-stats">
            <StatsCounter />
          </div>
        </div>
      </section>

      <section className="home-strip">
        <div className="home-strip-inner">
          <div>
            <h2>{t('curatedBy')}</h2>
            <p>{t('curatedBody')}</p>
          </div>
          <ul className="facts">
            <li>
              <strong>{store.status === 'ready' ? store.coreCount : '—'}</strong>
              <span>{t('works')}</span>
            </li>
            <li>
              <strong>11</strong>
              <span>{t('fieldsEach')}</span>
            </li>
            <li>
              <strong>HD</strong>
              <span>{t('hdImages')}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>{t('featured')}</h2>
          <p>{t('featuredBody')}</p>
        </div>
        {store.status === 'loading' ? <LoadingState label={t('opening')} /> : null}
        {store.status === 'error' ? <p className="error">{store.message}</p> : null}
        {store.status === 'ready' ? (
          <div className="featured-grid">
            {localizedFeatured.map((painting, index) => (
              <Link
                key={painting.id}
                to={`/painting/${painting.id}`}
                className="featured-item"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <SafeImage src={displayImageUrl(painting)} alt={painting.name} loading="lazy" />
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
            {t('browseAll', { n: store.status === 'ready' ? store.coreCount : 1000 })}
          </Link>
        </div>
      </section>
    </main>
  )
}
