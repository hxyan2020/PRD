/**
 * URL catalog lists the CS/TR door, playbooks, intake API and bilingual copy.
 * Run: npx tsx scripts/verify-url-catalog.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PLATFORM_URLS, PUBLIC_CS_DESK_URL, PUBLIC_CS_DASHBOARD_URL, PUBLIC_CS_LOG_URL, PUBLIC_CS_DATA_URL, PUBLIC_CS_PORTAL_URL } from "../src/lib/docs/urls";
import { PHRASES_ZH } from "../src/lib/i18n-extra";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const requiredPaths = [
  "/cs",
  "/admin/cs-desk",
  "/admin/cs-dashboard",
  "/admin/cs-log",
  "/admin/cs-data",
  "/admin/skills/SKILL-CS-CLARIFY",
  "/admin/skills/SKILL-CS-ID-VERIFY",
  "/admin/skills/SKILL-CS-ACCOUNT-FAQ",
  "/admin/skills/SKILL-TR-EXECUTION",
  "/admin/skills/SKILL-CS-ESCALATE-RISK",
  "/admin/rag?doc=cs-24-7-intake",
  "/admin/rag?doc=cs-id-verify-policy",
  "/admin/rag?doc=cs-swap-faq",
  "/admin/rag?doc=tr-dealing-handoff",
  "/admin/rag?doc=cs-escalate-to-risk",
  "/admin/rag?doc=cs-skill-playbooks",
  "/api/cs",
  "/api/cs?view=data",
  "/api/cs/intake",
  "/api/cs/intake?request_id=",
  "tables:cs_channels",
  "tables:cs_requests",
  "tables:cs_messages",
  "tables:cs_followups",
  PUBLIC_CS_PORTAL_URL,
  PUBLIC_CS_DESK_URL,
  PUBLIC_CS_DASHBOARD_URL,
  PUBLIC_CS_LOG_URL,
  PUBLIC_CS_DATA_URL,
];

const byPath = new Map(PLATFORM_URLS.map((u) => [u.path, u]));
assert(byPath.size === PLATFORM_URLS.length, "PLATFORM_URLS paths must be unique");

for (const p of requiredPaths) {
  assert(byPath.has(p), `catalog missing path ${p}`);
}

const csRows = PLATFORM_URLS.filter((u) => u.category === "CS / TR");
assert(
  csRows.some((u) => u.path === "/cs"),
  "/cs must live in CS / TR"
);
assert(
  csRows.some((u) => u.path === "/admin/cs-desk"),
  "/admin/cs-desk must live in CS / TR"
);
assert(
  csRows.some((u) => u.path === "/admin/cs-dashboard"),
  "/admin/cs-dashboard must live in CS / TR"
);
assert(
  csRows.some((u) => u.path === "/admin/cs-log"),
  "/admin/cs-log must live in CS / TR"
);
assert(
  csRows.some((u) => u.path === "/admin/cs-data"),
  "/admin/cs-data must live in CS / TR"
);
assert(csRows.length >= 15, `CS / TR section too small: ${csRows.length}`);

const phraseTargets = PLATFORM_URLS.filter(
  (u) =>
    u.category === "CS / TR" ||
    u.path.startsWith("/api/cs") ||
    u.path.startsWith("tables:cs_")
);
for (const u of phraseTargets) {
  assert(PHRASES_ZH[u.title], `missing zh title phrase: ${u.title}`);
  assert(PHRASES_ZH[u.description], `missing zh description phrase: ${u.description}`);
}

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "src/app/admin/docs/urls/page.tsx"), "utf8");
assert(page.includes("urls.csCheat"), "catalog page CS/TR cheat");
assert(page.includes("PUBLIC_CS_PORTAL_URL"), "catalog page portal URL");
assert(page.includes('href="/cs"'), "catalog page /cs action");
assert(page.includes('href="/admin/cs-desk"'), "catalog page desk action");
assert(page.includes('href="/admin/cs-dashboard"'), "catalog page dashboard action");
assert(page.includes('href="/admin/cs-log"'), "catalog page log action");
assert(page.includes('href="/admin/cs-data"'), "catalog page data action");
assert(page.includes("url-cs-cheat"), "catalog page cheat testid");

const board = fs.readFileSync(path.join(root, "src/components/UrlCatalogBoard.tsx"), "utf8");
assert(board.includes('"CS / TR"'), "board CS / TR category label");
assert(board.includes("SKILL-CS-CLARIFY"), "board deep-link uses CS skill");
assert(board.includes("url-catalog-filter"), "board filter");
assert(board.includes("url-cat-cs-tr"), "board CS/TR anchor");

const i18n = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
assert(i18n.includes('"urls.csCheat"'), "i18n urls.csCheat");
assert(i18n.includes('"urls.csCount"'), "i18n urls.csCount");
assert(i18n.includes("/PRD/crmp-plus/cs/"), "i18n publicNote mentions /cs");

const uat = fs.readFileSync(path.join(root, "src/lib/docs/uat-cases.ts"), "utf8");
assert(uat.includes("CS/TR door and playbooks"), "UAT-25 covers CS/TR catalog");
assert(uat.includes("SKILL-CS-CLARIFY"), "UAT-25 opens CS skill from catalog");

console.log("verify-url-catalog: ok");
console.log(
  JSON.stringify(
    {
      total: PLATFORM_URLS.length,
      csTr: csRows.length,
      apis: PLATFORM_URLS.filter((u) => u.category === "API").length,
      required: requiredPaths.length,
    },
    null,
    2
  )
);
