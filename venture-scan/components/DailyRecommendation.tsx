"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CollectButton } from "@/components/CollectButton";
import { Flag } from "@/components/Flag";
import { ProfileChatbot } from "@/components/ProfileChatbot";
import { fetchDaily } from "@/lib/client-api";
import { countryToFlagCode } from "@/lib/flag-codes";
import { formatMoney, strategyMessageKey } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import { localizeCountry } from "@/lib/i18n/localize-source";
import { presentMatch } from "@/lib/i18n/present-match";
import { emptyProfile, isProfileReady, loadProfileFromStorage } from "@/lib/profile";
import type { GapPoint, IdeaMatch, MatchPoint, StartupIdea } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "need-profile" }
  | { status: "edit-profile" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      day: string;
      idea: StartupIdea;
      match: IdeaMatch;
    };

export function DailyRecommendation() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });

  const loadDaily = useCallback(async () => {
    const profile = loadProfileFromStorage();
    if (!profile || !isProfileReady(profile)) {
      setState({ status: "need-profile" });
      return;
    }

    setState({ status: "loading" });
    try {
      const daily = await fetchDaily(profile);
      if (!daily) throw new Error("Could not load today's pick");
      setState({
        status: "ready",
        day: daily.day,
        idea: daily.idea,
        match: daily.match,
      });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Could not load today's pick",
      });
    }
  }, []);

  useEffect(() => {
    void loadDaily();
  }, [loadDaily]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        {t("today.loading")}
      </div>
    );
  }

  if (state.status === "need-profile" || state.status === "edit-profile") {
    return (
      <ProfileChatbot
        onProfileSaved={() => {
          void loadDaily();
        }}
      />
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-copper sm:px-6">
        {state.message}
      </div>
    );
  }

  const { day, idea, match } = state;
  const view = localizeIdea(idea, locale);
  const profile = loadProfileFromStorage() ?? emptyProfile();
  const presented = presentMatch(match, view, profile, t, locale);
  const countryLabel = localizeCountry(idea.teamCountry, locale);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
        {t("today.dateLabel", { day })}
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl text-foam sm:text-5xl">{view.name}</h1>
        <span className="w-fit rounded-full border border-celadon/40 bg-celadon/15 px-3 py-1 font-mono text-sm text-celadon">
          {t("today.scoreMatch", { score: match.score })}
        </span>
      </div>
      <p className="mt-4 text-base leading-relaxed text-mist">{view.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist">
        <span className="inline-flex items-center gap-1.5">
          <Flag
            code={countryToFlagCode(idea.teamCountry) ?? ""}
            title={countryLabel}
            size="sm"
          />
          {countryLabel}
          {idea.teamCity ? ` · ${idea.teamCity}` : ""}
        </span>
        <span>
          {view.industry} / {view.sector}
        </span>
        <span>
          {idea.fundraisingSecured
            ? t("ledger.funded", { stage: formatMoney(idea.fundingAmountUsd) })
            : t("ledger.open")}
        </span>
        <span>
          {t("common.play")}: {t(strategyMessageKey(idea.goForward.strategy))}
        </span>
      </div>

      <section className="mt-10 animate-rise">
        <h2 className="font-display text-2xl text-foam">{t("today.matched")}</h2>
        {presented.matched.length ? (
          <ul className="mt-4 space-y-3">
            {presented.matched.map((point) => (
              <MatchRow key={point.dimension} point={point} matchedLabel={t("today.matched")} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mist">{t("today.noMatch")}</p>
        )}
      </section>

      <section className="mt-10 animate-rise [animation-delay:80ms]">
        <h2 className="font-display text-2xl text-foam">{t("today.gaps")}</h2>
        <p className="mt-2 text-sm text-mist">{t("today.gapsHint")}</p>
        {presented.gaps.length ? (
          <ul className="mt-4 space-y-4">
            {presented.gaps.map((gap) => (
              <GapRow
                key={gap.dimension}
                gap={gap}
                gapLabel={t("today.gaps")}
                closeLabel={t("today.closeIt")}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-celadon">{t("today.noGaps")}</p>
        )}
      </section>

      <div className="mt-10 space-y-4">
        <CollectButton idea={idea} match={presented} />
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href={`/ideas/${idea.slug}`} className="btn-ghost btn-block-mobile">
            {t("today.dossier")}
          </Link>
          <button
            type="button"
            className="btn-ghost btn-block-mobile"
            onClick={() => setState({ status: "edit-profile" })}
          >
            {t("today.updateProfile")}
          </button>
          <Link href="/collection" className="btn-ghost btn-block-mobile">
            {t("today.collection")}
          </Link>
        </div>
      </div>
    </article>
  );
}

function MatchRow({ point, matchedLabel }: { point: MatchPoint; matchedLabel: string }) {
  return (
    <li className="rounded-xl border border-celadon/25 bg-celadon/10 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-celadon">
        {matchedLabel} · {point.dimension}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foam">{point.detail}</p>
    </li>
  );
}

function GapRow({
  gap,
  gapLabel,
  closeLabel,
}: {
  gap: GapPoint;
  gapLabel: string;
  closeLabel: string;
}) {
  return (
    <li className="rounded-xl border border-copper/30 bg-copper/10 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-copper">
        {gapLabel} · {gap.dimension}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foam">{gap.detail}</p>
      <p className="mt-2 text-sm leading-relaxed text-mist">
        <span className="font-medium text-foam">{closeLabel} </span>
        {gap.closeGap}
      </p>
    </li>
  );
}
