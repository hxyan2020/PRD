import { useEffect, useState } from "react";
import { coverGradient } from "../lib/catalog";
import {
  formatPct,
  permanentLink,
  type UnlockRecord,
} from "../lib/unlocks";
import type { CatalogItem } from "../types/catalog";
import { useI18n } from "../i18n/I18nProvider";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  mode: "unlocked" | "sneak" | "locked";
  unlock?: UnlockRecord;
  categoryPct?: number;
  onClose: () => void;
  onSaveNote?: (note: string) => void;
  onSavePhoto?: (dataUrl: string | null) => void;
}

const FACT_LABELS: Record<string, string> = {
  established: "Established",
  founded: "Founded",
  introduced: "Introduced",
  headquarters: "Headquarters",
  origin: "Origin",
  knownFor: "Known for",
  house: "House",
  style: "Style",
  specialty: "Specialty",
  signature: "Signature",
  species: "Species",
  habitat: "Habitat",
  harvest: "Harvest / season",
  bloom: "Bloom",
  class: "Class",
  category: "Category",
  note: "Note",
  story: "Introduction",
};

export function ItemDetail({
  item,
  categoryLabel,
  mode,
  unlock,
  categoryPct,
  onClose,
  onSaveNote,
  onSavePhoto,
}: Props) {
  const { t } = useI18n();
  const [note, setNote] = useState(unlock?.note ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNote(unlock?.note ?? "");
  }, [unlock?.note, item.id]);

  const copyLink = async () => {
    if (!unlock) return;
    const url = permanentLink(unlock.shareId);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onPhotoFile = (file: File | null) => {
    if (!file || !onSavePhoto) return;
    const reader = new FileReader();
    reader.onload = () => onSavePhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="celebrate" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="celebrate__card detail-card" onClick={(e) => e.stopPropagation()}>
        <div
          className="detail-cover"
          style={{ background: coverGradient(item.coverHue, mode !== "locked") }}
        />

        {mode === "locked" && (
          <>
            <h3>Still locked</h3>
            <p className="muted">
              Scan a clear photo of this mark or living thing to unlock the cover.
            </p>
          </>
        )}

        {mode === "sneak" && (
          <>
            <p className="muted">
              {t("catalog.sneak")} · {categoryLabel}
              {categoryPct != null ? ` · ${formatPct(categoryPct)} unlocked` : ""}
            </p>
            <h3>Colour preview</h3>
            <p className="muted">
              Image is lit up as a reward for your category progress. Name and facts stay
              hidden until you upload a matching sighting.
            </p>
          </>
        )}

        {mode === "unlocked" && (
          <>
            <p className="muted">
              {categoryLabel}
              {categoryPct != null ? ` · ${formatPct(categoryPct)}` : ""}
            </p>
            <h3>{item.name}</h3>
            <p>{item.summary}</p>

            <dl className="fact-list">
              {Object.entries(item.facts ?? {}).map(([k, v]) => (
                <div key={k}>
                  <dt>{FACT_LABELS[k] ?? k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            {unlock && (
              <div className="unlock-meta">
                <p>
                  <strong>{t("unlocked.seenAt")}:</strong>{" "}
                  <span className="mono">{unlock.unlockedAt}</span>
                </p>

                {unlock.photoDataUrl ? (
                  <img
                    className="sighting-photo"
                    src={unlock.photoDataUrl}
                    alt="Your sighting"
                  />
                ) : (
                  <p className="muted">No sighting photo attached yet.</p>
                )}

                <label className="btn btn--quiet" style={{ display: "inline-flex" }}>
                  Attach / replace photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="field" style={{ marginTop: "0.8rem" }}>
                  <label htmlFor="note">{t("unlocked.note")}</label>
                  <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Where you saw it, what stood out…"
                  />
                </div>
                <div className="cta-row" style={{ justifyContent: "center" }}>
                  <button
                    type="button"
                    className="btn btn--forest"
                    onClick={() => onSaveNote?.(note)}
                  >
                    {t("unlocked.saveNote")}
                  </button>
                  <button type="button" className="btn btn--quiet" onClick={() => void copyLink()}>
                    {copied ? "Copied!" : t("unlocked.share")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          className="btn btn--quiet"
          style={{ marginTop: "1rem" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
