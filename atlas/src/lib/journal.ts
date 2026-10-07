import type { Game } from "../types/game";
import type { JournalEntry, JournalKind, JournalState } from "../types/journal";

export const JOURNAL_STORAGE_KEY = "ludus-atlas-journal-v1";
export const JOURNAL_EVENT = "ludus-atlas-journal-change";

const empty: JournalState = { entries: {} };

export function readJournal(): JournalState {
  try {
    const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as JournalState;
    if (!parsed || typeof parsed !== "object" || !parsed.entries) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function writeJournal(state: JournalState) {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(JOURNAL_EVENT));
}

function stubFromGame(game: Game): JournalEntry {
  return {
    gameId: game.id,
    slug: game.slug,
    name: game.name,
    originCountry: game.originCountry,
    category: game.category,
    image: game.images[0] ?? "",
  };
}

export function isInJournal(gameId: string, kind: JournalKind): boolean {
  const entry = readJournal().entries[gameId];
  if (!entry) return false;
  return kind === "collected" ? Boolean(entry.collectedAt) : Boolean(entry.playedAt);
}

export function toggleJournal(game: Game, kind: JournalKind): JournalState {
  const state = readJournal();
  const existing = state.entries[game.id] ?? stubFromGame(game);
  const now = new Date().toISOString();

  if (kind === "collected") {
    if (existing.collectedAt) {
      delete existing.collectedAt;
    } else {
      existing.collectedAt = now;
    }
  } else if (existing.playedAt) {
    delete existing.playedAt;
  } else {
    existing.playedAt = now;
  }

  if (!existing.collectedAt && !existing.playedAt) {
    delete state.entries[game.id];
  } else {
    state.entries[game.id] = {
      ...stubFromGame(game),
      collectedAt: existing.collectedAt,
      playedAt: existing.playedAt,
    };
  }

  writeJournal(state);
  return state;
}

export function listJournal(kind?: JournalKind): JournalEntry[] {
  const entries = Object.values(readJournal().entries);
  const filtered = kind
    ? entries.filter((e) => (kind === "collected" ? e.collectedAt : e.playedAt))
    : entries.filter((e) => e.collectedAt || e.playedAt);

  return filtered.sort((a, b) => {
    const aTime = Math.max(
      a.collectedAt ? Date.parse(a.collectedAt) : 0,
      a.playedAt ? Date.parse(a.playedAt) : 0,
    );
    const bTime = Math.max(
      b.collectedAt ? Date.parse(b.collectedAt) : 0,
      b.playedAt ? Date.parse(b.playedAt) : 0,
    );
    return bTime - aTime;
  });
}

export function journalCounts() {
  const entries = Object.values(readJournal().entries);
  return {
    collected: entries.filter((e) => e.collectedAt).length,
    played: entries.filter((e) => e.playedAt).length,
    total: entries.filter((e) => e.collectedAt || e.playedAt).length,
  };
}

export function removeFromJournal(gameId: string, kind: JournalKind): JournalState {
  const state = readJournal();
  const entry = state.entries[gameId];
  if (!entry) return state;
  if (kind === "collected") delete entry.collectedAt;
  else delete entry.playedAt;
  if (!entry.collectedAt && !entry.playedAt) delete state.entries[gameId];
  else state.entries[gameId] = entry;
  writeJournal(state);
  return state;
}

export function clearJournal(): JournalState {
  writeJournal(empty);
  return empty;
}
