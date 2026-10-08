import type { Catalog, CatalogItem } from "../types/catalog";
import { validateCategoryRelevance } from "./categoryRelevance";
import { addContribution } from "./contributions";
import { identifyImage, runOcr } from "./identify";
import { slugify } from "./resourcePacks";
import { unlockItem, type UnlockRecord } from "./unlocks";

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Pull a likely proper name from OCR / filename when the user left name blank. */
export function guessNameFromText(ocrText: string, fileName?: string): string | null {
  const fromFile = fileName?.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (fromFile && /[a-zA-Z\u00C0-\u024F\u4e00-\u9fff]{2,}/.test(fromFile) && fromFile.length <= 40) {
    return fromFile.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const lines = ocrText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2 && l.length <= 40);
  // Prefer short Title Case / ALL CAPS logo lines
  const scored = lines
    .map((line) => {
      const letters = (line.match(/[A-Za-z\u00C0-\u024F\u4e00-\u9fff]/g) || []).length;
      const words = line.split(/\s+/).length;
      let score = letters - Math.abs(words - 2) * 2;
      if (/^[A-Z0-9][A-Z0-9 \-&'.]+$/.test(line)) score += 4;
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(line)) score += 3;
      return { line, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score >= 4 ? scored[0].line : null;
}

function findExistingMatch(
  catalog: Catalog,
  categoryId: string,
  name: string,
): CatalogItem | undefined {
  const needle = name.trim().toLowerCase();
  const slug = slugify(name);
  return catalog.items.find((it) => {
    if (it.categoryId !== categoryId || it.status === "removed") return false;
    if (it.slug === slug || it.name.toLowerCase() === needle) return true;
    return it.aliases.some((a) => a.toLowerCase() === needle);
  });
}

export type ContributeResult =
  | {
      status: "unlocked-existing";
      item: CatalogItem;
      unlock: UnlockRecord;
      message: string;
    }
  | {
      status: "added-new";
      item: CatalogItem;
      unlock: UnlockRecord;
      message: string;
    }
  | {
      status: "rejected";
      message: string;
    };

/**
 * Upload a photo of something not yet covered (or unlock if already covered).
 * Rejects images that are not relevant to the selected category.
 */
export async function contributeSighting(input: {
  file: File;
  categoryId: string;
  catalog: Catalog;
  name?: string;
  onProgress?: (phase: string, progress: number) => void;
}): Promise<ContributeResult> {
  const { file, categoryId, catalog } = input;
  input.onProgress?.("Reading the image…", 0.05);

  // Prefer the typed name — avoids a slow OCR pass when the user already named it.
  let name = input.name?.trim() || "";
  let ocrText = "";

  if (name) {
    const existingEarly = findExistingMatch(catalog, categoryId, name);
    if (existingEarly) {
      const photoDataUrl = await fileToDataUrl(file);
      const unlock = unlockItem(existingEarly.id, {
        method: "contribute",
        photoDataUrl,
        note: "Unlocked from contribution upload",
      });
      return {
        status: "unlocked-existing",
        item: existingEarly,
        unlock,
        message: `“${existingEarly.name}” is already on this shelf — unlocked with your photo.`,
      };
    }
  } else {
    // No typed name: identify against the shelf, then OCR for a label.
    const identified = await identifyImage(file, catalog, [categoryId], (phase, p) => {
      input.onProgress?.(phase, 0.05 + p * 0.45);
    });

    if (identified.status === "guesses" && identified.guesses[0]?.confidence >= 55) {
      const top = identified.guesses[0];
      if (top.categoryId === categoryId) {
        const item = catalog.items.find((i) => i.id === top.itemId);
        if (item) {
          const photoDataUrl = await fileToDataUrl(file);
          const unlock = unlockItem(item.id, {
            method: "contribute",
            photoDataUrl,
            note: "Unlocked from contribution upload",
          });
          return {
            status: "unlocked-existing",
            item,
            unlock,
            message: `“${item.name}” is already on this shelf — unlocked with your photo.`,
          };
        }
      }
    }

    input.onProgress?.("Reading labels…", 0.55);
    try {
      ocrText = await runOcr(file, (p) => input.onProgress?.("Reading labels…", 0.55 + p * 0.2));
    } catch {
      ocrText = "";
    }
    name = guessNameFromText(ocrText, file.name) || "";
  }

  if (!name) {
    return {
      status: "rejected",
      message:
        "Could not read a brand or species name from the image. Type the name, then try again.",
    };
  }

  // Already in catalogue under a close name?
  const existing = findExistingMatch(catalog, categoryId, name);
  if (existing) {
    const photoDataUrl = await fileToDataUrl(file);
    const unlock = unlockItem(existing.id, {
      method: "contribute",
      photoDataUrl,
      note: "Unlocked from contribution upload",
    });
    return {
      status: "unlocked-existing",
      item: existing,
      unlock,
      message: `“${existing.name}” is already on this shelf — unlocked with your photo.`,
    };
  }

  input.onProgress?.("Checking category relevance…", 0.8);
  const relevance = await validateCategoryRelevance({
    categoryId,
    name,
    ocrText,
    file,
  });

  if (!relevance.ok) {
    return { status: "rejected", message: relevance.reason };
  }

  input.onProgress?.("Adding to catalogue…", 0.92);
  const photoDataUrl = await fileToDataUrl(file);
  const item = addContribution({
    categoryId,
    name,
    origin: relevance.origin ?? null,
    summary: relevance.summary,
    coverDataUrl: photoDataUrl,
    coverUrl: relevance.coverUrl,
    sourceUrl: relevance.sourceUrl,
    verifiedAs: relevance.wikiTitle || relevance.reason,
    tags: ["contributed"],
    catalog,
  });

  const unlock = unlockItem(item.id, {
    method: "contribute",
    photoDataUrl,
    note: "Added from your photo and unlocked",
  });

  return {
    status: "added-new",
    item,
    unlock,
    message: `Accepted “${item.name}” for this category. Added to the catalogue, unlocked, and progress updated.`,
  };
}
