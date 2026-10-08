import { coverGradient } from "../lib/catalog";
import { coverUrl, markUrl } from "../lib/marks";
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
  const stockCover = coverUrl(item);
  const photo = hasSighting ? unlock?.photoDataUrl : stockCover;
  const mark = markUrl(item);
  const isNature = ["trees", "flowers", "animals"].includes(item.categoryId);
  // Nature: photo alone. Brands: keep grey logo overlay on locked photo covers.
  const showMark =
    !photo ||
    (mode === "locked" && !hasSighting && Boolean(stockCover) && !isNature);

  return (
    <button
      type="button"
      className={`item-tile is-${mode}${photo ? " has-cover" : ""}`}
      onClick={onClick}
      aria-label={
        mode === "unlocked"
          ? item.name
          : mode === "sneak"
            ? `${t("catalog.sneak")}`
            : t("catalog.locked")
      }
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
        ) : mode === "sneak" ? (
          <>
            <strong>????</strong>
            <small>{t("catalog.sneak")} · scan to reveal</small>
          </>
        ) : (
          <>
            <strong>????</strong>
            <small>Scan to reveal</small>
          </>
        )}
      </div>
    </button>
  );
}
