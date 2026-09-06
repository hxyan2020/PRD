import CollectButton from "./CollectButton.jsx";
import { useI18n } from "./I18n.jsx";
import SpotifyAddButton from "./SpotifyAddButton.jsx";
import { artistLabel, collectedStamp, playsLabel, yearLabel } from "./uiText.js";

export default function TrackCard({
  track,
  selected,
  collectedIds,
  collectedAt,
  onToggleCollect,
  onOpen,
  spotify,
}) {
  const { locale, t } = useI18n();
  const collected = collectedIds.includes(track.id);
  return (
    <article className={`card ${selected ? "is-open" : ""} ${collected ? "is-saved" : ""}`}>
      <button className="cover-btn" onClick={() => onOpen(track, true)} type="button">
        <img src={track.coverUrl} alt={t("coverAlt", { name: track.name })} loading="lazy" />
        {track.rank ? <span className="rank">#{String(track.rank).padStart(3, "0")}</span> : null}
        {collected ? <span className="collected-mark">{t("collectedMark")}</span> : null}
      </button>
      <div className="card-body">
        <h2>{track.name}</h2>
        <p className="artist">{artistLabel(track, t)}</p>
        <p className="meta-line">
          {yearLabel(track.year, t)} · {track.genre}
        </p>
        <p className="plays">
          {track.extra ? t("spotifyPopularity", { n: track.popularity || 0 }) : playsLabel(track.streams, t)}
        </p>
        {collected ? <p className="collected-date">{collectedStamp(collectedAt?.[track.id], t, locale)}</p> : null}
        <div className="card-actions">
          <button type="button" onClick={() => onOpen(track, true)}>
            {t("listen")}
          </button>
          <button type="button" onClick={() => onOpen(track, true)}>
            {t("lyrics")}
          </button>
          <CollectButton id={track.id} collectedIds={collectedIds} onToggle={onToggleCollect} />
          {spotify ? <SpotifyAddButton track={track} spotify={spotify} /> : null}
        </div>
      </div>
    </article>
  );
}
