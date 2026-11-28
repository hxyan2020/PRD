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
    <ul className="divide-y divide-line/70 border-y border-line/70">
      {visible.map(({ item, presented }, index) => (
        <li
          key={item.id}
          className="animate-rise py-5"
          style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="max-w-3xl font-display text-xl text-ink sm:text-2xl">
              <Link href={`/evidence/${item.slug}`} className="transition hover:text-signal">
                {presented.caption}
              </Link>
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-wider text-mist">
              {item.sourceCount} · {item.languages.join(", ")} · {item.ratings.overall}/5
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft sm:text-base">
            {presented.body.what}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {item.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="font-mono text-[11px] uppercase tracking-wider text-signal underline-offset-2 hover:underline"
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
