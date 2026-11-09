import assert from "node:assert/strict";
import { COLLECTION_KEY, loadCollection, saveCollection } from "../src/collections.js";
import { RECOMMEND_LOG_KEY, loadRecommendLog, saveRecommendLog } from "../src/recommendLog.js";
import { clearSignedOutRecords, emptyCollection, emptyRecommendLog } from "../src/signedOutCleanup.js";

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

assert.equal(loadCollection(store).ids.length, 2);
assert.equal(loadRecommendLog(store).entries.length, 1);

const cleared = clearSignedOutRecords(store);
assert.deepEqual(cleared.collection, emptyCollection());
assert.deepEqual(cleared.recommendLog, emptyRecommendLog());
assert.deepEqual(loadCollection(store).ids, []);
assert.deepEqual(loadRecommendLog(store).entries, []);
assert.ok(store.getItem(COLLECTION_KEY));
assert.ok(store.getItem(RECOMMEND_LOG_KEY));

console.log("signed-out cleanup tests ok");
