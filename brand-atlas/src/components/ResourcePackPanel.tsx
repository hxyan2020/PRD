import { useMemo, useState } from "react";
import {
  discoverResourcePack,
  packTitle,
} from "../lib/discoverPack";
import { interestSpecFor } from "../lib/interestTraits";
import {
  addResourcePack,
  listResourcePacks,
  removeResourcePack,
  type InterestSelection,
  type PackCandidate,
} from "../lib/resourcePacks";
import type { Catalog, CatalogCategory } from "../types/catalog";
import { useI18n } from "../i18n/I18nProvider";
import { formatPct } from "../lib/unlocks";
import { categoryProgress } from "../lib/progress";
import { itemsForCategory } from "../lib/catalog";

interface Props {
  catalog: Catalog;
  category: CatalogCategory;
  onChanged: () => void;
}

export function ResourcePackPanel({ catalog, category, onChanged }: Props) {
  const { t } = useI18n();
  const interestSpec = interestSpecFor(category.id);
  const [traits, setTraits] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<PackCandidate[] | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const packs = useMemo(
    () => listResourcePacks(category.id),
    // Remesh when shelf grows via packs / contributions
    [category.id, catalog.meta.itemCount, category.itemCount],
  );
  const shelfItems = itemsForCategory(catalog, category.id);
  const progress = categoryProgress(shelfItems);

  if (!interestSpec) {
    return (
      <section className="resource-pack" aria-labelledby="resource-pack-title">
        <div className="resource-pack__head">
          <div>
            <h3 id="resource-pack-title">{t("pack.title")}</h3>
            <p>{t("pack.unavailable")}</p>
          </div>
        </div>
      </section>
    );
  }
  const spec = interestSpec;

  const interests: InterestSelection = { traits, note: note.trim() || undefined };

  function toggleTrait(fieldId: string, optionId: string) {
    setTraits((prev) => {
      const cur = prev[fieldId] ?? [];
      const next = cur.includes(optionId)
        ? cur.filter((x) => x !== optionId)
        : [...cur, optionId];
      return { ...prev, [fieldId]: next };
    });
    setPreview(null);
    setStatus(null);
    setError(null);
  }

  function toggleCandidate(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function onSearch() {
    setBusy(true);
    setError(null);
    setStatus(null);
    setPreview(null);
    try {
      const result = await discoverResourcePack({
        categoryId: category.id,
        interests,
        catalog,
        limit: 14,
      });
      setQueries(result.queries);
      setPreview(result.candidates);
      setSelected(new Set(result.candidates.map((c) => c.slug)));
      setStatus(result.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("pack.failedDiscover"));
    } finally {
      setBusy(false);
    }
  }

  function onAddPack() {
    if (!preview?.length) return;
    const chosen = preview.filter((c) => selected.has(c.slug));
    if (!chosen.length) {
      setError(t("pack.selectOne"));
      return;
    }
    try {
      const pack = addResourcePack({
        categoryId: category.id,
        title: packTitle(category.label, interests, spec),
        interests,
        candidates: chosen,
        catalog,
      });
      setPreview(null);
      setStatus(
        `Resource pack added: ${pack.items.length} item${pack.items.length === 1 ? "" : "s"}. Progress recalculated for this shelf.`,
      );
      setSelected(new Set());
      onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("pack.failedAdd"));
    }
  }

  function onRemove(packId: string) {
    removeResourcePack(packId);
    onChanged();
  }

  const anyTrait = Object.values(traits).some((v) => v.length > 0) || Boolean(note.trim());
  const statsLabel = `${progress.unlocked}/${progress.total} · ${formatPct(progress.pct)} · ${category.itemCount}`;

  return (
    <section className="resource-pack" aria-labelledby="resource-pack-title">
      <div className="resource-pack__head">
        <div>
          <h3 id="resource-pack-title">{t("pack.title")}</h3>
          <p>{t("pack.blurb", { stats: statsLabel })}</p>
        </div>
      </div>

      <div className="resource-pack__fields">
        {spec.fields.map((field) => (
          <div key={field.id} className="resource-pack__field">
            <div className="resource-pack__field-label">
              <strong>{field.label}</strong>
              <span className="muted">{field.hint}</span>
            </div>
            <div className="pill-group">
              {field.options.map((opt) => {
                const on = (traits[field.id] ?? []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pill ${on ? "is-on" : ""}`}
                    onClick={() => toggleTrait(field.id, opt.id)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="field">
          <label htmlFor={`pack-note-${category.id}`}>{t("pack.note")}</label>
          <input
            id={`pack-note-${category.id}`}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setPreview(null);
            }}
            placeholder={t("pack.notePlaceholder")}
          />
        </div>
      </div>

      <div className="resource-pack__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !anyTrait}
          onClick={() => void onSearch()}
        >
          {busy ? t("contribute.checking") : t("pack.discover")}
        </button>
        {preview && preview.length > 0 && (
          <button type="button" className="btn btn--forest" onClick={onAddPack}>
            {t("pack.add", { count: String(selected.size) })}
          </button>
        )}
      </div>

      {error && <p className="banner banner--warn">{error}</p>}
      {status && <p className="banner banner--ok">{status}</p>}

      {queries.length > 0 && (
        <p className="muted resource-pack__queries">
          {t("pack.queries", { queries: queries.slice(0, 3).join(" · ") })}
          {queries.length > 3 ? "…" : ""}
        </p>
      )}

      {preview && preview.length > 0 && (
        <div className="resource-pack__preview">
          <h4>Discovered candidates</h4>
          <ul>
            {preview.map((c) => (
              <li key={c.slug}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(c.slug)}
                    onChange={() => toggleCandidate(c.slug)}
                  />
                  <span>
                    <strong>{c.name}</strong>
                    {c.origin ? <em> · {c.origin}</em> : null}
                    <small>{c.summary.slice(0, 120)}{c.summary.length > 120 ? "…" : ""}</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {packs.length > 0 && (
        <div className="resource-pack__installed">
          <h4>{t("pack.yourPacks")}</h4>
          <ul>
            {packs.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.title}</strong>
                  <small className="muted">
                    {" "}
                    {p.items.length} · {new Date(p.createdAt).toLocaleString()}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn--quiet btn--tiny"
                  onClick={() => onRemove(p.id)}
                >
                  {t("pack.remove")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
