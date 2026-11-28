import assert from "node:assert/strict";
import {
  candidatePool,
  recommendDaily,
  scoreTrack,
  surprisePick,
  utcDateKey,
  hashString,
} from "../src/recommend.js";
import { EMPTY_LISTEN_PREFS, loadListenPrefs, saveListenPrefs } from "../src/listenPrefs.js";

const tracks = [
  {
    id: "folk",
    name: "Rain on the Heath",
    genre: "folk music",
    genres: ["folk music"],
    releaseCountry: "Ireland",
    streams: 50,
    year: 1968,
    whyShortlisted: "A melancholy lament of loss and lonely weather.",
  },
  {
    id: "dance",
    name: "Floor Lights",
    genre: "dance-pop",
    genres: ["dance-pop", "disco"],
    releaseCountry: "United States",
    streams: 9_000_000_000,
    year: 2016,
    whyShortlisted: "A club anthem built for the dance floor.",
  },
  {
    id: "jazz",
    name: "Midnight Window",
    genre: "jazz",
    genres: ["jazz"],
    releaseCountry: "United States",
    streams: 800_000,
    year: 1959,
    whyShortlisted: "A nocturnal jazz recording for late hours.",
  },
  {
    id: "hymn",
    name: "Morning Prayer",
    genre: "Christian hymn",
    genres: ["hymn"],
    releaseCountry: "United Kingdom",
    streams: 12_000,
    year: 1790,
    whyShortlisted: "A sacred hymn of faith and peace.",
  },
  {
    id: "jpop",
    name: "Tokyo Lights",
    genre: "J-pop",
    genres: ["J-pop"],
    releaseCountry: "Japan",
    streams: 100_000,
    year: 2005,
    whyShortlisted: "A Japanese pop single.",
  },
];

assert.equal(utcDateKey(new Date("2026-09-05T12:00:00Z")), "2026-09-05");
assert.equal(typeof hashString("abc"), "number");

const none = recommendDaily(tracks, {}, new Date("2026-09-05T00:00:00Z"));
assert.equal(none.mode, "popular");
assert.equal(none.track.id, "dance", "blank prefs pick from the most streamed");

const sameA = recommendDaily(tracks, {}, new Date("2026-09-05T00:00:00Z"));
const sameB = recommendDaily(tracks, {}, new Date("2026-09-05T23:00:00Z"));
assert.equal(sameA.track.id, sameB.track.id, "same UTC day keeps the same popular pick");

const ireland = recommendDaily(
  tracks,
  { country: "Ireland" },
  new Date("2026-09-05T00:00:00Z")
);
assert.equal(ireland.mode, "ai");
assert.equal(ireland.track.id, "folk");

const sad = recommendDaily(tracks, { mood: "melancholy" }, new Date("2026-09-05T00:00:00Z"));
assert.equal(sad.track.id, "folk");

const dance = recommendDaily(tracks, { genre: "jazz" }, new Date("2026-09-05T00:00:00Z"));
assert.equal(dance.track.id, "jazz");

const uk = recommendDaily(tracks, { country: "UK", mood: "spiritual" }, new Date("2026-01-02Z"));
assert.equal(uk.track.id, "hymn");

const japan = recommendDaily(tracks, { country: "Japan" }, new Date("2026-09-05Z"));
assert.equal(japan.track.id, "jpop");

const combo = {
  id: "dakiti",
  name: "Dakiti",
  genre: "reggaeton",
  genres: ["reggaeton"],
  releaseCountry: "Puerto Rico · United States",
  streams: 200_000,
};
const withCombo = [...tracks, combo];
assert.ok(
  candidatePool(withCombo, { country: "Puerto Rico" }).some((track) => track.id === "dakiti"),
  "a multi-country title matches each listed country",
);
assert.ok(candidatePool(withCombo, { country: "United States" }).some((track) => track.id === "dakiti"));
assert.equal(
  candidatePool(withCombo, { country: "Japan" }).some((track) => track.id === "dakiti"),
  false,
);

const jazzOnly = recommendDaily(tracks, { genre: "jazz", mood: "melancholy" }, new Date("2026-09-05Z"));
assert.equal(jazzOnly.track.id, "jazz");

const day = new Date("2026-09-05T12:00:00Z");
const first = recommendDaily(tracks, { country: "Ireland" }, day);
const changed = recommendDaily(tracks, { country: "Japan" }, day);
assert.equal(first.track.id, "folk");
assert.equal(changed.track.id, "jpop", "changing country the same day must change the pick");

const folkScore = scoreTrack(tracks[0], { mood: "sad", country: "Ireland" });
const danceScore = scoreTrack(tracks[1], { mood: "sad", country: "Ireland" });
assert.ok(folkScore.score > danceScore.score);

const emptySurprise = surprisePick([], { salt: 1 });
assert.equal(emptySurprise.track, null);

const firstSurprise = surprisePick(tracks, { excludeIds: ["dance"], salt: 1 });
assert.ok(firstSurprise.track);
assert.notEqual(firstSurprise.track.id, "dance");
assert.equal(firstSurprise.mode, "surprise");

const japanSurprise = surprisePick(tracks, { prefs: { country: "Japan" }, excludeIds: [], salt: 7 });
assert.equal(japanSurprise.track.id, "jpop");

const seen = new Set();
let exclude = ["dance"];
let current = "dance";
for (let salt = 0; salt < tracks.length - 1; salt += 1) {
  const pick = surprisePick(tracks, { excludeIds: exclude, salt, currentId: current });
  assert.ok(pick.track);
  assert.notEqual(pick.track.id, current, "surprise must not repeat the title on screen");
  assert.ok(!exclude.includes(pick.track.id), "surprise must prefer a never-shown recording");
  seen.add(pick.track.id);
  current = pick.track.id;
  exclude = [pick.track.id, ...exclude];
}
assert.equal(seen.size, tracks.length - 1, "Surprise me should walk unused titles before recycling");

// Once every title is excluded, keep serving infinitely but never the current card.
const allIds = tracks.map((track) => track.id);
const recycled = [];
let showing = "folk";
for (let salt = 0; salt < 12; salt += 1) {
  const pick = surprisePick(tracks, { excludeIds: allIds, salt, currentId: showing });
  assert.ok(pick.track, "surprise stays available after the catalog is exhausted");
  assert.notEqual(pick.track.id, showing, "recycled surprise must still change the card");
  recycled.push(pick.track.id);
  showing = pick.track.id;
}
assert.ok(new Set(recycled).size >= 2, "infinite Surprise me must keep changing titles");

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};
assert.deepEqual(loadListenPrefs(memory), EMPTY_LISTEN_PREFS);
saveListenPrefs({ mood: "Calm", country: "Japan", genre: "jazz" }, memory);
assert.deepEqual(loadListenPrefs(memory), { mood: "Calm", country: "Japan", genre: "jazz" });

console.log("recommend tests ok");
