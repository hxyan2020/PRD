import type { NewsItem, RiskTool } from "@/lib/types";
import { sectorLabel } from "@/lib/format";

export function RiskCatalog({
  tools,
  items,
}: {
  tools: RiskTool[];
  items: NewsItem[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tools.map((tool) => {
        const hits = items.filter((item) => item.riskTools.includes(tool.id)).length;
        return (
          <article key={tool.id} className="rounded-xl border border-line bg-panel p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-gold">
              {tool.use} use · {tool.category}
            </p>
            <h3 className="mt-1 font-serif text-xl">{tool.name}</h3>
            <p className="text-sm text-muted">{tool.vendor}</p>
            <p className="mt-2 text-sm leading-6">{tool.summary}</p>
            <p className="mt-3 text-xs text-muted">
              Sectors: {tool.sectors.map(sectorLabel).join(" · ")} · Window hits: {hits}
            </p>
            <a
              href={tool.website}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-gold underline decoration-gold/30"
            >
              Vendor site
            </a>
          </article>
        );
      })}
    </div>
  );
}
