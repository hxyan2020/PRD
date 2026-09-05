import assert from "node:assert/strict";
import {
  VIEWED_KEY,
  loadViewedIds,
  markViewed,
  saveViewedIds,
} from "../src/viewed.js";

assert.deepEqual(markViewed([], "song-1"), ["song-1"]);
assert.deepEqual(markViewed(["song-1"], "song-1"), ["song-1"], "viewed is unique");
assert.deepEqual(markViewed(["song-1"], "song-2"), ["song-2", "song-1"]);
assert.deepEqual(markViewed(["song-1"], ""), ["song-1"]);

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};

assert.deepEqual(loadViewedIds(memory), []);
saveViewedIds(["alpha", "alpha", "beta"], memory);
assert.deepEqual(JSON.parse(memory.getItem(VIEWED_KEY)).ids, ["alpha", "beta"]);
assert.deepEqual(loadViewedIds(memory), ["alpha", "beta"]);

saveViewedIds(markViewed(loadViewedIds(memory), "gamma"), memory);
assert.deepEqual(loadViewedIds(memory), ["gamma", "alpha", "beta"]);

console.log("viewed tests ok");
