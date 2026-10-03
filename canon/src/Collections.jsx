import { useI18n } from "./I18n.jsx";
import TrackCard from "./TrackCard.jsx";

export default function Collections({
  tracks,
  collectedIds,
  collectedAt,
  selectedId,
  onToggleCollect,
  onOpen,
  spotify,
}) {
  const { t } = useI18n();
  const collected = collectedIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean);

  return (
    <section className="collections" id="collections" aria-label={t("collections")}>
      <div className="collections-head">
        <p className="eyebrow">{t("savedByYou")}</p>
        <h2>{t("collections")}</h2>
        <p>
          {collected.length
            ? t("collectionsCount", { n: collected.length })
            : t("collectionsEmpty")}
        </p>
        {collected.length > 0 && spotify ? (
          <button type="button" className="spotify-bulk" disabled={spotify.busy} onClick={() => spotify.addTracks(collected)}>
            {t("addCollectionToSpotify")}
          </button>
        ) : null}
      </div>
      {collected.length > 0 && (
        <div className="grid collections-grid">
          {collected.map((track) => (
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
      )}
    </section>
  );
}
