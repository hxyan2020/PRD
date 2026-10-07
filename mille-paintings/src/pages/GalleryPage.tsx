import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { CountryFlags } from '../components/CountryFlags'
import { LoadingState } from '../components/LoadingState'
import { PaintingCard } from '../components/PaintingCard'
import { StatsCounter } from '../components/StatsCounter'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useLocalizedPaintings } from '../hooks/useLocalizedPaintings'
import { useI18n } from '../i18n/I18nContext'
import { optionLabel } from '../lib/optionLabels'
import { getCollectedIds, getViewedIds } from '../lib/storage'
import type { Painting } from '../types'
import './GalleryPage.css'

const PAGE_SIZE = 48

type CollectionFilter = 'all' | 'uncollected' | 'collected'
type ViewedFilter = 'all' | 'unviewed' | 'viewed'
type PoolFilter = 'all' | 'core' | 'discovered'
type SortKey = 'rank' | 'name' | 'painter' | 'year' | 'museum' | 'sitelinks'

function yearNum(value: string): number {
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function sortPaintings(list: Painting[], sort: SortKey): Painting[] {
  const copy = [...list]
  copy.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name) || (a.rank || 9999) - (b.rank || 9999)
      case 'painter':
        return (
          a.painter.localeCompare(b.painter) ||
          a.name.localeCompare(b.name) ||
          (a.rank || 9999) - (b.rank || 9999)
        )
      case 'year':
        return (
          yearNum(a.painterBirthYear) - yearNum(b.painterBirthYear) ||
          a.name.localeCompare(b.name)
        )
      case 'museum':
        return (
          a.collection.localeCompare(b.collection) ||
          a.name.localeCompare(b.name)
        )
      case 'sitelinks':
        return b.sitelinks - a.sitelinks || (a.rank || 9999) - (b.rank || 9999)
      case 'rank':
      default:
        return (a.rank || 9999) - (b.rank || 9999) || b.sitelinks - a.sitelinks
    }
  })
  return copy
}

export function GalleryPage() {
  const { t, lang } = useI18n()
  const store = usePaintingsStore()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('all')
  const [country, setCountry] = useState('all')
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all')
  const [viewedFilter, setViewedFilter] = useState<ViewedFilter>('all')
  const [poolFilter, setPoolFilter] = useState<PoolFilter>('all')
  const [sort, setSort] = useState<SortKey>('rank')
  const [lostOnly, setLostOnly] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const deferredQuery = useDeferredValue(query)

  // Recompute when collect/view stats change.
  const collectedIds = useMemo(
    () => new Set(getCollectedIds()),
    [store.stats.collected],
  )
  const viewedIds = useMemo(() => new Set(getViewedIds()), [store.stats.viewed])

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
    const list = store.paintings.filter((p) => {
      if (lostOnly && !p.lostOrDestroyed) return false
      if (genre !== 'all' && !p.genre.toLowerCase().includes(genre.toLowerCase())) return false
      if (country !== 'all' && p.painterCountry !== country) return false
      if (poolFilter === 'core' && p.discovered) return false
      if (poolFilter === 'discovered' && !p.discovered) return false

      const isCollected = collectedIds.has(p.id)
      if (collectionFilter === 'collected' && !isCollected) return false
      if (collectionFilter === 'uncollected' && isCollected) return false

      const isViewed = viewedIds.has(p.id)
      if (viewedFilter === 'viewed' && !isViewed) return false
      if (viewedFilter === 'unviewed' && isViewed) return false

      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.painter.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.placeOfCreation.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q)
      )
    })
    return sortPaintings(list, sort)
  }, [
    store.paintings,
    deferredQuery,
    genre,
    country,
    lostOnly,
    poolFilter,
    collectionFilter,
    viewedFilter,
    sort,
    collectedIds,
    viewedIds,
  ])

  const shown = filtered.slice(0, visible)
  const { paintings: localizedShown, loading: localizing } = useLocalizedPaintings(shown)

  const resetVisible = () => setVisible(PAGE_SIZE)

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
                resetVisible()
              })
            }}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <label>
          <span>{t('genre')}</span>
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value)
              resetVisible()
            }}
          >
            <option value="all">{t('allGenres')}</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {optionLabel(lang, g)}
              </option>
            ))}
          </select>
        </label>
        <label className="country-filter">
          <span>
            {t('painterCountry')}
            {country !== 'all' ? (
              <>
                {' '}
                <CountryFlags country={country} size="sm" />
              </>
            ) : null}
          </span>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              resetVisible()
            }}
          >
            <option value="all">{t('allCountries')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {optionLabel(lang, c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('filterCollection')}</span>
          <select
            value={collectionFilter}
            onChange={(e) => {
              setCollectionFilter(e.target.value as CollectionFilter)
              resetVisible()
            }}
          >
            <option value="all">{t('filterCollectionAll')}</option>
            <option value="uncollected">{t('filterCollectionUncollected')}</option>
            <option value="collected">{t('filterCollectionCollected')}</option>
          </select>
        </label>
        <label>
          <span>{t('filterViewed')}</span>
          <select
            value={viewedFilter}
            onChange={(e) => {
              setViewedFilter(e.target.value as ViewedFilter)
              resetVisible()
            }}
          >
            <option value="all">{t('filterViewedAll')}</option>
            <option value="unviewed">{t('filterViewedUnviewed')}</option>
            <option value="viewed">{t('filterViewedViewed')}</option>
          </select>
        </label>
        <label>
          <span>{t('filterPool')}</span>
          <select
            value={poolFilter}
            onChange={(e) => {
              setPoolFilter(e.target.value as PoolFilter)
              resetVisible()
            }}
          >
            <option value="all">{t('filterPoolAll')}</option>
            <option value="core">{t('filterPoolCore')}</option>
            <option value="discovered">{t('filterPoolDiscovered')}</option>
          </select>
        </label>
        <label>
          <span>{t('sortBy')}</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey)
              resetVisible()
            }}
          >
            <option value="rank">{t('sortRank')}</option>
            <option value="sitelinks">{t('sortSitelinks')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="painter">{t('sortPainter')}</option>
            <option value="year">{t('sortYear')}</option>
            <option value="museum">{t('sortMuseum')}</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={lostOnly}
            onChange={(e) => {
              setLostOnly(e.target.checked)
              resetVisible()
            }}
          />
          <span>{t('lostOnly')}</span>
        </label>
      </div>

      {store.status === 'loading' ? <LoadingState label={t('opening')} /> : null}
      {store.status === 'error' ? <p className="error">{store.message}</p> : null}

      {store.status === 'ready' ? (
        <>
          <p className="result-count">
            {t('showing', { shown: shown.length, total: filtered.length })}
            {localizing ? ` · ${t('loadingTranslation')}` : ''}
          </p>
          <div className="gallery-masonry">
            {localizedShown.map((painting) => (
              <PaintingCard
                key={painting.id}
                painting={painting}
                collected={collectedIds.has(painting.id)}
              />
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
