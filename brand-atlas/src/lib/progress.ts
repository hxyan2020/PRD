import type { Catalog, CatalogItem, RevealMode } from "../types/catalog";
import { isUnlocked } from "./unlocks";

/** Highest sneak-peek fraction of the category awarded by unlock progress. */
export function sneakPeekFraction(progress01: number): number {
  if (progress01 >= 0.8) return 0.2;
  if (progress01 >= 0.5) return 0.15;
  if (progress01 >= 0.3) return 0.1;
  if (progress01 >= 0.1) return 0.05;
  return 0;
}

export function categoryProgress(
  items: CatalogItem[],
): { unlocked: number; total: number; pct: number; sneakFraction: number } {
  const total = items.length || 1;
  const unlocked = items.filter((it) => isUnlocked(it.id)).length;
  const pct = (unlocked / total) * 100;
  return {
    unlocked,
    total: items.length,
    pct,
    sneakFraction: sneakPeekFraction(unlocked / total),
  };
}

export function overallProgress(catalog: Catalog): {
  unlocked: number;
  total: number;
  pct: number;
} {
  const active = catalog.items.filter((it) => it.status !== "removed");
  const unlocked = active.filter((it) => isUnlocked(it.id)).length;
  return {
    unlocked,
    total: active.length,
    pct: active.length ? (unlocked / active.length) * 100 : 0,
  };
}

/**
 * Pick sneak-peek item ids: next N% of still-locked items (stable sort by id).
 */
export function sneakPeekIds(items: CatalogItem[]): Set<string> {
  const { sneakFraction } = categoryProgress(items);
  if (sneakFraction <= 0) return new Set();
  const locked = items
    .filter((it) => !isUnlocked(it.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  const count = Math.max(1, Math.round(items.length * sneakFraction));
  return new Set(locked.slice(0, count).map((it) => it.id));
}

export function revealMode(
  item: CatalogItem,
  peekIds: Set<string>,
): RevealMode {
  if (isUnlocked(item.id)) return "unlocked";
  if (peekIds.has(item.id)) return "sneak";
  return "locked";
}
