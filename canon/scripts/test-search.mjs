import assert from "node:assert/strict";
import { extrasFromItunes, extraItunesId, itunesArtworkUrl, mapItunesTrack } from "../src/beyond.js";
import { searchMusicByName, searchOutsideMusic, outsideSearchParams } from "../src/music-search.js";
import { createMusicSearchHandler } from "../api/music-search.js";
import {
  ALL_COUNTRIES,
  ALL_ERAS,
  ALL_GENRES,
  MIN_NAME_QUERY,
  buildOutsideTerm,
  buildSpotifyOutsideTerm,
  extraMatchesEra,
  hasOutsideSearch,
  itunesSearchUrl,
  normalizeSearchText,
  searchTokens,
  sortTracks,
  trackMatchesQuery,
} from "../src/search.js";

assert.equal(normalizeSearchText("  The Cigarettes After Sex "), "the cigarettes after sex");
assert.deepEqual(searchTokens("The cigarettes after sex"), ["cigarettes", "after", "sex"]);
assert.equal(MIN_NAME_QUERY, 2);
assert.match(itunesSearchUrl("Cigarettes After Sex"), /entity=song/);

const inCanon = {
  name: "Blinding Lights",
  singer: "The Weeknd",
  band: "",
  composer: "",
  writer: "",
  musicCompany: "",
  genre: "synth-pop",
  releaseCountry: "Canada",
  year: 2019,
};
assert.equal(trackMatchesQuery(inCanon, "the weeknd"), true);
assert.equal(trackMatchesQuery(inCanon, "Blinding"), true);
assert.equal(trackMatchesQuery(inCanon, "cigarettes after sex"), false);

const mapped = mapItunesTrack({
  trackId: 1217977755,
  trackName: "Apocalypse",
  artistName: "Cigarettes After Sex",
  collectionName: "Cigarettes After Sex",
  releaseDate: "2017-06-09T12:00:00Z",
  primaryGenreName: "Alternative",
  previewUrl: "https://example.com/preview.m4a",
  artworkUrl100: "https://example.com/100x100bb.jpg",
});
assert.equal(mapped.id, extraItunesId(1217977755));
assert.equal(mapped.extra, true);
assert.equal(mapped.extraSource, "itunes");
assert.equal(mapped.name, "Apocalypse");
assert.equal(mapped.singer, "Cigarettes After Sex");
assert.equal(mapped.year, 2017);
assert.equal(mapped.releaseCountry, "—");
assert.equal(mapped.previewUrl, "https://example.com/preview.m4a");
const hinted = mapItunesTrack(
  {
    trackId: 2,
    trackName: "Soho",
    artistName: "A",
    primaryGenreName: "Jazz",
    releaseDate: "2012-01-01T00:00:00Z",
  },
  { genre: "Jazz", country: "United Kingdom" },
);
assert.equal(hinted.genre, "Jazz");
assert.equal(hinted.releaseCountry, "United Kingdom");
assert.equal(hasOutsideSearch({ query: "x" }), false);
assert.equal(hasOutsideSearch({ query: "xx" }), true);
assert.equal(hasOutsideSearch({ query: "", genre: "Jazz" }), true);
assert.equal(hasOutsideSearch({ query: "", era: "2010s" }), true);
assert.equal(hasOutsideSearch({ query: "", country: "Japan" }), true);
assert.equal(hasOutsideSearch({ query: "", genre: ALL_GENRES, era: ALL_ERAS, country: ALL_COUNTRIES }), false);
assert.equal(buildOutsideTerm({ genre: "Jazz", era: "2010s" }), "Jazz 2010");
assert.equal(buildOutsideTerm({ country: "Japan" }), "Japan");
assert.equal(buildSpotifyOutsideTerm({ genre: "Jazz", era: "2010s" }), "genre:Jazz year:2010-2019");
assert.equal(extraMatchesEra({ year: 2012 }, "2010s", (year) => `${String(year).slice(0, 3)}0s`), true);
assert.equal(extraMatchesEra({ year: 1999 }, "2010s", (year) => `${String(year).slice(0, 3)}0s`), false);
assert.equal(sortTracks([{ name: "B", streams: 1 }, { name: "A", streams: 9 }], "streams")[0].name, "A");
assert.equal(outsideSearchParams({ query: "xx", genre: "Jazz", era: ALL_ERAS }).get("genre"), "Jazz");
assert.equal(outsideSearchParams({ query: "xx", era: ALL_ERAS }).has("era"), false);
assert.equal(itunesArtworkUrl("https://example.com/100x100bb.jpg"), "https://example.com/600x600bb.jpg");
assert.match(mapped.spotifyUrl, /open\.spotify\.com\/search/);

const filtered = extrasFromItunes(
  {
    results: [
      { trackId: 1, trackName: "Apocalypse", artistName: "Cigarettes After Sex", kind: "song" },
      { trackId: 1, trackName: "Duplicate", artistName: "Cigarettes After Sex", kind: "song" },
      { trackId: 2, trackName: "Blinding Lights", artistName: "The Weeknd", kind: "song" },
    ],
  },
  { catalogNames: new Set(["blinding lights|the weeknd"]) },
);
assert.equal(filtered.length, 1);
assert.equal(filtered[0].name, "Apocalypse");

const handler = createMusicSearchHandler({
  spotify: async () => [],
  itunes: async (filters) =>
    extrasFromItunes({
      results: [{ trackId: 9, trackName: filters.query || filters.genre, artistName: "A", kind: "song" }],
    }),
});
const found = await invoke(handler, "/api/music-search?q=Apocalypse");
assert.equal(found.status, 200);
assert.equal(found.body.ok, true);
assert.equal(found.body.tracks[0].name, "Apocalypse");

const byGenre = await invoke(handler, "/api/music-search?genre=Jazz");
assert.equal(byGenre.status, 200);
assert.equal(byGenre.body.tracks[0].name, "Jazz");

const byEra = await invoke(handler, "/api/music-search?era=2010s");
assert.equal(byEra.status, 200);

const short = await invoke(handler, "/api/music-search?q=a");
assert.equal(short.body.ok, false);
assert.equal((await invoke(handler, "/api/music-search")).body.ok, false);

const named = await searchMusicByName("xx", {
  fetchFn: async (url) => {
    if (String(url).includes("/api/music-search")) {
      return {
        ok: true,
        json: async () => ({ ok: true, source: "api", tracks: [{ id: "ext-1", name: "From API" }] }),
      };
    }
    throw new Error("should not fall back");
  },
});
assert.equal(named.tracks[0].name, "From API");

const filteredSearch = await searchOutsideMusic(
  { query: "", genre: "Jazz", era: "2010s", country: "United Kingdom" },
  {
    fetchFn: async (url) => {
      const href = String(url);
      if (href.includes("/api/music-search")) {
        assert.match(href, /genre=Jazz/);
        assert.match(href, /era=2010s/);
        assert.match(href, /country=United\+Kingdom|country=United%20Kingdom/);
        return {
          ok: true,
          json: async () => ({ ok: true, source: "api", tracks: [{ id: "ext-jazz", name: "Jazz Night", year: 2012 }] }),
        };
      }
      throw new Error("should not fall back");
    },
  },
);
assert.equal(filteredSearch.tracks[0].name, "Jazz Night");

console.log("search tests ok");

function invoke(handler, url, method = "GET") {
  return new Promise((resolve) => {
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(text) {
        chunks.push(String(text || ""));
        resolve({ status: this.statusCode, body: JSON.parse(chunks.join("") || "{}") });
      },
    };
    void handler({ method, url, headers: { host: "127.0.0.1" } }, res);
  });
}
