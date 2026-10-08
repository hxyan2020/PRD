/**
 * Apply howToPlay (curated) and steps (archetypes) translations from
 * content-i18n-data/howto-steps-patches.json.
 *
 * Does NOT touch zh-Hans / zh-Hant.
 *
 * Usage: node atlas/scripts/patch-howto-steps-i18n.mjs
 * Then:  node atlas/scripts/generate-content-i18n.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "content-i18n-data");

const SKIP = new Set(["zh-Hans", "zh-Hant"]);

function prettyWrite(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function main() {
  const patchesPath = join(dataDir, "howto-steps-patches.json");
  const curatedPath = join(dataDir, "curated-i18n.json");
  const archPath = join(dataDir, "archetypes-i18n.json");
  const curatedEn = JSON.parse(readFileSync(join(dataDir, "curated-en.json"), "utf8"));
  const archEn = JSON.parse(readFileSync(join(dataDir, "archetypes-en.json"), "utf8"));

  const patches = JSON.parse(readFileSync(patchesPath, "utf8"));
  const curated = JSON.parse(readFileSync(curatedPath, "utf8"));
  const arch = JSON.parse(readFileSync(archPath, "utf8"));

  const stats = {};

  for (const [locale, pack] of Object.entries(patches)) {
    if (SKIP.has(locale)) continue;
    stats[locale] = { curatedSteps: 0, curatedGames: 0, archetypeSteps: 0, archetypeIds: 0, missing: [] };

    const curatedBucket = curated[locale];
    if (curatedBucket && pack.curated) {
      for (const [id, steps] of Object.entries(pack.curated)) {
        const entry = curatedBucket[id];
        if (!entry) {
          stats[locale].missing.push(`curated ${id}`);
          continue;
        }
        const enSteps = curatedEn[id]?.howToPlay || [];
        if (steps.length !== enSteps.length) {
          stats[locale].missing.push(
            `curated ${id} length ${steps.length} vs en ${enSteps.length}`,
          );
        }
        const prev = Array.isArray(entry.howToPlay) ? entry.howToPlay : [];
        let changed = 0;
        for (let i = 0; i < steps.length; i++) {
          if (prev[i] !== steps[i]) changed++;
        }
        if (changed || prev.length !== steps.length) {
          entry.howToPlay = [...steps];
          stats[locale].curatedSteps += changed || steps.length;
          stats[locale].curatedGames += 1;
          if (entry.fallbackEn === true) delete entry.fallbackEn;
        }
      }
    }

    const archBucket = arch[locale];
    if (archBucket && pack.archetypes) {
      for (const [id, steps] of Object.entries(pack.archetypes)) {
        const entry = archBucket[id];
        if (!entry) {
          stats[locale].missing.push(`archetype ${id}`);
          continue;
        }
        const enSteps = archEn[id]?.steps || [];
        for (const s of steps) {
          for (const ph of ["{country}", "{civ}"]) {
            if (enSteps.some((e) => e.includes(ph)) && steps.some((t, i) => enSteps[i]?.includes(ph) && !t.includes(ph))) {
              stats[locale].missing.push(`archetype ${id} lost ${ph}`);
            }
          }
        }
        // Validate placeholders per step
        for (let i = 0; i < steps.length; i++) {
          const en = enSteps[i] || "";
          for (const ph of ["{country}", "{civ}"]) {
            if (en.includes(ph) && !steps[i].includes(ph)) {
              stats[locale].missing.push(`archetype ${id}[${i}] lost ${ph}`);
            }
          }
        }
        const before = JSON.stringify(entry.steps || []);
        entry.steps = [...steps];
        if (before !== JSON.stringify(entry.steps)) {
          stats[locale].archetypeSteps += steps.length;
          stats[locale].archetypeIds += 1;
          if (entry.fallbackEn === true) delete entry.fallbackEn;
        }
      }
    }
  }

  prettyWrite(curatedPath, curated);
  prettyWrite(archPath, arch);

  console.log(JSON.stringify({ applied: stats }, null, 2));
}

main();
