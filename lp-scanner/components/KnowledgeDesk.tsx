"use client";

import { useEffect, useState } from "react";
import { LpLogo } from "@/components/LpLogo";
import { useI18n } from "@/lib/i18n/context";
import {
  formatLpMeta,
  labelCategory,
  labelCost,
  labelVantageBadge,
  localizeProducts,
  localizedLpLists,
} from "@/lib/i18n/lp-display";
import type { LpRecord } from "@/lib/types";

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function KnowledgeDesk() {
  const { t, locale } = useI18n();
  const [lps, setLps] = useState<LpRecord[]>([]);
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

  async function save() {
    if (!editing) return;
    await fetch("/api/lps", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: editing, ...draft }),
    });
    setEditing(null);
    setDraft({});
    await load();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl text-navy sm:text-4xl">{t("kb.title")}</h1>
        <p className="mt-2 text-sm text-mist sm:text-base">{t("kb.sub")}</p>
      </header>
      <div className="space-y-4">
        {lps.map((lp) => {
          const isEdit = editing === lp.id;
          const lists = localizedLpLists(lp, locale);
          return (
            <article key={lp.id} className="panel animate-rise p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <LpLogo lp={lp} size="md" />
                    <h2 className="font-display text-xl text-navy sm:text-2xl">{lp.name}</h2>
                    <span
                      className={`chip ${lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                    >
                      {labelVantageBadge(locale, lp.usedByVantage)}
                    </span>
                    <span className="chip bg-slate/70 text-navy-2">
                      {labelCategory(locale, lp.category)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-mist">{formatLpMeta(lp, locale)}</p>
                </div>
                {!isEdit ? (
                  <button
                    type="button"
                    className="touch-target w-full rounded-lg border border-line px-3 text-sm hover:border-teal sm:w-auto"
                    onClick={() => {
                      setEditing(lp.id);
                      setDraft({
                        kbBodyEn: lp.kbBodyEn,
                        kbBodyZh: lp.kbBodyZh,
                        notes: lp.notes,
                        bestFor: lp.bestFor,
                        bestForZh: lists.bestFor,
                        strengths: lp.strengths,
                        strengthsZh: lists.strengths,
                        weaknesses: lp.weaknesses,
                        weaknessesZh: lists.weaknesses,
                        products: lp.products,
                        costTier: lp.costTier,
                        pricingQuality: lp.pricingQuality,
                        hours: lp.hours,
                        usedByVantage: lp.usedByVantage,
                      });
                    }}
                  >
                    {t("kb.edit")}
                  </button>
                ) : (
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <button
                      type="button"
                      className="touch-target rounded-lg bg-teal px-3 text-sm text-white"
                      onClick={() => void save()}
                    >
                      {t("kb.save")}
                    </button>
                    <button
                      type="button"
                      className="touch-target rounded-lg border border-line px-3 text-sm"
                      onClick={() => {
                        setEditing(null);
                        setDraft({});
                      }}
                    >
                      {t("kb.cancel")}
                    </button>
                  </div>
                )}
              </div>

              {!isEdit ? (
                <>
                  <p className="mt-4 text-sm leading-relaxed text-navy-2">
                    {locale === "zh-CN" ? lp.kbBodyZh : lp.kbBodyEn}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Mini title={t("detail.bestFor")} items={lists.bestFor} />
                    <Mini title={t("detail.strengths")} items={lists.strengths} />
                    <Mini
                      title={t("detail.products")}
                      items={localizeProducts(lp.products, locale)}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-4 grid gap-3">
                  <label className="text-xs font-semibold text-teal">
                    KB (EN)
                    <textarea
                      className="mt-1 w-full rounded-lg border border-line p-3 text-sm"
                      rows={4}
                      value={draft.kbBodyEn ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, kbBodyEn: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-semibold text-teal">
                    KB (中文)
                    <textarea
                      className="mt-1 w-full rounded-lg border border-line p-3 text-sm"
                      rows={4}
                      value={draft.kbBodyZh ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, kbBodyZh: e.target.value }))}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.bestFor")}
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.bestFor ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, bestFor: splitCsv(e.target.value) }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.bestForZh")}
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.bestForZh ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, bestForZh: splitCsv(e.target.value) }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.strengths")}
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.strengths ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, strengths: splitCsv(e.target.value) }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.strengthsZh")}
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.strengthsZh ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, strengthsZh: splitCsv(e.target.value) }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.products")}
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.products ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, products: splitCsv(e.target.value) }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.cost")}
                      <select
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={draft.costTier ?? "negotiated"}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            costTier: e.target.value as LpRecord["costTier"],
                          }))
                        }
                      >
                        {(["low", "medium", "high", "negotiated"] as const).map((c) => (
                          <option key={c} value={c}>
                            {labelCost(locale, c)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      {t("kb.edit.pricing")}
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={draft.pricingQuality ?? 3}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            pricingQuality: Number(e.target.value) as LpRecord["pricingQuality"],
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-navy">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.usedByVantage)}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, usedByVantage: e.target.checked }))
                        }
                      />
                      {t("kb.edit.used")}
                    </label>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">{title}</p>
      <ul className="mt-1 list-disc pl-4 text-sm text-navy-2">
        {items.slice(0, 6).map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
