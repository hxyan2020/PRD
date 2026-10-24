import type { CollectionMeta, Game, TutorialVideo } from "../types/game";
import { readPool, POOL_EVENT } from "./pool";
import { AUTH_EVENT } from "./auth";
import { readStaging, STAGING_EVENT } from "./staging";
import { encodeLudusCard, sanitizeImageList } from "./gameCardImage";

export type CollectionData = {
  meta: CollectionMeta & { brand?: string };
  games: Game[];
};

export const COLLECTION_EVENT = "ludus-atlas-collection-change";

let baseCache: CollectionData | null = null;
let tutorialsCache: Record<string, TutorialVideo> | null = null;

async function loadTutorials(): Promise<Record<string, TutorialVideo>> {
  if (tutorialsCache) return tutorialsCache;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/tutorials.json`);
    if (!res.ok) {
      tutorialsCache = {};
      return tutorialsCache;
    }
    tutorialsCache = (await res.json()) as Record<string, TutorialVideo>;
  } catch {
    tutorialsCache = {};
  }
  return tutorialsCache;
}

function sanitizeGame(game: Game): Game {
  const label = {
    name: game.name,
    category: game.category,
    originCountry: game.originCountry,
  };
  const parentImages = sanitizeImageList(game.images, label);
  const pageUsed = new Set(
    parentImages.filter((u) => /^https?:\/\//.test(u)),
  );
  const variations = (game.variations ?? []).map((v) => {
    const cleaned = sanitizeImageList(v.images, {
      name: v.name,
      category: game.category,
      originCountry: v.originCountry,
    }).filter((u) => {
      if (!/^https?:\/\//.test(u)) return true;
      if (pageUsed.has(u)) return false;
      pageUsed.add(u);
      return true;
    });
    // If every photo collided with the parent/earlier variation, keep a
    // unique title card for this variation instead of repeating a photo.
    const images =
      cleaned.length > 0
        ? cleaned
        : sanitizeImageList([], {
            name: v.name,
            category: game.category,
            originCountry: v.originCountry,
          });
    return { ...v, images };
  });
  return {
    ...game,
    images: parentImages,
    variations,
  };
}

/**
 * Best-effort unique covers on the Collection grid. Prefer an unused alternate
 * photo from the same entry when the first cover was already claimed — but
 * never strip a real photo down to a title card (shared thematic covers are OK).
 */
function ensureUniqueCatalogCovers(games: Game[]): Game[] {
  const used = new Set<string>();
  return games.map((game) => {
    const httpImages = (game.images ?? []).filter((u) => /^https?:\/\//.test(u));
    if (!httpImages.length) return game;

    const uniqueAlt = httpImages.find((u) => !used.has(u));
    if (uniqueAlt) {
      used.add(uniqueAlt);
      if (uniqueAlt === httpImages[0]) return game;
      return {
        ...game,
        images: [
          uniqueAlt,
          ...httpImages.filter((u) => u !== uniqueAlt),
          ...(game.images ?? []).filter((u) => !/^https?:\/\//.test(u)),
        ],
      };
    }

    // Every photo on this entry is already a cover elsewhere — keep the shared
    // thematic image rather than falling back to a blank catalog card.
    return game;
  });
}

async function loadBase(): Promise<CollectionData> {
  if (baseCache) return baseCache;
  const [res, tutorials] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}data/collection.json`),
    loadTutorials(),
  ]);
  if (!res.ok) throw new Error(`Failed to load collection (${res.status})`);
  const raw = (await res.json()) as CollectionData;
  const cleanedGames = ensureUniqueCatalogCovers(
    raw.games.map((g) => sanitizeGame(g)),
  );
  baseCache = {
    ...raw,
    games: cleanedGames.map((cleaned) => {
      const tutorial = tutorials[cleaned.id];
      return tutorial ? { ...cleaned, tutorialVideo: tutorial } : cleaned;
    }),
  };
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
  const games = mergeGames(
    mergeGames(base.games, pool.map(sanitizeGame)),
    staging.map(sanitizeGame),
  );
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

export { excerpt, charExcerpt, preferCompleteText } from "./textPreview";

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
