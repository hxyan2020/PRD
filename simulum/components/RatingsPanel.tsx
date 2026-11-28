"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { EvidenceRatings, RatingDimension } from "@/lib/types";

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function EvidenceFact({ value }: { value: string }) {
  if (isUrl(value)) {
    return (
      <li className="break-all">
        ·{" "}
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-signal underline-offset-2 hover:underline"
        >
          {value}
        </a>
      </li>
    );
  }
  return <li className="break-all">· {value}</li>;
}

function MetricDetails({ dim }: { dim: RatingDimension }) {
  const pct = Math.round((dim.score / dim.max) * 100);
  return (
    <div className="mt-3 border-t border-line/50 pt-3">
      <div className="h-1.5 overflow-hidden bg-line/50">
        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{dim.rationale}</p>
      {dim.evidence.length > 0 ? (
        <ul className="mt-3 space-y-1 font-mono text-[11px] text-mist">
          {dim.evidence.map((e) => (
            <EvidenceFact key={e} value={e} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-mist">No backing facts linked yet.</p>
      )}
    </div>
  );
}

export function RatingsPanel({ ratings }: { ratings: EvidenceRatings }) {
  const { t } = useI18n();
  const [openAll, setOpenAll] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const dims: Array<{ key: string; dim: RatingDimension }> = [
    { key: "credibility", dim: ratings.credibility },
    { key: "recency", dim: ratings.recency },
    { key: "multiSources", dim: ratings.multiSources },
    { key: "crossReferenced", dim: ratings.crossReferenced },
    { key: "multiWitness", dim: ratings.multiWitness },
    { key: "scientificallySupported", dim: ratings.scientificallySupported },
  ];

  return (
    <section className="mt-10 border-t border-line/80 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{t("detail.ratings")}</h2>
          <p className="mt-1 font-mono text-sm tabular-nums text-mist">
            overall {ratings.overall}/5 · fact-backed
          </p>
        </div>
        <button
          type="button"
          className="touch-target border border-line px-3 py-2 text-sm text-ink transition hover:border-signal hover:text-signal"
          onClick={() => {
            setOpenAll((v) => !v);
            setOpenKey(null);
          }}
          aria-expanded={openAll}
        >
          {openAll ? t("detail.collapse") : t("detail.expand")}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dims.map(({ key, dim }) => {
          const expanded = openAll || openKey === key;
          return (
            <button
              key={key}
              type="button"
              className={`touch-target border border-line/80 p-3 text-left transition hover:border-signal ${
                expanded ? "border-signal bg-signal-soft/20" : "bg-transparent"
              }`}
              aria-expanded={expanded}
              onClick={() => {
                if (openAll) return;
                setOpenKey((cur) => (cur === key ? null : key));
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
                {dim.label}
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-ink">
                {dim.score}
                <span className="text-sm text-mist">/{dim.max}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-signal">
                {expanded ? t("detail.collapse") : t("detail.expand")}
              </p>
              {expanded ? <MetricDetails dim={dim} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
