#!/usr/bin/env node
/**
 * Stamp nature marks with recognizable silhouettes per kind:
 * trees, flowers, birds, animals, fungi — mixed by stable id hash +
 * taxonomic / tag cues so the grid isn't one repeated blob.
 *
 * FORCE=1 rewrites every nature mark (default: only generic/missing).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marksDir = join(root, "public", "marks");
const catalogPath = join(root, "public", "data", "catalog.json");
mkdirSync(marksDir, { recursive: true });

const FILL = "#C8C8C8";
const FORCE = process.env.FORCE === "1";

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

/** Recognizable animal silhouettes (side / front profiles). */
const MAMMALS = [
  // sheep / woolly quadruped
  `<ellipse cx="58" cy="70" rx="34" ry="24" fill="${FILL}"/><circle cx="92" cy="58" r="16" fill="${FILL}"/><path fill="${FILL}" d="M40 88v28h12V88M70 88v28h12V88M100 50l10-14M100 62l14-4"/><circle cx="98" cy="54" r="3" fill="#7A7A7A"/>`,
  // bear
  `<ellipse cx="64" cy="72" rx="36" ry="34" fill="${FILL}"/><circle cx="34" cy="42" r="12" fill="${FILL}"/><circle cx="94" cy="42" r="12" fill="${FILL}"/><ellipse cx="64" cy="58" rx="28" ry="24" fill="${FILL}"/><circle cx="52" cy="56" r="4" fill="#7A7A7A"/><circle cx="76" cy="56" r="4" fill="#7A7A7A"/><ellipse cx="64" cy="72" rx="8" ry="6" fill="#7A7A7A"/>`,
  // deer with antlers
  `<path fill="${FILL}" d="M34 18l8 22M46 12l6 28M82 12l-6 28M94 18l-8 22M52 48h24c2 22-4 40-12 48s-14-10-12-48zM48 96v26h12V96M68 96v26h12V96"/><circle cx="58" cy="56" r="3" fill="#7A7A7A"/><circle cx="70" cy="56" r="3" fill="#7A7A7A"/>`,
  // rabbit
  `<path fill="${FILL}" d="M46 8c-6 22-2 40 8 46M82 8c6 22 2 40-8 46"/><ellipse cx="64" cy="74" rx="26" ry="30" fill="${FILL}"/><circle cx="52" cy="66" r="4" fill="#7A7A7A"/><circle cx="76" cy="66" r="4" fill="#7A7A7A"/><ellipse cx="64" cy="86" rx="6" ry="4" fill="#7A7A7A"/>`,
  // cat / feline
  `<path fill="${FILL}" d="M38 30l10 18h32l10-18-14 6-12-14-12 14z"/><ellipse cx="64" cy="72" rx="28" ry="30" fill="${FILL}"/><circle cx="52" cy="66" r="4" fill="#7A7A7A"/><circle cx="76" cy="66" r="4" fill="#7A7A7A"/><path fill="${FILL}" d="M64 74l-6 10h12zM44 100c-10 8-6 20 4 20M84 100c10 8 6 20-4 20"/>`,
  // dog / wolf
  `<path fill="${FILL}" d="M30 44c0-14 10-24 20-24 5 0 8 3 10 6 2-3 5-6 10-6 10 0 20 10 20 24v10H30z"/><ellipse cx="60" cy="78" rx="30" ry="22" fill="${FILL}"/><path fill="${FILL}" d="M42 96l-8 26h14l6-26M74 96l8 26H68l-6-26M88 52l18-6-4 14"/>`,
  // elephant
  `<ellipse cx="58" cy="68" rx="34" ry="28" fill="${FILL}"/><circle cx="92" cy="58" r="20" fill="${FILL}"/><path fill="${FILL}" d="M100 70c8 18 4 36-8 44M40 90v30h14V90M68 90v30h14V90M28 62c-12 4-18 16-12 24"/><circle cx="98" cy="52" r="4" fill="#7A7A7A"/>`,
  // horse
  `<path fill="${FILL}" d="M28 70c4-20 20-34 40-34 8 0 16 2 22 8l18-18 4 10-12 12c6 8 6 20 2 30H40c-8 0-14-4-12-8z"/><path fill="${FILL}" d="M40 86v34h12V86M70 86v34h12V86M100 42c8-4 14 2 10 10"/>`,
];

const BIRDS = [
  // perched songbird side profile
  `<path fill="${FILL}" d="M86 44c-6-14-20-22-36-20-18 2-30 16-28 32 2 14 14 24 30 26 8 1 16-1 22-6l18 14 6-8-14-12c8-6 10-16 2-26z"/><circle cx="48" cy="48" r="4" fill="#7A7A7A"/><path fill="${FILL}" d="M34 52l-14 4 14 2"/>`,
  // eagle / raptor wings open
  `<path fill="${FILL}" d="M64 40c-4 0-8 4-8 10 0 4 2 6 4 8L16 78l8 10 32-16v28h16V72l32 16 8-10-44-20c2-2 4-4 4-8 0-6-4-10-8-10z"/><circle cx="58" cy="48" r="3" fill="#7A7A7A"/>`,
  // owl face
  `<ellipse cx="64" cy="68" rx="30" ry="36" fill="${FILL}"/><circle cx="50" cy="58" r="12" fill="#9A9A9A"/><circle cx="78" cy="58" r="12" fill="#9A9A9A"/><circle cx="50" cy="58" r="5" fill="#4A4A4A"/><circle cx="78" cy="58" r="5" fill="#4A4A4A"/><path fill="${FILL}" d="M64 68l-8 12h16zM44 28l10 18M84 28l-10 18"/>`,
  // flamingo / long-neck wader
  `<path fill="${FILL}" d="M72 18c-2 18 2 34 14 46 10 10 6 28-6 34-8 4-16-2-18-10 10 2 14-6 10-14-8-14-10-30-6-46zM52 90c-6 14 0 28 10 34h14c-6-12-6-24 0-34"/><circle cx="78" cy="24" r="8" fill="${FILL}"/><circle cx="80" cy="22" r="2" fill="#7A7A7A"/>`,
  // duck / waterfowl
  `<ellipse cx="60" cy="72" rx="34" ry="20" fill="${FILL}"/><circle cx="96" cy="60" r="14" fill="${FILL}"/><path fill="${FILL}" d="M104 62l18 4-18 4M40 60c-12-16 0-28 16-20M28 80c8 12 28 16 48 12"/><circle cx="100" cy="56" r="3" fill="#7A7A7A"/>`,
  // hummingbird / small flier
  `<path fill="${FILL}" d="M70 58c-10-4-22-2-30 8-6 8-4 20 6 24 8 4 18 0 24-8l22 18 8-10-18-16c8-4 12-14 8-22-4-6-12-6-20 6z"/><path fill="${FILL}" d="M48 52c-20-8-28-24-18-28 14 8 22 18 22 28"/><circle cx="78" cy="52" r="3" fill="#7A7A7A"/>`,
];

const INSECTS = [
  // beetle / cricket side
  `<ellipse cx="64" cy="74" rx="30" ry="18" fill="${FILL}"/><circle cx="94" cy="66" r="12" fill="${FILL}"/><path fill="${FILL}" d="M40 74c-14 10-22 24-16 32M52 68c-10-18-4-32 8-32M100 60l14-18M100 70l18-6"/><circle cx="98" cy="62" r="2" fill="#7A7A7A"/>`,
  // butterfly
  `<path fill="${FILL}" d="M64 64C40 32 16 28 8 44c16 6 36 16 56 20-24 6-44 18-56 24 10 14 34 8 56-20 24 32 48 36 56 20-16-6-36-16-56-20 24-6 44-18 56-24-10-14-34-8-56 20z"/><rect x="62" y="36" width="4" height="64" rx="2" fill="${FILL}"/>`,
  // ant
  `<circle cx="64" cy="34" r="12" fill="${FILL}"/><ellipse cx="64" cy="56" rx="10" ry="12" fill="${FILL}"/><ellipse cx="64" cy="88" rx="16" ry="22" fill="${FILL}"/><path fill="${FILL}" d="M52 34l-18-14M76 34l18-14M48 56H24M80 56h24M50 78l-18 14M78 78l18 14"/>`,
  // bee
  `<ellipse cx="64" cy="70" rx="28" ry="20" fill="${FILL}"/><path fill="${FILL}" d="M48 60h32v5H48zM48 72h32v5H48zM36 56c-14-18 0-30 14-20M92 56c14-18 0-30-14-20"/><circle cx="88" cy="66" r="8" fill="${FILL}"/>`,
  // dragonfly
  `<path fill="${FILL}" d="M18 56c22-10 40-4 46 10-8 12-26 18-46 10zM110 56c-22-10-40-4-46 10 8 12 26 18 46 10z"/><ellipse cx="64" cy="66" rx="8" ry="30" fill="${FILL}"/><circle cx="64" cy="40" r="8" fill="${FILL}"/>`,
  // ladybug
  `<ellipse cx="64" cy="72" rx="34" ry="28" fill="${FILL}"/><circle cx="64" cy="42" r="14" fill="${FILL}"/><circle cx="50" cy="64" r="6" fill="#7A7A7A"/><circle cx="78" cy="64" r="6" fill="#7A7A7A"/><circle cx="64" cy="84" r="6" fill="#7A7A7A"/><path fill="${FILL}" d="M64 48v48"/>`,
  // spider
  `<circle cx="64" cy="66" r="16" fill="${FILL}"/><circle cx="64" cy="48" r="10" fill="${FILL}"/><path fill="${FILL}" d="M48 56L18 38M48 66H14M48 76L18 94M80 56l30-18M80 66h34M80 76l30 18"/>`,
];

const FISH = [
  `<path fill="${FILL}" d="M14 66c18-28 46-40 74-34 18 4 30 14 34 26H90c0 10-10 18-24 18H46c-14 0-26-4-32-10zM96 48l18-18-6 24"/><circle cx="42" cy="58" r="4" fill="#7A7A7A"/>`,
  `<path fill="${FILL}" d="M12 70c10-30 44-48 78-42 22 4 36 16 40 30H98c-4 14-18 22-34 22H42c-14 0-26-4-30-18zM104 58c10-6 18 0 22 10l-14 4"/><circle cx="40" cy="62" r="4" fill="#7A7A7A"/>`,
  `<path fill="${FILL}" d="M18 64c10-26 40-42 72-36 18 4 30 14 34 26-22-4-40 6-48 18-4 8-2 16 6 20-14 0-28-8-36-18zM100 50c6-10 14-12 18-6"/><circle cx="44" cy="56" r="4" fill="#7A7A7A"/>`,
];

const REPTILES = [
  // lizard
  `<ellipse cx="58" cy="72" rx="38" ry="18" fill="${FILL}"/><circle cx="98" cy="64" r="12" fill="${FILL}"/><path fill="${FILL}" d="M30 86l-14 18M48 92l-6 22M70 92l6 22M88 86l14 18M108 60l12-10"/><circle cx="102" cy="60" r="2" fill="#7A7A7A"/>`,
  // snake S-curve
  `<path fill="${FILL}" d="M22 38c18-18 44-8 52 10 8 18 26 22 42 8-14 22-40 26-56 8-14-14-30-18-42-2zM108 52c10 0 14 10 8 16"/><circle cx="112" cy="56" r="3" fill="#7A7A7A"/>`,
  // turtle
  `<ellipse cx="64" cy="68" rx="40" ry="26" fill="${FILL}"/><circle cx="106" cy="66" r="12" fill="${FILL}"/><path fill="${FILL}" d="M28 58c-14 0-18 14-8 18M70 38c0-14 14-18 18-8M48 42l16 22 16-22"/><circle cx="110" cy="62" r="2" fill="#7A7A7A"/>`,
  // frog
  `<ellipse cx="64" cy="76" rx="34" ry="26" fill="${FILL}"/><circle cx="42" cy="50" r="14" fill="${FILL}"/><circle cx="86" cy="50" r="14" fill="${FILL}"/><circle cx="42" cy="50" r="5" fill="#7A7A7A"/><circle cx="86" cy="50" r="5" fill="#7A7A7A"/><path fill="${FILL}" d="M28 90c-12 8-8 24 6 24M100 90c12 8 8 24-6 24"/>`,
];

/** Flower silhouettes — petals + stem. */
const FLOWERS = [
  // daisy / radial petals
  `<g fill="${FILL}"><ellipse cx="64" cy="28" rx="10" ry="18"/><ellipse cx="64" cy="60" rx="10" ry="18"/><ellipse cx="48" cy="44" rx="18" ry="10"/><ellipse cx="80" cy="44" rx="18" ry="10"/><ellipse cx="52" cy="32" rx="14" ry="10" transform="rotate(-40 52 32)"/><ellipse cx="76" cy="32" rx="14" ry="10" transform="rotate(40 76 32)"/><ellipse cx="52" cy="56" rx="14" ry="10" transform="rotate(40 52 56)"/><ellipse cx="76" cy="56" rx="14" ry="10" transform="rotate(-40 76 56)"/><circle cx="64" cy="44" r="10"/><rect x="60" y="70" width="8" height="48" rx="3"/></g>`,
  // tulip
  `<path fill="${FILL}" d="M64 18c-18 10-26 34-22 52h44c4-18-4-42-22-52zM46 28c10-14 18-14 18-14s8 0 18 14"/><rect x="60" y="70" width="8" height="48" rx="3" fill="${FILL}"/><path fill="${FILL}" d="M64 90c-18 4-28 18-24 28M64 90c18 4 28 18 24 28"/>`,
  // rose / layered bloom
  `<circle cx="64" cy="46" r="26" fill="${FILL}"/><circle cx="64" cy="46" r="16" fill="#9A9A9A"/><circle cx="64" cy="46" r="7" fill="${FILL}"/><path fill="${FILL}" d="M48 28c-10-8-22-4-24 8 10 2 20 8 28 14M80 28c10-8 22-4 24 8-10 2-20 8-28 14"/><rect x="60" y="72" width="8" height="46" rx="3" fill="${FILL}"/><path fill="${FILL}" d="M64 88c-16 6-22 18-16 28M64 92c14 4 22 16 18 26"/>`,
  // orchid / asymmetric
  `<path fill="${FILL}" d="M64 70c-26-10-38-32-28-48 10 14 22 22 28 26 6-4 18-12 28-26 10 16-2 38-28 48z"/><ellipse cx="48" cy="36" rx="14" ry="18" fill="${FILL}"/><ellipse cx="80" cy="36" rx="14" ry="18" fill="${FILL}"/><circle cx="64" cy="52" r="8" fill="${FILL}"/><rect x="60" y="70" width="8" height="48" rx="3" fill="${FILL}"/>`,
  // sunflower
  `<g fill="${FILL}"><ellipse cx="64" cy="18" rx="8" ry="16"/><ellipse cx="64" cy="70" rx="8" ry="16"/><ellipse cx="38" cy="44" rx="16" ry="8"/><ellipse cx="90" cy="44" rx="16" ry="8"/><ellipse cx="46" cy="24" rx="12" ry="8" transform="rotate(-35 46 24)"/><ellipse cx="82" cy="24" rx="12" ry="8" transform="rotate(35 82 24)"/><ellipse cx="46" cy="64" rx="12" ry="8" transform="rotate(35 46 64)"/><ellipse cx="82" cy="64" rx="12" ry="8" transform="rotate(-35 82 64)"/><circle cx="64" cy="44" r="16"/><circle cx="64" cy="44" r="8" fill="#8A8A8A"/><rect x="60" y="76" width="8" height="44" rx="3"/></g>`,
];

/** Tree silhouettes — crown + trunk. */
const TREES = [
  // round deciduous canopy
  `<ellipse cx="64" cy="48" rx="42" ry="36" fill="${FILL}"/><path fill="${FILL}" d="M56 78h16v42H56z"/><path fill="${FILL}" d="M64 88l-22 8 4 6 18-6 18 6 4-6z"/>`,
  // pine / conifer tiers
  `<path fill="${FILL}" d="M64 6L38 40h12L32 64h14L28 92h28v30h16V92h28L82 64h14L78 40h12z"/>`,
  // palm
  `<path fill="${FILL}" d="M64 52c-6-24-28-40-48-40 22 10 38 28 42 44 6-24 28-40 48-40-22 10-38 28-42 44z"/><path fill="${FILL}" d="M58 52h12v68H58z"/><path fill="${FILL}" d="M64 40c-20-4-36 8-40 20M64 36c20-4 36 8 40 20"/>`,
  // oak / irregular canopy
  `<path fill="${FILL}" d="M64 16c-22 0-40 14-42 34-12 2-22 14-22 28 0 16 12 30 30 32v30h16V98c18-2 32-16 32-32 0-14-10-26-22-28-2-20-20-34-42-34z"/>`,
  // birch / slender
  `<ellipse cx="64" cy="44" rx="28" ry="34" fill="${FILL}"/><rect x="58" y="72" width="12" height="48" rx="2" fill="${FILL}"/><path fill="${FILL}" d="M50 40h28M46 56h36" stroke="#8A8A8A" stroke-width="2"/>`,
  // willow / drooping
  `<path fill="${FILL}" d="M64 20c-20 0-36 12-40 30 0 0-4 24 8 36 0-16 8-28 16-34 4 10 4 24 0 40h32c-4-16-4-30 0-40 8 6 16 18 16 34 12-12 8-36 8-36-4-18-20-30-40-30z"/><rect x="58" y="70" width="12" height="50" rx="2" fill="${FILL}"/>`,
];

/** Fungus silhouettes — caps + stems. */
const MUSHROOMS = [
  // classic toadstool
  `<path fill="${FILL}" d="M22 66c0-28 18-50 42-50s42 22 42 50c-10-10-28-14-42-14S32 56 22 66z"/><rect x="56" y="66" width="16" height="46" rx="4" fill="${FILL}"/><circle cx="48" cy="48" r="5" fill="#9A9A9A"/><circle cx="72" cy="42" r="4" fill="#9A9A9A"/><circle cx="84" cy="54" r="3" fill="#9A9A9A"/>`,
  // wide flat oyster / shelf
  `<ellipse cx="64" cy="52" rx="48" ry="24" fill="${FILL}"/><rect x="58" y="52" width="12" height="56" rx="3" fill="${FILL}"/><path fill="${FILL}" d="M40 52c-8 8-8 20 0 28M88 52c8 8 8 20 0 28"/>`,
  // clustered morel-ish
  `<ellipse cx="48" cy="40" rx="16" ry="28" fill="${FILL}"/><ellipse cx="72" cy="36" rx="14" ry="26" fill="${FILL}"/><ellipse cx="64" cy="52" rx="18" ry="22" fill="${FILL}"/><rect x="44" y="68" width="10" height="40" rx="3" fill="${FILL}"/><rect x="60" y="72" width="10" height="36" rx="3" fill="${FILL}"/><rect x="74" y="66" width="10" height="42" rx="3" fill="${FILL}"/>`,
  // chanterelle / funnel
  `<path fill="${FILL}" d="M24 58c8-28 28-44 40-44s32 16 40 44c-12-8-28-12-40-12S36 50 24 58z"/><path fill="${FILL}" d="M52 58h24l8 52H44z"/>`,
];

const GENUS_HINTS = [
  [/felis|panthera|lynx|puma|leopard|tiger|lion|cat|lynx/i, MAMMALS, 4],
  [/canis|vulpes|wolf|fox|dog|coyote|lupus/i, MAMMALS, 5],
  [/ursus|bear|ailuropoda/i, MAMMALS, 1],
  [/cervus|deer|rangifer|alces|moose|odocoileus/i, MAMMALS, 2],
  [/lepus|oryctolagus|rabbit|hare/i, MAMMALS, 3],
  [/ovis|sheep|capra|goat/i, MAMMALS, 0],
  [/equus|horse|zebra/i, MAMMALS, 7],
  [/bos|cow|bison|bubalus/i, MAMMALS, 0],
  [/elephant|loxodonta|elephas/i, MAMMALS, 6],
  [/accipiter|aquila|falco|eagle|hawk|buteo|halaeetus/i, BIRDS, 1],
  [/strix|owl|bubo|tyto|otus/i, BIRDS, 2],
  [/anas|duck|cygnus|swan|anser|goose/i, BIRDS, 4],
  [/phoenicopterus|flamingo/i, BIRDS, 3],
  [/trochil|humming/i, BIRDS, 5],
  [/passer|corvus|turdus|bird|avian|parus|fringilla/i, BIRDS, 0],
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
  [/rosa|rose/i, FLOWERS, 2],
  [/tulipa|tulip/i, FLOWERS, 1],
  [/helianthus|sunflower/i, FLOWERS, 4],
  [/orchid|orchis|phalaenopsis/i, FLOWERS, 3],
  [/pinus|picea|abies|fir|spruce|pine|conifer/i, TREES, 1],
  [/palm|phoenix|cocos|areca/i, TREES, 2],
  [/salix|willow/i, TREES, 5],
  [/quercus|oak/i, TREES, 3],
  [/betula|birch/i, TREES, 4],
  [/amanita|toadstool/i, MUSHROOMS, 0],
  [/pleurotus|oyster/i, MUSHROOMS, 1],
  [/morchella|morel/i, MUSHROOMS, 2],
  [/cantharellus|chanterelle/i, MUSHROOMS, 3],
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
        const pool = [
          variants[prefer],
          variants[(prefer + 1) % variants.length],
          variants[(prefer + 2) % variants.length],
        ];
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

const GENERIC_SNIPPETS = [
  'rx="28" ry="16"',
  'rx="36" ry="22"',
  'd="M28 72c8-20 28-36 52-36',
  'd="M16 64c16-24 40-36 64-32',
  'rx="40" ry="22"',
  'd="M64 40c0-8 6-14 0-22',
  'd="M24 64c0-24 18-44 40-44',
  'd="M64 18c-18 0-32 12-34 28',
  'd="M64 8L40 40h10L36 60',
  'fill="#C4C4C4"', // prior stamp fill
];

function isGenericOrMissing(path) {
  if (!existsSync(path)) return true;
  if (FORCE) return true;
  const text = readFileSync(path, "utf8");
  if (text.includes("data:image")) return false;
  if (text.includes('viewBox="0 0 24 24"')) return false;
  return GENERIC_SNIPPETS.some((s) => text.includes(s)) || text.length < 400;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const nature = catalog.items.filter((it) =>
  ["animals", "birds", "flowers", "trees", "mushrooms"].includes(it.categoryId),
);

let wrote = 0;
let skipped = 0;
const samples = { trees: [], flowers: [], birds: [], animals: [], mushrooms: [] };

for (const item of nature) {
  const out = join(marksDir, `${item.id}.svg`);
  if (!isGenericOrMissing(out)) {
    skipped += 1;
    continue;
  }
  const body = bodyFor(item);
  writeFileSync(out, svg(body));
  wrote += 1;
  const bucket = samples[item.categoryId];
  if (bucket && bucket.length < 4) bucket.push(item.id);
}

console.log(JSON.stringify({ nature: nature.length, wrote, skipped, force: FORCE, samples }, null, 2));
