import { useEffect, useMemo, useState } from "react";
import { formatStreams, primaryArtist } from "./format.js";
import { MOOD_CHIPS, recommendDaily } from "./recommend.js";

const STORAGE_KEY = "canon.daily.prefs";
const EMPTY = { mood: "", country: "", genre: "" };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      mood: String(parsed.mood || ""),
      country: String(parsed.country || ""),
      genre: String(parsed.genre || ""),
    };
  } catch {
    return { ...EMPTY };
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

  const prefs = { mood, country, genre };
  const result = useMemo(() => {
    if (!ready) return null;
    return recommendDaily(tracks, prefs);
  }, [ready, tracks, mood, country, genre]);

  function applyPrefs(next) {
    setMood(next.mood);
    setCountry(next.country);
    setGenre(next.genre);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function onSubmit(event) {
    event.preventDefault();
    applyPrefs(prefs);
  }

  const track = result?.track;
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const activePrefs = [mood, country, genre].filter(Boolean);
  const hasPrefs = activePrefs.length > 0;

  return (
    <section className="daily" aria-label="Today’s recommendation">
      <div className="daily-copy">
        <p className="eyebrow">Today’s listening · {todayLabel}</p>
        <h2>A new recording each day</h2>
        <p>
          Change mood, country, or genre anytime — the match updates at once. Leave
          the fields blank and Canon chooses from the most streamed titles. The same
          preferences still rotate to a fresh work each calendar day.
        </p>
        <form className="daily-form" onSubmit={onSubmit}>
          <label>
            Mood
            <input
              type="text"
              value={mood}
              onChange={(e) => applyPrefs({ ...prefs, mood: e.target.value })}
              placeholder="e.g. melancholy, dance, calm"
              list="canon-moods"
            />
          </label>
          <label>
            Country
            <input
              type="text"
              value={country}
              onChange={(e) => applyPrefs({ ...prefs, country: e.target.value })}
              placeholder="e.g. Japan, Brazil, United Kingdom"
              list="canon-countries"
            />
          </label>
          <label>
            Genre
            <input
              type="text"
              value={genre}
              onChange={(e) => applyPrefs({ ...prefs, genre: e.target.value })}
              placeholder="e.g. jazz, hip-hop, hymn"
              list="canon-genres"
            />
          </label>
          <div className="daily-actions">
            <button type="submit">Update pick</button>
            <button
              type="button"
              className="ghost"
              onClick={() => applyPrefs({ ...EMPTY })}
              disabled={!hasPrefs}
            >
              Clear preferences
            </button>
          </div>
        </form>
        <div className="mood-chips" role="group" aria-label="Mood shortcuts">
          {MOOD_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={mood.toLowerCase() === chip.toLowerCase() ? "is-on" : ""}
              onClick={() =>
                applyPrefs({
                  ...prefs,
                  mood: mood.toLowerCase() === chip.toLowerCase() ? "" : chip,
                })
              }
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
            <p className="daily-stamp">
              {hasPrefs
                ? `Preferences now: ${activePrefs.join(" · ")}. Change them anytime.`
                : "No preferences set. Add a mood, country, or genre anytime."}
            </p>
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
