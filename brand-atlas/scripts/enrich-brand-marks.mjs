#!/usr/bin/env node
/**
 * Fetch real brand logos for catalogue marks.
 * Replaces monograms, letter-favicons, and tiny pixel icons with:
 *   1) Simple Icons (when accurately mapped)
 *   2) logo.uplead.com PNG (domain map + guessed domains)
 *   3) readable grey wordmark emblem (last resort)
 *
 * Intentionally skips Google/DuckDuckGo favicons — those often return
 * single-letter placeholder tiles (the "C" / "H" squares on locked cards).
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
const CONCURRENCY = Number(process.env.MARK_CONCURRENCY || 20);
const FORCE_ALL = process.env.MARK_FORCE === "1";

/** Simple Icons slugs that are known wrong stand-ins — force logo refresh. */
const BAD_SIMPLE = new Set([
  "cigarettes__kent",
  "cigarettes__hope",
  "liquor__makers-mark",
  "wine__yellow-tail",
  "wine__vega-sicilia",
  "wine__santa-rita",
  "wine__kim-crawford",
  "beer__corona",
  "beer__stella-artois",
  "beer__asahi",
  "beer__suntory-beer",
  "beer__chang",
  "coffee__illy",
  "coffee__pret",
  "coffee__intelligentsia",
  "coffee__segafredo",
  "tea__yogi",
  "clothes__lululemon",
  "luxury__omega",
  "luxury__celine",
  "food__pringles",
  "food__lay",
  "food__kelloggs",
  "food__philadelphia",
  "food__evian",
]);

function isWordmark(svg) {
  return svg.includes("<text") && svg.includes("font-family") && !svg.includes("data:image");
}

/** Embedded raster that is a letter-favicon / tiny stub (not a real logo). */
function isBadEmbeddedLogo(svg) {
  const m = svg.match(/data:image\/[a-zA-Z0-9+.-]+;base64,([A-Za-z0-9+/=]+)/);
  if (!m) return false;
  const buf = Buffer.from(m[1], "base64");
  // PNG IHDR
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf.length >= 26) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const colorType = buf[25];
    if (w < 48 || h < 48) return true;
    // Google letter tiles are almost always indexed-color (type 3), square,
    // and under ~2KB. Real logos (e.g. Crown Royal) can also be indexed — keep
    // those when they have enough payload / non-tiny dimensions.
    if (colorType === 3 && buf.length < 2000 && w === h) return true;
    if (buf.length < 900) return true;
    return false;
  }
  // Non-PNG tiny payloads
  if (buf.length < 900) return true;
  return false;
}

function hasUsableRaster(svg) {
  return Boolean(svg && svg.includes("data:image") && !isBadEmbeddedLogo(svg));
}

function isWeakMark(itemId, svg) {
  if (!svg) return true;
  if (FORCE_ALL) return true;
  if (BAD_SIMPLE.has(itemId)) return true;
  if (isWordmark(svg)) return true;
  if (svg.includes("linearGradient") && svg.includes("font-family") && !svg.includes("data:image")) {
    return true;
  }
  if (isBadEmbeddedLogo(svg)) return true;
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
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return "image/webp";
  if (buf[0] === 0x3c || (buf[0] === 0x00 && buf.length > 8)) return null;
  return null;
}

function emblemSvg(name) {
  const short = name.length > 16 ? name.slice(0, 14) + "…" : name;
  const size = short.length > 12 ? 22 : short.length > 8 ? 28 : 34;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${escapeXml(name)}">
  <circle cx="80" cy="80" r="62" fill="none" stroke="#C4C4C4" stroke-width="3" opacity="0.55"/>
  <circle cx="80" cy="80" r="52" fill="none" stroke="#C4C4C4" stroke-width="1.5" opacity="0.35"/>
  <text x="80" y="88" text-anchor="middle" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="${size}" font-weight="800" letter-spacing="0.06em" fill="#C4C4C4">${escapeXml(short)}</text>
</svg>
`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build candidate domains for a brand (known map first, then name guesses). */
function domainsFor(item) {
  const out = [];
  const known = BRAND_DOMAINS[item.id];
  if (known) out.push(known);

  const cleaned = String(item.name || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''´`]/g, "")
    .replace(/\b(inc|ltd|llc|co|corp|the|company|group|brands?|brewery|distillery|winery|motors?|automobile|automotive)\b/gi, " ")
    .trim();
  const compact = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hyphen = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (compact.length >= 3) {
    out.push(`${compact}.com`);
    if (hyphen && hyphen !== compact) out.push(`${hyphen}.com`);
  }

  const ns = item.id.split("__")[0];
  if (["liquor", "wine", "beer", "sake", "coffee", "tea"].includes(ns)) {
    if (compact.length >= 3) {
      if (ns === "wine") out.push(`${compact}wine.com`, `${compact}wines.com`);
      if (ns === "beer") out.push(`${compact}beer.com`, `${compact}brewery.com`);
      if (ns === "liquor") out.push(`${compact}gin.com`, `${compact}vodka.com`, `${compact}whisky.com`);
      if (ns === "coffee") out.push(`${compact}coffee.com`);
      if (ns === "tea") out.push(`${compact}tea.com`);
    }
  }

  // Soft-drink / food common patterns
  if (["softdrinks", "food", "snacks", "dairy"].includes(item.categoryId) && compact.length >= 3) {
    out.push(`${compact}.com`);
  }

  return [...new Set(out)].slice(0, 5);
}

function isAcceptableLogo(buf, mime) {
  if (!mime || !buf || buf.length < 1800) return false;
  if (mime === "image/png" && buf.length >= 24) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    if (w < 64 || h < 48) return false;
  }
  // Palette-mode Google letter tiles are typically 1–2KB even at 128²
  if (mime === "image/png" && buf.length < 2500) {
    // indexed-color PNG: color type byte at IHDR offset 25 is 3
    const colorType = buf[25];
    if (colorType === 3) return false;
  }
  return true;
}

async function fetchLogoPng(domains) {
  for (const domain of domains) {
    const url = `https://logo.uplead.com/${domain}`;
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SeenMarks/1.0)" },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = sniffMime(buf);
      if (!isAcceptableLogo(buf, mime)) continue;
      return { b64: buf.toString("base64"), mime, domain };
    } catch {
      /* try next domain */
    }
  }
  return null;
}

async function fetchSimpleIcon(slug) {
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`;
  const res = await fetch(url);
  if (!res.ok) return null;
  let svg = await res.text();
  svg = svg.replace(/fill="[^"]*"/g, 'fill="#C4C4C4"');
  if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#C4C4C4" ');
  return svg;
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
const brandItems = catalog.items.filter((it) => !NATURE.has(it.categoryId));

let refreshed = 0;
let kept = 0;
let fromSimple = 0;
let fromLogo = 0;
let fromEmblem = 0;
const fail = [];
const logoHits = [];

const todo = [];
for (const item of brandItems) {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (!isWeakMark(item.id, existing)) {
    kept += 1;
    continue;
  }
  todo.push(item);
}

console.error(`Enriching ${todo.length} weak brand marks (${kept} already good)…`);

await mapPool(todo, CONCURRENCY, async (item) => {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";

  // Prefer accurate Simple Icons when mapped and not marked bad
  const siSlug = MARK_ICONS[item.id];
  if (siSlug && !BAD_SIMPLE.has(item.id)) {
    try {
      const svg = await fetchSimpleIcon(siSlug);
      if (svg) {
        writeFileSync(out, svg);
        refreshed += 1;
        fromSimple += 1;
        return;
      }
    } catch {
      /* fall through */
    }
  }

  const domains = domainsFor(item);
  try {
    const logo = await fetchLogoPng(domains);
    if (logo) {
      writeFileSync(out, wrapImage(logo.b64, logo.mime));
      refreshed += 1;
      fromLogo += 1;
      if (logoHits.length < 80) logoHits.push([item.id, logo.domain]);
      return;
    }
    fail.push([item.id, domains[0] || "—", "logo-miss"]);
  } catch (e) {
    fail.push([item.id, domains[0] || "—", String(e.message || e)]);
  }

  // Keep a usable existing raster rather than downgrading to a wordmark emblem
  if (hasUsableRaster(existing) || (existing.includes("viewBox=\"0 0 24 24\"") && existing.includes("<path"))) {
    kept += 1;
    return;
  }

  writeFileSync(out, emblemSvg(item.name));
  refreshed += 1;
  fromEmblem += 1;
});

// Scrub solid backgrounds on newly written raster marks
const scrub = join(root, "scripts", "scrub-mark-backgrounds.py");
if (existsSync(scrub)) {
  console.error("Scrubbing solid logo backgrounds…");
  const r = spawnSync("python3", [scrub], { cwd: root, encoding: "utf8" });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) console.error("scrub-mark-backgrounds exited", r.status);
}

console.log(
  JSON.stringify(
    {
      refreshed,
      kept,
      fromSimple,
      fromLogo,
      fromEmblem,
      failCount: fail.length,
      failSample: fail.slice(0, 40),
      logoHitSample: logoHits.slice(0, 40),
    },
    null,
    2,
  ),
);
