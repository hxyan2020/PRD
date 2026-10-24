/**
 * Point catalog.json cover fields at any public/covers/{id}.jpg that exists.
 * Does not regenerate the catalogue (avoids wiping the rich resource pack).
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const coversDir = join(root, "public", "covers");
const catalogPath = join(root, "public", "data", "catalog.json");

const coverFiles = new Set(
  readdirSync(coversDir)
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
    .map((n) => n.replace(/\.(jpe?g|png|webp)$/i, "")),
);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let wired = 0;
let cleared = 0;
for (const item of catalog.items) {
  const hasFile = coverFiles.has(item.id);
  if (hasFile) {
    const next = `covers/${item.id}.jpg`;
    if (item.cover !== next) {
      item.cover = next;
      wired += 1;
    }
  } else if (
    item.cover &&
    String(item.cover).startsWith(`covers/${item.id}`) &&
    !String(item.cover).startsWith("http")
  ) {
    // Drop broken local paths; keep remote Wikipedia/https covers.
    item.cover = null;
    cleared += 1;
  }
}

writeFileSync(catalogPath, JSON.stringify(catalog));
console.log(
  JSON.stringify(
    {
      coverFiles: coverFiles.size,
      wired,
      cleared,
      items: catalog.items.length,
    },
    null,
    2,
  ),
);
