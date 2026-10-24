"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FundingRoundIcon } from "@/components/FundingRoundIcon";
import { useI18n } from "@/lib/i18n/context";
import { usePickerLock } from "@/lib/use-picker-lock";

type Props = {
  value: string;
  rounds: string[];
  onChange: (round: string) => void;
  className?: string;
};

/** Custom fundraising-round filter with stage icons. */
export function FundingRoundPicker({ value, rounds, onChange, className }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelAll = t("ledger.allRounds");
  const selectedLabel = value || labelAll;
  usePickerLock(open);

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

  const options = [{ value: "", label: labelAll }, ...rounds.map((v) => ({ value: v, label: v }))];

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
        <FundingRoundIcon stage={value} className="text-celadon" />
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <span className="text-[10px] text-mist" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="picker-backdrop"
            aria-label={t("ideaAlbum.close")}
            onClick={() => setOpen(false)}
          />
          <ul id={listId} role="listbox" aria-label={labelAll} className="picker-menu">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value || "__all"} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm transition sm:whitespace-nowrap sm:py-2.5 ${
                      active
                        ? "bg-celadon/20 text-foam"
                        : "text-foam hover:bg-black/[0.04]"
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <FundingRoundIcon
                      stage={opt.value}
                      className={active ? "text-celadon" : "text-mist"}
                    />
                    <span className="min-w-0 flex-1 whitespace-normal break-words">
                      {opt.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
