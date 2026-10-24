"use client";

import Link from "next/link";
import { Flag } from "@/components/Flag";
import { IdeaLedgerPhotos } from "@/components/IdeaLedgerPhotos";
import { IndustryIcon } from "@/components/IndustryIcon";
import { SectorLabel } from "@/components/SectorLabel";
import { isArchivedIdea } from "@/lib/archived-ideas";
import { countryToFlagCode } from "@/lib/flag-codes";
import { formatMoney, strategyMessageKey } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import type { IdeaMatch, StartupIdea } from "@/lib/types";

export function IdeaLedgerRow({
  idea,
  match,
  index = 0,
}: {
  idea: StartupIdea;
  match?: IdeaMatch;
  index?: number;
}) {
  const { t, locale } = useI18n();
  const view = localizeIdea(idea, locale);

  return (
    <li
      className="idea-ledger-row animate-rise group py-5 sm:py-6"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link href={`/ideas/${idea.slug}`} scroll className="idea-card-link block outline-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:gap-4">
            <IdeaLedgerPhotos slug={idea.slug} name={view.name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <h3 className="font-display text-[1.25rem] leading-snug text-foam transition group-hover:text-black sm:text-2xl">
                  {view.name}
                </h3>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                    idea.fundraisingSecured ? "text-celadon" : "text-copper"
                  }`}
                >
                  {idea.fundraisingSecured
                    ? t("ledger.funded", { stage: idea.fundingStage ?? "secured" })
                    : t("ledger.open")}
                </span>
                {isArchivedIdea(idea) ? (
                  <span className="rounded-md border border-black/15 bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
                    {t("ledger.archived")}
                  </span>
                ) : null}
                {match ? (
                  <span className="rounded-full border border-celadon/30 bg-celadon/10 px-2 py-0.5 font-mono text-[10px] text-celadon">
                    {t("ledger.match", { score: match.score })}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-mist">
                {view.description}
              </p>
              <div className="idea-ledger-meta mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-mist/90">
                <span className="inline-flex min-w-0 max-w-[min(100%,18rem)] items-center gap-1.5">
                  <Flag
                    code={countryToFlagCode(idea.teamCountry) ?? ""}
                    title={idea.teamCountry}
                    size="sm"
                  />
                  <span className="truncate">
                    {idea.teamCountry}
                    {idea.teamCity ? ` · ${idea.teamCity}` : ""}
                  </span>
                </span>
                <span className="shrink-0">{t("common.people", { count: idea.teamSize })}</span>
                <span className="inline-flex min-w-0 max-w-[min(100%,14rem)] items-center gap-1.5">
                  <IndustryIcon industry={idea.industry} className="shrink-0 text-celadon" />
                  <span className="truncate">{view.industry}</span>
                </span>
                <SectorLabel
                  sector={idea.sector}
                  label={view.sector}
                  className="max-w-[min(100%,16rem)] text-xs text-mist/90"
                />
                {idea.fundraisingSecured ? (
                  <span className="shrink-0">{formatMoney(idea.fundingAmountUsd)}</span>
                ) : null}
              </div>
            </div>
          </div>
          <p className="shrink-0 border-t border-black/5 pt-3 text-xs leading-relaxed text-mist sm:max-w-xs sm:border-0 sm:pt-0 sm:text-right">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-celadon">
              {t("ledger.goForward")}
            </span>
            <br />
            {t(strategyMessageKey(idea.goForward.strategy))}
          </p>
        </div>
      </Link>
    </li>
  );
}
