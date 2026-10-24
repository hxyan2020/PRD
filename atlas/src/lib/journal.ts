import type { Game } from "../types/game";
import type { JournalEntry, JournalKind, JournalState } from "../types/journal";
import { getSession } from "./auth";

export const JOURNAL_EVENT = "ludus-atlas-journal-change";
const LEGACY_JOURNAL_KEY = "ludus-atlas-journal-v1";

const empty: JournalState = { entries: {} };

function journalKeyForUser(userId: string) {
  return `ludus-atlas-journal-v1:${userId}`;
}

function activeJournalKey(): string | null {
  const session = getSession();
  return session ? journalKeyForUser(session.userId) : null;
}

export function readJournal(userId?: string): JournalState {
  const key = userId ? journalKeyForUser(userId) : activeJournalKey();
  if (!key) return empty;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as JournalState;
    if (!parsed || typeof parsed !== "object" || !parsed.entries) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function writeJournal(state: JournalState, userId?: string) {
  const key = userId ? journalKeyForUser(userId) : activeJournalKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(state));
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

/** Merge any pre-auth guest journal into the signed-in user's journal once. */
export function migrateGuestJournalIfNeeded(userId: string) {
  try {
    const legacy = localStorage.getItem(LEGACY_JOURNAL_KEY);
    if (!legacy) return;
    const guest = JSON.parse(legacy) as JournalState;
    if (!guest?.entries || !Object.keys(guest.entries).length) {
      localStorage.removeItem(LEGACY_JOURNAL_KEY);
      return;
    }
    const current = readJournal(userId);
    const merged: JournalState = { entries: { ...current.entries } };
    for (const [id, entry] of Object.entries(guest.entries)) {
      const existing = merged.entries[id];
      if (!existing) {
        merged.entries[id] = entry;
        continue;
      }
      merged.entries[id] = {
        ...existing,
        ...entry,
        collectedAt: existing.collectedAt || entry.collectedAt,
        playedAt: existing.playedAt || entry.playedAt,
      };
    }
    writeJournal(merged, userId);
    localStorage.removeItem(LEGACY_JOURNAL_KEY);
  } catch {
    // ignore corrupt legacy data
  }
}

export function isInJournal(gameId: string, kind: JournalKind): boolean {
  const entry = readJournal().entries[gameId];
  if (!entry) return false;
  return kind === "collected" ? Boolean(entry.collectedAt) : Boolean(entry.playedAt);
}

export function toggleJournal(game: Game, kind: JournalKind): JournalState {
  if (!getSession()) return empty;
  const state = readJournal();
  const existing = state.entries[game.id] ?? stubFromGame(game);
  const now = new Date().toISOString();

  if (kind === "collected") {
    if (existing.collectedAt) delete existing.collectedAt;
    else existing.collectedAt = now;
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
  if (!getSession()) return empty;
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

export function journalStorageSnapshot(): string {
  const key = activeJournalKey();
  if (!key) return "";
  return `${key}:${localStorage.getItem(key) ?? ""}`;
}
