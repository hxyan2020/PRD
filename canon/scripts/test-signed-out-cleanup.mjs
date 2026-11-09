import assert from "node:assert/strict";
import { ALBUM_KEY, loadAlbum, saveAlbum } from "../src/album.js";
import { EXTRA_KEY, loadExtraTracks, saveExtraTracks } from "../src/beyond.js";
import { COLLECTION_KEY, loadCollection, saveCollection } from "../src/collections.js";
import { RECOMMEND_LOG_KEY, loadRecommendLog, saveRecommendLog } from "../src/recommendLog.js";
import {
  clearSignedOutRecords,
  emptyAlbum,
  emptyCollection,
  emptyRecommendLog,
  loadPersonalRecords,
} from "../src/signedOutCleanup.js";
import { VIEWED_KEY, loadViewedIds, saveViewedIds } from "../src/viewed.js";
import { SESSION_KEY, USERS_KEY } from "../src/auth.js";

function memoryStore() {
  return {
    data: new Map(),
    getItem(key) {
      return this.data.has(key) ? this.data.get(key) : null;
    },
    setItem(key, value) {
      this.data.set(key, String(value));
    },
    removeItem(key) {
      this.data.delete(key);
    },
  };
}

const store = memoryStore();
saveCollection(
  {
    ids: ["ext-1", "Q1"],
    collectedAt: { "ext-1": "2026-11-09T01:00:00.000Z", Q1: "2026-11-09T02:00:00.000Z" },
  },
  store,
);
saveRecommendLog(
  {
    entries: [
      {
        id: "e1",
        at: "2026-11-09T03:00:00.000Z",
        trackId: "Q1",
        name: "Hello",
        mode: "daily",
      },
    ],
  },
  store,
);
saveAlbum(
  {
    ids: ["ext-1", "ext-2", "ext-3"],
    addedAt: {
      "ext-1": "2026-11-09T01:00:00.000Z",
      "ext-2": "2026-11-09T01:10:00.000Z",
      "ext-3": "2026-11-09T01:20:00.000Z",
    },
  },
  store,
);
saveViewedIds(["Q1", "Q2", "ext-1", "ext-2", "ext-3", "Q3", "Q4"], store);
saveExtraTracks(
  {
    "ext-1": { id: "ext-1", extra: true, name: "Apocalypse" },
    "ext-2": { id: "ext-2", extra: true, name: "K." },
    "ext-3": { id: "ext-3", extra: true, name: "Nothing's Gonna Hurt You Baby" },
  },
  store,
);

assert.equal(loadCollection(store).ids.length, 2);
assert.equal(loadRecommendLog(store).entries.length, 1);
assert.equal(loadAlbum(store).ids.length, 3);
assert.equal(loadViewedIds(store).length, 7);
assert.equal(Object.keys(loadExtraTracks(store)).length, 3);

const cleared = clearSignedOutRecords(store);
assert.deepEqual(cleared.collection, emptyCollection());
assert.deepEqual(cleared.recommendLog, emptyRecommendLog());
assert.deepEqual(cleared.album, emptyAlbum());
assert.deepEqual(cleared.viewedIds, []);
assert.deepEqual(cleared.extras, {});
assert.deepEqual(loadCollection(store).ids, []);
assert.deepEqual(loadRecommendLog(store).entries, []);
assert.deepEqual(loadAlbum(store).ids, []);
assert.deepEqual(loadViewedIds(store), []);
assert.deepEqual(loadExtraTracks(store), {});
assert.ok(store.getItem(COLLECTION_KEY));
assert.ok(store.getItem(RECOMMEND_LOG_KEY));
assert.ok(store.getItem(ALBUM_KEY));
assert.ok(store.getItem(VIEWED_KEY));
assert.ok(store.getItem(EXTRA_KEY));

saveAlbum({ ids: ["ext-9"], addedAt: {} }, store);
saveViewedIds(["Q9", "Q8"], store);
assert.equal(loadAlbum(store).ids.length, 1);
const bootCleared = loadPersonalRecords(store);
assert.ok(bootCleared);
assert.deepEqual(bootCleared.album.ids, []);
assert.deepEqual(bootCleared.viewedIds, []);
assert.deepEqual(loadAlbum(store).ids, []);
assert.deepEqual(loadViewedIds(store), []);

store.setItem(
  USERS_KEY,
  JSON.stringify([
    {
      email: "ada@example.com",
      name: "Ada",
      salt: "00",
      hash: "00",
      createdAt: "2026-11-09T00:00:00.000Z",
      updatedAt: "2026-11-09T00:00:00.000Z",
    },
  ]),
);
store.setItem(SESSION_KEY, JSON.stringify({ email: "ada@example.com" }));
saveAlbum({ ids: ["ext-keep"], addedAt: {} }, store);
assert.equal(loadPersonalRecords(store), null);
assert.deepEqual(loadAlbum(store).ids, ["ext-keep"]);

console.log("signed-out cleanup tests ok");
