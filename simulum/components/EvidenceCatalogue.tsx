"use client";

import { EvidenceList } from "@/components/EvidenceList";
import { useI18n } from "@/lib/i18n/context";
import type { Evidence } from "@/lib/types";

export function EvidenceCatalogue({
  evidence,
  total,
}: {
  evidence: Evidence[];
  total: number;
}) {
  const { t } = useI18n();
  return (
    <section className="pt-2 sm:pt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
        {t("nav.evidence")}
      </p>
      <h1 className="mt-2 font-display text-[2rem] leading-tight text-ink sm:text-5xl">
        {t("evidence.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
        {total.toLocaleString()} {t("evidence.blurb")}
      </p>
      <div className="mt-6 sm:mt-8">
        <EvidenceList evidence={evidence} />
      </div>
    </section>
  );
}
