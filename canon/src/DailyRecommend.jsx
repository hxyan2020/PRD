import { useEffect, useMemo, useState } from "react";
import { formatStreams, primaryArtist } from "./format.js";
import { MOOD_CHIPS, recommendDaily } from "./recommend.js";

const STORAGE_KEY = "canon.daily.prefs";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mood: "", country: "", genre: "" };
    const parsed = JSON.parse(raw);
    return {
      mood: String(parsed.mood || ""),
      country: String(parsed.country || ""),
      genre: String(parsed.genre || ""),
    };
  } catch {
    return { mood: "", country: "", genre: "" };
  }
}

export default function DailyRecommend({ tracks, countries, genres, onListen }) {
  const [mood, setMood] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadPrefs();
    setMood(stored.mood);
    setCountry(stored.country);
    setGenre(stored.genre);
    setReady(true);
  }, []);

  const result = useMemo(() => {
    if (!ready) return null;
    return recommendDaily(tracks, { mood, country, genre });
  }, [ready, tracks, mood, country, genre]);

  function persist(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function applyPrefs(next) {
    setMood(next.mood);
    setCountry(next.country);
    setGenre(next.genre);
    persist(next);
  }

  function onSubmit(event) {
    event.preventDefault();
    persist({ mood, country, genre });
    setReady(true);
  }

  const track = result?.track;
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="daily" aria-label="Today’s recommendation">
      <div className="daily-copy">
        <p className="eyebrow">Today’s listening · {todayLabel}</p>
        <h2>A new recording each day</h2>
        <p>
          Key in a mood, country, or genre and the archive’s recommender will match a
          work from the thousand. Leave the fields blank and it chooses from the most
          streamed titles. The pick changes with the calendar.
        </p>
        <form className="daily-form" onSubmit={onSubmit}>
          <label>
            Mood
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g. melancholy, dance, calm"
              list="canon-moods"
            />
          </label>
          <label>
            Country
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Japan, Brazil, United Kingdom"
              list="canon-countries"
            />
          </label>
          <label>
            Genre
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. jazz, hip-hop, hymn"
              list="canon-genres"
            />
          </label>
          <button type="submit">Recommend for today</button>
        </form>
        <div className="mood-chips" role="group" aria-label="Mood shortcuts">
          {MOOD_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={mood.toLowerCase() === chip.toLowerCase() ? "is-on" : ""}
              onClick={() => applyPrefs({ mood: chip, country, genre })}
            >
              {chip}
            </button>
          ))}
        </div>
        <datalist id="canon-moods">
          {MOOD_CHIPS.map((chip) => (
            <option key={chip} value={chip} />
          ))}
        </datalist>
        <datalist id="canon-countries">
          {countries.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <datalist id="canon-genres">
          {genres.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      {track && (
        <article className="daily-card">
          <button type="button" className="cover-btn" onClick={() => onListen(track)}>
            <img src={track.coverUrl} alt={`Official album cover for ${track.name}`} />
          </button>
          <div>
            <p className="eyebrow">{result.mode === "popular" ? "Most streamed" : "Matched to you"}</p>
            <h3>{track.name}</h3>
            <p className="artist">{primaryArtist(track)}</p>
            <p className="meta-line">
              {track.year || "Year unknown"} · {track.genre} · {formatStreams(track.streams)} plays
            </p>
            <p className="daily-reason">{result.reason}</p>
            <p className="daily-stamp">Locked for {result.dateKey} until tomorrow’s rotation.</p>
            <div className="card-actions">
              <button type="button" onClick={() => onListen(track)}>
                Listen
              </button>
              <a href={track.spotifyUrl} target="_blank" rel="noreferrer">
                Spotify
              </a>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
