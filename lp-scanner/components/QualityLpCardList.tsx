"use client";

import { useState } from "react";
import { LpLogo } from "@/components/LpLogo";
import { useI18n } from "@/lib/i18n/context";
import type { QualityLpCard } from "@/lib/quality-lp-cards";
import type { ScoreBand } from "@/lib/quality-research";

function bandClass(band: ScoreBand): string {
  if (band === "green") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (band === "yellow") return "bg-amber-soft text-amber border-amber/40";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

function Card({ card }: { card: QualityLpCard }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-xl border border-line bg-foam/80">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <LpLogo lp={{ slug: card.slug, name: card.name, logoUrl: card.logoUrl }} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy">
            {card.rank != null ? (
              <span className="mr-2 font-mono text-xs text-teal">#{card.rank}</span>
            ) : null}
            {card.name}
          </p>
          <p className="truncate text-xs text-mist">{card.summary}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${bandClass(card.band)}`}
        >
          {card.score}
        </span>
        <span className="shrink-0 text-xs text-teal">{open ? t("quality.collapse") : t("quality.expand")}</span>
      </button>

      {open && (
        <div className="border-t border-line px-3 py-3 sm:px-4">
          <p className="text-sm text-navy-2">{card.summary}</p>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal">
            {t("quality.realData")}
          </p>
          <dl className="mt-1 grid gap-2 sm:grid-cols-2">
            {card.realData.map((d) => (
              <div key={d.key} className="rounded-md bg-white/80 px-2 py-1.5 text-xs">
                <dt className="text-mist">
                  {d.label}
                  {d.fromLp ? (
                    <span className="ml-1 text-[10px] uppercase text-teal">LP</span>
                  ) : null}
                </dt>
                <dd className="mt-0.5 break-words text-navy-2">{d.value}</dd>
              </div>
            ))}
          </dl>

          {card.liveFindings.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                {t("quality.evidence")}
              </p>
              <ul className="mt-1 list-disc pl-4 text-sm text-navy-2">
                {card.liveFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-teal">{t("quality.pros")}</p>
              <ul className="mt-1 list-disc pl-4 text-sm">
                {card.pros.length ? card.pros.map((p, i) => <li key={i}>{p}</li>) : <li>—</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber">{t("quality.cons")}</p>
              <ul className="mt-1 list-disc pl-4 text-sm">
                {card.cons.length ? card.cons.map((c, i) => <li key={i}>{c}</li>) : <li>—</li>}
              </ul>
            </div>
          </div>

          {card.sources.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {card.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target={s.url.startsWith("http") ? "_blank" : undefined}
                    rel={s.url.startsWith("http") ? "noreferrer" : undefined}
                    className="text-teal underline-offset-2 hover:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

export function QualityLpCardList({ cards }: { cards: QualityLpCard[] }) {
  const { t } = useI18n();
  if (!cards.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            {t("quality.lpCards")}
          </p>
          <p className="text-xs text-mist">{t("quality.lpCards.hint")}</p>
        </div>
        <span className="text-xs text-mist">{cards.length}</span>
      </div>
      {cards.map((c) => (
        <Card key={c.id} card={c} />
      ))}
    </div>
  );
}
