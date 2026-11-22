"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { LpRecord } from "@/lib/types";

type Filter = "all" | "used" | "not";

export function RepositoryDesk() {
  const { t } = useI18n();
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-navy">{t("repo.title")}</h1>
          <p className="mt-2 text-mist">{t("repo.sub")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === key ? "bg-navy text-foam" : "bg-white border border-line"
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="panel overflow-x-auto">
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
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((lp) => (
              <tr key={lp.id} className="border-t border-line/70 align-top">
                <td className="px-3 py-3 font-semibold text-navy">
                  {editing === lp.id ? (
                    <input
                      className="w-full rounded border border-line px-2 py-1"
                      value={draft.name ?? lp.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  ) : (
                    lp.name
                  )}
                  <div className="mt-1 text-xs font-normal text-mist">{lp.products.slice(0, 4).join(", ")}</div>
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
                    lp.category
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
                <td className="px-3 py-3">{lp.costTier}</td>
                <td className="px-3 py-3">{lp.pricingQuality}/5</td>
                <td className="max-w-[200px] px-3 py-3 text-xs">{lp.regions.join(", ")}</td>
                <td className="px-3 py-3 whitespace-nowrap">
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
                        onClick={() => {
                          setEditing(lp.id);
                          setDraft(lp);
                        }}
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
