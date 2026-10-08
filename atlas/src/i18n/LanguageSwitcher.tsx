import { useEffect, useId, useRef, useState } from "react";
import { LANGUAGES, type LanguageMeta, type LocaleCode } from "./languages";
import { useI18n } from "./I18nProvider";
import { FlagIcon } from "../components/FlagIcon";

function LangRow({ lang }: { lang: LanguageMeta }) {
  return (
    <>
      <FlagIcon
        iso={lang.iso}
        flag={lang.flag}
        className="lang-menu-flag"
        title={lang.englishLabel}
      />
      <span className="lang-menu-label">{lang.nativeLabel}</span>
    </>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];
  const modern = LANGUAGES.filter((l) => l.group === "modern");
  const ancient = LANGUAGES.filter((l) => l.group === "ancient");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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

  function pick(code: LocaleCode) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <div className={`lang-switcher${open ? " is-open" : ""}`} ref={rootRef}>
      <span className="sr-only" id={`${listId}-label`}>
        {t("lang.choose")}
      </span>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        title={t("nav.language")}
        onClick={() => setOpen((v) => !v)}
      >
        <LangRow lang={current} />
        <span className="lang-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div className="lang-menu" id={listId} role="listbox" aria-labelledby={`${listId}-label`}>
          <div className="lang-menu-group" role="group" aria-label={t("lang.modern")}>
            <div className="lang-menu-heading">{t("lang.modern")}</div>
            {modern.map((lang) => {
              const active = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`lang-menu-option${active ? " is-active" : ""}`}
                  onClick={() => pick(lang.code)}
                >
                  <LangRow lang={lang} />
                </button>
              );
            })}
          </div>
          <div className="lang-menu-group" role="group" aria-label={t("lang.ancient")}>
            <div className="lang-menu-heading">{t("lang.ancient")}</div>
            {ancient.map((lang) => {
              const active = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`lang-menu-option${active ? " is-active" : ""}`}
                  onClick={() => pick(lang.code)}
                >
                  <LangRow lang={lang} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
