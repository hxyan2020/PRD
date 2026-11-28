"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { QualityMetricsScorecard as Scorecard } from "@/lib/quality-metrics-scorecard";
import type { ScoreBand } from "@/lib/quality-research";

function bandClass(band: ScoreBand): string {
  if (band === "green") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (band === "yellow") return "bg-amber-soft text-amber border-amber/40";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

function bandBar(band: ScoreBand): string {
  if (band === "green") return "bg-emerald-600";
  if (band === "yellow") return "bg-amber";
  return "bg-rose-600";
}

export function QualityMetricsScorecardPanel({ scorecard }: { scorecard: Scorecard }) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-navy/15 bg-white/90 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            {t("quality.metrics")}
          </p>
          <h3 className="mt-1 font-display text-xl text-navy">{scorecard.title}</h3>
          <p className="mt-1 text-sm text-mist">{scorecard.subtitle}</p>
        </div>
        <div className="text-right">
          <p
            className={`font-display text-2xl ${
              scorecard.weightedBand === "green"
                ? "text-emerald-700"
                : scorecard.weightedBand === "yellow"
                  ? "text-amber"
                  : "text-rose-700"
            }`}
          >
            {scorecard.weightedScore}
            <span className="text-sm text-mist">/100</span>
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${bandClass(scorecard.weightedBand)}`}
          >
            {t("quality.metrics.weighted")}
          </span>
          <p className="mt-1 text-[11px] text-mist">
            {t("quality.metrics.proxyCount")}: {scorecard.measuredCount} ·{" "}
            {t("quality.metrics.gapCount")}: {scorecard.unavailableCount}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-teal">
        {t("quality.metrics.dimensions")}
      </p>
      <div className="mt-2 space-y-2">
        {scorecard.dimensions.map((d) => (
          <div key={d.id} className="rounded-md border border-line/70 bg-foam/60 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-navy">
                {d.name}
                <span className="ml-2 font-mono text-xs text-mist">{d.weightPct}%</span>
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${bandClass(d.band)}`}
              >
                {d.score}/100
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-slate/40">
              <div
                className={`h-full rounded ${bandBar(d.band)}`}
                style={{ width: `${Math.min(100, d.score)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-mist">{d.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-teal">
        {t("quality.metrics.table")}
      </p>
      <div className="mt-2 space-y-2">
        {scorecard.metrics.map((m) => {
          const open = openId === m.id;
          return (
            <article key={m.id} className="rounded-md border border-line overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                onClick={() => setOpenId(open ? null : m.id)}
                aria-expanded={open}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy">{m.name}</p>
                  <p className="truncate text-xs text-mist">{m.what}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    m.status === "proxy"
                      ? "border-teal/30 bg-teal-soft text-teal"
                      : "border-amber/40 bg-amber-soft text-amber"
                  }`}
                >
                  {m.status === "proxy" ? t("quality.metrics.proxy") : t("quality.metrics.unavailable")}
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold text-navy">
                  {m.valueLabel}
                </span>
                <span className="shrink-0 text-xs text-teal">
                  {open ? t("quality.collapse") : t("quality.expand")}
                </span>
              </button>
              {open && (
                <div className="border-t border-line bg-foam/50 px-3 py-3 text-sm text-navy-2">
                  <p>
                    <span className="font-medium text-navy">{t("quality.metrics.what")}: </span>
                    {m.what}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-navy">{t("quality.metrics.how")}: </span>
                    {m.how}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-navy">{t("quality.metrics.target")}: </span>
                    {m.target}
                  </p>
                  <p className="mt-1 text-xs text-mist">{m.evidence}</p>
                  {m.howToGet && (
                    <p className="mt-2 text-xs leading-relaxed">
                      <span className="font-semibold text-amber">{t("quality.howToGet")}: </span>
                      {m.howToGet}
                    </p>
                  )}
                  {m.perLp.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="text-mist">
                          <tr>
                            <th className="py-1 pr-3">{t("col.name")}</th>
                            <th className="py-1 pr-3">{t("quality.score")}</th>
                            <th className="py-1">{t("quality.metrics.note")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.perLp.map((row) => (
                            <tr key={row.slug} className="border-t border-line/50">
                              <td className="py-1.5 pr-3 font-medium">{row.name}</td>
                              <td className="py-1.5 pr-3 font-mono">
                                {row.score != null ? `${row.score}/100` : "—"}
                              </td>
                              <td className="py-1.5 text-mist">{row.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
