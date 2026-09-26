"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { useStoryText } from "@/lib/i18n/useStoryText";
import { storyDeskHref } from "@/lib/queryNav";
import {
  buildDailyTldr,
  TLDR_CATEGORIES,
  TLDR_SECTORS,
} from "@/lib/tldrNews";
import type { Entity, NewsCategory, NewsItem, Sector, SourceStatus } from "@/lib/types";
import { QueryLink } from "./QueryLink";

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

function TldrCaption({ item }: { item: NewsItem }) {
  const { locale, t } = useLocale();
  const { text, pending } = useStoryText(locale, item.caption, item.captionZh);
  return (
    <>
      <span className="line-clamp-2">{text}</span>
      {pending ? <span className="ml-1 font-mono text-[11px] text-muted">{t("translating")}</span> : null}
    </>
  );
}

export function DailyTldr({
  items,
  entities,
  sources,
}: {
  items: NewsItem[];
  entities: Entity[];
  sources: SourceStatus[];
}) {
  const { t } = useLocale();
  const grid = buildDailyTldr(items, { entities, sources });

  return (
    <section className="rounded-xl border border-line bg-panel-2 p-3 md:p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{t("dailyTldr")}</p>
      <h2 className="mt-1 font-serif text-lg md:text-2xl">{t("dailyTldrTitle")}</h2>
      <p className="mt-1 hidden text-sm text-muted md:block">{t("dailyTldrLede")}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {TLDR_SECTORS.map((sector) => (
          <div key={sector} className="rounded-lg border border-line bg-panel px-3 py-3">
            <h3 className="font-serif text-base text-paper md:text-lg">{t(SECTOR_LABEL[sector])}</h3>
            <div className="mt-3 space-y-3">
              {TLDR_CATEGORIES.map((category) => {
                const stories = grid[sector][category];
                return (
                  <div key={category}>
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
                              <TldrCaption item={item} />
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
