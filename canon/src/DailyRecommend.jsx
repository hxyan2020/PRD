import { useEffect, useMemo, useState } from "react";
import CollectButton from "./CollectButton.jsx";
import CoverImage from "./CoverImage.jsx";
import { useI18n } from "./I18n.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import SpotifyAddButton from "./SpotifyAddButton.jsx";
import { dateTag } from "./i18n.js";
import { displayGenre } from "./display-labels.js";
import { loadListenPrefs } from "./listenPrefs.js";
import { recommendDaily, surprisePick } from "./recommend.js";
import { artistLabel, collectedStamp, playsLabel, yearLabel } from "./uiText.js";

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

export default function DailyRecommend({
  tracks,
  onListen,
  onView,
  onRecommend,
  collectedIds,
  collectedAt,
  onToggleCollect,
  spotify,
}) {
  const { locale, t } = useI18n();
  const [prefs, setPrefs] = useState(() => loadListenPrefs());
  const [ready, setReady] = useState(false);
  const [surprise, setSurprise] = useState(null);
  const [salt, setSalt] = useState(0);
  const [recentIds, setRecentIds] = useState([]);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  useEffect(() => {
    setPrefs(loadListenPrefs());
    setReady(true);
  }, []);

  const daily = useMemo(() => {
    if (!ready) return null;
    return recommendDaily(tracks, prefs);
  }, [ready, tracks, prefs]);

  useEffect(() => {
    if (!ready || !daily?.track) return;
    onRecommend?.({
      trackId: daily.track.id,
      name: daily.track.name,
      artist: artistLabel(daily.track, t),
      coverUrl: daily.track.coverUrl,
      mode: "daily",
      kind: daily.mode,
      mood: prefs.mood,
      country: prefs.country,
      genre: prefs.genre,
    });
  }, [ready, daily?.track?.id, daily?.mode, prefs.mood, prefs.country, prefs.genre]);

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
        mood: prefs.mood,
        country: prefs.country,
        genre: prefs.genre,
      });
      onListen(next.track);
    }
  }

  const result = surprise || daily;
  const track = result?.track;
  const { mood, country, genre } = prefs;

  useEffect(() => {
    if (track?.id) onView?.(track);
  }, [track?.id, onView]);

  useEffect(() => {
    setLyricsOpen(false);
  }, [track?.id]);

  useEffect(() => {
    if (!lyricsOpen) return undefined;
    const node = document.getElementById("today-lyrics");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
    return undefined;
  }, [lyricsOpen]);

  const todayLabel = new Date().toLocaleDateString(dateTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const activePrefs = [mood, country, genre].filter(Boolean);
  const hasPrefs = activePrefs.length > 0;
  const isSurprise = result?.mode === "surprise";

  return (
    <section className="daily daily-hero" id="today-listening" aria-label={t("todayRecommend")}>
      {track ? (
        <article className="daily-card daily-hero-card">
          <button type="button" className="cover-btn" onClick={() => onListen(track)}>
            <CoverImage src={track.coverUrl} alt={t("coverAlt", { name: track.name })} priority />
          </button>
          <div className="daily-hero-copy">
            <p className="eyebrow">{t("todayListening", { date: todayLabel })}</p>
            <p className="eyebrow">{modeLabel(result, t)}</p>
            <h2>{track.name}</h2>
            <p className="artist">{artistLabel(track, t)}</p>
            <p className="meta-line">
              {yearLabel(track.year, t)} · {displayGenre(track.genre, locale)} · {playsLabel(track.streams, t)}
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
              <button type="button" onClick={() => setLyricsOpen(true)}>
                {t("lyrics")}
              </button>
              <CollectButton id={track.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
              {spotify ? <SpotifyAddButton track={track} spotify={spotify} /> : null}
              <button type="button" className="surprise" onClick={surpriseMe}>
                {t("surpriseMe")}
              </button>
              {isSurprise ? (
                <button type="button" className="ghost" onClick={() => setSurprise(null)}>
                  {t("backToToday")}
                </button>
              ) : null}
              <a className="prefs-link" href="#prefs">
                {t("changePrefs")}
              </a>
            </div>
          </div>
          <LyricsPanel id="today-lyrics" track={track} open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
        </article>
      ) : (
        <div className="daily-copy">
          <p className="eyebrow">{t("todayListening", { date: todayLabel })}</p>
          <h2>{t("newRecordingEachDay")}</h2>
          <p>{t("dailyIntro")}</p>
          <a className="prefs-link" href="#prefs">
            {t("changePrefs")}
          </a>
        </div>
      )}
    </section>
  );
}
