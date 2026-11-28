"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { flagUrl } from "@/lib/i18n/locales";
import type { LocaleCode } from "@/lib/types";

export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useI18n();

  return (
    <label className="relative inline-flex items-center gap-2">
      <span className="sr-only">{t("lang.label")}</span>
      <span className="hidden sm:inline">
        <Image
          src={flagUrl(locales.find((l) => l.code === locale)?.flag ?? "gb", 40)}
          alt=""
          width={20}
          height={14}
          className="h-3.5 w-5 object-cover"
          unoptimized
        />
      </span>
      <select
        className="touch-target max-w-[10.5rem] appearance-none rounded-md border border-line/80 bg-paper/90 py-2 pl-2 pr-7 text-xs text-ink sm:max-w-[12rem] sm:text-sm"
        value={locale}
        aria-label={t("lang.label")}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Dropdown options with flag icons rendered in a custom panel for clarity. */
export function LanguageMenu() {
  const { locale, setLocale, locales, t } = useI18n();
  return (
    <div className="relative">
      <details className="group">
        <summary className="touch-target flex cursor-pointer list-none items-center gap-2 rounded-md border border-line/70 bg-paper/80 px-2 py-1.5 text-xs sm:px-3 sm:text-sm">
          <Image
            src={flagUrl(locales.find((l) => l.code === locale)?.flag ?? "gb", 40)}
            alt=""
            width={22}
            height={16}
            className="h-4 w-[22px] object-cover"
            unoptimized
          />
          <span className="max-w-[5.5rem] truncate sm:max-w-[7rem]">
            {locales.find((l) => l.code === locale)?.nativeName}
          </span>
          <span className="text-mist">▾</span>
        </summary>
        <div className="absolute end-0 z-40 mt-1 max-h-72 w-52 overflow-auto border border-line bg-paper py-1 shadow-lg">
          <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">
            {t("lang.label")}
          </p>
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-signal-soft/50 ${
                l.code === locale ? "bg-signal-soft/40 text-ink" : "text-ink-soft"
              }`}
              onClick={() => {
                setLocale(l.code);
                const details = document.querySelectorAll("details.group");
                details.forEach((d) => d.removeAttribute("open"));
              }}
            >
              <Image
                src={flagUrl(l.flag, 40)}
                alt=""
                width={22}
                height={16}
                className="h-4 w-[22px] shrink-0 object-cover"
                unoptimized
              />
              <span>{l.nativeName}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
