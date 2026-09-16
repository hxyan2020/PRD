"use client";

import { entityName, rankingNote } from "@/lib/i18n/catalog";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { placeLabel } from "@/lib/i18n/lookups";
import type { MessageKey } from "@/lib/i18n/messages";
import { navigateQuery, queryHref, useQueryParams } from "@/lib/queryNav";
import type { CatalogMeta, Entity, NewsItem, Sector } from "@/lib/types";
import { CountryLabel } from "./CountryLabel";
import { QueryLink } from "./QueryLink";

const TABS: Array<{ id: Sector; label: MessageKey }> = [
  { id: "banks", label: "tabBanks" },
  { id: "brokers", label: "tabBrokers" },
  { id: "crypto", label: "tabCrypto" },
];

function isSector(value: string | null): value is Sector {
  return value === "banks" || value === "brokers" || value === "crypto";
}

export function EntitiesView({
  entities,
  items,
  meta,
}: {
  entities: Entity[];
  items: NewsItem[];
  meta: CatalogMeta;
}) {
  const params = useQueryParams();
  const { locale, t } = useLocale();
  const tab: Sector = isSector(params.get("sector")) ? params.get("sector") as Sector : "banks";
  const query = (params.get("q") ?? "").trim();
  const notes = {
    banks: `${rankingNote("banks", meta.banks.ranking, locale)} (${meta.banks.asOf}).`,
    brokers: `${rankingNote("brokers", meta.brokers.ranking, locale)} (${meta.brokers.asOf}).`,
    crypto: `${rankingNote("exchanges", meta.exchanges.ranking, locale)} (${meta.exchanges.asOf}).`,
  };

  const rows = entities
    .filter((entity) => entity.sector === tab)
    .filter((entity) => {
      if (!query) return true;
      const zh = entityName(entity.id, entity.name, "zh");
      const hay = `${entity.name} ${zh} ${entity.aliases.join(" ")} ${entity.country} ${placeLabel(entity.country, "zh")}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .sort((a, b) => a.rank - b.rank);

  function href(nextTab: Sector, nextQuery = query) {
    return queryHref({
      view: "entities",
      sector: nextTab,
      q: nextQuery,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-3xl">{t("entitiesTitle")}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">{t("entitiesLede")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <QueryLink
            key={entry.id}
            href={href(entry.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tab === entry.id ? "border-gold text-gold" : "border-line text-muted"
            }`}
          >
            {t(entry.label)}
          </QueryLink>
        ))}
      </div>
      <p className="text-sm text-muted">{notes[tab]}</p>
      <p className="font-mono text-xs uppercase tracking-wide text-gold">
        {t("showingEntities", { n: rows.length, tab: t(TABS.find((entry) => entry.id === tab)!.label) })}
      </p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "");
          navigateQuery(href(tab, value));
        }}
      >
        <input
          name="q"
          defaultValue={query}
          placeholder={t("searchEntities")}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold/50"
        />
        <button type="submit" className="rounded-lg border border-gold px-3 text-sm text-gold">
          {t("search")}
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-panel-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">{t("rank")}</th>
              <th className="px-3 py-2">{t("entity")}</th>
              <th className="px-3 py-2">{t("hq")}</th>
              <th className="px-3 py-2">{t("country")}</th>
              <th className="px-3 py-2">{t("windowHits")}</th>
              <th className="px-3 py-2">{t("website")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entity) => {
              const hits = items.filter((item) => item.entities.includes(entity.id)).length;
              return (
                <tr key={entity.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-gold">{entity.rank}</td>
                  <td className="px-3 py-2">
                    <div>{entityName(entity.id, entity.name, locale)}</div>
                    {entity.notes && <div className="text-xs text-muted">{entity.notes}</div>}
                  </td>
                  <td className="px-3 py-2 text-muted">{placeLabel(entity.hq, locale)}</td>
                  <td className="px-3 py-2 text-muted">
                    <CountryLabel name={entity.country} />
                  </td>
                  <td className="px-3 py-2 font-mono">{hits}</td>
                  <td className="px-3 py-2">
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold underline decoration-gold/30"
                    >
                      {t("open")}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
