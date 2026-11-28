"use client";

import Link from "next/link";
import { EvidenceCounter } from "@/components/EvidenceCounter";
import { useI18n } from "@/lib/i18n/context";

export function Hero({
  uniqueEvidence,
  languageCount,
  lastScanAt,
}: {
  uniqueEvidence: number;
  languageCount: number;
  lastScanAt: string | null;
}) {
  const { t, locale } = useI18n();
  const scanned =
    lastScanAt &&
    new Date(lastScanAt).toLocaleString(locale, {
      timeZone: "Asia/Singapore",
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <section className="relative min-h-[78vh] overflow-hidden pb-12 pt-8 sm:min-h-[84vh] sm:pb-16 sm:pt-14">
      <div className="pointer-events-none absolute inset-0 sci-fi-grid opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -right-20 top-8 h-80 w-80 animate-drift rounded-full bg-signal/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-ink/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 h-px overflow-hidden"
        aria-hidden
      >
        <div className="h-full w-1/2 animate-scan-line bg-gradient-to-r from-transparent via-signal to-transparent opacity-50" />
      </div>

      <p className="animate-rise relative font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
        {t("hero.kicker")}
      </p>

      <h1 className="animate-rise relative mt-5 font-display text-[clamp(3rem,12vw,6.5rem)] leading-[0.9] tracking-tight text-ink [animation-delay:80ms]">
        SIMULUM
      </h1>

      <p className="animate-rise relative mt-6 max-w-lg text-base text-ink-soft sm:text-lg [animation-delay:140ms]">
        {t("hero.blurb")}
      </p>

      <div className="animate-rise relative mt-12 [animation-delay:200ms]">
        <EvidenceCounter value={uniqueEvidence} />
        <p className="mt-3 font-mono text-sm uppercase tracking-[0.18em] text-mist">
          {t("hero.counting")}
        </p>
        <p className="mt-2 text-sm text-mist">
          {languageCount} {t("hero.languages")}
          {scanned ? ` · ${t("hero.lastScan")} ${scanned} (Asia/Singapore)` : ""}
        </p>
      </div>

      <div className="animate-rise relative mt-10 [animation-delay:280ms]">
        <Link
          href="/evidence"
          className="touch-target inline-flex items-center bg-ink px-6 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft"
        >
          {t("hero.jump")}
        </Link>
      </div>
    </section>
  );
}
