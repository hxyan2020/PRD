/**
 * Assembles public/data/content-i18n.json from scripts/content-i18n-data/.
 *
 * English collection.json remains the source of truth; this overlay supplies
 * translated archetypes, curated seed text, categories, countries, and
 * civilizations for every non-en locale in src/i18n/languages.ts.
 *
 * Run: node scripts/generate-content-i18n.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "content-i18n-data");
const outPath = join(__dirname, "../public/data/content-i18n.json");

const LOCALES = [
  "zh-Hans",
  "zh-Hant",
  "es",
  "hi",
  "ar",
  "fr",
  "pt",
  "ru",
  "ja",
  "de",
  "ko",
  "it",
  "tr",
  "vi",
  "th",
  "id",
  "nl",
  "pl",
  "sv",
  "el",
  "he",
  "uk",
  "fa",
  "bn",
  "sw",
  "la",
  "grc",
  "sa",
  "egy",
  "akk",
  "non",
];

function loadJson(name) {
  const p = join(dataDir, name);
  if (!existsSync(p)) throw new Error(`Missing ${p}`);
  return JSON.parse(readFileSync(p, "utf8"));
}

const enArch = loadJson("archetypes-en.json");
const enCur = loadJson("curated-en.json");
const archI18n = loadJson("archetypes-i18n.json");
const curI18n = loadJson("curated-i18n.json");
const categories = loadJson("categories.json");
const countries = loadJson("countries.json");
const civilizations = loadJson("civilizations.json");

const archKeys = Object.keys(enArch);
const curIds = Object.keys(enCur);

/** @type {Record<string, unknown>} */
const locales = {};

for (const loc of LOCALES) {
  if (!archI18n[loc]) throw new Error(`Missing archetypes for ${loc}`);
  if (!curI18n[loc]) throw new Error(`Missing curated for ${loc}`);
  if (!categories[loc]) throw new Error(`Missing categories for ${loc}`);
  if (!countries[loc]) throw new Error(`Missing countries for ${loc}`);
  if (!civilizations[loc]) throw new Error(`Missing civilizations for ${loc}`);

  for (const key of archKeys) {
    const a = archI18n[loc][key];
    if (!a?.title || !a?.descTemplate || !a?.steps?.length || !a?.req?.length || !a?.participants) {
      throw new Error(`Incomplete archetype ${key} in ${loc}`);
    }
    if (!a.descTemplate.includes("{country}") || !a.descTemplate.includes("{civ}")) {
      throw new Error(`Archetype ${key} in ${loc} missing placeholders`);
    }
    if (a.descTemplate === enArch[key].descTemplate) {
      throw new Error(`English-copy archetype desc ${key} in ${loc}`);
    }
  }

  for (const id of curIds) {
    const c = curI18n[loc][id];
    if (!c?.description || !c?.howToPlay?.length || !c?.requirements?.length || !c?.idealParticipants) {
      throw new Error(`Incomplete curated ${id} in ${loc}`);
    }
    if (c.description === enCur[id].description) {
      throw new Error(`English-copy curated ${id} in ${loc}`);
    }
  }

  // Strip helper-only fields from curated entries for the public artifact
  /** @type {Record<string, unknown>} */
  const curated = {};
  for (const id of curIds) {
    const c = curI18n[loc][id];
    /** @type {Record<string, unknown>} */
    const entry = {
      description: c.description,
      howToPlay: c.howToPlay,
      requirements: c.requirements,
      idealParticipants: c.idealParticipants,
    };
    if (c.name) entry.name = c.name;
    if (c.variationNotes?.length) entry.variationNotes = c.variationNotes;
    curated[id] = entry;
  }

  locales[loc] = {
    archetypes: archI18n[loc],
    curated,
    categories: categories[loc],
    countries: countries[loc],
    civilizations: civilizations[loc],
  };
}

const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    locales: LOCALES,
    archetypeKeys: archKeys,
    curatedIds: curIds,
    categoryCount: Object.keys(categories[LOCALES[0]]).length,
    countryCount: Object.keys(countries[LOCALES[0]]).length,
    civilizationCount: Object.keys(civilizations[LOCALES[0]]).length,
  },
  locales,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload));
const bytes = Buffer.byteLength(JSON.stringify(payload));
console.log(
  `Wrote content-i18n.json (${(bytes / 1024 / 1024).toFixed(2)} MiB) — ` +
    `${LOCALES.length} locales, ${archKeys.length} archetypes, ${curIds.length} curated ids → ${outPath}`,
);
