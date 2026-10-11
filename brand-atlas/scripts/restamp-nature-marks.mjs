#!/usr/bin/env node
/**
 * Re-stamp nature marks so Catalogue of Life species don't all share the
 * same "sheep / cricket" blob. Picks among several silhouettes per kind,
 * mixed by stable hash of the item id + tag cues / genus keywords.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const FILL = "#C4C4C4";

function svg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  ${body}
</svg>
`;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(id, variants) {
  return variants[hash(id) % variants.length];
}

const MAMMALS = [
  // quadruped
  `<ellipse cx="60" cy="68" rx="36" ry="22" fill="${FILL}"/><circle cx="92" cy="56" r="14" fill="${FILL}"/><path fill="${FILL}" d="M40 84v28h10V84 M70 84v28h10V84 M100 52l12-8"/>`,
  // bear-ish
  `<circle cx="36" cy="40" r="14" fill="${FILL}"/><circle cx="92" cy="40" r="14" fill="${FILL}"/><ellipse cx="64" cy="68" rx="38" ry="40" fill="${FILL}"/><circle cx="50" cy="62" r="5" fill="#8A8A8A"/><circle cx="78" cy="62" r="5" fill="#8A8A8A"/>`,
  // deer / antlers
  `<path fill="${FILL}" d="M40 20c0 0 8 20 12 28 M52 16c0 0 4 24 6 32 M76 16c0 0-4 24-6 32 M88 20c0 0-8 20-12 28 M48 52h32c0 28-8 44-16 44s-16-16-16-44z M44 96v24h10V96 M74 96v24h10V96"/>`,
  // rabbit
  `<path fill="${FILL}" d="M48 12c-4 20 0 36 8 40 M80 12c4 20 0 36-8 40"/><ellipse cx="64" cy="72" rx="28" ry="32" fill="${FILL}"/><circle cx="52" cy="64" r="5" fill="#8A8A8A"/><circle cx="76" cy="64" r="5" fill="#8A8A8A"/>`,
  // feline
  `<path fill="${FILL}" d="M40 28l8 20h32l8-20-12 8-12-12-12 12z M40 48h48c0 28-10 44-24 44S40 76 40 48z M52 60h6v6h-6z M70 60h6v6h-6z"/>`,
  // canine
  `<path fill="${FILL}" d="M36 40c0-12 8-20 16-20 4 0 6 2 8 4 2-2 4-4 8-4 8 0 16 8 16 20v8H36z M40 48h40v28c0 8-6 14-14 14H54c-8 0-14-6-14-14z M44 90l-8 28h12l6-28 M76 90l8 28H72l-6-28"/>`,
];

const BIRDS = [
  `<path fill="${FILL}" d="M28 72c8-20 28-36 52-36 12 0 24 4 32 12l8-16-4 20c8 8 8 20 0 28-12 12-32 16-52 12-16-4-28-12-36-20z"/>`,
  `<path fill="${FILL}" d="M64 28c-8 0-14 8-14 16 0 4 2 8 6 10l-36 20 8 8 28-12v30h16V70l28 12 8-8-36-20c4-2 6-6 6-10 0-8-6-16-14-16z"/>`,
  `<ellipse cx="64" cy="64" rx="32" ry="40" fill="${FILL}"/><circle cx="50" cy="56" r="12" fill="#9A9A9A"/><circle cx="78" cy="56" r="12" fill="#9A9A9A"/><path fill="${FILL}" d="M64 68l-6 10h12z M44 28l8 16 M84 28l-8 16"/>`,
  `<path fill="${FILL}" d="M72 20c-4 16-4 28 4 40 8 12 4 28-8 36-8 4-16 0-20-8 12 0 16-8 12-16-8-12-8-28-4-40z M48 88c-4 12 0 24 8 32h12c-4-12-4-24 0-32"/>`,
  `<path fill="${FILL}" d="M64 28c-12 0-20 12-16 24 0 16 8 28 16 40 8-12 16-24 16-40 4-12-4-24-16-24z M48 48c-12 4-16 16-8 24 M80 52l16 8-12 4"/>`,
];

const INSECTS = [
  // cricket / beetle side
  `<ellipse cx="64" cy="72" rx="28" ry="16" fill="${FILL}"/><circle cx="88" cy="64" r="10" fill="${FILL}"/><path fill="${FILL}" d="M40 72c-12 8-20 20-16 28 M48 68c-8-16-4-28 4-28 M96 60l12-16 M96 68l16-8"/>`,
  // butterfly
  `<path fill="${FILL}" d="M64 64c-20-28-40-32-48-20 12 4 28 16 48 20-20 4-36 16-48 20 8 12 28 8 48-20 20 28 40 32 48 20-12-4-28-16-48-20 20-4 36-16 48-20-8-12-28-8-48 20z M62 40h4v56h-4z"/>`,
  // ant
  `<circle cx="64" cy="36" r="12" fill="${FILL}"/><ellipse cx="64" cy="58" rx="10" ry="12" fill="${FILL}"/><ellipse cx="64" cy="88" rx="16" ry="22" fill="${FILL}"/><path fill="${FILL}" d="M52 36l-16-12 M76 36l16-12 M48 58l-20 0 M80 58l20 0"/>`,
  // bee
  `<ellipse cx="64" cy="68" rx="28" ry="20" fill="${FILL}"/><path fill="${FILL}" d="M48 60h32v4H48z M48 72h32v4H48z M36 56c-12-16 0-28 12-20 M92 56c12-16 0-28-12-20"/>`,
  // dragonfly
  `<path fill="${FILL}" d="M20 56c20-8 36-4 44 8-8 12-24 16-44 8z M108 56c-20-8-36-4-44 8 8 12 24 16 44 8z"/><ellipse cx="64" cy="64" rx="8" ry="28" fill="${FILL}"/>`,
  // ladybug
  `<ellipse cx="64" cy="68" rx="32" ry="28" fill="${FILL}"/><circle cx="64" cy="40" r="14" fill="${FILL}"/><circle cx="52" cy="60" r="5" fill="#8A8A8A"/><circle cx="76" cy="60" r="5" fill="#8A8A8A"/><circle cx="64" cy="78" r="5" fill="#8A8A8A"/>`,
  // spider
  `<circle cx="64" cy="64" r="16" fill="${FILL}"/><circle cx="64" cy="48" r="10" fill="${FILL}"/><path fill="${FILL}" d="M48 56l-28-16 M48 64l-32 0 M48 72l-28 16 M80 56l28-16 M80 64l32 0 M80 72l28 16"/>`,
];

const FISH = [
  `<path fill="${FILL}" d="M16 64c16-24 40-36 64-32 16 2 28 12 32 24H88c0 8-8 16-20 16H44c-12 0-22-4-28-8z M92 48l16-16-4 20"/>`,
  `<path fill="${FILL}" d="M12 68c8-28 40-44 72-40 20 2 36 14 40 28H96c-4 12-16 20-32 20H40c-12 0-24-4-28-16z M100 56c8-4 16 0 20 8l-12 4"/>`,
  `<path fill="${FILL}" d="M20 64c8-24 36-40 68-36 16 2 28 12 32 24-20-4-36 4-44 16-4 6-4 14 2 18-12 0-24-6-32-16z M96 52c4-8 12-10 16-6"/>`,
  `<path fill="${FILL}" d="M16 68c12-24 40-36 72-32 16 2 28 10 32 20H96c0 8-8 16-20 16H48c-12 0-24-4-32-12z M88 48l16-20-4 24"/>`,
];

const REPTILES = [
  `<ellipse cx="64" cy="70" rx="40" ry="22" fill="${FILL}"/><circle cx="96" cy="62" r="12" fill="${FILL}"/><path fill="${FILL}" d="M36 86l-12 16 M52 90l-4 18 M76 90l4 18 M92 86l12 16"/>`,
  `<path fill="${FILL}" d="M24 40c16-16 40-8 48 8 8 16 24 20 40 8-12 20-36 24-52 8-12-12-28-16-40-4z M104 52c8 0 12 8 8 14"/>`,
  `<ellipse cx="64" cy="64" rx="40" ry="28" fill="${FILL}"/><circle cx="104" cy="64" r="12" fill="${FILL}"/><path fill="${FILL}" d="M28 56c-12 0-16 12-8 16 M72 36c0-12 12-16 16-8 M48 40l16 24 16-24"/>`,
  `<ellipse cx="64" cy="72" rx="36" ry="28" fill="${FILL}"/><circle cx="44" cy="48" r="14" fill="${FILL}"/><circle cx="84" cy="48" r="14" fill="${FILL}"/><circle cx="44" cy="48" r="5" fill="#8A8A8A"/><circle cx="84" cy="48" r="5" fill="#8A8A8A"/>`,
];

const FLOWERS = [
  `<path fill="${FILL}" d="M64 40c0-8 6-14 0-22 8 0 14 6 22 0-6 8 0 14 0 22 8 0 14 6 22 0-8 6-6 14-14 14 0 8-6 14 0 22-8 0-14-6-22 0 6-8 0-14 0-22-8 0-14-6-22 0 8-6 6-14 14-14z"/><circle cx="64" cy="54" r="8" fill="${FILL}"/><path fill="${FILL}" d="M60 78h8v42h-8z"/>`,
  `<circle cx="64" cy="48" r="22" fill="${FILL}"/><circle cx="64" cy="48" r="10" fill="#8A8A8A"/><path fill="${FILL}" d="M64 26l4-18-4 18-4-18z M64 70l4 18-4-18-4 18z M42 48l-18 4 18-4-18-4z M86 48l18 4-18-4 18-4z M60 70h8v50h-8z"/>`,
  `<path fill="${FILL}" d="M64 20c-16 8-24 28-20 48h40c4-20-4-40-20-48z M48 28c8-12 16-12 16-12s8 0 16 12 M60 68h8v52h-8z"/>`,
  `<circle cx="48" cy="36" r="14" fill="${FILL}"/><circle cx="80" cy="36" r="14" fill="${FILL}"/><circle cx="64" cy="28" r="14" fill="${FILL}"/><circle cx="52" cy="56" r="14" fill="${FILL}"/><circle cx="76" cy="56" r="14" fill="${FILL}"/><path fill="${FILL}" d="M60 70h8v50h-8z"/>`,
  `<path fill="${FILL}" d="M64 70c-24-8-36-28-28-44 8 12 20 20 28 24 8-4 20-12 28-24 8 16-4 36-28 44z M60 70h8v50h-8z"/>`,
];

const TREES = [
  `<path fill="${FILL}" d="M64 18c-18 0-32 12-34 28-10 2-18 12-18 24 0 14 11 26 26 28v22h12V98h16v22h12V98c15-2 26-14 26-28 0-12-8-22-18-24-2-16-16-28-34-28z"/>`,
  `<path fill="${FILL}" d="M64 8L40 40h10L36 60h12L32 84h20v36h24V84h20L80 60h12L78 40h10z"/>`,
  `<path fill="${FILL}" d="M64 48c-4-20-20-36-36-40 16 8 28 24 32 40 4-20 20-36 36-40-16 8-28 24-32 40z M60 48h8v72h-8z"/>`,
  `<ellipse cx="64" cy="40" rx="36" ry="28" fill="${FILL}"/><path fill="${FILL}" d="M60 64h8v56h-8z"/>`,
  `<path fill="${FILL}" d="M64 6c-8 20-20 40-22 70h44c-2-30-14-50-22-70z M50 76h28v44H50z"/>`,
];

const MUSHROOMS = [
  `<path fill="${FILL}" d="M24 64c0-24 18-44 40-44s40 20 40 44c-8-8-24-12-40-12S32 56 24 64z"/><rect x="56" y="64" width="16" height="44" rx="4" fill="${FILL}"/>`,
  `<path fill="${FILL}" d="M20 70c0-28 20-50 44-50s44 22 44 50c-10-10-28-14-44-14S30 60 20 70z"/><rect x="54" y="70" width="20" height="40" rx="4" fill="${FILL}"/>`,
  `<ellipse cx="64" cy="48" rx="44" ry="28" fill="${FILL}"/><rect x="58" y="48" width="12" height="56" rx="3" fill="${FILL}"/><circle cx="48" cy="44" r="4" fill="#9A9A9A"/><circle cx="72" cy="40" r="3" fill="#9A9A9A"/>`,
];

const GENUS_HINTS = [
  [/felis|panthera|lynx|puma|leopard|tiger|lion|cat/i, MAMMALS, 4],
  [/canis|vulpes|wolf|fox|dog|coyote/i, MAMMALS, 5],
  [/ursus|bear|ailuropoda/i, MAMMALS, 1],
  [/cervus|deer|rangifer|alces|moose/i, MAMMALS, 2],
  [/lepus|oryctolagus|rabbit|hare/i, MAMMALS, 3],
  [/equus|horse|zebra/i, MAMMALS, 0],
  [/bos|cow|bison|bubalus/i, MAMMALS, 0],
  [/elephant|loxodonta|elephas/i, MAMMALS, 1],
  [/accipiter|aquila|falco|eagle|hawk|owl|strix|buteo/i, BIRDS, 1],
  [/passer|corvus|turdus|bird|avian/i, BIRDS, 0],
  [/papilio|danaus|butterfly|moth|noctua|acherontia/i, INSECTS, 1],
  [/apis|bombus|bee|wasp|vespa/i, INSECTS, 3],
  [/formica|ant|camponotus/i, INSECTS, 2],
  [/coccinella|ladybug|ladybird/i, INSECTS, 5],
  [/arachn|spider|araneus/i, INSECTS, 6],
  [/libellula|dragonfly|anisoptera/i, INSECTS, 4],
  [/acheta|gryllus|cricket|orthoptera|beetle|coleoptera/i, INSECTS, 0],
  [/salmo|tuna|shark|fish|pisc|carassius|cyprinus/i, FISH, 0],
  [/serpent|snake|python|naja|vipera/i, REPTILES, 1],
  [/testudo|turtle|chelonia|tortoise/i, REPTILES, 2],
  [/rana|frog|bufo|toad|amphib/i, REPTILES, 3],
];

function kindFor(item) {
  const tags = item.tags || [];
  if (item.categoryId === "birds") return "bird";
  if (item.categoryId === "flowers") return "flower";
  if (item.categoryId === "trees") return "tree";
  if (item.categoryId === "mushrooms") return "mushroom";
  for (const k of ["bird", "insect", "arachnid", "fish", "reptile", "amphibian", "mammal", "mollusc"]) {
    if (tags.includes(k)) return k;
  }
  return "mammal";
}

function bodyFor(item) {
  const hay = `${item.id} ${item.name} ${(item.tags || []).join(" ")}`;
  for (const [re, variants, prefer] of GENUS_HINTS) {
    if (re.test(hay)) {
      if (typeof prefer === "number" && variants[prefer]) {
        // Mix prefer with neighbors so related genera aren't identical
        const pool = [variants[prefer], variants[(prefer + 1) % variants.length], variants[(prefer + 2) % variants.length]];
        return pick(item.id, pool);
      }
      return pick(item.id, variants);
    }
  }
  const kind = kindFor(item);
  if (kind === "bird") return pick(item.id, BIRDS);
  if (kind === "insect" || kind === "arachnid") return pick(item.id, INSECTS);
  if (kind === "fish" || kind === "mollusc") return pick(item.id, FISH);
  if (kind === "reptile" || kind === "amphibian") return pick(item.id, REPTILES);
  if (kind === "flower") return pick(item.id, FLOWERS);
  if (kind === "tree") return pick(item.id, TREES);
  if (kind === "mushroom") return pick(item.id, MUSHROOMS);
  return pick(item.id, MAMMALS);
}

/** Only rewrite marks that look like the old generic templates (or missing). */
const GENERIC_SNIPPETS = [
  'rx="28" ry="16"', // cricket
  'rx="36" ry="22"', // mammal sheep
  'd="M28 72c8-20 28-36 52-36', // bird
  'd="M16 64c16-24 40-36 64-32', // fish
  'rx="40" ry="22"', // reptile
  'd="M64 40c0-8 6-14 0-22', // flower
  'd="M24 64c0-24 18-44 40-44', // mushroom
  'd="M64 18c-18 0-32 12-34 28', // deciduous tree
  'd="M64 8L40 40h10L36 60', // conifer
];

function isGenericOrMissing(path) {
  if (!existsSync(path)) return true;
  const text = readFileSync(path, "utf8");
  if (text.includes("data:image")) return false; // real photo mark
  if (text.includes("viewBox=\"0 0 24 24\"")) return false;
  return GENERIC_SNIPPETS.some((s) => text.includes(s)) || text.length < 400;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const nature = catalog.items.filter((it) =>
  ["animals", "birds", "flowers", "trees", "mushrooms"].includes(it.categoryId),
);

let wrote = 0;
let skipped = 0;
for (const item of nature) {
  const out = join(marksDir, `${item.id}.svg`);
  if (!isGenericOrMissing(out)) {
    skipped += 1;
    continue;
  }
  writeFileSync(out, svg(bodyFor(item)));
  wrote += 1;
}

console.log(JSON.stringify({ nature: nature.length, wrote, skipped }, null, 2));
