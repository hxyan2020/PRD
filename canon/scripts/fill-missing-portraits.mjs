#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fallbackPersonAnecdote,
  pickAnecdote,
  searchName,
  splitCredits,
  uniqueImages,
} from "../src/portraits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function wikiPage(name) {
  const title = searchName(name) || name;
  try {
    const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (data?.type === "disambiguation") return null;
    return data;
  } catch {
    return null;
  }
}

async function imagesFor(name) {
  const out = [];
  const page = await wikiPage(name);
  if (page?.thumbnail?.source) out.push({ src: page.thumbnail.source, alt: name });
  try {
    const itunes = await fetchJson(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchName(name) || name)}&entity=album&limit=8`
    );
    for (const item of itunes?.results || []) {
      const src = String(item.artworkUrl100 || "").replace("100x100bb", "600x600bb");
      if (src) out.push({ src, alt: `${name} — ${item.collectionName || "recording"}` });
    }
  } catch {
    /* ignore */
  }
  try {
    const q = encodeURIComponent(searchName(name) || name);
    const albums = await fetchJson(`https://api.deezer.com/search/album?q=${q}&limit=8`);
    for (const album of albums?.data || []) {
      const src = album.cover_xl || album.cover_big;
      if (src) out.push({ src, alt: `${name} — ${album.title || "recording"}` });
    }
  } catch {
    /* ignore */
  }
  return { page, images: uniqueImages(out, 9) };
}

const catalog = JSON.parse(await fs.readFile(path.join(root, "public", "catalog.json"), "utf8"));
const portraits = JSON.parse(await fs.readFile(path.join(root, "public", "portraits.json"), "utf8"));
const needed = new Map();
for (const track of catalog.tracks) {
  for (const item of [
    ...splitCredits(track.singer).map((name) => ({ name, kind: "singer" })),
    ...splitCredits(track.band).map((name) => ({ name, kind: "band" })),
  ]) {
    if (!portraits.people[item.name]) needed.set(item.name, item.kind);
  }
}

console.log(`missing portrait people: ${needed.size}`);
for (const [name, kind] of needed) {
  const { page, images } = await imagesFor(name);
  portraits.people[name] = {
    kind,
    title: page?.title || name,
    anecdote: pickAnecdote(page?.extract, fallbackPersonAnecdote(name, kind)),
    images,
  };
  console.log(`  ${name}: ${images.length} images`);
}

portraits.generatedAt = new Date().toISOString();
await fs.writeFile(path.join(root, "public", "portraits.json"), JSON.stringify(portraits));
console.log("wrote portraits.json");
