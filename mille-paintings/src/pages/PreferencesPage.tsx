import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CountryFlags } from '../components/CountryFlags'
import { GenreIcon } from '../components/GenreIcon'
import { SafeImage } from '../components/SafeImage'
import { useAuth } from '../data/AuthProvider'
import { usePaintingsStore } from '../data/PaintingsProvider'
import { useLocalizedPaintings } from '../hooks/useLocalizedPaintings'
import { useI18n } from '../i18n/I18nContext'
import {
  discoverPaintings,
  preferenceSearchQuery,
  type DiscoverProgress,
  type DiscoverStep,
} from '../lib/discover'
import { displayImageUrl } from '../lib/images'
import { optionLabel } from '../lib/optionLabels'
import {
  COUNTRY_GROUPS,
  ERA_OPTIONS,
  GENRE_GROUPS,
  MOOD_OPTIONS,
} from '../lib/preferenceOptions'
import { DEFAULT_PREFS, getPreferences, savePreferences, type Preferences } from '../lib/storage'
import type { Painting } from '../types'
import './PreferencesPage.css'

function toggleIn(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

function stepIcon(status: DiscoverStep['status']): string {
  switch (status) {
    case 'running':
      return '…'
    case 'ok':
      return '✓'
    case 'empty':
      return '○'
    case 'error':
      return '!'
    case 'skipped':
      return '–'
    default:
      return '·'
  }
}

export function PreferencesPage() {
  const { t, lang } = useI18n()
  const store = usePaintingsStore()
  const { persistLibrary } = useAuth()
  const [prefs, setPrefs] = useState<Preferences>(() => getPreferences())
  const [savedMsg, setSavedMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [genMsg, setGenMsg] = useState('')
  const [lastBatch, setLastBatch] = useState<Painting[]>([])
  const [progress, setProgress] = useState<DiscoverProgress | null>(null)

  const collectionGenres = useMemo(() => {
    const curated = new Set(GENRE_GROUPS.flatMap((g) => g.options.map((x) => x.toLowerCase())))
    const set = new Set<string>()
    for (const p of store.paintings) {
      for (const g of p.genre.split(',').map((x) => x.trim())) {
        if (g && !curated.has(g.toLowerCase())) set.add(g)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b)).slice(0, 24)
  }, [store.paintings])

  const discovered = useMemo(
    () => store.paintings.filter((p) => p.discovered).slice(0, 12),
    [store.paintings],
  )
  const discoverCards = (lastBatch.length ? lastBatch : discovered).slice(0, 8)
  const { paintings: localizedDiscover } = useLocalizedPaintings(discoverCards)

  return (
    <main className="prefs-page">
      <header>
        <p className="eyebrow">{t('navPrefs')}</p>
        <h1>{t('prefsTitle')}</h1>
        <p>{t('prefsLede')}</p>
        <p className="prefs-world-note">{t('prefsWorldNote')}</p>
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
        <p className="prefs-section-lede">{t('prefsGenreLede')}</p>
        {GENRE_GROUPS.map((group) => (
          <div key={group.id} className="prefs-subgroup">
            <h3>{t(group.labelKey)}</h3>
            <div className="chip-grid">
              {group.options.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`chip chip-genre ${prefs.genres.includes(g) ? 'on' : ''}`}
                  onClick={() => setPrefs((p) => ({ ...p, genres: toggleIn(p.genres, g) }))}
                >
                  <GenreIcon genre={g} />
                  <span>{optionLabel(lang, g)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {collectionGenres.length ? (
          <div className="prefs-subgroup">
            <h3>{t('prefsGroupFromCollection')}</h3>
            <div className="chip-grid">
              {collectionGenres.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`chip chip-genre ${prefs.genres.includes(g) ? 'on' : ''}`}
                  onClick={() => setPrefs((p) => ({ ...p, genres: toggleIn(p.genres, g) }))}
                >
                  <GenreIcon genre={g} />
                  <span>{optionLabel(lang, g)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="prefs-block">
        <h2>{t('painterCountry')}</h2>
        <p className="prefs-section-lede">{t('prefsCountryLede')}</p>
        {COUNTRY_GROUPS.map((group) => (
          <div key={group.id} className="prefs-subgroup">
            <h3>{t(group.labelKey)}</h3>
            <div className="chip-grid">
              {group.options.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip chip-country ${prefs.countries.includes(c) ? 'on' : ''}`}
                  onClick={() => setPrefs((p) => ({ ...p, countries: toggleIn(p.countries, c) }))}
                >
                  <CountryFlags country={c} size="sm" />
                  <span>{optionLabel(lang, c)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="prefs-block">
        <h2>{t('eras')}</h2>
        <p className="prefs-section-lede">{t('prefsEraLede')}</p>
        <div className="chip-grid">
          {ERA_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              className={`chip ${prefs.eras.includes(e) ? 'on' : ''}`}
              onClick={() => setPrefs((p) => ({ ...p, eras: toggleIn(p.eras, e) }))}
            >
              {optionLabel(lang, e)}
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
              {optionLabel(lang, m)}
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
            void persistLibrary()
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
            void persistLibrary()
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
        <p className="discover-query-preview">
          {t('discoverQueryPreview', { q: preferenceSearchQuery(prefs) })}
        </p>
        <button
          type="button"
          className="btn primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setGenMsg(t('generating'))
            setLastBatch([])
            setProgress({
              steps: [],
              totalFound: 0,
              phase: 'preparing',
              message: t('generating'),
            })
            try {
              savePreferences(prefs)
              void persistLibrary()
              // Pass the full owned pool (core 1000 + prior discoveries) so
              // cross-source duplicates are skipped by title/painter/image, not only id.
              const found = await discoverPaintings(
                prefs,
                store.paintings,
                (p) => {
                  setProgress(p)
                  setGenMsg(p.message)
                },
                t,
              )
              store.mergeExtras(found)
              setLastBatch(found)
              setGenMsg(t('generated', { n: found.length }))
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed'
              setGenMsg(message)
              setProgress((prev) =>
                prev
                  ? { ...prev, phase: 'error', message }
                  : { steps: [], totalFound: 0, phase: 'error', message },
              )
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? t('generating') : t('generateMore')}
        </button>

        {progress ? (
          <div className="discover-status" aria-live="polite">
            <div className="discover-status-head">
              <p className="discover-status-msg">{progress.message}</p>
              <p className="discover-status-count">
                {t('discoverFoundSoFar', { n: progress.totalFound })}
              </p>
            </div>
            <div
              className="discover-progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                progress.phase === 'done' || progress.phase === 'error'
                  ? 100
                  : Math.min(
                      95,
                      Math.round(
                        (progress.steps.filter((s) => s.status !== 'pending' && s.status !== 'running')
                          .length /
                          Math.max(progress.steps.length, 1)) *
                          100,
                      ),
                    )
              }
            >
              <span
                style={{
                  width:
                    progress.phase === 'done' || progress.phase === 'error'
                      ? '100%'
                      : `${Math.min(
                          95,
                          Math.round(
                            (progress.steps.filter(
                              (s) => s.status !== 'pending' && s.status !== 'running',
                            ).length /
                              Math.max(progress.steps.length, 1)) *
                              100,
                          ),
                        )}%`,
                }}
              />
            </div>
            <ol className="discover-steps">
              {progress.steps.map((step) => (
                <li key={step.id} className={`discover-step status-${step.status}`}>
                  <span className="discover-step-icon" aria-hidden="true">
                    {stepIcon(step.status)}
                  </span>
                  <div>
                    <strong>{step.source}</strong>
                    <span>{step.detail}</span>
                  </div>
                  {step.found > 0 ? <em>+{step.found}</em> : null}
                </li>
              ))}
            </ol>
            <p className="discover-sources-note">{t('discoverSourcesNote')}</p>
          </div>
        ) : null}

        {genMsg && !progress ? <p className="msg">{genMsg}</p> : null}
        {genMsg && progress?.phase === 'done' ? <p className="msg">{genMsg}</p> : null}
        <p className="hint-daily">{t('discoverFeedsDaily')}</p>
      </section>

      {(lastBatch.length > 0 || discovered.length > 0) && (
        <section className="prefs-block results">
          <h2>{lastBatch.length ? t('justAdded') : t('yourDiscoveries')}</h2>
          <div className="discover-grid">
            {localizedDiscover.map((p) => (
              <Link key={p.id} to={`/painting/${p.id}`} className="discover-card">
                <SafeImage
                  src={displayImageUrl(p)}
                  fallbackSrc={p.imageFull && p.imageFull !== displayImageUrl(p) ? p.imageFull : p.image}
                  alt={p.name}
                  loading="lazy"
                />
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
