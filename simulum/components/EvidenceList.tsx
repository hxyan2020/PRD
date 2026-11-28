"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { presentEvidence } from "@/lib/i18n/present";
import type { Evidence } from "@/lib/types";

export function EvidenceList({
  evidence,
  emptyLabel,
}: {
  evidence: Evidence[];
  emptyLabel?: string;
}) {
  const { t, locale } = useI18n();
  const visible = evidence
    .map((item) => ({ item, presented: presentEvidence(item, locale) }))
    .filter((row) => row.presented.available);

  if (visible.length === 0) {
    return <p className="text-mist">{emptyLabel || t("evidence.empty")}</p>;
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {visible.map(({ item, presented }, index) => (
        <li
          key={item.id}
          className="animate-rise group/row relative py-4 sm:py-5"
          style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
          <span
            className="pointer-events-none absolute left-0 top-4 hidden h-8 w-0.5 bg-signal/0 transition group-hover/row:bg-signal sm:block"
            aria-hidden
          />
          <Link
            href={`/evidence/${item.slug}`}
            className="group block outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal sm:pl-3"
          >
            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
              <h3 className="max-w-3xl font-display text-[1.05rem] font-medium leading-snug text-ink transition group-hover:text-signal sm:text-2xl">
                {presented.caption}
              </h3>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-mist">
                {item.sourceCount} · {item.languages.join(", ")} ·{" "}
                <span className="text-ember">{item.ratings.overall}/5</span>
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft sm:text-base">
              {presented.body.what}
            </p>
          </Link>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 sm:pl-3">
            {item.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="touch-target inline-flex items-center font-mono text-[11px] uppercase tracking-wider text-signal underline-offset-4 hover:underline"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
