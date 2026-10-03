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

import {
  alignTranslatedChunk,
  chunkLyricLines,
  detectLyricsLanguage,
  gtxUrl,
  isSkippableLyricLine,
  isUnusableTranslation,
  lyricsNeedTranslation,
  parseGtxPayload,
  pickTranslatedText,
  splitLyricLines,
  translateLyricLines,
} from "../src/lyrics-translate.js";

assert.equal(detectLyricsLanguage("I've been tryna call you on the phone and I have to tell you"), "en");
assert.equal(detectLyricsLanguage("Je t'aime pour toujours dans les rues de Paris et je ne peux pas"), "fr");
assert.equal(detectLyricsLanguage("我爱你 夜空中最亮的星 一直在"), "zh");
assert.equal(detectLyricsLanguage("أنا أحبك يا ليلى في الليل"), "ar");
assert.equal(lyricsNeedTranslation("I've been tryna call you on the phone", "en"), false);
assert.equal(lyricsNeedTranslation("I've been tryna call you on the phone", "zh"), true);
assert.equal(lyricsNeedTranslation("我爱你 夜空中最亮的星", "zh"), false);
assert.equal(isUnusableTranslation("MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY", "I rise"), true);
assert.equal(isUnusableTranslation("但我仍会站起来", "But still, I rise"), false);
assert.equal(parseGtxPayload([[["但我仍会站起来\n别惊讶", "But still, I rise\nDon't be surprised"]]]), "但我仍会站起来\n别惊讶");
assert.match(gtxUrl("But still, I rise", "zh"), /translate\.googleapis\.com/);
assert.match(gtxUrl("But still, I rise", "zh"), /tl=zh-CN/);
assert.equal(isSkippableLyricLine("♪"), true);
assert.equal(isSkippableLyricLine("Yeah"), false);
assert.equal(isSkippableLyricLine("我爱你"), false);

const lines = splitLyricLines("One\n\nTwo");
assert.deepEqual(lines, ["One", "", "Two"]);
const chunks = chunkLyricLines(lines, 3);
assert.equal(chunks.length, 2);
assert.equal(chunks[0][0].index, 0);
assert.equal(chunks[1][0].index, 2);

const aligned = alignTranslatedChunk(
  [
    { index: 0, text: "One" },
    { index: 2, text: "Two" },
  ],
  "一\n二"
);
assert.equal(aligned[0].translated, "一");
assert.equal(aligned[1].translated, "二");
assert.equal(alignTranslatedChunk([{ index: 0, text: "One" }], "uno\ndos"), null);

const hindiPick = pickTranslatedText(
  {
    responseData: { translatedText: "I love you", match: 1 },
    matches: [
      { translation: "I love you" },
      { translation: "मैं तुमसे प्यार करता हूँ" },
    ],
  },
  "I love you",
  "hi"
);
assert.match(hindiPick, /प्यार/);

const zhCalls = [];
const translated = await translateLyricLines("I love you\nI miss you", "zh", {
  cache: new Map(),
  fetchFn: async (url) => {
    zhCalls.push(url);
    if (String(url).includes("translate.googleapis.com")) {
      return {
        ok: true,
        json: async () => [[["我爱你\n我想你", "I love you\nI miss you"]]],
      };
    }
    throw new Error(`unexpected ${url}`);
  },
});
assert.equal(translated.needed, true);
assert.deepEqual(translated.translations, ["我爱你", "我想你"]);
assert.equal(zhCalls.length, 1);

const memoryFallback = await translateLyricLines("I love you\nI miss you", "zh", {
  cache: new Map(),
  fetchFn: async (url) => {
    if (String(url).includes("translate.googleapis.com")) {
      return { ok: false, json: async () => ([]) };
    }
    return {
      ok: true,
      json: async () => ({ responseData: { translatedText: "我爱你\n我想你" } }),
    };
  },
});
assert.deepEqual(memoryFallback.translations, ["我爱你", "我想你"]);

const sameLang = await translateLyricLines("I love you on the phone tonight", "en", { cache: new Map(), fetchFn: async () => { throw new Error("should not fetch"); } });
assert.equal(sameLang.needed, false);

const failed = await translateLyricLines("I love you\nI miss you", "zh", {
  cache: new Map(),
  fetchFn: async () => ({ ok: false, json: async () => ({}) }),
});
assert.equal(failed.needed, true);
assert.deepEqual(failed.translations, ["", ""]);

console.log("lyrics tests ok");
