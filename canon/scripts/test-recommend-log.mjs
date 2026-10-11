import assert from "node:assert/strict";
import {
  RECOMMEND_LOG_KEY,
  appendRecommendation,
  formatLoggedAt,
  loadRecommendLog,
  parseRecommendLog,
  saveRecommendLog,
} from "../src/recommendLog.js";

assert.deepEqual(parseRecommendLog(null).entries, []);
assert.equal(parseRecommendLog({ entries: [{ name: "x" }] }).entries.length, 0);

const first = appendRecommendation(
  { entries: [] },
  {
    trackId: "t1",
    name: "Song One",
    artist: "Artist",
    mode: "daily",
    kind: "popular",
  },
  new Date("2026-09-05T08:00:00Z")
);
assert.equal(first.entries.length, 1);
assert.equal(first.entries[0].trackId, "t1");
assert.equal(first.entries[0].at, "2026-09-05T08:00:00.000Z");
assert.equal(first.entries[0].mode, "daily");

const sameDay = appendRecommendation(
  first,
  { trackId: "t1", name: "Song One", mode: "daily", kind: "popular" },
  new Date("2026-09-05T18:00:00Z")
);
assert.equal(sameDay, first, "same daily pick and prefs on the same UTC day is not duplicated");

const newPrefs = appendRecommendation(
  first,
  { trackId: "t1", name: "Song One", mode: "daily", mood: "calm" },
  new Date("2026-09-05T18:00:00Z")
);
assert.equal(newPrefs.entries.length, 2);

const surpriseA = appendRecommendation(
  first,
  { trackId: "t2", name: "Song Two", mode: "surprise" },
  new Date("2026-09-05T09:00:00Z")
);
const surpriseB = appendRecommendation(
  surpriseA,
  { trackId: "t2", name: "Song Two", mode: "surprise" },
  new Date("2026-09-05T09:05:00Z")
);
assert.equal(surpriseB.entries.length, 3, "every Surprise me is logged");
assert.equal(surpriseB.entries[0].mode, "surprise");

const beyond = appendRecommendation(
  { entries: [] },
  { trackId: "ext-1", name: "Outside", mode: "beyond", kind: "beyond" },
  new Date("2026-09-05T10:00:00Z")
);
assert.equal(beyond.entries[0].mode, "beyond");
const beyondAgain = appendRecommendation(
  beyond,
  { trackId: "ext-2", name: "Another", mode: "beyond" },
  new Date("2026-09-05T10:05:00Z")
);
assert.equal(beyondAgain.entries.length, 2, "every beyond stream can be logged");

assert.match(formatLoggedAt("2026-09-05T08:00:00.000Z"), /5 Sept? 2026/);

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};

assert.deepEqual(loadRecommendLog(memory).entries, []);
saveRecommendLog(first, memory);
assert.ok(memory.getItem(RECOMMEND_LOG_KEY));
assert.equal(loadRecommendLog(memory).entries[0].name, "Song One");

console.log("recommend log tests ok");
