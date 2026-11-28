import Link from "next/link";
import type { Evidence } from "@/lib/types";

export function EvidenceList({
  evidence,
  emptyLabel = "No evidence in this view yet.",
}: {
  evidence: Evidence[];
  emptyLabel?: string;
}) {
  if (evidence.length === 0) {
    return <p className="text-mist">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-line/70 border-y border-line/70">
      {evidence.map((item, index) => (
        <li
          key={item.id}
          className="animate-rise py-5"
          style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-xl text-ink sm:text-2xl">
              <Link href={`/evidence/${item.slug}`} className="transition hover:text-signal">
                {item.title}
              </Link>
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-wider text-mist">
              {item.sourceCount} source{item.sourceCount === 1 ? "" : "s"} ·{" "}
              {item.languages.join(", ")}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft sm:text-base">
            {item.summary}
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
