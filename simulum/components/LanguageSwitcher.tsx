"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
      alt=""
      width={dims.width}
      height={dims.height}
      loading="lazy"
      decoding="async"
      className={`${dims.className} shrink-0 border border-line object-cover`}
    />
  );
}

/** Dropdown / sheet with a national flag before every language. */
export function LanguageMenu({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, locales, t } = useI18n();
  const current = locales.find((l) => l.code === locale) ?? locales[0];
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNarrow, setIsNarrow] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        const list = document.getElementById(listId);
        if (list?.contains(event.target as Node)) return;
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, listId]);

  useEffect(() => {
    if (!open || !isNarrow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isNarrow]);

  const panel = open ? (
    <>
      {isNarrow ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-paper/70"
          aria-label={t("nav.close")}
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        id={listId}
        className={
          isNarrow
            ? "fixed inset-x-0 bottom-0 z-[70] max-h-[min(70vh,28rem)] overflow-auto border border-line bg-panel pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-panel"
            : "absolute end-0 z-[70] mt-1 max-h-[min(24rem,70vh)] w-64 overflow-auto border border-line bg-panel py-1 shadow-panel"
        }
        role="listbox"
        aria-label={t("lang.label")}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel px-4 py-3 md:px-3 md:py-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
            {t("lang.label")} · {locales.length}
          </p>
          {isNarrow ? (
            <button
              type="button"
              className="touch-target px-2 font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
              onClick={() => setOpen(false)}
            >
              {t("nav.close")}
            </button>
          ) : null}
        </div>
        {locales.map((l) => {
          const selected = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={selected}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-base transition hover:bg-signal-soft md:px-3 md:py-2.5 md:text-sm ${
                selected ? "bg-signal-soft text-ink" : "text-ink-soft"
              }`}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
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
    </>
  ) : null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={`touch-target flex items-center gap-2 border border-line bg-panel text-xs text-ink sm:text-sm ${
          compact ? "px-2 py-1.5" : "px-2.5 py-1.5 sm:px-3"
        }`}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("lang.label")}
        onClick={() => setOpen((v) => !v)}
      >
        <FlagIcon locale={current} size="sm" />
        <span
          className={`truncate ${
            compact
              ? "hidden max-w-[5.5rem] sm:inline sm:max-w-[7rem]"
              : "max-w-[5.5rem] sm:max-w-[7rem]"
          }`}
        >
          {current.nativeName}
        </span>
        <span className="text-signal" aria-hidden>
          ▾
        </span>
      </button>

      {mounted && open
        ? isNarrow
          ? createPortal(panel, document.body)
          : panel
        : null}
    </div>
  );
}
