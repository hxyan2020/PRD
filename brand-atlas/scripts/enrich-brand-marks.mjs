#!/usr/bin/env node
/**
 * Fetch real brand logos (Clearbit) for items that still use plain wordmarks
 * or bad Simple Icons stand-ins, wrapping PNGs as greyscale SVG marks.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_DOMAINS } from "./brand-domains.mjs";
import { MARK_ICONS } from "./mark-icons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

/** Simple Icons slugs that are known wrong stand-ins — force Clearbit refresh. */
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

function isWeakMark(itemId, svg) {
  if (BAD_SIMPLE.has(itemId)) return true;
  if (isWordmark(svg)) return true;
  // Tiny monogram badges
  if (svg.includes("linearGradient") && svg.includes("font-family") && !svg.includes("data:image")) {
    return true;
  }
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
  if (buf[0] === 0x3c || (buf[0] === 0x00 && buf.length > 8)) return null; // skip svg/odd
  return "image/png";
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

async function fetchLogoPng(domain) {
  const sources = [
    `https://logo.uplead.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SeenMarks/1.0)" },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      // Skip tiny placeholder / 404 stub / letter-favicon icons
      if (buf.length < 700) continue;
      // Google favicons under ~1KB are often generic or 16–32px letters
      if (url.includes("google.com") && buf.length < 1200) continue;
      // Trust magic bytes — some CDNs mislabel PNGs (e.g. application/x-msdos-program)
      const mime = sniffMime(buf);
      if (!mime) continue;
      return { b64: buf.toString("base64"), mime };
    } catch {
      /* try next */
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

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const brandItems = catalog.items.filter(
  (it) => it.categoryId !== "trees" && it.categoryId !== "flowers" && it.categoryId !== "animals",
);

let refreshed = 0;
let kept = 0;
const fail = [];

for (const item of brandItems) {
  const out = join(marksDir, `${item.id}.svg`);
  const existing = existsSync(out) ? readFileSync(out, "utf8") : "";
  const needs = !existing || isWeakMark(item.id, existing);

  if (!needs) {
    kept += 1;
    continue;
  }

  // Prefer accurate Simple Icons when mapped and not marked bad
  const siSlug = MARK_ICONS[item.id];
  if (siSlug && !BAD_SIMPLE.has(item.id)) {
    try {
      const svg = await fetchSimpleIcon(siSlug);
      if (svg) {
        writeFileSync(out, svg);
        refreshed += 1;
        continue;
      }
    } catch {
      /* fall through */
    }
  }

  const domain = BRAND_DOMAINS[item.id];
  if (domain) {
    try {
      const logo = await fetchLogoPng(domain);
      if (logo) {
        writeFileSync(out, wrapImage(logo.b64, logo.mime));
        refreshed += 1;
        continue;
      }
      fail.push([item.id, domain, "logo-miss"]);
    } catch (e) {
      fail.push([item.id, domain, String(e.message || e)]);
    }
  } else {
    fail.push([item.id, "—", "no-domain"]);
  }

  // Emblem-style wordmark fallback (readable grey mark on dark tiles)
  writeFileSync(out, emblemSvg(item.name));
  refreshed += 1;
}

console.log(
  JSON.stringify(
    {
      refreshed,
      kept,
      failCount: fail.length,
      failSample: fail.slice(0, 40),
    },
    null,
    2,
  ),
);
