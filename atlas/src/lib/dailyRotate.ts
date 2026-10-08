import type { Game } from "../types/game";

/** UTC calendar day key — stable for a full day worldwide. */
export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Deterministic 32-bit hash for rotation seeds. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick `count` games for the given day.
 * Uses a day-seeded start + stride so picks spread across the catalog
 * (avoids six near-duplicate sequential archetypes) and change each UTC day.
 */
export function dailyPickGames(
  games: Game[],
  count: number,
  seedTag = "featured",
  day = todayKey(),
): Game[] {
  if (!games.length || count <= 0) return [];
  const n = games.length;
  const take = Math.min(count, n);
  const seed = hashSeed(`${day}:${seedTag}`);
  const start = seed % n;

  // Odd stride near n/take so we walk the ring without clustering neighbors.
  let stride = Math.max(1, Math.floor(n / take));
  stride += seed % Math.max(1, take);
  if (stride % 2 === 0) stride += 1;
  if (stride % n === 0) stride = 1;

  const out: Game[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < n && out.length < take; i++) {
    const g = games[(start + i * stride) % n];
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push(g);
  }
  return out;
}
