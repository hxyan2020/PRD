"use client";

import Image from "next/image";
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
    <section className="relative flex min-h-[min(88dvh,860px)] flex-col justify-center overflow-hidden pb-12 pt-4 sm:min-h-[90vh] sm:pb-20 sm:pt-10">
      {/* Mechanical atmosphere */}
      <div className="pointer-events-none absolute inset-0 sci-fi-grid opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 animate-gear-spin mech-gear opacity-40 sm:right-0 sm:h-[36rem] sm:w-[36rem]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[42%] h-px overflow-hidden"
        aria-hidden
      >
        <div className="h-full w-2/5 animate-scan-sweep bg-gradient-to-r from-transparent via-signal to-transparent" />
      </div>

      <p className="animate-rise relative hud-label animate-flicker">
        {t("hero.kicker")}
      </p>

      <div className="animate-rise relative mt-5 flex items-start gap-3 sm:mt-6 sm:gap-5 [animation-delay:70ms]">
        <Image
          src="/logo-mark.png"
          alt=""
          width={96}
          height={96}
          className="mt-1 h-14 w-14 shrink-0 object-contain sm:mt-2 sm:h-20 sm:w-20 md:h-24 md:w-24"
          priority
        />
        <h1 className="max-w-[14ch] font-display text-[clamp(2.2rem,9.5vw,5rem)] font-semibold leading-[0.95] tracking-[0.01em] text-ink sm:max-w-none">
          {t("brand.name")}
        </h1>
      </div>

      <p className="animate-rise relative mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-soft sm:mt-6 sm:max-w-lg sm:text-lg [animation-delay:130ms]">
        {t("hero.blurb")}
      </p>

      <div className="animate-rise relative mt-8 w-full max-w-sm sm:mt-10 sm:max-w-none [animation-delay:200ms]">
        <Link
          href="/evidence"
          className="group touch-target mech-frame relative flex w-full items-center justify-center gap-3 bg-panel/90 px-7 py-4 text-sm font-medium tracking-[0.12em] text-ink shadow-hud transition hover:border-signal hover:text-signal-bright sm:inline-flex sm:w-auto sm:justify-start"
        >
          <span className="font-display uppercase">{t("hero.jump")}</span>
          <span
            aria-hidden
            className="font-mono text-signal transition group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>

      {/* Instrument readout — below CTA, still in composition */}
      <div className="animate-rise relative mt-12 max-w-xl sm:mt-16 [animation-delay:280ms]">
        <div className="mech-rule mb-5" />
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="hud-label">{t("hero.counting")}</p>
            <EvidenceCounter value={uniqueEvidence} />
          </div>
          <div className="space-y-1 pb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            <p>
              <span className="text-ember">{languageCount}</span> {t("hero.languages")}
            </p>
            {scanned ? (
              <p className="max-w-[16rem] normal-case tracking-normal text-mist/90">
                {t("hero.lastScan")} {scanned}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
