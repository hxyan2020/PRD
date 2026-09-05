import assert from "node:assert/strict";
import { recommendDaily, scoreTrack, utcDateKey, hashString } from "../src/recommend.js";

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

const jazzOnly = recommendDaily(tracks, { genre: "jazz", mood: "melancholy" }, new Date("2026-09-05Z"));
assert.equal(jazzOnly.track.id, "jazz");

const folkScore = scoreTrack(tracks[0], { mood: "sad", country: "Ireland" });
const danceScore = scoreTrack(tracks[1], { mood: "sad", country: "Ireland" });
assert.ok(folkScore.score > danceScore.score);

console.log("recommend tests ok");
