import { useEffect, useState } from "react";
import { coverGradient } from "../lib/catalog";
import { coverUrl, markUrl } from "../lib/marks";
import {
  formatPct,
  formatUtc,
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
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setNote(unlock?.note ?? "");
  }, [unlock?.note, item.id]);

  const permalink = unlock ? permanentLink(unlock.shareId) : null;
  const mark = markUrl(item);
  const stockCover = coverUrl(item);
  const coverPhoto = unlock?.photoDataUrl || stockCover;

  const copyLink = async () => {
    if (!permalink) return;
    await navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onPhotoFile = (file: File | null) => {
    if (!file || !onSavePhoto) return;
    const reader = new FileReader();
    reader.onload = () => onSavePhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveNote = () => {
    onSaveNote?.(note);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div className="celebrate" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="celebrate__card detail-card" onClick={(e) => e.stopPropagation()}>
        <div
          className={`detail-cover is-${mode}${coverPhoto ? " has-cover" : ""}`}
          style={{
            background: coverPhoto
              ? undefined
              : coverGradient(item.coverHue, mode !== "locked"),
          }}
        >
          {coverPhoto && (
            <img
              className="detail-cover__photo"
              src={coverPhoto}
              alt=""
              draggable={false}
            />
          )}
          {mark && !unlock?.photoDataUrl && (
            <img
              className={`detail-cover__mark${coverPhoto ? " detail-cover__mark--overlay" : ""}`}
              src={mark}
              alt=""
              draggable={false}
            />
          )}
        </div>

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
                  <span className="mono">{formatUtc(unlock.unlockedAt)}</span>
                </p>

                <div className="sighting-block">
                  <strong>Your sighting photo</strong>
                  {unlock.photoDataUrl ? (
                    <img
                      className="sighting-photo"
                      src={unlock.photoDataUrl}
                      alt="Your sighting"
                    />
                  ) : (
                    <p className="muted">No sighting photo attached yet.</p>
                  )}
                  <div className="cta-row" style={{ marginTop: "0.5rem" }}>
                    <label className="btn btn--quiet" style={{ display: "inline-flex" }}>
                      {unlock.photoDataUrl ? "Replace photo" : "Attach photo"}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        hidden
                        onChange={(e) => onPhotoFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {unlock.photoDataUrl && (
                      <button
                        type="button"
                        className="btn btn--quiet"
                        onClick={() => onSavePhoto?.(null)}
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="field" style={{ marginTop: "0.9rem" }}>
                  <label htmlFor="note">{t("unlocked.note")}</label>
                  <textarea
                    id="note"
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => {
                      if (note !== (unlock.note ?? "")) saveNote();
                    }}
                    placeholder="Where you took the photo, what stood out, who you were with…"
                  />
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
                    Edit anytime — saves when you leave the field or tap Save.
                  </p>
                </div>
                {permalink && (
                  <div className="permalink-box" style={{ marginTop: "0.9rem" }}>
                    <strong>Permanent link</strong>
                    <code className="permalink-url">{permalink}</code>
                  </div>
                )}

                <div className="cta-row" style={{ justifyContent: "center" }}>
                  <button type="button" className="btn btn--forest" onClick={saveNote}>
                    {savedFlash ? "Saved" : t("unlocked.saveNote")}
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
