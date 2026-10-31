import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CelebrateModal } from "../components/CelebrateModal";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { categoryLabel } from "../i18n/labels";
import { findItem, getCategory } from "../lib/catalog";
import { identifyImage } from "../lib/identify";
import { fileToSightingDataUrl } from "../lib/sightingPhoto";
import type { CatalogItem, Guess, IdentifyResult } from "../types/catalog";

export function ScanPage() {
  const { catalog, loading, error } = useCatalog();
  const { unlock } = useUnlocks();
  const { t } = useI18n();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<CatalogItem | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allSelected = selectedCats.length === 0;

  const categoryOptions = catalog?.categories ?? [];

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setResult({
        status: "unclear",
        message:
          "Camera access was blocked. Upload an image instead, or allow camera permission and retry.",
      });
    }
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setPicked(null);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], "capture.jpg", { type: "image/jpeg" });
        onFile(f);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const runIdentify = async () => {
    if (!catalog || !file) return;
    setBusy(true);
    setResult(null);
    setPicked(null);
    setPhase("Starting…");
    setProgress(0);
    try {
      const res = await identifyImage(
        file,
        catalog,
        selectedCats,
        (p, prog) => {
          setPhase(p);
          setProgress(prog);
        },
      );
      setResult(res);
      if (res.status === "guesses" && res.guesses.length === 1) {
        setPicked(res.guesses[0].itemId);
      }
    } catch (e) {
      setResult({
        status: "unclear",
        message:
          e instanceof Error
            ? e.message
            : "Identification failed. Try a clearer logo shot.",
      });
    } finally {
      setBusy(false);
      setProgress(1);
    }
  };

  const confirmGuess = async () => {
    if (!catalog || !picked || confirmBusy) return;
    const item = findItem(catalog, picked);
    if (!item) {
      setConfirmError(t("scan.confirmMissing"));
      return;
    }
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      let photoDataUrl: string | null = null;
      if (file) {
        try {
          photoDataUrl = await fileToSightingDataUrl(file);
        } catch {
          photoDataUrl = null;
        }
      }
      try {
        unlock(item.id, { method: "scan", photoDataUrl });
      } catch {
        // Storage may still reject a large photo — unlock without the image.
        unlock(item.id, { method: "scan", photoDataUrl: null });
      }
      setCelebrating(item);
    } catch (e) {
      setConfirmError(
        e instanceof Error ? e.message : t("scan.confirmFailed"),
      );
    } finally {
      setConfirmBusy(false);
    }
  };

  const guesses: Guess[] = useMemo(
    () => (result?.status === "guesses" ? result.guesses : []),
    [result],
  );

  return (
    <main className="shell section">
      <div className="section__head">
        <div>
          <h2>{t("scan.title")}</h2>
          <p>{t("scan.blurb")}</p>
        </div>
      </div>

      {loading && <p className="muted">{t("scan.loading")}</p>}
      {error && <p className="banner banner--warn">{error}</p>}

      <div style={{ marginBottom: "1rem" }}>
        <p className="muted" style={{ marginBottom: "0.5rem" }}>
          {t("scan.categoriesHint")}
        </p>
        <div className="pill-group">
          <button
            type="button"
            className={`pill ${allSelected ? "is-on" : ""}`}
            onClick={() => setSelectedCats([])}
          >
            {t("scan.allCategories")}
          </button>
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pill ${selectedCats.includes(cat.id) ? "is-on" : ""}`}
              onClick={() => toggleCat(cat.id)}
            >
              {categoryLabel(t, cat.id, cat.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="scan-panel">
        <div>
          <div className={`dropzone ${(previewUrl || cameraOn) ? "has-media" : ""}`}>
            {cameraOn && <video ref={videoRef} playsInline muted autoPlay />}
            {!cameraOn && previewUrl && <img src={previewUrl} alt="" />}
            <div className="dropzone__hint">
              <strong>{t("scan.dropHint")}</strong>
              <p className="muted">{t("scan.dropSub")}</p>
            </div>
          </div>

          <div className="cta-row" style={{ marginTop: "0.9rem" }}>
            <button type="button" className="btn btn--forest" onClick={() => fileRef.current?.click()}>
              {t("scan.upload")}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => (cameraOn ? stopCamera() : void startCamera())}
            >
              {cameraOn ? t("scan.stopCamera") : t("scan.camera")}
            </button>
            {cameraOn && (
              <button type="button" className="btn btn--primary" onClick={captureFromCamera}>
                {t("scan.capture")}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {file && (
            <button
              type="button"
              className="btn btn--primary"
              style={{ marginTop: "0.9rem", width: "100%" }}
              disabled={busy || !catalog}
              onClick={() => void runIdentify()}
            >
              {busy ? t("scan.scanning") : t("scan.identify")}
            </button>
          )}

          {file && busy && (
            <div>
              <p className="muted">{phase}</p>
              <div className="progress-bar" aria-hidden>
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        <div>
          {!result && !busy && (
            <div className="banner">{t("scan.tip")}</div>
          )}

          {result?.status === "unclear" && (
            <div className="banner banner--warn">
              <strong>{t("scan.needClearer")}</strong>
              <p style={{ margin: "0.4rem 0 0" }}>{result.message}</p>
              {selectedCats.length === 1 && (
                <p style={{ margin: "0.65rem 0 0" }}>
                  {t("scan.notInCatalogue")}{" "}
                  <Link to={`/catalog/${selectedCats[0]}`}>
                    {t("scan.contributeLink")}
                  </Link>{" "}
                  {t("scan.contributeOnly")}
                </p>
              )}
            </div>
          )}

          {result?.status === "guesses" && (
            <>
              <div className="banner banner--ok">
                <strong>{result.message}</strong>
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  {t("scan.guessesMeta")}
                </p>
              </div>
              <div className="guess-list">
                {guesses.map((g) => (
                  <button
                    key={g.itemId}
                    type="button"
                    className={`guess ${picked === g.itemId ? "is-selected" : ""}`}
                    onClick={() => setPicked(g.itemId)}
                  >
                    <div>
                      <strong>{g.name}</strong>
                      <div className="muted">{g.categoryLabel}</div>
                    </div>
                    <div className="confidence">{g.confidence}%</div>
                    <div className="guess__meta">{g.reason}</div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--forest"
                style={{ marginTop: "0.9rem", width: "100%" }}
                disabled={!picked || confirmBusy}
                onClick={() => void confirmGuess()}
              >
                {confirmBusy ? t("scan.confirming") : t("scan.confirm")}
              </button>
              {confirmError && (
                <div className="banner banner--warn" style={{ marginTop: "0.75rem" }}>
                  {confirmError}
                </div>
              )}
              <p className="muted" style={{ marginTop: "0.7rem" }}>
                {t("scan.wrongSet")}{" "}
                <button
                  type="button"
                  className="btn btn--quiet"
                  onClick={() => {
                    setResult(null);
                    setPicked(null);
                    setConfirmError(null);
                  }}
                >
                  {t("scan.tryAnother")}
                </button>
              </p>
            </>
          )}

          <p className="muted" style={{ marginTop: "1.2rem" }}>
            {t("scan.afterConfirm")}{" "}
            <Link to="/unlocked">{t("scan.seeUnlocks")}</Link>.
          </p>
        </div>
      </div>

      {celebrating && catalog && (
        <CelebrateModal
          item={celebrating}
          categoryLabel={categoryLabel(
            t,
            celebrating.categoryId,
            getCategory(catalog, celebrating.categoryId)?.label ?? "",
          )}
          onClose={() => setCelebrating(null)}
        />
      )}
    </main>
  );
}
