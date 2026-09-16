"use client";

import { parseCategory, parseSector } from "@/lib/filters";
import { formatDateTime, formatRange, windowLabel } from "@/lib/format";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { navigateQuery, queryHref, useQueryParams } from "@/lib/queryNav";
import type { Briefing, Entity, NewsCategory, RiskTool } from "@/lib/types";
import { NewsCard } from "./NewsCard";
import { QueryLink } from "./QueryLink";

const CATEGORIES: Array<{ id: "all" | NewsCategory; label: MessageKey }> = [
  { id: "all", label: "all" },
  { id: "listing", label: "listings" },
  { id: "product", label: "features" },
  { id: "regulation", label: "regulation" },
  { id: "risk_tools", label: "riskTools" },
];

const SECTORS: Array<{ id: "all" | "banks" | "brokers" | "crypto"; label: MessageKey }> = [
  { id: "all", label: "allSectors" },
  { id: "banks", label: "banks" },
  { id: "brokers", label: "brokers" },
  { id: "crypto", label: "crypto" },
];

export function BriefingBoard({
  briefing,
  entities,
  tools,
  titleKey = "dailyBriefing",
  hideCategoryFilters = false,
  forceCategory,
}: {
  briefing: Briefing;
  entities: Entity[];
  tools: RiskTool[];
  titleKey?: MessageKey;
  hideCategoryFilters?: boolean;
  forceCategory?: NewsCategory;
}) {
  const params = useQueryParams();
  const { locale, t } = useLocale();
  const view = params.get("view") ?? undefined;
  const activeCategory = forceCategory ?? parseCategory(params.get("category") ?? undefined);
  const activeSector = parseSector(params.get("sector") ?? undefined);
  const query = params.get("q") ?? "";

  function hrefFor(next: { category?: string; sector?: string; q?: string }) {
    return queryHref({
      view,
      category: next.category,
      sector: next.sector,
      q: next.q,
    });
  }

  const counts = {
    all: briefing.items.length,
    listing: briefing.items.filter((item) => item.category === "listing").length,
    product: briefing.items.filter((item) => item.category === "product").length,
    regulation: briefing.items.filter((item) => item.category === "regulation").length,
    risk_tools: briefing.items.filter((item) => item.category === "risk_tools").length,
  };

  const items = briefing.items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (activeSector !== "all" && !item.sectors.includes(activeSector)) return false;
    if (query.trim()) {
      const hay = `${item.caption} ${item.captionZh ?? ""} ${item.keyPoints.join(" ")} ${(item.keyPointsZh ?? []).join(" ")} ${item.jurisdictions.join(" ")}`.toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-panel-2 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
              {briefing.meta.windowKind === "weekend" ? t("weekendScan") : t("dailyScan")}
            </p>
            <h2 className="font-serif text-xl md:text-2xl">{t(titleKey)}</h2>
            <p className="mt-1 text-sm text-muted">
              {windowLabel(briefing.meta.windowKind, briefing.meta.windowLabel, locale)}:{" "}
              {formatRange(briefing.meta.windowStart, briefing.meta.windowEnd, locale)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-muted sm:grid-cols-4">
            <div>
              <dt>{t("items")}</dt>
              <dd className="text-paper">{briefing.meta.itemCount}</dd>
            </div>
            <div>
              <dt>{t("healthySources")}</dt>
              <dd className="text-ok">{briefing.meta.sourceStats.healthy}/{briefing.meta.sourceStats.total}</dd>
            </div>
            <div>
              <dt>{t("degraded")}</dt>
              <dd className="text-warn">{briefing.meta.sourceStats.degraded}</dd>
            </div>
            <div>
              <dt>{t("down")}</dt>
              <dd className="text-down">{briefing.meta.sourceStats.down}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 font-mono text-xs text-muted">
          {t("lastSourced")} {formatDateTime(briefing.meta.generatedAt, locale)} · {t("listings")} {counts.listing} · {t("features")} {counts.product} · {t("regulation")} {counts.regulation} · {t("riskTools")} {counts.risk_tools}
        </p>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {!hideCategoryFilters && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((entry) => (
              <QueryLink
                key={entry.id}
                href={hrefFor({ category: entry.id, sector: activeSector, q: query })}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm ${
                  activeCategory === entry.id
                    ? "border-gold text-gold"
                    : "border-line text-muted"
                }`}
              >
                {t(entry.label)}
                <span className="ml-1.5 font-mono text-[11px] tabular-nums opacity-80">
                  {counts[entry.id]}
                </span>
              </QueryLink>
            ))}
          </div>
        )}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {SECTORS.map((entry) => (
            <QueryLink
              key={entry.id}
              href={hrefFor({ category: activeCategory, sector: entry.id, q: query })}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm ${
                activeSector === entry.id
                  ? "border-gold text-gold"
                  : "border-line text-muted"
              }`}
            >
              {t(entry.label)}
            </QueryLink>
          ))}
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "");
          navigateQuery(hrefFor({ category: activeCategory, sector: activeSector, q: value }));
        }}
      >
        <input
          name="q"
          defaultValue={query}
          placeholder={t("searchNews")}
          className="min-w-0 w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-paper outline-none placeholder:text-muted focus:border-gold/50"
        />
        <button type="submit" className="shrink-0 rounded-lg border border-gold px-3 text-sm text-gold">
          {t("search")}
        </button>
      </form>

      <p className="font-mono text-xs uppercase tracking-wide text-gold">
        {t("showingStories", { n: items.length })}
      </p>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t("emptyNews")}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} entities={entities} tools={tools} />
          ))}
        </div>
      )}
    </div>
  );
}
