import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useI18n } from '../i18n/I18nContext'
import { discoverPaintings } from '../lib/discover'
import { DEFAULT_PREFS, getPreferences, savePreferences, type Preferences } from '../lib/storage'
import type { Painting } from '../types'
import './PreferencesPage.css'

const ERA_OPTIONS = [
  'medieval',
  'renaissance',
  'baroque',
  'neoclassical-romantic',
  'impressionist-era',
  'modern',
  'contemporary',
]

const MOOD_OPTIONS = ['contemplative', 'dramatic', 'intimate', 'epic']

function toggleIn(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

export function PreferencesPage() {
  const { t } = useI18n()
  const store = usePaintingsStore()
  const [prefs, setPrefs] = useState<Preferences>(() => getPreferences())
  const [savedMsg, setSavedMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [genMsg, setGenMsg] = useState('')
  const [lastBatch, setLastBatch] = useState<Painting[]>([])

  const genres = useMemo(() => {
    const set = new Set<string>()
    for (const p of store.paintings) {
      for (const g of p.genre.split(',').map((x) => x.trim())) if (g) set.add(g)
    }
    return [...set].sort((a, b) => a.localeCompare(b)).slice(0, 40)
  }, [store.paintings])

  const countries = useMemo(() => {
    const set = new Set(store.paintings.map((p) => p.painterCountry).filter((c) => c && c !== 'Unknown'))
    return [...set].sort((a, b) => a.localeCompare(b)).slice(0, 50)
  }, [store.paintings])

  const discovered = useMemo(
    () => store.paintings.filter((p) => p.discovered).slice(0, 12),
    [store.paintings],
  )

  return (
    <main className="prefs-page">
      <header>
        <p className="eyebrow">{t('navPrefs')}</p>
        <h1>{t('prefsTitle')}</h1>
        <p>{t('prefsLede')}</p>
        <p className="pool-line">
          {t('poolSummary', {
            core: store.coreCount,
            extras: store.stats.extras,
            total: store.paintings.length,
          })}
        </p>
      </header>

      <section className="prefs-block">
        <h2>{t('genre')}</h2>
        <div className="chip-grid">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${prefs.genres.includes(g) ? 'on' : ''}`}
              onClick={() => setPrefs((p) => ({ ...p, genres: toggleIn(p.genres, g) }))}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section className="prefs-block">
        <h2>{t('painterCountry')}</h2>
        <div className="chip-grid">
          {countries.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${prefs.countries.includes(c) ? 'on' : ''}`}
              onClick={() => setPrefs((p) => ({ ...p, countries: toggleIn(p.countries, c) }))}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="prefs-block">
        <h2>{t('eras')}</h2>
        <div className="chip-grid">
          {ERA_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              className={`chip ${prefs.eras.includes(e) ? 'on' : ''}`}
              onClick={() => setPrefs((p) => ({ ...p, eras: toggleIn(p.eras, e) }))}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <section className="prefs-block">
        <h2>{t('moods')}</h2>
        <div className="chip-grid">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${prefs.moods.includes(m) ? 'on' : ''}`}
              onClick={() => setPrefs((p) => ({ ...p, moods: toggleIn(p.moods, m) }))}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <div className="prefs-actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            savePreferences(prefs)
            setSavedMsg(t('prefsSaved'))
            setTimeout(() => setSavedMsg(''), 2500)
          }}
        >
          {t('savePrefs')}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setPrefs(DEFAULT_PREFS)
            savePreferences(DEFAULT_PREFS)
            setSavedMsg(t('prefsReset'))
          }}
        >
          {t('reset')}
        </button>
        <Link to="/today" className="btn ghost">
          {t('seeTodayPick')}
        </Link>
        {savedMsg ? <span className="msg">{savedMsg}</span> : null}
      </div>

      <section className="prefs-block generate">
        <h2>{t('generateMore')}</h2>
        <p>{t('generateHint')}</p>
        <button
          type="button"
          className="btn primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setGenMsg(t('generating'))
            setLastBatch([])
            try {
              savePreferences(prefs)
              const existing = new Set(store.paintings.map((p) => p.id))
              const found = await discoverPaintings(prefs, existing)
              store.mergeExtras(found)
              setLastBatch(found)
              setGenMsg(t('generated', { n: found.length }))
            } catch (err) {
              setGenMsg(err instanceof Error ? err.message : 'Failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? t('generating') : t('generateMore')}
        </button>
        {genMsg ? <p className="msg">{genMsg}</p> : null}
        <p className="hint-daily">{t('discoverFeedsDaily')}</p>
      </section>

      {(lastBatch.length > 0 || discovered.length > 0) && (
        <section className="prefs-block results">
          <h2>{lastBatch.length ? t('justAdded') : t('yourDiscoveries')}</h2>
          <div className="discover-grid">
            {(lastBatch.length ? lastBatch : discovered).slice(0, 8).map((p) => (
              <Link key={p.id} to={`/painting/${p.id}`} className="discover-card">
                <img src={p.image} alt={p.name} loading="lazy" />
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.painter}</p>
                  <span>{t('discoveredBadge')}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="prefs-actions">
            <Link to="/today" className="btn primary">
              {t('seeTodayPick')}
            </Link>
            <Link to="/gallery" className="btn ghost">
              {t('enterGallery')}
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
