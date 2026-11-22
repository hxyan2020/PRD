"use client";

import { useEffect, useMemo, useState } from "react";
import { LpLogo } from "@/components/LpLogo";
import { RegionFlags } from "@/components/RegionFlags";
import { useI18n } from "@/lib/i18n/context";
import {
  formatLpCompactMeta,
  labelCategory,
  labelCost,
  localizedLpLists,
} from "@/lib/i18n/lp-display";
import type { LpRecord } from "@/lib/types";

type Filter = "all" | "used" | "not";

export function RepositoryDesk() {
  const { t, locale } = useI18n();
  const [lps, setLps] = useState<LpRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<LpRecord>>({});

  async function load() {
    const res = await fetch("/api/lps");
    const data = (await res.json()) as { lps: LpRecord[] };
    setLps(data.lps);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    if (filter === "used") return lps.filter((l) => l.usedByVantage);
    if (filter === "not") return lps.filter((l) => !l.usedByVantage);
    return lps;
  }, [lps, filter]);

  async function save() {
    if (!editing) return;
    await fetch("/api/lps", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: editing, ...draft }),
    });
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/lps?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  function startEdit(lp: LpRecord) {
    setEditing(lp.id);
    setDraft(lp);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">{t("repo.title")}</h1>
          <p className="mt-2 text-sm text-mist sm:text-base">{t("repo.sub")}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(
            [
              ["all", t("repo.filter.all")],
              ["used", t("repo.filter.used")],
              ["not", t("repo.filter.not")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`touch-target shrink-0 rounded-lg px-3 text-sm ${
                filter === key ? "bg-navy text-foam" : "border border-line bg-white"
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {visible.map((lp) => (
          <article key={lp.id} className="panel p-4">
            {editing === lp.id ? (
              <div className="space-y-3">
                <input
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  value={draft.name ?? lp.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.usedByVantage)}
                    onChange={(e) => setDraft((d) => ({ ...d, usedByVantage: e.target.checked }))}
                  />
                  Vantage
                </label>
                <select
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  value={draft.category ?? lp.category}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, category: e.target.value as LpRecord["category"] }))
                  }
                >
                  <option value="traditional">traditional</option>
                  <option value="crypto">crypto</option>
                  <option value="hybrid">hybrid</option>
                  <option value="technology">technology</option>
                </select>
                <select
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  value={draft.hours ?? lp.hours}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, hours: e.target.value as LpRecord["hours"] }))
                  }
                >
                  <option value="24/5">24/5</option>
                  <option value="24/7">24/7</option>
                  <option value="mixed">mixed</option>
                  <option value="market-hours">market-hours</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="touch-target rounded-lg bg-teal text-sm text-white"
                    onClick={() => void save()}
                  >
                    {t("kb.save")}
                  </button>
                  <button
                    type="button"
                    className="touch-target rounded-lg border border-line text-sm"
                    onClick={() => setEditing(null)}
                  >
                    {t("kb.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <LpLogo lp={lp} size="md" />
                    <div className="min-w-0">
                    <h2 className="font-semibold text-navy">{lp.name}</h2>
                    <p className="mt-1 text-xs text-mist">
                      {formatLpCompactMeta(lp, locale)} · {lp.pricingQuality}/5
                    </p>
                    <p className="mt-1 text-xs text-mist">
                      {localizedLpLists(lp, locale).regions.join(", ")}
                    </p>
                    <RegionFlags
                      className="mt-2"
                      slug={lp.slug}
                      optimalRegions={lp.optimalRegions}
                      size="sm"
                    />
                    <p className="mt-1 text-xs text-mist">{lp.products.slice(0, 5).join(", ")}</p>
                    </div>
                  </div>
                  <span
                    className={`chip shrink-0 ${lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                  >
                    {lp.usedByVantage ? t("yes") : t("no")}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="touch-target rounded-lg border border-line text-sm"
                    onClick={() => startEdit(lp)}
                  >
                    {t("kb.edit")}
                  </button>
                  <button
                    type="button"
                    className="touch-target rounded-lg border border-amber/40 text-sm text-amber"
                    onClick={() => void remove(lp.id)}
                  >
                    {t("repo.delete")}
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className="panel hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate/50 text-xs uppercase text-mist">
            <tr>
              <th className="px-3 py-2">{t("col.name")}</th>
              <th className="px-3 py-2">{t("col.vantage")}</th>
              <th className="px-3 py-2">{t("col.category")}</th>
              <th className="px-3 py-2">{t("col.hours")}</th>
              <th className="px-3 py-2">{t("col.cost")}</th>
              <th className="px-3 py-2">{t("col.pricing")}</th>
              <th className="px-3 py-2">{t("col.regions")}</th>
              <th className="px-3 py-2">{t("col.optimalRegions")}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((lp) => (
              <tr key={lp.id} className="border-t border-line/70 align-top">
                <td className="px-3 py-3 font-semibold text-navy">
                  <div className="flex items-start gap-2">
                    <LpLogo lp={lp} size="sm" className="mt-0.5" />
                    <div className="min-w-0">
                      {editing === lp.id ? (
                        <input
                          className="w-full rounded border border-line px-2 py-1"
                          value={draft.name ?? lp.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        />
                      ) : (
                        lp.name
                      )}
                      <div className="mt-1 text-xs font-normal text-mist">
                        {lp.products.slice(0, 4).join(", ")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {editing === lp.id ? (
                    <input
                      type="checkbox"
                      checked={Boolean(draft.usedByVantage)}
                      onChange={(e) => setDraft((d) => ({ ...d, usedByVantage: e.target.checked }))}
                    />
                  ) : (
                    <span
                      className={`chip ${lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                    >
                      {lp.usedByVantage ? t("yes") : t("no")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {editing === lp.id ? (
                    <select
                      className="rounded border border-line px-2 py-1"
                      value={draft.category ?? lp.category}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          category: e.target.value as LpRecord["category"],
                        }))
                      }
                    >
                      <option value="traditional">traditional</option>
                      <option value="crypto">crypto</option>
                      <option value="hybrid">hybrid</option>
                      <option value="technology">technology</option>
                    </select>
                  ) : (
                    labelCategory(locale, lp.category)
                  )}
                </td>
                <td className="px-3 py-3">
                  {editing === lp.id ? (
                    <select
                      className="rounded border border-line px-2 py-1"
                      value={draft.hours ?? lp.hours}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, hours: e.target.value as LpRecord["hours"] }))
                      }
                    >
                      <option value="24/5">24/5</option>
                      <option value="24/7">24/7</option>
                      <option value="mixed">mixed</option>
                      <option value="market-hours">market-hours</option>
                    </select>
                  ) : (
                    lp.hours
                  )}
                </td>
                <td className="px-3 py-3">{labelCost(locale, lp.costTier)}</td>
                <td className="px-3 py-3">{lp.pricingQuality}/5</td>
                <td className="max-w-[200px] px-3 py-3 text-xs">
                  {localizedLpLists(lp, locale).regions.join(", ")}
                </td>
                <td className="px-3 py-3">
                  <RegionFlags
                    slug={lp.slug}
                    optimalRegions={lp.optimalRegions}
                    size="sm"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  {editing === lp.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-teal px-2 py-1 text-xs text-white"
                        onClick={() => void save()}
                      >
                        {t("kb.save")}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-line px-2 py-1 text-xs"
                        onClick={() => setEditing(null)}
                      >
                        {t("kb.cancel")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded border border-line px-2 py-1 text-xs"
                        onClick={() => startEdit(lp)}
                      >
                        {t("kb.edit")}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-amber/40 px-2 py-1 text-xs text-amber"
                        onClick={() => void remove(lp.id)}
                      >
                        {t("repo.delete")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-mist">
        {visible.length} / {lps.length} · Vantage {lps.filter((l) => l.usedByVantage).length} ·
        candidates {lps.filter((l) => !l.usedByVantage).length}
      </p>
    </div>
  );
}
