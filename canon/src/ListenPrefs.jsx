import { useEffect, useState } from "react";
import { useI18n } from "./I18n.jsx";
import { displayGenre, displayReleaseCountry } from "./display-labels.js";
import { EMPTY_LISTEN_PREFS, loadListenPrefs, saveListenPrefs } from "./listenPrefs.js";
import { MOOD_CHIPS } from "./recommend.js";
import { moodLabel, resolveMoodValue } from "./uiText.js";

export default function ListenPrefs({ countries, genres }) {
  const { locale, t } = useI18n();
  const [mood, setMood] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadListenPrefs();
    setMood(stored.mood);
    setCountry(stored.country);
    setGenre(stored.genre);
    setReady(true);
  }, []);

  const prefs = { mood, country, genre };
  const hasPrefs = [mood, country, genre].some(Boolean);

  function applyPrefs(next) {
    const resolved = saveListenPrefs({
      ...next,
      mood: resolveMoodValue(next.mood, t),
    });
    setMood(resolved.mood);
    setCountry(resolved.country);
    setGenre(resolved.genre);
  }

  function onSubmit(event) {
    event.preventDefault();
    applyPrefs(prefs);
    window.location.hash = "";
  }

  return (
    <section className="daily daily-prefs" aria-label={t("prefsTitle")}>
      <div className="daily-copy">
        <p className="eyebrow">{t("prefsNav")}</p>
        <h2>{t("prefsTitle")}</h2>
        <p>{t("prefsIntro")}</p>
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
            <button type="submit">{t("seeTodayPick")}</button>
            <button type="button" className="ghost" onClick={() => applyPrefs({ ...EMPTY_LISTEN_PREFS })} disabled={!hasPrefs}>
              {t("clearPrefs")}
            </button>
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
            <option key={item} value={item} label={displayReleaseCountry(item, locale, t)} />
          ))}
        </datalist>
        <datalist id="canon-genres">
          {genres.map((item) => (
            <option key={item} value={item} label={displayGenre(item, locale)} />
          ))}
        </datalist>
        {ready ? <p className="daily-stamp">{hasPrefs ? t("prefsNow", { prefs: [mood, country, genre].filter(Boolean).join(" · ") }) : t("noPrefs")}</p> : null}
      </div>
    </section>
  );
}
