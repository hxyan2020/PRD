import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { loadCollection, type CollectionData } from "../lib/collection";
import { GameCard } from "../components/GameCard";
import { Footer } from "../components/Footer";

const PAGE_SIZE = 30;

export function CollectionPage() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    loadCollection()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  const countries = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.games.map((g) => g.originCountry))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = deferredQuery.trim().toLowerCase();
    return data.games.filter((g) => {
      if (category !== "all" && g.category !== category) return false;
      if (region !== "all" && g.originCountry !== region) return false;
      if (!q) return true;
      const hay = [
        g.name,
        g.originCountry,
        g.civilization,
        g.description,
        g.category,
        ...g.variations.map((v) => v.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, deferredQuery, category, region]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, category, region]);

  if (error) {
    return <div className="error">Could not load collection: {error}</div>;
  }

  if (!data) {
    return <div className="loading">Loading {`1000+`} toys & games…</div>;
  }

  return (
    <>
      <section className="section" style={{ paddingTop: "2.5rem" }}>
        <div className="container">
          <div className="section-head">
            <h2>Full collection</h2>
            <p>
              {data.meta.totalGames.toLocaleString()} toys and games. Same
              fundamental games are grouped with cultural variations—not split
              into duplicate entries.
            </p>
          </div>

          <div className="filters">
            <div className="field">
              <label htmlFor="q">Search</label>
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, country, civilization, variation…"
              />
            </div>
            <div className="field">
              <label htmlFor="cat">Category</label>
              <select
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All categories</option>
                {data.meta.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="region">Origin</label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="all">All origins</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setRegion("all");
              }}
            >
              Reset
            </button>
          </div>

          <div className="meta-bar">
            <span>
              Showing <strong>{filtered.length.toLocaleString()}</strong> matches
            </span>
            <span>
              Page <strong>{safePage}</strong> / {pageCount}
            </span>
          </div>

          <div className="game-grid">
            {pageItems.map((g, i) => (
              <GameCard key={g.id} game={g} index={i} />
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="pagination">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                let n = i + 1;
                if (pageCount > 7) {
                  const start = Math.max(1, Math.min(safePage - 3, pageCount - 6));
                  n = start + i;
                }
                return (
                  <button
                    key={n}
                    type="button"
                    className={n === safePage ? "active" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </section>
      <Footer total={data.meta.totalGames} />
    </>
  );
}
