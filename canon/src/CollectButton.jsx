import { useI18n } from "./I18n.jsx";

export default function CollectButton({ id, collectedIds, onToggle }) {
  const { t } = useI18n();
  const on = collectedIds.includes(id);
  return (
    <button type="button" className={on ? "is-collected" : ""} aria-pressed={on} onClick={() => onToggle(id)}>
      {on ? t("collectedMark") : t("collect")}
    </button>
  );
}
