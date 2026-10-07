import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FullscreenViewer } from '../components/FullscreenViewer'
import { LoadingState } from '../components/LoadingState'
import { StatsCounter } from '../components/StatsCounter'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useI18n } from '../i18n/I18nContext'
import { pickDailyPainting, pickSurprise } from '../lib/recommend'
import type { Painting } from '../types'
import './TodayPage.css'

export function TodayPage() {
  const { t } = useI18n()
  const store = usePaintingsStore()
  const [current, setCurrent] = useState<Painting | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [saved, setSaved] = useState(false)

  const daily = useMemo(() => {
    if (store.status !== 'ready' || !store.paintings.length) return null
    return pickDailyPainting(store.paintings)
  }, [store.status, store.paintings])

  useEffect(() => {
    if (daily) {
      setCurrent(daily)
      store.trackView(daily.id)
      setSaved(store.collected(daily.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily?.id])

  if (store.status === 'loading') return <LoadingState label={t('opening')} />
  if (store.status === 'error') return <main className="today-page"><p className="error">{store.message}</p></main>
  if (!current) return null

  return (
    <main className="today-page">
      <header className="today-head">
        <p className="eyebrow">{t('navToday')}</p>
        <h1>{t('todayTitle')}</h1>
        <p>{t('todayLede')}</p>
        <div className="stats">
          <StatsCounter />
        </div>
      </header>

      <section className="today-stage">
        <button type="button" className="today-image" onClick={() => setFullscreen(true)}>
          <img src={current.image} alt={current.name} />
        </button>
        <div className="today-meta">
          <p className="rank">{t('rank', { n: current.rank || '—' })}</p>
          <h2>{current.name}</h2>
          <p className="painter">
            {current.painter} ({current.painterBirthYear}–{current.painterDeathYear})
          </p>
          <p className="blurb">{current.intro.slice(0, 280)}{current.intro.length > 280 ? '…' : ''}</p>
          <div className="today-actions">
            <button type="button" className="btn primary" onClick={() => setFullscreen(true)}>
              {t('fullscreen')}
            </button>
            <button
              type="button"
              className={`btn ghost ${saved ? 'active' : ''}`}
              onClick={() => setSaved(store.toggleCollect(current.id))}
            >
              {saved ? t('collected') : t('collect')}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const next = pickSurprise(store.paintings, current.id)
                setCurrent(next)
                store.trackView(next.id)
                setSaved(store.collected(next.id))
              }}
            >
              {t('surpriseMe')}
            </button>
            <Link to={`/painting/${current.id}`} className="btn ghost">
              {t('aboutPainting')}
            </Link>
          </div>
        </div>
      </section>

      <FullscreenViewer
        painting={current}
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        collected={saved}
        onCollect={() => setSaved(store.toggleCollect(current.id))}
        onSurprise={() => {
          const next = pickSurprise(store.paintings, current.id)
          setCurrent(next)
          store.trackView(next.id)
          setSaved(store.collected(next.id))
        }}
      />
    </main>
  )
}
