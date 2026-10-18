"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { Flag } from "@/components/Flag";
import { FundingRoundPicker } from "@/components/FundingRoundPicker";
import { IndustryIcon } from "@/components/IndustryIcon";
import { IndustryPicker } from "@/components/IndustryPicker";
import { SectorIcon } from "@/components/SectorIcon";
import { SectorPicker } from "@/components/SectorPicker";
import { fetchIdeas, matchProfile, runScanClient } from "@/lib/client-api";
import { countryToFlagCode } from "@/lib/flag-codes";
import { formatMoney, strategyMessageKey } from "@/lib/format";
import { collectFundingStages } from "@/lib/funding-stages";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import { isProfileReady, loadProfileFromStorage } from "@/lib/profile";
import { rankByFundingSecured, rankByMatchScore } from "@/lib/rank-ideas";
import type { IdeaMatch, StartupIdea } from "@/lib/types";

type Meta = {
  industries: string[];
  sectors: string[];
  countries: string[];
  fundingRounds?: string[];
};

export function IdeaExplorer({
  initialIdeas,
  meta,
}: {
  initialIdeas: StartupIdea[];
  meta: Meta;
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [fundraising, setFundraising] = useState<"all" | "yes" | "no">("all");
  const [fundingRound, setFundingRound] = useState("");
  const [ideas, setIdeas] = useState(initialIdeas);
  const fundingRounds = useMemo(
    () => meta.fundingRounds ?? collectFundingStages(ideas),
    [meta.fundingRounds, ideas],
  );
  const [matches, setMatches] = useState<Record<string, IdeaMatch>>({});
  const [hasProfile, setHasProfile] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const profile = loadProfileFromStorage();
    if (!profile || !isProfileReady(profile)) {
      setHasProfile(false);
      return;
    }
    setHasProfile(true);
    let cancelled = false;
    void (async () => {
      try {
        const data = await matchProfile(profile);
        if (cancelled) return;
        const map: Record<string, IdeaMatch> = {};
        for (const m of data.matches) map[m.slug] = m;
        setMatches(map);
      } catch {
        // Profile matching is optional on the ledger.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const rows = ideas.filter((idea) => {
      if (industry && idea.industry !== industry) return false;
      if (sector && idea.sector !== sector) return false;
      if (country && idea.teamCountry !== country) return false;
      if (fundraising === "yes" && !idea.fundraisingSecured) return false;
      if (fundraising === "no" && idea.fundraisingSecured) return false;
      if (fundingRound && idea.fundingStage !== fundingRound) return false;
      if (q) {
        const needle = q.toLowerCase();
        const view = localizeIdea(idea, locale);
        const hay = [
          idea.name,
          idea.description,
          idea.industry,
          idea.sector,
          idea.teamCountry,
          ...idea.tags,
          view.name,
          view.description,
          view.industry,
          view.sector,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    if (hasProfile && Object.keys(matches).length) {
      return rankByMatchScore(rows, matches);
    }
    return rankByFundingSecured(rows);
  }, [ideas, q, industry, sector, country, fundraising, fundingRound, hasProfile, matches, locale]);

  async function rescan() {
    setScanning(true);
    setScanNote(null);
    try {
      const data = await runScanClient();
      const nextIdeas = await fetchIdeas();
      startTransition(() => {
        setIdeas(nextIdeas);
        setScanNote(
          data
            ? `Scan complete · ${data.inserted} new · ${data.updated} refreshed · ${data.total} total`
            : `Showing ${nextIdeas.length} ideas`,
        );
      });
    } catch {
      setScanNote("Scan failed — try again.");
    } finally {
      setScanning(false);
    }
  }

  const hasMatches = Object.keys(matches).length > 0;

  return (
    <section id="ideas" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-foam sm:text-4xl">{t("ledger.title")}</h2>
          <p className="mt-2 max-w-xl text-sm text-mist">
            {t("ledger.body")}
            {hasMatches ? t("ledger.sorted") : t("ledger.sortedFunding")}
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          {!hasMatches ? (
            <Link href="/today" className="btn-primary btn-block-mobile shrink-0">
              {t("ledger.buildProfile")}
            </Link>
          ) : null}
          <button
            type="button"
            className="btn-ghost btn-block-mobile shrink-0"
            onClick={rescan}
            disabled={scanning}
          >
            {scanning ? t("ledger.scanning") : t("ledger.scan")}
          </button>
        </div>
      </div>

      {scanNote ? (
        <p className="mt-3 font-mono text-xs text-celadon">{scanNote}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
        <input
          className="field sm:col-span-2 lg:col-span-2"
          placeholder={t("ledger.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("ledger.search")}
        />
        <IndustryPicker
          value={industry}
          industries={meta.industries}
          onChange={setIndustry}
        />
        <CountryPicker
          value={country}
          countries={meta.countries}
          onChange={setCountry}
        />
        <select
          className="field"
          value={fundraising}
          onChange={(e) => setFundraising(e.target.value as "all" | "yes" | "no")}
          aria-label={t("ledger.fundAll")}
        >
          <option value="all">{t("ledger.fundAll")}</option>
          <option value="yes">{t("ledger.fundYes")}</option>
          <option value="no">{t("ledger.fundNo")}</option>
        </select>
        <SectorPicker
          className="w-full lg:col-span-2"
          value={sector}
          sectors={meta.sectors}
          onChange={setSector}
        />
        <FundingRoundPicker
          className="w-full lg:col-span-2"
          value={fundingRound}
          rounds={fundingRounds}
          onChange={setFundingRound}
        />
        <p className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-mist sm:col-span-2 lg:col-span-1">
          {pending ? "…" : t("ledger.shown", { count: filtered.length })}
        </p>
      </div>

      <ul className="mt-8 divide-y divide-black/10 border-t border-black/10">
        {filtered.map((idea, idx) => {
          const match = matches[idea.slug];
          const view = localizeIdea(idea, locale);
          return (
            <li
              key={idea.id}
              className="animate-rise group py-5 sm:py-6"
              style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
            >
              <Link href={`/ideas/${idea.slug}`} className="block outline-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <h3 className="font-display text-[1.2rem] leading-snug text-foam transition group-hover:text-black sm:text-2xl">
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
                      {match ? (
                        <span className="rounded-full border border-celadon/30 bg-celadon/10 px-2 py-0.5 font-mono text-[10px] text-celadon">
                          {t("ledger.match", { score: match.score })}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-mist">
                      {view.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-mist/90">
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
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
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                        <IndustryIcon industry={idea.industry} className="shrink-0 text-celadon" />
                        <span className="truncate">{view.industry}</span>
                      </span>
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                        <SectorIcon sector={idea.sector} className="shrink-0 text-celadon" />
                        <span className="truncate">{view.sector}</span>
                      </span>
                      {idea.fundraisingSecured ? (
                        <span className="shrink-0">{formatMoney(idea.fundingAmountUsd)}</span>
                      ) : null}
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
        })}
        {filtered.length === 0 ? (
          <li className="py-12 text-center text-sm text-mist">{t("ledger.empty")}</li>
        ) : null}
      </ul>
    </section>
  );
}
