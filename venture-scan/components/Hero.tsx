"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useI18n } from "@/lib/i18n/context";

export function Hero({ count }: { count: number }) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="mesh" aria-hidden />
      <div className="relative mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col justify-end px-4 pb-12 pt-14 sm:min-h-[72vh] sm:px-6 sm:pb-20 sm:pt-28">
        <div className="animate-rise flex items-center gap-3 sm:gap-4">
          <BrandLogo size={72} className="h-14 w-14 shadow-panel sm:h-[4.5rem] sm:w-[4.5rem]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-celadon sm:text-[11px] sm:tracking-[0.28em]">
            {t("hero.kicker")}
          </p>
        </div>
        <h1 className="animate-rise mt-3 max-w-3xl font-display text-[2.75rem] leading-[1.05] text-foam sm:mt-4 sm:text-7xl [animation-delay:80ms]">
          VentureScan
        </h1>
        <p className="animate-rise mt-4 max-w-xl text-[0.95rem] leading-relaxed text-mist sm:mt-5 sm:text-lg [animation-delay:160ms]">
          {t("hero.body")}
        </p>
        <div className="animate-rise mt-7 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 [animation-delay:240ms]">
          <Link href="#ideas" className="btn-primary btn-block-mobile">
            {t("hero.browse", { count })}
          </Link>
          <Link href="/today" className="btn-ghost btn-block-mobile">
            {t("hero.today")}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist/80 sm:text-[11px] sm:tracking-[0.18em]">
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
