"use client";

import { parseSector } from "@/lib/filters";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { parseDeskNav, storyDeskHref, useQueryParams } from "@/lib/queryNav";
import {
  buildDailyTldr,
  TLDR_CATEGORIES,
  TLDR_SECTORS,
} from "@/lib/tldrNews";
import type { Entity, NewsCategory, NewsItem, Sector, SourceStatus } from "@/lib/types";
import { QueryLink } from "./QueryLink";
import { StoryLine } from "./StoryLine";

const NAV_CATEGORY: Partial<Record<string, NewsCategory>> = {
  listing: "listing",
  product: "product",
  regulation: "regulation",
  "risk-tools": "risk_tools",
};

const SECTOR_LABEL: Record<Sector, MessageKey> = {
  banks: "banks",
  brokers: "brokers",
  crypto: "crypto",
};

const CATEGORY_LABEL: Record<NewsCategory, MessageKey> = {
  listing: "listings",
  product: "features",
  regulation: "regulation",
  risk_tools: "riskTools",
};

export function DailyTldr({
  items,
  entities,
  sources,
}: {
  items: NewsItem[];
  entities: Entity[];
  sources: SourceStatus[];
}) {
  const { locale, t } = useLocale();
  const params = useQueryParams();
  const nav = parseDeskNav(params.get("view"), params.get("category"));
  const activeSector = parseSector(params.get("sector") ?? undefined);
  const activeCategory = NAV_CATEGORY[nav];
  const grid = buildDailyTldr(items, { entities, sources });

  return (
    <section
      lang={locale === "zh" ? "zh-CN" : "en"}
      className="rounded-xl border border-line bg-panel-2 p-3 md:p-5"
    >
      <p className="font-mono text-[11px] tracking-[0.18em] text-gold">{t("dailyTldr")}</p>
      <h2 className="mt-1 font-serif text-lg md:text-2xl">{t("dailyTldrTitle")}</h2>
      <p className="mt-1 text-xs text-muted md:text-sm">{t("dailyTldrLede")}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {TLDR_SECTORS.map((sector) => (
          <div
            key={sector}
            className={`rounded-lg border bg-panel px-3 py-3 ${
              activeSector === sector ? "border-gold" : "border-line"
            }`}
          >
            <h3 className="font-serif text-base text-paper md:text-lg">{t(SECTOR_LABEL[sector])}</h3>
            <div className="mt-3 space-y-3">
              {TLDR_CATEGORIES.map((category) => {
                const stories = grid[sector][category];
                const focused = activeCategory === category;
                return (
                  <div
                    key={category}
                    className={focused ? "rounded-md bg-gold/10 px-1.5 py-1" : undefined}
                  >
                    <p className="font-mono text-[11px] tracking-wide text-gold">
                      {t(CATEGORY_LABEL[category])}
                    </p>
                    {stories.length === 0 ? (
                      <p className="mt-1 text-xs text-muted">{t("tldrEmpty")}</p>
                    ) : (
                      <ul className="mt-1.5 space-y-1.5">
                        {stories.map((item) => (
                          <li key={`${sector}-${category}-${item.id}`}>
                            <QueryLink
                              href={storyDeskHref(item, sector)}
                              className="block rounded-md px-1.5 py-1 text-sm leading-5 text-paper/90 hover:bg-gold/10 hover:text-gold"
                            >
                              <span className="line-clamp-2">
                                <StoryLine english={item.caption} chinese={item.captionZh} />
                              </span>
                              <span className="mt-0.5 block font-mono text-[11px] text-muted">
                                {t("tldrReports", { n: item.sources.length })}
                              </span>
                            </QueryLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
