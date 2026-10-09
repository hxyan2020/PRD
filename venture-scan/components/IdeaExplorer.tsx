"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { countryFlag, formatMoney, strategyLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { isProfileReady, loadProfileFromStorage } from "@/lib/profile";
import type { IdeaMatch, StartupIdea } from "@/lib/types";

type Meta = {
  industries: string[];
  sectors: string[];
  countries: string[];
};

export function IdeaExplorer({
  initialIdeas,
  meta,
}: {
  initialIdeas: StartupIdea[];
  meta: Meta;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [fundraising, setFundraising] = useState<"all" | "yes" | "no">("all");
  const [sortByMatch, setSortByMatch] = useState(false);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [matches, setMatches] = useState<Record<string, IdeaMatch>>({});
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const profile = loadProfileFromStorage();
    if (!profile || !isProfileReady(profile)) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const map: Record<string, IdeaMatch> = {};
        for (const m of data.matches as IdeaMatch[]) map[m.slug] = m;
        if (!cancelled) {
          setMatches(map);
          setSortByMatch(true);
        }
      } catch {
        // Profile matching is optional on the ledger.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = ideas.filter((idea) => {
      if (industry && idea.industry !== industry) return false;
      if (sector && idea.sector !== sector) return false;
      if (country && idea.teamCountry !== country) return false;
      if (fundraising === "yes" && !idea.fundraisingSecured) return false;
      if (fundraising === "no" && idea.fundraisingSecured) return false;
      if (q) {
        const needle = q.toLowerCase();
        const hay = [
          idea.name,
          idea.description,
          idea.industry,
          idea.sector,
          idea.teamCountry,
          ...idea.tags,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    if (sortByMatch && Object.keys(matches).length) {
      rows = [...rows].sort(
        (a, b) => (matches[b.slug]?.score ?? -1) - (matches[a.slug]?.score ?? -1),
      );
    }
    return rows;
  }, [ideas, q, industry, sector, country, fundraising, sortByMatch, matches]);

  async function rescan() {
    setScanning(true);
    setScanNote(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      const listRes = await fetch("/api/ideas");
      const listData = await listRes.json();
      startTransition(() => {
        setIdeas(listData.ideas);
        setScanNote(
          `Scan complete · ${data.inserted} new · ${data.updated} refreshed · ${data.total} total`,
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
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-foam sm:text-4xl">{t("ledger.title")}</h2>
          <p className="mt-2 max-w-xl text-sm text-mist">
            {t("ledger.body")}
            {hasMatches ? t("ledger.sorted") : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!hasMatches ? (
            <Link href="/match" className="btn-primary shrink-0">
              {t("ledger.buildProfile")}
            </Link>
          ) : (
            <button
              type="button"
              className="btn-ghost shrink-0"
              onClick={() => setSortByMatch((v) => !v)}
            >
              {sortByMatch ? t("ledger.sortMatch") : t("ledger.sortRecent")}
            </button>
          )}
          <button
            type="button"
            className="btn-ghost shrink-0"
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className="field lg:col-span-2"
          placeholder={t("ledger.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("ledger.search")}
        />
        <select
          className="field"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          aria-label={t("ledger.allIndustries")}
        >
          <option value="">{t("ledger.allIndustries")}</option>
          {meta.industries.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label={t("ledger.allCountries")}
        >
          <option value="">{t("ledger.allCountries")}</option>
          {meta.countries.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
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
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="field max-w-full sm:max-w-xs"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          aria-label={t("ledger.allSectors")}
        >
          <option value="">{t("ledger.allSectors")}</option>
          {meta.sectors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <p className="self-center font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
          {pending ? "…" : t("ledger.shown", { count: filtered.length })}
        </p>
      </div>

      <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
        {filtered.map((idea, idx) => {
          const match = matches[idea.slug];
          return (
            <li
              key={idea.id}
              className="animate-rise group py-6"
              style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
            >
              <Link href={`/ideas/${idea.slug}`} className="block outline-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-2xl text-foam transition group-hover:text-white">
                        {idea.name}
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
                      {idea.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist/90">
                      <span>
                        {countryFlag(idea.teamCountry)} {idea.teamCountry}
                        {idea.teamCity ? ` · ${idea.teamCity}` : ""}
                      </span>
                      <span>{idea.teamSize} people</span>
                      <span>
                        {idea.industry} / {idea.sector}
                      </span>
                      {idea.fundraisingSecured ? (
                        <span>{formatMoney(idea.fundingAmountUsd)}</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 max-w-xs text-xs leading-relaxed text-mist sm:text-right">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-celadon">
                      {t("ledger.goForward")}
                    </span>
                    <br />
                    {strategyLabel(idea.goForward.strategy)}
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
