/**
 * Guardrails: indicator aggregation linear flow (FR-40).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const lib = read("src/lib/indicator-aggregation.ts");
assert.match(lib, /export function startAggregationSession/);
assert.match(lib, /export function injectRelatedAlert/);
assert.match(lib, /export function closeWaitWindowAsSingle/);
assert.match(lib, /seedAggregationDemosIfEmpty/);
assert.match(lib, /CORRELATED_WAIT/);

const shared = read("src/lib/indicator-aggregation-shared.ts");
assert.match(shared, /LINEAR_AGGREGATION_STEPS/);
assert.match(shared, /AGGREGATE_READY/);

const board = read("src/components/IndicatorAggregationBoard.tsx");
assert.match(board, /indicator-agg-board/);
assert.match(board, /indicator-agg-linear-steps/);
assert.match(board, /from \"@\/lib\/indicator-aggregation-shared\"/);
assert.doesNotMatch(board, /from \"@\/lib\/indicator-aggregation\"/);

const api = read("src/app/api/indicator-aggregation/route.ts");
assert.match(api, /inject_related/);
assert.match(api, /close_window/);

const page = read("src/app/admin/indicator-aggregation/page.tsx");
assert.match(page, /IndicatorAggregationBoard/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/indicator-aggregation/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /indicator-aggregation/);
assert.match(i18n, /指標聚合流程/);

const prd = read("docs/PRD.md");
assert.match(prd, /FR-40/);
assert.match(prd, /### 6\.8 Indicator aggregation/);
const prdZh = read("docs/PRD.zh-Hant.md");
assert.match(prdZh, /FR-40/);
assert.match(prdZh, /### 6\.8 指標聚合線型流程/);

const ug = read("docs/USER_GUIDE.md");
assert.match(ug, /## 14B\. Indicator Aggregation Flow/);
const ugZh = read("docs/USER_GUIDE.zh-Hant.md");
assert.match(ugZh, /## 14B\. 指標聚合流程/);

const tsd = read("docs/TSD.md");
assert.match(tsd, /### 11\.7 Indicator aggregation linear flow/);
const tsdZh = read("docs/TSD.zh-Hant.md");
assert.match(tsdZh, /### 11\.7 指標聚合線型流程/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/indicator-aggregation-flow-28bc/);

console.log("ok: indicator aggregation linear flow (FR-40)");
