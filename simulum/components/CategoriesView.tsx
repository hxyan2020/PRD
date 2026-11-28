"use client";

import { CategoryGrid } from "@/components/CategoryGrid";
import { useI18n } from "@/lib/i18n/context";
import type { Category } from "@/lib/types";

export function CategoriesView({ categories }: { categories: Category[] }) {
  const { t } = useI18n();
  return (
    <section className="pt-2 sm:pt-8">
      <p className="hud-label">{t("nav.categories")}</p>
      <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        {t("categories.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
        {t("categories.blurb")}
      </p>
      <div className="mech-rule mt-8 sm:mt-10" />
      <div className="mt-0">
        <CategoryGrid categories={categories} />
      </div>
    </section>
  );
}
