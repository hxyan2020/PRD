import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { PaintingCard } from '../components/PaintingCard'
import { StatsCounter } from '../components/StatsCounter'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useLocalizedPaintings } from '../hooks/useLocalizedPaintings'
import { useI18n } from '../i18n/I18nContext'
import { getCollectedIds } from '../lib/storage'
import type { Painting } from '../types'
import './CollectionPage.css'

export function CollectionPage() {
  const { t } = useI18n()
  const store = usePaintingsStore()
  const ids = useMemo(() => getCollectedIds(), [store.stats.collected])

  const items = useMemo(
    () =>
      ids
        .map((id) => store.paintings.find((p) => p.id === id))
        .filter((p): p is Painting => Boolean(p)),
    [ids, store.paintings],
  )
  const { paintings: localized } = useLocalizedPaintings(items)

  if (store.status === 'loading') return <LoadingState label={t('opening')} />
  if (store.status === 'error') {
    return (
      <main className="collection-page">
        <p className="error">{store.message}</p>
      </main>
    )
  }

  return (
    <main className="collection-page">
      <header>
        <p className="eyebrow">{t('navCollection')}</p>
        <h1>{t('collectionTitle')}</h1>
        <div className="collection-stats">
          <StatsCounter />
        </div>
      </header>
      {items.length === 0 ? (
        <p className="empty">
          {t('collectionEmpty')}{' '}
          <Link to="/today">{t('navToday')}</Link>
        </p>
      ) : (
        <div className="gallery-masonry">
          {localized.map((painting) => (
            <PaintingCard key={painting.id} painting={painting} collected />
          ))}
        </div>
      )}
    </main>
  )
}
