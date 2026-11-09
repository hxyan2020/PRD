import { memo, useMemo, useState, useEffect } from "react";
import TrackCard from "./TrackCard.jsx";
import { useI18n } from "./I18n.jsx";

const PAGE_SIZE = 48;

function ArchiveGrid({
  tracks,
  selectedId,
  collectedIds,
  collectedAt,
  onToggleCollect,
  onOpen,
  spotify,
  resetKey = "",
}) {
  const { t } = useI18n();
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [resetKey]);

  const shown = useMemo(() => tracks.slice(0, limit), [tracks, limit]);
  const remaining = Math.max(0, tracks.length - shown.length);

  return (
    <>
      <div className="grid" aria-label={t("catalog")}>
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
      {remaining > 0 ? (
        <p className="archive-more">
          <button type="button" className="search-submit" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
            {t("showMore", { n: Math.min(PAGE_SIZE, remaining) })}
          </button>
        </p>
      ) : null}
    </>
  );
}

export default memo(ArchiveGrid);
