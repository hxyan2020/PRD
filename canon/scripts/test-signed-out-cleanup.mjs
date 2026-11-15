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
  parkPersonalOnSignOut,
  restorePersonalOnSignIn,
} from "../src/signedOutCleanup.js";
import {
  PERSONAL_BY_USER_KEY,
  mergePersonalRecords,
  readActivePersonal,
} from "../src/personalRecords.js";
import { VIEWED_KEY, loadViewedIds, saveViewedIds } from "../src/viewed.js";
import { SESSION_KEY, USERS_KEY } from "../src/auth.js";
import { createPersonalHandler } from "../api/personal.js";
import { normalizePersonalPayload } from "../src/personalApi.js";

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

saveAlbum({ ids: ["ext-9"], addedAt: { "ext-9": "2026-11-09T04:00:00.000Z" } }, store);
saveExtraTracks({ "ext-9": { id: "ext-9", extra: true, name: "Apocalypse" } }, store);
saveViewedIds(["Q9", "Q8"], store);

// Signed-out boot shows a blank slate but must not destroy parked album data.
const bootView = loadPersonalRecords(store);
assert.ok(bootView);
assert.deepEqual(bootView.album.ids, []);
assert.deepEqual(bootView.viewedIds, []);
assert.deepEqual(loadAlbum(store).ids, ["ext-9"]);
assert.deepEqual(loadViewedIds(store), ["Q9", "Q8"]);

const parked = parkPersonalOnSignOut("ada@example.com", store);
assert.deepEqual(parked.album.ids, []);
assert.deepEqual(loadAlbum(store).ids, []);
assert.ok(store.getItem(PERSONAL_BY_USER_KEY));

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

const restored = restorePersonalOnSignIn("ada@example.com", store);
assert.deepEqual(restored.album.ids, ["ext-9"]);
assert.equal(restored.extras["ext-9"].name, "Apocalypse");
assert.deepEqual(loadAlbum(store).ids, ["ext-9"]);
assert.equal(loadPersonalRecords(store), null);

const merged = mergePersonalRecords(
  readActivePersonal(store),
  { album: { ids: ["ext-10"], addedAt: {} }, extras: { "ext-10": { id: "ext-10", name: "K." } } },
);
assert.deepEqual(merged.album.ids, ["ext-9", "ext-10"]);
assert.equal(merged.extras["ext-10"].name, "K.");

const remoteStore = new Map();
const handler = createPersonalHandler({
  configured: () => true,
  loadUsers: async () => [
    {
      email: "ada@example.com",
      name: "Ada",
      salt: "00",
      hash: "00",
      createdAt: "2026-11-09T00:00:00.000Z",
      updatedAt: "2026-11-09T00:00:00.000Z",
    },
  ],
  loadUserPersonal: async (email) => remoteStore.get(email) || null,
  saveUserPersonal: async (email, personal) => {
    remoteStore.set(email, normalizePersonalPayload(personal));
  },
});

function invoke(action, body) {
  return new Promise((resolve) => {
    const chunks = [];
    const res = {
      statusCode: 200,
      setHeader() {},
      end(text) {
        chunks.push(String(text || ""));
        resolve({ statusCode: res.statusCode, body: JSON.parse(chunks.join("") || "{}") });
      },
    };
    handler({ method: "POST", body: { action, email: "ada@example.com", hash: "00", salt: "00", ...body } }, res);
  });
}

const put = await invoke("put", {
  personal: {
    album: { ids: ["ext-9"], addedAt: {} },
    extras: { "ext-9": { id: "ext-9", extra: true, name: "Apocalypse" } },
  },
});
assert.equal(put.statusCode, 200);
assert.equal(put.body.ok, true);
assert.deepEqual(put.body.personal.album.ids, ["ext-9"]);

const got = await invoke("get", {});
assert.equal(got.body.ok, true);
assert.equal(got.body.personal.extras["ext-9"].name, "Apocalypse");

console.log("signed-out cleanup tests ok");
