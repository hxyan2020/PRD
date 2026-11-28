"use client";

import {
  categoryDescription,
  categoryName,
} from "@/lib/i18n/category-labels";
import { useI18n } from "@/lib/i18n/context";
import type { Category } from "@/lib/types";

export function CategoryHeading({ category }: { category: Category }) {
  const { locale } = useI18n();
  return (
    <>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {categoryName(category.slug, locale, category.name)}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {categoryDescription(category.slug, locale, category.description)}
      </p>
    </>
  );
}
