import { categoryLabel, formatDateTime, sectorLabel } from "@/lib/format";
import type { Entity, NewsItem, RiskTool } from "@/lib/types";

const CATEGORY_COLOR: Record<string, string> = {
  listing: "text-[var(--listing)] border-[var(--listing)]/40",
  product: "text-[var(--feature)] border-[var(--feature)]/40",
  regulation: "text-[var(--reg)] border-[var(--reg)]/40",
  risk_tools: "text-[var(--risk)] border-[var(--risk)]/40",
};

export function NewsCard({
  item,
  entities,
  tools,
}: {
  item: NewsItem;
  entities: Entity[];
  tools: RiskTool[];
}) {
  const names = item.entities
    .map((id) => entities.find((entity) => entity.id === id)?.name)
    .filter(Boolean) as string[];
  const toolNames = item.riskTools
    .map((id) => tools.find((tool) => tool.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <article className="rounded-xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wide">
        <span className={`rounded-full border px-2 py-0.5 ${CATEGORY_COLOR[item.category]}`}>
          {categoryLabel(item.category)}
        </span>
        {item.sectors.map((sector) => (
          <span key={sector} className="rounded-full border border-line px-2 py-0.5 text-muted">
            {sectorLabel(sector)}
          </span>
        ))}
        {item.jurisdictions.slice(0, 4).map((jurisdiction) => (
          <span key={jurisdiction} className="text-muted">
            {jurisdiction}
          </span>
        ))}
      </div>

      <h2 className="mt-3 font-serif text-2xl leading-snug text-paper">
        {item.caption}
      </h2>

      <p className="mt-2 font-mono text-xs text-gold-dim">
        Published {formatDateTime(item.publishedAt)}
      </p>

      {names.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          Entities: {names.join(" · ")}
        </p>
      )}

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-paper/90">
        {item.keyPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      {item.impact && (
        <div className="mt-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-wide text-gold">
            Potential impact
          </p>
          <p className="mt-1 text-paper/90">{item.impact.summary}</p>
          {item.impact.assets.length > 0 && (
            <p className="mt-1 text-muted">
              Assets: {item.impact.assets.join(", ")}
            </p>
          )}
        </div>
      )}

      {toolNames.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          Risk tools: {toolNames.join(" · ")}
        </p>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          Original sources
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {item.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
              >
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
