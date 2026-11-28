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
    <section className="relative flex min-h-[min(78dvh,780px)] flex-col justify-center overflow-hidden pb-10 pt-6 sm:min-h-[84vh] sm:pb-16 sm:pt-14">
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

      <p className="animate-rise relative font-mono text-[10px] uppercase tracking-[0.22em] text-signal sm:text-[11px] sm:tracking-[0.28em]">
        {t("hero.kicker")}
      </p>

      <h1 className="animate-rise relative mt-4 font-display text-[clamp(2.75rem,14vw,6.5rem)] leading-[0.9] tracking-tight text-ink sm:mt-5 [animation-delay:80ms]">
        SIMULUM
      </h1>

      <p className="animate-rise relative mt-5 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-lg [animation-delay:140ms]">
        {t("hero.blurb")}
      </p>

      <div className="animate-rise relative mt-8 sm:mt-12 [animation-delay:200ms]">
        <EvidenceCounter value={uniqueEvidence} />
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-mist sm:text-sm sm:tracking-[0.18em]">
          {t("hero.counting")}
        </p>
        <div className="mt-2 space-y-1 text-sm text-mist sm:space-y-0">
          <p>
            {languageCount} {t("hero.languages")}
          </p>
          {scanned ? (
            <p className="text-xs leading-relaxed sm:text-sm">
              {t("hero.lastScan")} {scanned}
              <span className="text-mist/80"> (Asia/Singapore)</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="animate-rise relative mt-8 w-full max-w-md sm:mt-10 sm:max-w-none [animation-delay:280ms]">
        <Link
          href="/evidence"
          className="group touch-target flex w-full items-center justify-center gap-3 border border-signal/50 bg-ink px-7 py-4 text-sm font-medium tracking-[0.08em] text-paper shadow-[0_0_24px_rgba(13,148,136,0.25)] transition hover:border-signal hover:bg-ink-soft hover:shadow-[0_0_36px_rgba(13,148,136,0.4)] sm:inline-flex sm:w-auto sm:justify-start"
        >
          <span>{t("hero.jump")}</span>
          <span
            aria-hidden
            className="font-mono text-signal transition group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
