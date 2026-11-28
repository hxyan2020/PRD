"use client";

import Link from "next/link";
import {
  categoryDescription,
  categoryName,
} from "@/lib/i18n/category-labels";
import { useI18n } from "@/lib/i18n/context";
import type { Category } from "@/lib/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { locale } = useI18n();
  return (
    <ul className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
      {categories.map((cat, index) => (
        <li
          key={cat.id}
          className="animate-rise border-t border-line py-4"
          style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
        >
          <Link
            href={`/categories/${cat.slug}`}
            className="group block py-1 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-medium text-ink transition group-hover:text-signal sm:text-xl">
                {categoryName(cat.slug, locale, cat.name)}
              </h3>
              <span className="shrink-0 font-mono text-sm tabular-nums text-ember">
                {cat.evidenceCount ?? 0}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {categoryDescription(cat.slug, locale, cat.description)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
