import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ItemDetail } from "../components/ItemDetail";
import { ItemTile } from "../components/ItemTile";
import { ContributeUploadPanel } from "../components/ContributeUploadPanel";
import { ResourcePackPanel } from "../components/ResourcePackPanel";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { categoryLabel } from "../i18n/labels";
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

type ShelfTab = "contribute" | "add" | "catalogue";

export function CatalogPage() {
  const { categoryId } = useParams();
  const { catalog, loading, error, refresh, packVersion } = useCatalog();
  const { version, isUnlocked, getUnlock, updateNote, updatePhoto } = useUnlocks();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "locked" | "unlocked" | "sneak">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shelfTab, setShelfTab] = useState<ShelfTab>("catalogue");

  useEffect(() => {
    setShelfTab("catalogue");
    setQuery("");
    setFilter("all");
    setSelectedId(null);
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) return;
    const active = document.querySelector<HTMLElement>(
      `.pill-group .pill.is-on`,
    );
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [categoryId]);

  /** After contribute / resource-pack success: remesh stats and show the live shelf. */
  const handleShelfChanged = () => {
    refresh();
    setShelfTab("catalogue");
  };

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
  }, [catalog, version, packVersion]);

  const progress = useMemo(() => {
    if (!catalog || !categoryId) return null;
    return categoryProgress(itemsForCategory(catalog, categoryId));
    // version: unlocks; packVersion: contributions / resource packs
  }, [catalog, categoryId, version, packVersion]);

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
          <h2>
            {activeCategory
              ? categoryLabel(t, activeCategory.id, activeCategory.label)
              : t("catalog.title")}
          </h2>
          <p>
            {activeCategory
              ? activeCategory.blurb
              : t("catalog.blurbDefault")}
          </p>
        </div>
        <Link className="btn btn--forest" to="/scan">
          {t("catalog.scanCta")}
        </Link>
      </div>

      {progress && (
        <div className="progress-panel" data-total={progress.total} data-unlocked={progress.unlocked}>
          <div>
            <strong>{t("catalog.progress")}</strong>
            <span className="mono"> {formatPct(progress.pct)}</span>
            <span className="muted">
              {" "}
              ({progress.unlocked}/{progress.total}
              {activeCategory
                ? ` · ${t("catalog.onShelf", { count: String(activeCategory.itemCount) })}`
                : ""}
              )
            </span>
          </div>
          <div className="progress-bar" aria-hidden>
            <span style={{ width: `${Math.min(100, progress.pct)}%` }} />
          </div>
          {"sneakFraction" in progress &&
            typeof progress.sneakFraction === "number" &&
            progress.sneakFraction > 0 && (
            <p className="muted" style={{ margin: 0 }}>
              {t("catalog.sneakReward", {
                pct: formatPct(progress.sneakFraction * 100),
              })}
            </p>
          )}
        </div>
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
            {categoryLabel(t, cat.id, cat.label)}
          </Link>
        ))}
      </div>

      {activeCategory && catalog && (
        <div
          className="shelf-tabs"
          role="tablist"
          aria-label={categoryLabel(t, activeCategory.id, activeCategory.label)}
        >
          {(
            [
              ["contribute", t("catalog.tabContribute")],
              ["add", t("catalog.tabAdd")],
              ["catalogue", t("catalog.tabCatalogue")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`shelf-tab-${id}`}
              aria-selected={shelfTab === id}
              aria-controls={`shelf-panel-${id}`}
              className={`shelf-tabs__tab ${shelfTab === id ? "is-on" : ""}`}
              onClick={() => setShelfTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activeCategory && catalog && shelfTab === "contribute" && (
        <div
          className="shelf-tabs__panel"
          role="tabpanel"
          id="shelf-panel-contribute"
          aria-labelledby="shelf-tab-contribute"
        >
          <ContributeUploadPanel
            catalog={catalog}
            category={activeCategory}
            onChanged={handleShelfChanged}
          />
        </div>
      )}

      {activeCategory && catalog && shelfTab === "add" && (
        <div
          className="shelf-tabs__panel"
          role="tabpanel"
          id="shelf-panel-add"
          aria-labelledby="shelf-tab-add"
        >
          <ResourcePackPanel
            catalog={catalog}
            category={activeCategory}
            onChanged={handleShelfChanged}
          />
        </div>
      )}

      {(!activeCategory || shelfTab === "catalogue") && (
        <div
          className="shelf-tabs__panel"
          role={activeCategory ? "tabpanel" : undefined}
          id={activeCategory ? "shelf-panel-catalogue" : undefined}
          aria-labelledby={activeCategory ? "shelf-tab-catalogue" : undefined}
        >
          <div className="toolbar">
            <div className="field">
              <label htmlFor="q">{t("catalog.search")}</label>
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("catalog.searchPlaceholder")}
              />
            </div>
            <div className="field" style={{ flex: "0 0 160px" }}>
              <label htmlFor="filter">{t("catalog.show")}</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
              >
                <option value="all">{t("catalog.all")}</option>
                <option value="locked">{t("catalog.locked")}</option>
                <option value="sneak">{t("catalog.sneak")}</option>
                <option value="unlocked">{t("catalog.unlocked")}</option>
              </select>
            </div>
          </div>

          {loading && <p className="muted">{t("catalog.loading")}</p>}
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
              {t("catalog.empty")}
            </p>
          )}
        </div>
      )}

      {selected && catalog && (
        <ItemDetail
          item={selected}
          categoryLabel={categoryLabel(
            t,
            selected.categoryId,
            catalog.categories.find((c) => c.id === selected.categoryId)?.label ?? "",
          )}
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
