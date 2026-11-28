"use client";

import Link from "next/link";
import { CategoryHeading } from "@/components/CategoryHeading";
import { EvidenceList } from "@/components/EvidenceList";
import { useI18n } from "@/lib/i18n/context";
import type { Category, Evidence } from "@/lib/types";

export function CategoryDetailView({
  category,
  evidence,
}: {
  category: Category;
  evidence: Evidence[];
}) {
  const { t } = useI18n();
  const count = category.evidenceCount ?? evidence.length;

  return (
    <section className="pt-4 sm:pt-8">
      <Link
        href="/categories"
        className="font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
      >
        ← {t("categories.back")}
      </Link>
      <CategoryHeading category={category} />
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-mist">
        {count} {t("categories.uniqueEvidence")}
      </p>
      <div className="mech-rule mt-8" />
      <div className="mt-0">
        <EvidenceList evidence={evidence} emptyLabel={t("categories.empty")} />
      </div>
    </section>
  );
}
