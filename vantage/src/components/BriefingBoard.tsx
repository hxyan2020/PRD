"use client";

import { useMemo, useState } from "react";
import { formatRange } from "@/lib/format";
import type { Briefing, Entity, NewsCategory, RiskTool, Sector } from "@/lib/types";
import { NewsCard } from "./NewsCard";

const CATEGORIES: Array<{ id: "all" | NewsCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "listing", label: "Listings" },
  { id: "product", label: "Features" },
  { id: "regulation", label: "Regulation" },
  { id: "risk_tools", label: "Risk tools" },
];

const SECTORS: Array<{ id: "all" | Sector; label: string }> = [
  { id: "all", label: "All sectors" },
  { id: "banks", label: "Banks" },
  { id: "brokers", label: "Brokers" },
  { id: "crypto", label: "Crypto" },
];

export function BriefingBoard({
  briefing,
  entities,
  tools,
  title = "Daily briefing",
  forceCategory,
}: {
  briefing: Briefing;
  entities: Entity[];
  tools: RiskTool[];
  title?: string;
  forceCategory?: NewsCategory;
}) {
  const [category, setCategory] = useState<"all" | NewsCategory>(
    forceCategory ?? "all",
  );
  const [sector, setSector] = useState<"all" | Sector>("all");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    return briefing.items.filter((item) => {
      if (forceCategory && item.category !== forceCategory) return false;
      if (!forceCategory && category !== "all" && item.category !== category) {
        return false;
      }
      if (sector !== "all" && !item.sectors.includes(sector)) return false;
      if (query.trim()) {
        const hay = `${item.caption} ${item.keyPoints.join(" ")} ${item.jurisdictions.join(" ")}`.toLowerCase();
        if (!hay.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [briefing.items, category, forceCategory, query, sector]);

  const counts = {
    listing: briefing.items.filter((item) => item.category === "listing").length,
    product: briefing.items.filter((item) => item.category === "product").length,
    regulation: briefing.items.filter((item) => item.category === "regulation").length,
    risk_tools: briefing.items.filter((item) => item.category === "risk_tools").length,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-panel-2 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
              {briefing.meta.windowKind === "weekend"
                ? "Monday weekend report"
                : "Daily scan"}
            </p>
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-muted">
              {briefing.meta.windowLabel}: {formatRange(briefing.meta.windowStart, briefing.meta.windowEnd)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-muted sm:grid-cols-4">
            <div>
              <dt>Items</dt>
              <dd className="text-paper">{briefing.meta.itemCount}</dd>
            </div>
            <div>
              <dt>Healthy sources</dt>
              <dd className="text-ok">{briefing.meta.sourceStats.healthy}/{briefing.meta.sourceStats.total}</dd>
            </div>
            <div>
              <dt>Degraded</dt>
              <dd className="text-warn">{briefing.meta.sourceStats.degraded}</dd>
            </div>
            <div>
              <dt>Down</dt>
              <dd className="text-down">{briefing.meta.sourceStats.down}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 font-mono text-xs text-muted">
          Last sourced {new Date(briefing.meta.generatedAt).toISOString()} · Listings {counts.listing} · Features {counts.product} · Regulation {counts.regulation} · Risk tools {counts.risk_tools}
        </p>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {!forceCategory && (
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setCategory(entry.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  category === entry.id
                    ? "border-gold text-gold"
                    : "border-line text-muted"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSector(entry.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                sector === entry.id
                  ? "border-gold text-gold"
                  : "border-line text-muted"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by caption, key point, or jurisdiction"
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none placeholder:text-muted focus:border-gold/50"
      />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          No items in this window match the current filters. Sources still ran;
          check Sources & health for feed status.
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
