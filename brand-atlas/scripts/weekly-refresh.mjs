#!/usr/bin/env node
/**
 * Weekly catalogue refresh — schedules add / modify / remove mutations.
 * Designed to run via GitHub Actions every Monday (or `npm run refresh` locally).
 *
 * Strategy:
 * 1. Load current catalog + changelog
 * 2. Propose a small set of mutations (rotate obscure items, tweak summaries, add newcomers)
 * 3. Write pending changes, then regenerate catalog to apply them
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "public", "data");
const catalogFile = join(dataDir, "catalog.json");
const changelogFile = join(dataDir, "changelog.json");

/** Rotating pool of candidate add-ons (not always in the seed). */
const ROTATION_POOL = [
  {
    categoryId: "cars",
    slug: "rivian",
    name: "Rivian",
    origin: "USA",
    tags: ["ev"],
    summary: "Rivian — American electric adventure vehicles.",
  },
  {
    categoryId: "cars",
    slug: "lucid",
    name: "Lucid",
    origin: "USA",
    tags: ["ev"],
    summary: "Lucid — luxury EV maker.",
  },
  {
    categoryId: "beer",
    slug: "brewdog",
    name: "BrewDog",
    origin: "Scotland",
    summary: "BrewDog — craft brewery from Ellon.",
  },
  {
    categoryId: "coffee",
    slug: "blank-street",
    name: "Blank Street",
    origin: "USA",
    summary: "Blank Street — compact coffee shops.",
  },
  {
    categoryId: "clothes",
    slug: "arc-teryx",
    name: "Arc'teryx",
    aliases: ["arcteryx"],
    origin: "Canada",
    summary: "Arc'teryx — technical outdoor apparel.",
  },
  {
    categoryId: "flowers",
    slug: "protea-king",
    name: "King protea",
    aliases: ["protea cynaroides"],
    origin: "South Africa",
    summary: "King protea — South Africa's national flower.",
  },
  {
    categoryId: "animals",
    slug: "axolotl",
    name: "Axolotl",
    aliases: ["mexican walking fish"],
    summary: "Axolotl — neotenic salamander still kept and studied.",
  },
  {
    categoryId: "sake",
    slug: "isoijiman",
    name: "Isojiman",
    aliases: ["磯自慢"],
    origin: "Japan",
    summary: "Isojiman — Shizuoka sake brewery.",
  },
  {
    categoryId: "luxury",
    slug: "richard-mille",
    name: "Richard Mille",
    origin: "Switzerland",
    summary: "Richard Mille — ultra-modern haute horology.",
  },
  {
    categoryId: "food",
    slug: "beyond-meat",
    name: "Beyond Meat",
    origin: "USA",
    summary: "Beyond Meat — plant-based packaged foods.",
  },
  {
    categoryId: "tea",
    slug: "harada",
    name: "Harada Tea",
    origin: "Japan",
    summary: "Harada — Shizuoka tea estate brand.",
  },
  {
    categoryId: "trees",
    slug: "dragon-blood",
    name: "Dragon blood tree",
    aliases: ["dracaena cinnabari"],
    origin: "Socotra",
    summary: "Dragon blood tree — umbrella-shaped Socotra endemic.",
  },
];

function weekSeed(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.floor((d.getTime() - start) / (7 * 24 * 3600 * 1000));
  return d.getUTCFullYear() * 100 + week;
}

function pick(arr, n, seed) {
  const copy = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

if (!existsSync(catalogFile)) {
  spawnSync("node", [join(__dirname, "generate-catalog.mjs")], { stdio: "inherit" });
}

const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
const changelog = existsSync(changelogFile)
  ? JSON.parse(readFileSync(changelogFile, "utf8"))
  : { appliedAt: null, applied: [], pending: [], history: [] };

const seed = weekSeed();
const active = catalog.items.filter((it) => it.status !== "removed");
const existingSlugs = new Set(active.map((it) => `${it.categoryId}__${it.slug}`));

const pending = [];

// ADD: up to 2 rotation items not already present
const addCandidates = ROTATION_POOL.filter((c) => !existingSlugs.has(`${c.categoryId}__${c.slug}`));
for (const cand of pick(addCandidates, 2, seed)) {
  pending.push({
    op: "add",
    item: {
      id: `${cand.categoryId}__${cand.slug}`,
      slug: cand.slug,
      name: cand.name,
      aliases: cand.aliases ?? [],
      categoryId: cand.categoryId,
      origin: cand.origin ?? null,
      tags: cand.tags ?? [],
      summary: cand.summary,
      facts: {
        origin: cand.origin ?? "Worldwide",
        story: cand.summary,
      },
      coverHue: (seed + cand.slug.length * 17) % 360,
      sort: 9999,
      status: "active",
    },
  });
}

// MODIFY: refresh summaries on 3 random items
for (const item of pick(active, 3, seed + 7)) {
  pending.push({
    op: "modify",
    id: item.id,
    patch: {
      summary: `${item.name} — refreshed ${new Date().toISOString().slice(0, 10)}. Still present in the living catalogue.`,
    },
  });
}

// REMOVE: soft-remove up to 1 rotation item that was previously added (never core seed)
const rotationIds = new Set(ROTATION_POOL.map((c) => `${c.categoryId}__${c.slug}`));
const removable = active.filter((it) => rotationIds.has(it.id));
for (const item of pick(removable, 1, seed + 13)) {
  // Don't remove something we just added in this same batch
  if (pending.some((p) => p.op === "add" && p.item.id === item.id)) continue;
  pending.push({ op: "remove", id: item.id, reason: "weekly rotation" });
}

changelog.pending = [...(changelog.pending ?? []), ...pending];
changelog.scheduledAt = new Date().toISOString();
changelog.weekSeed = seed;

writeFileSync(changelogFile, JSON.stringify(changelog, null, 2) + "\n");
console.log(`Queued ${pending.length} weekly mutations (seed ${seed}).`);

const gen = spawnSync("node", [join(__dirname, "generate-catalog.mjs")], { stdio: "inherit" });
process.exit(gen.status ?? 0);
