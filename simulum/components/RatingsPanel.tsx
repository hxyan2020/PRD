"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/messages";
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

function MetricDetails({
  dim,
  emptyLabel,
}: {
  dim: RatingDimension;
  emptyLabel: string;
}) {
  const pct = Math.round((dim.score / dim.max) * 100);
  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="h-1 overflow-hidden bg-line">
        <div
          className="h-full bg-gradient-to-r from-ember to-signal"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{dim.rationale}</p>
      {dim.evidence.length > 0 ? (
        <ul className="mt-3 space-y-1 font-mono text-[11px] text-mist">
          {dim.evidence.map((e) => (
            <EvidenceFact key={e} value={e} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-mist">{emptyLabel}</p>
      )}
    </div>
  );
}

export function RatingsPanel({ ratings }: { ratings: EvidenceRatings }) {
  const { t } = useI18n();
  const [openAll, setOpenAll] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const dims: Array<{ key: string; labelKey: MessageKey; dim: RatingDimension }> = [
    { key: "credibility", labelKey: "rating.credibility", dim: ratings.credibility },
    { key: "recency", labelKey: "rating.recency", dim: ratings.recency },
    { key: "multiSources", labelKey: "rating.multiSources", dim: ratings.multiSources },
    {
      key: "crossReferenced",
      labelKey: "rating.crossReferenced",
      dim: ratings.crossReferenced,
    },
    { key: "multiWitness", labelKey: "rating.multiWitness", dim: ratings.multiWitness },
    {
      key: "scientificallySupported",
      labelKey: "rating.scientificallySupported",
      dim: ratings.scientificallySupported,
    },
  ];

  return (
    <section className="mt-8 border-t border-line pt-5 sm:mt-10 sm:pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-medium text-ink sm:text-2xl">
            {t("detail.ratings")}
          </h2>
          <p className="mt-1 font-mono text-sm tabular-nums text-mist">
            {t("detail.overall")}{" "}
            <span className="text-ember">{ratings.overall}/5</span> · {t("detail.factBacked")}
          </p>
        </div>
        <button
          type="button"
          className="touch-target w-full border border-line bg-panel px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition hover:border-signal hover:text-signal sm:w-auto"
          onClick={() => {
            setOpenAll((v) => !v);
            setOpenKey(null);
          }}
          aria-expanded={openAll}
        >
          {openAll ? t("detail.collapse") : t("detail.expand")}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {dims.map(({ key, labelKey, dim }) => {
          const expanded = openAll || openKey === key;
          return (
            <button
              key={key}
              type="button"
              className={`touch-target mech-frame p-3.5 text-left transition hover:border-signal/60 sm:p-3 ${
                expanded ? "border-signal/50 bg-signal-soft" : "bg-panel/50"
              }`}
              aria-expanded={expanded}
              onClick={() => {
                if (openAll) return;
                setOpenKey((cur) => (cur === key ? null : key));
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
                {t(labelKey)}
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums text-ink">
                {dim.score}
                <span className="text-sm text-mist">/{dim.max}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-signal">
                {expanded ? t("detail.collapse") : t("detail.expand")}
              </p>
              {expanded ? (
                <MetricDetails dim={dim} emptyLabel={t("detail.noBacking")} />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
