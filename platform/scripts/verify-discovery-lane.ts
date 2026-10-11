/**
 * Guardrails for the parallel unknown-risk discovery lane.
 * Ensures discovery stays beside the main DETECT→DASHBOARD spine and
 * RO approval promotes via maker≠checker (AI Engineer propose → RO decide).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const discovery = read("src/lib/ai/discovery.ts");
assert.match(discovery, /APPROVE_FOR_MONITORING/);
assert.match(discovery, /APPROVE_FOR_VALIDATION/);
assert.match(discovery, /proposeChange/);
assert.match(discovery, /decideChangeRequest/);
assert.match(discovery, /ai\.engineer@vantagemarkets\.com/);
assert.match(discovery, /DISCOVERY_PROMOTE/);
assert.match(discovery, /Maker\/checker/);

const admin = read("src/lib/ai/admin.ts");
assert.match(admin, /DISCOVERY_PROMOTE/);
assert.match(admin, /applyDiscoveryPromote/);

const spine = read("src/lib/ai/spine.ts");
assert.match(spine, /DISCOVER/);
assert.match(spine, /DISCOVERY_REVIEW/);
assert.match(spine, /DISCOVERY_PROMOTE/);

const monitorApi = read("src/app/api/monitor/route.ts");
assert.match(monitorApi, /runDiscoveryParallel/);
assert.match(monitorApi, /PARALLEL_DETECTORS/);
assert.match(monitorApi, /run_discovery/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/discovery/);
assert.match(nav, /Unknown Risk Discovery/);

const home = read("src/app/admin/page.tsx");
assert.match(home, /HomeDiscoveryLane/);
assert.match(home, /HomeSpineViz/);

const board = read("src/components/DiscoveryBoard.tsx");
assert.match(board, /Approve for monitoring/);
assert.match(board, /maker ≠ checker/);

console.log("ok: discovery lane parallel to spine; RO approve → skill+monitor via maker≠checker");
