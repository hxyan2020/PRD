#!/usr/bin/env node
/**
 * Hand-drawn grey crest / mark SVGs for brands that have no public logo CDN hit.
 * Keeps locked tiles looking like car-brand silhouettes instead of plain text.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const marksDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "marks");
const F = "#C4C4C4";

function wrap(inner, vb = "0 0 128 128") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img">
${inner}
</svg>
`;
}

function needsFallback(id) {
  const p = join(marksDir, `${id}.svg`);
  if (!existsSync(p)) return true;
  const s = readFileSync(p, "utf8");
  return s.includes("<text") && !s.includes("data:image") && !s.includes('viewBox="0 0 24 24"');
}

const MARKS = {
  "clothes__gap": wrap(`  <rect x="18" y="44" width="92" height="40" rx="4" fill="none" stroke="${F}" stroke-width="4"/>
  <text x="64" y="72" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${F}" letter-spacing="0.18em">GAP</text>`),

  "beer__dos-equis": wrap(`  <circle cx="64" cy="64" r="50" fill="none" stroke="${F}" stroke-width="4"/>
  <text x="64" y="58" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="700" fill="${F}">XX</text>
  <text x="64" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.2em">DOS EQUIS</text>`),

  "beer__harbin": wrap(`  <circle cx="64" cy="64" r="48" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M64 28l8 20h20l-16 14 6 20-18-12-18 12 6-20-16-14h20z"/>
  <text x="64" y="100" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="11" fill="${F}" letter-spacing="0.15em">HARBIN</text>`),

  "beer__becks": wrap(`  <rect x="24" y="24" width="80" height="80" rx="8" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="72" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" fill="${F}" font-style="italic">Beck's</text>`),

  "wine__gaja": wrap(`  <path fill="${F}" d="M64 20c-18 0-32 14-32 32 0 28 32 56 32 56s32-28 32-56c0-18-14-32-32-32zm0 20c6 0 12 6 12 12s-6 12-12 12-12-6-12-12 6-12 12-12z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${F}" letter-spacing="0.25em">GAJA</text>`),

  "wine__vega-sicilia": wrap(`  <circle cx="64" cy="56" r="36" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M64 32l6 16h16l-13 10 5 16-14-10-14 10 5-16-13-10h16z"/>
  <text x="64" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="${F}" letter-spacing="0.12em">VEGA SICILIA</text>`),

  "wine__santa-rita": wrap(`  <ellipse cx="64" cy="52" rx="36" ry="28" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M48 52c0-12 8-20 16-20s16 8 16 20c-4-6-10-8-16-8s-12 2-16 8z"/>
  <text x="64" y="104" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="${F}" letter-spacing="0.1em">SANTA RITA</text>`),

  "wine__latour": wrap(`  <path fill="${F}" d="M40 96V48l24-24 24 24v48H40zm12-12h24V56L64 40 52 56v28z"/>
  <text x="64" y="116" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="${F}" letter-spacing="0.2em">LATOUR</text>`),

  "wine__veuve-clicquot": wrap(`  <circle cx="64" cy="54" r="34" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="48" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${F}">VCP</text>
  <text x="64" y="68" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="${F}" letter-spacing="0.15em">VEUVE CLICQUOT</text>
  <text x="64" y="108" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="${F}">1772</text>`),

  // Sake — crest with Japanese-feeling ring + initials
  "sake__ozeki": wrap(`  <circle cx="64" cy="56" r="40" fill="none" stroke="${F}" stroke-width="4"/>
  <circle cx="64" cy="56" r="28" fill="none" stroke="${F}" stroke-width="2"/>
  <text x="64" y="64" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${F}">大関</text>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${F}" letter-spacing="0.2em">OZEKI</text>`),

  "sake__juyondai": wrap(`  <circle cx="64" cy="56" r="40" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="64" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="${F}">十四代</text>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.15em">JUYONDAI</text>`),

  "sake__born": wrap(`  <circle cx="64" cy="56" r="40" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="66" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="700" fill="${F}">梵</text>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${F}" letter-spacing="0.25em">BORN</text>`),

  "sake__hakkaisan": wrap(`  <circle cx="64" cy="56" r="40" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M40 72L64 28l24 44H40zm8-6h32L64 40 48 66z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.12em">HAKKAISAN</text>`),

  "sake__koshi-no-kanbai": wrap(`  <circle cx="64" cy="52" r="36" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M64 28c-4 8 0 14 0 14s4-6 0-14c8 2 14 8 14 14-8-2-14 0-14 0s6-2 14-14c-2 8-8 14-14 14 2 8 0 14 0 14s-2-6 0-14c-8 2-14 8-14 14 8-2 14 0 14 0s-6-2-14-14z"/>
  <text x="64" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="${F}" letter-spacing="0.08em">KOSHI NO KANBAI</text>`),

  "sake__mutsu-hassen": wrap(`  <circle cx="64" cy="56" r="40" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="50" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="${F}">陸奥</text>
  <text x="64" y="72" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="${F}">八仙</text>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="${F}" letter-spacing="0.1em">MUTSU HASSEN</text>`),

  "sake__isojiman": wrap(`  <circle cx="64" cy="56" r="40" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M32 70c10-16 24-24 32-24s22 8 32 24c-12-6-22-8-32-8s-20 2-32 8z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.12em">ISOJIMAN</text>`),

  // Cigarettes — classic crest / chevron marks
  "cigarettes__winston": wrap(`  <path fill="${F}" d="M24 40h80v12H24zm8 20h64l-8 36H40z"/>
  <text x="64" y="36" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="700" fill="${F}" letter-spacing="0.2em">WINSTON</text>`),

  "cigarettes__pall-mall": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M64 30l8 18 20 2-15 13 4 20-17-12-17 12 4-20-15-13 20-2z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.15em">PALL MALL</text>`),

  "cigarettes__parliament": wrap(`  <rect x="28" y="28" width="72" height="72" rx="6" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="70" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="700" fill="${F}" letter-spacing="0.08em">PARLIAMENT</text>`),

  "cigarettes__kent": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="66" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${F}">KENT</text>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="${F}" letter-spacing="0.2em">MICRONITE</text>`),

  "cigarettes__benson-hedges": wrap(`  <rect x="20" y="36" width="88" height="56" rx="4" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="60" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="700" fill="${F}">BENSON</text>
  <text x="64" y="78" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="700" fill="${F}">&amp; HEDGES</text>`),

  "cigarettes__mevius": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="66" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="18" fill="${F}" letter-spacing="0.12em">MEVIUS</text>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="${F}">MILD SEVEN</text>`),

  "cigarettes__hope": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="68" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" fill="${F}">HOPE</text>`),

  "cigarettes__seven-stars": wrap(`  <path fill="${F}" d="M64 22l8 22h24l-19 16 7 24-20-14-20 14 7-24-19-16h24z"/>
  <path fill="${F}" opacity="0.7" d="M30 78l5 12h14l-11 9 4 14-12-8-12 8 4-14-11-9h14z M98 78l5 12h14l-11 9 4 14-12-8-12 8 4-14-11-9h14z"/>
  <text x="64" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="${F}" letter-spacing="0.15em">SEVEN STARS</text>`),

  "cigarettes__rothmans": wrap(`  <rect x="24" y="32" width="80" height="64" rx="4" fill="none" stroke="${F}" stroke-width="3"/>
  <text x="64" y="70" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="700" fill="${F}" letter-spacing="0.1em">ROTHMANS</text>`),

  "cigarettes__embassy": wrap(`  <path fill="none" stroke="${F}" stroke-width="3" d="M64 24l36 20v40L64 104 28 84V44z"/>
  <text x="64" y="70" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="700" fill="${F}">EMBASSY</text>`),

  "cigarettes__lark": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M40 70c8-20 24-32 24-32s16 12 24 32c-10-6-18-8-24-8s-14 2-24 8z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${F}" letter-spacing="0.25em">LARK</text>`),

  "cigarettes__gauloises": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M44 48c8-12 20-16 20-16s12 4 20 16c-8 4-14 20-20 36-6-16-12-32-20-36z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.1em">GAULOISES</text>`),

  "cigarettes__gitanes": wrap(`  <circle cx="64" cy="58" r="38" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M48 40c0 0 8 20 16 36 8-16 16-36 16-36-12 8-20 8-32 0z M40 80h48v8H40z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${F}" letter-spacing="0.15em">GITANES</text>`),

  "cigarettes__gold-flake": wrap(`  <circle cx="64" cy="56" r="36" fill="none" stroke="${F}" stroke-width="3"/>
  <path fill="${F}" d="M64 28l6 16h16l-13 10 5 16-14-10-14 10 5-16-13-10h16z"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${F}" letter-spacing="0.12em">GOLD FLAKE</text>`),
};

let n = 0;
for (const [id, svg] of Object.entries(MARKS)) {
  if (!needsFallback(id)) continue;
  writeFileSync(join(marksDir, `${id}.svg`), svg);
  n += 1;
}
console.log(`Wrote ${n} emblem fallback marks.`);
