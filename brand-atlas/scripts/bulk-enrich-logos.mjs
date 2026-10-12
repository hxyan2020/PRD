#!/usr/bin/env node
/**
 * Aggressive logo pass for every brand still on a text/emblem mark
 * (plus known-bad rasters). Pipeline per brand:
 *   1) mapped Simple Icons
 *   2) logo.uplead.com (known + guessed domains)
 *   3) Wikidata P154 / Commons logo
 *   4) guessed Simple Icons slug
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { BRAND_DOMAINS } from "./brand-domains.mjs";
import { MARK_ICONS } from "./mark-icons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const NATURE = new Set(["trees", "flowers", "animals", "birds", "mushrooms"]);
const CONCURRENCY = Number(process.env.MARK_CONCURRENCY || 24);
const WIKI_CONCURRENCY = Number(process.env.WIKI_CONCURRENCY || 8);
const CATEGORY_FILTER = process.env.MARK_CATEGORY || ""; // e.g. "cars"
const UA = "SeenMarksBot/1.1 (brand-atlas logo enrichment; local)";

/** Force re-fetch even if a raster already exists (wrong brand / stand-in). */
const FORCE_IDS = new Set([
  "cars__hummer", // previously resolved to GMC logo
]);

const EXTRA_DOMAINS = {
  "cars__infiniti": "infinitiusa.com",
  "cars__lucid": "lucidmotors.com",
  "cars__li-auto": "lixiang.com",
  "cars__zeekr": "zeekr.com",
  "cars__ram": "ramtrucks.com",
  "cars__buick": "buick.com",
  "cars__chrysler": "chrysler.com",
  "cars__pontiac": "gm.com",
  "cars__hummer": "hummer.com",
  "cars__fisker": "fiskerinc.com",
  "cars__maybach": "mercedes-benz.com",
  "cars__smart": "smartusa.com",
  "cars__lancia": "lancia.com",
  "cars__saab": "saab.com",
  "cars__koenigsegg": "koenigsegg.com",
  "cars__dacia": "dacia.fr",
  "cars__vauxhall": "vauxhall.co.uk",
  "cars__morgan": "morgan-motor.com",
  "cars__caterham": "caterhamcars.com",
  "cars__dongfeng": "dfmc.com.cn",
  "cars__saic": "saicmotor.com",
  "cars__isuzu": "isuzu.com",
  "cars__iveco": "iveco.com",
  "cars__iveco-bus": "iveco.com",
  "cars__jac": "jac.com.cn",
  "cars__jmc": "jmc.com.cn",
  "cars__italdesign": "italdesign.it",
  "cars__irizar": "irizar.com",
  "cars__jensen": "jensenmotors.com",
  "cars__ssangyong": "kg-mobility.com",
  "cars__ds-automobiles": "dsautomobiles.com",
  "cars__alpine": "alpinecars.com",
  "cars__abarth": "abarth.com",
  "cars__byd": "byd.com",
  "cars__geely": "geely.com",
  "cars__great-wall": "gwm-global.com",
  "cars__haval": "haval.com.au",
  "cars__chery": "cheryinternational.com",
  "cars__mg": "mg.co.uk",
  "cars__mini": "mini.com",
  "cars__cupra": "cupraofficial.com",
  "cars__seat": "seat.com",
  "cars__skoda": "skoda-auto.com",
  "cars__rivian": "rivian.com",
  "cars__polestar": "polestar.com",
  "cars__vinfast": "vinfastauto.com",
  "cars__nio": "nio.com",
  "cars__xpeng": "xiaopeng.com",
  "cars__tesla": "tesla.com",
};

/** Explicit Wikidata search strings when the brand name alone is ambiguous. */
const WIKI_SEARCH = {
  "cars__hummer": "Hummer",
  "cars__hyptec": "Hyptec",
  "cars__im-motors": "IM Motors",
  "cars__human-horizons": "Human Horizons",
  "cars__jaecoo": "Jaecoo",
  "cars__jetour": "Jetour",
  "cars__infiniti": "Infiniti",
  "cars__iveco": "Iveco",
  "cars__iveco-bus": "Iveco Bus",
  "cars__iran-khodro": "Iran Khodro",
  "cars__iso-rivolta": "Iso Rivolta",
  "cars__isdera": "Isdera",
  "cars__jac": "JAC Motors",
  "cars__jinbei": "Jinbei",
  "cars__kamaz": "Kamaz",
  "cars__italdesign": "Italdesign",
  "cars__irizar": "Irizar",
  "cars__isuzu": "Isuzu",
  "cars__jmc": "Jiangling Motors",
  "cars__ika": "Industrias Kaiser Argentina",
  "cars__jensen": "Jensen Motors",
  "cars__innoson": "Innoson Vehicle Manufacturing",
  "cars__inokom": "Inokom",
  "cars__inmotion": "Inmotion",
  "cars__imperia": "Imperia Automobiles",
  "cars__indumotor": "Indumotor",
  "cars__joule": "Joule electric car",
};

function isEmblem(svg) {
  if (!svg) return true;
  if (svg.includes("data:image")) return false;
  if (svg.includes('viewBox="0 0 24 24"')) return false;
  if (svg.includes("<path") && !svg.includes("<text")) return false;
  return svg.includes("<text");
}

function wrapImage(b64, mime = "image/png") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <image href="data:${mime};base64,${b64}" width="128" height="128" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

const normalizePy = join(root, "scripts", "normalize-mark-png.py");

/** Run raster through normalize-mark-png.py → light-on-transparent PNG. */
function normalizeRaster(buf) {
  if (!existsSync(normalizePy)) return { b64: buf.toString("base64"), mime: sniffMime(buf) || "image/png" };
  const r = spawnSync("python3", [normalizePy], {
    input: buf,
    maxBuffer: 12_000_000,
    encoding: "buffer",
  });
  if (r.status !== 0 || !r.stdout || r.stdout.length < 400) return null;
  return { b64: r.stdout.toString("base64"), mime: "image/png" };
}

function sniffMime(buf) {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  const head = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<svg") || head.includes("<svg")) return "image/svg+xml";
  return null;
}

function isAcceptableLogo(buf, mime, { lenient = false } = {}) {
  if (!mime || !buf) return false;
  if (mime === "image/svg+xml") {
    const t = buf.toString("utf8");
    return t.includes("<svg") && (t.includes("<path") || t.includes("<polygon") || t.includes("<g"));
  }
  const minBytes = lenient ? 900 : 1600;
  if (buf.length < minBytes) return false;
  if (mime === "image/png" && buf.length >= 26) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const colorType = buf[25];
    // Allow wide wordmarks (e.g. 128x18 Hyundai) and tall marks
    if (w < 32 || h < 16) return false;
    if (w * h < 1200 && !lenient) return false;
    if (colorType === 3 && buf.length < 2000 && w === h) return false;
  }
  return true;
}

function domainsFor(item) {
  const out = [];
  const known = EXTRA_DOMAINS[item.id] || BRAND_DOMAINS[item.id];
  if (known) out.push(known);

  const cleaned = String(item.name || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''´`]/g, "")
    .replace(
      /\b(inc|ltd|llc|co|corp|the|company|group|brands?|brewery|distillery|winery|motors?|automobile|automotive|auto|bus)\b/gi,
      " ",
    )
    .trim();
  const compact = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hyphen = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (compact.length >= 2) {
    out.push(`${compact}.com`, `${compact}.com.cn`, `${compact}.co.uk`, `${compact}.de`, `${compact}.jp`);
    if (hyphen && hyphen !== compact) out.push(`${hyphen}.com`, `${hyphen}.com.cn`);
  }

  const slug = item.id.split("__")[1];
  if (slug) {
    const s = slug.replace(/-/g, "");
    out.push(`${s}.com`, `${slug}.com`, `${s}.com.cn`);
  }

  return [...new Set(out)].slice(0, 8);
}

async function fetchLogo(domains, { lenient = false } = {}) {
  for (const domain of domains) {
    const url = `https://logo.uplead.com/${domain}`;
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = sniffMime(buf);
      if (!isAcceptableLogo(buf, mime, { lenient })) continue;
      const norm = normalizeRaster(buf);
      if (!norm) continue;
      return { ...norm, domain };
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchSimpleIcon(slug) {
  if (!slug) return null;
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    let svg = await res.text();
    svg = svg.replace(/fill="[^"]*"/g, 'fill="#E8E8E8"');
    if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
    return svg;
  } catch {
    return null;
  }
}

function looksLikePhotoFilename(name) {
  const n = name.toLowerCase();
  if (/\b(flickr|dealership|headquarters|front|rear|side|interior|exterior|museum|factory|plant|showroom|street|img_|dsc_)\b/.test(n)) {
    return true;
  }
  if (/\.(jpe?g)$/i.test(n) && !/\b(logo|wordmark|emblem|symbol|badge|marque)\b/.test(n)) {
    return true;
  }
  return false;
}

function logoFilenameScore(name) {
  const n = name.toLowerCase();
  let score = 0;
  if (n.endsWith(".svg")) score += 50;
  if (/\b(logo|wordmark|emblem|symbol|badge|marque|typeface)\b/.test(n)) score += 30;
  if (n.endsWith(".png")) score += 10;
  if (looksLikePhotoFilename(name)) score -= 100;
  return score;
}

async function wikiJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`wiki ${res.status}`);
  return res.json();
}

async function fetchWikidataLogo(item) {
  const search = WIKI_SEARCH[item.id] || item.name;
  try {
    const q = new URLSearchParams({
      action: "wbsearchentities",
      search,
      language: "en",
      format: "json",
      limit: "5",
    });
    const found = await wikiJson(`https://www.wikidata.org/w/api.php?${q}`);
    const hits = found.search || [];
    let bestFile = null;
    let bestScore = 0;

    for (const hit of hits.slice(0, 4)) {
      const ent = await wikiJson(`https://www.wikidata.org/wiki/Special:EntityData/${hit.id}.json`);
      const entity = ent.entities?.[hit.id];
      const logos = entity?.claims?.P154 || [];
      for (const claim of logos) {
        const fname = claim?.mainsnak?.datavalue?.value;
        if (!fname) continue;
        const score = logoFilenameScore(fname);
        if (score > bestScore) {
          bestScore = score;
          bestFile = fname;
        }
      }
      if (bestScore >= 50) break; // good enough SVG/logo hit
    }

    if (!bestFile || bestScore < 10) return null;

    // Prefer rendered PNG at fixed size for consistent mark tiles
    const fileUrl =
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
      encodeURIComponent(bestFile) +
      "?width=256";
    const res = await fetch(fileUrl, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    let mime = sniffMime(buf);
    // Commons may return SVG text when width is ignored
    if (mime === "image/svg+xml") {
      let svg = buf.toString("utf8");
      if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
      else svg = svg.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
      return { kind: "svg", svg, file: bestFile };
    }
    if (!mime) mime = "image/png";
    if (!isAcceptableLogo(buf, mime, { lenient: true })) return null;
    const norm = normalizeRaster(buf);
    if (!norm) return null;
    return { kind: "raster", b64: norm.b64, mime: norm.mime, file: bestFile };
  } catch {
    return null;
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let brandItems = catalog.items.filter((it) => !NATURE.has(it.categoryId));
if (CATEGORY_FILTER) {
  brandItems = brandItems.filter((it) => it.categoryId === CATEGORY_FILTER);
}

const todo = [];
for (const item of brandItems) {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (FORCE_IDS.has(item.id) || isEmblem(existing)) todo.push(item);
}

console.error(`Bulk-enriching ${todo.length} marks…`);

let fromLogo = 0;
let fromSimple = 0;
let fromWiki = 0;
let kept = 0;
const hits = [];
const wikiHits = [];
const stillWeak = [];

// Pass 1: Simple Icons (mapped) + uplead
await mapPool(todo, CONCURRENCY, async (item) => {
  const out = join(marksDir, `${item.id}.svg`);

  const mapped = MARK_ICONS[item.id];
  if (mapped) {
    const svg = await fetchSimpleIcon(mapped);
    if (svg && svg.length > 200) {
      writeFileSync(out, svg);
      fromSimple += 1;
      item.__done = true;
      return;
    }
  }

  const logo = await fetchLogo(domainsFor(item));
  if (logo) {
    writeFileSync(out, wrapImage(logo.b64, logo.mime));
    fromLogo += 1;
    if (hits.length < 80) hits.push([item.id, logo.domain]);
    item.__done = true;
    return;
  }

  stillWeak.push(item);
});

console.error(`Pass1 done. Still weak: ${stillWeak.length}. Wikidata pass…`);

// Pass 2: Wikidata for leftovers
await mapPool(stillWeak, WIKI_CONCURRENCY, async (item) => {
  const out = join(marksDir, `${item.id}.svg`);
  const wiki = await fetchWikidataLogo(item);
  if (wiki) {
    if (wiki.kind === "svg") {
      writeFileSync(out, wiki.svg);
    } else {
      writeFileSync(out, wrapImage(wiki.b64, wiki.mime));
    }
    fromWiki += 1;
    if (wikiHits.length < 80) wikiHits.push([item.id, wiki.file]);
    item.__done = true;
    return;
  }

  // Last resort: guessed Simple Icons slug (may 404)
  const slug = (item.id.split("__")[1] || "").replace(/-/g, "");
  if (slug && slug !== MARK_ICONS[item.id]) {
    const svg = await fetchSimpleIcon(slug);
    if (svg && svg.length > 200) {
      writeFileSync(out, svg);
      fromSimple += 1;
      item.__done = true;
      return;
    }
  }

  kept += 1;
});

const scrub = join(root, "scripts", "scrub-mark-backgrounds.py");
if (existsSync(scrub)) {
  console.error("Scrubbing solid backgrounds…");
  spawnSync("python3", [scrub], { cwd: root, encoding: "utf8", stdio: "inherit" });
}

// Brighten existing Simple Icons fills that are still dark grey
let brightened = 0;
for (const item of brandItems) {
  const p = join(marksDir, `${item.id}.svg`);
  if (!existsSync(p)) continue;
  let svg = readFileSync(p, "utf8");
  if (!svg.includes('viewBox="0 0 24 24"')) continue;
  if (svg.includes('fill="#E8E8E8"') || svg.includes('fill="#FFFFFF"')) continue;
  const next = svg
    .replace(/fill="#9A9A9A"/g, 'fill="#E8E8E8"')
    .replace(/fill="#C4C4C4"/g, 'fill="#E8E8E8"')
    .replace(/fill="#888888"/g, 'fill="#E8E8E8"');
  if (next !== svg) {
    writeFileSync(p, next);
    brightened += 1;
  }
}

console.log(
  JSON.stringify(
    {
      todo: todo.length,
      fromSimple,
      fromLogo,
      fromWiki,
      keptEmblem: kept,
      brightenedSimple: brightened,
      hitSample: hits.slice(0, 30),
      wikiSample: wikiHits.slice(0, 30),
    },
    null,
    2,
  ),
);
