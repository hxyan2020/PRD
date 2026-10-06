/**
 * Open Issues catalogue (EN + zh-Hant) indexes CS/TR features, not extra numbered issues.
 * Run: npx tsx scripts/verify-open-issues.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  CS_TR_OPEN_ISSUE_CATALOGUE,
  OPEN_ISSUES,
  isCsTrOpenIssue,
  openIssuesCsTrSummary,
} from "../src/lib/docs/open-issues";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "docs/OPEN_ISSUES.md"), "utf8");
const zh = fs.readFileSync(path.join(root, "docs/OPEN_ISSUES.zh-Hant.md"), "utf8");

const bothNeedles = [
  "OI-05",
  "OI-08",
  "OI-09",
  "OI-11",
  "OI-14",
  "OI-15",
  "OI-19",
  "OI-20",
  "/admin/cs-dashboard",
  "/admin/cs-log",
  "/admin/cs-data",
  "ESC-CS-KYC",
  "cs.followup_cap",
  "UAT-46",
  "UAT-51",
  "UAT-52",
  "UAT-53",
  "oc_cs_c1",
];

assert(en.includes("**Version:** 1.5"), "EN version 1.5 header");
assert(zh.includes("**版本：** 1.5"), "zh version 1.5 header");
assert(en.includes("## CS/TR feature catalogue"), "EN CS/TR catalogue heading");
assert(zh.includes("## CS／TR 功能目錄"), "zh CS/TR catalogue heading");
assert(en.includes("20 issues"), "EN pack size 20");
assert(zh.includes("20 項"), "zh pack size 20");
assert(en.includes("not extra numbered issues"), "EN not extra numbers");
assert(zh.includes("不是額外編號"), "zh not extra numbers");
assert(en.includes("oi-cs-catalogue"), "EN mentions interactive testid");
assert(zh.includes("oi-cs-catalogue"), "zh mentions interactive testid");
assert(en.includes("no-silent-drop SLA"), "EN remaining SLA");
assert(zh.includes("無靜默丟失 SLA"), "zh remaining SLA");
assert(en.includes("demo-c1"), "EN demo token still remaining");
assert(zh.includes("demo-c1"), "zh demo token still remaining");

for (const needle of bothNeedles) {
  assert(en.includes(needle), `EN OPEN_ISSUES missing ${needle}`);
  assert(zh.includes(needle), `zh-Hant OPEN_ISSUES missing ${needle}`);
}

assert(OPEN_ISSUES.length === 20, `20 issues, got ${OPEN_ISSUES.length}`);
assert(OPEN_ISSUES.map((i) => i.id).join(",") === Array.from({ length: 20 }, (_, n) => `OI-${String(n + 1).padStart(2, "0")}`).join(","), "OI-01…20 sequential");

const oi19 = OPEN_ISSUES.find((i) => i.id === "OI-19");
const oi20 = OPEN_ISSUES.find((i) => i.id === "OI-20");
assert(oi19?.status === "started", "OI-19 started");
assert(oi20?.status === "started", "OI-20 started");
assert(oi19?.checklist.some((c) => c.done && c.en.includes("UAT-46")), "OI-19 UAT-46 done");
assert(oi19?.checklist.some((c) => !c.done && c.en.includes("signed C1")), "OI-19 signed C1 still open");
assert(oi20?.checklist.some((c) => c.done && c.en.includes("flags-only")), "OI-20 flags-only done");
assert(oi20?.checklist.some((c) => !c.done && c.en.includes("Production KYC")), "OI-20 production vault still open");

const summary = openIssuesCsTrSummary();
assert(summary.primary === 2, `primary count ${summary.primary}`);
assert(summary.support === 6, `support count ${summary.support}`);
assert(summary.total === 8, `catalogue total ${summary.total}`);

const ids = CS_TR_OPEN_ISSUE_CATALOGUE.map((r) => r.id);
for (const id of ["OI-19", "OI-20"]) {
  assert(ids.includes(id), `catalogue missing primary ${id}`);
  assert(isCsTrOpenIssue({ id }), `${id} is CS/TR`);
}
for (const id of ["OI-05", "OI-08", "OI-09", "OI-11", "OI-14", "OI-15"]) {
  assert(ids.includes(id), `catalogue missing support ${id}`);
  assert(isCsTrOpenIssue({ id }), `${id} is CS/TR`);
}
assert(!isCsTrOpenIssue({ id: "OI-01" }), "OI-01 is not CS/TR catalogue");
assert(!ids.includes("OI-21"), "must not invent OI-21");

const board = fs.readFileSync(path.join(root, "src/components/OpenIssuesBoard.tsx"), "utf8");
assert(board.includes('data-testid="oi-cs-catalogue"'), "board CS/TR catalogue panel");
assert(board.includes("isCsTrOpenIssue"), "board uses isCsTrOpenIssue");
assert(board.includes("csTrOnly"), "board CS/TR filter");
assert(board.includes("v1.5"), "board version badge");
assert(board.includes('href="/cs"'), "board /cs link");
assert(board.includes('href="/admin/cs-desk"'), "board desk link");
assert(board.includes('href="/admin/cs-dashboard"'), "board dashboard link");
assert(board.includes('href="/admin/cs-log"'), "board log link");
assert(board.includes('href="/admin/cs-data"'), "board data link");
assert(board.includes('href="/admin/docs/uat"'), "board UAT link");

const stamp = fs.readFileSync(path.join(root, "src/lib/build-stamp.ts"), "utf8");
assert(stamp.includes("2026-10-06T22:00:00.000Z"), "FINISHED_AT 22:00");

console.log("verify-open-issues: ok");
console.log(
  JSON.stringify(
    {
      issues: OPEN_ISSUES.length,
      catalogue: summary,
      enChars: en.length,
      zhChars: zh.length,
      needles: bothNeedles.length,
    },
    null,
    2
  )
);
