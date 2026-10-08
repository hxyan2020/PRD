#!/usr/bin/env node
/**
 * Headless smoke: discover Chinese car brands via Wikipedia and assert new candidates.
 * Run: node scripts/smoke-resource-pack.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  readFileSync(join(root, "public/data/catalog.json"), "utf8"),
);

const WIKI = "https://en.wikipedia.org/w/api.php";

async function wiki(params) {
  const url = new URL(WIKI);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`wiki ${res.status}`);
  return res.json();
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const existing = new Set();
for (const it of catalog.items.filter((i) => i.categoryId === "cars")) {
  existing.add(it.name.toLowerCase());
  existing.add(it.slug.toLowerCase());
}

const os = await wiki({
  action: "opensearch",
  search: "List of Chinese automobile manufacturers",
  limit: "3",
});
const title = os[1][0];
const parsed = await wiki({
  action: "parse",
  page: title,
  prop: "wikitext",
  redirects: "1",
});
const wt = parsed.parse.wikitext["*"];
const links = [...wt.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1]);
const skip =
  /^(list of|category:|file:|china|japan|state-owned|administration|commission|automotive industry)/i;
const brands = [];
const seen = new Set();
for (const raw of links) {
  let name = raw.replace(/\s+\((automobile|marque|automobiles|company)\)$/i, "").trim();
  if (!name || skip.test(name) || name.length > 48) continue;
  const key = name.toLowerCase();
  const slug = slugify(name);
  if (seen.has(key) || existing.has(key) || existing.has(slug)) continue;
  seen.add(key);
  brands.push(name);
  if (brands.length >= 12) break;
}

console.log("page", parsed.parse.title);
console.log("new candidates", brands.length, brands);
if (brands.length < 5) {
  console.error("FAIL: expected several new Chinese car brands");
  process.exit(1);
}
console.log("OK resource-pack discovery smoke");
