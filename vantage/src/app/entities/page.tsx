import Link from "next/link";
import { loadBriefing, loadEntities } from "@/lib/loadData";
import type { Sector } from "@/lib/types";

const TABS: Array<{ id: Sector; label: string }> = [
  { id: "banks", label: "Top 50 banks" },
  { id: "brokers", label: "Top 50 brokers" },
  { id: "crypto", label: "Top 50 crypto exchanges" },
];

function isSector(value: string | undefined): value is Sector {
  return value === "banks" || value === "brokers" || value === "crypto";
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tab: Sector = isSector(params.sector) ? params.sector : "banks";
  const query = (params.q ?? "").trim();
  const [catalog, briefing] = await Promise.all([loadEntities(), loadBriefing()]);
  const items = briefing?.items ?? [];
  const rankingNote = {
    banks: catalog.meta.banks.ranking + ` (as of ${catalog.meta.banks.asOf}).`,
    brokers: catalog.meta.brokers.ranking + ` (as of ${catalog.meta.brokers.asOf}).`,
    crypto: catalog.meta.exchanges.ranking + ` (as of ${catalog.meta.exchanges.asOf}).`,
  };

  const rows = catalog.all
    .filter((entity) => entity.sector === tab)
    .filter((entity) => {
      if (!query) return true;
      const hay = `${entity.name} ${entity.aliases.join(" ")} ${entity.country}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .sort((a, b) => a.rank - b.rank);

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
            href={query ? `/entities?sector=${entry.id}&q=${encodeURIComponent(query)}` : `/entities?sector=${entry.id}`}
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
      <form action="/entities" method="get" className="flex gap-2">
        <input type="hidden" name="sector" value={tab} />
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
