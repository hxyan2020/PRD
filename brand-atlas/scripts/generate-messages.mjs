import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "src/i18n/packs");
const en = JSON.parse(readFileSync(join(dir, "en.json"), "utf8"));
const keys = Object.keys(en);

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function dumpObj(obj, indent = 2) {
  const pad = " ".repeat(indent);
  return Object.entries(obj)
    .map(([k, v]) => `${pad}"${k}": "${esc(v)}",`)
    .join("\n");
}

let out = `/* Auto-generated from src/i18n/packs/*.json — run: node scripts/generate-messages.mjs */\n`;
out += `export type MessageKey =\n` + keys.map((k) => `  | "${k}"`).join("\n") + `;\n\n`;
out += `type Pack = Record<MessageKey, string>;\n\nconst en: Pack = {\n${dumpObj(en)}\n};\n\n`;
out += `function pack(partial: Partial<Pack>): Pack {\n  return { ...en, ...partial };\n}\n\nconst packs: Record<string, Pack> = {\n  en,\n`;

for (const f of readdirSync(dir)
  .filter((x) => x.endsWith(".json") && x !== "en.json")
  .sort()) {
  const code = f.replace(/\.json$/, "");
  const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const keyLit = /[^a-zA-Z0-9_]/.test(code) ? `"${code}"` : code;
  out += `  ${keyLit}: pack({\n${dumpObj(data)}\n  }),\n`;
}

out += `};\n\n`;
out += `export function translate(\n  lang: string,\n  key: MessageKey,\n  vars?: Record<string, string>,\n): string {\n  const raw = packs[lang]?.[key] ?? en[key] ?? key;\n  if (!vars) return raw;\n  return Object.entries(vars).reduce(\n    (s, [k, v]) => s.replaceAll(\`{\${k}}\`, v),\n    raw,\n  );\n}\n\n`;
out += `export function categoryMessageKey(id: string): MessageKey | null {\n  const key = \`cat.\${id}\` as MessageKey;\n  return key in en ? key : null;\n}\n`;

writeFileSync(join(root, "src/i18n/messages.ts"), out);
console.log("Wrote messages.ts with", keys.length, "keys,", readdirSync(dir).length, "packs");
