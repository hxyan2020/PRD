import { useEffect, useId, useRef, useState } from "react";
import { flagUrl, LANGUAGES } from "../i18n/languages";
import { useI18n } from "../i18n/I18nProvider";

export function LanguagePicker() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`lang-picker ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="lang-picker__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Language"
        onClick={() => setOpen((v) => !v)}
      >
        <img
          className="lang-picker__flag"
          src={flagUrl(current.flag)}
          alt=""
          width={24}
          height={18}
        />
        <span className="lang-picker__label">{current.label}</span>
        <span className="lang-picker__chev" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          className="lang-picker__menu"
          role="listbox"
          aria-label="Languages"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                className={`lang-picker__option ${l.code === lang ? "is-active" : ""}`}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
              >
                <img
                  className="lang-picker__flag"
                  src={flagUrl(l.flag)}
                  alt=""
                  width={24}
                  height={18}
                />
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
