"use client";

import { useEffect } from "react";
import { entityName, sourceName } from "@/lib/i18n/catalog";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { categoryLabel, formatDateTime, sectorLabel } from "@/lib/format";
import { useQueryParams } from "@/lib/queryNav";
import { storyAnchorId } from "@/lib/tldrNews";
import type { Entity, NewsItem, RiskTool } from "@/lib/types";
import { BrandLabelList } from "./BrandLabel";
import { CountryLabel } from "./CountryLabel";
import { deskPlatformImpact } from "@/lib/platformImpact";
import { useDeskAccount } from "./DeskAccountProvider";
import { toolLogoId } from "@/lib/logos";
import { StoryLine } from "./StoryLine";

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
  action = "collect",
}: {
  item: NewsItem;
  entities: Entity[];
  tools: RiskTool[];
  action?: "collect" | "remove";
}) {
  const { locale, t } = useLocale();
  const { collect, remove, collected } = useDeskAccount();
  const params = useQueryParams();
  const focused = params.get("story") === item.id;
  const saved = collected(item.id);

  useEffect(() => {
    if (!focused) return;
    const node = document.getElementById(storyAnchorId(item.id));
    if (!node) return;
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [focused, item.id]);
  const brandEntities = item.entities
    .map((id) => {
      const entity = entities.find((entry) => entry.id === id);
      return entity ? { id: entity.id, name: entityName(entity.id, entity.name, locale) } : null;
    })
    .filter(Boolean) as Array<{ id: string; name: string }>;
  const brandTools = item.riskTools
    .map((id) => {
      const tool = tools.find((entry) => entry.id === id);
      return tool ? { id: toolLogoId(tool.id), name: tool.name } : null;
    })
    .filter(Boolean) as Array<{ id: string; name: string }>;
  const namedParties = item.entities
    .map((id) => {
      const entity = entities.find((entry) => entry.id === id);
      return entity
        ? { nameEn: entity.name, nameZh: entityName(entity.id, entity.name, "zh") }
        : null;
    })
    .filter(Boolean) as Array<{ nameEn: string; nameZh: string }>;
  const vantageImpact = deskPlatformImpact(item, namedParties);

  return (
    <article
      id={storyAnchorId(item.id)}
      tabIndex={-1}
      className={`scroll-mt-28 rounded-xl border bg-panel p-3.5 md:scroll-mt-52 md:p-5 ${
        focused ? "border-gold ring-2 ring-gold/50" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide md:gap-2">
        <span className={`rounded-full border px-2 py-0.5 ${CATEGORY_COLOR[item.category]}`}>
          {categoryLabel(item.category, locale)}
        </span>
        {item.sectors.map((sector) => (
          <span key={sector} className="rounded-full border border-line px-2 py-0.5 text-muted">
            {sectorLabel(sector, locale)}
          </span>
        ))}
        {item.jurisdictions.slice(0, 2).map((jurisdiction) => (
          <CountryLabel key={jurisdiction} name={jurisdiction} className="text-muted" />
        ))}
        {item.jurisdictions.slice(2, 4).map((jurisdiction) => (
          <CountryLabel key={jurisdiction} name={jurisdiction} className="hidden text-muted md:inline-flex" />
        ))}
        {action === "remove" ? (
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="ml-auto rounded-full border border-down/50 px-2.5 py-1 text-[11px] normal-case tracking-normal text-down hover:border-down hover:bg-down/10"
          >
            {t("removeFromCollection")}
          </button>
        ) : (
          <button
            type="button"
            disabled={saved}
            onClick={() => collect(item)}
            className={`ml-auto rounded-full border px-2.5 py-1 text-[11px] normal-case tracking-normal ${
              saved
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-gold text-gold hover:bg-gold/10"
            }`}
          >
            {saved ? t("collected") : t("collect")}
          </button>
        )}
      </div>

      <h2 className="mt-3 overflow-visible break-words font-serif text-lg leading-[1.5] text-pretty text-paper sm:text-xl md:text-2xl">
        <StoryLine english={item.caption} chinese={item.captionZh} />
      </h2>

      <p className="mt-2 font-mono text-xs text-gold-dim">
        {t("published")} {formatDateTime(item.publishedAt, locale)}
      </p>

      {brandEntities.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          {t("entitiesLabel")}: <BrandLabelList items={brandEntities} />
        </p>
      )}

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 break-words text-paper/90">
        {item.keyPoints.map((point, index) => (
          <li key={`${item.id}-${index}`}>
            <StoryLine english={point} chinese={item.keyPointsZh?.[index]} />
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm">
        <p className="font-mono text-[11px] tracking-wide text-gold">
          {t("vantageImpact")}
        </p>
        <p className="mt-1 leading-6 text-paper/90">
          <StoryLine english={vantageImpact.summary} chinese={vantageImpact.summaryZh} />
        </p>
      </div>

      {brandTools.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {t("riskToolsLabel")}: <BrandLabelList items={brandTools} />
        </p>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {t("originalSources")}
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
                {sourceName(source.sourceId, source.name, locale)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
