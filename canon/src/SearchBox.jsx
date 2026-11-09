import { useEffect, useRef } from "react";
import { useI18n } from "./I18n.jsx";

/** Uncontrolled so keystrokes never re-render the archive. */
export default function SearchBox({ value = "", onSearch }) {
  const { t } = useI18n();
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  function submit() {
    const next = String(inputRef.current?.value || "").trim();
    onSearch?.(next);
  }

  return (
    <div className="search-row">
      <input
        ref={inputRef}
        className="search"
        type="search"
        name="canon-archive-search"
        placeholder={t("searchPlaceholder")}
        defaultValue={value}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
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
