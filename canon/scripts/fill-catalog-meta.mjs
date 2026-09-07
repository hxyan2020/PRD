#!/usr/bin/env node
/**
 * Fill missing catalog years (and obvious performer credits) from public sources.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isPlaceholderCredit, splitCredits } from "../src/portraits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "catalog.json");
const UA = "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";

async function fetchJson(url, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\bfeat\.?\b/g, " ")
    .replace(/\bft\.?\b/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/[-–—:,.'"’]/g, " ")
    .replace(/\b(remastered|remaster|radio edit|live|version|mono|stereo|deluxe|anniversary)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(left, right) {
  const a = normalizeTitle(left);
  const b = normalizeTitle(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 6 && b.includes(a)) return true;
  if (b.length >= 6 && a.includes(b)) return true;
  const a0 = a.split(" ").slice(0, 4).join(" ");
  const b0 = b.split(" ").slice(0, 4).join(" ");
  return a0.length >= 6 && a0 === b0;
}

function yearFromText(value) {
  const m = String(value || "").match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
  if (!m) return null;
  const year = Number(m[1]);
  return year >= 1500 && year <= 2026 ? year : null;
}

function artistHint(track) {
  const names = [...splitCredits(track.singer), ...splitCredits(track.band)];
  return names[0] || "";
}

function applyArtist(track, artist) {
  const name = String(artist || "").replace(/\s+/g, " ").trim();
  if (!name || name.length < 2 || name.length > 80) return;
  if (isPlaceholderCredit(track.singer)) track.singer = name;
  if (isPlaceholderCredit(track.composer) || track.composer === track.name) track.composer = name;
  if (isPlaceholderCredit(track.writer) || track.writer === track.name) track.writer = name;
}

async function itunesHit(track) {
  const artist = artistHint(track);
  const term = `${track.name} ${artist}`.trim();
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10`;
  const data = await fetchJson(url);
  const results = data?.results || [];
  const hit =
    results.find((row) => titlesMatch(row.trackName, track.name) && (!artist || titlesMatch(row.artistName, artist))) ||
    results.find((row) => titlesMatch(row.trackName, track.name)) ||
    null;
  if (!hit) return null;
  return {
    year: yearFromText(hit.releaseDate),
    artist: hit.artistName || "",
  };
}

async function musicBrainzHit(track) {
  const artist = artistHint(track);
  const query = artist
    ? `recording:"${String(track.name).replace(/"/g, "")}" AND artist:"${artist.replace(/"/g, "")}"`
    : `recording:"${String(track.name).replace(/"/g, "")}"`;
  const url =
    "https://musicbrainz.org/ws/2/recording/?" +
    new URLSearchParams({ query, fmt: "json", limit: "5" });
  const data = await fetchJson(url, 25000);
  const hit = (data?.recordings || []).find((row) => titlesMatch(row.title, track.name));
  if (!hit) return null;
  const year = yearFromText(hit["first-release-date"] || hit.releases?.[0]?.date || "");
  const name = hit["artist-credit"]?.[0]?.name || hit["artist-credit"]?.[0]?.artist?.name || "";
  return { year, artist: name };
}

async function wikipediaHit(track) {
  const wiki = String(track.wikipediaUrl || "");
  const m = wiki.match(/wiki\/(.+)$/);
  if (!m || wiki.includes("open.spotify.com")) return null;
  const title = decodeURIComponent(m[1]).replace(/_/g, " ");
  const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  const blob = `${data?.description || ""} ${data?.extract || ""}`;
  const year = yearFromText(data?.description) || yearFromText(blob);
  const artistMatch = String(data?.description || "").match(/\b(?:by|song by|single by)\s+(.+)$/i);
  return { year, artist: artistMatch?.[1]?.replace(/\s*\(.*/, "").trim() || "" };
}

function yearFromTime(value) {
  const m = String(value || "").match(/([+-]?\d{1,6})/);
  if (!m) return null;
  const year = Number(m[1]);
  return Number.isFinite(year) && year >= 1500 && year <= 2026 ? year : null;
}

async function wikidataYears(qids) {
  const map = new Map();
  for (let i = 0; i < qids.length; i += 40) {
    const chunk = qids.slice(i, i + 40);
    const data = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims|labels&languages=en&format=json`
    );
    for (const [id, entity] of Object.entries(data?.entities || {})) {
      const times = [...(entity.claims?.P577 || []), ...(entity.claims?.P571 || [])]
        .map((claim) => yearFromTime(claim?.mainsnak?.datavalue?.value?.time))
        .filter(Boolean);
      if (times.length) map.set(id, Math.min(...times));
    }
    await sleep(80);
  }
  return map;
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const missing = catalog.tracks.filter((track) => !track.year);
  console.log(`tracks missing year: ${missing.length}`);

  const qids = missing.map((track) => track.id).filter((id) => /^Q\d+$/.test(id));
  const wdYears = await wikidataYears(qids);
  let filled = 0;
  for (const track of missing) {
    const year = wdYears.get(track.id);
    if (year) {
      track.year = year;
      filled += 1;
    }
  }
  console.log(`wikidata years: ${filled}`);

  const still = catalog.tracks.filter((track) => !track.year);
  await mapPool(still, 4, async (track) => {
    try {
      const hit = await itunesHit(track);
      if (hit?.year) track.year = hit.year;
      if (hit?.artist) applyArtist(track, hit.artist);
    } catch {
      /* try other sources */
    }
  });
  console.log(`after itunes: ${catalog.tracks.filter((track) => !track.year).length} still missing`);

  const afterItunes = catalog.tracks.filter((track) => !track.year);
  for (const track of afterItunes) {
    try {
      const hit = (await wikipediaHit(track)) || (await musicBrainzHit(track));
      if (hit?.year) track.year = hit.year;
      if (hit?.artist) applyArtist(track, hit.artist);
    } catch {
      /* leave blank */
    }
    await sleep(1100);
  }

  const leftover = catalog.tracks.filter((track) => !track.year);
  catalog.generatedAt = new Date().toISOString();
  await fs.writeFile(catalogPath, JSON.stringify(catalog));
  console.log(
    JSON.stringify(
      {
        withYear: catalog.tracks.filter((track) => track.year).length,
        leftover: leftover.map((track) => `${track.rank} ${track.name}`),
      },
      null,
      2
    )
  );
}

await main();
