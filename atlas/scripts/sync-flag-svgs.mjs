/**
 * Download SVG flags for catalog countries into public/flags/{iso}.svg.
 * Run: node scripts/sync-flag-svgs.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/flags");

/** ISO2 codes used by Ludus Atlas origin labels + language picker. */
const ISOS = [
  "af", "dz", "ar", "am", "au", "bd", "be", "bz", "bo", "br", "bg", "kh",
  "ca", "cl", "cn", "co", "hr", "cu", "cz", "dk", "ec", "eg", "et", "fj",
  "fi", "fr", "ge", "de", "gh", "gr", "gl", "gt", "us", "hu", "in", "id",
  "ir", "iq", "ie", "il", "it", "jp", "kz", "ke", "kr", "la", "lb", "mg",
  "my", "ml", "mr", "mx", "mn", "ma", "mm", "np", "nl", "nz", "ng", "no",
  "pk", "pg", "pe", "ph", "pl", "pt", "ro", "ru", "ws", "sa", "sn", "rs",
  "sb", "za", "es", "lk", "sd", "se", "tz", "th", "to", "tr", "ua", "gb",
  "uz", "ve", "vn", "ye", "hk", "eu", "tw", "bd",
];

mkdirSync(outDir, { recursive: true });

const unique = [...new Set(ISOS)];
let ok = 0;
let fail = 0;
for (const iso of unique) {
  const dest = join(outDir, `${iso}.svg`);
  if (existsSync(dest)) {
    ok++;
    continue;
  }
  const url = `https://flagcdn.com/${iso}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const svg = await res.text();
    if (!svg.includes("<svg")) throw new Error("not svg");
    writeFileSync(dest, svg);
    ok++;
    process.stdout.write(`+ ${iso}\n`);
  } catch (e) {
    fail++;
    console.error(`fail ${iso}:`, e.message);
  }
}
console.log(`Done. ok=${ok} fail=${fail} dir=${outDir}`);
