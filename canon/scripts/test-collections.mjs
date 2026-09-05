import assert from "node:assert/strict";
import {
  COLLECTION_KEY,
  loadCollectedIds,
  normalizeIds,
  saveCollectedIds,
  toggleCollected,
} from "../src/collections.js";

assert.deepEqual(normalizeIds(["a", "a", "", "b"]), ["a", "b"]);
assert.deepEqual(normalizeIds({ ids: ["x", "x"] }), ["x"]);
assert.deepEqual(normalizeIds(null), []);

assert.deepEqual(toggleCollected([], "song-1"), ["song-1"]);
assert.deepEqual(toggleCollected(["song-1"], "song-1"), []);
assert.deepEqual(toggleCollected(["song-1"], "song-2"), ["song-2", "song-1"]);
assert.deepEqual(toggleCollected(["song-1"], ""), ["song-1"]);

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};

assert.deepEqual(loadCollectedIds(memory), []);
saveCollectedIds(["alpha", "beta"], memory);
assert.equal(JSON.parse(memory.getItem(COLLECTION_KEY)).ids[0], "alpha");
assert.deepEqual(loadCollectedIds(memory), ["alpha", "beta"]);

saveCollectedIds(toggleCollected(loadCollectedIds(memory), "alpha"), memory);
assert.deepEqual(loadCollectedIds(memory), ["beta"]);

console.log("collection tests ok");
