"use client";

import { useMemo, useState } from "react";
import type { Entity, NewsItem, Sector } from "@/lib/types";

const TABS: Array<{ id: Sector; label: string }> = [
  { id: "banks", label: "Top 50 banks" },
  { id: "brokers", label: "Top 50 brokers" },
  { id: "crypto", label: "Top 50 crypto exchanges" },
];

export function EntityDirectory({
  entities,
  items,
  rankingNote,
}: {
  entities: Entity[];
  items: NewsItem[];
  rankingNote: Record<Sector, string>;
}) {
  const [tab, setTab] = useState<Sector>("banks");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return entities
      .filter((entity) => entity.sector === tab)
      .filter((entity) => {
        if (!query.trim()) return true;
        const hay = `${entity.name} ${entity.aliases.join(" ")} ${entity.country}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => a.rank - b.rank);
  }, [entities, query, tab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tab === entry.id ? "border-gold text-gold" : "border-line text-muted"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{rankingNote[tab]}</p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, alias, or country"
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold/50"
      />
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
                    {entity.notes && (
                      <div className="text-xs text-muted">{entity.notes}</div>
                    )}
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
