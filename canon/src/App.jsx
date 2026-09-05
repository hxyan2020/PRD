import { useEffect, useMemo, useState } from "react";
import BeyondCanon from "./BeyondCanon.jsx";
import CollectButton from "./CollectButton.jsx";
import Collections from "./Collections.jsx";
import DailyRecommend from "./DailyRecommend.jsx";
import { LanguageSwitcher, useI18n } from "./I18n.jsx";
import RecommendLog from "./RecommendLog.jsx";
import SpotifyAddButton from "./SpotifyAddButton.jsx";
import SpotifyConnect from "./SpotifyConnect.jsx";
import TrackCard from "./TrackCard.jsx";
import { loadExtraTracks, mergeExtraTracks, saveExtraTracks } from "./beyond.js";
import { loadCollectedIds, loadCollection, saveCollection, toggleCollected, formatCollectedAt } from "./collections.js";
import { loadViewedIds, markViewed, mergeViewedWithCollected, saveViewedIds } from "./viewed.js";
import { appendRecommendation, loadRecommendLog, saveRecommendLog } from "./recommendLog.js";
import { useSpotify } from "./useSpotify.js";
import { decadeOf, uniqueSorted } from "./format.js";
import { displayEra } from "./i18n.js";
import { hxPathForRoute, recordBotPing, recordVisit, sendHxBeacon } from "./hx.js";
import { HxMonitor, HxViewership } from "./HxDesk.jsx";
import { parseRoute } from "./pages.js";
import { SiteDoc, SiteNav } from "./SitePages.jsx";
import { artistLabel, creditLabel, playsLabel, popularityLabel } from "./uiText.js";

export default function App() {
  const { locale, t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All genres");
  const [era, setEra] = useState("All eras");
  const [country, setCountry] = useState("All countries");
  const [sort, setSort] = useState("influence");
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const selectedId = route.page === "home" ? route.trackId : "";
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
  const [listenPrefs, setListenPrefs] = useState({ mood: "", country: "", genre: "" });
  const [extras, setExtras] = useState(loadExtraTracks);
  const spotify = useSpotify();

  useEffect(() => {
    fetch("/catalog.json")
      .then((r) => {
        if (!r.ok) throw new Error("Catalog failed to load");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

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
    recordVisit({
      route: page,
      origin: window.location.origin,
      ua: navigator.userAgent,
      webdriver: Boolean(navigator.webdriver),
    });
    void sendHxBeacon({
      path,
      host: window.location.host,
      referer: document.referrer || "",
    });
    if (page === "hx-ping") recordBotPing("hx-ping");
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
    window.location.hash = `t=${track.id}`;
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
    return (
      <div className="boot">
        <p>{t("loadError", { error })}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="boot">
        <p className="eyebrow">Canon</p>
        <p>{t("opening")}</p>
      </div>
    );
  }

  return (
    <div className={`app ${selected ? "has-drawer" : ""}`}>
      <header className="mast">
        <div className="mast-brand">
          <p className="eyebrow">{t("archiveEyebrow")}</p>
          <h1>
            <a className="brand-link" href="#">
              Canon
            </a>
          </h1>
          <p className="lede">{t("lede")}</p>
          <SiteNav page={page} />
        </div>
        <div className="stats-wrap">
          <dl className="stats" aria-label={t("libraryCounts")}>
            <div>
              <dt>{t("songsInArchive")}</dt>
              <dd>{data.count}</dd>
            </div>
            <div>
              <dt>{t("viewed")}</dt>
              <dd>{viewedIds.length}</dd>
            </div>
            <div>
              <dt>{t("collected")}</dt>
              <dd>{collectedIds.length}</dd>
            </div>
          </dl>
          <p className="stats-note">{t("statsNote")}</p>
          <LanguageSwitcher />
        </div>
      </header>

      {page === "about" || page === "terms" ? (
        <SiteDoc page={page} />
      ) : page === "hx-monitor" || page === "hx-ping" ? (
        <HxMonitor origin={window.location.origin} />
      ) : page === "hx-viewership" ? (
        <HxViewership />
      ) : (
        <>
      <SpotifyConnect spotify={spotify} />

      <DailyRecommend
        tracks={tracks}
        countries={facets.countries}
        genres={facets.genres}
        onListen={(track) => openTrack(track, true)}
        onView={(track) => rememberView(track.id)}
        onRecommend={onRecommend}
        collectedIds={collectedIds}
        collectedAt={collectedAt}
        onToggleCollect={onToggleCollect}
        spotify={spotify}
        onPrefs={setListenPrefs}
      />

      <BeyondCanon
        prefs={listenPrefs}
        catalog={tracks}
        selectedId={selectedId}
        collectedIds={collectedIds}
        collectedAt={collectedAt}
        onToggleCollect={onToggleCollect}
        onOpen={openTrack}
        onRecommend={onRecommend}
        spotify={spotify}
        onExtras={(list) => {
          setExtras((current) => {
            const next = mergeExtraTracks(current, list);
            saveExtraTracks(next);
            return next;
          });
        }}
      />

      <RecommendLog log={recommendLog} tracks={library} onOpen={openTrack} />

      <Collections
        tracks={library}
        collectedIds={collectedIds}
        collectedAt={collectedAt}
        selectedId={selectedId}
        onToggleCollect={onToggleCollect}
        onOpen={openTrack}
        spotify={spotify}
      />

      <section className="controls" aria-label={t("filterArchive")}>
        <input
          className="search"
          type="search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="All genres">{t("allGenres")}</option>
          {facets.genres.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={era} onChange={(e) => setEra(e.target.value)}>
          <option value="All eras">{t("allEras")}</option>
          {facets.eras.map((item) => (
            <option key={item} value={item}>
              {displayEra(item, t)}
            </option>
          ))}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="All countries">{t("allCountries")}</option>
          {facets.countries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
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

      <SiteNav page={page} />
        </>
      )}

      {selected && (
        <aside className="drawer" aria-label={t("detailsFor", { name: selected.name })}>
          <button
            className="close"
            type="button"
            onClick={() => {
              window.location.hash = "";
            }}
          >
            {t("close")}
          </button>
          <img className="drawer-cover" src={selected.coverUrl} alt={t("coverAlt", { name: selected.name })} />
          <p className="eyebrow">{selected.extra ? t("beyondOutside") : t("canonRank", { n: selected.rank })}</p>
          <h2>{selected.name}</h2>
          <p className="spotify-title">{selected.spotifyTitle}</p>
          <p className="drawer-links">
            <a className="spotify-link" href={selected.spotifyUrl} target="_blank" rel="noreferrer">
              {t("openSpotifyLink")}
            </a>
          </p>
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
              <dd>{creditLabel(selected.releaseCountry, t)}</dd>
            </div>
            <div>
              <dt>{t("genre")}</dt>
              <dd>{creditLabel(selected.genre, t)}</dd>
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
              ? listenPrefs.mood || listenPrefs.country || listenPrefs.genre
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
          <div className="card-actions drawer-actions">
            <button type="button" onClick={() => setPlayingId(selected.id)}>
              {t("streamInPlayer")}
            </button>
            <CollectButton id={selected.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
            <SpotifyAddButton track={selected} spotify={spotify} />
            <a className="spotify-link" href={selected.spotifyUrl} target="_blank" rel="noreferrer">
              {t("openSpotifyLink")}
            </a>
          </div>
        </aside>
      )}

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
          <a href={playing.spotifyUrl} target="_blank" rel="noreferrer">
            {t("openInSpotify")}
          </a>
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
