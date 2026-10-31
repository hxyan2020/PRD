import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CelebrateModal } from "../components/CelebrateModal";
import { ExpandablePhoto } from "../components/ExpandablePhoto";
import { useCatalog } from "../hooks/useCatalog";
import { useUnlocks } from "../hooks/useUnlocks";
import { useI18n } from "../i18n/I18nProvider";
import { unclearDetailKey } from "../i18n/identifyCopy";
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<CatalogItem | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setCameraStarting(false);
  };

  // Attach the stream after <video> mounts — rAF in startCamera often ran too early.
  useEffect(() => {
    if (!cameraOn) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    void video.play().catch(() => {
      /* autoplay can be blocked; Capture still works once frames arrive */
    });
  }, [cameraOn]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    [],
  );

  const startCamera = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(t("scan.cameraBlocked"));
      return;
    }
    setCameraError(null);
    setCameraStarting(true);
    try {
      stopCamera();
      setCameraStarting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setCameraStarting(false);
    } catch {
      stopCamera();
      setCameraError(t("scan.cameraBlocked"));
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
    setCameraError(null);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError(t("scan.cameraNotReady"));
      return;
    }
    setCameraError(null);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], "capture.jpg", { type: "image/jpeg" });
        onFile(f);
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
        reason: "failed",
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
          <div
            className={`dropzone ${(previewUrl || cameraOn) ? "has-media" : ""}${cameraOn ? " dropzone--camera" : ""}`}
          >
            {cameraOn && (
              <video
                ref={videoRef}
                className="dropzone__video"
                playsInline
                muted
                autoPlay
              />
            )}
            {!cameraOn && previewUrl && (
              <ExpandablePhoto className="dropzone__photo" src={previewUrl} alt="" />
            )}
            {!cameraOn && !previewUrl && (
              <div className="dropzone__hint">
                <strong>{t("scan.dropHint")}</strong>
                <p className="muted">{t("scan.dropSub")}</p>
              </div>
            )}
            {cameraOn && cameraStarting && (
              <div className="dropzone__hint">
                <strong>{t("scan.cameraStarting")}</strong>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="banner banner--warn" style={{ marginTop: "0.75rem" }}>
              {cameraError}
            </div>
          )}

          {cameraOn ? (
            <div className="cta-row cta-row--camera" style={{ marginTop: "0.9rem" }}>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => {
                  stopCamera();
                  setCameraError(null);
                }}
              >
                {t("scan.cancel")}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={cameraStarting}
                onClick={captureFromCamera}
              >
                {t("scan.capture")}
              </button>
            </div>
          ) : (
            <>
              <div className="cta-row" style={{ marginTop: "0.9rem" }}>
                <button
                  type="button"
                  className="btn btn--forest"
                  onClick={() => fileRef.current?.click()}
                >
                  {t("scan.upload")}
                </button>
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={cameraStarting}
                  onClick={() => void startCamera()}
                >
                  {cameraStarting ? t("scan.cameraStarting") : t("scan.camera")}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.heic,.heif"
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
            </>
          )}
        </div>

        <div>
          {result?.status === "unclear" && (
            <div className="banner banner--warn">
              <strong>{t("scan.cantAnalyse")}</strong>
              <p style={{ margin: "0.4rem 0 0" }}>
                {t(unclearDetailKey(result.reason))}
              </p>
              <p style={{ margin: "0.55rem 0 0" }}>{t("scan.reuploadAdvice")}</p>
              <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn--forest"
                  onClick={() => {
                    setResult(null);
                    setPicked(null);
                    setConfirmError(null);
                    fileRef.current?.click();
                  }}
                >
                  {t("scan.uploadAnother")}
                </button>
              </div>
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

          {(!result || result.status === "unclear") && !busy && (
            <div
              className="banner"
              style={result?.status === "unclear" ? { marginTop: "0.75rem" } : undefined}
            >
              {t("scan.tip")}
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
