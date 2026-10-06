/**
 * PRD (EN + zh-Hant) is the product contract for the CS/TR door.
 * Run: npx tsx scripts/verify-prd.ts
 */
import fs from "node:fs";
import path from "node:path";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "docs/PRD.md"), "utf8");
const zh = fs.readFileSync(path.join(root, "docs/PRD.zh-Hant.md"), "utf8");

const both = [
  "G13",
  "FR-37",
  "FR-38",
  "FR-39",
  "FR-40",
  "FR-41",
  "FR-42",
  "FR-43",
  "FR-44",
  "FR-45",
  "FR-46",
  "FR-47",
  "FR-48",
  "NFR-10",
  "NFR-11",
  "/cs",
  "/admin/cs-dashboard",
  "/admin/cs-log",
  "/admin/cs-data",
  "POST /api/cs/intake",
  "CSR-XXXX",
  "channel_ref",
  "SKILL-CS-CLARIFY",
  "SKILL-CS-ID-VERIFY",
  "SKILL-CS-ACCOUNT-FAQ",
  "SKILL-TR-EXECUTION",
  "SKILL-CS-ESCALATE-RISK",
  "ESC-CS-24-7",
  "ESC-CS-KYC",
  "ESC-TR-DEAL",
  "ESC-CS-RISK",
  "CS_SERVICE",
  "TRADING_EXEC",
  "CHAIN-CS-TR-INTAKE",
  "cs-24-7-intake",
  "WAITING",
  "UAT-46",
  "UAT-47",
  "UAT-51",
  "UAT-52",
  "UAT-53",
  "UAT-25",
  "6.5",
  "5.7",
  "5.8",
  "5.9",
  "5.10",
  "/PRD/crmp-plus/",
  "/PRD/crmp-admin/",
];

for (const needle of both) {
  assert(en.includes(needle), `EN PRD missing ${needle}`);
  assert(zh.includes(needle), `zh-Hant PRD missing ${needle}`);
}

assert(en.includes("### 5.7 Client intake"), "EN journey 5.7");
assert(zh.includes("### 5.7 客戶進件"), "zh journey 5.7");
assert(en.includes("### 5.10"), "EN journey 5.10");
assert(zh.includes("### 5.10"), "zh journey 5.10");
assert(en.includes("### 6.5 CS / TR product contract"), "EN §6.5");
assert(zh.includes("### 6.5 CS／TR 產品契約"), "zh §6.5");
assert(en.includes("C1_LIVE_CHAT"), "EN connector C1");
assert(zh.includes("C1_LIVE_CHAT"), "zh connector C1");
assert(en.includes("WEB_FORM"), "EN connector form");
assert(zh.includes("OFFICIAL_EMAIL"), "zh connector mailbox");
assert(/\| 2\.6 \| 2026-10-06 \|/.test(en), "EN version 2.6");
assert(/\| 2\.6 \| 2026-10-06 \|/.test(zh), "zh version 2.6");
assert(en.includes("frozen") || en.includes("not overwritten"), "EN frozen original");
assert(zh.includes("凍結"), "zh frozen original");
assert(en.includes("never store") || en.includes("No ID images"), "EN no ID images");
assert(zh.includes("證件圖") || zh.includes("不存"), "zh no ID images");

const page = fs.readFileSync(path.join(root, "src/app/admin/docs/prd/page.tsx"), "utf8");
assert(page.includes("FR-37…46") || page.includes("FR-46"), "prd page CS/TR card");
assert(page.includes("UAT-01…53"), "prd page UAT-53");
assert(page.includes('href="/cs"'), "prd page /cs link");
assert(page.includes('href="/admin/cs-desk"'), "prd page desk link");
assert(page.includes('href="/admin/cs-dashboard"'), "prd page dashboard link");
assert(page.includes('href="/admin/cs-log"'), "prd page log link");
assert(page.includes('href="/admin/cs-data"'), "prd page data link");
assert(page.includes("v2.6"), "prd page version badge");

console.log("verify-prd: ok");
console.log(JSON.stringify({ enChars: en.length, zhChars: zh.length, needles: both.length }, null, 2));
