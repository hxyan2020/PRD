import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ItemTile } from "../components/ItemTile";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { itemsForCategory } from "../lib/catalog";

export function CatalogPage() {
  const { categoryId } = useParams();
  const { catalog, loading, error } = useCatalog();
  const { isUnlocked } = useUnlocks();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "locked" | "unlocked">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCategory = catalog?.categories.find((c) => c.id === categoryId);

  const items = useMemo(() => {
    if (!catalog) return [];
    let list = categoryId
      ? itemsForCategory(catalog, categoryId)
      : [...catalog.items].filter((it) => it.status !== "removed");
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((it) => {
        const unlocked = isUnlocked(it.id);
        const hay = unlocked
          ? [it.name, ...it.aliases, it.origin ?? "", ...it.tags].join(" ").toLowerCase()
          : it.categoryId;
        return hay.includes(q) || it.categoryId.includes(q);
      });
    }
    if (filter === "locked") list = list.filter((it) => !isUnlocked(it.id));
    if (filter === "unlocked") list = list.filter((it) => isUnlocked(it.id));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, categoryId, query, filter, isUnlocked]);

  const selected = items.find((it) => it.id === selectedId);

  return (
    <main className="shell section">
      <div className="section__head">
        <div>
          <h2>{activeCategory ? activeCategory.label : "Full catalogue"}</h2>
          <p>
            {activeCategory
              ? activeCategory.blurb
              : "Locked covers stay greyscale until you scan and confirm a match."}
          </p>
        </div>
        <Link className="btn btn--forest" to="/scan">
          Scan to unlock
        </Link>
      </div>

      <div className="pill-group" style={{ marginBottom: "1rem" }}>
        <Link className={`pill ${!categoryId ? "is-on" : ""}`} to="/catalog">
          All
        </Link>
        {catalog?.categories.map((cat) => (
          <Link
            key={cat.id}
            className={`pill ${categoryId === cat.id ? "is-on" : ""}`}
            to={`/catalog/${cat.id}`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, origin, tag…"
          />
        </div>
        <div className="field" style={{ flex: "0 0 160px" }}>
          <label htmlFor="filter">Show</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All</option>
            <option value="locked">Locked</option>
            <option value="unlocked">Unlocked</option>
          </select>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="banner banner--warn">{error}</p>}

      <div className="item-grid">
        {items.map((item) => (
          <ItemTile
            key={item.id}
            item={item}
            unlocked={isUnlocked(item.id)}
            onClick={() => setSelectedId(item.id)}
          />
        ))}
      </div>

      {!loading && !items.length && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          No items match this filter.
        </p>
      )}

      {selected && (
        <div className="celebrate" role="dialog" aria-modal="true" onClick={() => setSelectedId(null)}>
          <div className="celebrate__card" onClick={(e) => e.stopPropagation()}>
            <h3>{isUnlocked(selected.id) ? selected.name : "Still locked"}</h3>
            <p className="muted">
              {isUnlocked(selected.id)
                ? selected.summary
                : "Scan a clear photo of this mark or living thing to unlock the cover."}
            </p>
            {isUnlocked(selected.id) && selected.origin && (
              <p>
                <strong>Origin:</strong> {selected.origin}
              </p>
            )}
            <div className="cta-row" style={{ justifyContent: "center", marginTop: "1rem" }}>
              {!isUnlocked(selected.id) && (
                <Link className="btn btn--primary" to="/scan">
                  Open scanner
                </Link>
              )}
              <button type="button" className="btn btn--quiet" onClick={() => setSelectedId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
