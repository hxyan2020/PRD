import { useRef, useState } from "react";
import { CelebrateModal } from "./CelebrateModal";
import { useI18n } from "../i18n/I18nProvider";
import { categoryLabel } from "../i18n/labels";
import { contributeSighting } from "../lib/contributeSighting";
import { listContributions } from "../lib/contributions";
import { categoryProgress } from "../lib/progress";
import { itemsForCategory } from "../lib/catalog";
import { formatPct } from "../lib/unlocks";
import type { Catalog, CatalogCategory, CatalogItem } from "../types/catalog";

interface Props {
  catalog: Catalog;
  category: CatalogCategory;
  onChanged: () => void;
}

export function ContributeUploadPanel({ catalog, category, onChanged }: Props) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const catName = categoryLabel(t, category.id, category.label);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<CatalogItem | null>(null);

  const shelfItems = itemsForCategory(catalog, category.id);
  const shelfProgress = categoryProgress(shelfItems);
  const contribs = listContributions(category.id);
  // Keep copy in sync with live shelf size after successful adds
  const shelfSizeLabel = `${shelfProgress.unlocked}/${shelfProgress.total} · ${formatPct(shelfProgress.pct)} · ${category.itemCount} on shelf`;

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("contribute.needImageFile"));
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setStatus(null);
  };

  const openPicker = () => {
    if (busy) return;
    fileRef.current?.click();
  };

  async function onSubmit() {
    if (!file) {
      setError(t("contribute.needImage"));
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    setPhase("Starting…");
    setProgress(0);
    try {
      const result = await contributeSighting({
        file,
        categoryId: category.id,
        catalog,
        name: name.trim() || undefined,
        onProgress: (p, prog) => {
          setPhase(p);
          setProgress(prog);
        },
      });
      if (result.status === "rejected") {
        setError(result.message);
      } else {
        setStatus(result.message);
        setCelebrating(result.item);
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setName("");
        onChanged();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("contribute.failed"));
    } finally {
      setBusy(false);
      setProgress(1);
    }
  }

  const kindHint =
    category.kind === "nature"
      ? t("contribute.hintNature", { category: catName })
      : t("contribute.hintBrand", { category: catName });

  return (
    <section className="contribute-panel" aria-labelledby="contribute-title">
      <div className="contribute-panel__head">
        <h3 id="contribute-title">{t("contribute.title")}</h3>
        <p>
          {t("contribute.blurb", { stats: shelfSizeLabel })} {kindHint}
        </p>
      </div>

      <div className="contribute-panel__grid">
        <div>
          <button
            type="button"
            className={`dropzone contribute-dropzone contribute-dropzone--button ${preview ? "has-media" : ""}`}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.add("is-dragover");
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("is-dragover");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove("is-dragover");
              const dropped = e.dataTransfer.files?.[0] ?? null;
              onPick(dropped);
            }}
            disabled={busy}
            aria-label={t("contribute.uploadAria")}
          >
            {preview && <img src={preview} alt="" />}
            <div className="dropzone__hint">
              <strong>{t("contribute.photoLabel")}</strong>
              <p className="muted">{t("contribute.mustBelong", { category: catName })}</p>
              <p className="muted contribute-dropzone__cta">
                {preview ? t("contribute.clickReplace") : t("contribute.clickUpload")}
              </p>
            </div>
          </button>
          <div className="cta-row" style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn btn--forest"
              onClick={openPicker}
              disabled={busy}
            >
              {t("contribute.chooseImage")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                onPick(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="contribute-panel__form">
          <div className="field">
            <label htmlFor={`contrib-name-${category.id}`}>
              {category.kind === "nature"
                ? t("contribute.nameSpecies")
                : t("contribute.nameBrand")}
            </label>
            <input
              id={`contrib-name-${category.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                category.id === "trees"
                  ? "e.g. Ginkgo"
                  : category.id === "cars"
                    ? "e.g. Hongqi"
                    : catName
              }
            />
          </div>
          <button
            type="button"
            className="btn btn--primary"
            style={{ width: "100%" }}
            disabled={busy || !file}
            onClick={() => void onSubmit()}
          >
            {busy ? t("contribute.checking") : t("contribute.submit")}
          </button>
          {busy && (
            <div style={{ marginTop: "0.7rem" }}>
              <p className="muted">{phase}</p>
              <div className="progress-bar" aria-hidden>
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}
          {error && <p className="banner banner--warn">{error}</p>}
          {status && <p className="banner banner--ok">{status}</p>}
        </div>
      </div>

      {contribs.length > 0 && (
        <div className="contribute-panel__list">
          <h4>{t("contribute.listTitle")}</h4>
          <ul>
            {contribs.map((c) => (
              <li key={c.id}>
                <strong>{c.item.name}</strong>
                <span className="muted">
                  {" "}
                  · verified via {c.verifiedAs} ·{" "}
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {celebrating && (
        <CelebrateModal
          item={celebrating}
          categoryLabel={catName}
          onClose={() => setCelebrating(null)}
        />
      )}
    </section>
  );
}
