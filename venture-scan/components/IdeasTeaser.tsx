"use client";

import Link from "next/link";
import { IdeaLedgerRow } from "@/components/IdeaLedgerRow";
import { TODAY_HASH, YESTERDAY_HASH, todaysIdeas } from "@/lib/idea-day";
import { useI18n } from "@/lib/i18n/context";
import type { StartupIdea } from "@/lib/types";

/** Homepage: today's live ideas, then a CTA into yesterday's history on /ideas. */
export function IdeasTeaser({ ideas }: { ideas: StartupIdea[] }) {
  const { t } = useI18n();
  const today = todaysIdeas(ideas);

  return (
    <section
      id={TODAY_HASH}
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-6"
    >
      <div className="flex flex-col gap-3 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
            {t("home.todayKicker")}
          </p>
          <h2 className="mt-2 font-display text-3xl text-foam sm:text-4xl">
            {t("home.todayTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            {t("home.todayBody", { count: today.length })}
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          {t("ledger.shown", { count: today.length })}
        </p>
      </div>

      <ul className="divide-y divide-black/10 border-b border-black/10">
        {today.map((idea, idx) => (
          <IdeaLedgerRow key={idea.id} idea={idea} index={idx} />
        ))}
        {today.length === 0 ? (
          <li className="py-12 text-center text-sm text-mist">{t("ledger.empty")}</li>
        ) : null}
      </ul>

      <div className="mt-10 flex flex-col items-stretch gap-3 border border-black/10 bg-black/[0.02] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-celadon">
            {t("home.historyKicker")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mist">{t("home.historyBody")}</p>
        </div>
        <Link
          href={`/ideas#${YESTERDAY_HASH}`}
          className="btn-primary btn-block-mobile shrink-0"
        >
          {t("home.browseHistory")}
        </Link>
      </div>
    </section>
  );
}
