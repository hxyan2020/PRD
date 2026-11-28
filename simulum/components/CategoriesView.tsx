"use client";

import { CategoryGrid } from "@/components/CategoryGrid";
import { useI18n } from "@/lib/i18n/context";
import type { Category } from "@/lib/types";

export function CategoriesView({ categories }: { categories: Category[] }) {
  const { t } = useI18n();
  return (
    <section className="pt-4 sm:pt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
        {t("nav.categories")}
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
        {t("categories.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{t("categories.blurb")}</p>
      <div className="mt-10">
        <CategoryGrid categories={categories} />
      </div>
    </section>
  );
}
