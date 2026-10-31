import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  applyDocumentLocale,
  LANGUAGES,
  languageFlagUrl,
  languageMeta,
  loadLocale,
  saveLocale,
  t as translate,
} from "./i18n.js";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const next = loadLocale();
    applyDocumentLocale(next);
    return next;
  });

  const value = useMemo(() => {
    const setLocale = (next) => {
      saveLocale(next);
      applyDocumentLocale(next);
      setLocaleState(next);
    };
    return {
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

function FlagImage({ locale, label }) {
  return (
    <img
      className="lang-flag"
      src={languageFlagUrl(locale)}
      alt=""
      width="22"
      height="16"
      decoding="async"
      aria-hidden="true"
      title={label}
    />
  );
}

export function LanguageSwitcher({ compact = false } = {}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = languageMeta(locale);
  const labelId = compact ? "ui-language-label-menu" : "ui-language-label";
  const controlId = compact ? "ui-language-menu-bar" : "ui-language";
  const listId = compact ? "ui-language-menu-bar-list" : "ui-language-menu";

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`lang-switcher ${compact ? "is-compact" : ""}`} ref={rootRef}>
      {compact ? (
        <span className="visually-hidden" id={labelId}>
          {t("language")}
        </span>
      ) : (
        <span className="lang-switcher-label" id={labelId}>
          {t("language")}
        </span>
      )}
      <div className="lang-select-wrap">
        <button
          type="button"
          className={`lang-select ${open ? "is-open" : ""}`}
          id={controlId}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          <FlagImage locale={current.id} label={current.country} />
          <span className="lang-select-name">{current.native}</span>
        </button>
        {open ? (
          <ul className="lang-menu" id={listId} role="listbox" aria-labelledby={labelId}>
            {LANGUAGES.map((lang) => (
              <li key={lang.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  className={lang.id === locale ? "is-on" : ""}
                  aria-selected={lang.id === locale}
                  onClick={() => {
                    setLocale(lang.id);
                    setOpen(false);
                  }}
                >
                  <FlagImage locale={lang.id} label={lang.country} />
                  <span className="lang-select-name">{lang.native}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {compact ? null : <p className="lang-note">{t("languageNote")}</p>}
    </div>
  );
}
