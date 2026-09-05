import { useEffect, useMemo, useState } from "react";
import DailyRecommend from "./DailyRecommend.jsx";
import {
  decadeOf,
  formatStreams,
  formatStreamsFull,
  primaryArtist,
  uniqueSorted,
} from "./format.js";

function displayCredit(value) {
  if (!value || value === "—") return "n/a";
  return value;
}

function readHash() {
  const id = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("t");
  return id || "";
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All genres");
  const [era, setEra] = useState("All eras");
  const [country, setCountry] = useState("All countries");
  const [sort, setSort] = useState("influence");
  const [selectedId, setSelectedId] = useState(readHash);
  const [playingId, setPlayingId] = useState("");

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
    const onHash = () => setSelectedId(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const tracks = data?.tracks || [];
  const selected = tracks.find((t) => t.id === selectedId) || null;
  const playing = tracks.find((t) => t.id === playingId) || selected;

  const facets = useMemo(() => {
    const genres = uniqueSorted(tracks.flatMap((t) => (t.genres?.length ? t.genres : [t.genre])));
    const eras = uniqueSorted(tracks.map((t) => decadeOf(t.year)));
    const countries = uniqueSorted(tracks.map((t) => t.releaseCountry));
    return { genres, eras, countries };
  }, [tracks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tracks.filter((t) => {
      if (genre !== "All genres" && t.genre !== genre && !(t.genres || []).includes(genre)) return false;
      if (era !== "All eras" && decadeOf(t.year) !== era) return false;
      if (country !== "All countries" && t.releaseCountry !== country) return false;
      if (!q) return true;
      const blob = [
        t.name,
        t.composer,
        t.singer,
        t.band,
        t.writer,
        t.musicCompany,
        t.genre,
        t.releaseCountry,
        String(t.year || ""),
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

  function openTrack(track, play = false) {
    setSelectedId(track.id);
    window.location.hash = `t=${track.id}`;
    if (play) setPlayingId(track.id);
  }

  if (error) {
    return (
      <div className="boot">
        <p>Canon could not open the archive. {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="boot">
        <p className="eyebrow">Canon</p>
        <p>Opening the archive…</p>
      </div>
    );
  }

  return (
    <div className={`app ${selected ? "has-drawer" : ""}`}>
      <header className="mast">
        <div className="mast-brand">
          <p className="eyebrow">A listening archive</p>
          <h1>Canon</h1>
          <p className="lede">
            {data.subtitle}. One thousand works, no restriction of year, language,
            singer, writer, or length — only that each still lives on Spotify.
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>Works</dt>
            <dd>{data.count}</dd>
          </div>
          <div>
            <dt>Live Spotify links</dt>
            <dd>{data.count}</dd>
          </div>
          <div>
            <dt>With play counts</dt>
            <dd>{tracks.filter((t) => t.streams).length}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{new Date(data.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
          </div>
        </dl>
      </header>

      <DailyRecommend
        tracks={tracks}
        countries={facets.countries}
        genres={facets.genres}
        onListen={(track) => openTrack(track, true)}
      />

      <section className="controls" aria-label="Filter the archive">
        <input
          className="search"
          type="search"
          placeholder="Search title, composer, singer, band, writer, label…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option>All genres</option>
          {facets.genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select value={era} onChange={(e) => setEra(e.target.value)}>
          <option>All eras</option>
          {facets.eras.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option>All countries</option>
          {facets.countries.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="influence">Sort: influence</option>
          <option value="streams">Sort: Spotify plays</option>
          <option value="year-asc">Sort: oldest</option>
          <option value="year-desc">Sort: newest</option>
          <option value="name">Sort: title</option>
        </select>
      </section>

      <p className="result-count">
        Showing {visible.length} of {tracks.length}
      </p>
      {visible.length === 0 && (
        <p className="empty">No recordings match those filters. Clear search or choose All genres.</p>
      )}

      <main className="grid" aria-label="Catalog">
        {visible.map((track) => (
          <article
            key={track.id}
            className={`card ${selectedId === track.id ? "is-open" : ""}`}
          >
            <button className="cover-btn" onClick={() => openTrack(track, true)} type="button">
              <img src={track.coverUrl} alt={`Official album cover for ${track.name}`} loading="lazy" />
              <span className="rank">#{String(track.rank).padStart(3, "0")}</span>
            </button>
            <div className="card-body">
              <h2>{track.name}</h2>
              <p className="artist">{primaryArtist(track)}</p>
              <p className="meta-line">
                {track.year || "Year unknown"} · {track.genre}
              </p>
              <p className="plays">{formatStreams(track.streams)} plays</p>
              <div className="card-actions">
                <button type="button" onClick={() => openTrack(track, true)}>
                  Listen
                </button>
                <a href={track.spotifyUrl} target="_blank" rel="noreferrer">
                  Spotify
                </a>
              </div>
            </div>
          </article>
        ))}
      </main>

      {selected && (
        <aside className="drawer" aria-label={`Details for ${selected.name}`}>
          <button
            className="close"
            type="button"
            onClick={() => {
              setSelectedId("");
              window.location.hash = "";
            }}
          >
            Close
          </button>
          <img className="drawer-cover" src={selected.coverUrl} alt={`Official album cover for ${selected.name}`} />
          <p className="eyebrow">No. {selected.rank} in the canon</p>
          <h2>{selected.name}</h2>
          <p className="spotify-title">{selected.spotifyTitle}</p>
          <p className="drawer-links">
            <a className="spotify-link" href={selected.spotifyUrl} target="_blank" rel="noreferrer">
              Open official Spotify link
            </a>
          </p>
          <dl className="facts">
            <div>
              <dt>Composer</dt>
              <dd>{displayCredit(selected.composer)}</dd>
            </div>
            <div>
              <dt>Singer</dt>
              <dd>{displayCredit(selected.singer)}</dd>
            </div>
            <div>
              <dt>Band</dt>
              <dd>{displayCredit(selected.band)}</dd>
            </div>
            <div>
              <dt>Writer</dt>
              <dd>{displayCredit(selected.writer)}</dd>
            </div>
            <div>
              <dt>Music company</dt>
              <dd>{displayCredit(selected.musicCompany)}</dd>
            </div>
            <div>
              <dt>Year of release</dt>
              <dd>{selected.year || "Not listed"}</dd>
            </div>
            <div>
              <dt>Release country</dt>
              <dd>{displayCredit(selected.releaseCountry)}</dd>
            </div>
            <div>
              <dt>Genre</dt>
              <dd>{displayCredit(selected.genre)}</dd>
            </div>
            <div>
              <dt>Popularity</dt>
              <dd>{formatStreamsFull(selected.streams)}</dd>
            </div>
          </dl>
          <h3>Why it is shortlisted</h3>
          <p className="why">{selected.whyShortlisted}</p>
          <p className="wiki">
            <a href={selected.wikipediaUrl} target="_blank" rel="noreferrer">
              Encyclopedia source
            </a>
          </p>
          <div className="card-actions drawer-actions">
            <button type="button" onClick={() => setPlayingId(selected.id)}>
              Stream in player
            </button>
            <a className="spotify-link" href={selected.spotifyUrl} target="_blank" rel="noreferrer">
              Open official Spotify link
            </a>
          </div>
        </aside>
      )}

      {playing && (
        <footer className="dock">
          <img src={playing.coverUrl} alt="" />
          <div>
            <p className="dock-title">{playing.name}</p>
            <p className="dock-sub">{primaryArtist(playing)} · {formatStreams(playing.streams)} plays</p>
          </div>
          <a href={playing.spotifyUrl} target="_blank" rel="noreferrer">
            Open in Spotify
          </a>
          <iframe
            title="Now playing"
            src={playing.spotifyEmbedUrl}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </footer>
      )}
    </div>
  );
}
