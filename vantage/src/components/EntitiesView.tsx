"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogMeta, Entity, NewsItem, Sector } from "@/lib/types";

const TABS: Array<{ id: Sector; label: string }> = [
  { id: "banks", label: "Top 50 banks" },
  { id: "brokers", label: "Top 50 brokers" },
  { id: "crypto", label: "Top 50 crypto exchanges" },
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
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const tab: Sector = isSector(params.get("sector")) ? params.get("sector") as Sector : "banks";
  const query = (params.get("q") ?? "").trim();
  const rankingNote = {
    banks: meta.banks.ranking + ` (as of ${meta.banks.asOf}).`,
    brokers: meta.brokers.ranking + ` (as of ${meta.brokers.asOf}).`,
    crypto: meta.exchanges.ranking + ` (as of ${meta.exchanges.asOf}).`,
  };

  const rows = entities
    .filter((entity) => entity.sector === tab)
    .filter((entity) => {
      if (!query) return true;
      const hay = `${entity.name} ${entity.aliases.join(" ")} ${entity.country}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .sort((a, b) => a.rank - b.rank);

  function href(nextTab: Sector, nextQuery = query) {
    const search = new URLSearchParams();
    search.set("sector", nextTab);
    if (nextQuery) search.set("q", nextQuery);
    return `${pathname}?${search.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-3xl">Monitored entities</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The desk watches the top 50 banks by assets, a global top 50 of
          brokers and wealth platforms, and the top 50 crypto exchanges by
          CoinGecko trust score. Window hits count stories from the latest scan
          that mention the entity.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <Link
            key={entry.id}
            href={href(entry.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tab === entry.id ? "border-gold text-gold" : "border-line text-muted"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted">{rankingNote[tab]}</p>
      <p className="font-mono text-xs uppercase tracking-wide text-gold">
        Showing {rows.length} {tab}
      </p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "");
          router.push(href(tab, value));
        }}
      >
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name, alias, or country"
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold/50"
        />
        <button type="submit" className="rounded-lg border border-gold px-3 text-sm text-gold">
          Search
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-panel-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">HQ</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Window hits</th>
              <th className="px-3 py-2">Website</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entity) => {
              const hits = items.filter((item) => item.entities.includes(entity.id)).length;
              return (
                <tr key={entity.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-gold">{entity.rank}</td>
                  <td className="px-3 py-2">
                    <div>{entity.name}</div>
                    {entity.notes && <div className="text-xs text-muted">{entity.notes}</div>}
                  </td>
                  <td className="px-3 py-2 text-muted">{entity.hq}</td>
                  <td className="px-3 py-2 text-muted">{entity.country}</td>
                  <td className="px-3 py-2 font-mono">{hits}</td>
                  <td className="px-3 py-2">
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold underline decoration-gold/30"
                    >
                      Open
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
