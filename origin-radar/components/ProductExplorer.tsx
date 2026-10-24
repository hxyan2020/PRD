"use client";

import { useMemo, useState } from "react";
import type { RegionId, ScoredProduct } from "@/lib/types";
import { filterProducts, type SortKey } from "@/lib/catalog";
import { OpportunityCard } from "./OpportunityCard";

export function ProductExplorer({
  products,
  categories,
}: {
  products: ScoredProduct[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const [gap, setGap] = useState<"all" | "whitespace" | "exists">("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("score");

  const list = useMemo(
    () => filterProducts({ query, region, gap, category, sort }),
    [query, region, gap, category, sort],
  );

  return (
    <div>
      <div className="panel mb-8 grid gap-3 p-4 md:grid-cols-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, 中文, tag…"
          className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm outline-none ring-rust/40 focus:ring"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as RegionId | "all")}
          className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm"
        >
          <option value="all">All regions</option>
          <option value="na">North America</option>
          <option value="sea">Southeast Asia</option>
          <option value="eu">Europe</option>
        </select>
        <select
          value={gap}
          onChange={(e) => setGap(e.target.value as "all" | "whitespace" | "exists")}
          className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm"
        >
          <option value="all">Any market status</option>
          <option value="whitespace">Whitespace / missing</option>
          <option value="exists">Already in market</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm"
        >
          <option value="score">Sort: opportunity</option>
          <option value="gap">Sort: market gap</option>
          <option value="margin">Sort: margin</option>
          <option value="social">Sort: social heat</option>
          <option value="search">Sort: search demand</option>
        </select>
      </div>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
        {list.length} of {products.length} signals
      </p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <OpportunityCard key={p.slug} product={p} />
        ))}
      </div>
      {list.length === 0 ? (
        <p className="panel mt-6 p-8 text-center text-mist">No products match those filters.</p>
      ) : null}
    </div>
  );
}
