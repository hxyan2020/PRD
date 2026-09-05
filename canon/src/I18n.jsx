import { createContext, useContext, useMemo, useState } from "react";
import {
  applyDocumentLocale,
  LANGUAGES,
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

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="lang-switcher">
      <label className="lang-switcher-label" htmlFor="ui-language">
        {t("language")}
      </label>
      <select
        id="ui-language"
        className="lang-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t("language")}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.native}
          </option>
        ))}
      </select>
      <p className="lang-note">{t("languageNote")}</p>
    </div>
  );
}
