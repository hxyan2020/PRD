/**
 * User handbook (EN + zh-Hant) covers CS/TR portal, connectors, wait loop, skills.
 * Run: npx tsx scripts/verify-user-guide.ts
 */
import fs from "node:fs";
import path from "node:path";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "docs/USER_GUIDE.md"), "utf8");
const zh = fs.readFileSync(path.join(root, "docs/USER_GUIDE.zh-Hant.md"), "utf8");

const both = [
  "/cs",
  "CSR-XXXX",
  "C1_LIVE_CHAT",
  "WEB_FORM",
  "OFFICIAL_EMAIL",
  "SKILL-CS-CLARIFY",
  "SKILL-CS-ID-VERIFY",
  "SKILL-CS-ACCOUNT-FAQ",
  "SKILL-TR-EXECUTION",
  "SKILL-CS-ESCALATE-RISK",
  "ESC-CS-24-7",
  "ESC-TR-DEAL",
  "ESC-CS-RISK",
  "CHAIN-CS-TR-INTAKE",
  "CS_SERVICE",
  "TRADING_EXEC",
  "channel_ref",
  "In-Reply-To",
  "WAITING",
  "UAT-46",
  "UAT-47",
  "cs.lead@vantagemarkets.com",
  "9.3.7",
  "9.3.8",
  "9.3.9",
  "9.3.10",
  "/admin/cs-dashboard",
  "/admin/cs-log",
  "/admin/cs-data",
  "UAT-51",
  "UAT-52",
  "UAT-53",
  "ESC-CS-KYC",
  "cs.followup_cap",
  "cs.auto_reply_max_severity",
  "cs.sensitive_categories",
  "POC_REVIEW",
  "AI_REPLIED",
  "CS_FOLLOWUP_EMAIL",
  "https://hxyan2020.github.io/PRD/crmp-plus/cs/",
];

for (const needle of both) {
  assert(en.includes(needle), `EN handbook missing ${needle}`);
  assert(zh.includes(needle), `zh-Hant handbook missing ${needle}`);
}

assert(en.includes("### CS Lead"), "EN missing CS Lead daily role");
assert(zh.includes("### 客服主管"), "zh missing CS Lead daily role");
assert(en.includes("#### 9.3.1 Client portal"), "EN missing portal how-to");
assert(zh.includes("#### 9.3.1 客戶入口"), "zh missing portal how-to");
assert(en.includes("#### 9.3.10"), "EN missing analyze how-to");
assert(zh.includes("#### 9.3.10"), "zh missing analyze how-to");
assert(en.includes("Unclear or need ID"), "EN wait-loop mermaid");
assert(zh.includes("不清楚或需核身"), "zh wait-loop mermaid");
assert(/\| 2\.5 \| 2026-10-06 \|/.test(en), "EN version 2.5");
assert(/\| 2\.5 \| 2026-10-06 \|/.test(zh), "zh version 2.5");
assert(!en.includes("/PRD/crmp-admin/") || en.includes("frozen"), "EN should keep frozen original");
assert(zh.includes("凍結"), "zh frozen original");

const page = fs.readFileSync(path.join(root, "src/app/admin/docs/user-guide/page.tsx"), "utf8");
assert(page.includes('href: "/cs"'), "user-guide page quick link to /cs");
assert(page.includes('href: "/admin/cs-desk"'), "user-guide page quick link to desk");
assert(page.includes('href: "/admin/cs-dashboard"'), "user-guide page quick link to dashboard");
assert(page.includes('href: "/admin/cs-log"'), "user-guide page quick link to log");
assert(page.includes('href: "/admin/cs-data"'), "user-guide page quick link to data");

console.log("verify-user-guide: ok");
console.log(JSON.stringify({ enChars: en.length, zhChars: zh.length, needles: both.length }, null, 2));
