"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CollectButton } from "@/components/CollectButton";
import { fetchDaily } from "@/lib/client-api";
import { countryFlag, formatMoney, strategyLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { isProfileReady, loadProfileFromStorage } from "@/lib/profile";
import type { GapPoint, IdeaMatch, MatchPoint, StartupIdea } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "need-profile" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      day: string;
      idea: StartupIdea;
      match: IdeaMatch;
    };

export function DailyRecommendation() {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const profile = loadProfileFromStorage();
    if (!profile || !isProfileReady(profile)) {
      setState({ status: "need-profile" });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const daily = await fetchDaily(profile);
        if (!daily) throw new Error("Could not load today's pick");
        if (cancelled) return;
        setState({
          status: "ready",
          day: daily.day,
          idea: daily.idea,
          match: daily.match,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Could not load today's pick",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        {t("today.loading")}
      </div>
    );
  }

  if (state.status === "need-profile") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
          {t("today.kicker")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-foam">{t("today.needTitle")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-mist">{t("today.needBody")}</p>
        <Link href="/match" className="btn-primary mt-8 inline-flex">
          {t("today.openMatch")}
        </Link>
      </div>
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

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
        {t("today.dateLabel", { day })}
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl text-foam sm:text-5xl">{idea.name}</h1>
        <span className="w-fit rounded-full border border-celadon/40 bg-celadon/15 px-3 py-1 font-mono text-sm text-celadon">
          {match.score}% match
        </span>
      </div>
      <p className="mt-4 text-base leading-relaxed text-mist">{idea.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist">
        <span>
          {countryFlag(idea.teamCountry)} {idea.teamCountry}
          {idea.teamCity ? ` · ${idea.teamCity}` : ""}
        </span>
        <span>
          {idea.industry} / {idea.sector}
        </span>
        <span>
          {idea.fundraisingSecured
            ? `Funded · ${formatMoney(idea.fundingAmountUsd)}`
            : "Fundraising open"}
        </span>
        <span>Play: {strategyLabel(idea.goForward.strategy)}</span>
      </div>

      <section className="mt-10 animate-rise">
        <h2 className="font-display text-2xl text-foam">{t("today.matched")}</h2>
        {match.matched.length ? (
          <ul className="mt-4 space-y-3">
            {match.matched.map((point) => (
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
        {match.gaps.length ? (
          <ul className="mt-4 space-y-4">
            {match.gaps.map((gap) => (
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
        <CollectButton idea={idea} match={match} />
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href={`/ideas/${idea.slug}`} className="btn-ghost btn-block-mobile">
            {t("today.dossier")}
          </Link>
          <Link href="/match" className="btn-ghost btn-block-mobile">
            {t("today.updateProfile")}
          </Link>
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
