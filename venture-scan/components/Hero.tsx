"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function Hero({ count }: { count: number }) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="mesh" aria-hidden />
      <div className="relative mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
        <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.28em] text-celadon">
          {t("hero.kicker")}
        </p>
        <h1 className="animate-rise mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-foam sm:text-7xl [animation-delay:80ms]">
          VentureScan
        </h1>
        <p className="animate-rise mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg [animation-delay:160ms]">
          {t("hero.body")}
        </p>
        <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
          <Link href="#ideas" className="btn-primary">
            {t("hero.browse", { count })}
          </Link>
          <Link href="/today" className="btn-ghost">
            {t("hero.today")}
          </Link>
          <Link href="/match" className="btn-ghost">
            {t("hero.match")}
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist/80">
            {t("hero.chips")}
          </span>
        </div>
        <div
          className="pointer-events-none absolute right-[-8%] top-[18%] hidden h-64 w-64 animate-drift rounded-full border border-celadon/25 bg-celadon/10 blur-[2px] sm:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[12%] top-[38%] hidden h-28 w-28 animate-pulse-glow rounded-full bg-copper/30 blur-2xl sm:block"
          aria-hidden
        />
      </div>
    </section>
  );
}
