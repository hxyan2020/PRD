import { useEffect, useMemo, useState } from "react";
import CollectButton from "./CollectButton.jsx";
import { useI18n } from "./I18n.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import SpotifyAddButton from "./SpotifyAddButton.jsx";
import { dateTag } from "./i18n.js";
import { MOOD_CHIPS, recommendDaily, surprisePick } from "./recommend.js";
import { artistLabel, collectedStamp, moodLabel, playsLabel, resolveMoodValue, yearLabel } from "./uiText.js";

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

function modeLabel(result, translate) {
  if (result?.mode === "surprise") return translate("surprise");
  if (result?.mode === "popular") return translate("mostStreamed");
  return translate("matchedToYou");
}

function reasonText(result, translate) {
  const key = result?.reasonKey || result?.mode;
  if (!key || key === "none") return translate("reason.empty");
  return translate(`reason.${key}`);
}

export function loadListenPrefs() {
  return loadPrefs();
}

export default function DailyRecommend({
  tracks,
  countries,
  genres,
  onListen,
  onView,
  onRecommend,
  collectedIds,
  collectedAt,
  onToggleCollect,
  spotify,
  onPrefs,
}) {
  const { locale, t } = useI18n();
  const [mood, setMood] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [ready, setReady] = useState(false);
  const [surprise, setSurprise] = useState(null);
  const [salt, setSalt] = useState(0);
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    const stored = loadPrefs();
    setMood(stored.mood);
    setCountry(stored.country);
    setGenre(stored.genre);
    setReady(true);
  }, []);

  const prefs = { mood, country, genre };
  const daily = useMemo(() => {
    if (!ready) return null;
    return recommendDaily(tracks, prefs);
  }, [ready, tracks, mood, country, genre]);

  useEffect(() => {
    if (!ready || !daily?.track) return;
    onRecommend?.({
      trackId: daily.track.id,
      name: daily.track.name,
      artist: artistLabel(daily.track, t),
      coverUrl: daily.track.coverUrl,
      mode: "daily",
      kind: daily.mode,
      mood,
      country,
      genre,
    });
  }, [ready, daily?.track?.id, daily?.mode, mood, country, genre]);

  useEffect(() => {
    if (ready) onPrefs?.({ mood, country, genre });
  }, [ready, mood, country, genre]);

  function applyPrefs(next) {
    const resolved = {
      ...next,
      mood: resolveMoodValue(next.mood, t),
    };
    setMood(resolved.mood);
    setCountry(resolved.country);
    setGenre(resolved.genre);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
    setSurprise(null);
  }

  function onSubmit(event) {
    event.preventDefault();
    applyPrefs(prefs);
  }

  function surpriseMe() {
    const exclude = [surprise?.track?.id, daily?.track?.id, ...recentIds].filter(Boolean);
    const nextSalt = salt + 1;
    const next = surprisePick(tracks, { prefs, excludeIds: exclude, salt: nextSalt });
    setSalt(nextSalt);
    setSurprise(next);
    if (next.track) {
      setRecentIds((ids) => [next.track.id, ...ids].slice(0, 48));
      onRecommend?.({
        trackId: next.track.id,
        name: next.track.name,
        artist: artistLabel(next.track, t),
        coverUrl: next.track.coverUrl,
        mode: "surprise",
        kind: "surprise",
        mood,
        country,
        genre,
      });
      onListen(next.track);
      document.getElementById("today-listening")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const result = surprise || daily;
  const track = result?.track;

  useEffect(() => {
    if (track?.id) onView?.(track);
  }, [track?.id, onView]);

  const todayLabel = new Date().toLocaleDateString(dateTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const activePrefs = [mood, country, genre].filter(Boolean);
  const hasPrefs = activePrefs.length > 0;
  const isSurprise = result?.mode === "surprise";

  return (
    <section className="daily" id="today-listening" aria-label={t("todayRecommend")}>
      <div className="daily-copy">
        <p className="eyebrow">{t("todayListening", { date: todayLabel })}</p>
        <h2>{t("newRecordingEachDay")}</h2>
        <p>{t("dailyIntro")}</p>
        <form className="daily-form" onSubmit={onSubmit}>
          <label>
            {t("mood")}
            <input
              type="text"
              value={mood}
              onChange={(e) => applyPrefs({ ...prefs, mood: e.target.value })}
              placeholder={t("moodPlaceholder")}
              list="canon-moods"
            />
          </label>
          <label>
            {t("country")}
            <input
              type="text"
              value={country}
              onChange={(e) => applyPrefs({ ...prefs, country: e.target.value })}
              placeholder={t("countryPlaceholder")}
              list="canon-countries"
            />
          </label>
          <label>
            {t("genreLabel")}
            <input
              type="text"
              value={genre}
              onChange={(e) => applyPrefs({ ...prefs, genre: e.target.value })}
              placeholder={t("genrePlaceholder")}
              list="canon-genres"
            />
          </label>
          <div className="daily-actions">
            <button type="submit">{t("updatePick")}</button>
            <button type="button" className="surprise" onClick={surpriseMe}>
              {t("surpriseMe")}
            </button>
            <button type="button" className="ghost" onClick={() => applyPrefs({ ...EMPTY })} disabled={!hasPrefs}>
              {t("clearPrefs")}
            </button>
            <button type="button" className="ghost" onClick={() => document.getElementById("beyond-canon")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {t("beyondFind")}
            </button>
            {isSurprise && (
              <button type="button" className="ghost" onClick={() => setSurprise(null)}>
                {t("backToToday")}
              </button>
            )}
          </div>
        </form>
        <div className="mood-chips" role="group" aria-label={t("moodShortcuts")}>
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
              {moodLabel(chip, t)}
            </button>
          ))}
        </div>
        <datalist id="canon-moods">
          {MOOD_CHIPS.map((chip) => (
            <option key={chip} value={chip} label={moodLabel(chip, t)} />
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
            <img src={track.coverUrl} alt={t("coverAlt", { name: track.name })} />
          </button>
          <div>
            <p className="eyebrow">{modeLabel(result, t)}</p>
            <h3>{track.name}</h3>
            <p className="artist">{artistLabel(track, t)}</p>
            <p className="meta-line">
              {yearLabel(track.year, t)} · {track.genre} · {playsLabel(track.streams, t)}
            </p>
            <p className="daily-reason">{reasonText(result, t)}</p>
            {track.anecdote ? <p className="anecdote-text">{track.anecdote}</p> : null}
            <p className="daily-stamp">
              {hasPrefs ? t("prefsNow", { prefs: activePrefs.join(" · ") }) : t("noPrefs")}
            </p>
            {collectedIds.includes(track.id) ? (
              <p className="collected-date">{collectedStamp(collectedAt?.[track.id], t, locale)}</p>
            ) : null}
            <div className="card-actions">
              <button type="button" onClick={() => onListen(track)}>
                {t("listen")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const toggle = document.querySelector(".daily-card .lyrics-toggle");
                  if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
                  document.querySelector(".daily-card .lyrics")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {t("lyrics")}
              </button>
              <CollectButton id={track.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
              {spotify ? <SpotifyAddButton track={track} spotify={spotify} /> : null}
              <button type="button" className="surprise" onClick={surpriseMe}>
                {t("surpriseMe")}
              </button>
            </div>
          </div>
          <LyricsPanel track={track} />
        </article>
      )}
    </section>
  );
}
