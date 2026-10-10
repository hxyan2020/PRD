"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { withBase } from "@/lib/base-path";
import { useI18n } from "@/lib/i18n/context";

export function Hero({ count }: { count: number }) {
  const { t } = useI18n();

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-paper">
      {/* Full-bleed collage banner */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBase("/banner-home.jpg")}
          alt=""
          className="h-full w-full animate-ken object-cover object-center"
          decoding="async"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-paper via-paper/88 to-paper/20 sm:via-paper/80 sm:to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-paper to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        <div className="animate-rise max-w-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <BrandLogo
              size={72}
              className="h-14 w-14 shadow-panel ring-1 ring-black/10 sm:h-[4.5rem] sm:w-[4.5rem]"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/80 sm:text-[11px] sm:tracking-[0.28em]">
              <span className="mr-2 inline-block h-2 w-2 rounded-sm bg-celadon align-middle" aria-hidden />
              {t("hero.kicker")}
            </p>
          </div>
          <h1 className="mt-4 font-display text-[2.9rem] leading-[0.98] tracking-tight text-ink sm:mt-5 sm:text-7xl">
            VentureScan
          </h1>
          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-mist sm:mt-5 sm:text-lg">
            {t("hero.body")}
          </p>
          <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <Link href="#ideas" className="btn-primary btn-block-mobile">
              {t("hero.browse", { count })}
            </Link>
            <Link href="/today" className="btn-ghost btn-block-mobile">
              {t("hero.today")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
