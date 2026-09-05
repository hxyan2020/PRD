import TrackCard from "./TrackCard.jsx";

export default function Collections({
  tracks,
  collectedIds,
  selectedId,
  onToggleCollect,
  onOpen,
}) {
  const collected = collectedIds
    .map((id) => tracks.find((track) => track.id === id))
    .filter(Boolean);

  return (
    <section className="collections" id="collections" aria-label="Your collections">
      <div className="collections-head">
        <p className="eyebrow">Saved by you</p>
        <h2>Collections</h2>
        <p>
          {collected.length
            ? `${collected.length} recording${collected.length === 1 ? "" : "s"} in your collection. Click Collected to remove one.`
            : "Click Collect on any recording to add it here. Your collection stays in this browser."}
        </p>
      </div>
      {collected.length > 0 && (
        <div className="grid collections-grid">
          {collected.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              selected={selectedId === track.id}
              collectedIds={collectedIds}
              onToggleCollect={onToggleCollect}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
}
