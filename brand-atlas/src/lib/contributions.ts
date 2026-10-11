import type { Catalog, CatalogItem } from "../types/catalog";
import { wordmarkDataUrl } from "./packMarks";
import { packItemId, slugify } from "./resourcePacks";

const STORAGE_KEY = "seen.contributions.v1";
const EVT = "seen-contributions";

export interface ContributionRecord {
  id: string;
  categoryId: string;
  item: CatalogItem;
  createdAt: string;
  source: "user-upload";
  verifiedAs: string;
}

function readAll(): ContributionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ContributionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: ContributionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(EVT));
}

export function subscribeContributions(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

const ALCOHOL_IDS = new Set(["alcohol", "liquor", "wine", "sake", "beer"]);

export function listContributions(categoryId?: string): ContributionRecord[] {
  const all = readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!categoryId) return all;
  if (categoryId === "alcohol") return all.filter((c) => ALCOHOL_IDS.has(c.categoryId));
  return all.filter((c) => c.categoryId === categoryId);
}

export function contributionItems(): CatalogItem[] {
  return listContributions().map((c) => c.item);
}

export function addContribution(input: {
  categoryId: string;
  name: string;
  aliases?: string[];
  origin?: string | null;
  summary?: string;
  tags?: string[];
  coverDataUrl?: string | null;
  coverUrl?: string | null;
  sourceUrl?: string;
  verifiedAs: string;
  catalog: Catalog;
}): CatalogItem {
  const slug = slugify(input.name);
  const id = packItemId(input.categoryId, slug);
  const existingIds = new Set([
    ...input.catalog.items.map((i) => i.id),
    ...listContributions().map((c) => c.item.id),
  ]);
  if (existingIds.has(id)) {
    throw new Error(`“${input.name}” is already in this catalogue shelf.`);
  }

  const hue =
    Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0) * 19) % 360;
  const tags = Array.from(
    new Set(["user-contribution", ...(input.tags ?? [])].filter(Boolean)),
  );

  const item: CatalogItem = {
    id,
    slug,
    name: input.name.trim(),
    aliases: input.aliases ?? [],
    categoryId: input.categoryId,
    origin: input.origin ?? null,
    tags,
    summary:
      input.summary ||
      `${input.name} — contributed from your sighting and unlocked.`,
    facts: {
      headquarters: input.origin ?? "Unknown",
      knownFor: "User contribution",
      story:
        input.summary ||
        `${input.name} was added from your photo after category relevance checks.`,
      source: input.sourceUrl ?? "User upload",
      verified: input.verifiedAs,
    },
    coverHue: hue,
    mark: wordmarkDataUrl(input.name, hue),
    cover: input.coverDataUrl || input.coverUrl || null,
    markIcon: null,
    sort: 9500 + listContributions(input.categoryId).length,
    status: "active",
  };

  const row: ContributionRecord = {
    id: `contrib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    categoryId: input.categoryId,
    item,
    createdAt: new Date().toISOString(),
    source: "user-upload",
    verifiedAs: input.verifiedAs,
  };
  const all = readAll();
  all.push(row);
  writeAll(all);
  return item;
}
