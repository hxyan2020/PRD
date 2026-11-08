import assert from "node:assert/strict";
import {
  applyExtraFacts,
  enrichExtraTrack,
  looksLikeBand,
  parseNationalityCountry,
  parseWrittenBy,
  pickWikiTitle,
} from "../src/enrich-extra.js";

assert.equal(parseNationalityCountry("a song by American band Cigarettes After Sex"), "United States");
assert.equal(parseWrittenBy("It was written and produced by vocalist Greg Gonzalez."), "Greg Gonzalez");
assert.equal(looksLikeBand("American dream pop band"), true);
assert.equal(looksLikeBand("Canadian singer-songwriter"), false);
assert.equal(
  pickWikiTitle(
    [
      { title: "Apocalypse (disambiguation)" },
      { title: "Apocalypse (Cigarettes After Sex song)" },
      { title: "Cigarettes After Sex" },
    ],
    "Apocalypse",
    "Cigarettes After Sex",
  ),
  "Apocalypse (Cigarettes After Sex song)",
);

const filled = applyExtraFacts(
  {
    extra: true,
    name: "Apocalypse",
    singer: "Cigarettes After Sex",
    band: "—",
    composer: "—",
    writer: "—",
    releaseCountry: "—",
    genre: "Alternative",
    year: 2017,
  },
  {
    extract:
      '"Apocalypse" is a song by American band Cigarettes After Sex, released as the second single from their debut album. It was written and produced by vocalist Greg Gonzalez.',
    description: "2017 single by Cigarettes After Sex",
    performer: "Cigarettes After Sex",
    asBand: true,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Apocalypse_(Cigarettes_After_Sex_song)",
    anecdote: "Apocalypse is a song by American band Cigarettes After Sex.",
  },
);
assert.equal(filled.band, "Cigarettes After Sex");
assert.equal(filled.singer, "—");
assert.equal(filled.composer, "Greg Gonzalez");
assert.equal(filled.writer, "Greg Gonzalez");
assert.equal(filled.releaseCountry, "United States");
assert.equal(filled.enriched, true);
assert.match(filled.wikipediaUrl, /Apocalypse/);

const calls = [];
const fetchFn = async (url) => {
  calls.push(String(url));
  const href = String(url);
  if (href.includes("list=search") && href.includes("Apocalypse")) {
    return {
      ok: true,
      json: async () => ({
        query: { search: [{ title: "Apocalypse (Cigarettes After Sex song)" }] },
      }),
    };
  }
  if (href.includes("list=search")) {
    return {
      ok: true,
      json: async () => ({ query: { search: [{ title: "Cigarettes After Sex" }] } }),
    };
  }
  if (href.includes("page/summary/Apocalypse")) {
    return {
      ok: true,
      json: async () => ({
        title: "Apocalypse (Cigarettes After Sex song)",
        description: "2017 single by Cigarettes After Sex",
        extract:
          '"Apocalypse" is a song by American band Cigarettes After Sex. It was written and produced by vocalist Greg Gonzalez.',
        wikibase_item: "Q119348395",
        content_urls: {
          desktop: { page: "https://en.wikipedia.org/wiki/Apocalypse_(Cigarettes_After_Sex_song)" },
        },
      }),
    };
  }
  if (href.includes("page/summary/Cigarettes")) {
    return {
      ok: true,
      json: async () => ({
        title: "Cigarettes After Sex",
        description: "American dream pop band",
        extract: "Cigarettes After Sex is an American dream pop band formed in El Paso, Texas, in 2008 by Greg Gonzalez.",
        wikibase_item: "Q25349372",
        thumbnail: { source: "https://example.com/cas.jpg" },
        content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Cigarettes_After_Sex" } },
      }),
    };
  }
  if (href.includes("media-list")) {
    return {
      ok: true,
      json: async () => ({
        items: [{ type: "image", srcset: [{ src: "https://example.com/cas-live.jpg" }], title: "File:CAS.jpg" }],
      }),
    };
  }
  if (href.includes("wbgetentities") && href.includes("Q119348395")) {
    return {
      ok: true,
      json: async () => ({
        entities: {
          Q119348395: { claims: { P136: [{ mainsnak: { datavalue: { value: { id: "Q1490170" } } } }] } },
          Q25349372: {
            claims: {
              P31: [{ mainsnak: { datavalue: { value: { id: "Q215380" } } } }],
              P495: [{ mainsnak: { datavalue: { value: { id: "Q30" } } } }],
            },
          },
        },
      }),
    };
  }
  if (href.includes("wbgetentities")) {
    return {
      ok: true,
      json: async () => ({
        entities: {
          Q1490170: { labels: { en: { value: "dream pop" } } },
          Q215380: { labels: { en: { value: "band" } } },
          Q30: { labels: { en: { value: "United States" } } },
        },
      }),
    };
  }
  throw new Error(`unexpected ${url}`);
};

const result = await enrichExtraTrack(
  {
    extra: true,
    name: "Apocalypse",
    singer: "Cigarettes After Sex",
    band: "—",
    composer: "—",
    writer: "—",
    releaseCountry: "—",
    genre: "Alternative",
    year: 2017,
  },
  { fetchFn },
);
assert.equal(result.track.band, "Cigarettes After Sex");
assert.equal(result.track.composer, "Greg Gonzalez");
assert.equal(result.track.releaseCountry, "United States");
assert.ok(result.track.anecdote.includes("American band"));
assert.ok(result.people["Cigarettes After Sex"].images.length >= 1);
assert.equal(result.track.enriched, true);

const cached = await enrichExtraTrack(result.track, { fetchFn });
assert.equal(cached.track, result.track);

console.log("enrich extra tests ok");
