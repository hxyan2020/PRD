/**
 * Salvage truncated / spammy catalog translations in content-i18n-data.
 * - Prefer last complete sentence when the rest is cut mid-clause
 * - Fall back to English (flagged) when salvage is too short or spammy
 *
 * Run: node scripts/repair-incomplete-i18n.mjs
 * Then: node scripts/generate-content-i18n.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "content-i18n-data");

const TERMINATOR = /[.!?…。！？۔؟।॥]/u;

function looksIncomplete(text) {
  const s = String(text ?? "").trim();
  if (!s) return true;
  if (/[,;:，、；：—–-]\s*$/u.test(s)) return true;
  if (/[:：]\s*$/u.test(s) && s.length < 40) return true;
  if (/\(\s*$/u.test(s)) return true;
  if (/(\b\w+\b)(?:\s+\1){3,}/iu.test(s)) return true;
  if (/(.)\1{8,}/u.test(s)) return true;
  if (/(?:\s*,\s*){4,}/u.test(s)) return true;
  if (/(?:\.\s*){6,}/u.test(s)) return true;
  if (/(?:[-–—]\s*){4,}/u.test(s)) return true;
  if (/([\u4e00-\u9fff])(?:\s*\1){6,}/u.test(s)) return true;
  if (
    /\b(the|a|an|and|of|to|in|for|with|from|as|by|or|that|which|their|its|de|la|le|el|y|et|und|der|die|das)\s*$/iu.test(
      s,
    )
  ) {
    return true;
  }
  if (/[\u0600-\u06FF]/.test(s) && s.length > 80 && !/[.!?…۔؟]$/u.test(s)) {
    return true;
  }
  if (s.length > 90 && !TERMINATOR.test(s.slice(-3)) && !TERMINATOR.test(s)) {
    return true;
  }
  // Absurd length vs typical requirement/title fields
  if (s.length > 400 && /(?:\b\w+\b\s+){20,}/u.test(s) && /(\b\w+\b)(?:\s+\1){2,}/iu.test(s)) {
    return true;
  }
  return false;
}

function lastCompleteSentences(text) {
  const s = String(text ?? "").trim();
  let last = -1;
  for (let i = 0; i < s.length; i++) {
    if (TERMINATOR.test(s[i])) last = i;
  }
  if (last < 0) return "";
  return s.slice(0, last + 1).trim();
}

function normalizePlaceholders(text) {
  return String(text ?? "")
    .replace(/ZZCOUNTRYZ/g, "{country}")
    .replace(/ZZCIVZ/g, "{civ}")
    .replace(/\{COUNTRY\}/g, "{country}")
    .replace(/\{CIV\}/g, "{civ}");
}

function repairString(localized, english, { requirePlaceholders = false } = {}) {
  let loc = normalizePlaceholders(String(localized ?? "").trim());
  const en = String(english ?? "").trim();
  const hasPlaceholders = (s) =>
    !requirePlaceholders || (s.includes("{country}") && s.includes("{civ}"));
  if (!en) return { text: loc, fallbackEn: false, changed: loc !== String(localized ?? "").trim() };
  if (!loc || !hasPlaceholders(loc)) {
    return { text: en, fallbackEn: true, changed: loc !== en };
  }
  if (!looksIncomplete(loc)) {
    const changed = loc !== String(localized ?? "").trim();
    return { text: loc, fallbackEn: false, changed };
  }
  const salvaged = lastCompleteSentences(loc);
  if (
    salvaged &&
    hasPlaceholders(salvaged) &&
    !looksIncomplete(salvaged) &&
    salvaged.length >= Math.min(24, Math.floor(en.length * 0.35))
  ) {
    return {
      text: salvaged,
      fallbackEn: false,
      changed: salvaged !== String(localized ?? "").trim(),
    };
  }
  return { text: en, fallbackEn: true, changed: true };
}

function applyRepair(entry, field, localized, english, stats, bucket) {
  const r = repairString(localized, english, {
    requirePlaceholders: field === "descTemplate",
  });
  if (r.changed) {
    stats[bucket]++;
    if (r.fallbackEn) {
      entry.fallbackEn = true;
      stats.fallbacks++;
    }
  }
  return r.text;
}

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8"));
}

function save(name, data) {
  writeFileSync(join(dataDir, name), JSON.stringify(data, null, 2) + "\n");
}

const enCur = load("curated-en.json");
const enArch = load("archetypes-en.json");
const curI18n = load("curated-i18n.json");
const archI18n = load("archetypes-i18n.json");

const stats = { curated: 0, archetypes: 0, fallbacks: 0 };

for (const [, pack] of Object.entries(curI18n)) {
  for (const [id, entry] of Object.entries(pack)) {
    const en = enCur[id];
    if (!en) continue;

    entry.description = applyRepair(
      entry,
      "description",
      entry.description,
      en.description,
      stats,
      "curated",
    );

    if (entry.name && en.name) {
      entry.name = applyRepair(entry, "name", entry.name, en.name, stats, "curated");
    }

    if (entry.idealParticipants) {
      entry.idealParticipants = applyRepair(
        entry,
        "idealParticipants",
        entry.idealParticipants,
        en.idealParticipants,
        stats,
        "curated",
      );
    }

    if (Array.isArray(entry.howToPlay)) {
      entry.howToPlay = entry.howToPlay.map((step, i) =>
        applyRepair(entry, "howToPlay", step, en.howToPlay?.[i] ?? step, stats, "curated"),
      );
    }

    if (Array.isArray(entry.requirements)) {
      entry.requirements = entry.requirements.map((req, i) =>
        applyRepair(
          entry,
          "requirements",
          req,
          en.requirements?.[i] ?? req,
          stats,
          "curated",
        ),
      );
    }

    if (Array.isArray(entry.variationNotes)) {
      entry.variationNotes = entry.variationNotes.map((note, i) =>
        applyRepair(
          entry,
          "variationNotes",
          note,
          en.variationNotes?.[i] ?? note,
          stats,
          "curated",
        ),
      );
    }
  }
}

for (const [, pack] of Object.entries(archI18n)) {
  for (const [key, entry] of Object.entries(pack)) {
    const en = enArch[key];
    if (!en) continue;

    if (entry.title) {
      entry.title = applyRepair(entry, "title", entry.title, en.title, stats, "archetypes");
    }

    entry.descTemplate = applyRepair(
      entry,
      "descTemplate",
      entry.descTemplate,
      en.descTemplate,
      stats,
      "archetypes",
    );

    if (entry.participants) {
      entry.participants = applyRepair(
        entry,
        "participants",
        entry.participants,
        en.participants,
        stats,
        "archetypes",
      );
    }

    if (Array.isArray(entry.steps)) {
      entry.steps = entry.steps.map((step, i) =>
        applyRepair(entry, "steps", step, en.steps?.[i] ?? step, stats, "archetypes"),
      );
    }

    if (Array.isArray(entry.req)) {
      entry.req = entry.req.map((req, i) =>
        applyRepair(entry, "req", req, en.req?.[i] ?? req, stats, "archetypes"),
      );
    }
  }
}

save("curated-i18n.json", curI18n);
save("archetypes-i18n.json", archI18n);
console.log("Repaired incomplete i18n strings:", stats);
