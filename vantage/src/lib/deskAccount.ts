import type { NewsItem } from "./types";

export const DESK_USERNAME = "hxyan";
export const DESK_PASSWORD = "VantageDesk26";

export const SESSION_STORAGE_KEY = "vantage-session";
export const CREDENTIALS_SEEN_KEY = "vantage-credentials-seen";

export interface DeskSession {
  username: string;
  loggedInAt: string;
}

export interface StoredCollection {
  username: string;
  items: NewsItem[];
  updatedAt: string;
}

export function collectionStorageKey(username: string): string {
  return `vantage-collection:${username.trim().toLowerCase()}`;
}

export function verifyCredentials(username: string, password: string): boolean {
  return (
    username.trim().toLowerCase() === DESK_USERNAME && password === DESK_PASSWORD
  );
}

export function readSession(storage: Storage): DeskSession | null {
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeskSession;
    if (!parsed?.username || !parsed.loggedInAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(storage: Storage, username: string, now = new Date()): DeskSession {
  const session: DeskSession = {
    username: username.trim().toLowerCase(),
    loggedInAt: now.toISOString(),
  };
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(storage: Storage): void {
  storage.removeItem(SESSION_STORAGE_KEY);
}

export function emptyCollection(username: string, now = new Date()): StoredCollection {
  return {
    username: username.trim().toLowerCase(),
    items: [],
    updatedAt: now.toISOString(),
  };
}

export function readCollection(storage: Storage, username: string): StoredCollection {
  try {
    const raw = storage.getItem(collectionStorageKey(username));
    if (!raw) return emptyCollection(username);
    const parsed = JSON.parse(raw) as StoredCollection;
    if (!Array.isArray(parsed?.items)) return emptyCollection(username);
    return {
      username: username.trim().toLowerCase(),
      items: parsed.items.filter((item) => item && typeof item.id === "string"),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return emptyCollection(username);
  }
}

export function writeCollection(storage: Storage, collection: StoredCollection): StoredCollection {
  storage.setItem(collectionStorageKey(collection.username), JSON.stringify(collection));
  return collection;
}

export function addCollectedItem(
  collection: StoredCollection,
  item: NewsItem,
  now = new Date(),
): StoredCollection {
  if (collection.items.some((entry) => entry.id === item.id)) return collection;
  return {
    ...collection,
    items: [item, ...collection.items],
    updatedAt: now.toISOString(),
  };
}

export function removeCollectedItem(
  collection: StoredCollection,
  itemId: string,
  now = new Date(),
): StoredCollection {
  if (!collection.items.some((entry) => entry.id === itemId)) return collection;
  return {
    ...collection,
    items: collection.items.filter((entry) => entry.id !== itemId),
    updatedAt: now.toISOString(),
  };
}

export function isCollected(collection: StoredCollection, itemId: string): boolean {
  return collection.items.some((entry) => entry.id === itemId);
}
