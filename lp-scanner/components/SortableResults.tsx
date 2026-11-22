"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
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
}: {
  rankings: RankedLp[];
  researchedAt: string;
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
    { col: "regions", label: t("col.regions") },
    { col: "latency", label: t("col.latency") },
    { col: "score", label: t("col.score") },
  ];

  return (
    <section className="panel animate-rise overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-display text-2xl text-navy">{t("home.results")}</h2>
          <p className="text-xs text-mist">
            {t("home.liveAt")}{" "}
            {new Date(researchedAt).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-SG", {
              timeZone: "Asia/Singapore",
            })}{" "}
            (SGT)
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
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
                <td className="px-3 py-2 font-semibold text-navy">{r.lp.name}</td>
                <td className="px-3 py-2">
                  <span
                    className={`chip ${r.lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                  >
                    {r.lp.usedByVantage ? t("yes") : t("no")}
                  </span>
                </td>
                <td className="px-3 py-2">{r.lp.category}</td>
                <td className="px-3 py-2">{r.lp.hours}</td>
                <td className="px-3 py-2">{r.lp.costTier}</td>
                <td className="px-3 py-2">{r.lp.pricingQuality}/5</td>
                <td className="max-w-[180px] truncate px-3 py-2">{r.columns.regions}</td>
                <td className="px-3 py-2">{r.lp.latencyProfile}</td>
                <td className="px-3 py-2 font-semibold text-teal">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows
        .filter((r) => r.lp.id === openId)
        .map((r) => (
          <div key={r.lp.id} className="border-t border-line bg-foam/80 px-4 py-4 sm:px-5">
            <h3 className="font-display text-xl text-navy">{r.lp.name}</h3>
            <p className="mt-1 text-sm text-mist">
              {locale === "zh-CN" ? r.lp.kbBodyZh.slice(0, 220) : r.lp.kbBodyEn.slice(0, 220)}…
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Block title={t("detail.reasons")} items={r.reasons} />
              <Block title={t("detail.live")} items={r.liveNotes} />
              <Block title={t("detail.strengths")} items={r.lp.strengths} />
              <Block title={t("detail.weaknesses")} items={r.lp.weaknesses} />
            </div>
          </div>
        ))}
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
