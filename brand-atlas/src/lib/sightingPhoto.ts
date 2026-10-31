/** Compress a sighting image so unlocks fit in localStorage. */

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;
/** Soft cap for a single stored data URL (~localStorage-friendly). */
const MAX_DATA_URL_CHARS = 450_000;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Image encode failed"));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Returns a JPEG data URL sized for unlock storage.
 * Falls back to the original data URL if canvas compression is unavailable.
 */
export async function fileToSightingDataUrl(file: Blob): Promise<string> {
  const original = await readAsDataUrl(file);
  if (typeof document === "undefined") return original;

  try {
    const img = await loadImage(original);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return original;

    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, cw, ch);

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpegBlob(canvas, quality);
    let dataUrl = await readAsDataUrl(blob);

    // Tighten quality if still too large for localStorage budgets.
    while (dataUrl.length > MAX_DATA_URL_CHARS && quality > 0.4) {
      quality -= 0.1;
      blob = await canvasToJpegBlob(canvas, quality);
      dataUrl = await readAsDataUrl(blob);
    }

    if (dataUrl.length > MAX_DATA_URL_CHARS && Math.max(cw, ch) > 640) {
      const s2 = 640 / Math.max(cw, ch);
      canvas.width = Math.max(1, Math.round(cw * s2));
      canvas.height = Math.max(1, Math.round(ch * s2));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await canvasToJpegBlob(canvas, 0.55);
      dataUrl = await readAsDataUrl(blob);
    }

    return dataUrl.length < original.length ? dataUrl : original.length > MAX_DATA_URL_CHARS ? dataUrl : original;
  } catch {
    return original;
  }
}
