import assert from "node:assert/strict";
import {
  cleanLyricsText,
  fetchLyrics,
  lyricsAlbum,
  lyricsArtist,
  lyricsCacheKey,
  lyricsOvhUrl,
  lrclibGetUrl,
  lrclibSearchUrl,
  parseLyricsPayload,
  pickSearchHit,
  stripSyncedLines,
} from "../src/lyrics.js";

assert.equal(
  lyricsArtist({ band: "—", singer: "The Weeknd", composer: "The Weeknd", name: "Blinding Lights" }),
  "The Weeknd"
);
assert.equal(lyricsAlbum({ extra: true, musicCompany: "After Hours" }), "After Hours");
assert.equal(lyricsAlbum({ extra: false, musicCompany: "Republic" }), "");
assert.match(lrclibGetUrl({ artistName: "The Weeknd", trackName: "Blinding Lights" }), /track_name=Blinding/);
assert.match(lrclibSearchUrl({ artistName: "Queen", trackName: "Bohemian Rhapsody" }), /artist_name=Queen/);
assert.equal(
  lyricsOvhUrl("AC/DC", "Back in Black"),
  "https://api.lyrics.ovh/v1/AC%2FDC/Back%20in%20Black"
);
assert.equal(stripSyncedLines("[00:12.00] Hello night"), "Hello night");
assert.match(cleanLyricsText("Paroles de la chanson Test\nCity lights"), /City lights/);

const parsed = parseLyricsPayload({ plainLyrics: "One\nTwo" }, "lrclib");
assert.equal(parsed.status, "ok");
assert.equal(parsed.text, "One\nTwo");
assert.equal(parseLyricsPayload({ instrumental: true }, "lrclib").status, "instrumental");
assert.equal(parseLyricsPayload({ lyrics: "" }, "ovh"), null);

const hit = pickSearchHit(
  [
    { trackName: "Other", artistName: "X", plainLyrics: "no" },
    { trackName: "Blinding Lights", artistName: "The Weeknd", plainLyrics: "I been tryna call" },
  ],
  "Blinding Lights",
  "The Weeknd"
);
assert.equal(hit.trackName, "Blinding Lights");

const calls = [];
const cache = new Map();
const fetchFn = async (url) => {
  calls.push(url);
  if (String(url).includes("/api/get")) {
    return {
      ok: true,
      json: async () => ({ plainLyrics: "I been tryna call\nI been on my own" }),
    };
  }
  throw new Error(`unexpected ${url}`);
};

const first = await fetchLyrics(
  { name: "Blinding Lights", singer: "The Weeknd", band: "—" },
  { fetchFn, cache }
);
assert.equal(first.status, "ok");
assert.match(first.text, /tryna call/);
assert.equal(first.source, "lrclib");
assert.equal(lyricsCacheKey("The Weeknd", "Blinding Lights"), lyricsCacheKey("the  weeknd", "Blinding Lights"));

const second = await fetchLyrics(
  { name: "Blinding Lights", singer: "The Weeknd", band: "—" },
  { fetchFn, cache }
);
assert.equal(second.text, first.text);
assert.equal(calls.length, 1, "cached lookups must not hit the network again");

const missingCalls = [];
const missing = await fetchLyrics(
  { name: "No Such Song", singer: "Nobody" },
  {
    cache: new Map(),
    fetchFn: async (url) => {
      missingCalls.push(url);
      return { ok: false, json: async () => ({}) };
    },
  }
);
assert.equal(missing.status, "missing");
assert.ok(missingCalls.some((url) => String(url).includes("lrclib.net/api/get")));
assert.ok(missingCalls.some((url) => String(url).includes("lrclib.net/api/search")));
assert.ok(missingCalls.some((url) => String(url).includes("api.lyrics.ovh")));

const ovhOnly = await fetchLyrics(
  { name: "Imagine", singer: "John Lennon", band: "—" },
  {
    cache: new Map(),
    fetchFn: async (url) => {
      if (String(url).includes("lyrics.ovh")) {
        return { ok: true, json: async () => ({ lyrics: "Imagine all the people" }) };
      }
      return { ok: false, json: async () => ({}) };
    },
  }
);
assert.equal(ovhOnly.status, "ok");
assert.equal(ovhOnly.source, "ovh");
assert.match(ovhOnly.text, /Imagine all the people/);

console.log("lyrics tests ok");
