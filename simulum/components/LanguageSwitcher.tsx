"use client";

import { useI18n } from "@/lib/i18n/context";
import { flagSvgUrl, type LocaleMeta } from "@/lib/i18n/locales";

function FlagIcon({
  locale,
  size = "md",
}: {
  locale: LocaleMeta;
  size?: "sm" | "md";
}) {
  const dims =
    size === "sm"
      ? { width: 22, height: 16, className: "h-4 w-[22px]" }
      : { width: 28, height: 20, className: "h-5 w-7" };

  return (
    // eslint-disable-next-line @next/next/no-img-element -- national flag SVG from flagcdn
    <img
      src={flagSvgUrl(locale.flag)}
      alt={`${locale.name} flag`}
      width={dims.width}
      height={dims.height}
      loading="lazy"
      decoding="async"
      className={`${dims.className} shrink-0 rounded-[2px] border border-line/70 object-cover shadow-sm`}
    />
  );
}

/** Dropdown with a real national flag image icon in front of every language. */
export function LanguageMenu() {
  const { locale, setLocale, locales, t } = useI18n();
  const current = locales.find((l) => l.code === locale) ?? locales[0];

  return (
    <div className="relative">
      <details className="group">
        <summary className="touch-target flex cursor-pointer list-none items-center gap-2 rounded-md border border-line/70 bg-paper/80 px-2 py-1.5 text-xs sm:px-3 sm:text-sm">
          <FlagIcon locale={current} size="sm" />
          <span className="max-w-[5.5rem] truncate sm:max-w-[7rem]">
            {current.nativeName}
          </span>
          <span className="text-mist" aria-hidden>
            ▾
          </span>
        </summary>
        <div
          className="absolute end-0 z-40 mt-1 max-h-[min(24rem,70vh)] w-60 overflow-auto border border-line bg-paper py-1 shadow-lg"
          role="listbox"
          aria-label={t("lang.label")}
        >
          <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mist">
            {t("lang.label")} · {locales.length}
          </p>
          {locales.map((l) => {
            const selected = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-signal-soft/50 ${
                  selected ? "bg-signal-soft/40 text-ink" : "text-ink-soft"
                }`}
                onClick={() => {
                  setLocale(l.code);
                  const details = document.querySelectorAll("header details.group");
                  details.forEach((d) => d.removeAttribute("open"));
                }}
              >
                <FlagIcon locale={l} />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-medium text-ink">{l.nativeName}</span>
                  <span className="truncate font-mono text-[10px] text-mist">
                    {l.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
