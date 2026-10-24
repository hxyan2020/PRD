/**
 * Assembles civilizations.json from per-locale maps in this directory.
 * node scripts/content-i18n-data/_civ/gen.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const KEYS = JSON.parse(readFileSync(join(dir, "keys.json"), "utf8"));
const LOCALES = [
  "zh-Hans", "zh-Hant", "es", "hi", "ar", "fr", "pt", "ru", "ja", "de", "ko",
  "it", "tr", "vi", "th", "id", "nl", "pl", "sv", "el", "he", "uk", "fa", "bn",
  "sw", "la", "grc", "sa", "egy", "akk", "non",
];

const out = {};
for (const loc of LOCALES) {
  const p = join(dir, `${loc}.json`);
  const map = JSON.parse(readFileSync(p, "utf8"));
  const missing = KEYS.filter((k) => !map[k] || map[k] === k);
  // Allow same-as-English only for proper ethnonyms that are identical (rare);
  // require every key present and non-empty, and differ from English unless ethnonym.
  const absent = KEYS.filter((k) => map[k] == null || String(map[k]).trim() === "");
  if (absent.length) {
    throw new Error(`${loc}: missing ${absent.length} keys, e.g. ${absent.slice(0, 5).join("; ")}`);
  }
  // Prefer real translations: flag English copies except short shared ethnonyms
  const englishCopies = KEYS.filter((k) => map[k] === k);
  if (englishCopies.length > 40) {
    console.warn(`${loc}: ${englishCopies.length} keys identical to English`);
  }
  out[loc] = Object.fromEntries(KEYS.map((k) => [k, map[k]]));
}

const dest = join(dir, "../civilizations.json");
writeFileSync(dest, JSON.stringify(out));
console.log(`Wrote ${dest} (${LOCALES.length} locales × ${KEYS.length} civilizations)`);
