"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-2" aria-label={t("language")}>
      {(["en", "zh"] as const).map((entry) => (
        <button
          key={entry}
          type="button"
          onClick={() => setLocale(entry)}
          className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
            locale === entry
              ? "border-gold bg-gold/10 text-gold"
              : "border-line text-muted hover:border-gold/40 hover:text-paper"
          }`}
        >
          {entry === "en" ? t("langEn") : t("langZh")}
        </button>
      ))}
    </div>
  );
}
