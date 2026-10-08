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
 * Pick `count` games for the given day. Order is stable within a day and
 * changes when the day (or seedTag) changes.
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
  const start = hashSeed(`${day}:${seedTag}`) % n;
  const out: Game[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < n && out.length < take; i++) {
    const g = games[(start + i) % n];
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push(g);
  }
  return out;
}
