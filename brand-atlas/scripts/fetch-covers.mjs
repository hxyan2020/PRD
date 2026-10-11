#!/usr/bin/env node
/**
 * Parallel cover fetch: Wikipedia pageimages + Openverse (CC-friendly).
 * Writes compressed JPEG to public/covers/{itemId}.jpg
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const coversDir = join(root, "public", "covers");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(coversDir, { recursive: true });

const UA = "SeenCatalogue/1.0 (educational; https://github.com/hxyan2020/PRD)";
const CONCURRENCY = 10;

const TITLE_HINTS = JSON.parse(
  readFileSync(join(root, "scripts", "cover-title-hints.json"), "utf8"),
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasJpg(itemId) {
  return existsSync(join(coversDir, `${itemId}.jpg`));
}

function searchQuery(item) {
  if (TITLE_HINTS[item.id]) return TITLE_HINTS[item.id];
  const cat = item.categoryId;
  if (["trees", "flowers", "animals"].includes(cat)) return item.name;
  if (cat === "cars") return `${item.name} automobile`;
  if (cat === "beer" || item.tags?.includes("beer") || String(item.id).startsWith("beer__"))
    return `${item.name} beer`;
  if (cat === "wine" || item.tags?.includes("wine") || String(item.id).startsWith("wine__"))
    return `${item.name} wine`;
  if (cat === "sake" || item.tags?.includes("sake") || String(item.id).startsWith("sake__"))
    return `${item.name} sake`;
  if (cat === "liquor" || item.tags?.includes("liquor") || String(item.id).startsWith("liquor__"))
    return `${item.name} bottle`;
  if (cat === "alcohol") return `${item.name} drink`;
  if (cat === "coffee") return `${item.name} coffee`;
  if (cat === "tea") return `${item.name} tea`;
  if (cat === "food") return item.name;
  if (cat === "clothes") return `${item.name} fashion`;
  if (cat === "luxury") return `${item.name}`;
  if (cat === "cigarettes") return `${item.name} cigarettes`;
  return item.name;
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
  if (!res.ok) return null;
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  const src = page?.thumbnail?.source;
  if (!src || /\.svg/i.test(src)) return null;
  return src.split("?")[0];
}

async function openverse(query) {
  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({
      q: query,
      page_size: "5",
      license: "cc0,pdm,by,by-sa",
    });
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  for (const r of data.results || []) {
    const src = r.url || r.thumbnail;
    if (src && !/\.svg/i.test(src)) return src;
  }
  return null;
}

function toJpeg(rawPath, outPath) {
  const tmp = `${outPath}.tmp.jpg`;
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-i", rawPath, "-vf", "scale='min(640,iw)':-2", "-q:v", "6", tmp],
    { encoding: "utf8" },
  );
  if (r.status !== 0 || !existsSync(tmp)) return false;
  spawnSync("mv", ["-f", tmp, outPath]);
  return existsSync(outPath);
}

async function store(url, itemId) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*" },
    redirect: "follow",
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1200) return false;
  const raw = join(coversDir, `${itemId}.raw.bin`);
  writeFileSync(raw, buf);
  const out = join(coversDir, `${itemId}.jpg`);
  const ok = toJpeg(raw, out);
  try {
    unlinkSync(raw);
  } catch {
    /* ignore */
  }
  for (const ext of [".png", ".webp", ".jpeg"]) {
    const p = join(coversDir, `${itemId}${ext}`);
    if (existsSync(p)) {
      try {
        unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  }
  return ok;
}

async function fetchOne(item) {
  if (hasJpg(item.id)) return "skip";
  const q = searchQuery(item);
  const wikiTitle = TITLE_HINTS[item.id]?.replace(/\b(car|bottle|jar|can|watch|bag|pack|forest|field|animal|automobile|fashion|beer|wine|sake|coffee|tea|cigarettes|sneakers|cookies|chocolate|ketchup|whisky|cup)\b/gi, "").trim() || item.name;
  let url = null;
  try {
    url = await wikiThumb(wikiTitle);
    if (!url) url = await wikiThumb(item.name);
    if (!url) url = await openverse(q);
    if (!url) url = await openverse(item.name);
  } catch (e) {
    return `err:${e.message || e}`;
  }
  if (!url) return "no-image";
  try {
    return (await store(url, item.id)) ? "ok" : "download-fail";
  } catch (e) {
    return `err:${e.message || e}`;
  }
}

async function mapPool(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

// Recompress any leftover non-jpg
for (const name of readdirSync(coversDir)) {
  if (!/\.(png|webp|jpeg)$/i.test(name)) continue;
  const id = name.replace(/\.(png|webp|jpeg)$/i, "");
  const src = join(coversDir, name);
  const out = join(coversDir, `${id}.jpg`);
  if (toJpeg(src, out)) {
    try {
      unlinkSync(src);
    } catch {
      /* ignore */
    }
  }
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const items = catalog.items.filter((it) => it.status !== "removed");
const missing = items.filter((it) => !hasJpg(it.id));
console.log(`Fetching ${missing.length} missing covers (${items.length - missing.length} already present)…`);

let ok = 0;
let fail = 0;
const fails = [];

await mapPool(missing, CONCURRENCY, async (item, idx) => {
  const status = await fetchOne(item);
  if (status === "ok") {
    ok += 1;
    if (ok % 25 === 0) console.log(`… ${ok} new covers`);
  } else if (status !== "skip") {
    fail += 1;
    fails.push([item.id, status]);
  }
  if (idx % 40 === 0) await sleep(50);
  return status;
});

writeFileSync(
  join(root, "scripts", "cover-fetch-log.json"),
  JSON.stringify({ ok, fail, have: readdirSync(coversDir).length, fails: fails.slice(0, 100) }, null, 2),
);
console.log(JSON.stringify({ ok, fail, have: readdirSync(coversDir).length, failSample: fails.slice(0, 20) }, null, 2));
