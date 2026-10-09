"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { LocaleCode } from "@/lib/i18n/locales";

export function LanguagePicker() {
  const { locale, locales, setLocale, t, meta } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-foam hover:border-white/25 hover:bg-white/10"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.pickerLabel")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-base leading-none" aria-hidden>
          {meta.flag}
        </span>
        <span className="hidden sm:inline">{meta.label}</span>
        <span className="text-[10px] text-mist" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t("lang.pickerLabel")}
          className="absolute end-0 z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-white/15 bg-ink-2 py-1 shadow-panel"
        >
          {locales.map((item) => {
            const selected = item.code === locale;
            return (
              <li key={item.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/10 ${
                    selected ? "bg-celadon/15 text-foam" : "text-mist"
                  }`}
                  onClick={() => {
                    setLocale(item.code as LocaleCode);
                    setOpen(false);
                  }}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {item.flag}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-foam">{item.label}</span>
                    <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-mist/80">
                      {item.labelEn}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
