#!/usr/bin/env node
/**
 * Fill missing catalog years and other basic facts from public sources.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isPlaceholderCredit, splitCredits } from "../src/portraits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "catalog.json");
const UA = "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";
const BAND_HINT = /\b(band|quartet|orchestra|choir|trio|ensemble|beatles|stones|police|queen|radiohead|nirvana|oasis|coldplay|metallica|abba)\b/i;

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

function looksLikeLabel(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length < 3 || text.length > 90) return false;
  if (
    /\b(remix|single|ep|deluxe|edition|soundtrack|ost|album|vol\.|volume|box set|cast recording|greatest hits|anthology)\b/i.test(
      text
    )
  ) {
    return false;
  }
  if (/\b(inc\.?|llc|ltd\.?|gmbh|s\.a\.?|corp\.?)\b/i.test(text)) return true;
  if (/\b(records|recordings|record label|entertainment|music group)\b/i.test(text)) return true;
  if (/\b(sony music|universal music|warner music|warner bros\.?|walt disney records|hollywood records)\b/i.test(text)) {
    return true;
  }
  return /^(columbia|atlantic|capitol|island|motown|def jam|interscope|republic|polydor|emi|rca|epic|geffen|parlophone|decca|elektra|mercury|casablanca|chrysalis|blue note|nonesuch|sub pop|xl( recordings)?|domino|mute|4ad|warp|rough trade|matador|merge|astralwerks|avex( trax)?|aftermath|asylum|roadrunner|deutsche grammophon|naxos|ecm|hyperion|milan)/i.test(
    text
  );
}

function labelFromCopyright(text) {
  const cleaned = String(text || "")
    .replace(/^[℗©]\s*/u, "")
    .replace(/^\d{4}\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/^itunes/i.test(cleaned)) return "";
  return looksLikeLabel(cleaned) ? cleaned : "";
}

function artistHint(track) {
  const names = [...splitCredits(track.singer), ...splitCredits(track.band)];
  return names[0] || "";
}

function needsPerformer(track) {
  return isPlaceholderCredit(track.singer) && isPlaceholderCredit(track.band);
}

function needsCountry(track) {
  return isPlaceholderCredit(track.releaseCountry);
}

function needsGenre(track) {
  return isPlaceholderCredit(track.genre) || track.genre === "Essential recording";
}

function needsLabel(track) {
  return isPlaceholderCredit(track.musicCompany);
}

function needsWiki(track) {
  return /open\.spotify\.com/.test(String(track.wikipediaUrl || ""));
}

function needsFacts(track) {
  return !track.year || needsCountry(track) || needsGenre(track) || needsPerformer(track) || needsLabel(track) || needsWiki(track);
}

function applyArtist(track, artist) {
  const name = String(artist || "").replace(/\s+/g, " ").trim();
  if (!name || name.length < 2 || name.length > 80) return;
  const asBand = /^(the\s)/i.test(name) || BAND_HINT.test(name);
  if (needsPerformer(track)) {
    if (asBand) {
      track.band = name;
      track.singer = "—";
    } else {
      track.singer = name;
      if (isPlaceholderCredit(track.band)) track.band = "—";
    }
  }
  if (isPlaceholderCredit(track.composer) || track.composer === track.name) track.composer = name;
  if (isPlaceholderCredit(track.writer) || track.writer === track.name) track.writer = name;
}

function applyHit(track, hit) {
  if (!hit) return;
  if (!track.year && hit.year) track.year = hit.year;
  if (hit.artist) applyArtist(track, hit.artist);
  if (needsGenre(track) && hit.genre) {
    track.genre = hit.genre;
    track.genres = [hit.genre];
  }
  if (needsLabel(track) && hit.label && looksLikeLabel(hit.label)) track.musicCompany = hit.label;
  if (needsCountry(track) && hit.country) track.releaseCountry = hit.country;
  if (needsWiki(track) && hit.wikipediaUrl) track.wikipediaUrl = hit.wikipediaUrl;
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
    genre: hit.primaryGenreName || "",
    label: labelFromCopyright(hit.copyright || ""),
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
  // MusicBrainz "country" is often the market of a later compilation, not the origin of the work.
  return { year, artist: name };
}

async function wikipediaSearch(track) {
  const artist = artistHint(track);
  const q = `${track.name} ${artist} song`.trim();
  const data = await fetchJson(
    "https://en.wikipedia.org/w/api.php?" +
      new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: q,
        srlimit: "5",
        format: "json",
        origin: "*",
      })
  );
  const want = normalizeTitle(track.name);
  const page = (data?.query?.search || []).find((row) => {
    const title = normalizeTitle(row.title);
    return title.includes(want.slice(0, 18)) || want.includes(title.slice(0, 18));
  });
  if (!page?.title) return null;
  const summary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`);
  if (!summary?.title || summary.type === "disambiguation") return null;
  const blob = `${summary.description || ""} ${summary.extract || ""}`;
  const artistMatch = String(summary.description || "").match(/\b(?:by|song by|single by)\s+(.+)$/i);
  return {
    year: yearFromText(summary.description) || yearFromText(blob),
    artist: artistMatch?.[1]?.replace(/\s*\(.*/, "").trim() || "",
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title.replace(/ /g, "_"))}`,
  };
}

function yearFromTime(value) {
  const m = String(value || "").match(/([+-]?\d{1,6})/);
  if (!m) return null;
  const year = Number(m[1]);
  return Number.isFinite(year) && year >= 1500 && year <= 2026 ? year : null;
}

function claimIds(entity, prop) {
  return (entity?.claims?.[prop] || [])
    .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

async function wikidataFacts(qids) {
  const map = new Map();
  const related = new Set();
  const entities = {};
  for (let i = 0; i < qids.length; i += 40) {
    const chunk = qids.slice(i, i + 40);
    const data = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=claims&format=json`
    );
    Object.assign(entities, data?.entities || {});
    await sleep(80);
  }
  for (const entity of Object.values(entities)) {
    for (const prop of ["P495", "P136", "P264", "P175"]) {
      for (const id of claimIds(entity, prop)) related.add(id);
    }
  }
  const labels = {};
  const relatedIds = [...related];
  for (let i = 0; i < relatedIds.length; i += 40) {
    const chunk = relatedIds.slice(i, i + 40);
    const data = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=labels&languages=en&format=json`
    );
    for (const [id, entity] of Object.entries(data?.entities || {})) {
      labels[id] = entity?.labels?.en?.value || "";
    }
    await sleep(80);
  }
  for (const [id, entity] of Object.entries(entities)) {
    const times = [...(entity.claims?.P577 || []), ...(entity.claims?.P571 || [])]
      .map((claim) => yearFromTime(claim?.mainsnak?.datavalue?.value?.time))
      .filter(Boolean);
    map.set(id, {
      year: times.length ? Math.min(...times) : null,
      country: claimIds(entity, "P495").map((qid) => labels[qid]).find(Boolean) || "",
      genre: claimIds(entity, "P136").map((qid) => labels[qid]).slice(0, 3).join(" · "),
      label: claimIds(entity, "P264").map((qid) => labels[qid]).filter(Boolean).join(" · "),
      artist: claimIds(entity, "P175").map((qid) => labels[qid]).find(Boolean) || "",
    });
  }
  return map;
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const missing = catalog.tracks.filter(needsFacts);
  console.log(`tracks needing facts: ${missing.length}`);

  const qids = missing.map((track) => track.id).filter((id) => /^Q\d+$/.test(id));
  const wd = await wikidataFacts(qids);
  let fromWd = 0;
  for (const track of missing) {
    const hit = wd.get(track.id);
    if (!hit) continue;
    applyHit(track, hit);
    fromWd += 1;
  }
  console.log(`wikidata rows applied: ${fromWd}`);

  const still = catalog.tracks.filter(needsFacts);
  await mapPool(still, 4, async (track) => {
    try {
      applyHit(track, await itunesHit(track));
    } catch {
      /* try other sources */
    }
  });
  console.log(`after itunes still needing: ${catalog.tracks.filter(needsFacts).length}`);

  const leftover = catalog.tracks.filter((track) => needsCountry(track) || needsPerformer(track) || needsWiki(track) || !track.year);
  for (const track of leftover) {
    try {
      applyHit(track, await wikipediaSearch(track));
    } catch {
      /* ignore */
    }
    if (needsCountry(track) || !track.year) {
      try {
        applyHit(track, await musicBrainzHit(track));
      } catch {
        /* ignore */
      }
      await sleep(1100);
    } else {
      await sleep(120);
    }
  }

  const summary = {
    withYear: catalog.tracks.filter((track) => track.year).length,
    missingYear: catalog.tracks.filter((track) => !track.year).map((track) => `${track.rank} ${track.name}`),
    missingCountry: catalog.tracks.filter(needsCountry).map((track) => `${track.rank} ${track.name}`),
    missingPerformer: catalog.tracks.filter(needsPerformer).map((track) => `${track.rank} ${track.name}`),
    placeholderGenre: catalog.tracks.filter(needsGenre).map((track) => `${track.rank} ${track.name}`),
    missingLabel: catalog.tracks.filter(needsLabel).length,
  };
  catalog.generatedAt = new Date().toISOString();
  await fs.writeFile(catalogPath, JSON.stringify(catalog));
  console.log(JSON.stringify(summary, null, 2));
}

await main();
