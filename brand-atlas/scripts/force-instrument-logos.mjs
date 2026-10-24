#!/usr/bin/env node
/**
 * Targeted logo fill for instruments still on text/emblem marks.
 * Sources: sibling copies → explicit Commons files → Wikidata P154 → Clearbit.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const UA = "SeenMarksBot/1.2 (brand-atlas instrument logos; local)";
const HINTS = JSON.parse(
  readFileSync(join(root, "scripts", "cover-title-hints-instruments.json"), "utf8"),
);
const { BRAND_DOMAINS } = await import("./brand-domains.mjs");

/** Copy a known-good mark onto a related SKU. */
const SIBLINGS = {
  "instruments__yamaha-piano": "instruments__yamaha-instruments",
  "instruments__yamaha-winds": "instruments__yamaha-instruments",
  "instruments__yamaha-strings": "instruments__yamaha-instruments",
  "instruments__fender-amp": "instruments__fender",
  "instruments__gretsch-guitar": "instruments__gretsch",
  "instruments__ltd": "instruments__esp",
};

/** Explicit Wikimedia Commons filenames when Wikidata search is flaky. */
const COMMONS_FILE = {
  "instruments__ableton": "Ableton.svg",
  "instruments__bosendorfer": "Bösendorfer.svg",
  "instruments__boss": "BOSS logo.svg",
  "instruments__shure": "Shure Logo 2024.svg",
  "instruments__sennheiser-mic": "Sennheiser logo (2019).svg",
  "instruments__universal-audio": "UA Logo.svg",
  "instruments__steinberg": "Steinberg Logo.svg",
  "instruments__ludwig": "Ludwig drums logo.svg",
  "instruments__zildjian": "Zildjian logo.svg",
  "instruments__elixir": "Elixir Strings logo.png",
  "instruments__bach": "Vincent Bach Corporation logo.png",
  "instruments__buffet": "Buffet Crampon logo.svg",
  "instruments__selmer": "Henri Selmer Paris logo.svg",
  "instruments__neumann": "Neumann microphone logo.svg",
  "instruments__sonor": "Sonor logo.svg",
  "instruments__pirastro": "Pirastro logo.svg",
  "instruments__mxr": "MXR logo.svg",
  "instruments__electro-harmonix": "Electro-Harmonix logo.svg",
  "instruments__strymon": "Strymon logo.png",
  "instruments__kemper": "Kemper Amps logo.png",
  "instruments__neural": "Neural DSP logo.png",
  "instruments__sequential": "Sequential Circuits logo.svg",
  "instruments__charvel": "Charvel logo.svg",
  "instruments__ovation": "Ovation Guitar Company logo.svg",
  "instruments__seagull": "Seagull Guitars logo.png",
  "instruments__collings": "Collings Guitars logo.png",
  "instruments__santa-cruz": "Santa Cruz Guitar Company logo.png",
  "instruments__breedlove": "Breedlove Guitars logo.png",
  "instruments__lowden": "Lowden Guitars logo.png",
  "instruments__eastman": "Eastman Strings logo.png",
  "instruments__apogee": "Apogee Electronics logo.png",
};

function isWeak(svg) {
  if (!svg) return true;
  if (svg.includes("data:image")) return false;
  if (svg.includes("<text")) return true;
  if (svg.length < 900) return true;
  return false;
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

function brightenIfDark(buf, mime) {
  if (mime === "image/svg+xml") return { buf, mime };
  const script = `
import sys, io
from PIL import Image, ImageOps
raw = sys.stdin.buffer.read()
im = Image.open(io.BytesIO(raw)).convert("RGBA")
pixels = list(im.getdata())
opaque = [p for p in pixels if p[3] > 30]
if not opaque:
    sys.stdout.buffer.write(raw); sys.exit(0)
avg = sum((0.2126*r + 0.7152*g + 0.0722*b) for r,g,b,_ in opaque) / len(opaque)
if avg < 70:
    r,g,b,a = im.split()
    rgb = ImageOps.invert(Image.merge("RGB", (r,g,b)))
    im = Image.merge("RGBA", (*rgb.split(), a))
out = io.BytesIO()
im.save(out, format="PNG")
sys.stdout.buffer.write(out.getvalue())
`;
  const r = spawnSync("python3", ["-c", script], { input: buf, maxBuffer: 20_000_000 });
  if (r.status !== 0) return { buf, mime };
  return { buf: r.stdout, mime: "image/png" };
}

async function fetchBuf(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 429 || res.status === 403) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return null;
}

function lightenSvg(svg) {
  let out = svg;
  if (!/fill=/.test(out)) out = out.replace(/<path /g, '<path fill="#E8E8E8" ');
  else out = out.replace(/fill="(?!none)[^"]*"/g, 'fill="#E8E8E8"');
  return out;
}

async function fromCommons(fname) {
  if (!fname) return null;
  const url =
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(fname) +
    "?width=256";
  const buf = await fetchBuf(url);
  if (!buf || buf.length < 200) return null;
  let mime = sniffMime(buf);
  if (!mime) return null;
  if (mime === "image/svg+xml") {
    return { kind: "svg", svg: lightenSvg(buf.toString("utf8")), src: fname };
  }
  const bright = brightenIfDark(buf, mime);
  if (bright.buf.length < 500) return null;
  return {
    kind: "raster",
    b64: bright.buf.toString("base64"),
    mime: bright.mime,
    src: fname,
  };
}

async function commonsSearch(query) {
  const api =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: `${query} logo`,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|mime|size",
      iiurlwidth: "256",
    });
  const buf = await fetchBuf(api);
  if (!buf) return null;
  let data;
  try {
    data = JSON.parse(buf.toString("utf8"));
  } catch {
    return null;
  }
  const pages = Object.values(data.query?.pages || {});
  pages.sort((a, b) => {
    const an = String(a.title || "").toLowerCase();
    const bn = String(b.title || "").toLowerCase();
    const score = (n) =>
      (n.includes("logo") ? 20 : 0) +
      (n.endsWith(".svg") ? 30 : 0) +
      (/\b(photo|hq|building|guitar|drum kit|person)\b/.test(n) ? -40 : 0);
    return score(bn) - score(an);
  });
  const tokens = String(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !["logo", "the", "and", "company", "inc"].includes(t));
  for (const page of pages.slice(0, 5)) {
    const title = String(page.title || "").replace(/^File:/i, "");
    const tl = title.toLowerCase();
    if (!/\b(logo|wordmark|emblem|symbol)\b/i.test(title) && !tl.endsWith(".svg")) {
      continue;
    }
    if (/\b(photo|headquarters|factory|museum|person|portrait|firefox|mozilla|avia|nasa)\b/i.test(title)) {
      continue;
    }
    // Require at least one brand token in the filename to avoid random logo hits.
    if (tokens.length && !tokens.some((t) => tl.includes(t))) continue;
    const got = await fromCommons(title);
    if (got) return { ...got, src: title };
  }
  return null;
}

async function fromClearbit(domain) {
  if (!domain) return null;
  const buf = await fetchBuf(`https://logo.clearbit.com/${domain}`);
  if (!buf || buf.length < 800) return null;
  const mime = sniffMime(buf) || "image/png";
  const bright = brightenIfDark(buf, mime);
  if (bright.buf.length < 600) return null;
  return {
    kind: "raster",
    b64: bright.buf.toString("base64"),
    mime: bright.mime,
    src: `clearbit:${domain}`,
  };
}

async function fromUplead(domain) {
  if (!domain) return null;
  const buf = await fetchBuf(`https://logo.uplead.com/${domain}`);
  if (!buf || buf.length < 800) return null;
  const mime = sniffMime(buf) || "image/png";
  if (mime === "image/svg+xml") {
    return { kind: "svg", svg: lightenSvg(buf.toString("utf8")), src: `uplead:${domain}` };
  }
  const bright = brightenIfDark(buf, mime);
  if (bright.buf.length < 600) return null;
  return {
    kind: "raster",
    b64: bright.buf.toString("base64"),
    mime: bright.mime,
    src: `uplead:${domain}`,
  };
}

async function resolveOne(item) {
  const id = item.id;
  // 1) Sibling copy
  const sibling = SIBLINGS[id];
  if (sibling) {
    const src = join(marksDir, `${sibling}.svg`);
    const existing = existsSync(src) ? readFileSync(src, "utf8") : "";
    if (existing && !isWeak(existing)) {
      copyFileSync(src, join(marksDir, `${id}.svg`));
      return { ok: true, src: `sibling:${sibling}` };
    }
  }

  // 2) Explicit Commons
  let logo = await fromCommons(COMMONS_FILE[id]);
  // 3) Commons search with company hint
  if (!logo) logo = await commonsSearch(HINTS[id] || item.name);
  // 4) Clearbit / uplead
  const domain = BRAND_DOMAINS[id];
  if (!logo) logo = await fromClearbit(domain);
  if (!logo) logo = await fromUplead(domain);

  if (!logo) return { ok: false };

  const out = join(marksDir, `${id}.svg`);
  if (logo.kind === "svg") writeFileSync(out, logo.svg);
  else writeFileSync(out, wrapImage(logo.b64, logo.mime));
  return { ok: true, src: logo.src };
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const items = catalog.items.filter((it) => it.categoryId === "instruments");
const todo = items.filter((it) => {
  const p = join(marksDir, `${it.id}.svg`);
  const svg = existsSync(p) ? readFileSync(p, "utf8") : "";
  return isWeak(svg);
});

console.error(`Force-instrument logos for ${todo.length} weak marks…`);

let ok = 0;
let fail = 0;
const sample = [];
for (const item of todo) {
  try {
    const r = await resolveOne(item);
    if (r.ok) {
      ok += 1;
      sample.push([item.id, r.src]);
      console.error(`ok  ${item.id} ← ${r.src}`);
    } else {
      fail += 1;
      console.error(`fail ${item.id}`);
    }
  } catch (e) {
    fail += 1;
    console.error(`err  ${item.id}: ${e.message || e}`);
  }
  await new Promise((r) => setTimeout(r, 350));
}

// Sibling pass again after parents may have been filled
for (const [child, parent] of Object.entries(SIBLINGS)) {
  const src = join(marksDir, `${parent}.svg`);
  const dst = join(marksDir, `${child}.svg`);
  if (!existsSync(src)) continue;
  const svg = readFileSync(src, "utf8");
  if (isWeak(svg)) continue;
  if (!existsSync(dst) || isWeak(readFileSync(dst, "utf8"))) {
    copyFileSync(src, dst);
    console.error(`copy ${child} ← ${parent}`);
  }
}

const scrub = join(root, "scripts", "scrub-mark-backgrounds.py");
if (existsSync(scrub)) {
  spawnSync("python3", [scrub], { cwd: root, encoding: "utf8", stdio: "inherit" });
}

console.log(JSON.stringify({ todo: todo.length, ok, fail, sample }, null, 2));
