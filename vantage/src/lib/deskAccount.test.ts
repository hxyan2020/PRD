import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCollectedItem,
  collectionStorageKey,
  DESK_PASSWORD,
  DESK_USERNAME,
  emptyCollection,
  isCollected,
  readCollection,
  readSession,
  removeCollectedItem,
  verifyCredentials,
  writeCollection,
  writeSession,
} from "./deskAccount";
import type { NewsItem } from "./types";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  } as Storage;
}

function story(id: string, caption = id): NewsItem {
  return {
    id,
    caption,
    captionZh: "",
    category: "product",
    sectors: ["banks"],
    keyPoints: [`Summary for ${caption}`],
    keyPointsZh: [],
    sources: [{ name: "Desk", url: `https://example.com/${id}`, sourceId: "desk" }],
    publishedAt: "2026-09-16T15:13:00.000Z",
    entities: ["jpm"],
    jurisdictions: ["United States"],
    impact: null,
    riskTools: [],
  };
}

describe("desk account", () => {
  it("accepts only the assigned desk credentials", () => {
    assert.equal(verifyCredentials(DESK_USERNAME, DESK_PASSWORD), true);
    assert.equal(verifyCredentials("HXYAN", DESK_PASSWORD), true);
    assert.equal(verifyCredentials(DESK_USERNAME, "wrong"), false);
    assert.equal(verifyCredentials("other", DESK_PASSWORD), false);
  });

  it("persists a session so the next visit stays logged in", () => {
    const storage = memoryStorage();
    const session = writeSession(storage, "Hxyan", new Date("2026-09-26T06:00:00.000Z"));
    assert.equal(session.username, "hxyan");
    assert.deepEqual(readSession(storage), session);
  });

  it("keeps collected stories after a later login on the same account", () => {
    const storage = memoryStorage();
    const first = addCollectedItem(emptyCollection("hxyan"), story("a", "JPMorgan card"));
    writeCollection(storage, first);
    const afterLogin = readCollection(storage, "hxyan");
    assert.equal(afterLogin.items.length, 1);
    assert.equal(afterLogin.items[0].caption, "JPMorgan card");
    assert.equal(isCollected(afterLogin, "a"), true);
  });

  it("adds once and removes from the collection", () => {
    const one = addCollectedItem(emptyCollection("hxyan"), story("a"));
    const two = addCollectedItem(one, story("a"));
    assert.equal(two.items.length, 1);
    const removed = removeCollectedItem(two, "a");
    assert.equal(removed.items.length, 0);
    assert.equal(isCollected(removed, "a"), false);
  });

  it("stores collection under a per-user key", () => {
    assert.equal(collectionStorageKey("HXYAN"), "vantage-collection:hxyan");
  });
});
