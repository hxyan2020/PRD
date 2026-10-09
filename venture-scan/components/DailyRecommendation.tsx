"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countryFlag, formatMoney, strategyLabel } from "@/lib/format";
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
        const res = await fetch("/api/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load today's pick");
        if (cancelled) return;
        setState({
          status: "ready",
          day: data.day,
          idea: data.recommendation.idea,
          match: data.recommendation.match,
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
        Choosing today's best-matched idea…
      </div>
    );
  }

  if (state.status === "need-profile") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
          Today's recommendation
        </p>
        <h1 className="mt-3 font-display text-4xl text-foam">Build a profile first</h1>
        <p className="mt-4 text-sm leading-relaxed text-mist">
          The daily pick needs your skills, major, current business, and interested domains so we
          can score every idea and show matches vs gaps.
        </p>
        <Link href="/match" className="btn-primary mt-8 inline-flex">
          Open match chatbot
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
        Today's recommendation · {day}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl text-foam sm:text-5xl">{idea.name}</h1>
        <span className="rounded-full border border-celadon/40 bg-celadon/15 px-3 py-1 font-mono text-sm text-celadon">
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
        <h2 className="font-display text-2xl text-foam">Where you matched</h2>
        {match.matched.length ? (
          <ul className="mt-4 space-y-3">
            {match.matched.map((point) => (
              <MatchRow key={point.dimension} point={point} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mist">
            No strong matches yet — close the gaps below to raise today's score.
          </p>
        )}
      </section>

      <section className="mt-10 animate-rise [animation-delay:80ms]">
        <h2 className="font-display text-2xl text-foam">Where the gap is</h2>
        <p className="mt-2 text-sm text-mist">
          Each gap includes a concrete action to close it.
        </p>
        {match.gaps.length ? (
          <ul className="mt-4 space-y-4">
            {match.gaps.map((gap) => (
              <GapRow key={gap.dimension} gap={gap} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-celadon">
            No material gaps on the scored dimensions — you're tightly aligned today.
          </p>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/ideas/${idea.slug}`} className="btn-primary">
          Open full dossier
        </Link>
        <Link href="/match" className="btn-ghost">
          Update profile
        </Link>
        <Link href="/#ideas" className="btn-ghost">
          All ideas
        </Link>
      </div>
    </article>
  );
}

function MatchRow({ point }: { point: MatchPoint }) {
  return (
    <li className="rounded-xl border border-celadon/25 bg-celadon/10 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-celadon">
        Matched · {point.dimension}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foam">{point.detail}</p>
    </li>
  );
}

function GapRow({ gap }: { gap: GapPoint }) {
  return (
    <li className="rounded-xl border border-copper/30 bg-copper/10 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-copper">
        Gap · {gap.dimension}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foam">{gap.detail}</p>
      <p className="mt-2 text-sm leading-relaxed text-mist">
        <span className="font-medium text-foam">Close it: </span>
        {gap.closeGap}
      </p>
    </li>
  );
}
