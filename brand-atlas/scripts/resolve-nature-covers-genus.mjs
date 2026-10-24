#!/usr/bin/env node
/**
 * Fill remaining nature silhouettes with a real photo from the same genus.
 * One Wikipedia/GBIF lookup per genus, then assign to every uncovered species
 * in that genus. Not species-exact, but replaces parametric shapes with a
 * real organism photo from the correct genus.
 *
 *   node scripts/resolve-nature-covers-genus.mjs
 *   node scripts/resolve-nature-covers-genus.mjs flowers animals
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "public", "data", "catalog.json");
const coversDir = join(root, "public", "covers");
const UA = "SeenCatalogue/1.3 (educational; https://github.com/hxyan2020/PRD)";
const NATURE = new Set(["trees", "flowers", "animals", "birds", "mushrooms"]);
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
  if (!item.cover) return true;
  if (String(item.cover).startsWith("covers/")) return true;
  return false;
}

function genusOf(name) {
  const part = String(name || "").trim().split(/\s+/)[0];
  return part || null;
}

async function wikiThumb(title) {
  const api =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      titles: title,
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "640",
      redirects: "1",
      origin: "*",
    });
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (res.status === 429) {
    const err = new Error("429");
    err.code = 429;
    throw err;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  const src = page?.thumbnail?.source;
  if (!src || /\.svg$/i.test(src)) return null;
  return String(src).split("?")[0];
}

async function gbifImage(name) {
  const url =
    "https://api.gbif.org/v1/occurrence/search?" +
    new URLSearchParams({
      scientificName: name,
      mediaType: "StillImage",
      limit: "5",
    });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429) {
    const err = new Error("429");
    err.code = 429;
    throw err;
  }
  if (!res.ok) return null;
  const data = await res.json();
  for (const occ of data.results || []) {
    for (const m of occ.media || []) {
      const id = m.identifier || m.references;
      if (!id || /\.svg(\?|$)/i.test(id)) continue;
      if (/^https?:\/\//i.test(id)) return id.split("?")[0];
    }
  }
  return null;
}

async function resolveGenus(genus, categoryId) {
  const queries = [genus];
  if (categoryId === "mushrooms") queries.push(`${genus} fungus`, `${genus} mushroom`);
  if (categoryId === "trees") queries.push(`${genus} tree`);
  if (categoryId === "flowers") queries.push(`${genus} flower`);
  if (categoryId === "birds") queries.push(`${genus} bird`);
  if (categoryId === "animals") queries.push(`${genus} (genus)`);

  for (const q of queries) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const w = await wikiThumb(q);
        if (w) return w;
        break;
      } catch (e) {
        if (e.code === 429) await sleep(1500 * (attempt + 1));
        else break;
      }
    }
    await sleep(120);
  }
  for (const q of [genus, ...queries.slice(1)]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const g = await gbifImage(q);
        if (g) return g;
        break;
      } catch (e) {
        if (e.code === 429) await sleep(1000 * (attempt + 1));
        else break;
      }
    }
    await sleep(80);
  }
  return null;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let items = catalog.items.filter((it) => it.status !== "removed" && needsCover(it));
if (categoryFilter.length) {
  const want = new Set(categoryFilter);
  items = items.filter((it) => want.has(it.categoryId));
  console.log(`Category filter: ${[...want].join(", ")}`);
}

/** @type {Map<string, {categoryId: string, items: any[]}>} */
const byGenus = new Map();
for (const item of items) {
  const g = genusOf(item.name);
  if (!g) continue;
  const key = `${item.categoryId}::${g}`;
  if (!byGenus.has(key)) byGenus.set(key, { categoryId: item.categoryId, genus: g, items: [] });
  byGenus.get(key).items.push(item);
}

const groups = [...byGenus.values()].sort((a, b) => b.items.length - a.items.length);
console.log(`Resolving ${groups.length} genera for ${items.length} uncovered species…`);

let generaOk = 0;
let generaFail = 0;
let speciesFilled = 0;
const failSample = [];

for (let i = 0; i < groups.length; i++) {
  const group = groups[i];
  const url = await resolveGenus(group.genus, group.categoryId);
  if (url) {
    for (const item of group.items) {
      item.cover = url;
      speciesFilled += 1;
    }
    generaOk += 1;
  } else {
    generaFail += 1;
    if (failSample.length < 30) failSample.push([group.categoryId, group.genus, group.items.length]);
  }
  if ((i + 1) % 25 === 0 || i === groups.length - 1) {
    writeFileSync(catalogPath, JSON.stringify(catalog));
    console.log(
      `… ${i + 1}/${groups.length} genera (ok ${generaOk}, fail ${generaFail}, species filled ${speciesFilled})`,
    );
  }
  await sleep(150);
}

writeFileSync(catalogPath, JSON.stringify(catalog));
const byCat = {};
for (const it of catalog.items) {
  if (!NATURE.has(it.categoryId)) continue;
  byCat[it.categoryId] ??= { total: 0, withCover: 0 };
  byCat[it.categoryId].total += 1;
  if (it.cover) byCat[it.categoryId].withCover += 1;
}
console.log(JSON.stringify({ generaOk, generaFail, speciesFilled, failSample, byCat }, null, 2));
