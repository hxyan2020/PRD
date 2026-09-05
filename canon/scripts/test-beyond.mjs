import assert from "node:assert/strict";
import {
  EXTRA_KEY,
  buildBeyondQuery,
  catalogSpotifyIds,
  extraId,
  extrasFromSearch,
  isExtraId,
  loadExtraTracks,
  mapSpotifyTrack,
  marketForCountry,
  mergeExtraTracks,
  moodQueryTerms,
  saveExtraTracks,
  searchTracksPath,
} from "../src/beyond.js";

assert.equal(extraId("abc"), "ext-abc");
assert.equal(isExtraId("ext-abc"), true);
assert.equal(isExtraId("Q1"), false);
assert.equal(marketForCountry("Japan"), "JP");
assert.equal(marketForCountry("UK"), "GB");
assert.equal(marketForCountry("Atlantis"), "");
assert.equal(moodQueryTerms("Dance"), "dance disco");
assert.match(buildBeyondQuery({ genre: "jazz", mood: "Calm" }), /genre:jazz/);
assert.match(buildBeyondQuery({ genre: "jazz", mood: "Calm" }), /calm acoustic/);
assert.equal(buildBeyondQuery({}), "year:1960-2026");
assert.match(searchTracksPath({ query: "genre:jazz", market: "JP", offset: 20 }), /\/search\?/);
assert.match(searchTracksPath({ query: "genre:jazz", market: "JP", offset: 20 }), /market=JP/);
assert.match(searchTracksPath({ query: "genre:jazz", market: "JP", offset: 20 }), /offset=20/);

const mapped = mapSpotifyTrack(
  {
    id: "0VjIjW4GlUZAMYd2vXMi3b",
    name: "After Hours",
    popularity: 88,
    artists: [{ name: "The Weeknd" }],
    album: {
      name: "After Hours",
      release_date: "2020-03-20",
      images: [{ url: "https://example.com/cover.jpg" }],
    },
    external_urls: { spotify: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" },
  },
  { genre: "synth-pop", country: "Canada" }
);
assert.equal(mapped.extra, true);
assert.equal(mapped.id, "ext-0VjIjW4GlUZAMYd2vXMi3b");
assert.equal(mapped.year, 2020);
assert.equal(mapped.genre, "synth-pop");
assert.match(mapped.spotifyEmbedUrl, /0VjIjW4GlUZAMYd2vXMi3b/);

const catalogIds = catalogSpotifyIds([{ spotifyId: "in-canon" }, { spotifyId: "" }]);
const filtered = extrasFromSearch(
  {
    tracks: {
      items: [
        { id: "in-canon", name: "Canon hit", artists: [], album: { images: [] } },
        { id: "fresh-1", name: "New song", artists: [{ name: "A" }], album: { images: [] } },
        { id: "fresh-1", name: "Duplicate", artists: [], album: { images: [] } },
      ],
    },
  },
  { prefs: { genre: "pop" }, catalogIds, alreadyIds: new Set() }
);
assert.equal(filtered.length, 1);
assert.equal(filtered[0].spotifyId, "fresh-1");

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};
const merged = mergeExtraTracks({}, filtered);
saveExtraTracks(merged, memory);
assert.ok(memory.getItem(EXTRA_KEY));
assert.equal(loadExtraTracks(memory)[filtered[0].id].name, "New song");

console.log("beyond tests ok");
