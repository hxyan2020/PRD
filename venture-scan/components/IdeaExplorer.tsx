"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { FundingRoundPicker } from "@/components/FundingRoundPicker";
import { HashScroll } from "@/components/HashScroll";
import { IdeaLedgerRow } from "@/components/IdeaLedgerRow";
import { IndustryPicker } from "@/components/IndustryPicker";
import { SectorPicker } from "@/components/SectorPicker";
import { isActiveIdea, isArchivedIdea } from "@/lib/archived-ideas";
import { fetchIdeas, matchProfile, runScanClient } from "@/lib/client-api";
import { collectFundingStages } from "@/lib/funding-stages";
import { TODAY_HASH, YESTERDAY_HASH, todaysIdeas } from "@/lib/idea-day";
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
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">(
    "all",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "",
  );

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => setHash(window.location.hash.replace(/^#/, ""));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const baseFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = ideas.filter((idea) => {
      if (industry && idea.industry !== industry) return false;
      if (sector && idea.sector !== sector) return false;
      if (country && idea.teamCountry !== country) return false;
      if (fundraising === "yes" && !idea.fundraisingSecured) return false;
      if (fundraising === "no" && idea.fundraisingSecured) return false;
      if (fundingRound && idea.fundingStage !== fundingRound) return false;
      if (needle) {
        const view = localizeIdea(idea, locale);
        const hay = [
          idea.slug,
          idea.name,
          idea.description,
          idea.industry,
          idea.sector,
          idea.teamCountry,
          idea.website,
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
  }, [
    ideas,
    q,
    industry,
    sector,
    country,
    fundraising,
    fundingRound,
    hasProfile,
    matches,
    locale,
  ]);

  const todayRows = useMemo(() => {
    if (statusFilter === "archived") return [];
    const todaySlugs = new Set(todaysIdeas(ideas).map((i) => i.slug));
    // Prefer the daily live cohort; if a status/search filter shrinks the set,
    // still only show cohort members that remain visible.
    const cohort = baseFiltered.filter((i) => todaySlugs.has(i.slug));
    return cohort.length ? cohort : baseFiltered.filter(isActiveIdea);
  }, [baseFiltered, statusFilter, ideas]);

  // Always include history so /ideas#yesterday has a stable scroll target.
  const yesterdayRows = useMemo(
    () => baseFiltered.filter(isArchivedIdea),
    [baseFiltered],
  );

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
  const activeFilterCount = [
    industry,
    sector,
    country,
    fundingRound,
    fundraising !== "all" ? fundraising : "",
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  function clearFilters() {
    setIndustry("");
    setSector("");
    setCountry("");
    setFundraising("all");
    setFundingRound("");
    setStatusFilter("all");
  }

  const shownCount = todayRows.length + yesterdayRows.length;

  return (
    <section id="ideas" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      {hash === YESTERDAY_HASH ? <HashScroll hash={YESTERDAY_HASH} /> : null}
      {hash === TODAY_HASH ? <HashScroll hash={TODAY_HASH} /> : null}

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

      <div className="mobile-filters mt-5 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
        <input
          className="field sm:col-span-2 lg:col-span-2"
          placeholder={t("ledger.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("ledger.search")}
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="button"
          className="btn-ghost min-h-11 justify-between sm:hidden"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <span>
            {filtersOpen
              ? t("ledger.hideFilters")
              : activeFilterCount > 0
                ? t("ledger.filtersActive", { count: activeFilterCount })
                : t("ledger.filters")}
          </span>
          <span aria-hidden className="font-mono text-xs text-mist">
            {filtersOpen ? "▴" : "▾"}
          </span>
        </button>
        <div className={`${filtersOpen ? "contents" : "hidden"} sm:contents`}>
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
          <select
            className="field"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "active" | "archived" | "all")
            }
            aria-label={t("ledger.statusAll")}
          >
            <option value="all">{t("ledger.statusAll")}</option>
            <option value="active">{t("ledger.statusActive")}</option>
            <option value="archived">{t("ledger.statusArchived")}</option>
          </select>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              className="btn-ghost min-h-11 sm:hidden"
              onClick={clearFilters}
            >
              {t("ledger.clearFilters")}
            </button>
          ) : null}
        </div>
        <div className="flex min-h-11 flex-col justify-center gap-1 sm:col-span-2 lg:col-span-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            {pending ? "…" : t("ledger.shown", { count: shownCount })}
          </p>
          <p className="text-[11px] leading-snug text-mist/80">{t("ledger.archiveHint")}</p>
        </div>
      </div>

      {statusFilter !== "archived" ? (
        <div id={TODAY_HASH} className="mt-10 scroll-mt-24">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
                {t("home.todayKicker")}
              </p>
              <h3 className="mt-1 font-display text-2xl text-foam">{t("home.todayTitle")}</h3>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
              {t("ledger.shown", { count: todayRows.length })}
            </p>
          </div>
          <ul className="divide-y divide-black/10 border-t border-black/10">
            {todayRows.map((idea, idx) => (
              <IdeaLedgerRow
                key={idea.id}
                idea={idea}
                match={matches[idea.slug]}
                index={idx}
              />
            ))}
            {todayRows.length === 0 ? (
              <li className="py-12 text-center text-sm text-mist">{t("ledger.empty")}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div id={YESTERDAY_HASH} className="mt-14 scroll-mt-24">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-t border-black/10 pt-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
              {t("home.historyKicker")}
            </p>
            <h3 className="mt-1 font-display text-2xl text-foam">
              {t("home.yesterdayTitle")}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-mist">{t("home.yesterdayBody")}</p>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            {t("ledger.shown", { count: yesterdayRows.length })}
          </p>
        </div>
        <ul className="divide-y divide-black/10 border-t border-black/10">
          {yesterdayRows.map((idea, idx) => (
            <IdeaLedgerRow
              key={idea.id}
              idea={idea}
              match={matches[idea.slug]}
              index={idx}
            />
          ))}
          {yesterdayRows.length === 0 ? (
            <li className="py-12 text-center text-sm text-mist">{t("ledger.empty")}</li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
