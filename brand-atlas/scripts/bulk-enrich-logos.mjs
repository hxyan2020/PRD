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
import { createHash } from "node:crypto";
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
  // Wrong stand-ins / text emblems on the instruments shelf
  "instruments__apogee",
  "instruments__elixir",
  "instruments__ludwig",
  "instruments__steinberg",
  "instruments__zildjian",
  "instruments__guitar-center",
  "instruments__ableton",
  "instruments__fazioli",
  "instruments__focusrite",
]);

const EXTRA_DOMAINS = {
  "coffee__dallmayr": "dallmayr.com",
  "coffee__douwe-egberts": "douwe-egberts.com",
  "coffee__juan-valdez": "juanvaldezcafe.com",
  "coffee__old-town": "oldtown.com.my",
  "coffee__hario": "hario.jp",
  "coffee__hoshino": "hoshinocoffee.com",
  "coffee__tullys": "tullys.com",
  "coffee__highlands-vn": "highlandscoffee.com.vn",
  "coffee__trung-nguyen": "trungnguyenlegend.com",
  "coffee__the-coffee-house": "thecoffeehouse.com",
  "coffee__percent-arabica": "arabica.com",
  "coffee__eight-oclock": "eightoclock.com",
  "coffee__melitta-us": "melitta.com",
  "coffee__forty-ninth": "49thparallelroasters.com",
  "coffee__kurukahveci": "mehmetefendi.com",
  "coffee__kahve-dunyasi": "kahvedunyasi.com",
  "coffee__cafes-richard": "cafesrichard.fr",
  "coffee__pilao": "pilao.com.br",
  "coffee__orfeu": "orfeu.com.br",
  "coffee__sleep-easy": "sleepyowl.co",
  "coffee__zus-coffee": "zuscoffee.com",
  "coffee__cafe-amazon": "cafe-amazon.com",
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

const INSTRUMENT_HINTS = JSON.parse(
  readFileSync(join(root, "scripts", "cover-title-hints-instruments.json"), "utf8"),
);
const TOY_HINTS = JSON.parse(readFileSync(join(root, "scripts", "toy-logo-hints.json"), "utf8"));
const RECHECK_WEAK = process.env.RECHECK_WEAK === "1";

/** Explicit Wikidata search strings when the brand name alone is ambiguous. */
const WIKI_SEARCH = {
  ...INSTRUMENT_HINTS,
  ...TOY_HINTS,
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
  if (svg.includes("<text")) return true;
  if (svg.length < 900 && !svg.includes("data:image")) return true;
  if (svg.includes("<path") && !svg.includes("<text")) return false;
  return true;
}

/** Detect solid-square / empty favicon blobs that look like "basic shapes". */
function isWeakRaster(svg) {
  if (!svg || !svg.includes("data:image")) return false;
  const m = svg.match(/data:([^;]+);base64,([^"]+)/);
  if (!m) return false;
  try {
    const buf = Buffer.from(m[2], "base64");
    return isSolidOrTinyRaster(buf);
  } catch {
    return true;
  }
}

/** True for tiny favicons or near-monochrome filled squares (common CDN placeholders). */
function isSolidOrTinyRaster(buf) {
  if (!buf || buf.length < 900) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf.length >= 26) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    if (w <= 64 && h <= 64) return true;
  }
  // PIL: few colour bins + mostly opaque → blank tile after invert
  const py = `
from PIL import Image
from io import BytesIO
from collections import Counter
import sys
raw=sys.stdin.buffer.read()
im=Image.open(BytesIO(raw)).convert("RGBA")
px=list(im.getdata())
opq=[p for p in px if p[3]>20]
if not opq:
    print("weak"); raise SystemExit
fill=len(opq)/max(1,len(px))
bins=Counter((p[0]//24,p[1]//24,p[2]//24) for p in opq)
if fill>0.88 and len(bins)<=12:
    print("weak"); raise SystemExit
if len(bins)<=3 and fill>0.55:
    print("weak"); raise SystemExit
print("ok")
`;
  const r = spawnSync("python3", ["-c", py], {
    input: buf,
    encoding: "utf8",
    maxBuffer: 8_000_000,
  });
  return (r.stdout || "").includes("weak");
}

/** Reject identical placeholder bytes reused across many brands in one run. */
const seenRasterHashes = new Map();
function acceptUniqueRaster(buf, itemId) {
  const h = createHash("sha1").update(buf).digest("hex");
  const prev = seenRasterHashes.get(h);
  if (prev && prev !== itemId) return false;
  seenRasterHashes.set(h, itemId);
  return true;
}

/** Item ids whose current mark bytes are reused by ≥2 brands (CDN placeholders). */
const DUP_WEAK_IDS = new Set();

function indexDuplicateMarks(items) {
  const byHash = new Map();
  for (const item of items) {
    const p = join(marksDir, `${item.id}.svg`);
    if (!existsSync(p)) continue;
    const svg = readFileSync(p, "utf8");
    const m = svg.match(/data:([^;]+);base64,([^"]+)/);
    if (!m) continue;
    const h = createHash("sha1").update(Buffer.from(m[2], "base64")).digest("hex");
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(item.id);
  }
  let n = 0;
  for (const [h, ids] of byHash.entries()) {
    if (ids.length === 1) {
      // Reserve unique existing rasters so later CDN hits can't collide with them.
      seenRasterHashes.set(h, ids[0]);
      continue;
    }
    for (const id of ids) DUP_WEAK_IDS.add(id);
    n += ids.length;
  }
  console.error(`Flagged ${n} marks in duplicate-raster groups for re-enrich.`);
}

function emblemSvg(name) {
  const short = name.length > 16 ? `${name.slice(0, 14)}…` : name;
  const size = short.length > 12 ? 22 : short.length > 8 ? 28 : 34;
  const esc = String(name)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const escShort = String(short)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${esc}">
  <text x="80" y="92" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="${size}" font-weight="700" fill="#E8E8E8">${escShort}</text>
</svg>
`;
}

function needsEnrich(svg, itemId) {
  if (DUP_WEAK_IDS.has(itemId)) return true;
  if (isEmblem(svg)) return true;
  // Always re-check solid CDN placeholders — they masquerade as "real" rasters.
  if (isWeakRaster(svg)) return true;
  return false;
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
    .replace(/[''´`%]/g, "")
    .replace(
      /\b(inc|ltd|llc|co|corp|the|company|group|brands?|brewery|distillery|winery|motors?|automobile|automotive|auto|bus|coffee|tea|cafe|café|thé|thee|roasters?|espresso)\b/gi,
      " ",
    )
    .trim();
  const compact = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hyphen = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (compact.length >= 2) {
    out.push(
      `${compact}.com`,
      `${compact}.com.cn`,
      `${compact}.co.uk`,
      `${compact}.de`,
      `${compact}.jp`,
      `${compact}.com.br`,
      `${compact}.com.co`,
      `${compact}.com.my`,
      `${compact}.co.jp`,
    );
    if (hyphen && hyphen !== compact) {
      out.push(`${hyphen}.com`, `${hyphen}.com.cn`, `${hyphen}.co.uk`);
    }
  }

  const slug = item.id.split("__")[1];
  if (slug) {
    const s = slug.replace(/-/g, "");
    out.push(`${s}.com`, `${slug}.com`, `${s}.com.cn`);
  }

  return [...new Set(out)].slice(0, 12);
}

/** Accept CDN/wiki raster, normalize when helpful, else keep original bytes. */
function rasterFromBuf(buf, mime, meta = {}) {
  if (!mime) return null;
  if (!isAcceptableLogo(buf, mime, { lenient: true })) return null;
  if (mime === "image/svg+xml") {
    const t = buf.toString("utf8");
    if (!t.includes("<svg")) return null;
    return { b64: Buffer.from(t, "utf8").toString("base64"), mime, ...meta };
  }
  if (isSolidOrTinyRaster(buf)) return null;
  const norm = normalizeRaster(buf);
  if (norm) {
    const nbuf = Buffer.from(norm.b64, "base64");
    if (nbuf.length >= 700 && !isSolidOrTinyRaster(nbuf)) {
      return { ...norm, ...meta };
    }
  }
  if (buf.length >= 700) {
    return { b64: buf.toString("base64"), mime, ...meta };
  }
  return null;
}

const SKIP_ICON_HORSE = process.env.SKIP_ICON_HORSE === "1";

async function fetchLogo(domains, itemId = "") {
  for (const domain of domains) {
    const urls = [`https://logo.uplead.com/${domain}`];
    if (!SKIP_ICON_HORSE) urls.push(`https://icon.horse/icon/${domain}`);
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          redirect: "follow",
          headers: { "User-Agent": UA, Accept: "image/*,*/*" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (itemId && !acceptUniqueRaster(buf, itemId)) continue;
        const mime = sniffMime(buf) || res.headers.get("content-type")?.split(";")[0] || null;
        const hit = rasterFromBuf(buf, mime, { domain });
        if (hit) return hit;
      } catch {
        /* next source */
      }
    }
  }
  return null;
}

function wikiTitleCandidates(item) {
  const name = String(item.name || "").trim();
  const out = [];
  if (WIKI_SEARCH[item.id]) out.push(WIKI_SEARCH[item.id]);
  out.push(name);
  // Common disambiguators for F&B brands
  if (item.categoryId === "hotdrinks") {
    out.push(`${name} coffee`, `${name} tea`, `${name} (coffee)`, `${name} (tea)`);
  }
  if (item.categoryId === "softdrinks") out.push(`${name} (drink)`, `${name} beverage`);
  if (item.categoryId === "alcohol") out.push(`${name} (drink)`, `${name} whisky`, `${name} whiskey`);
  return [...new Set(out.filter(Boolean))].slice(0, 4);
}

async function fetchWikipediaLogo(item) {
  for (const title of wikiTitleCandidates(item)) {
    try {
      const url =
        "https://en.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(title.replace(/ /g, "_"));
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.type === "disambiguation") continue;
      const src =
        data.originalimage?.source ||
        data.thumbnail?.source ||
        null;
      if (!src) continue;
      const file = decodeURIComponent(
        (src.split("/").pop() || "").split("?")[0],
      );
      const score = logoFilenameScore(file);
      // Accept clear logo filenames; reject storefront / building photos.
      if (score < 10 && !/\blogo\b/i.test(file)) continue;
      if (looksLikePhotoFilename(file)) continue;
      const imgRes = await fetch(src, {
        headers: { "User-Agent": UA },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      if (!imgRes.ok) continue;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const mime = sniffMime(buf) || "image/png";
      const hit = rasterFromBuf(buf, mime, { domain: `wiki:${title}` });
      if (hit) return hit;
    } catch {
      /* next title */
    }
  }
  return null;
}

async function fetchCommonsLogoSearch(item) {
  const name = String(item.name || "").trim();
  if (!name || name.length < 2) return null;
  try {
    const q = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `${name} logo`,
      srnamespace: "6",
      srlimit: "8",
      format: "json",
    });
    const found = await wikiJson(`https://commons.wikimedia.org/w/api.php?${q}`);
    const hits = found.query?.search || [];
    let best = null;
    let bestScore = 0;
    for (const hit of hits) {
      const title = String(hit.title || "").replace(/^File:/i, "");
      const score = logoFilenameScore(title);
      // Prefer hits that mention the brand name
      const nameHit = name
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .some((w) => title.toLowerCase().includes(w));
      const adj = score + (nameHit ? 15 : -20);
      if (adj > bestScore) {
        bestScore = adj;
        best = title;
      }
    }
    if (!best || bestScore < 25) return null;
    const fileUrl =
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
      encodeURIComponent(best) +
      "?width=256";
    const res = await fetch(fileUrl, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    let mime = sniffMime(buf);
    if (mime === "image/svg+xml") {
      let svg = buf.toString("utf8");
      if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
      else svg = svg.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
      return { b64: Buffer.from(svg, "utf8").toString("base64"), mime: "image/svg+xml", domain: `commons:${best}` };
    }
    if (!mime) mime = "image/png";
    return rasterFromBuf(buf, mime, { domain: `commons:${best}` });
  } catch {
    return null;
  }
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
    const hit = rasterFromBuf(buf, mime, { file: bestFile });
    if (!hit) return null;
    return { kind: "raster", ...hit };
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

indexDuplicateMarks(brandItems);

const todo = [];
for (const item of brandItems) {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (FORCE_IDS.has(item.id) || needsEnrich(existing, item.id)) todo.push(item);
}

console.error(`Bulk-enriching ${todo.length} marks…`);

let fromLogo = 0;
let fromSimple = 0;
let fromWiki = 0;
let fromWikiPage = 0;
let fromCommons = 0;
let kept = 0;
const hits = [];
const wikiHits = [];
const stillWeak = [];

function writeRasterMark(out, logo) {
  if (logo.mime === "image/svg+xml") {
    // Stored as base64 of SVG text from rasterFromBuf / commons
    writeFileSync(out, Buffer.from(logo.b64, "base64").toString("utf8"));
    return;
  }
  writeFileSync(out, wrapImage(logo.b64, logo.mime));
}

// Pass 1: Simple Icons (mapped) + uplead / icon.horse
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

  const logo = await fetchLogo(domainsFor(item), item.id);
  if (logo) {
    writeRasterMark(out, logo);
    fromLogo += 1;
    if (hits.length < 80) hits.push([item.id, logo.domain]);
    item.__done = true;
    return;
  }

  stillWeak.push(item);
});

console.error(`Pass1 done. Still weak: ${stillWeak.length}. Wikipedia / Commons / Wikidata…`);

// Pass 2: Wikipedia page logo → Commons search → Wikidata P154
await mapPool(stillWeak, WIKI_CONCURRENCY, async (item) => {
  const out = join(marksDir, `${item.id}.svg`);

  const pageLogo = await fetchWikipediaLogo(item);
  if (pageLogo) {
    writeRasterMark(out, pageLogo);
    fromWikiPage += 1;
    if (wikiHits.length < 80) wikiHits.push([item.id, pageLogo.domain]);
    item.__done = true;
    return;
  }

  const commons = await fetchCommonsLogoSearch(item);
  if (commons) {
    writeRasterMark(out, commons);
    fromCommons += 1;
    if (wikiHits.length < 80) wikiHits.push([item.id, commons.domain]);
    item.__done = true;
    return;
  }

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

  // Prefer a readable wordmark over a shared blank CDN square.
  writeFileSync(out, emblemSvg(item.name));
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
      fromWikiPage,
      fromCommons,
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
