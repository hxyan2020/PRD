import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ItemDetail } from "../components/ItemDetail";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { categoryLabel } from "../i18n/labels";
import { findItem, getCategory, itemsForCategory } from "../lib/catalog";
import { coverUrl, markUrl } from "../lib/marks";
import { categoryProgress } from "../lib/progress";
import { formatUtc, type UnlockRecord } from "../lib/unlocks";
import type { CatalogItem } from "../types/catalog";

interface Group {
  categoryId: string;
  label: string;
  items: Array<{ item: CatalogItem; unlock: UnlockRecord }>;
}

export function UnlockedPage() {
  const { catalog, loading, error } = useCatalog();
  const { unlocks, count, getUnlock, updateNote, updatePhoto, version } =
    useUnlocks();
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!catalog) return [] as Group[];
    const byCat = new Map<string, Array<{ item: CatalogItem; unlock: UnlockRecord }>>();
    for (const unlock of unlocks) {
      const item = findItem(catalog, unlock.itemId);
      if (!item || item.status === "removed") continue;
      const list = byCat.get(item.categoryId) ?? [];
      list.push({ item, unlock });
      byCat.set(item.categoryId, list);
    }
    const ordered: Group[] = [];
    for (const cat of catalog.categories) {
      const list = byCat.get(cat.id);
      if (!list?.length) continue;
      list.sort((a, b) => b.unlock.unlockedAt.localeCompare(a.unlock.unlockedAt));
      ordered.push({
        categoryId: cat.id,
        label: categoryLabel(t, cat.id, cat.label),
        items: list,
      });
    }
    // Any unlocks whose category is missing from catalog.categories
    for (const [categoryId, list] of byCat) {
      if (ordered.some((g) => g.categoryId === categoryId)) continue;
      list.sort((a, b) => b.unlock.unlockedAt.localeCompare(a.unlock.unlockedAt));
      const cat = getCategory(catalog, categoryId);
      ordered.push({
        categoryId,
        label: cat ? categoryLabel(t, cat.id, cat.label) : categoryId,
        items: list,
      });
    }
    return ordered;
    // version keeps groups fresh after note/photo edits
  }, [catalog, unlocks, t, version]);

  const selected =
    catalog && selectedId
      ? (() => {
          const item = findItem(catalog, selectedId);
          if (!item) return null;
          return { item, unlock: getUnlock(item.id) };
        })()
      : null;
  const selectedCat =
    catalog && selected ? getCategory(catalog, selected.item.categoryId) : undefined;
  const selectedPct =
    catalog && selected
      ? categoryProgress(itemsForCategory(catalog, selected.item.categoryId)).pct
      : undefined;

  if (loading) {
    return (
      <main className="shell section">
        <p className="muted">{t("unlockedPage.loading")}</p>
      </main>
    );
  }

  if (error || !catalog) {
    return (
      <main className="shell section">
        <p className="muted">{error ?? t("catalog.empty")}</p>
      </main>
    );
  }

  return (
    <main className="shell section unlocked-page">
      <div className="section__head">
        <div>
          <h2>{t("unlockedPage.title")}</h2>
          <p>{t("unlockedPage.blurb")}</p>
        </div>
        <p className="mono muted unlocked-page__total">
          {t("header.unlocked", { count: String(count) })}
        </p>
      </div>

      {count === 0 ? (
        <div className="unlocked-empty">
          <p>{t("unlockedPage.empty")}</p>
          <div className="cta-row">
            <Link className="btn btn--forest" to="/scan">
              {t("unlockedPage.emptyCta")}
            </Link>
            <Link className="btn btn--quiet" to="/catalog">
              {t("nav.catalog")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="unlocked-groups">
          {groups.map((group) => (
            <section key={group.categoryId} className="unlocked-group">
              <div className="unlocked-group__head">
                <h3>
                  <Link to={`/catalog/${group.categoryId}`}>{group.label}</Link>
                </h3>
                <span className="mono muted">
                  {t("unlockedPage.countInCat", {
                    count: String(group.items.length),
                  })}
                </span>
              </div>
              <ul className="unlocked-list">
                {group.items.map(({ item, unlock }) => {
                  const thumb = unlock.photoDataUrl || coverUrl(item);
                  const mark = markUrl(item);
                  const note = (unlock.note ?? "").trim();
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="unlocked-row"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <div
                          className={`unlocked-row__thumb${thumb ? " has-cover" : ""}`}
                          style={
                            thumb
                              ? undefined
                              : {
                                  background: `linear-gradient(135deg, hsl(${item.coverHue} 35% 28%), hsl(${(item.coverHue + 40) % 360} 40% 18%))`,
                                }
                          }
                        >
                          {thumb && (
                            <img src={thumb} alt="" draggable={false} />
                          )}
                          {!unlock.photoDataUrl && mark && (
                            <img
                              className="unlocked-row__mark"
                              src={mark}
                              alt=""
                              draggable={false}
                            />
                          )}
                        </div>
                        <div className="unlocked-row__body">
                          <strong>{item.name}</strong>
                          <span className="muted">
                            {item.origin ?? group.label}
                          </span>
                          <span className="unlocked-row__when mono">
                            {t("unlocked.seenAt")}: {formatUtc(unlock.unlockedAt)}
                          </span>
                          <p className={`unlocked-row__note${note ? "" : " is-empty"}`}>
                            {note ? note : t("unlockedPage.noNote")}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selected?.item && (
        <ItemDetail
          item={selected.item}
          categoryLabel={
            selectedCat
              ? categoryLabel(t, selectedCat.id, selectedCat.label)
              : selected.item.categoryId
          }
          mode="unlocked"
          unlock={selected.unlock}
          categoryPct={selectedPct}
          onClose={() => setSelectedId(null)}
          onSaveNote={(n) => updateNote(selected.item.id, n)}
          onSavePhoto={(p) => updatePhoto(selected.item.id, p)}
        />
      )}
    </main>
  );
}
