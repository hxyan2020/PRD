import { useEffect, useMemo, useState } from "react";
import CollectButton from "./CollectButton.jsx";
import Collections from "./Collections.jsx";
import DailyRecommend from "./DailyRecommend.jsx";
import ListenPrefs from "./ListenPrefs.jsx";
import Profile from "./Profile.jsx";
import { loadListenPrefs } from "./listenPrefs.js";
import { useI18n } from "./I18n.jsx";
import RecommendLog from "./RecommendLog.jsx";
import SpotifyAddButton from "./SpotifyAddButton.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import TrackCard from "./TrackCard.jsx";
import SearchBox from "./SearchBox.jsx";
import ArchiveGrid from "./ArchiveGrid.jsx";
import { loadExtraTracks, mergeExtraTracks, saveExtraTracks } from "./beyond.js";
import { enrichExtraTrack, needsPortraitEnrichment } from "./enrich-extra.js";
import { searchOutsideMusic } from "./music-search.js";
import {
  ALL_COUNTRIES,
  ALL_ERAS,
  ALL_GENRES,
  extraMatchesEra,
  hasOutsideSearch,
  sortTracks,
  trackMatchesQuery,
} from "./search.js";
import { loadCollectedIds, loadCollection, saveCollection, toggleCollected, formatCollectedAt } from "./collections.js";
import { addToAlbum, archiveTotal, loadAlbum, saveAlbum } from "./album.js";
import { loadViewedIds, markViewed, mergeViewedWithCollected, saveViewedIds } from "./viewed.js";
import { appendRecommendation, loadRecommendLog, saveRecommendLog } from "./recommendLog.js";
import { useSpotify } from "./useSpotify.js";
import { decadeOf, uniqueSorted } from "./format.js";
import { formatStatus } from "./i18n.js";
import { displayEraLabel, displayGenre, displayReleaseCountry } from "./display-labels.js";
import { releaseIncludesCountry, uniqueSingleCountries } from "./country-flags.js";
import { hxPathForRoute, sendHxBeacon } from "./hx.js";
import { pageAllowsTrack, parseRoute, routeHash } from "./pages.js";
import { SiteDoc, SiteFooter, SiteMenu } from "./SitePages.jsx";
import { publicUrl } from "./urls.js";
import CoverImage from "./CoverImage.jsx";
import CountryFlagName from "./CountryFlagName.jsx";
import PortraitGallery from "./PortraitGallery.jsx";
import { syncSessionToRemote } from "./auth.js";
import { displayPersonName, splitCredits } from "./portraits.js";
import { creditLabel, popularityLabel } from "./uiText.js";
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
  const [album, setAlbum] = useState(loadAlbum);
  const albumIds = album.ids;
  const [viewedIds, setViewedIds] = useState(() => {
    const collected = loadCollectedIds();
    const viewed = loadViewedIds();
    const merged = mergeViewedWithCollected(viewed, collected);
    if (merged.length !== viewed.length) saveViewedIds(merged);
    return merged;
  });
  const [recommendLog, setRecommendLog] = useState(loadRecommendLog);
  const [extras, setExtras] = useState(loadExtraTracks);
  const [outside, setOutside] = useState([]);
  const [outsideStatus, setOutsideStatus] = useState("");
  const [albumAskId, setAlbumAskId] = useState("");
  const [albumAskDismissed, setAlbumAskDismissed] = useState(() => new Set());
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const spotify = useSpotify();

  useEffect(() => {
    void syncSessionToRemote();
  }, []);

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
    const remaining = Math.max(0, 1100 - (Date.now() - bootStarted));
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

  useEffect(() => {
    const filters = { query, genre, era, country };
    if (page !== "archive" || !hasOutsideSearch(filters)) {
      setOutside([]);
      setOutsideStatus("");
      return undefined;
    }
    let cancelled = false;
    setOutsideStatus("working");
    const timer = window.setTimeout(async () => {
      const result = await searchOutsideMusic(filters);
      if (cancelled) return;
      if (!result.ok) {
        setOutside([]);
        setOutsideStatus("error");
        return;
      }
      setOutside(result.tracks);
      setOutsideStatus(result.tracks.length ? "ok" : "empty");
    }, query ? 0 : 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, query, genre, era, country]);

  const tracks = data?.tracks || [];
  const catalogIds = useMemo(() => new Set(tracks.map((track) => track.id)), [tracks]);
  const extraList = Object.values(extras);
  const albumExtras = useMemo(
    () =>
      albumIds
        .map((id) => extras[id] || outside.find((track) => track.id === id))
        .filter((track) => track && !catalogIds.has(track.id)),
    [albumIds, extras, outside, catalogIds],
  );
  const archiveTracks = useMemo(() => [...tracks, ...albumExtras], [tracks, albumExtras]);
  const archiveCount = archiveTotal(data?.count || tracks.length, albumIds, catalogIds);
  const library = useMemo(() => {
    const byId = new Map();
    for (const track of archiveTracks) byId.set(track.id, track);
    for (const track of extraList) if (!byId.has(track.id)) byId.set(track.id, track);
    for (const track of outside) if (!byId.has(track.id)) byId.set(track.id, track);
    return [...byId.values()];
  }, [archiveTracks, extras, outside]);
  const selected = library.find((item) => item.id === selectedId) || null;
  const playing = library.find((item) => item.id === playingId) || selected;

  useEffect(() => {
    if (selected) spotify.checkSaved(selected);
  }, [selectedId, spotify.user]);

  useEffect(() => {
    if (!selected?.extra) return;
    if (albumIds.includes(selected.id)) return;
    if (selected.spotifyId && spotify.saved[selected.spotifyId]) return;
    if (albumAskDismissed.has(selected.id)) return;
    setAlbumAskId(selected.id);
  }, [selected, albumIds, albumAskDismissed, spotify.saved]);

  useEffect(() => {
    if (!selected?.extra || !needsPortraitEnrichment(selected)) return undefined;
    let cancelled = false;
    enrichExtraTrack(selected).then((result) => {
      if (cancelled || !result?.track) return;
      rememberExtras([result.track]);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, selected?.enriched, selected?.people]);

  const facets = useMemo(() => {
    const genres = uniqueSorted(tracks.flatMap((item) => (item.genres?.length ? item.genres : [item.genre])));
    const eras = uniqueSorted(tracks.map((item) => decadeOf(item.year)));
    const countries = uniqueSingleCountries(tracks.map((item) => item.releaseCountry));
    return { genres, eras, countries };
  }, [tracks]);

  const visible = useMemo(() => {
    const q = query.trim();
    const list = archiveTracks.filter((item) => {
      if (genre !== ALL_GENRES && item.genre !== genre && !(item.genres || []).includes(genre)) return false;
      if (era !== ALL_ERAS && decadeOf(item.year) !== era) return false;
      if (country !== ALL_COUNTRIES && !releaseIncludesCountry(item.releaseCountry, country)) return false;
      if (!q) return true;
      return trackMatchesQuery(item, q);
    });
    return sortTracks(list, sort);
  }, [archiveTracks, query, genre, era, country, sort]);

  const outsideVisible = useMemo(() => {
    const list = outside.filter((item) => extraMatchesEra(item, era, decadeOf));
    return sortTracks(list, sort === "influence" ? "streams" : sort);
  }, [outside, era, sort]);

  function rememberView(id) {
    if (!id) return;
    setViewedIds((current) => {
      const next = markViewed(current, id);
      if (next === current || next.length === current.length) return current;
      saveViewedIds(next);
      return next;
    });
  }

  function rememberExtras(list) {
    if (!list?.length) return;
    setExtras((current) => {
      const next = mergeExtraTracks(current, list);
      saveExtraTracks(next);
      return next;
    });
  }

  function openTrack(track, play = false, lyrics = false) {
    if (track?.extra) rememberExtras([track]);
    rememberView(track.id);
    window.location.hash = routeHash(page, track.id);
    if (play) setPlayingId(track.id);
    setLyricsOpen(Boolean(lyrics));
    if (
      track?.extra &&
      !albumIds.includes(track.id) &&
      !spotify.saved[track.spotifyId] &&
      !albumAskDismissed.has(track.id)
    ) {
      setAlbumAskId(track.id);
    }
  }

  function dismissAlbumAsk(id) {
    setAlbumAskDismissed((current) => new Set(current).add(id));
    setAlbumAskId("");
  }

  async function addOutsideToAlbum(track) {
    if (!track?.id) return;
    if (track.extra) rememberExtras([track]);
    setAlbum((current) => {
      const next = addToAlbum(current, track.id);
      saveAlbum(next);
      return next;
    });
    if (track.spotifyId) await spotify.addTrack(track);
    dismissAlbumAsk(track.id);
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
      <SiteMenu page={page} archiveCount={archiveCount} />
      {spotify.status ? (
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
                  {Number(archiveCount).toLocaleString(locale === "ar" ? "ar" : undefined)}
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
        <SearchBox value={query} onSearch={setQuery} />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label={t("allGenres")}>
          <option value={ALL_GENRES}>{t("allGenres")}</option>
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
          <option value={ALL_ERAS}>{t("allEras")}</option>
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
          <option value={ALL_COUNTRIES}>{t("allCountries")}</option>
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

      <p className="result-count">{t("showing", { n: visible.length, total: archiveCount })}</p>
      {visible.length === 0 ? (
        <p className="empty">{query.trim() ? t("emptyInCanon", { q: query.trim() }) : t("emptyFilters")}</p>
      ) : null}

      <ArchiveGrid
        tracks={visible}
        selectedId={selectedId}
        collectedIds={collectedIds}
        collectedAt={collectedAt}
        onToggleCollect={onToggleCollect}
        onOpen={openTrack}
        spotify={spotify}
        resetKey={`${query}|${genre}|${era}|${country}|${sort}`}
      />
      {hasOutsideSearch({ query, genre, era, country }) ? (
        <section className="beyond archive-outside" aria-label={t("beyondEyebrow")}>
          <div className="collections-head">
            <p className="eyebrow">{t("beyondEyebrow")}</p>
            <h2>{t("searchOutsideTitle")}</h2>
            {outsideStatus === "working" ? <p>{t("searchOutsideWorking")}</p> : null}
            {outsideStatus === "error" ? <p className="spotify-status">{t("searchOutsideUnavailable")}</p> : null}
            {outsideStatus === "empty" || (outsideStatus === "ok" && outsideVisible.length === 0) ? (
              <p className="spotify-status">{t("searchOutsideEmpty")}</p>
            ) : null}
            {outsideVisible.length > 0 ? <p className="result-count">{t("searchOutsideCount", { n: outsideVisible.length })}</p> : null}
          </div>
          {outsideVisible.length > 0 ? (
            <div className="grid collections-grid">
              {outsideVisible.map((track) => (
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
            </div>
          ) : null}
        </section>
      ) : null}
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
      ) : page === "profile" ? (
        <Profile />
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
              setLyricsOpen(false);
              window.location.hash = routeHash(page);
            }}
          >
            {t("close")}
          </button>
          <CoverImage className="drawer-cover" src={selected.coverUrl} alt={t("coverAlt", { name: selected.name })} />
          <p className="eyebrow">{selected.extra ? t("beyondOutside") : t("canonRank", { n: selected.rank })}</p>
          <h2>{selected.name}</h2>
          <p className="spotify-title">{selected.spotifyTitle}</p>
          {selected.extra && albumAskId === selected.id ? (
            <div className="album-ask" role="region" aria-label={t("albumAsk", { name: selected.name })}>
              <p>{t("albumAsk", { name: selected.name })}</p>
              <div className="card-actions drawer-actions album-ask-actions">
                <button type="button" onClick={() => addOutsideToAlbum(selected)}>
                  {t("albumAskYes")}
                </button>
                <button type="button" onClick={() => dismissAlbumAsk(selected.id)}>
                  {t("albumAskNo")}
                </button>
              </div>
            </div>
          ) : null}
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
            {selected.extra && !selected.popularity ? null : (
            <div>
              <dt>{t("popularity")}</dt>
              <dd>
                {selected.extra
                  ? t("spotifyPopularity", { n: selected.popularity || 0 })
                  : popularityLabel(selected.streams, t)}
              </dd>
            </div>
            )}
            {albumIds.includes(selected.id) ? (
              <div>
                <dt>{t("albumLabel")}</dt>
                <dd>{t("albumInCanon")}</dd>
              </div>
            ) : null}
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
              ? selected.extraSource === "itunes" || selected.extraSource === "name"
                ? t("beyondWhyName")
                : loadListenPrefs().mood || loadListenPrefs().country || loadListenPrefs().genre
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
              portrait={selected.people?.[name] || portraits.people?.[name]}
            />
          ))}
          {splitCredits(selected.band).map((name) => (
            <PortraitGallery
              key={`band-${name}`}
              name={`${t("bandAnecdote")} · ${displayPersonName(name)}`}
              portrait={selected.people?.[name] || portraits.people?.[name]}
            />
          ))}
          <LyricsPanel track={selected} open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
          <div className="card-actions drawer-actions">
            <button type="button" onClick={() => setLyricsOpen((open) => !open)}>
              {lyricsOpen ? t("lyricsHide") : t("lyrics")}
            </button>
            <CollectButton id={selected.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
            <SpotifyAddButton track={selected} spotify={spotify} />
          </div>
        </aside>
      )}

      <SiteFooter page={page} />

      {playing && (playing.spotifyEmbedUrl || playing.previewUrl) ? (
        <footer className="dock">
          {playing.spotifyEmbedUrl ? (
            <iframe
              className="dock-frame"
              title={t("nowPlaying")}
              src={playing.spotifyEmbedUrl}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          ) : (
            <audio className="dock-audio" title={t("nowPlaying")} controls autoPlay src={playing.previewUrl} />
          )}
        </footer>
      ) : null}
    </div>
  );
}
