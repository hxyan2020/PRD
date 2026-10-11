import type { Catalog, CatalogItem } from "../types/catalog";
import { wordmarkDataUrl } from "./packMarks";

const STORAGE_KEY = "seen.resourcePacks.v1";
const EVT = "seen-resource-packs";

export interface InterestSelection {
  /** trait field id → selected option ids */
  traits: Record<string, string[]>;
  /** Optional free-text interest note */
  note?: string;
}

export interface PackCandidate {
  name: string;
  slug: string;
  origin: string | null;
  tags: string[];
  summary: string;
  sourceUrl?: string;
  coverUrl?: string | null;
  aliases?: string[];
}

export interface ResourcePack {
  id: string;
  categoryId: string;
  title: string;
  interests: InterestSelection;
  createdAt: string;
  source: "web-ai";
  itemIds: string[];
  items: CatalogItem[];
}

function readAll(): ResourcePack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResourcePack[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(packs: ResourcePack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
  window.dispatchEvent(new Event(EVT));
}

export function subscribeResourcePacks(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

const ALCOHOL_IDS = new Set(["alcohol", "liquor", "wine", "sake", "beer"]);

export function listResourcePacks(categoryId?: string): ResourcePack[] {
  const all = readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!categoryId) return all;
  if (categoryId === "alcohol") return all.filter((p) => ALCOHOL_IDS.has(p.categoryId));
  return all.filter((p) => p.categoryId === categoryId);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
}

export function packItemId(categoryId: string, slug: string): string {
  return `${categoryId}__${slug}`;
}

export function candidateToItem(
  categoryId: string,
  candidate: PackCandidate,
  sortBase: number,
): CatalogItem {
  const slug = candidate.slug || slugify(candidate.name);
  const id = packItemId(categoryId, slug);
  const hue = Math.abs(
    [...id].reduce((a, c) => a + c.charCodeAt(0), 0) * 17,
  ) % 360;
  const tags = Array.from(
    new Set(["resource-pack", ...(candidate.tags ?? [])].filter(Boolean)),
  );
  return {
    id,
    slug,
    name: candidate.name,
    aliases: candidate.aliases ?? [],
    categoryId,
    origin: candidate.origin,
    tags,
    summary:
      candidate.summary ||
      `${candidate.name} — added via resource pack${candidate.origin ? ` · ${candidate.origin}` : ""}.`,
    facts: {
      headquarters: candidate.origin ?? "Unknown",
      knownFor: tags.filter((t) => t !== "resource-pack").join(", ") || "Resource pack",
      story: candidate.summary || `${candidate.name} was discovered for your interests and added to this shelf.`,
      source: candidate.sourceUrl ?? "Web discovery",
    },
    coverHue: hue,
    mark: wordmarkDataUrl(candidate.name, hue),
    cover: candidate.coverUrl ?? null,
    markIcon: null,
    sort: sortBase,
    status: "active",
  };
}

export function existingNames(catalog: Catalog, categoryId: string): Set<string> {
  const set = new Set<string>();
  for (const it of catalog.items) {
    if (it.categoryId !== categoryId || it.status === "removed") continue;
    set.add(it.name.toLowerCase());
    set.add(it.slug.toLowerCase());
    for (const a of it.aliases) set.add(a.toLowerCase());
  }
  for (const pack of listResourcePacks(categoryId)) {
    for (const it of pack.items) {
      set.add(it.name.toLowerCase());
      set.add(it.slug.toLowerCase());
    }
  }
  return set;
}

export function addResourcePack(input: {
  categoryId: string;
  title: string;
  interests: InterestSelection;
  candidates: PackCandidate[];
  catalog: Catalog;
}): ResourcePack {
  const existing = existingNames(input.catalog, input.categoryId);
  const existingIds = new Set(input.catalog.items.map((i) => i.id));
  for (const p of listResourcePacks()) {
    for (const id of p.itemIds) existingIds.add(id);
  }

  const items: CatalogItem[] = [];
  let sort = 9000 + listResourcePacks(input.categoryId).length * 100;
  for (const cand of input.candidates) {
    const slug = cand.slug || slugify(cand.name);
    const id = packItemId(input.categoryId, slug);
    if (existingIds.has(id)) continue;
    if (existing.has(cand.name.toLowerCase()) || existing.has(slug)) continue;
    const item = candidateToItem(input.categoryId, { ...cand, slug }, sort++);
    items.push(item);
    existing.add(cand.name.toLowerCase());
    existingIds.add(id);
  }

  if (!items.length) {
    throw new Error("No new items to add — everything found is already in this shelf.");
  }

  const pack: ResourcePack = {
    id: `pack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    categoryId: input.categoryId,
    title: input.title,
    interests: input.interests,
    createdAt: new Date().toISOString(),
    source: "web-ai",
    itemIds: items.map((i) => i.id),
    items,
  };

  const all = readAll();
  all.push(pack);
  writeAll(all);
  return pack;
}

export function removeResourcePack(packId: string) {
  writeAll(readAll().filter((p) => p.id !== packId));
}

/** Merge base catalogue with installed resource packs (+ optional extra items). */
export function mergeCatalogWithPacks(
  base: Catalog,
  extraItems: CatalogItem[] = [],
): Catalog {
  const packs = readAll();
  if (!packs.length && !extraItems.length) return base;

  const byId = new Map(base.items.map((i) => [i.id, i]));
  for (const pack of packs) {
    for (const item of pack.items) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
  }
  for (const item of extraItems) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }

  const items = [...byId.values()];
  const categories = base.categories.map((cat) => ({
    ...cat,
    itemCount: items.filter(
      (i) => i.categoryId === cat.id && i.status !== "removed",
    ).length,
  }));

  const bits: string[] = [];
  if (packs.length) bits.push(`Resource packs: ${packs.length}`);
  if (extraItems.length) bits.push(`Contributions: ${extraItems.length}`);

  return {
    ...base,
    categories,
    items,
    meta: {
      ...base.meta,
      itemCount: items.filter((i) => i.status !== "removed").length,
      note: bits.length ? `${base.meta.note} ${bits.join(". ")}.` : base.meta.note,
    },
  };
}
