import type { Game } from "../types/game";
import { getSession } from "./auth";

export const POOL_EVENT = "ludus-atlas-pool-change";
const LEGACY_POOL_KEY = "ludus-atlas-pool-v1";

function poolKey(userId?: string | null) {
  const session = getSession();
  const id = userId ?? session?.userId;
  if (id) return `ludus-atlas-pool-v1:${id}`;
  return LEGACY_POOL_KEY;
}

function emit() {
  window.dispatchEvent(new CustomEvent(POOL_EVENT));
}

export function readPool(userId?: string | null): Game[] {
  try {
    const raw = localStorage.getItem(poolKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Game[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePool(games: Game[], userId?: string | null) {
  localStorage.setItem(poolKey(userId), JSON.stringify(games));
  emit();
}

export function isInPool(gameId: string, userId?: string | null): boolean {
  return readPool(userId).some((g) => g.id === gameId || g.slug === gameId);
}

export function addGamesToPool(
  games: Game[],
  userId?: string | null,
  options?: { existingIds?: Set<string>; existingSlugs?: Set<string> },
): {
  added: Game[];
  skipped: number;
} {
  const current = readPool(userId);
  const byId = new Set([
    ...current.map((g) => g.id),
    ...(options?.existingIds ?? []),
  ]);
  const bySlug = new Set([
    ...current.map((g) => g.slug),
    ...(options?.existingSlugs ?? []),
  ]);
  const added: Game[] = [];
  for (const game of games) {
    if (byId.has(game.id) || bySlug.has(game.slug)) continue;
    const stamped: Game = {
      ...game,
      tags: Array.from(new Set([...(game.tags || []), "user-added", "pool"])),
    };
    current.push(stamped);
    byId.add(stamped.id);
    bySlug.add(stamped.slug);
    added.push(stamped);
  }
  if (added.length) writePool(current, userId);
  return { added, skipped: games.length - added.length };
}

export function removeFromPool(gameId: string, userId?: string | null) {
  const next = readPool(userId).filter((g) => g.id !== gameId);
  writePool(next, userId);
}

export function poolCount(userId?: string | null) {
  return readPool(userId).length;
}
