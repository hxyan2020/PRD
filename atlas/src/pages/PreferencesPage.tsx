import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { charExcerpt, ensureBaseLoaded, loadCollection } from "../lib/collection";
import {
  loadSavedDiscoverPrefs,
  runDiscoverySearch,
  saveDiscoverPrefs,
} from "../lib/discover";
import { addGamesToPool, isInPool, poolCount, readPool } from "../lib/pool";
import { setStagingGames } from "../lib/staging";
import type { DiscoverHit, DiscoverPreferences, DiscoverProgress } from "../types/discover";
import type { Game } from "../types/game";
import { useI18n, type MessageKey } from "../i18n";
import {
  loadContentI18n,
  localizeGame,
  type ContentI18nCatalog,
} from "../lib/localizeContent";
import { OriginCountry } from "../components/OriginCountry";
import { GameImage } from "../components/GameImage";
import { PrefIconSelect } from "../components/PrefIconSelect";
import {
  ludusBackdropDataUri,
  primaryCoverSrc,
} from "../lib/gameCardImage";

export function PreferencesPage() {
  const { isLoggedIn, user } = useAuth();
  const { t, locale } = useI18n();
  const [prefs, setPrefs] = useState<DiscoverPreferences>(() => loadSavedDiscoverPrefs());
  const [catalog, setCatalog] = useState<Game[]>([]);
  const [contentI18n, setContentI18n] = useState<ContentI18nCatalog | null>(null);
  const [baseIds, setBaseIds] = useState<Set<string>>(() => new Set());
  const [baseSlugs, setBaseSlugs] = useState<Set<string>>(() => new Set());
  const [baseCount, setBaseCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<DiscoverProgress | null>(null);
  const [hits, setHits] = useState<DiscoverHit[]>([]);
  const [stats, setStats] = useState<{ scanned: number; drafted: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [flashShowCollection, setFlashShowCollection] = useState(false);
  const [poolSize, setPoolSize] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.all([
      ensureBaseLoaded(),
      loadCollection(),
      loadContentI18n().catch(() => null),
    ]).then(([base, data, i18n]) => {
      setCatalog(data.games);
      setContentI18n(i18n);
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

  function showFlash(message: string, showCollection = false) {
    setFlash(message);
    setFlashShowCollection(showCollection);
  }

  async function onSearch() {
    if (!catalog.length || searching) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setSearching(true);
    setFlash(null);
    setFlashShowCollection(false);
    setHits([]);
    setStats(null);
    setProgress({ percent: 0, status: "discover.status.starting" });
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
        showFlash(t("prefs.flash.searchFailed"));
      }
    } finally {
      setSearching(false);
    }
  }

  function stopSearch() {
    abortRef.current?.abort();
    setSearching(false);
    setProgress((p) =>
      p ? { ...p, status: "discover.status.cancelled", percent: p.percent } : p,
    );
  }

  function requireLogin(): boolean {
    if (isLoggedIn) return true;
    showFlash(t("prefs.flash.loginToAdd"));
    return false;
  }

  function addOne(game: Game, source: DiscoverHit["source"]) {
    if (!requireLogin()) return;
    const display = localizeGame(game, locale, contentI18n);
    if (source === "catalog" || baseIds.has(game.id) || baseSlugs.has(game.slug)) {
      showFlash(t("prefs.flash.alreadyCatalog", { name: display.name }));
      return;
    }
    const { added } = addGamesToPool([game], undefined, {
      existingIds: baseIds,
      existingSlugs: baseSlugs,
    });
    if (!added.length) {
      showFlash(t("prefs.flash.alreadyPool", { name: display.name }));
      return;
    }
    setAddedIds((prev) => new Set([...prev, game.id]));
    setPoolSize(poolCount());
    showFlash(t("prefs.flash.addedOne", { name: display.name }), true);
  }

  function addAll() {
    if (!requireLogin()) return;
    if (!pendingHits.length) {
      showFlash(t("prefs.flash.nothingNew"));
      return;
    }
    const { added } = addGamesToPool(
      pendingHits.map((h) => h.game),
      undefined,
      { existingIds: baseIds, existingSlugs: baseSlugs },
    );
    setAddedIds((prev) => new Set([...prev, ...added.map((g) => g.id)]));
    setPoolSize(poolCount());
    showFlash(t("prefs.flash.addedMany", { n: added.length }), true);
  }

  const statusText =
    progress?.status?.startsWith("discover.")
      ? t(progress.status as MessageKey)
      : progress?.status;

  return (
    <>
      <section className="section prefs-page">
        <div className="container">
          <div className="section-head">
            <h2>{t("prefs.title")}</h2>
            <p>{t("prefs.sub")}</p>
          </div>

          <div className="meta-bar">
            <span>
              {t("prefs.baseCatalog")} <strong>{baseCount.toLocaleString()}</strong>
            </span>
            <span>
              {t("prefs.poolAdditions")} <strong>{poolSize}</strong>
            </span>
            <span>
              {t("prefs.collectionTotal")}{" "}
              <strong>{(baseCount + poolSize).toLocaleString()}</strong>
            </span>
          </div>

          {!isLoggedIn ? (
            <div className="prefs-login-hint">
              <p>
                {t("prefs.loginHint")}{" "}
                <Link to="/login?next=%2Fpreferences">{t("prefs.loginLink")}</Link>
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
              <h3>{t("prefs.yourPrefs")}</h3>

              <PrefIconSelect
                id="players"
                label={t("prefs.players")}
                value={prefs.players}
                onChange={(value) => update("players", value)}
                options={[
                  { value: "any", label: t("prefs.any"), icon: "any" },
                  { value: "alone", label: t("prefs.alone"), icon: "alone" },
                  { value: "two", label: t("prefs.two"), icon: "two" },
                  { value: "small", label: t("prefs.small"), icon: "small" },
                  { value: "group", label: t("prefs.group"), icon: "group" },
                ]}
              />

              <PrefIconSelect
                id="setting"
                label={t("prefs.setting")}
                value={prefs.setting}
                onChange={(value) => update("setting", value)}
                options={[
                  { value: "either", label: t("prefs.either"), icon: "either" },
                  { value: "indoor", label: t("prefs.indoor"), icon: "indoor" },
                  { value: "outdoor", label: t("prefs.outdoor"), icon: "outdoor" },
                ]}
              />

              <PrefIconSelect
                id="vibe"
                label={t("prefs.vibe")}
                value={prefs.vibe}
                onChange={(value) => update("vibe", value)}
                options={[
                  { value: "any", label: t("prefs.any"), icon: "any" },
                  { value: "strategy", label: t("prefs.strategy"), icon: "strategy" },
                  { value: "casual", label: t("prefs.casual"), icon: "casual" },
                  { value: "craft", label: t("prefs.craft"), icon: "craft" },
                  { value: "sport", label: t("prefs.sport"), icon: "sport" },
                  { value: "puzzle", label: t("prefs.puzzle"), icon: "puzzle" },
                  { value: "kids", label: t("prefs.kids"), icon: "kids" },
                  { value: "ritual", label: t("prefs.ritual"), icon: "ritual" },
                ]}
              />

              <PrefIconSelect
                id="era"
                label={t("prefs.era")}
                value={prefs.era}
                onChange={(value) => update("era", value)}
                options={[
                  { value: "any", label: t("prefs.eraAny"), icon: "eraAny" },
                  { value: "ancient", label: t("prefs.eraAncient"), icon: "ancient" },
                  {
                    value: "traditional",
                    label: t("prefs.eraTraditional"),
                    icon: "traditional",
                  },
                  { value: "modern", label: t("prefs.eraModern"), icon: "modern" },
                ]}
              />

              <div className="field">
                <label htmlFor="region">{t("prefs.region")}</label>
                <input
                  id="region"
                  value={prefs.region}
                  onChange={(e) => update("region", e.target.value)}
                  placeholder={t("prefs.regionPlaceholder")}
                />
              </div>

              <div className="field">
                <label htmlFor="keywords">{t("prefs.keywords")}</label>
                <input
                  id="keywords"
                  value={prefs.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  placeholder={t("prefs.keywordsPlaceholder")}
                />
              </div>

              <label className="prefs-check">
                <input
                  type="checkbox"
                  checked={prefs.includeNewDiscoveries}
                  onChange={(e) => update("includeNewDiscoveries", e.target.checked)}
                />
                {t("prefs.includeDiscoveries")}
              </label>

              <div className="cta-row">
                <button className="btn btn-primary" type="submit" disabled={searching || !catalog.length}>
                  {searching ? t("prefs.searching") : t("prefs.search")}
                </button>
                {searching ? (
                  <button className="btn btn-ghost" type="button" onClick={stopSearch}>
                    {t("prefs.cancel")}
                  </button>
                ) : null}
              </div>
            </form>

            <aside className="prefs-progress-panel">
              <h3>{t("prefs.statusTitle")}</h3>
              {!progress ? (
                <p className="prefs-muted">{t("prefs.statusIdle")}</p>
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
                    <span>{statusText}</span>
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
                    {t("prefs.scanned")}{" "}
                    <strong>{stats.scanned.toLocaleString()}</strong>
                  </span>
                  <span>
                    {t("prefs.newDrafts")} <strong>{stats.drafted}</strong>
                  </span>
                  <span>
                    {t("prefs.results")} <strong>{hits.length}</strong>
                  </span>
                </div>
              ) : null}
            </aside>
          </div>

          {flash ? (
            <div className="prefs-flash" role="status">
              {flash}{" "}
              {flashShowCollection ? (
                <Link to="/collection">{t("prefs.openCollection")}</Link>
              ) : null}
            </div>
          ) : null}

          {hits.length > 0 ? (
            <div className="prefs-results">
              <div className="prefs-results-head">
                <h3>{t("prefs.resultsTitle")}</h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addAll}
                  disabled={!pendingHits.length}
                >
                  {t("prefs.addAll", { n: pendingHits.length })}
                </button>
              </div>

              <ul className="prefs-hit-list">
                {hits.map((hit) => {
                  const display = localizeGame(hit.game, locale, contentI18n);
                  const inBase =
                    hit.source === "catalog" ||
                    baseIds.has(hit.game.id) ||
                    baseSlugs.has(hit.game.slug);
                  const inPool = addedIds.has(hit.game.id) || isInPool(hit.game.id);
                  const already = inBase || inPool;
                  const cover = primaryCoverSrc(display.images);
                  return (
                    <li key={hit.game.id} className="prefs-hit">
                      <div className="prefs-hit-main">
                        <div className="prefs-hit-img" aria-hidden="true">
                          {cover ? (
                            <GameImage
                              src={cover}
                              alt=""
                              loading="lazy"
                              label={{
                                name: display.name,
                                category: display.category,
                                originCountry: display.originCountry,
                              }}
                            />
                          ) : (
                            <img
                              src={ludusBackdropDataUri(
                                display.category,
                                display.id || display.slug,
                              )}
                              alt=""
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div>
                          <div className="prefs-hit-tags">
                            <span className="pill">{display.category}</span>
                            <span className={`badge ${hit.source === "discovery" ? "played" : "collect"}`}>
                              {hit.source === "discovery"
                                ? t("prefs.badgeDiscovery")
                                : t("prefs.badgeCatalog")}
                            </span>
                          </div>
                          <h4>{display.name}</h4>
                          <p className="meta">
                            <OriginCountry
                              country={display.originCountry}
                              countryKey={display.originCountryKey}
                            />{" "}
                            · {display.creationYear} · {display.idealParticipants}
                          </p>
                          <p className="prefs-reason">{hit.reason}</p>
                          <p className="prefs-excerpt">
                            {charExcerpt(display.description, 180)}
                          </p>
                        </div>
                      </div>
                      <div className="prefs-hit-actions">
                        <Link className="btn btn-ghost" to={`/game/${hit.game.slug}`}>
                          {t("prefs.preview")}
                        </Link>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={already}
                          onClick={() => addOne(hit.game, hit.source)}
                        >
                          {inBase
                            ? t("prefs.inCatalog")
                            : inPool
                              ? t("prefs.inPool")
                              : t("prefs.add")}
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
