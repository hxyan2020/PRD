#!/usr/bin/env node
/**
 * Force-fetch Wikidata P154 logos for specific brands (or remaining emblems
 * in a category). Overwrites existing marks. Inverts near-black logos so
 * they remain visible under locked-tile invert filters.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const UA = "SeenMarksBot/1.1 (brand-atlas wiki logos; local)";
const CONCURRENCY = Number(process.env.WIKI_CONCURRENCY || 4);
const CATEGORY = process.env.MARK_CATEGORY || "";
const ONLY_EMBLEM = process.env.ONLY_EMBLEM !== "0";

const INSTRUMENT_HINTS = JSON.parse(
  readFileSync(join(root, "scripts", "cover-title-hints-instruments.json"), "utf8"),
);

const WIKI_SEARCH = {
  ...INSTRUMENT_HINTS,
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
  "cars__iso-rivolta": "Iso",
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
  "cars__imperia": "Imperia (car)",
  "cars__indumotor": "Indumotor",
  "cars__joule": "Optimal Energy Joule",
  "cars__avatr": "Avatr Technology",
  "cars__faw-hongqi": "Hongqi (automobile)",
  "cars__zeekr": "Zeekr",
  "cars__lancia": "Lancia",
  "cars__deepal": "Deepal",
  "cars__leapmotor": "Leapmotor",
  "cars__ds-automobiles": "DS Automobiles",
  "cars__perodua": "Perodua",
  "cars__ssangyong": "KG Mobility",
  "cars__exeed": "Exeed",
  "cars__luxgen": "Luxgen",
  "cars__holden": "Holden",
  "cars__mercury": "Mercury (automobile)",
  "cars__oldsmobile": "Oldsmobile",
  "cars__yangwang": "Yangwang",
  "cars__belaz": "BelAZ",
  "cars__zaz": "ZAZ",
  "cars__zastava": "Zastava Automobiles",
  "cars__troller": "Troller",
  "cars__think-city": "Think City",
  "cars__asuna": "Asuna",
  "cars__battista": "Automobili Pininfarina Battista",
};

/** Delete known wrong marks before re-fetch. */
const ALWAYS_FORCE = new Set([
  "cars__hummer",
  "cars__avatr",
  "cars__faw-hongqi",
  "cars__toyota-crown",
  "cars__namco",
  "cars__geo",
  "cars__hsv",
  "cars__pontiac",
  "cars__im-motors",
  "cars__jetour",
  "cars__hyptec",
  "cars__ika",
  "cars__jaecoo",
  "cars__human-horizons",
  "cars__iran-khodro",
  "cars__kamaz",
  "cars__jinbei",
  "cars__isdera",
  "cars__iveco",
  "cars__iso-rivolta",
  "cars__innoson",
  "cars__inokom",
  "cars__inmotion",
  "cars__imperia",
  "cars__indumotor",
  "cars__joule",
]);

function isEmblem(svg) {
  if (!svg) return true;
  if (svg.includes("data:image")) return false;
  if (svg.includes('viewBox="0 0 24 24"')) return false;
  if (svg.includes("<text")) return true;
  // Tiny path-only stubs / icon stand-ins are not real brand logos.
  if (svg.length < 900 && !svg.includes("data:image")) return true;
  if (svg.includes("<path") && !svg.includes("<text")) return false;
  return true;
}

function wrapImage(b64, mime = "image/png") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <defs>
    <filter id="g"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.15"/><feFuncG type="linear" slope="1.15"/><feFuncB type="linear" slope="1.15"/></feComponentTransfer></filter>
  </defs>
  <image href="data:${mime};base64,${b64}" width="128" height="128" filter="url(#g)" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

function sniffMime(buf) {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  const head = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg") || head.includes("<svg")) return "image/svg+xml";
  return null;
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
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status === 403) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`wiki ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return null;
}

/** Use Pillow via python to invert near-black logos → light silhouettes. */
function brightenIfDark(buf, mime) {
  if (mime === "image/svg+xml") return { buf, mime };
  const script = `
import sys, io
from PIL import Image, ImageOps, ImageStat
raw = sys.stdin.buffer.read()
im = Image.open(io.BytesIO(raw)).convert("RGBA")
# Estimate luminance of non-transparent pixels
pixels = list(im.getdata())
opaque = [p for p in pixels if p[3] > 30]
if not opaque:
    sys.stdout.buffer.write(raw); sys.exit(0)
avg = sum((0.2126*r + 0.7152*g + 0.0722*b) for r,g,b,_ in opaque) / len(opaque)
# Mostly black mark on transparent/black → invert RGB
if avg < 70:
    r,g,b,a = im.split()
    rgb = Image.merge("RGB", (r,g,b))
    rgb = ImageOps.invert(rgb)
    im = Image.merge("RGBA", (*rgb.split(), a))
out = io.BytesIO()
im.save(out, format="PNG")
sys.stdout.buffer.write(out.getvalue())
`;
  const r = spawnSync("python3", ["-c", script], { input: buf, maxBuffer: 20_000_000 });
  if (r.status !== 0) return { buf, mime };
  return { buf: r.stdout, mime: "image/png" };
}

async function fetchWikidataLogo(item) {
  const search = WIKI_SEARCH[item.id] || item.name;
  const q = new URLSearchParams({
    action: "wbsearchentities",
    search,
    language: "en",
    format: "json",
    limit: "8",
  });
  const found = await wikiJson(`https://www.wikidata.org/w/api.php?${q}`);
  const hits = found?.search || [];
  let bestFile = null;
  let bestScore = -999;

  for (const hit of hits.slice(0, 6)) {
    const ent = await wikiJson(`https://www.wikidata.org/wiki/Special:EntityData/${hit.id}.json`);
    const entity = ent?.entities?.[hit.id];
    const logos = entity?.claims?.P154 || [];
    for (const claim of logos) {
      const fname = claim?.mainsnak?.datavalue?.value;
      if (!fname) continue;
      let score = logoFilenameScore(fname);
      // Prefer logos whose filename mentions a token from the brand name
      const tokens = String(item.name)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3);
      const fn = fname.toLowerCase();
      if (tokens.some((t) => fn.includes(t))) score += 25;
      if (bestScore < score) {
        bestScore = score;
        bestFile = fname;
      }
    }
    if (bestScore >= 70) break;
  }

  if (!bestFile || bestScore < 10) return null;

  const fileUrl =
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(bestFile) +
    "?width=256";
  const res = await fetch(fileUrl, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  let buf = Buffer.from(await res.arrayBuffer());
  let mime = sniffMime(buf) || "image/png";

  if (mime === "image/svg+xml") {
    let svg = buf.toString("utf8");
    // Light fill for locked invert visibility
    if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#E8E8E8" ');
    else svg = svg.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
    return { kind: "svg", svg, file: bestFile, score: bestScore };
  }

  ({ buf, mime } = brightenIfDark(buf, mime));
  if (buf.length < 600) return null;
  return { kind: "raster", b64: buf.toString("base64"), mime, file: bestFile, score: bestScore };
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
let items = catalog.items.filter((it) => !["trees", "flowers", "animals", "birds", "mushrooms"].includes(it.categoryId));
if (CATEGORY) items = items.filter((it) => it.categoryId === CATEGORY);

const todo = [];
for (const item of items) {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (ALWAYS_FORCE.has(item.id)) {
    todo.push(item);
    continue;
  }
  if (ONLY_EMBLEM && !isEmblem(existing)) continue;
  // Prefer items with explicit wiki search or remaining emblems
  if (WIKI_SEARCH[item.id] || isEmblem(existing)) todo.push(item);
}

console.error(`Wiki-force ${todo.length} marks (category=${CATEGORY || "*"})…`);

let ok = 0;
let fail = 0;
const sample = [];

await mapPool(todo, CONCURRENCY, async (item) => {
  const out = join(marksDir, `${item.id}.svg`);
  try {
    const logo = await fetchWikidataLogo(item);
    if (!logo) {
      fail += 1;
      return;
    }
    if (logo.kind === "svg") writeFileSync(out, logo.svg);
    else writeFileSync(out, wrapImage(logo.b64, logo.mime));
    ok += 1;
    if (sample.length < 50) sample.push([item.id, logo.file, logo.score]);
  } catch {
    fail += 1;
  }
});

const scrub = join(root, "scripts", "scrub-mark-backgrounds.py");
if (existsSync(scrub)) {
  console.error("Scrubbing…");
  spawnSync("python3", [scrub], { cwd: root, encoding: "utf8", stdio: "inherit" });
}

console.log(JSON.stringify({ todo: todo.length, ok, fail, sample }, null, 2));
