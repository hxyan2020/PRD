import { useEffect, useMemo, useState } from "react";
import CollectButton from "./CollectButton.jsx";
import Collections from "./Collections.jsx";
import DailyRecommend from "./DailyRecommend.jsx";
import ListenPrefs from "./ListenPrefs.jsx";
import { loadListenPrefs } from "./listenPrefs.js";
import { useI18n } from "./I18n.jsx";
import RecommendLog from "./RecommendLog.jsx";
import SpotifyAddButton from "./SpotifyAddButton.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import TrackCard from "./TrackCard.jsx";
import { loadExtraTracks } from "./beyond.js";
import { loadCollectedIds, loadCollection, saveCollection, toggleCollected, formatCollectedAt } from "./collections.js";
import { loadViewedIds, markViewed, mergeViewedWithCollected, saveViewedIds } from "./viewed.js";
import { appendRecommendation, loadRecommendLog, saveRecommendLog } from "./recommendLog.js";
import { useSpotify } from "./useSpotify.js";
import { decadeOf, uniqueSorted } from "./format.js";
import { formatStatus } from "./i18n.js";
import { displayEraLabel, displayGenre, displayReleaseCountry } from "./display-labels.js";
import { hxPathForRoute, sendHxBeacon } from "./hx.js";
import { pageAllowsTrack, parseRoute, routeHash } from "./pages.js";
import { SiteDoc, SiteFooter, SiteMenu } from "./SitePages.jsx";
import { publicUrl } from "./urls.js";
import CountryFlagName from "./CountryFlagName.jsx";
import PortraitGallery from "./PortraitGallery.jsx";
import { displayPersonName, splitCredits } from "./portraits.js";
import { artistLabel, creditLabel, playsLabel, popularityLabel } from "./uiText.js";
import BootScreen from "./BootScreen.jsx";
import BrandMark from "./BrandMark.jsx";

export default function App() {
  const { locale, t } = useI18n();
  const [data, setData] = useState(null);
  const [portraits, setPortraits] = useState({ people: {} });
  const [error, setError] = useState("");
  const [bootReady, setBootReady] = useState(false);
  const [bootStarted] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All genres");
  const [era, setEra] = useState("All eras");
  const [country, setCountry] = useState("All countries");
  const [sort, setSort] = useState("influence");
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const selectedId = pageAllowsTrack(route.page) ? route.trackId : "";
  const page = route.page;
  const [playingId, setPlayingId] = useState("");
  const [collection, setCollection] = useState(loadCollection);
  const collectedIds = collection.ids;
  const collectedAt = collection.collectedAt;
  const [viewedIds, setViewedIds] = useState(() => {
    const collected = loadCollectedIds();
    const viewed = loadViewedIds();
    const merged = mergeViewedWithCollected(viewed, collected);
    if (merged.length !== viewed.length) saveViewedIds(merged);
    return merged;
  });
  const [recommendLog, setRecommendLog] = useState(loadRecommendLog);
  const [extras] = useState(loadExtraTracks);
  const spotify = useSpotify();

  useEffect(() => {
    fetch(publicUrl("catalog.json"))
      .then((r) => {
        if (!r.ok) throw new Error("Catalog failed to load");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
    fetch(publicUrl("portraits.json"))
      .then((r) => (r.ok ? r.json() : { people: {} }))
      .then((payload) => setPortraits(payload?.people ? payload : { people: {} }))
      .catch(() => setPortraits({ people: {} }));
  }, []);

  useEffect(() => {
    if (!data || error) return undefined;
    const remaining = Math.max(0, 720 - (Date.now() - bootStarted));
    const timer = window.setTimeout(() => setBootReady(true), remaining);
    return () => window.clearTimeout(timer);
  }, [data, error, bootStarted]);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (selectedId) rememberView(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const path = hxPathForRoute(page, selectedId);
    void sendHxBeacon({
      path,
      host: window.location.host,
      referer: document.referrer || "",
    });
  }, [page, selectedId]);

  const tracks = data?.tracks || [];
  const extraList = Object.values(extras);
  const library = useMemo(() => {
    const byId = new Map();
    for (const track of tracks) byId.set(track.id, track);
    for (const track of extraList) if (!byId.has(track.id)) byId.set(track.id, track);
    return [...byId.values()];
  }, [tracks, extras]);
  const selected = library.find((item) => item.id === selectedId) || null;
  const playing = library.find((item) => item.id === playingId) || selected;

  useEffect(() => {
    if (selected) spotify.checkSaved(selected);
  }, [selectedId, spotify.user]);

  const facets = useMemo(() => {
    const genres = uniqueSorted(tracks.flatMap((item) => (item.genres?.length ? item.genres : [item.genre])));
    const eras = uniqueSorted(tracks.map((item) => decadeOf(item.year)));
    const countries = uniqueSorted(tracks.map((item) => item.releaseCountry));
    return { genres, eras, countries };
  }, [tracks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tracks.filter((item) => {
      if (genre !== "All genres" && item.genre !== genre && !(item.genres || []).includes(genre)) return false;
      if (era !== "All eras" && decadeOf(item.year) !== era) return false;
      if (country !== "All countries" && item.releaseCountry !== country) return false;
      if (!q) return true;
      const blob = [
        item.name,
        item.composer,
        item.singer,
        item.band,
        item.writer,
        item.musicCompany,
        item.genre,
        item.releaseCountry,
        String(item.year || ""),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sort === "streams") return (b.streams || 0) - (a.streams || 0);
      if (sort === "year-asc") return (a.year || 9999) - (b.year || 9999);
      if (sort === "year-desc") return (b.year || 0) - (a.year || 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.rank - b.rank;
    });
    return list;
  }, [tracks, query, genre, era, country, sort]);

  function rememberView(id) {
    if (!id) return;
    setViewedIds((current) => {
      const next = markViewed(current, id);
      if (next === current || next.length === current.length) return current;
      saveViewedIds(next);
      return next;
    });
  }

  function openTrack(track, play = false) {
    rememberView(track.id);
    window.location.hash = routeHash(page, track.id);
    if (play) setPlayingId(track.id);
  }

  function onToggleCollect(id) {
    rememberView(id);
    setCollection((current) => {
      const next = toggleCollected(current, id);
      saveCollection(next);
      return next;
    });
  }

  function onRecommend(entry) {
    setRecommendLog((current) => {
      const next = appendRecommendation(current, entry);
      if (next === current) return current;
      saveRecommendLog(next);
      return next;
    });
  }

  if (error) {
    return <BootScreen error message={t("loadError", { error })} />;
  }

  if (!data || !bootReady) {
    return <BootScreen message={t("opening")} />;
  }

  return (
    <div className={`app ${selected ? "has-drawer" : ""}`}>
      <SiteMenu page={page} />
      {spotify.status && page !== "home" ? (
        <p className="spotify-status app-spotify-status" role="status">
          {formatStatus(locale, spotify.status)}
        </p>
      ) : null}
      <header className="mast">
        <div className="mast-brand">
          <p className="eyebrow">{t("archiveEyebrow")}</p>
          <h1>
            <a className="brand-link" href="#">
              <BrandMark alt="" />
              <span className="brand-name">Canon</span>
            </a>
          </h1>
          <p className="lede">{t("lede")}</p>
        </div>
        <div className="stats-wrap">
          <dl className="stats" aria-label={t("libraryCounts")}>
            <div>
              <dt>{t("songsInArchive")}</dt>
              <dd>
                <a href="#archive" className="stats-link">
                  {data.count}
                </a>
              </dd>
            </div>
            <div>
              <dt>{t("viewed")}</dt>
              <dd>{viewedIds.length}</dd>
            </div>
            <div>
              <dt>{t("collected")}</dt>
              <dd>
                <a href="#collections" className="stats-link">
                  {collectedIds.length}
                </a>
              </dd>
            </div>
          </dl>
          <p className="stats-note">{t("statsNote")}</p>
        </div>
      </header>

      {page === "about" || page === "terms" ? (
        <SiteDoc page={page} />
      ) : page === "archive" ? (
        <>
      <section className="controls" aria-label={t("filterArchive")}>
        <input
          className="search"
          type="search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label={t("allGenres")}>
          <option value="All genres">{t("allGenres")}</option>
          {facets.genres.map((item) => {
            const label = displayGenre(item, locale);
            return (
              <option key={item} value={item} label={label}>
                {label}
              </option>
            );
          })}
        </select>
        <select value={era} onChange={(e) => setEra(e.target.value)} aria-label={t("allEras")}>
          <option value="All eras">{t("allEras")}</option>
          {facets.eras.map((item) => {
            const label = displayEraLabel(item, t, locale);
            return (
              <option key={item} value={item} label={label}>
                {label}
              </option>
            );
          })}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t("allCountries")}>
          <option value="All countries">{t("allCountries")}</option>
          {facets.countries.map((item) => {
            const label = displayReleaseCountry(item, locale, t);
            return (
              <option key={item} value={item} label={label}>
                {label}
              </option>
            );
          })}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="influence">{t("sortInfluence")}</option>
          <option value="streams">{t("sortStreams")}</option>
          <option value="year-asc">{t("sortOldest")}</option>
          <option value="year-desc">{t("sortNewest")}</option>
          <option value="name">{t("sortTitle")}</option>
        </select>
      </section>

      <p className="result-count">{t("showing", { n: visible.length, total: tracks.length })}</p>
      {visible.length === 0 && <p className="empty">{t("emptyFilters")}</p>}

      <main className="grid" aria-label={t("catalog")}>
        {visible.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            selected={selectedId === track.id}
            collectedIds={collectedIds}
            collectedAt={collectedAt}
            onToggleCollect={onToggleCollect}
            onOpen={openTrack}
            spotify={spotify}
          />
        ))}
      </main>
        </>
      ) : page === "collections" ? (
        <>
          <Collections
            tracks={library}
            collectedIds={collectedIds}
            collectedAt={collectedAt}
            selectedId={selectedId}
            onToggleCollect={onToggleCollect}
            onOpen={openTrack}
            spotify={spotify}
          />
        </>
      ) : page === "log" ? (
        <>
          <RecommendLog log={recommendLog} tracks={library} onOpen={openTrack} />
        </>
      ) : page === "prefs" ? (
        <ListenPrefs countries={facets.countries} genres={facets.genres} />
      ) : (
        <>
          <DailyRecommend
            tracks={tracks}
            onListen={(track) => openTrack(track, true)}
            onView={(track) => rememberView(track.id)}
            onRecommend={onRecommend}
            collectedIds={collectedIds}
            collectedAt={collectedAt}
            onToggleCollect={onToggleCollect}
            spotify={spotify}
          />
        </>
      )}

      {selected && (
        <aside className="drawer" aria-label={t("detailsFor", { name: selected.name })}>
          <button
            className="close"
            type="button"
            onClick={() => {
              window.location.hash = routeHash(page);
            }}
          >
            {t("close")}
          </button>
          <img className="drawer-cover" src={selected.coverUrl} alt={t("coverAlt", { name: selected.name })} />
          <p className="eyebrow">{selected.extra ? t("beyondOutside") : t("canonRank", { n: selected.rank })}</p>
          <h2>{selected.name}</h2>
          <p className="spotify-title">{selected.spotifyTitle}</p>
          {selected.anecdote ? (
            <section className="anecdote-block">
              <h3>{t("songAnecdote")}</h3>
              <p className="anecdote-text">{selected.anecdote}</p>
              <p className="anecdote-kicker">{t("anecdoteNote")}</p>
            </section>
          ) : null}
          <dl className="facts">
            <div>
              <dt>{t("composer")}</dt>
              <dd>{creditLabel(selected.composer, t)}</dd>
            </div>
            <div>
              <dt>{t("singer")}</dt>
              <dd>{creditLabel(selected.singer, t)}</dd>
            </div>
            <div>
              <dt>{t("band")}</dt>
              <dd>{creditLabel(selected.band, t)}</dd>
            </div>
            <div>
              <dt>{t("writer")}</dt>
              <dd>{creditLabel(selected.writer, t)}</dd>
            </div>
            <div>
              <dt>{t("musicCompany")}</dt>
              <dd>{creditLabel(selected.musicCompany, t)}</dd>
            </div>
            <div>
              <dt>{t("yearOfRelease")}</dt>
              <dd>{selected.year || t("notListed")}</dd>
            </div>
            <div>
              <dt>{t("releaseCountry")}</dt>
              <dd>
                <CountryFlagName value={selected.releaseCountry} />
              </dd>
            </div>
            <div>
              <dt>{t("genre")}</dt>
              <dd>{displayGenre(selected.genre, locale) || creditLabel(selected.genre, t)}</dd>
            </div>
            <div>
              <dt>{t("popularity")}</dt>
              <dd>
                {selected.extra
                  ? t("spotifyPopularity", { n: selected.popularity || 0 })
                  : popularityLabel(selected.streams, t)}
              </dd>
            </div>
            {collectedIds.includes(selected.id) ? (
              <div>
                <dt>{t("collected")}</dt>
                <dd>{formatCollectedAt(collectedAt[selected.id], locale) === "Date not recorded"
                  ? t("dateNotRecorded")
                  : formatCollectedAt(collectedAt[selected.id], locale)}</dd>
              </div>
            ) : null}
          </dl>
          <h3>{t("whyShortlisted")}</h3>
          <p className="why">
            {selected.extra
              ? loadListenPrefs().mood || loadListenPrefs().country || loadListenPrefs().genre
                ? t("beyondWhy")
                : t("beyondWhyPopular")
              : selected.whyShortlisted}
          </p>
          {selected.wikipediaUrl ? (
          <p className="wiki">
            <a href={selected.wikipediaUrl} target="_blank" rel="noreferrer">
              {t("encyclopedia")}
            </a>
          </p>
          ) : null}
          {splitCredits(selected.singer).map((name) => (
            <PortraitGallery
              key={`singer-${name}`}
              name={`${t("singerAnecdote")} · ${displayPersonName(name)}`}
              portrait={portraits.people?.[name]}
            />
          ))}
          {splitCredits(selected.band).map((name) => (
            <PortraitGallery
              key={`band-${name}`}
              name={`${t("bandAnecdote")} · ${displayPersonName(name)}`}
              portrait={portraits.people?.[name]}
            />
          ))}
          <div className="card-actions drawer-actions">
            <button type="button" onClick={() => setPlayingId(selected.id)}>
              {t("streamInPlayer")}
            </button>
            <CollectButton id={selected.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
            <SpotifyAddButton track={selected} spotify={spotify} />
          </div>
          <LyricsPanel track={selected} />
        </aside>
      )}

      <SiteFooter page={page} />

      {playing && (
        <footer className="dock">
          <img src={playing.coverUrl} alt="" />
          <div>
            <p className="dock-title">{playing.name}</p>
            <p className="dock-sub">
              {artistLabel(playing, t)} ·{" "}
              {playing.extra ? t("spotifyPopularity", { n: playing.popularity || 0 }) : playsLabel(playing.streams, t)}
            </p>
          </div>
          <iframe
            title={t("nowPlaying")}
            src={playing.spotifyEmbedUrl}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </footer>
      )}
    </div>
  );
}
