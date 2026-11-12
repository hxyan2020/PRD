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
  loginOpen: boolean;
  pendingItem: NewsItem | null;
  openLogin: (item?: NewsItem) => void;
  closeLogin: () => void;
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
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    const existing = readSession(window.localStorage);
    if (existing) {
      setSession(existing);
      setItems(readCollection(window.localStorage, existing.username).items);
    }
    setReady(true);
  }, []);

  const persistItems = useCallback((username: string, next: NewsItem[], updatedAt: string) => {
    writeCollection(window.localStorage, { username, items: next, updatedAt });
    setItems(next);
  }, []);

  const openLogin = useCallback((item?: NewsItem) => {
    setPendingItem(item ?? null);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    setPendingItem(null);
  }, []);

  const login = useCallback((username: string, password: string) => {
    if (!verifyCredentials(username, password)) return false;
    const next = writeSession(window.localStorage, username);
    const stored = readCollection(window.localStorage, next.username);
    const pending = pendingItem;
    const updated = pending ? addCollectedItem(stored, pending) : stored;
    if (pending) {
      writeCollection(window.localStorage, updated);
    }
    setSession(next);
    setItems(updated.items);
    setLoginOpen(false);
    setPendingItem(null);
    return true;
  }, [pendingItem]);

  const logout = useCallback(() => {
    clearSession(window.localStorage);
    setSession(null);
    setItems([]);
  }, []);

  const collect = useCallback(
    (item: NewsItem) => {
      if (!session) {
        openLogin(item);
        return;
      }
      const current = {
        ...emptyCollection(session.username),
        items,
      };
      const next = addCollectedItem(current, item);
      persistItems(session.username, next.items, next.updatedAt);
    },
    [items, openLogin, persistItems, session],
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

  const value = useMemo<DeskAccountValue>(
    () => ({
      ready,
      session,
      items,
      loginOpen,
      pendingItem,
      openLogin,
      closeLogin,
      login,
      logout,
      collect,
      remove,
      collected: (itemId: string) => isCollected({ username: session?.username ?? "", items, updatedAt: "" }, itemId),
    }),
    [closeLogin, collect, items, login, loginOpen, logout, openLogin, pendingItem, ready, remove, session],
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
