import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {categories.map((cat, index) => (
        <li
          key={cat.id}
          className="animate-rise border-t border-line/80 pt-4"
          style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
        >
          <Link href={`/categories/${cat.slug}`} className="group block">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl text-ink transition group-hover:text-signal">
                {cat.name}
              </h3>
              <span className="font-mono text-sm tabular-nums text-mist">
                {cat.evidenceCount ?? 0}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{cat.description}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
