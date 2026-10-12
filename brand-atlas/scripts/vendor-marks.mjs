#!/usr/bin/env node
/** Download Simple Icons brand SVGs into public/marks/ (grey fill). */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MARK_ICONS } from "./mark-icons.mjs";

const marksDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "marks");
mkdirSync(marksDir, { recursive: true });

let ok = 0;
const fail = [];
for (const [itemId, slug] of Object.entries(MARK_ICONS)) {
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      fail.push([itemId, slug, res.status]);
      continue;
    }
    let svg = await res.text();
    svg = svg.replace(/fill="[^"]*"/g, 'fill="#9A9A9A"');
    if (!/fill=/.test(svg)) svg = svg.replace(/<path /g, '<path fill="#9A9A9A" ');
    writeFileSync(join(marksDir, `${itemId}.svg`), svg);
    ok += 1;
  } catch (e) {
    fail.push([itemId, slug, String(e.message || e)]);
  }
}
console.log(`Vendored ${ok} brand marks; ${fail.length} missing from Simple Icons.`);
if (fail.length) console.log(fail);
