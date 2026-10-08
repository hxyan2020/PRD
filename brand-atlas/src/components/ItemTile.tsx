import { coverGradient } from "../lib/catalog";
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

  return (
    <button
      type="button"
      className={`item-tile is-${mode}`}
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
        style={{ background: coverGradient(item.coverHue, lit) }}
      />
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
