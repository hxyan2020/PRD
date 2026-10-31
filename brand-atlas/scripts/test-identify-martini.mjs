/**
 * Unit-test identify scoring against Martini-like OCR (no browser OCR needed).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Load compiled scoring via dynamic import of TS through vite-node alternative:
// Inline the same heuristics by importing from built bundle is hard; instead
// transpile lightly by spawning tsc output. Use node --experimental-strip-types if available.

const catalog = JSON.parse(
  readFileSync(new URL("../public/data/catalog.json", import.meta.url), "utf8"),
);

const OCR =
  "MARTINI L APERITIVO DAL 1863 EXTRA DRY VERMOUTH SOPHISTICATED & BRIGHT WITH ESSENCES OF ORRIS RASPBERRY AND CITRUS";

async function loadScore() {
  try {
    // Node 22+ strip types
    const mod = await import(pathToFileURL(new URL("../src/lib/identify.ts", import.meta.url).pathname).href);
    return mod.scoreAgainstText;
  } catch (e) {
    // Fallback: evaluate exported function by spawning tsc to tmp — use require of a tiny duplicate
    throw e;
  }
}

const scoreAgainstText = await loadScore();

const martini = catalog.items.find((i) => i.id === "liquor__martini");
assert.ok(martini, "Martini must exist in catalogue");

const scored = catalog.items
  .filter((i) => i.status !== "removed")
  .map((item) => ({ item, score: scoreAgainstText(item, OCR) }))
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score);

const top = scored.slice(0, 8).map((s) => ({
  id: s.item.id,
  name: s.item.name,
  cat: s.item.categoryId,
  score: Number(s.score.toFixed(3)),
}));
console.log("top", top);

assert.equal(scored[0].item.id, "liquor__martini");
assert.ok(scored[0].score >= 0.9, `Martini score too low: ${scored[0].score}`);

const bad = [
  "cars__mg",
  "cars__dr-automobiles",
  "cars__ree-automotive",
  "cigarettes__ms",
  "cigarettes__petr-i",
  "tech__raspberry-pi",
  "instruments__martin",
];
for (const id of bad) {
  const row = scored.find((s) => s.item.id === id);
  assert.ok(
    !row || row.score < scored[0].score * 0.55,
    `${id} should not compete with Martini (score=${row?.score})`,
  );
}

// Simulate the post-score category demotion used in identifyImage
const alcoholHint = /vermouth|aperitivo|gin|whisky|whiskey|vodka|rum|tequila|liqueur|beer|wine|sake/i.test(OCR);
const demoted = scored
  .map((s) => ({
    ...s,
    score:
      alcoholHint && s.item.categoryId !== "alcohol" && s.score > 0 && s.score < 1
        ? s.score * 0.4
        : s.score,
  }))
  .sort((a, b) => b.score - a.score);

assert.equal(demoted[0].item.id, "liquor__martini");
assert.ok(demoted[0].score >= 0.9);
const strong = demoted.filter((s) => s.score >= 0.45);
assert.ok(strong.length >= 1);
assert.ok(
  strong.every((s) => s.item.categoryId === "alcohol"),
  "strong demoted guesses must be alcohol when vermouth cues are present",
);
assert.ok(
  !demoted
    .slice(0, 5)
    .some((s) => ["cars", "cigarettes"].includes(s.item.categoryId)),
  "cars/cigarettes must not appear in top demoted guesses",
);

console.log("ok: Martini leads OCR match; car/cigarette noise suppressed");
