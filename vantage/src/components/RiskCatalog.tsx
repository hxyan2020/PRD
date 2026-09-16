"use client";

import { toolCategory, toolSummary, toolUse } from "@/lib/i18n/catalog";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { sectorLabel } from "@/lib/format";
import type { NewsItem, RiskTool } from "@/lib/types";

export function RiskCatalog({
  tools,
  items,
}: {
  tools: RiskTool[];
  items: NewsItem[];
}) {
  const { locale, t } = useLocale();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tools.map((tool) => {
        const hits = items.filter((item) => item.riskTools.includes(tool.id)).length;
        return (
          <article key={tool.id} className="rounded-xl border border-line bg-panel p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-gold">
              {toolUse(tool.use, locale)} {t("use")} · {toolCategory(tool.category, locale)}
            </p>
            <h3 className="mt-1 font-serif text-xl">{tool.name}</h3>
            <p className="text-sm text-muted">{tool.vendor}</p>
            <p className="mt-2 text-sm leading-6">{toolSummary(tool.id, tool.summary, locale)}</p>
            <p className="mt-3 text-xs text-muted">
              {t("sectors")}: {tool.sectors.map((sector) => sectorLabel(sector, locale)).join(" · ")} · {t("windowHits")}: {hits}
            </p>
            <a
              href={tool.website}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-gold underline decoration-gold/30"
            >
              {t("vendorSite")}
            </a>
          </article>
        );
      })}
    </div>
  );
}
