import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Game } from "../types/game";
import type { JournalKind, JournalState } from "../types/journal";
import { AUTH_EVENT, SESSION_KEY } from "../lib/auth";
import {
  JOURNAL_EVENT,
  journalCounts,
  journalStorageSnapshot,
  listJournal,
  readJournal,
  removeFromJournal,
  toggleJournal,
} from "../lib/journal";

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(JOURNAL_EVENT, handler);
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(JOURNAL_EVENT, handler);
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): string {
  return `${localStorage.getItem(SESSION_KEY) ?? ""}|${journalStorageSnapshot()}`;
}

function getServerSnapshot(): string {
  return "";
}

export function useJournal() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [state, setState] = useState<JournalState>(() => readJournal());

  useEffect(() => {
    setState(readJournal());
  }, [raw]);

  const toggle = useCallback((game: Game, kind: JournalKind) => {
    setState(toggleJournal(game, kind));
  }, []);

  const remove = useCallback((gameId: string, kind: JournalKind) => {
    setState(removeFromJournal(gameId, kind));
  }, []);

  const collected = listJournal("collected");
  const played = listJournal("played");
  const counts = journalCounts();

  const statusFor = useCallback(
    (gameId: string) => {
      const entry = state.entries[gameId];
      return {
        collected: Boolean(entry?.collectedAt),
        played: Boolean(entry?.playedAt),
      };
    },
    [state.entries],
  );

  return { state, collected, played, counts, toggle, remove, statusFor };
}
