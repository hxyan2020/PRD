"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

/** Homepage CTA into the full Ideas ledger (DB-backed browse page). */
export function IdeasTeaser({ count }: { count: number }) {
  const { t } = useI18n();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 border border-black/10 bg-black/[0.02] px-5 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-10">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
            {t("nav.ideas")}
          </p>
          <h2 className="mt-2 font-display text-3xl text-foam sm:text-4xl">{t("ledger.title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-mist">{t("ledger.body")}</p>
        </div>
        <Link href="/ideas" className="btn-primary btn-block-mobile shrink-0">
          {t("hero.browse", { count })}
        </Link>
      </div>
    </section>
  );
}
