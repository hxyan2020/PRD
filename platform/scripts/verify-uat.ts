/**
 * UAT catalogue (EN + zh-Hant) indexes CS/TR features, not extra numbered cases.
 * Run: npx tsx scripts/verify-uat.ts
 */
import fs from "node:fs";
import path from "node:path";
import { CS_TR_UAT_CATALOGUE, UAT_CASES, isCsTrUatCase, uatCsTrSummary } from "../src/lib/docs/uat-cases";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "docs/UAT.md"), "utf8");
const zh = fs.readFileSync(path.join(root, "docs/UAT.zh-Hant.md"), "utf8");

const bothNeedles = [
  "UAT-25",
  "UAT-46",
  "UAT-47",
  "UAT-48",
  "UAT-50",
  "UAT-51",
  "UAT-52",
  "UAT-53",
  "/admin/cs-dashboard",
  "/admin/cs-log",
  "/admin/cs-data",
  "ESC-CS-KYC",
  "cs.followup_cap",
];

assert(en.includes("**Version:** 2.7"), "EN version 2.7 header");
assert(zh.includes("**版次：** 2.7"), "zh version 2.7 header");
assert(en.includes("## CS/TR feature catalogue"), "EN CS/TR catalogue heading");
assert(zh.includes("## CS／TR 功能目錄"), "zh CS/TR catalogue heading");
assert(en.includes("52 cases"), "EN pack size 52");
assert(zh.includes("52 案"), "zh pack size 52");
assert(en.includes("CS/TR door and playbooks"), "UAT-25 title substring (url-catalog)");
assert(en.includes("not /admin/cs-dashboard"), "UAT-28 is not CS dashboard");
assert(en.includes("not /admin/cs-log"), "UAT-29 is not CS log");
assert(zh.includes("不是 /admin/cs-dashboard"), "zh UAT-28 not CS dashboard");
assert(zh.includes("不是 /admin/cs-log"), "zh UAT-29 not CS log");
assert(en.includes("uat-cs-catalogue"), "EN mentions interactive testid");
assert(zh.includes("uat-cs-catalogue"), "zh mentions interactive testid");

for (const needle of bothNeedles) {
  assert(en.includes(needle), `EN UAT missing ${needle}`);
  assert(zh.includes(needle), `zh-Hant UAT missing ${needle}`);
}

const summary = uatCsTrSummary();
assert(summary.primary === 8, `primary count ${summary.primary}`);
assert(summary.support === 10, `support count ${summary.support}`);
assert(summary.total === 18, `catalogue total ${summary.total}`);
assert(UAT_CASES.length === 52, `52 cases (skip UAT-45), got ${UAT_CASES.length}`);
assert(!UAT_CASES.some((c) => c.id === "UAT-45"), "array must skip UAT-45");
assert(UAT_CASES[UAT_CASES.length - 1]?.id === "UAT-49", "sign-off last");

const uat25 = UAT_CASES.find((c) => c.id === "UAT-25");
assert(uat25?.en.title.includes("CS/TR door and playbooks"), "UAT-25 EN title");
assert(uat25?.covers.includes("CS / TR Dashboard"), "UAT-25 covers dashboard");
assert(uat25?.covers.includes("CS / TR Log"), "UAT-25 covers log");
assert(uat25?.covers.includes("CS / TR Data"), "UAT-25 covers data");

const ids = CS_TR_UAT_CATALOGUE.map((r) => r.id);
for (const id of ["UAT-25", "UAT-46", "UAT-47", "UAT-48", "UAT-50", "UAT-51", "UAT-52", "UAT-53"]) {
  assert(ids.includes(id), `catalogue missing primary ${id}`);
  assert(isCsTrUatCase({ id }), `${id} is CS/TR`);
}
for (const id of ["UAT-17", "UAT-22", "UAT-27", "UAT-28", "UAT-29", "UAT-36", "UAT-37", "UAT-38", "UAT-39", "UAT-40"]) {
  assert(ids.includes(id), `catalogue missing support ${id}`);
}

const board = fs.readFileSync(path.join(root, "src/components/UatChecklistBoard.tsx"), "utf8");
assert(board.includes('data-testid="uat-cs-catalogue"'), "board CS/TR catalogue panel");
assert(board.includes('"CS_TR"'), "board CS/TR filter");
assert(board.includes("isCsTrUatCase"), "board uses isCsTrUatCase");

const page = fs.readFileSync(path.join(root, "src/app/admin/docs/uat/page.tsx"), "utf8");
assert(page.includes("v2.7"), "uat page version badge");
assert(page.includes('href="/cs"'), "uat page /cs link");
assert(page.includes('href="/admin/cs-desk"'), "uat page desk link");
assert(page.includes('href="/admin/cs-dashboard"'), "uat page dashboard link");
assert(page.includes('href="/admin/cs-log"'), "uat page log link");
assert(page.includes('href="/admin/cs-data"'), "uat page data link");
assert(page.includes("uatCsTrSummary"), "uat page CS/TR count");

console.log("verify-uat: ok");
console.log(
  JSON.stringify(
    {
      cases: UAT_CASES.length,
      catalogue: summary,
      enChars: en.length,
      zhChars: zh.length,
      needles: bothNeedles.length,
    },
    null,
    2
  )
);
