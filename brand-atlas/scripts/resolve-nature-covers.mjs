#!/usr/bin/env node
/**
 * Resolve missing nature cover photos via Wikipedia pageimages (batched).
 * Writes https thumbnail URLs into catalog.json cover fields so mega-shelves
 * can show real species photos without vendoring tens of thousands of JPEGs.
 *
 * Usage:
 *   node scripts/resolve-nature-covers.mjs
 *   node scripts/resolve-nature-covers.mjs trees birds
 *   FORCE=1 node scripts/resolve-nature-covers.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "public", "data", "catalog.json");
const coversDir = join(root, "public", "covers");
const UA = "SeenCatalogue/1.2 (educational; https://github.com/hxyan2020/PRD)";
const NATURE = new Set(["trees", "flowers", "animals", "birds", "mushrooms"]);
const BATCH = 40;
const FORCE = process.env.FORCE === "1";
const SKIP_OPENVERSE = process.env.SKIP_OPENVERSE === "1";
const CHECKPOINT_EVERY = Number(process.env.CHECKPOINT_EVERY || 25);
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

function needsRemoteCover(item) {
  if (!NATURE.has(item.categoryId)) return false;
  if (hasLocalCover(item.id)) return false;
  if (FORCE) return true;
  if (!item.cover) return true;
  if (String(item.cover).startsWith("covers/")) return true;
  return false;
}

function searchTitle(item) {
  return item.name.trim();
}

function saveCatalog(catalog) {
  writeFileSync(catalogPath, JSON.stringify(catalog));
}

async function wikiThumbs(titles) {
  const api =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      titles: titles.join("|"),
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "640",
      redirects: "1",
      origin: "*",
    });
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (res.status === 429) {
    const err = new Error("wiki 429");
    err.code = 429;
    throw err;
  }
  if (!res.ok) throw new Error(`wiki ${res.status}`);
  const data = await res.json();
  const byTitle = new Map();
  const normalized = new Map();
  for (const p of Object.values(data.query?.pages || {})) {
    if (!p || p.missing != null || !p.thumbnail?.source) continue;
    let src = String(p.thumbnail.source).split("?")[0];
    if (/\.svg$/i.test(src)) continue;
    byTitle.set(p.title, src);
    normalized.set(p.title.toLowerCase(), src);
  }
  const redirects = new Map();
  for (const r of data.query?.redirects || []) redirects.set(r.from, r.to);
  for (const n of data.query?.normalized || []) redirects.set(n.from, n.to);
  return { byTitle, normalized, redirects };
}

function resolveThumb(title, pack) {
  if (pack.byTitle.has(title)) return pack.byTitle.get(title);
  const via = pack.redirects.get(title);
  if (via && pack.byTitle.has(via)) return pack.byTitle.get(via);
  const lower = title.toLowerCase();
  if (pack.normalized.has(lower)) return pack.normalized.get(lower);
  if (via && pack.normalized.has(via.toLowerCase())) {
    return pack.normalized.get(via.toLowerCase());
  }
  return null;
}

async function fetchPack(titles) {
  let delay = 1500;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await wikiThumbs(titles);
    } catch (e) {
      if (e.code === 429 || /429/.test(String(e.message))) {
        console.warn(`429 — backing off ${delay}ms (attempt ${attempt + 1})`);
        await sleep(delay);
        delay = Math.min(delay * 2, 30000);
        continue;
      }
      throw e;
    }
  }
  throw new Error("wiki 429 exhausted");
}

async function openverseThumb(query) {
  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({
      q: query,
      page_size: "5",
      license: "cc0,pdm,by,by-sa",
    });
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (res.status === 429) return null;
  if (!res.ok) return null;
  const data = await res.json();
  for (const r of data.results || []) {
    const src = r.url || r.thumbnail;
    if (src && !/\.svg$/i.test(src)) return String(src).split("?")[0];
  }
  return null;
}

function altQueries(item) {
  const name = item.name.trim();
  const cat = item.categoryId;
  const out = [name];
  if (cat === "mushrooms") {
    out.push(`${name} mushroom`, `${name} fungus`);
  } else if (cat === "trees") {
    out.push(`${name} tree`);
  } else if (cat === "flowers") {
    out.push(`${name} flower`);
  } else if (cat === "birds") {
    out.push(`${name} bird`);
  } else if (cat === "animals") {
    out.push(`${name} animal`);
  }
  return out;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let items = catalog.items.filter(
  (it) => it.status !== "removed" && needsRemoteCover(it),
);
if (categoryFilter.length) {
  const want = new Set(categoryFilter);
  items = items.filter((it) => want.has(it.categoryId));
  console.log(`Category filter: ${[...want].join(", ")}`);
}

console.log(`Resolving Wikipedia covers for ${items.length} nature items…`);

let ok = 0;
let fail = 0;
const failSample = [];
let batchesSinceCheckpoint = 0;

for (let i = 0; i < items.length; i += BATCH) {
  const chunk = items.slice(i, i + BATCH);
  const titles = chunk.map(searchTitle);
  let pack;
  try {
    pack = await fetchPack(titles);
  } catch (e) {
    console.warn(`batch ${i} failed:`, e.message || e);
    fail += chunk.length;
    await sleep(2000);
    continue;
  }
  for (const item of chunk) {
    let url = resolveThumb(searchTitle(item), pack);
    if (!url) {
      // Second chance: alternate wiki titles (e.g. "Name mushroom")
      for (const q of altQueries(item).slice(1)) {
        try {
          const alt = await fetchPack([q]);
          url = resolveThumb(q, alt);
          if (url) break;
        } catch {
          /* ignore */
        }
        await sleep(120);
      }
    }
    if (!url && !SKIP_OPENVERSE) {
      // Third chance: Openverse CC image
      for (const q of altQueries(item)) {
        url = await openverseThumb(q);
        if (url) break;
        await sleep(100);
      }
    }
    if (url) {
      item.cover = url;
      ok += 1;
    } else {
      fail += 1;
      if (failSample.length < 40) failSample.push([item.id, item.name]);
    }
  }
  batchesSinceCheckpoint += 1;
  if (batchesSinceCheckpoint >= CHECKPOINT_EVERY) {
    saveCatalog(catalog);
    batchesSinceCheckpoint = 0;
    console.log(
      `checkpoint @ ${Math.min(i + BATCH, items.length)}/${items.length} (ok ${ok}, fail ${fail})`,
    );
  } else if ((i / BATCH) % 5 === 0) {
    console.log(
      `… ${Math.min(i + BATCH, items.length)}/${items.length} (ok ${ok}, fail ${fail})`,
    );
  }
  await sleep(200);
}

saveCatalog(catalog);
const byCat = {};
for (const it of catalog.items) {
  if (!NATURE.has(it.categoryId)) continue;
  byCat[it.categoryId] ??= { total: 0, withCover: 0, remote: 0 };
  byCat[it.categoryId].total += 1;
  if (it.cover) byCat[it.categoryId].withCover += 1;
  if (String(it.cover || "").startsWith("http")) byCat[it.categoryId].remote += 1;
}
console.log(
  JSON.stringify(
    { ok, fail, failSample: failSample.slice(0, 20), byCat, items: catalog.items.length },
    null,
    2,
  ),
);
