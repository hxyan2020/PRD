import { createWorker } from "tesseract.js";
import type { Catalog, CatalogItem, Guess, IdentifyResult } from "../types/catalog";

/** Product / shelf words that steer matching toward the right kind of brand. */
const CATEGORY_HINTS: Record<string, string[]> = {
  alcohol: [
    "vermouth",
    "aperitivo",
    "aperitif",
    "gin",
    "vodka",
    "whisky",
    "whiskey",
    "bourbon",
    "rum",
    "tequila",
    "liqueur",
    "cognac",
    "brandy",
    "beer",
    "lager",
    "ale",
    "wine",
    "champagne",
    "prosecco",
    "sake",
    "soju",
    "absinthe",
    "pastis",
    "amaro",
    "distilled",
    "distillery",
  ],
  cigarettes: ["cigarette", "tobacco", "nicotine", "filter", "menthol"],
  cars: ["motor", "automotive", "automobile", "hybrid", "sedan", "suv"],
  softdrinks: ["cola", "soda", "sparkling water", "energy drink"],
  hotdrinks: ["coffee", "espresso", "latte", "tea", "matcha"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Generic label words that should not identify a brand by themselves. */
const WEAK_TOKENS = new Set([
  "extra",
  "dry",
  "special",
  "royal",
  "select",
  "original",
  "classic",
  "premium",
  "light",
  "dark",
  "red",
  "blue",
  "black",
  "white",
  "gold",
  "silver",
  "old",
  "new",
  "fine",
  "pure",
  "real",
  "best",
  "super",
  "ultra",
  "dal",
  "with",
  "and",
  "the",
  "des",
  "les",
  "une",
  "aperitivo",
  "vermouth",
  "liqueur",
  "distilled",
  "sophisticated",
  "bright",
  "essences",
]);

function tokens(s: string, minLen = 2): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= minLen);
}

function hasWholeWord(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  const h = normalize(haystack);
  if (!n || !h) return false;
  return new RegExp(
    `(?:^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
  ).test(` ${h} `);
}

function categoryHintBoost(categoryId: string, text: string): number {
  const hints = CATEGORY_HINTS[categoryId];
  if (!hints) return 0;
  const nText = normalize(text);
  let boost = 0;
  for (const hint of hints) {
    if (hasWholeWord(nText, hint)) {
      boost = Math.max(boost, hint.length >= 6 ? 0.12 : 0.08);
    }
  }
  return boost;
}

/**
 * Score a catalogue item against OCR / filename text.
 * Prefers whole-word brand matches and ignores noisy short / generic tokens.
 */
export function scoreAgainstText(item: CatalogItem, text: string): number {
  const nText = normalize(text);
  if (!nText) return 0;
  const textToks = new Set(tokens(nText, 2));
  const names = [item.name, ...item.aliases];
  let best = 0;

  for (const name of names) {
    const n = normalize(name);
    if (!n) continue;

    // Exact brand phrase as whole words — strongest logo OCR signal.
    if (hasWholeWord(nText, n)) {
      if (WEAK_TOKENS.has(n)) continue;
      // Prefer the catalogue entry whose full name is exactly what appears on the label.
      const exactness = n === normalize(item.name) ? 1 : 0.94;
      best = Math.max(
        best,
        n.length >= 5 ? exactness : n.length >= 4 ? 0.9 : 0.5,
      );
      continue;
    }

    // Very short names (MG, MS, DR) only when OCR is basically that mark alone.
    if (n.length <= 2) {
      if (textToks.has(n) && textToks.size <= 2) best = Math.max(best, 0.35);
      continue;
    }
    if (n.length === 3) {
      if (WEAK_TOKENS.has(n)) continue;
      if (hasWholeWord(nText, n) && textToks.size <= 4) best = Math.max(best, 0.55);
      continue;
    }

    const rawParts = n.split(" ").filter(Boolean);
    const isMultiWord = rawParts.length >= 2;
    const nameToks = tokens(name, 3);
    const distinctive = nameToks.filter((t) => t.length >= 4 && !WEAK_TOKENS.has(t));
    const hitDistinctive = distinctive.filter((t) => hasWholeWord(nText, t));

    if (hitDistinctive.length) {
      const longest = Math.max(...hitDistinctive.map((t) => t.length));
      // Fragment of a multi-word brand (e.g. "raspberry" ≠ "Raspberry Pi") stays weak.
      if (isMultiWord && hitDistinctive.length < 2) {
        best = Math.max(best, 0.32 + Math.min(0.12, (longest - 4) * 0.02));
        continue;
      }
      // Exact single-token brand (Martini) beats multi-word names that only share that token (China Martini).
      const coversAllDistinctive =
        distinctive.length > 0 && hitDistinctive.length === distinctive.length;
      const isPrimaryName = n === normalize(item.name);
      let score = 0.72 + Math.min(0.2, (longest - 4) * 0.03);
      if (coversAllDistinctive && distinctive.length === 1 && isPrimaryName && !isMultiWord) {
        score = 0.98;
      } else if (coversAllDistinctive) {
        score = Math.max(score, 0.86);
      } else {
        score = 0.72 + (hitDistinctive.length / distinctive.length) * 0.12;
      }
      best = Math.max(best, score);
      continue;
    }

    const strongNameToks = nameToks.filter((t) => !WEAK_TOKENS.has(t));
    if (!strongNameToks.length) continue;
    const hit = strongNameToks.filter((t) => hasWholeWord(nText, t)).length;
    const ratio = hit / strongNameToks.length;
    if (ratio >= 0.75 && hit >= 1) best = Math.max(best, 0.55 + ratio * 0.2);
  }

  // Tags only nudge an existing textual match — never create a top hit alone.
  if (best >= 0.55) {
    for (const tag of item.tags) {
      const t = normalize(tag);
      if (t.length < 5 || WEAK_TOKENS.has(t)) continue;
      if (hasWholeWord(nText, t)) best = Math.min(1, best + 0.04);
    }
  }

  if (best > 0) best = Math.min(1, best + categoryHintBoost(item.categoryId, nText));
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
  if (
    cues.greenness > 0.12 &&
    (tags.has("deciduous") ||
      tags.has("conifer") ||
      item.categoryId === "trees" ||
      item.categoryId === "flowers")
  ) {
    boost += 0.12;
  }
  if (
    cues.warmness > 0.2 &&
    (item.slug.includes("rose") ||
      item.slug.includes("sunflower") ||
      item.slug.includes("marigold") ||
      item.slug.includes("poppy"))
  ) {
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

  // Softmax-ish: strong leaders keep most of the confidence mass.
  const tempered = top.map((s) => Math.pow(Math.max(s.score, 0.01), 1.65));
  const sum = tempered.reduce((a, s) => a + s, 0);
  let remaining = 100;
  return top.map((s, i) => {
    const cat = catalog.categories.find((c) => c.id === s.item.categoryId);
    let confidence =
      i === top.length - 1
        ? remaining
        : Math.max(1, Math.round((tempered[i] / sum) * 100));
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
      reason: "dark",
      message:
        "This photo is too dark or flat. Aim at the brand logo or upload a clearer picture with distinct characteristics.",
    };
  }
  if (cues.contrast < 0.1 && cues.brightness > 0.85) {
    return {
      status: "unclear",
      reason: "blank",
      message:
        "This photo looks overexposed or blank. Frame the logo or distinctive features and try again.",
    };
  }

  onProgress?.("Scanning for logos & labels…", 0.15);
  let ocrText = "";
  try {
    ocrText = await runOcr(file, (p) =>
      onProgress?.("Scanning for logos & labels…", 0.15 + p * 0.7),
    );
  } catch {
    ocrText = "";
  }

  const pool = catalog.items.filter(
    (it) =>
      it.status !== "removed" &&
      (!categoryIds.length || categoryIds.includes(it.categoryId)),
  );

  onProgress?.("Matching to catalogue…", 0.9);

  const hintedCategory = (Object.keys(CATEGORY_HINTS) as string[]).find(
    (cat) => categoryHintBoost(cat, ocrText) > 0,
  );

  const scored = pool.map((item) => {
    let score = scoreAgainstText(item, ocrText);
    let reason =
      score > 0 ? "Matched text / logo cues from the image" : "Visual cue only";
    if (
      item.categoryId === "trees" ||
      item.categoryId === "flowers" ||
      item.categoryId === "animals" ||
      item.categoryId === "birds" ||
      item.categoryId === "mushrooms"
    ) {
      const boost = natureCueBoost(item, cues);
      if (boost > 0) {
        score = Math.min(1, score + boost);
        reason =
          score > boost ? "Text + colour cues" : "Colour / texture cues (nature)";
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
    // When the label clearly names a product family (vermouth, gin, …),
    // demote cross-category collisions from shared dictionary words.
    if (
      hintedCategory &&
      item.categoryId !== hintedCategory &&
      score > 0 &&
      score < 1
    ) {
      score *= 0.4;
    }
    return { item, score, reason };
  });

  const meaningful = scored
    .filter((s) => s.score >= 0.45)
    .sort((a, b) => b.score - a.score);

  if (!meaningful.length) {
    const weak = scored
      .filter((s) => s.score >= 0.28)
      .sort((a, b) => b.score - a.score);
    if (!weak.length || !normalize(ocrText)) {
      return {
        status: "unclear",
        reason: "noSignal",
        message:
          "I can't tell what's in this image. Please upload a relevant photo of the logo, label text, or a clear view of the item, then try again.",
      };
    }
    // Drop near-tied noise: if the leader isn't clearly ahead, ask for a clearer shot.
    if (weak.length >= 2 && weak[0].score - weak[1].score < 0.08 && weak[0].score < 0.4) {
      return {
        status: "unclear",
        reason: "ambiguous",
        message:
          "The label text is ambiguous against several catalogue marks. Zoom in on the brand name and upload again.",
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

  // Keep followers within a reasonable band of the leader so weak 2-letter hits don't pad the list.
  const leader = meaningful[0].score;
  const tight = meaningful.filter((s) => s.score >= leader * 0.55 || s.score >= 0.7);
  const guesses = toGuesses(tight.slice(0, 5), catalog);
  const top = guesses[0];
  const message =
    guesses.length === 1 && top.confidence >= 70
      ? `I think this is ${top.name}. Please confirm.`
      : top.confidence >= 55
        ? `Strongest match: ${top.name}. Confirm, or pick another guess.`
        : "Here are my top guesses — confidences add up to 100%. Confirm the match.";

  return { status: "guesses", guesses, message };
}
