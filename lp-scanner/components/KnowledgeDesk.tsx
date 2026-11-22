"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { LpRecord } from "@/lib/types";

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
        <h1 className="font-display text-4xl text-navy">{t("kb.title")}</h1>
        <p className="mt-2 text-mist">{t("kb.sub")}</p>
      </header>
      <div className="space-y-4">
        {lps.map((lp) => {
          const isEdit = editing === lp.id;
          return (
            <article key={lp.id} className="panel animate-rise p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl text-navy">{lp.name}</h2>
                    <span
                      className={`chip ${lp.usedByVantage ? "bg-teal-soft text-teal" : "bg-amber-soft text-amber"}`}
                    >
                      {lp.usedByVantage ? "Vantage" : "Candidate"}
                    </span>
                    <span className="chip bg-slate/70 text-navy-2">{lp.category}</span>
                  </div>
                  <p className="mt-1 text-xs text-mist">
                    {lp.regions.join(" · ")} · {lp.hours} · cost {lp.costTier} · pricing{" "}
                    {lp.pricingQuality}/5 · {lp.latencyProfile}
                  </p>
                </div>
                {!isEdit ? (
                  <button
                    type="button"
                    className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-teal"
                    onClick={() => {
                      setEditing(lp.id);
                      setDraft({
                        kbBodyEn: lp.kbBodyEn,
                        kbBodyZh: lp.kbBodyZh,
                        notes: lp.notes,
                        bestFor: lp.bestFor,
                        strengths: lp.strengths,
                        weaknesses: lp.weaknesses,
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-teal px-3 py-1.5 text-sm text-white"
                      onClick={() => void save()}
                    >
                      {t("kb.save")}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm"
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
                    <Mini title={t("detail.bestFor")} items={lp.bestFor} />
                    <Mini title={t("detail.strengths")} items={lp.strengths} />
                    <Mini title={t("detail.products")} items={lp.products} />
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
                      Best for (comma)
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.bestFor ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            bestFor: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      Products (comma)
                      <input
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                        value={(draft.products ?? []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            products: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      Cost tier
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
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                        <option value="negotiated">negotiated</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-teal">
                      Pricing quality
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
                      Used by Vantage
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
