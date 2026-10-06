/**
 * Guardrails: CRMP Plus publishes to /PRD/crmp-plus/; original CRMP Admin
 * stays at /PRD/crmp-admin/ and is not overwritten by this branch.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {
  DEFAULT_BASE_PATH,
  ORIGINAL_CRMP_ADMIN_URL,
  ORIGINAL_CRMP_BASE_PATH,
  PUBLIC_ADMIN_URL,
  PUBLIC_CS_DESK_URL,
  PUBLIC_CS_DASHBOARD_URL,
  PUBLIC_CS_LOG_URL,
  PUBLIC_CS_PORTAL_URL,
  PUBLIC_MESSENGER_URL,
} from "../src/lib/platform-site";

const repo = path.resolve(__dirname, "../..");

function read(rel: string) {
  return fs.readFileSync(path.join(repo, rel), "utf8");
}

assert.equal(DEFAULT_BASE_PATH, "/PRD/crmp-plus");
assert.equal(ORIGINAL_CRMP_BASE_PATH, "/PRD/crmp-admin");
assert.equal(PUBLIC_ADMIN_URL, "https://hxyan2020.github.io/PRD/crmp-plus/admin/");
assert.equal(PUBLIC_MESSENGER_URL, "https://hxyan2020.github.io/PRD/crmp-plus/admin/messenger/");
assert.equal(PUBLIC_CS_DESK_URL, "https://hxyan2020.github.io/PRD/crmp-plus/admin/cs-desk/");
assert.equal(PUBLIC_CS_DASHBOARD_URL, "https://hxyan2020.github.io/PRD/crmp-plus/admin/cs-dashboard/");
assert.equal(PUBLIC_CS_LOG_URL, "https://hxyan2020.github.io/PRD/crmp-plus/admin/cs-log/");
assert.equal(PUBLIC_CS_PORTAL_URL, "https://hxyan2020.github.io/PRD/crmp-plus/cs/");
assert.equal(ORIGINAL_CRMP_ADMIN_URL, "https://hxyan2020.github.io/PRD/crmp-admin/admin/");

const origWf = read(".github/workflows/crmp-pages.yml");
assert.match(origWf, /NEXT_PUBLIC_BASE_PATH: \/PRD\/crmp-admin/);
assert.match(origWf, /publish\/crmp-admin/);
assert.doesNotMatch(origWf, /crmp-plus-a935/);
assert.doesNotMatch(origWf, /publish\/crmp-plus/);

const plusWf = read(".github/workflows/crmp-plus-pages.yml");
assert.match(plusWf, /NEXT_PUBLIC_BASE_PATH: \/PRD\/crmp-plus/);
assert.match(plusWf, /publish\/crmp-plus/);
assert.match(plusWf, /keep_files: true/);
assert.match(plusWf, /cursor\/crmp-plus-a935/);
assert.doesNotMatch(plusWf, /publish\/crmp-admin/);

const nextCfg = read("platform/next.config.ts");
assert.match(nextCfg, /\/PRD\/crmp-plus/);

const buildSh = read("platform/scripts/build-github-pages.sh");
assert.match(buildSh, /\/PRD\/crmp-plus/);

const urls = read("platform/src/lib/docs/urls.ts");
assert.match(urls, /ORIGINAL_CRMP_ADMIN_URL/);
assert.match(urls, /CRMP Plus \(this platform\)/);
assert.match(urls, /Original CRMP Admin \(frozen\)/);
assert.match(urls, /category: "CS \/ TR"/);
assert.match(urls, /SKILL-CS-CLARIFY/);
assert.match(urls, /\/api\/cs\/intake/);
assert.match(urls, /PUBLIC_CS_PORTAL_URL/);

const catalogPage = read("platform/src/app/admin/docs/urls/page.tsx");
assert.match(catalogPage, /ORIGINAL_CRMP_ADMIN_URL/);
assert.match(catalogPage, /PUBLIC_CS_DESK_URL/);
assert.match(catalogPage, /PUBLIC_CS_DASHBOARD_URL/);
assert.match(catalogPage, /PUBLIC_CS_LOG_URL/);
assert.match(catalogPage, /PUBLIC_CS_PORTAL_URL/);

console.log("ok: CRMP Plus URL /PRD/crmp-plus; original CRMP Admin frozen at /PRD/crmp-admin");
