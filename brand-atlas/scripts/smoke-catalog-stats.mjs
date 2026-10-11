#!/usr/bin/env node
/**
 * Smoke: merging a contribution / pack bumps category itemCount and meta.itemCount.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "public/data/catalog.json"), "utf8"));

function merge(baseCatalog, extraItems) {
  const byId = new Map(baseCatalog.items.map((i) => [i.id, i]));
  for (const item of extraItems) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  const items = [...byId.values()];
  const categories = baseCatalog.categories.map((cat) => ({
    ...cat,
    itemCount: items.filter((i) => i.categoryId === cat.id && i.status !== "removed").length,
  }));
  return {
    ...baseCatalog,
    categories,
    items,
    meta: {
      ...baseCatalog.meta,
      itemCount: items.filter((i) => i.status !== "removed").length,
    },
  };
}

const food = base.categories.find((c) => c.id === "food");
if (!food) {
  console.error("FAIL: no food category");
  process.exit(1);
}
const beforeFood = food.itemCount;
const beforeTotal = base.meta.itemCount;

const fake = {
  id: "food__smoke-stats-brand",
  slug: "smoke-stats-brand",
  name: "Smoke Stats Brand",
  aliases: [],
  categoryId: "food",
  origin: "Testland",
  tags: ["user-contribution"],
  summary: "stats smoke",
  facts: {},
  coverHue: 12,
  mark: null,
  cover: null,
  markIcon: null,
  sort: 9999,
  status: "active",
};

const merged = merge(base, [fake]);
const afterFood = merged.categories.find((c) => c.id === "food").itemCount;
const afterTotal = merged.meta.itemCount;

console.log({ beforeFood, afterFood, beforeTotal, afterTotal });

if (afterFood !== beforeFood + 1) {
  console.error("FAIL: food itemCount did not increment");
  process.exit(1);
}
if (afterTotal !== beforeTotal + 1) {
  console.error("FAIL: meta.itemCount did not increment");
  process.exit(1);
}
if (!merged.items.some((i) => i.id === fake.id)) {
  console.error("FAIL: merged items missing contribution");
  process.exit(1);
}
console.log("OK catalog stats smoke");
