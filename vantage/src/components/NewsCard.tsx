"use client";

import { entityName, sourceName } from "@/lib/i18n/catalog";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { placeLabel, assetLabel } from "@/lib/i18n/lookups";
import { useStoryText } from "@/lib/i18n/useStoryText";
import { categoryLabel, formatDateTime, sectorLabel } from "@/lib/format";
import type { Entity, NewsItem, RiskTool } from "@/lib/types";

const CATEGORY_COLOR: Record<string, string> = {
  listing: "text-[var(--listing)] border-[var(--listing)]/40",
  product: "text-[var(--feature)] border-[var(--feature)]/40",
  regulation: "text-[var(--reg)] border-[var(--reg)]/40",
  risk_tools: "text-[var(--risk)] border-[var(--risk)]/40",
};

function StoryLine({
  english,
  chinese,
}: {
  english: string;
  chinese?: string;
}) {
  const { locale, t } = useLocale();
  const { text, pending } = useStoryText(locale, english, chinese);
  return (
    <>
      {text}
      {pending ? <span className="ml-2 font-mono text-[11px] text-muted">{t("translating")}</span> : null}
    </>
  );
}

export function NewsCard({
  item,
  entities,
  tools,
}: {
  item: NewsItem;
  entities: Entity[];
  tools: RiskTool[];
}) {
  const { locale, t } = useLocale();
  const names = item.entities
    .map((id) => {
      const entity = entities.find((entry) => entry.id === id);
      return entity ? entityName(entity.id, entity.name, locale) : null;
    })
    .filter(Boolean) as string[];
  const toolNames = item.riskTools
    .map((id) => tools.find((tool) => tool.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <article className="rounded-xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wide">
        <span className={`rounded-full border px-2 py-0.5 ${CATEGORY_COLOR[item.category]}`}>
          {categoryLabel(item.category, locale)}
        </span>
        {item.sectors.map((sector) => (
          <span key={sector} className="rounded-full border border-line px-2 py-0.5 text-muted">
            {sectorLabel(sector, locale)}
          </span>
        ))}
        {item.jurisdictions.slice(0, 4).map((jurisdiction) => (
          <span key={jurisdiction} className="text-muted">
            {placeLabel(jurisdiction, locale)}
          </span>
        ))}
      </div>

      <h2 className="mt-3 overflow-visible break-words font-serif text-xl leading-[1.5] text-pretty text-paper md:text-2xl">
        <StoryLine english={item.caption} chinese={item.captionZh} />
      </h2>

      <p className="mt-2 font-mono text-xs text-gold-dim">
        {t("published")} {formatDateTime(item.publishedAt, locale)}
      </p>

      {names.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          {t("entitiesLabel")}: {names.join(" · ")}
        </p>
      )}

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 break-words text-paper/90">
        {item.keyPoints.map((point, index) => (
          <li key={`${item.id}-${index}`}>
            <StoryLine english={point} chinese={item.keyPointsZh?.[index]} />
          </li>
        ))}
      </ul>

      {item.impact && (
        <div className="mt-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-wide text-gold">
            {t("potentialImpact")}
          </p>
          <p className="mt-1 text-paper/90">
            <StoryLine english={item.impact.summary} chinese={item.impact.summaryZh} />
          </p>
          {item.impact.assets.length > 0 && (
            <p className="mt-1 text-muted">
              {t("assets")}: {item.impact.assets.map((asset) => assetLabel(asset, locale)).join(locale === "zh" ? "、" : ", ")}
            </p>
          )}
        </div>
      )}

      {toolNames.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {t("riskToolsLabel")}: {toolNames.join(" · ")}
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
