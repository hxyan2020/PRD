"use client";

import { LpLogo } from "@/components/LpLogo";
import { useI18n } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/messages";
import type { QuotingStrategy } from "@/lib/quoting-strategy";
import type { ScoreBand } from "@/lib/quality-research";

function bandClass(band: ScoreBand): string {
  if (band === "green") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (band === "yellow") return "bg-amber-soft text-amber border-amber/40";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

const ROLE_KEY: Record<QuotingStrategy["legs"][0]["role"], MessageKey> = {
  primary: "quality.role.primary",
  secondary: "quality.role.secondary",
  backup: "quality.role.backup",
  aggregator: "quality.role.aggregator",
};

export function QuotingStrategyPanel({ strategy }: { strategy: QuotingStrategy }) {
  const { t } = useI18n();
  const isAgg = strategy.mode === "aggregation";

  return (
    <div className="rounded-xl border border-teal/40 bg-teal-soft/30 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">
        {t("quality.strategy")}
      </p>
      <h3 className="mt-1 font-display text-xl text-navy sm:text-2xl">
        {strategy.modeLabel}
        <span className="ml-2 inline-flex rounded-full border border-teal/30 bg-white px-2 py-0.5 text-xs font-semibold text-teal">
          {isAgg ? t("quality.strategy.agg") : t("quality.strategy.fv")}
        </span>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-2">{strategy.rationale}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-mist">
            <tr>
              <th className="py-1 pr-3">#</th>
              <th className="py-1 pr-3">{t("col.name")}</th>
              <th className="py-1 pr-3">{t("quality.strategy.role")}</th>
              <th className="py-1 pr-3">
                {isAgg ? t("quality.strategy.weight") : t("quality.strategy.priorityShare")}
              </th>
              <th className="py-1">{t("quality.score")}</th>
            </tr>
          </thead>
          <tbody>
            {strategy.legs.map((leg) => (
              <tr key={leg.slug} className="border-t border-line/60">
                <td className="py-2 pr-3 font-mono text-xs text-mist">{leg.rank}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-2">
                    <LpLogo
                      lp={{ slug: leg.slug, name: leg.name, logoUrl: leg.logoUrl }}
                      size="sm"
                    />
                    <span className="font-medium text-navy">{leg.name}</span>
                  </span>
                </td>
                <td className="py-2 pr-3 text-navy-2">{t(ROLE_KEY[leg.role])}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-teal">{leg.weightPct}%</span>
                    <span className="h-1.5 w-16 overflow-hidden rounded bg-slate/50">
                      <span
                        className="block h-full rounded bg-teal"
                        style={{ width: `${Math.min(100, leg.weightPct)}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${bandClass(leg.band)}`}
                  >
                    {leg.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal">
        {t("quality.strategy.apply")}
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-navy-2">
        {strategy.howToApply.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-mist">{strategy.dataNote}</p>
    </div>
  );
}
