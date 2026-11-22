"use client";

import { useMemo, useState } from "react";
import { LpLogo } from "@/components/LpLogo";
import { RegionFlags } from "@/components/RegionFlags";
import { useI18n } from "@/lib/i18n/context";
import {
  formatLpCompactMeta,
  labelCategory,
  labelCost,
  labelLatency,
  localizedLpLists,
} from "@/lib/i18n/lp-display";
import type { RankedLp } from "@/lib/types";

type Col =
  | "rank"
  | "name"
  | "vantage"
  | "category"
  | "hours"
  | "cost"
  | "pricing"
  | "regions"
  | "latency"
  | "score";

export function SortableResults({
  rankings,
  researchedAt,
  product,
  onRunProductQuality,
  onRunLpQuality,
}: {
  rankings: RankedLp[];
  researchedAt: string;
  product?: string;
  onRunProductQuality?: () => void;
  onRunLpQuality?: (lpId: string, name: string) => void;
}) {
  const { t, locale } = useI18n();
  const [sort, setSort] = useState<{ col: Col; dir: "asc" | "desc" }>({
    col: "score",
    dir: "desc",
  });
  const [openId, setOpenId] = useState<string | null>(rankings[0]?.lp.id ?? null);

  const rows = useMemo(() => {
    const copy = [...rankings];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = value(a, sort.col);
      const bv = value(b, sort.col);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return copy;
  }, [rankings, sort]);

  function toggle(col: Col) {
    setSort((s) =>
      s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: col === "name" ? "asc" : "desc" },
    );
  }

  const headers: { col: Col; label: string }[] = [
    { col: "rank", label: t("col.rank") },
    { col: "name", label: t("col.name") },
    { col: "vantage", label: t("col.vantage") },
    { col: "category", label: t("col.category") },
    { col: "hours", label: t("col.hours") },
    { col: "cost", label: t("col.cost") },
    { col: "pricing", label: t("col.pricing") },
    { col: "regions", label: t("col.optimalRegions") },
    { col: "latency", label: t("col.latency") },
    { col: "score", label: t("col.score") },
  ];

  const mobileSortCols: Col[] = ["score", "pricing", "cost", "hours", "name"];

  return (
    <section className="panel animate-rise overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-navy sm:text-2xl">{t("home.results")}</h2>
          <p className="text-xs text-mist">
            {t("home.liveAt")}{" "}
            {new Date(researchedAt).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-SG", {
              timeZone: "Asia/Singapore",
            })}{" "}
            (SGT)
            {product ? ` · ${product}` : ""}
          </p>
        </div>
        {onRunProductQuality && (
          <button
            type="button"
            onClick={onRunProductQuality}
            className="touch-target w-full rounded-lg bg-navy px-3 py-2 text-sm font-medium text-foam hover:bg-teal sm:w-auto"
          >
            {t("quality.runForProduct")}
          </button>
        )}
      </div>

      {/* Mobile sort chips */}
      <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
        {mobileSortCols.map((col) => {
          const label = headers.find((h) => h.col === col)?.label ?? col;
          const active = sort.col === col;
          return (
            <button
              key={col}
              type="button"
              onClick={() => toggle(col)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                active ? "bg-navy text-foam" : "bg-slate/50 text-navy-2"
              }`}
            >
              {label}
              {active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((r) => {
          const open = openId === r.lp.id;
          return (
            <article
              key={r.lp.id}
              className="rounded-xl border border-line bg-foam/90 p-3"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => setOpenId(open ? null : r.lp.id)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-mist">#{r.rank}</span>
                    <LpLogo lp={r.lp} size="sm" />
                    <span className="font-semibold text-navy">{r.lp.name}</span>
                    <span
                      className={`chip ${r.lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                    >
                      {r.lp.usedByVantage ? t("yes") : t("no")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-mist">{formatLpCompactMeta(r.lp, locale)}</p>
                  <RegionFlags
                    className="mt-1.5"
                    slug={r.lp.slug}
                    optimalRegions={r.lp.optimalRegions}
                    size="sm"
                  />
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-teal">{r.score}</p>
                  <p className="text-xs text-mist">{r.lp.pricingQuality}/5</p>
                </div>
              </button>
              {open && (
                <div className="mt-3 border-t border-line/70 pt-3">
                  <p className="text-sm text-mist">
                    {locale === "zh-CN" ? r.lp.kbBodyZh.slice(0, 180) : r.lp.kbBodyEn.slice(0, 180)}…
                  </p>
                  <div className="mt-3 grid gap-3">
                    <Block title={t("detail.reasons")} items={r.reasons} />
                    <Block title={t("detail.live")} items={r.liveNotes} />
                    <Block
                      title={t("detail.strengths")}
                      items={localizedLpLists(r.lp, locale).strengths}
                    />
                    <Block
                      title={t("detail.weaknesses")}
                      items={localizedLpLists(r.lp, locale).weaknesses}
                    />
                  </div>
                  {onRunLpQuality && (
                    <button
                      type="button"
                      className="touch-target mt-3 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-navy hover:border-teal"
                      onClick={() => onRunLpQuality(r.lp.id, r.lp.name)}
                    >
                      {t("quality.runForLp")}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="table-scroll hidden md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate/50 text-xs uppercase tracking-wide text-mist">
            <tr>
              {headers.map((h) => (
                <th key={h.col} className="px-3 py-2 font-medium">
                  <button type="button" className="hover:text-teal" onClick={() => toggle(h.col)}>
                    {h.label}
                    {sort.col === h.col ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.lp.id}
                className="cursor-pointer border-t border-line/70 hover:bg-teal-soft/30"
                onClick={() => setOpenId(openId === r.lp.id ? null : r.lp.id)}
              >
                <td className="px-3 py-2 font-mono text-xs">{r.rank}</td>
                <td className="px-3 py-2 font-semibold text-navy">
                  <span className="inline-flex items-center gap-2">
                    <LpLogo lp={r.lp} size="sm" />
                    {r.lp.name}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`chip ${r.lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                  >
                    {r.lp.usedByVantage ? t("yes") : t("no")}
                  </span>
                </td>
                <td className="px-3 py-2">{labelCategory(locale, r.lp.category)}</td>
                <td className="px-3 py-2">{r.lp.hours}</td>
                <td className="px-3 py-2">{labelCost(locale, r.lp.costTier)}</td>
                <td className="px-3 py-2">{r.lp.pricingQuality}/5</td>
                <td className="max-w-[220px] px-3 py-2">
                  <RegionFlags
                    slug={r.lp.slug}
                    optimalRegions={r.lp.optimalRegions}
                    size="sm"
                  />
                </td>
                <td className="px-3 py-2">{labelLatency(locale, r.lp.latencyProfile)}</td>
                <td className="px-3 py-2 font-semibold text-teal">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hidden md:block">
        {rows
          .filter((r) => r.lp.id === openId)
          .map((r) => (
            <div key={r.lp.id} className="border-t border-line bg-foam/80 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-navy">{r.lp.name}</h3>
                  <RegionFlags
                    className="mt-2"
                    slug={r.lp.slug}
                    optimalRegions={r.lp.optimalRegions}
                    showLabel
                    size="sm"
                  />
                  <p className="mt-1 text-sm text-mist">
                    {locale === "zh-CN" ? r.lp.kbBodyZh.slice(0, 220) : r.lp.kbBodyEn.slice(0, 220)}…
                  </p>
                </div>
                {onRunLpQuality && (
                  <button
                    type="button"
                    className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-navy hover:border-teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunLpQuality(r.lp.id, r.lp.name);
                    }}
                  >
                    {t("quality.runForLp")}
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Block title={t("detail.reasons")} items={r.reasons} />
                <Block title={t("detail.live")} items={r.liveNotes} />
                <Block
                  title={t("detail.strengths")}
                  items={localizedLpLists(r.lp, locale).strengths}
                />
                <Block
                  title={t("detail.weaknesses")}
                  items={localizedLpLists(r.lp, locale).weaknesses}
                />
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-2">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function value(r: RankedLp, col: Col): string | number | boolean {
  switch (col) {
    case "rank":
      return r.rank;
    case "name":
      return r.lp.name;
    case "vantage":
      return r.lp.usedByVantage ? 1 : 0;
    case "category":
      return r.lp.category;
    case "hours":
      return r.lp.hours;
    case "cost":
      return r.lp.costTier;
    case "pricing":
      return r.lp.pricingQuality;
    case "regions":
      return r.columns.regions;
    case "latency":
      return r.lp.latencyProfile;
    case "score":
      return r.score;
  }
}
