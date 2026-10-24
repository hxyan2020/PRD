#!/usr/bin/env node
/**
 * Fill missing nature covers via GBIF occurrence StillImages (iNaturalist etc.).
 * Writes https URLs into catalog.json. Safe to re-run; skips items that already
 * have a cover (local or remote) unless FORCE=1.
 *
 *   node scripts/resolve-nature-covers-gbif.mjs
 *   node scripts/resolve-nature-covers-gbif.mjs trees flowers
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "public", "data", "catalog.json");
const coversDir = join(root, "public", "covers");
const UA = "SeenCatalogue/1.2 (educational; https://github.com/hxyan2020/PRD)";
const NATURE = new Set(["trees", "flowers", "animals", "birds", "mushrooms"]);
const FORCE = process.env.FORCE === "1";
const CONCURRENCY = Number(process.env.GBIF_CONCURRENCY || 16);
const CHECKPOINT_EVERY = Number(process.env.CHECKPOINT_EVERY || 400);
const REQUEST_GAP_MS = Number(process.env.GBIF_GAP_MS || 15);
const categoryFilter = process.argv.slice(2).filter((a) => !a.startsWith("-"));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasLocalCover(itemId) {
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    if (existsSync(join(coversDir, `${itemId}${ext}`))) return true;
  }
  return false;
}

function needsCover(item) {
  if (!NATURE.has(item.categoryId)) return false;
  if (hasLocalCover(item.id)) return false;
  if (FORCE) return true;
  if (!item.cover) return true;
  if (String(item.cover).startsWith("covers/")) return true;
  return false;
}

async function gbifImage(name) {
  const url =
    "https://api.gbif.org/v1/occurrence/search?" +
    new URLSearchParams({
      scientificName: name,
      mediaType: "StillImage",
      limit: "3",
    });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429) {
    const err = new Error("gbif 429");
    err.code = 429;
    throw err;
  }
  if (!res.ok) return null;
  const data = await res.json();
  for (const occ of data.results || []) {
    for (const m of occ.media || []) {
      const id = m.identifier || m.references;
      if (!id) continue;
      if (/\.svg(\?|$)/i.test(id)) continue;
      if (/^https?:\/\//i.test(id)) return id.split("?")[0];
    }
  }
  return null;
}

async function mapPool(items, limit, fn) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let items = catalog.items.filter((it) => it.status !== "removed" && needsCover(it));
if (categoryFilter.length) {
  const want = new Set(categoryFilter);
  items = items.filter((it) => want.has(it.categoryId));
  console.log(`Category filter: ${[...want].join(", ")}`);
}
console.log(`GBIF-resolving ${items.length} nature items…`);

let ok = 0;
let fail = 0;
let sinceCheckpoint = 0;
const failSample = [];

await mapPool(items, CONCURRENCY, async (item, idx) => {
  let url = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      url = await gbifImage(item.name);
      break;
    } catch (e) {
      if (e.code === 429) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      break;
    }
  }
  if (url) {
    item.cover = url;
    ok += 1;
  } else {
    fail += 1;
    if (failSample.length < 30) failSample.push([item.id, item.name]);
  }
  sinceCheckpoint += 1;
  if (sinceCheckpoint >= CHECKPOINT_EVERY) {
    writeFileSync(catalogPath, JSON.stringify(catalog));
    sinceCheckpoint = 0;
    console.log(`checkpoint @ ${idx + 1}/${items.length} (ok ${ok}, fail ${fail})`);
  } else if ((idx + 1) % 100 === 0) {
    console.log(`… ${idx + 1}/${items.length} (ok ${ok}, fail ${fail})`);
  }
  if (REQUEST_GAP_MS > 0) await sleep(REQUEST_GAP_MS);
});

writeFileSync(catalogPath, JSON.stringify(catalog));
const byCat = {};
for (const it of catalog.items) {
  if (!NATURE.has(it.categoryId)) continue;
  byCat[it.categoryId] ??= { total: 0, withCover: 0 };
  byCat[it.categoryId].total += 1;
  if (it.cover) byCat[it.categoryId].withCover += 1;
}
console.log(JSON.stringify({ ok, fail, failSample, byCat }, null, 2));
