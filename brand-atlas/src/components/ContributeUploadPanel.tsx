import { useRef, useState } from "react";
import { CelebrateModal } from "./CelebrateModal";
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
  const fileRef = useRef<HTMLInputElement>(null);
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
      setError("Please choose an image file.");
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
      setError("Choose an image first.");
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
      setError(e instanceof Error ? e.message : "Contribution failed");
    } finally {
      setBusy(false);
      setProgress(1);
    }
  }

  const kindHint =
    category.kind === "nature"
      ? `For ${category.label.toLowerCase()}, the photo must clearly show that subject (e.g. a real tree for Trees).`
      : `For ${category.label.toLowerCase()}, the photo must show a relevant brand mark or product from this shelf.`;

  return (
    <section className="contribute-panel" aria-labelledby="contribute-title">
      <div className="contribute-panel__head">
        <h3 id="contribute-title">Contribute a new sighting</h3>
        <p>
          Upload a photo of something not yet on this shelf. If it already exists, we
          unlock it. If it is new and relevant, we add brand details, unlock it, and
          recalculate progress ({shelfSizeLabel}). {kindHint}
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
            aria-label="Upload photo of the uncovered brand or species"
          >
            {preview && <img src={preview} alt="Contribution preview" />}
            <div className="dropzone__hint">
              <strong>Photo of the uncovered brand or species</strong>
              <p className="muted">Must belong in {category.label}.</p>
              <p className="muted contribute-dropzone__cta">
                {preview ? "Click or drop to replace" : "Click or drop an image to upload"}
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
              Choose image
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
              Name {category.kind === "nature" ? "(species)" : "(brand)"}
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
                    : "Name shown in the photo"
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
            {busy ? "Checking…" : "Submit sighting"}
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
          <h4>Your contributions on this shelf</h4>
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
          categoryLabel={category.label}
          onClose={() => setCelebrating(null)}
        />
      )}
    </section>
  );
}
