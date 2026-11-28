"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { EvidenceRatings, RatingDimension } from "@/lib/types";

function MetricRow({ dim }: { dim: RatingDimension }) {
  const pct = Math.round((dim.score / dim.max) * 100);
  return (
    <div className="border-t border-line/60 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">{dim.label}</p>
        <p className="font-mono text-sm tabular-nums text-ink">
          {dim.score}/{dim.max}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden bg-line/50">
        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{dim.rationale}</p>
      {dim.evidence.length > 0 ? (
        <ul className="mt-2 space-y-1 font-mono text-[11px] text-mist">
          {dim.evidence.map((e) => (
            <li key={e} className="break-all">
              · {e}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function RatingsPanel({ ratings }: { ratings: EvidenceRatings }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const dims = [
    ratings.credibility,
    ratings.recency,
    ratings.multiSources,
    ratings.crossReferenced,
    ratings.multiWitness,
    ratings.scientificallySupported,
  ];

  return (
    <section className="mt-10 border-t border-line/80 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{t("detail.ratings")}</h2>
          <p className="mt-1 font-mono text-sm tabular-nums text-mist">
            overall {ratings.overall}/5
          </p>
        </div>
        <button
          type="button"
          className="touch-target border border-line px-3 py-2 text-sm text-ink transition hover:border-signal hover:text-signal"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? t("detail.collapse") : t("detail.expand")}
        </button>
      </div>
      {open ? (
        <div className="mt-4">
          {dims.map((d) => (
            <MetricRow key={d.label} dim={d} />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dims.map((d) => (
            <div key={d.label} className="border-t border-line/70 pt-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
                {d.label}
              </p>
              <p className="mt-1 font-mono text-lg tabular-nums text-ink">
                {d.score}
                <span className="text-sm text-mist">/{d.max}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
