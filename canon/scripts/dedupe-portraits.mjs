#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchName, uniqueImages } from "../src/portraits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portraitsPath = path.join(root, "public", "portraits.json");
const UA = "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function extraImages(name) {
  const q = encodeURIComponent(searchName(name) || name);
  const out = [];
  try {
    const itunes = await fetchJson(`https://itunes.apple.com/search?term=${q}&entity=album&limit=8`);
    for (const item of itunes?.results || []) {
      const src = String(item.artworkUrl100 || "").replace("100x100bb", "600x600bb");
      if (src) out.push({ src, alt: `${name} — ${item.collectionName || "recording"}` });
    }
  } catch {
    /* ignore */
  }
  try {
    const albums = await fetchJson(`https://api.deezer.com/search/album?q=${q}&limit=6`);
    for (const album of albums?.data || []) {
      const src = album.cover_xl || album.cover_big;
      if (src) out.push({ src, alt: `${name} — ${album.title || "recording"}` });
    }
  } catch {
    /* ignore */
  }
  return out;
}

const data = JSON.parse(await fs.readFile(portraitsPath, "utf8"));
let removed = 0;
let padded = 0;
for (const [name, person] of Object.entries(data.people || {})) {
  const before = (person.images || []).length;
  person.images = uniqueImages(person.images || [], 9);
  removed += Math.max(0, before - person.images.length);
  if (person.images.length < 3) {
    person.images = uniqueImages([...(person.images || []), ...(await extraImages(name))], 9);
    padded += 1;
  }
}

data.generatedAt = new Date().toISOString();
await fs.writeFile(portraitsPath, JSON.stringify(data));
console.log(`deduped portraits: removed ${removed} duplicate images; padded ${padded} people`);
