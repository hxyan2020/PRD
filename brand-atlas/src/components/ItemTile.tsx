import { useState } from "react";
import { coverGradient } from "../lib/catalog";
import { coverUrl, markUrl } from "../lib/marks";
import { isNatureCategory } from "../lib/nature";
import { getUnlock } from "../lib/unlocks";
import type { CatalogItem, RevealMode } from "../types/catalog";
import { useI18n } from "../i18n/I18nProvider";

interface Props {
  item: CatalogItem;
  mode: RevealMode;
  onClick?: () => void;
}

export function ItemTile({ item, mode, onClick }: Props) {
  const { t } = useI18n();
  const lit = mode === "unlocked" || mode === "sneak";
  const unlock = mode === "unlocked" ? getUnlock(item.id) : undefined;
  const hasSighting = Boolean(unlock?.photoDataUrl);
  const [coverFailed, setCoverFailed] = useState(false);
  const stockCover = coverFailed ? null : coverUrl(item);
  const mark = markUrl(item);
  const nature = isNatureCategory(item.categoryId);
  // Nature shelves: species photos. Brand shelves: logos while locked — Wikipedia
  // product shots for short brand names (Martin, Pearl, King…) often belong to
  // another topic entirely and leaked into the wrong category.
  const photo = hasSighting
    ? unlock?.photoDataUrl
    : nature || mode === "unlocked"
      ? stockCover
      : null;
  const showMark = !photo && Boolean(mark);

  return (
    <button
      type="button"
      className={`item-tile is-${mode}${photo ? " has-cover" : ""}${nature ? " is-nature" : ""}`}
      onClick={onClick}
      aria-label={item.name}
    >
      <div
        className="item-tile__cover"
        style={{
          background: photo ? undefined : coverGradient(item.coverHue, lit),
        }}
      >
        {photo && (
          <img
            className="item-tile__photo"
            src={photo}
            alt=""
            draggable={false}
            loading="lazy"
            onError={() => {
              if (!hasSighting) setCoverFailed(true);
            }}
          />
        )}
        {showMark && mark && (
          <img
            className={`item-tile__mark${photo ? " item-tile__mark--overlay" : ""}`}
            src={mark}
            alt=""
            draggable={false}
            loading="lazy"
          />
        )}
      </div>
      <span className="item-tile__badge">
        {mode === "unlocked"
          ? t("catalog.unlocked")
          : mode === "sneak"
            ? t("catalog.sneak")
            : t("catalog.locked")}
      </span>
      <div className="item-tile__body">
        {mode === "unlocked" ? (
          <>
            <strong>{item.name}</strong>
            <small>{item.origin ?? "Worldwide"}</small>
          </>
        ) : (
          <>
            <strong>{item.name}</strong>
            <small>
              {mode === "sneak" ? t("catalog.sneak") : t("catalog.locked")} ·{" "}
              {t("catalog.scanForColour")}
            </small>
          </>
        )}
      </div>
    </button>
  );
}
