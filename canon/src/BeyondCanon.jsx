import { useState } from "react";
import { useI18n } from "./I18n.jsx";
import TrackCard from "./TrackCard.jsx";
import {
  buildBeyondQuery,
  catalogSpotifyIds,
  extrasFromSearch,
  marketForCountry,
} from "./beyond.js";

export default function BeyondCanon({
  prefs,
  catalog,
  selectedId,
  collectedIds,
  collectedAt,
  onToggleCollect,
  onOpen,
  onExtras,
  onRecommend,
  spotify,
}) {
  const { t } = useI18n();
  const [shown, setShown] = useState([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState("");
  const [errorText, setErrorText] = useState("");
  const [tried, setTried] = useState(false);

  const mood = String(prefs?.mood || "").trim();
  const country = String(prefs?.country || "").trim();
  const genre = String(prefs?.genre || "").trim();
  const activePrefs = [mood, country, genre].filter(Boolean);
  const catalogIds = catalogSpotifyIds(catalog);

  async function fetchPage(nextOffset, replace) {
    if (!spotify?.user) {
      setErrorKey("spotify.needConnect");
      setErrorText("");
      spotify?.setStatus?.({ key: "spotify.needConnect" });
      document.getElementById("spotify-connect")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setBusy(true);
    setErrorKey("");
    setErrorText("");
    try {
      const payload = await spotify.searchTracks({
        query: buildBeyondQuery(prefs),
        market: marketForCountry(country),
        offset: nextOffset,
      });
      const already = new Set((replace ? [] : shown).map((track) => track.spotifyId).filter(Boolean));
      const fresh = extrasFromSearch(payload, { prefs, catalogIds, alreadyIds: already });
      const next = replace ? fresh : [...shown, ...fresh];
      setShown(next);
      setOffset(nextOffset + 20);
      setTried(true);
      onExtras?.(fresh);
      if (fresh[0]) {
        onRecommend?.({
          trackId: fresh[0].id,
          name: fresh[0].name,
          artist: fresh[0].singer,
          coverUrl: fresh[0].coverUrl,
          mode: "beyond",
          kind: "beyond",
          mood,
          country,
          genre,
        });
        if (replace) onOpen?.(fresh[0], true);
      } else if (replace || shown.length === 0) {
        setErrorKey("beyondEmpty");
      }
    } catch (err) {
      setErrorKey("");
      setErrorText(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="beyond" id="beyond-canon" aria-label={t("beyondTitle")}>
      <div className="collections-head">
        <p className="eyebrow">{t("beyondEyebrow")}</p>
        <h2>{t("beyondTitle")}</h2>
        <p>{t("beyondIntro")}</p>
        <p className="daily-stamp">
          {activePrefs.length ? t("beyondMatched", { prefs: activePrefs.join(" · ") }) : t("beyondPopular")}
        </p>
        <div className="daily-actions">
          <button type="button" className="surprise" disabled={busy} onClick={() => fetchPage(0, true)}>
            {t("beyondFind")}
          </button>
          {shown.length > 0 ? (
            <button type="button" className="ghost" disabled={busy} onClick={() => fetchPage(offset, false)}>
              {t("beyondMore")}
            </button>
          ) : null}
        </div>
        {!spotify?.user ? <p className="stats-note">{t("beyondNeedSpotify")}</p> : null}
        {errorKey ? <p className="spotify-status">{t(errorKey)}</p> : null}
        {errorText ? <p className="spotify-status">{errorText}</p> : null}
        {tried && shown.length > 0 ? <p className="result-count">{t("beyondCount", { n: shown.length })}</p> : null}
      </div>
      {shown.length > 0 ? (
        <div className="grid collections-grid">
          {shown.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              selected={selectedId === track.id}
              collectedIds={collectedIds}
              collectedAt={collectedAt}
              onToggleCollect={onToggleCollect}
              onOpen={onOpen}
              spotify={spotify}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
