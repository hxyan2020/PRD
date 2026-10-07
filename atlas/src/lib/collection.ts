import type { CollectionMeta, Game } from "../types/game";

export type CollectionData = {
  meta: CollectionMeta & { brand?: string };
  games: Game[];
};

let cache: CollectionData | null = null;

export async function loadCollection(): Promise<CollectionData> {
  if (cache) return cache;
  const res = await fetch("/data/collection.json");
  if (!res.ok) throw new Error(`Failed to load collection (${res.status})`);
  cache = (await res.json()) as CollectionData;
  return cache;
}

export function excerpt(text: string, words = 28): string {
  const parts = text.split(/\s+/);
  if (parts.length <= words) return text;
  return `${parts.slice(0, words).join(" ")}…`;
}
