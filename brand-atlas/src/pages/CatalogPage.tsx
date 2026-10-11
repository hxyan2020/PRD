import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ItemDetail } from "../components/ItemDetail";
import { ItemTile } from "../components/ItemTile";
import { ContributeUploadPanel } from "../components/ContributeUploadPanel";
import { ResourcePackPanel } from "../components/ResourcePackPanel";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { itemsForCategory } from "../lib/catalog";
import {
  categoryProgress,
  revealMode,
  sneakPeekIds,
} from "../lib/progress";
import { formatPct } from "../lib/unlocks";

const LEGACY_CATEGORY_REDIRECT: Record<string, string> = {
  liquor: "alcohol",
  wine: "alcohol",
  sake: "alcohol",
  beer: "alcohol",
  coffee: "hotdrinks",
  tea: "hotdrinks",
};

export function CatalogPage() {
  const { categoryId } = useParams();
  const { catalog, loading, error, refresh } = useCatalog();
  const { version, isUnlocked, getUnlock, updateNote, updatePhoto } = useUnlocks();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "locked" | "unlocked" | "sneak">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (categoryId && LEGACY_CATEGORY_REDIRECT[categoryId]) {
    return <Navigate to={`/catalog/${LEGACY_CATEGORY_REDIRECT[categoryId]}`} replace />;
  }

  const activeCategory = catalog?.categories.find((c) => c.id === categoryId);

  const categoryItems = useMemo(() => {
    if (!catalog) return [];
    return categoryId
      ? itemsForCategory(catalog, categoryId)
      : [...catalog.items].filter((it) => it.status !== "removed");
  }, [catalog, categoryId]);

  const peekByCategory = useMemo(() => {
    if (!catalog) return new Map<string, Set<string>>();
    const map = new Map<string, Set<string>>();
    for (const cat of catalog.categories) {
      const items = itemsForCategory(catalog, cat.id);
      map.set(cat.id, sneakPeekIds(items));
    }
    return map;
  }, [catalog, version]);

  const progress = useMemo(() => {
    if (!catalog || !categoryId) return null;
    return categoryProgress(itemsForCategory(catalog, categoryId));
  }, [catalog, categoryId, version]);

  const items = useMemo(() => {
    let list = [...categoryItems];
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
    list = list.filter((it) => {
      const peek = peekByCategory.get(it.categoryId) ?? new Set();
      const mode = revealMode(it, peek);
      if (filter === "locked") return mode === "locked";
      if (filter === "unlocked") return mode === "unlocked";
      if (filter === "sneak") return mode === "sneak";
      return true;
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryItems, query, filter, isUnlocked, peekByCategory]);

  const selected = categoryItems.find((it) => it.id === selectedId) ?? items.find((it) => it.id === selectedId);
  const selectedPeek = selected
    ? peekByCategory.get(selected.categoryId) ?? new Set()
    : new Set<string>();
  const selectedMode = selected ? revealMode(selected, selectedPeek) : "locked";
  const selectedCatPct = selected && catalog
    ? categoryProgress(itemsForCategory(catalog, selected.categoryId)).pct
    : undefined;

  return (
    <main className="shell section">
      <div className="section__head">
        <div>
          <h2>{activeCategory ? activeCategory.label : t("catalog.title")}</h2>
          <p>
            {activeCategory
              ? activeCategory.blurb
              : "Locked covers stay greyscale until you scan and confirm. Sneak peeks light colour early."}
          </p>
        </div>
        <Link className="btn btn--forest" to="/scan">
          {t("catalog.scanCta")}
        </Link>
      </div>

      {progress && (
        <div className="progress-panel">
          <div>
            <strong>{t("catalog.progress")}</strong>
            <span className="mono"> {formatPct(progress.pct)}</span>
            <span className="muted">
              {" "}
              ({progress.unlocked}/{progress.total})
            </span>
          </div>
          <div className="progress-bar" aria-hidden>
            <span style={{ width: `${Math.min(100, progress.pct)}%` }} />
          </div>
          {"sneakFraction" in progress &&
            typeof progress.sneakFraction === "number" &&
            progress.sneakFraction > 0 && (
            <p className="muted" style={{ margin: 0 }}>
              Sneak peek reward: next {formatPct(progress.sneakFraction * 100)} of this shelf
              (colour only).
            </p>
          )}
        </div>
      )}

      {activeCategory && catalog && (
        <>
          <ContributeUploadPanel
            catalog={catalog}
            category={activeCategory}
            onChanged={refresh}
          />
          <ResourcePackPanel
            catalog={catalog}
            category={activeCategory}
            onChanged={refresh}
          />
        </>
      )}

      <div className="pill-group" style={{ marginBottom: "1rem" }}>
        <Link className={`pill ${!categoryId ? "is-on" : ""}`} to="/catalog">
          {t("catalog.all")}
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
            <option value="locked">{t("catalog.locked")}</option>
            <option value="sneak">{t("catalog.sneak")}</option>
            <option value="unlocked">{t("catalog.unlocked")}</option>
          </select>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="banner banner--warn">{error}</p>}

      <div className="item-grid">
        {items.map((item) => {
          const peek = peekByCategory.get(item.categoryId) ?? new Set();
          return (
            <ItemTile
              key={item.id}
              item={item}
              mode={revealMode(item, peek)}
              onClick={() => setSelectedId(item.id)}
            />
          );
        })}
      </div>

      {!loading && !items.length && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          No items match this filter.
        </p>
      )}

      {selected && catalog && (
        <ItemDetail
          item={selected}
          categoryLabel={
            catalog.categories.find((c) => c.id === selected.categoryId)?.label ?? ""
          }
          mode={selectedMode}
          unlock={getUnlock(selected.id)}
          categoryPct={selectedCatPct}
          onClose={() => setSelectedId(null)}
          onSaveNote={(n) => updateNote(selected.id, n)}
          onSavePhoto={(p) => updatePhoto(selected.id, p)}
        />
      )}
    </main>
  );
}
