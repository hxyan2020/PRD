import type { ScoredProduct } from "./types";

export const DAILY_QUEUE_SIZE = 8;

export type DeskActionKind = "collect" | "discard" | "restore" | "uncollect";

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Ranked daily review list: opportunity score plus a stable per-day jitter so the deck rotates. */
export function dailyQueue(
  products: ScoredProduct[],
  discarded: Set<string>,
  size = DAILY_QUEUE_SIZE,
  day = todayKey(),
): ScoredProduct[] {
  const ranked = [...products].sort((a, b) => {
    const sa = a.score.total + (hash(`${a.slug}:${day}`) % 9);
    const sb = b.score.total + (hash(`${b.slug}:${day}`) % 9);
    return sb - sa;
  });
  return ranked.filter((p) => !discarded.has(p.slug)).slice(0, size);
}
