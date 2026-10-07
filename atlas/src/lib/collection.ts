import type { CollectionMeta, Game } from "../types/game";
import { readPool, POOL_EVENT } from "./pool";
import { AUTH_EVENT } from "./auth";
import { readStaging, STAGING_EVENT } from "./staging";

export type CollectionData = {
  meta: CollectionMeta & { brand?: string };
  games: Game[];
};

export const COLLECTION_EVENT = "ludus-atlas-collection-change";

let baseCache: CollectionData | null = null;

async function loadBase(): Promise<CollectionData> {
  if (baseCache) return baseCache;
  const res = await fetch(`${import.meta.env.BASE_URL}data/collection.json`);
  if (!res.ok) throw new Error(`Failed to load collection (${res.status})`);
  baseCache = (await res.json()) as CollectionData;
  return baseCache;
}

function mergeGames(baseGames: Game[], extras: Game[]): Game[] {
  const ids = new Set(baseGames.map((g) => g.id));
  const slugs = new Set(baseGames.map((g) => g.slug));
  const out = [...baseGames];
  for (const g of extras) {
    if (ids.has(g.id) || slugs.has(g.slug)) continue;
    out.push(g);
    ids.add(g.id);
    slugs.add(g.slug);
  }
  return out;
}

function mergeCollection(base: CollectionData, pool: Game[], staging: Game[]): CollectionData {
  const games = mergeGames(mergeGames(base.games, pool), staging);
  const categories = [...new Set(games.map((g) => g.category))].sort();
  const civilizations = [...new Set(games.map((g) => g.civilization))].sort();
  // Staging previews should not inflate the public catalog total
  const durableCount = mergeGames(base.games, pool).length;
  return {
    meta: {
      ...base.meta,
      totalGames: durableCount,
      totalVariations: games.reduce((a, g) => a + (g.variations?.length || 0), 0),
      categories,
      civilizations,
    },
    games,
  };
}

export async function loadCollection(): Promise<CollectionData> {
  const base = await loadBase();
  return mergeCollection(base, readPool(), readStaging());
}

export function getBaseGameCount(): number {
  return baseCache?.games.length ?? 0;
}

export async function ensureBaseLoaded(): Promise<CollectionData> {
  return loadBase();
}

export function excerpt(text: string, words = 28): string {
  const parts = text.split(/\s+/);
  if (parts.length <= words) return text;
  return `${parts.slice(0, words).join(" ")}…`;
}

/** Subscribe to pool/auth changes that affect the merged catalog. */
export function subscribeCollection(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(POOL_EVENT, handler);
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener(STAGING_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(POOL_EVENT, handler);
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener(STAGING_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function notifyCollectionChanged() {
  window.dispatchEvent(new CustomEvent(COLLECTION_EVENT));
}
