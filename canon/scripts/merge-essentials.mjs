#!/usr/bin/env node
/**
 * Merge a curated list of historically essential Spotify recordings into the
 * Canon catalog, replacing the lowest-ranked entries so the list stays at 1000.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hdCoverUrl } from "../src/cover.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";

async function fetchJson(url, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

async function oembed(id) {
  try {
    const data = await fetchJson(
      "https://open.spotify.com/oembed?url=" +
        encodeURIComponent(`https://open.spotify.com/track/${id}`)
    );
    if (!data?.thumbnail_url || !data?.title) return null;
    return { ...data, thumbnail_url: hdCoverUrl(data.thumbnail_url) };
  } catch {
    return null;
  }
}

async function wikidataBySpotify(id) {
  const query = `
SELECT ?item ?itemLabel ?sitelinks ?desc ?enwiki WHERE {
  ?item wdt:P2207 "${id}".
  ?item wikibase:sitelinks ?sitelinks.
  OPTIONAL {
    ?article schema:about ?item ;
             schema:isPartOf <https://en.wikipedia.org/> ;
             schema:name ?enwiki.
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,mul".
    ?item rdfs:label ?itemLabel.
    ?item schema:description ?desc.
  }
}
LIMIT 1`;
  try {
    const data = await fetchJson(
      "https://query.wikidata.org/sparql?" + new URLSearchParams({ format: "json", query }),
      60000
    );
    const b = data.results.bindings[0];
    if (!b) return null;
    return {
      qid: String(b.item.value).split("/").pop(),
      name: b.itemLabel?.value,
      description: b.desc?.value || "",
      sitelinks: Number(b.sitelinks.value),
      enwiki: b.enwiki?.value || "",
    };
  } catch {
    return null;
  }
}

function inferArtist(description, extract) {
  const texts = [description, extract].filter(Boolean);
  const patterns = [
    /^(?:\d{4} )?(?:promotional )?(?:single|song|recording|track|audio track|vocal track|hymn|anthem|composition|music track) by (.+?)(?: featuring | feat\. |;|$)/i,
    /^(?:original )?song written, composed, and performed by (.+)$/i,
    /^(.+?) song$/i,
    /performed by (.+?)(?: for |$)/i,
  ];
  for (const text of texts) {
    for (const re of patterns) {
      const m = String(text).match(re);
      if (!m) continue;
      const name = m[1].replace(/\s+/g, " ").trim();
      if (name.length > 2 && name.length < 80) return name;
    }
  }
  return "";
}

function yearFromText(value) {
  const m = String(value || "").match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
  if (!m) return null;
  const year = Number(m[1]);
  return year >= 1500 && year <= 2026 ? year : null;
}

function whyFor(track) {
  const bits = [];
  if (track.extract) bits.push(track.extract.split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));
  else if (track.description) bits.push(track.description.replace(/^./, (c) => c.toUpperCase()) + ".");
  bits.push(
    `Shortlisted as an essential recording in the human listening canon${track.year ? `, first issued in ${track.year}` : ""}.`
  );
  if (track.streams) {
    bits.push(`On Spotify it has ${track.streams.toLocaleString("en-US")} documented plays.`);
  }
  return bits.join(" ").replace(/\s+/g, " ").trim();
}

async function main() {
  const catalogPath = path.join(root, "public", "catalog.json");
  const essentialsPath = path.join(root, "scripts", "essentials.json");
  const data = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const seed = JSON.parse(await fs.readFile(essentialsPath, "utf8"));
  const byId = new Map();
  for (const row of seed) {
    if (/^[0-9A-Za-z]{22}$/.test(row.spotifyId)) byId.set(row.spotifyId, row);
  }

  const existingIds = new Set(data.tracks.map((t) => t.spotifyId));
  const existingNames = new Set(data.tracks.map((t) => t.name.toLowerCase()));
  const toFetch = [...byId.values()].filter(
    (row) => !existingIds.has(row.spotifyId) && !existingNames.has(row.name.toLowerCase())
  );
  console.log(`essentials unique ${byId.size}; already in catalog skipped; fetching ${toFetch.length}`);

  const live = (await mapPool(toFetch, 6, async (row) => {
    const oem = await oembed(row.spotifyId);
    if (!oem) return null;
    const wd = await wikidataBySpotify(row.spotifyId);
    let extract = "";
    if (wd?.enwiki) {
      try {
        const sum = await fetchJson(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wd.enwiki)}`
        );
        extract = sum.extract || "";
      } catch {
        extract = "";
      }
    }
    return { row, oem, wd, extract };
  })).filter(Boolean);

  console.log(`live oembed ${live.length}`);

  let kworbMap = new Map();
  try {
    const html = await (await fetch("https://kworb.net/spotify/songs.html", { headers: { "User-Agent": UA } })).text();
    const re = /<tr><td class="text"><div>(.*?)<\/div><\/td><td>([0-9,]+)<\/td>/g;
    let m;
    while ((m = re.exec(html))) {
      const raw = m[1].replace(/&amp;/g, "&");
      const streams = Number(m[2].replace(/,/g, ""));
      const idx = raw.indexOf(" - ");
      if (idx === -1) continue;
      kworbMap.set(raw.slice(idx + 3).toLowerCase(), streams);
      kworbMap.set(raw.toLowerCase(), streams);
    }
  } catch {
    kworbMap = new Map();
  }

  const additions = live.map((item, idx) => {
    const name = item.wd?.name || item.row.name;
    const inferred = inferArtist(item.wd?.description || "", item.extract);
    const streams =
      kworbMap.get(name.toLowerCase()) ||
      kworbMap.get((item.oem.title || "").toLowerCase()) ||
      null;
    const rec = {
      rank: 1000 + idx,
      id: item.wd?.qid || `spotify-${item.row.spotifyId}`,
      name,
      composer: inferred || name,
      singer: inferred || "Not listed",
      band: "—",
      writer: inferred || name,
      musicCompany: "Not listed",
      year: yearFromText(item.wd?.description) || yearFromText(item.extract) || null,
      releaseCountry: "Not listed",
      genre: "Essential recording",
      genres: ["Essential recording"],
      spotifyId: item.row.spotifyId,
      spotifyUrl: `https://open.spotify.com/track/${item.row.spotifyId}`,
      spotifyEmbedUrl: `https://open.spotify.com/embed/track/${item.row.spotifyId}?utm_source=generator`,
      coverUrl: hdCoverUrl(item.oem.thumbnail_url || item.row.coverUrl),
      spotifyTitle: item.oem.title,
      streams,
      sitelinks: item.wd?.sitelinks || 12,
      awards: [],
      wikipediaUrl: item.wd?.enwiki
        ? `https://en.wikipedia.org/wiki/${encodeURIComponent(item.wd.enwiki.replace(/ /g, "_"))}`
        : `https://open.spotify.com/track/${item.row.spotifyId}`,
      instanceOf: "essential recording",
      description: item.wd?.description || item.oem.title,
      extract: item.extract || "",
      influenceScore: 0.88,
      seeded: true,
    };
    rec.whyShortlisted = whyFor(rec);
    return rec;
  });

  const merged = [...data.tracks.filter((t) => !t.seeded), ...additions];
  merged.sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0) || (b.sitelinks || 0) - (a.sitelinks || 0));
  const kept = merged.slice(0, 1000).map((t, i) => ({ ...t, rank: i + 1 }));
  data.tracks = kept;
  data.count = kept.length;
  data.generatedAt = new Date().toISOString();
  await fs.writeFile(catalogPath, JSON.stringify(data));
  console.log(`catalog now ${kept.length}; added ${additions.length} essentials`);
  console.log(additions.slice(0, 15).map((t) => t.name).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
