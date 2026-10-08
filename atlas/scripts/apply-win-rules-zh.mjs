/**
 * Patch zh-Hans / zh-Hant howToWin + rulesNotToBreak overlays from curated maps.
 *
 * Run: node scripts/apply-win-rules-zh.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "content-i18n-data");

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8"));
}

function save(name, data) {
  writeFileSync(join(dataDir, name), JSON.stringify(data, null, 2) + "\n");
}

/** @param {string} s */
function looksLatinOnly(s) {
  const t = String(s ?? "").trim();
  if (!t) return true;
  const hasCjk = /[\u3400-\u9FFF\uF900-\uFAFF]/.test(t);
  if (hasCjk) return false;
  return /[A-Za-z]{3,}/.test(t);
}

const curatedEn = load("curated-en.json");
const archetypesEn = load("archetypes-en.json");
const curatedI18n = load("curated-i18n.json");
const archetypesI18n = load("archetypes-i18n.json");
const mapHans = load("win-rules-zh-Hans.json");
const mapHant = load("win-rules-zh-Hant.json");

const maps = {
  "zh-Hans": mapHans,
  "zh-Hant": mapHant,
};

/** @type {string[]} */
const missingKeys = [];
let translated = 0;

/**
 * @param {Record<string, any>} enSrc
 * @param {Record<string, any>} localeBucket
 * @param {Record<string, string>} map
 * @param {string} locale
 */
function patchLocale(enSrc, localeBucket, map, locale) {
  for (const [id, enEntry] of Object.entries(enSrc)) {
    const dest = localeBucket[id];
    if (!dest || typeof dest !== "object") continue;

    for (const field of ["howToWin", "rulesNotToBreak"]) {
      const enArr = Array.isArray(enEntry?.[field]) ? enEntry[field] : null;
      if (!enArr) continue;

      dest[field] = enArr.map((en) => {
        const zh = map[en];
        if (zh == null) {
          missingKeys.push(`${locale} ${id}.${field}: ${en}`);
          return en;
        }
        translated += 1;
        return zh;
      });
    }
  }
}

for (const locale of ["zh-Hans", "zh-Hant"]) {
  const map = maps[locale];
  if (!curatedI18n[locale]) curatedI18n[locale] = {};
  if (!archetypesI18n[locale]) archetypesI18n[locale] = {};
  patchLocale(curatedEn, curatedI18n[locale], map, locale);
  patchLocale(archetypesEn, archetypesI18n[locale], map, locale);
}

save("curated-i18n.json", curatedI18n);
save("archetypes-i18n.json", archetypesI18n);

let latinLeft = 0;
/** @type {string[]} */
const latinSamples = [];

for (const [label, i18n] of [
  ["curated", curatedI18n],
  ["archetypes", archetypesI18n],
]) {
  for (const locale of ["zh-Hans", "zh-Hant"]) {
    const bucket = i18n[locale] ?? {};
    for (const [id, entry] of Object.entries(bucket)) {
      for (const field of ["howToWin", "rulesNotToBreak"]) {
        for (const s of entry?.[field] ?? []) {
          if (looksLatinOnly(s)) {
            latinLeft += 1;
            if (latinSamples.length < 20) {
              latinSamples.push(`${label} ${locale} ${id}.${field}: ${s}`);
            }
          }
        }
      }
    }
  }
}

console.log(`Translated array slots: ${translated}`);
console.log(`Missing map keys: ${missingKeys.length}`);
if (missingKeys.length) {
  for (const m of missingKeys.slice(0, 20)) console.log("  MISSING", m);
}
console.log(`Latin-only leftover count: ${latinLeft}`);
if (latinSamples.length) {
  for (const s of latinSamples) console.log("  LATIN", s);
}
