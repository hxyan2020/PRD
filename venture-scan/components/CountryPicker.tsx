"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Flag } from "@/components/Flag";
import { countryToFlagCode } from "@/lib/flag-codes";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  value: string;
  countries: string[];
  onChange: (country: string) => void;
  className?: string;
};

/** Custom country filter with national flag icons (native <select> cannot show images). */
export function CountryPicker({ value, countries, onChange, className }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelAll = t("ledger.allCountries");
  const selectedLabel = value || labelAll;

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = [{ value: "", label: labelAll }, ...countries.map((v) => ({ value: v, label: v }))];

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="field flex w-full items-center gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={labelAll}
        onClick={() => setOpen((v) => !v)}
      >
        {value ? (
          <Flag code={countryToFlagCode(value) ?? ""} title={value} size="sm" />
        ) : (
          <GlobeIcon />
        )}
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <span className="text-[10px] text-mist" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={labelAll}
          className="absolute left-0 z-40 mt-1.5 max-h-72 min-w-full w-max max-w-[min(100vw-2rem,28rem)] overflow-auto rounded-xl border border-black/12 bg-paper py-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || "__all"} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-center gap-2.5 whitespace-nowrap px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-celadon/20 text-foam"
                      : "text-foam hover:bg-black/[0.04]"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.value ? (
                    <Flag
                      code={countryToFlagCode(opt.value) ?? ""}
                      title={opt.value}
                      size="sm"
                    />
                  ) : (
                    <GlobeIcon />
                  )}
                  <span>{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-celadon"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M4.5 12h15" />
      <path d="M12 4a12 12 0 0 1 0 16 12 12 0 0 1 0-16Z" />
    </svg>
  );
}
