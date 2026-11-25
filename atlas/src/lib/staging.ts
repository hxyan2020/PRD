import type { Game } from "../types/game";

/** Ephemeral search results so discovery previews resolve before being added to the pool. */
let staging: Game[] = [];

export const STAGING_EVENT = "ludus-atlas-staging-change";

export function setStagingGames(games: Game[]) {
  staging = games;
  window.dispatchEvent(new CustomEvent(STAGING_EVENT));
}

export function readStaging(): Game[] {
  return staging;
}

export function clearStaging() {
  staging = [];
  window.dispatchEvent(new CustomEvent(STAGING_EVENT));
}
