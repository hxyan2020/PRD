import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { ensureBaseLoaded, loadCollection } from "../lib/collection";
import {
  loadSavedDiscoverPrefs,
  runDiscoverySearch,
  saveDiscoverPrefs,
} from "../lib/discover";
import { addGamesToPool, isInPool, poolCount, readPool } from "../lib/pool";
import { setStagingGames } from "../lib/staging";
import type { DiscoverHit, DiscoverPreferences, DiscoverProgress } from "../types/discover";
import type { Game } from "../types/game";

export function PreferencesPage() {
  const { isLoggedIn, user } = useAuth();
  const [prefs, setPrefs] = useState<DiscoverPreferences>(() => loadSavedDiscoverPrefs());
  const [catalog, setCatalog] = useState<Game[]>([]);
  const [baseIds, setBaseIds] = useState<Set<string>>(() => new Set());
  const [baseSlugs, setBaseSlugs] = useState<Set<string>>(() => new Set());
  const [baseCount, setBaseCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<DiscoverProgress | null>(null);
  const [hits, setHits] = useState<DiscoverHit[]>([]);
  const [stats, setStats] = useState<{ scanned: number; drafted: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [poolSize, setPoolSize] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.all([ensureBaseLoaded(), loadCollection()]).then(([base, data]) => {
      setCatalog(data.games);
      setBaseCount(base.games.length);
      setBaseIds(new Set(base.games.map((g) => g.id)));
      setBaseSlugs(new Set(base.games.map((g) => g.slug)));
      const pool = readPool();
      setPoolSize(pool.length);
      setAddedIds(new Set(pool.map((g) => g.id)));
    });
  }, [isLoggedIn, user?.id]);

  const pendingHits = useMemo(
    () =>
      hits.filter(
        (h) =>
          h.source === "discovery" &&
          !addedIds.has(h.game.id) &&
          !isInPool(h.game.id) &&
          !baseIds.has(h.game.id) &&
          !baseSlugs.has(h.game.slug),
      ),
    [hits, addedIds, baseIds, baseSlugs],
  );

  function update<K extends keyof DiscoverPreferences>(key: K, value: DiscoverPreferences[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      saveDiscoverPrefs(next);
      return next;
    });
  }

  async function onSearch() {
    if (!catalog.length || searching) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setSearching(true);
    setFlash(null);
    setHits([]);
    setStats(null);
    setProgress({ percent: 0, status: "Starting AI search…" });
    try {
      const result = await runDiscoverySearch(catalog, prefs, setProgress, ac.signal);
      setHits(result.hits);
      setStagingGames(result.hits.map((h) => h.game));
      setStats({
        scanned: result.scannedCatalog,
        drafted: result.draftedDiscoveries,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setFlash("Search failed. Try again.");
      }
    } finally {
      setSearching(false);
    }
  }

  function stopSearch() {
    abortRef.current?.abort();
    setSearching(false);
    setProgress((p) => (p ? { ...p, status: "Search cancelled", percent: p.percent } : p));
  }

  function requireLogin(): boolean {
    if (isLoggedIn) return true;
    setFlash("Log in to add games to your collection pool.");
    return false;
  }

  function addOne(game: Game, source: DiscoverHit["source"]) {
    if (!requireLogin()) return;
    if (source === "catalog" || baseIds.has(game.id) || baseSlugs.has(game.slug)) {
      setFlash(`“${game.name}” is already in the base catalog.`);
      return;
    }
    const { added } = addGamesToPool([game], undefined, {
      existingIds: baseIds,
      existingSlugs: baseSlugs,
    });
    if (!added.length) {
      setFlash(`“${game.name}” is already in the pool.`);
      return;
    }
    setAddedIds((prev) => new Set([...prev, game.id]));
    setPoolSize(poolCount());
    setFlash(`Added “${game.name}” to the collection pool.`);
  }

  function addAll() {
    if (!requireLogin()) return;
    if (!pendingHits.length) {
      setFlash("Nothing new to add—new discoveries are already in the pool.");
      return;
    }
    const { added } = addGamesToPool(
      pendingHits.map((h) => h.game),
      undefined,
      { existingIds: baseIds, existingSlugs: baseSlugs },
    );
    setAddedIds((prev) => new Set([...prev, ...added.map((g) => g.id)]));
    setPoolSize(poolCount());
    setFlash(`Added ${added.length} discoveries to the collection pool.`);
  }

  return (
    <>
      <section className="section prefs-page">
        <div className="container">
          <div className="section-head">
            <h2>Preferences & AI search</h2>
            <p>
              Set what you like. Atlas searches the catalog and can draft new
              discoveries in that nature—then you add them one-by-one or all at
              once into the collection pool.
            </p>
          </div>

              <div className="meta-bar">
            <span>
              Base catalog: <strong>{baseCount.toLocaleString()}</strong>
            </span>
            <span>
              Pool additions: <strong>{poolSize}</strong>
            </span>
            <span>
              Collection total: <strong>{(baseCount + poolSize).toLocaleString()}</strong>
            </span>
          </div>

          {!isLoggedIn ? (
            <div className="prefs-login-hint">
              <p>
                You can run searches anytime.{" "}
                <Link to="/login?next=%2Fpreferences">Log in</Link> to save finds
                into the collection pool.
              </p>
            </div>
          ) : null}

          <div className="prefs-grid">
            <form
              className="prefs-form"
              onSubmit={(e) => {
                e.preventDefault();
                void onSearch();
              }}
            >
              <h3>Your preferences</h3>

              <div className="field">
                <label htmlFor="players">Players</label>
                <select
                  id="players"
                  value={prefs.players}
                  onChange={(e) => update("players", e.target.value as DiscoverPreferences["players"])}
                >
                  <option value="any">Any</option>
                  <option value="alone">Alone</option>
                  <option value="two">2 people</option>
                  <option value="small">3–4 people</option>
                  <option value="group">Larger group / teams</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="setting">Setting</label>
                <select
                  id="setting"
                  value={prefs.setting}
                  onChange={(e) => update("setting", e.target.value as DiscoverPreferences["setting"])}
                >
                  <option value="either">Either</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="vibe">Nature / vibe</label>
                <select
                  id="vibe"
                  value={prefs.vibe}
                  onChange={(e) => update("vibe", e.target.value as DiscoverPreferences["vibe"])}
                >
                  <option value="any">Any</option>
                  <option value="strategy">Strategy</option>
                  <option value="casual">Casual / social</option>
                  <option value="craft">Craft & dolls</option>
                  <option value="sport">Sport & active</option>
                  <option value="puzzle">Puzzles & skill</option>
                  <option value="kids">Kids & family</option>
                  <option value="ritual">Ritual & festival</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="era">Era lean</label>
                <select
                  id="era"
                  value={prefs.era}
                  onChange={(e) => update("era", e.target.value as DiscoverPreferences["era"])}
                >
                  <option value="any">Any era</option>
                  <option value="ancient">Ancient</option>
                  <option value="traditional">Traditional / folk</option>
                  <option value="modern">Modern</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="region">Region / civilization</label>
                <input
                  id="region"
                  value={prefs.region}
                  onChange={(e) => update("region", e.target.value)}
                  placeholder="e.g. East Asia, West Africa, Japan…"
                />
              </div>

              <div className="field">
                <label htmlFor="keywords">Keywords</label>
                <input
                  id="keywords"
                  value={prefs.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  placeholder="e.g. stones, harvest, shadow, knots…"
                />
              </div>

              <label className="prefs-check">
                <input
                  type="checkbox"
                  checked={prefs.includeNewDiscoveries}
                  onChange={(e) => update("includeNewDiscoveries", e.target.checked)}
                />
                Also draft new AI discoveries (not yet in the catalog)
              </label>

              <div className="cta-row">
                <button className="btn btn-primary" type="submit" disabled={searching || !catalog.length}>
                  {searching ? "Searching…" : "AI search toys / games"}
                </button>
                {searching ? (
                  <button className="btn btn-ghost" type="button" onClick={stopSearch}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <aside className="prefs-progress-panel">
              <h3>Realtime search status</h3>
              {!progress ? (
                <p className="prefs-muted">
                  Set preferences and start a search. Progress appears here live.
                </p>
              ) : (
                <>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={progress.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Search progress"
                  >
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <div className="progress-meta">
                    <strong>{progress.percent}%</strong>
                    <span>{progress.status}</span>
                  </div>
                  {progress.detail ? (
                    <p className="prefs-muted">{progress.detail}</p>
                  ) : null}
                  {searching ? <div className="progress-pulse" aria-hidden="true" /> : null}
                </>
              )}

              {stats ? (
                <div className="meta-bar" style={{ marginTop: "1rem" }}>
                  <span>
                    Scanned: <strong>{stats.scanned.toLocaleString()}</strong>
                  </span>
                  <span>
                    New drafts: <strong>{stats.drafted}</strong>
                  </span>
                  <span>
                    Results: <strong>{hits.length}</strong>
                  </span>
                </div>
              ) : null}
            </aside>
          </div>

          {flash ? (
            <div className="prefs-flash" role="status">
              {flash}{" "}
              {flash.includes("Added") ? (
                <Link to="/collection">Open collection</Link>
              ) : null}
            </div>
          ) : null}

          {hits.length > 0 ? (
            <div className="prefs-results">
              <div className="prefs-results-head">
                <h3>Search results</h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addAll}
                  disabled={!pendingHits.length}
                >
                  Add all new discoveries ({pendingHits.length})
                </button>
              </div>

              <ul className="prefs-hit-list">
                {hits.map((hit) => {
                  const inBase =
                    hit.source === "catalog" ||
                    baseIds.has(hit.game.id) ||
                    baseSlugs.has(hit.game.slug);
                  const inPool = addedIds.has(hit.game.id) || isInPool(hit.game.id);
                  const already = inBase || inPool;
                  return (
                    <li key={hit.game.id} className="prefs-hit">
                      <div className="prefs-hit-main">
                        <div className="prefs-hit-img">
                          <img src={hit.game.images[0]} alt="" loading="lazy" />
                        </div>
                        <div>
                          <div className="prefs-hit-tags">
                            <span className="pill">{hit.game.category}</span>
                            <span className={`badge ${hit.source === "discovery" ? "played" : "collect"}`}>
                              {hit.source === "discovery" ? "New discovery" : "From catalog"}
                            </span>
                          </div>
                          <h4>{hit.game.name}</h4>
                          <p className="meta">
                            {hit.game.originCountry} · {hit.game.creationYear} ·{" "}
                            {hit.game.idealParticipants}
                          </p>
                          <p className="prefs-reason">{hit.reason}</p>
                          <p className="prefs-excerpt">
                            {hit.game.description.slice(0, 160)}
                            {hit.game.description.length > 160 ? "…" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="prefs-hit-actions">
                        <Link className="btn btn-ghost" to={`/game/${hit.game.slug}`}>
                          Preview
                        </Link>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={already}
                          onClick={() => addOne(hit.game, hit.source)}
                        >
                          {inBase
                            ? "In catalog"
                            : inPool
                              ? "In pool"
                              : "Add to collection"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
      <Footer total={baseCount + poolSize || undefined} />
    </>
  );
}
