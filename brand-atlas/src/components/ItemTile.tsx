import { coverGradient } from "../lib/catalog";
import type { CatalogItem } from "../types/catalog";

interface Props {
  item: CatalogItem;
  unlocked: boolean;
  onClick?: () => void;
}

export function ItemTile({ item, unlocked, onClick }: Props) {
  return (
    <button
      type="button"
      className={`item-tile ${unlocked ? "is-unlocked" : "is-locked"}`}
      onClick={onClick}
      aria-label={`${item.name}${unlocked ? " unlocked" : " locked"}`}
    >
      <div
        className="item-tile__cover"
        style={{ background: coverGradient(item.coverHue, unlocked) }}
      />
      <span className="item-tile__badge">{unlocked ? "Unlocked" : "Locked"}</span>
      <div className="item-tile__body">
        <strong>{unlocked ? item.name : "????"}</strong>
        <small>{unlocked ? item.origin ?? "Worldwide" : "Scan to reveal"}</small>
      </div>
    </button>
  );
}
