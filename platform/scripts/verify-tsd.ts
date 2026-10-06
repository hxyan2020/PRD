/**
 * TSD (EN + zh-Hant) specifies the CS/TR door: schema, intake, wait loop, portal, catalog.
 * Run: npx tsx scripts/verify-tsd.ts
 */
import fs from "node:fs";
import path from "node:path";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "docs/TSD.md"), "utf8");
const zh = fs.readFileSync(path.join(root, "docs/TSD.zh-Hant.md"), "utf8");

const both = [
  "**Version:** 2.3",
  "### 17.5",
  "### 17.6",
  "### 17.7",
  "### 17.8",
  "### 17.9",
  "### 17.10",
  "### 4.7",
  "/cs",
  "POST /api/cs/intake",
  "GET /api/cs/intake",
  "CSR-XXXX",
  "channel_ref",
  "parseIntakePayload",
  "ingestOrContinue",
  "CsClientPortal",
  "cs_channels",
  "cs_requests",
  "cs_messages",
  "cs_followups",
  "SKILL-CS-CLARIFY",
  "SKILL-TR-EXECUTION",
  "ESC-CS-24-7",
  "FR-37",
  "FR-41",
  "FR-43",
  "UAT-46",
  "UAT-47",
  "UrlCatalogBoard",
  "lib/cs/intake.ts",
  "x-cs-intake-token",
  "/PRD/crmp-plus/cs/",
  "/PRD/crmp-admin/",
];

assert(en.includes("**Version:** 2.3"), "EN version 2.3 header");
assert(zh.includes("**版本：** 2.3"), "zh version 2.3 header");

for (const needle of both.slice(1)) {
  assert(en.includes(needle), `EN TSD missing ${needle}`);
  assert(zh.includes(needle), `zh-Hant TSD missing ${needle}`);
}

assert(en.includes("### 17.5 Schema"), "EN schema heading");
assert(zh.includes("### 17.5 資料綱要"), "zh schema heading");
assert(en.includes("### 17.8 Public `/cs` portal"), "EN portal heading");
assert(zh.includes("### 17.8 公開 `/cs` 入口"), "zh portal heading");
assert(en.includes("New ingest"), "EN wait-loop mermaid");
assert(zh.includes("新進件"), "zh wait-loop mermaid");
assert(en.includes("frozen") || en.includes("not overwritten"), "EN frozen original");
assert(zh.includes("凍結"), "zh frozen original");
assert(en.includes("ID-image") || en.includes("ID image"), "EN no ID images");
assert(zh.includes("證件圖"), "zh no ID images");

const page = fs.readFileSync(path.join(root, "src/app/admin/docs/tsd/page.tsx"), "utf8");
assert(page.includes("v2.3"), "tsd page version");
assert(page.includes("§17.5–17.10"), "tsd page CS/TR card");
assert(page.includes('href="/cs"'), "tsd page /cs link");
assert(page.includes('href="/admin/cs-desk"'), "tsd page desk link");

console.log("verify-tsd: ok");
console.log(JSON.stringify({ enChars: en.length, zhChars: zh.length, needles: both.length }, null, 2));
