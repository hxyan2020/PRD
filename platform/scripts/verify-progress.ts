/**
 * Progress Tracker (EN + zh-Hant) indexes CS/TR features on the same 20 columns, not extra bars.
 * Run: npx tsx scripts/verify-progress.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  CS_TR_OPEN_ISSUE_CATALOGUE,
  CS_TR_PROGRESS_FUNCTIONS,
  OPEN_ISSUES,
  isCsTrOpenIssue,
  openIssuesCsTrSummary,
} from "../src/lib/docs/open-issues";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
const zh = fs.readFileSync(path.join(root, "docs/PROGRESS.zh-Hant.md"), "utf8");

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
  "cs.auto_reply_max_severity",
  "UAT-46",
  "UAT-51",
  "UAT-52",
  "UAT-53",
  "FR-46",
  "POC_REVIEW",
  "oc_cs_c1",
];

assert(en.includes("**Version:** 1.6"), "EN version 1.6 header");
assert(zh.includes("**版本：** 1.6"), "zh version 1.6 header");
assert(en.includes("## CS/TR feature catalogue"), "EN CS/TR catalogue heading");
assert(zh.includes("## CS／TR 功能目錄"), "zh CS/TR catalogue heading");
assert(en.includes("20 columns"), "EN pack size 20 columns");
assert(zh.includes("20 欄"), "zh pack size 20 columns");
assert(en.includes("not extra bars"), "EN not extra bars");
assert(zh.includes("不是額外長條"), "zh not extra bars");
assert(en.includes("pt-cs-catalogue"), "EN mentions interactive testid");
assert(zh.includes("pt-cs-catalogue"), "zh mentions interactive testid");
assert(en.includes("Functions on existing bars"), "EN functions-on-bars table");
assert(zh.includes("功能對應既有長條"), "zh functions-on-bars table");
assert(en.includes("categorize / severity"), "EN categorize/severity");
assert(zh.includes("分類／嚴重度"), "zh categorize/severity");
assert(en.includes("no-silent-drop SLA"), "EN remaining SLA");
assert(zh.includes("無靜默丟失 SLA"), "zh remaining SLA");

for (const needle of bothNeedles) {
  assert(en.includes(needle), `EN PROGRESS missing ${needle}`);
  assert(zh.includes(needle), `zh-Hant PROGRESS missing ${needle}`);
}

assert(OPEN_ISSUES.length === 20, `20 issues, got ${OPEN_ISSUES.length}`);
assert(
  OPEN_ISSUES.map((i) => i.id).join(",") ===
    Array.from({ length: 20 }, (_, n) => `OI-${String(n + 1).padStart(2, "0")}`).join(","),
  "OI-01…20 sequential"
);

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

assert(CS_TR_PROGRESS_FUNCTIONS.length >= 12, `progress functions ${CS_TR_PROGRESS_FUNCTIONS.length}`);
assert(
  CS_TR_PROGRESS_FUNCTIONS.some((r) => r.id === "fn-analyze" && r.columns.includes("OI-19")),
  "analyze function maps to OI-19"
);
assert(
  CS_TR_PROGRESS_FUNCTIONS.some((r) => r.id === "fn-poc" && r.columns.includes("OI-20")),
  "POC function maps to OI-20"
);
assert(
  CS_TR_OPEN_ISSUE_CATALOGUE.find((r) => r.id === "OI-19")?.shippedEn.includes("UAT-53"),
  "OI-19 shipped mentions UAT-53"
);
assert(
  CS_TR_OPEN_ISSUE_CATALOGUE.find((r) => r.id === "OI-09")?.shippedEn.includes("v2.7"),
  "OI-09 shipped UAT v2.7"
);

const board = fs.readFileSync(path.join(root, "src/components/ProgressTrackerBoard.tsx"), "utf8");
assert(board.includes('data-testid="pt-cs-catalogue"'), "board CS/TR catalogue panel");
assert(board.includes("isCsTrOpenIssue"), "board uses isCsTrOpenIssue");
assert(board.includes("csTrOnly"), "board CS/TR filter");
assert(board.includes("CS_TR_PROGRESS_FUNCTIONS"), "board functions-on-bars");
assert(board.includes("v1.6"), "board version badge");
assert(board.includes('href="/cs"'), "board /cs link");
assert(board.includes('href="/admin/cs-desk"'), "board desk link");
assert(board.includes('href="/admin/cs-dashboard"'), "board dashboard link");
assert(board.includes('href="/admin/cs-log"'), "board log link");
assert(board.includes('href="/admin/cs-data"'), "board data link");
assert(board.includes('href="/admin/docs/uat"'), "board UAT link");
assert(board.includes('data-testid="progress-chart"'), "board chart");
assert(board.includes('data-testid="progress-detail"'), "board detail");
assert(board.includes('data-testid="progress-mobile"'), "board mobile cards");

const stamp = fs.readFileSync(path.join(root, "src/lib/build-stamp.ts"), "utf8");
assert(stamp.includes("2026-10-06T23:00:00.000Z"), "FINISHED_AT 23:00");

const urls = fs.readFileSync(path.join(root, "src/lib/docs/urls.ts"), "utf8");
assert(urls.includes("CS/TR catalogue v1.6"), "url catalog Progress description");

console.log("verify-progress: ok");
console.log(
  JSON.stringify(
    {
      issues: OPEN_ISSUES.length,
      catalogue: summary,
      functions: CS_TR_PROGRESS_FUNCTIONS.length,
      enChars: en.length,
      zhChars: zh.length,
      needles: bothNeedles.length,
    },
    null,
    2
  )
);
