import assert from "node:assert/strict";
import {
  COLLECTION_KEY,
  formatCollectedAt,
  loadCollectedIds,
  loadCollection,
  normalizeIds,
  parseCollection,
  saveCollectedIds,
  saveCollection,
  toggleCollected,
} from "../src/collections.js";

assert.deepEqual(normalizeIds(["a", "a", "", "b"]), ["a", "b"]);
assert.deepEqual(normalizeIds({ ids: ["x", "x"] }), ["x"]);
assert.deepEqual(normalizeIds(null), []);

const added = toggleCollected({ ids: [], collectedAt: {} }, "song-1", new Date("2026-09-05T08:45:00Z"));
assert.deepEqual(added.ids, ["song-1"]);
assert.equal(added.collectedAt["song-1"], "2026-09-05T08:45:00.000Z");

const removed = toggleCollected(added, "song-1");
assert.deepEqual(removed.ids, []);
assert.deepEqual(removed.collectedAt, {});

const second = toggleCollected(added, "song-2", new Date("2026-09-06T01:00:00Z"));
assert.deepEqual(second.ids, ["song-2", "song-1"]);
assert.equal(second.collectedAt["song-1"], "2026-09-05T08:45:00.000Z");

const legacy = parseCollection({ ids: ["old"] });
assert.deepEqual(legacy.ids, ["old"]);
assert.deepEqual(legacy.collectedAt, {});
assert.equal(formatCollectedAt(legacy.collectedAt.old), "Date not recorded");
assert.match(formatCollectedAt("2026-09-05T08:45:00.000Z"), /5 Sept? 2026/);

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

saveCollection(toggleCollected(loadCollection(memory), "gamma", new Date("2026-01-02T00:00:00Z")), memory);
assert.deepEqual(loadCollectedIds(memory), ["gamma", "alpha", "beta"]);
assert.ok(loadCollection(memory).collectedAt.gamma);

saveCollection(toggleCollected(loadCollection(memory), "gamma"), memory);
assert.deepEqual(loadCollectedIds(memory), ["alpha", "beta"]);
assert.equal(loadCollection(memory).collectedAt.gamma, undefined);

console.log("collection tests ok");
