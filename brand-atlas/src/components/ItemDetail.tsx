import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { coverGradient } from "../lib/catalog";
import { identifyImage } from "../lib/identify";
import { coverUrl, markUrl } from "../lib/marks";
import { isNatureCategory } from "../lib/nature";
import { fileToSightingDataUrl } from "../lib/sightingPhoto";
import {
  formatPct,
  formatUtc,
  permanentLink,
  type UnlockRecord,
} from "../lib/unlocks";
import type { Catalog, CatalogItem } from "../types/catalog";
import { useI18n } from "../i18n/I18nProvider";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  mode: "unlocked" | "sneak" | "locked";
  unlock?: UnlockRecord;
  categoryPct?: number;
  catalog?: Catalog | null;
  onClose: () => void;
  onSaveNote?: (note: string) => void;
  onSavePhoto?: (dataUrl: string | null) => void;
  onUnlockFromSighting?: (photoDataUrl: string) => void;
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
  catalog,
  onClose,
  onSaveNote,
  onSavePhoto,
  onUnlockFromSighting,
}: Props) {
  const { t } = useI18n();
  const { isLoggedIn, email } = useAuth();
  const location = useLocation();
  const [note, setNote] = useState(unlock?.note ?? "");
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const nature = isNatureCategory(item.categoryId);

  useEffect(() => {
    setNote(unlock?.note ?? "");
    setCoverFailed(false);
    setScanError(null);
    setBusy(false);
    setPhase("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [unlock?.note, item.id]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const permalink = unlock ? permanentLink(unlock.shareId) : null;
  const mark = markUrl(item);
  const stockCover = coverFailed ? null : coverUrl(item);
  const coverPhoto =
    unlock?.photoDataUrl ||
    (nature || mode === "unlocked" ? stockCover : null);
  const showMark = Boolean(mark) && !unlock?.photoDataUrl && !coverPhoto;

  const authNext = `${location.pathname}${location.search}${location.hash}`;
  const loginHref = `/login?next=${encodeURIComponent(authNext)}&item=${encodeURIComponent(item.id)}`;

  const copyLink = async () => {
    if (!permalink) return;
    await navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onPhotoFile = (file: File | null) => {
    if (!file || !onSavePhoto) return;
    void (async () => {
      try {
        onSavePhoto(await fileToSightingDataUrl(file));
      } catch {
        /* ignore encode failures */
      }
    })();
  };

  const processSighting = async (file: File) => {
    if (!isLoggedIn) return;
    if (!catalog || !onUnlockFromSighting) {
      setScanError(t("detail.catalogMissing"));
      return;
    }
    setBusy(true);
    setScanError(null);
    setPhase(t("scan.scanning"));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const result = await identifyImage(
        file,
        catalog,
        [item.categoryId],
        (p) => setPhase(p),
      );
      if (result.status === "unclear") {
        setScanError(result.message);
        return;
      }
      const guesses = result.status === "guesses" ? result.guesses : [];
      const hit = guesses.find((g) => g.itemId === item.id);
      const top = guesses[0];
      if (!hit) {
        setScanError(
          t("detail.noMatch", {
            name: item.name,
            guess: top?.name ?? "—",
          }),
        );
        return;
      }
      const dataUrl = await fileToSightingDataUrl(file);
      onUnlockFromSighting(dataUrl);
    } catch (e) {
      setScanError(
        e instanceof Error ? e.message : t("detail.identifyFailed"),
      );
    } finally {
      setBusy(false);
      setPhase("");
    }
  };

  const onSightingFile = (file: File | null) => {
    if (!file) return;
    void processSighting(file);
  };

  const saveNote = () => {
    onSaveNote?.(note);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const showUnlockActions = mode === "locked" || mode === "sneak";

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
              onError={() => {
                if (!unlock?.photoDataUrl) setCoverFailed(true);
              }}
            />
          )}
          {showMark && mark && (
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
            <p className="muted">
              {t("catalog.locked")} · {categoryLabel}
            </p>
            <h3>{item.name}</h3>
            {item.summary ? <p>{item.summary}</p> : null}
            <p className="muted">{t("unlocked.stillLockedBlurb")}</p>
          </>
        )}

        {mode === "sneak" && (
          <>
            <p className="muted">
              {t("catalog.sneak")} · {categoryLabel}
              {categoryPct != null
                ? ` · ${t("unlocked.pctUnlocked", { pct: formatPct(categoryPct) })}`
                : ""}
            </p>
            <h3>{item.name}</h3>
            {item.summary ? <p>{item.summary}</p> : null}
            <p className="muted">{t("unlocked.sneakBlurb")}</p>
          </>
        )}

        {showUnlockActions && (
          <div className="detail-unlock">
            {!isLoggedIn ? (
              <div className="banner banner--warn detail-unlock__gate">
                <strong>{t("detail.loginRequiredTitle")}</strong>
                <p style={{ margin: "0.4rem 0 0.75rem" }}>
                  {t("detail.loginRequiredBody")}
                </p>
                <Link className="btn btn--forest" to={loginHref} onClick={onClose}>
                  {t("nav.login")}
                </Link>
              </div>
            ) : (
              <>
                <p className="muted detail-unlock__signed">
                  {t("detail.signedInAs", { email: email ?? "" })}
                </p>
                {previewUrl && (
                  <div className="detail-unlock__preview">
                    <img src={previewUrl} alt="" />
                  </div>
                )}
                <div className="cta-row detail-unlock__actions">
                  <button
                    type="button"
                    className="btn btn--forest"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                  >
                    {t("scan.upload")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    disabled={busy}
                    onClick={() => cameraFileRef.current?.click()}
                  >
                    {t("detail.takePhoto")}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    onSightingFile(e.target.files?.[0] ?? null)
                  }
                />
                <input
                  ref={cameraFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) =>
                    onSightingFile(e.target.files?.[0] ?? null)
                  }
                />
                {busy && (
                  <p className="muted" style={{ marginTop: "0.65rem" }}>
                    {phase || t("scan.scanning")}
                  </p>
                )}
                {scanError && (
                  <p className="banner banner--warn" style={{ marginTop: "0.75rem" }}>
                    {scanError}
                  </p>
                )}
              </>
            )}
          </div>
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
                {unlock.unlockedBy && (
                  <p>
                    <strong>{t("detail.recordedBy")}:</strong>{" "}
                    <span className="mono">{unlock.unlockedBy}</span>
                  </p>
                )}

                <div className="sighting-block">
                  <strong>{t("unlocked.sightingPhoto")}</strong>
                  {unlock.photoDataUrl ? (
                    <img
                      className="sighting-photo"
                      src={unlock.photoDataUrl}
                      alt=""
                    />
                  ) : (
                    <p className="muted">{t("unlocked.noSighting")}</p>
                  )}
                  <div className="cta-row" style={{ marginTop: "0.5rem" }}>
                    <label className="btn btn--quiet" style={{ display: "inline-flex" }}>
                      {unlock.photoDataUrl
                        ? t("unlocked.replacePhoto")
                        : t("unlocked.attachPhoto")}
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
                        {t("unlocked.removePhoto")}
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
                    placeholder={t("unlocked.notePlaceholder")}
                  />
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
                    {t("unlocked.noteHint")}
                  </p>
                </div>
                {permalink && (
                  <div className="permalink-box" style={{ marginTop: "0.9rem" }}>
                    <strong>{t("unlocked.permalink")}</strong>
                    <code className="permalink-url">{permalink}</code>
                  </div>
                )}

                <div className="cta-row" style={{ justifyContent: "center" }}>
                  <button type="button" className="btn btn--forest" onClick={saveNote}>
                    {savedFlash ? t("unlocked.noteSaved") : t("unlocked.saveNote")}
                  </button>
                  <button type="button" className="btn btn--quiet" onClick={() => void copyLink()}>
                    {copied ? t("unlocked.copied") : t("unlocked.share")}
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
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
