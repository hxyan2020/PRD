import assert from "node:assert/strict";
import {
  ALBUM_KEY,
  addToAlbum,
  archiveTotal,
  loadAlbum,
  normalizeAlbumIds,
  parseAlbum,
  removeFromAlbum,
  saveAlbum,
} from "../src/album.js";

assert.deepEqual(normalizeAlbumIds(["a", "a", "", "b"]), ["a", "b"]);
assert.deepEqual(parseAlbum(null), { ids: [], addedAt: {} });

const added = addToAlbum({ ids: [], addedAt: {} }, "ext-1", new Date("2026-11-09T01:00:00Z"));
assert.deepEqual(added.ids, ["ext-1"]);
assert.equal(added.addedAt["ext-1"], "2026-11-09T01:00:00.000Z");
assert.deepEqual(addToAlbum(added, "ext-1").ids, ["ext-1"]);

const removed = removeFromAlbum(added, "ext-1");
assert.deepEqual(removed.ids, []);
assert.deepEqual(removed.addedAt, {});

assert.equal(archiveTotal(1000, ["ext-1", "Q1"], new Set(["Q1"])), 1001);
assert.equal(archiveTotal(1000, [], new Set()), 1000);

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};
saveAlbum(added, memory);
assert.ok(memory.getItem(ALBUM_KEY));
assert.deepEqual(loadAlbum(memory).ids, ["ext-1"]);

console.log("album tests ok");
