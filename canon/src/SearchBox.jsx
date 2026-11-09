import { useState } from "react";
import { useI18n } from "./I18n.jsx";

export default function SearchBox({ value = "", onSearch, onClear }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value);

  function submit() {
    onSearch?.(String(draft || "").trim());
  }

  return (
    <div className="search-row">
      <input
        className="search"
        type="search"
        placeholder={t("searchPlaceholder")}
        value={draft}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (!next.trim()) onClear?.();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button className="search-submit" type="button" onClick={submit}>
        {t("searchAction")}
      </button>
    </div>
  );
}
