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
assert.match(lib, /export function forceAggregateIncomplete/);
assert.match(lib, /export function continuePostL2Flow/);
assert.match(lib, /seedAggregationDemosIfEmpty/);
assert.match(lib, /CORRELATED_WAIT/);
assert.match(lib, /FORCE_AGGREGATED/);

const shared = read("src/lib/indicator-aggregation-shared.ts");
assert.match(shared, /LINEAR_AGGREGATION_STEPS/);
assert.match(shared, /AGGREGATE_READY/);
assert.match(shared, /FORCE_AGGREGATED/);
assert.match(shared, /L1_L2_LABELS/);
assert.match(shared, /POST_L2_FLOW_STAGES/);
assert.match(shared, /export function computeL2Severity/);
assert.match(shared, /L2_SEVERITY/);
assert.match(shared, /max\(L1\)/);

const board = read("src/components/IndicatorAggregationBoard.tsx");
assert.match(board, /indicator-agg-board/);
assert.match(board, /indicator-agg-linear-steps/);
assert.match(board, /indicator-agg-force/);
assert.match(board, /indicator-agg-l2-severity/);
assert.match(board, /from \"@\/lib\/indicator-aggregation-shared\"/);
assert.doesNotMatch(board, /from \"@\/lib\/indicator-aggregation\"/);

const homeDemo = read("src/components/HomeL1L2AggregationDemo.tsx");
assert.match(homeDemo, /home-l1-l2-demo/);
assert.match(homeDemo, /home-l1-l2-force/);
assert.match(homeDemo, /home-l2-severity-calc/);
assert.match(homeDemo, /computeL2Severity/);
assert.match(homeDemo, /L1_L2_LABELS/);

assert.match(lib, /applyL2Severity|computeL2Severity/);
assert.match(lib, /l2_severity_calc/);

const homePage = read("src/app/admin/page.tsx");
assert.match(homePage, /HomeL1L2AggregationDemo/);

const api = read("src/app/api/indicator-aggregation/route.ts");
assert.match(api, /inject_related/);
assert.match(api, /close_window/);
assert.match(api, /force_aggregate/);
assert.match(api, /continue_post_flow/);

const page = read("src/app/admin/indicator-aggregation/page.tsx");
assert.match(page, /IndicatorAggregationBoard/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/indicator-aggregation/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /indicator-aggregation/);
assert.match(i18n, /指標聚合流程/);

const urls = read("src/lib/docs/urls.ts");
assert.match(urls, /\/admin\/indicator-aggregation/);
assert.match(urls, /\/api\/indicator-aggregation/);

const uatCases = read("src/lib/docs/uat-cases.ts");
assert.match(uatCases, /id: \"UAT-48\"/);
assert.match(uatCases, /\/admin\/indicator-aggregation/);
assert.match(uatCases, /title: \"指標聚合：成員資格/);
assert.match(uatCases, /FORCE_AGGREGATED/);
assert.match(uatCases, /dependency_zh: \"UAT-02；指標聚合已種子\"/);
assert.match(uatCases, /covers_zh: \[\"指標聚合流程\"/);

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /\"Indicator Aggregation Flow\": \"指標聚合流程\"/);
assert.match(phrases, /\"Indicator Aggregation API\": \"指標聚合 API\"/);

const openIssuesTs = read("src/lib/docs/open-issues.ts");
assert.match(openIssuesTs, /Indicator Aggregation linear flow/);
assert.match(openIssuesTs, /指標聚合線型流程/);

for (const [rel, markers] of [
  ["docs/PRD.md", [/FR-40/, /### 6\.8 Indicator aggregation/, /UAT-48/]],
  ["docs/PRD.zh-Hant.md", [/FR-40/, /### 6\.8 指標聚合線型流程/, /UAT-48/]],
  ["docs/USER_GUIDE.md", [/## 14B\. Indicator Aggregation Flow/, /\/admin\/indicator-aggregation/]],
  ["docs/USER_GUIDE.zh-Hant.md", [/## 14B\. 指標聚合流程/, /\/admin\/indicator-aggregation/]],
  ["docs/TSD.md", [/### 11\.7 Indicator aggregation linear flow/]],
  ["docs/TSD.zh-Hant.md", [/### 11\.7 指標聚合線型流程/]],
  ["docs/UAT.md", [/UAT-48/, /force-aggregate/, /FORCE_AGGREGATED/, /L2 severity/, /48 cases/]],
  ["docs/UAT.zh-Hant.md", [/UAT-48/, /強制聚合/, /FORCE_AGGREGATED/, /L2 嚴重度/, /48 案/]],
  ["docs/ROADMAP.md", [/Indicator Aggregation/, /FR-40|indicator-aggregation/]],
  ["docs/ROADMAP.zh-Hant.md", [/指標聚合/, /FR-40|indicator-aggregation/]],
  ["docs/ECOSYSTEM.md", [/Indicator Aggregation/, /correlated monitors|Aggregation/]],
  ["docs/ECOSYSTEM.zh-Hant.md", [/指標聚合/, /關聯監控|聚合/]],
  ["docs/OPEN_ISSUES.md", [/Indicator Aggregation linear flow/, /FR-40/]],
  ["docs/OPEN_ISSUES.zh-Hant.md", [/指標聚合線型流程/, /FR-40/]],
  ["docs/PROGRESS.md", [/Indicator Aggregation/, /FR-40/]],
  ["docs/PROGRESS.zh-Hant.md", [/指標聚合/, /FR-40/]],
  ["docs/CHANGELOG.md", [/Indicator aggregation linear flow/, /FR-40/, /UAT-48/]],
] as Array<[string, RegExp[]]>) {
  const src = read(rel);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing ${m}`);
  }
}

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/indicator-aggregation-flow-28bc/);

console.log("ok: indicator aggregation linear flow (FR-40) + docs parity");
