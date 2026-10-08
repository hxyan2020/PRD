import { createWorker } from "tesseract.js";
import type { Catalog, CatalogItem, Guess, IdentifyResult } from "../types/catalog";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 2);
}

function scoreAgainstText(item: CatalogItem, text: string): number {
  const nText = normalize(text);
  if (!nText) return 0;
  const names = [item.name, ...item.aliases, ...item.tags];
  let best = 0;
  for (const name of names) {
    const n = normalize(name);
    if (!n) continue;
    if (nText.includes(n) || n.includes(nText)) {
      best = Math.max(best, n.length >= 5 ? 1 : 0.85);
      continue;
    }
    const nameToks = tokens(name);
    const textToks = new Set(tokens(nText));
    if (!nameToks.length) continue;
    const hit = nameToks.filter((t) => textToks.has(t)).length;
    const ratio = hit / nameToks.length;
    if (ratio >= 0.6) best = Math.max(best, 0.45 + ratio * 0.4);
  }
  return best;
}

/** Lightweight colour / edge cue for nature items when OCR finds little. */
export async function imageCues(file: Blob): Promise<{
  brightness: number;
  greenness: number;
  warmness: number;
  contrast: number;
}> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bmp.close();
    return { brightness: 0.5, greenness: 0, warmness: 0, contrast: 0 };
  }
  ctx.drawImage(bmp, 0, 0, size, size);
  bmp.close();
  const data = ctx.getImageData(0, 0, size, size).data;
  let r = 0,
    g = 0,
    b = 0,
    min = 255,
    max = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    min = Math.min(min, lum);
    max = Math.max(max, lum);
  }
  r /= n;
  g /= n;
  b /= n;
  const brightness = (r + g + b) / (3 * 255);
  const greenness = Math.max(0, (g - r) / 255 + (g - b) / 255) / 2;
  const warmness = Math.max(0, (r - b) / 255);
  const contrast = (max - min) / 255;
  return { brightness, greenness, warmness, contrast };
}

function natureCueBoost(
  item: CatalogItem,
  cues: Awaited<ReturnType<typeof imageCues>>,
): number {
  const tags = new Set([item.slug, ...item.tags, item.name.toLowerCase()]);
  let boost = 0;
  if (cues.greenness > 0.12 && (tags.has("deciduous") || tags.has("conifer") || item.categoryId === "trees" || item.categoryId === "flowers")) {
    boost += 0.12;
  }
  if (cues.warmness > 0.2 && (item.slug.includes("rose") || item.slug.includes("sunflower") || item.slug.includes("marigold") || item.slug.includes("poppy"))) {
    boost += 0.1;
  }
  if (cues.contrast < 0.15) boost -= 0.2;
  return boost;
}

function toGuesses(
  scored: { item: CatalogItem; score: number; reason: string }[],
  catalog: Catalog,
  limit = 5,
): Guess[] {
  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (!top.length) return [];
  const sum = top.reduce((a, s) => a + s.score, 0);
  let remaining = 100;
  return top.map((s, i) => {
    const cat = catalog.categories.find((c) => c.id === s.item.categoryId);
    let confidence =
      i === top.length - 1
        ? remaining
        : Math.max(1, Math.round((s.score / sum) * 100));
    if (i < top.length - 1) remaining -= confidence;
    if (i === top.length - 1) confidence = Math.max(1, remaining);
    return {
      itemId: s.item.id,
      name: s.item.name,
      categoryId: s.item.categoryId,
      categoryLabel: cat?.label ?? s.item.categoryId,
      confidence,
      reason: s.reason,
    };
  });
}

export async function runOcr(file: Blob, onProgress?: (p: number) => void): Promise<string> {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.(m.progress);
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Identify an uploaded image against selected catalogue categories.
 * Uses OCR for logo/label text + light visual cues for nature items.
 */
export async function identifyImage(
  file: Blob,
  catalog: Catalog,
  categoryIds: string[],
  onProgress?: (phase: string, progress: number) => void,
): Promise<IdentifyResult> {
  onProgress?.("Reading image cues…", 0.05);
  const cues = await imageCues(file);

  if (cues.contrast < 0.08 && cues.brightness < 0.12) {
    return {
      status: "unclear",
      message:
        "This photo is too dark or flat. Aim at the brand logo or upload a clearer picture with distinct characteristics.",
    };
  }
  if (cues.contrast < 0.1 && cues.brightness > 0.85) {
    return {
      status: "unclear",
      message:
        "This photo looks overexposed or blank. Frame the logo or distinctive features and try again.",
    };
  }

  onProgress?.("Scanning for logos & labels…", 0.15);
  let ocrText = "";
  try {
    ocrText = await runOcr(file, (p) => onProgress?.("Scanning for logos & labels…", 0.15 + p * 0.7));
  } catch {
    ocrText = "";
  }

  const pool = catalog.items.filter(
    (it) =>
      it.status !== "removed" &&
      (!categoryIds.length || categoryIds.includes(it.categoryId)),
  );

  onProgress?.("Matching to catalogue…", 0.9);

  const scored = pool.map((item) => {
    let score = scoreAgainstText(item, ocrText);
    let reason = score > 0 ? "Matched text / logo cues from the image" : "Visual cue only";
    if (item.categoryId === "trees" || item.categoryId === "flowers" || item.categoryId === "animals") {
      const boost = natureCueBoost(item, cues);
      if (boost > 0) {
        score = Math.min(1, score + boost);
        reason = score > boost ? "Text + colour cues" : "Colour / texture cues (nature)";
      }
    }
    // Filename hint (e.g. toyota.jpg) helps demos & camera roll naming
    if (file instanceof File && file.name) {
      const fnScore = scoreAgainstText(item, file.name.replace(/\.[^.]+$/, ""));
      if (fnScore > score) {
        score = fnScore;
        reason = "Matched filename hint";
      }
    }
    return { item, score, reason };
  });

  const meaningful = scored.filter((s) => s.score >= 0.35);
  if (!meaningful.length) {
    const weak = scored.filter((s) => s.score > 0.1).sort((a, b) => b.score - a.score);
    if (!weak.length || !normalize(ocrText)) {
      return {
        status: "unclear",
        message:
          "I can't spot a clear brand mark or distinctive type. Aim the camera at the logo, label text, or a clear silhouette, then upload again.",
      };
    }
    const guesses = toGuesses(weak.slice(0, 5), catalog);
    return {
      status: "guesses",
      guesses,
      message:
        "Not fully sure — here are my best guesses. Confirm the right one, or upload a clearer shot of the logo.",
    };
  }

  const guesses = toGuesses(meaningful.slice(0, 5), catalog);
  const top = guesses[0];
  const message =
    guesses.length === 1 && top.confidence >= 70
      ? `I think this is ${top.name}. Please confirm.`
      : "Here are my top guesses — confidences add up to 100%. Confirm the match.";

  return { status: "guesses", guesses, message };
}
