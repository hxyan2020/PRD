"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCollectedItem,
  clearSession,
  CREDENTIALS_SEEN_KEY,
  DESK_USERNAME,
  emptyCollection,
  isCollected,
  readCollection,
  readSession,
  removeCollectedItem,
  verifyCredentials,
  writeCollection,
  writeSession,
  type DeskSession,
} from "@/lib/deskAccount";
import type { NewsItem } from "@/lib/types";

interface DeskAccountValue {
  ready: boolean;
  session: DeskSession | null;
  items: NewsItem[];
  showCredentials: boolean;
  dismissCredentials: () => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  collect: (item: NewsItem) => void;
  remove: (itemId: string) => void;
  collected: (itemId: string) => boolean;
}

const DeskAccountContext = createContext<DeskAccountValue | null>(null);

export function DeskAccountProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<DeskSession | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    const existing = readSession(window.localStorage);
    if (existing) {
      setSession(existing);
      setItems(readCollection(window.localStorage, existing.username).items);
      setShowCredentials(window.localStorage.getItem(CREDENTIALS_SEEN_KEY) !== "1");
    } else {
      const created = writeSession(window.localStorage, DESK_USERNAME);
      setSession(created);
      setItems(readCollection(window.localStorage, DESK_USERNAME).items);
      setShowCredentials(true);
    }
    setReady(true);
  }, []);

  const persistItems = useCallback((username: string, next: NewsItem[], updatedAt: string) => {
    writeCollection(window.localStorage, { username, items: next, updatedAt });
    setItems(next);
  }, []);

  const login = useCallback((username: string, password: string) => {
    if (!verifyCredentials(username, password)) return false;
    const next = writeSession(window.localStorage, username);
    setSession(next);
    setItems(readCollection(window.localStorage, next.username).items);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSession(window.localStorage);
    setSession(null);
    setItems([]);
  }, []);

  const collect = useCallback(
    (item: NewsItem) => {
      if (!session) return;
      const current = {
        ...emptyCollection(session.username),
        items,
      };
      const next = addCollectedItem(current, item);
      persistItems(session.username, next.items, next.updatedAt);
    },
    [items, persistItems, session],
  );

  const remove = useCallback(
    (itemId: string) => {
      if (!session) return;
      const current = {
        ...emptyCollection(session.username),
        items,
      };
      const next = removeCollectedItem(current, itemId);
      persistItems(session.username, next.items, next.updatedAt);
    },
    [items, persistItems, session],
  );

  const dismissCredentials = useCallback(() => {
    window.localStorage.setItem(CREDENTIALS_SEEN_KEY, "1");
    setShowCredentials(false);
  }, []);

  const value = useMemo<DeskAccountValue>(
    () => ({
      ready,
      session,
      items,
      showCredentials,
      dismissCredentials,
      login,
      logout,
      collect,
      remove,
      collected: (itemId: string) => isCollected({ username: session?.username ?? "", items, updatedAt: "" }, itemId),
    }),
    [collect, dismissCredentials, items, login, logout, ready, remove, session, showCredentials],
  );

  return <DeskAccountContext.Provider value={value}>{children}</DeskAccountContext.Provider>;
}

export function useDeskAccount(): DeskAccountValue {
  const context = useContext(DeskAccountContext);
  if (!context) {
    throw new Error("useDeskAccount must be used inside DeskAccountProvider");
  }
  return context;
}
