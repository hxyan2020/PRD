import { LOCALES } from "../lib/i18n/locales";
import { MESSAGES } from "../lib/i18n/messages";

const en = MESSAGES.en;
const enKeys = Object.keys(en) as (keyof typeof en)[];

type Row = {
  code: string;
  label: string;
  total: number;
  translated: number;
  stillEn: number;
  coverage: number;
  stillEnKeys: string[];
};

const rows: Row[] = [];

for (const loc of LOCALES) {
  if (loc.code === "en") continue;
  const dict = MESSAGES[loc.code];
  const stillEn = enKeys.filter((k) => dict[k] === en[k]);
  const translated = enKeys.filter((k) => dict[k] !== en[k]);
  rows.push({
    code: loc.code,
    label: loc.label,
    total: enKeys.length,
    translated: translated.length,
    stillEn: stillEn.length,
    coverage: Math.round((translated.length / enKeys.length) * 100),
    stillEnKeys: stillEn,
  });
}

rows.sort((a, b) => a.coverage - b.coverage);

console.log(`English keys: ${enKeys.length}`);
console.log("\nCoverage (keys differing from English):");
for (const r of rows) {
  console.log(
    `${r.code.padEnd(7)} ${String(r.coverage).padStart(3)}%  ${r.translated}/${r.total}  stillEn=${r.stillEn}  ${r.label}`,
  );
}

const prefixes = [
  "nav.",
  "hero.",
  "teaser.",
  "ledger.",
  "footer.",
  "match.",
  "ideaChat.",
  "ideaMedia.",
  "today.",
  "auth.",
  "collection.",
  "collect.",
  "sources.",
  "lang.",
];

console.log("\nPer-prefix still-English counts (lowest coverage locales):");
for (const r of rows.slice(0, 8)) {
  const byPrefix: Record<string, number> = {};
  for (const k of r.stillEnKeys) {
    const p = prefixes.find((x) => k.startsWith(x)) ?? "other";
    byPrefix[p] = (byPrefix[p] ?? 0) + 1;
  }
  console.log(`\n${r.code}:`);
  for (const [p, n] of Object.entries(byPrefix).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${p} ${n}`);
  }
}
