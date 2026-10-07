import { Link } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { PaintingCard } from '../components/PaintingCard'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useI18n } from '../i18n/I18nContext'
import { getCollectedIds } from '../lib/storage'
import './CollectionPage.css'

export function CollectionPage() {
  const { t } = useI18n()
  const store = usePaintingsStore()
  const ids = getCollectedIds()

  if (store.status === 'loading') return <LoadingState label={t('opening')} />
  if (store.status === 'error') return <main className="collection-page"><p className="error">{store.message}</p></main>

  const items = ids
    .map((id) => store.paintings.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <main className="collection-page">
      <header>
        <p className="eyebrow">{t('navCollection')}</p>
        <h1>{t('collectionTitle')}</h1>
        <p>{t('statsLine', { viewed: store.stats.viewed, collected: store.stats.collected })}</p>
      </header>
      {items.length === 0 ? (
        <p className="empty">
          {t('collectionEmpty')}{' '}
          <Link to="/today">{t('navToday')}</Link>
        </p>
      ) : (
        <div className="gallery-masonry">
          {items.map((painting) => (
            <PaintingCard key={painting!.id} painting={painting!} />
          ))}
        </div>
      )}
    </main>
  )
}
