/**
 * Guardrails: threshold adjustment full-flow demo on Monitor 2.0 / home / improve.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const shared = read("src/lib/threshold-flow-shared.ts");
assert.match(shared, /THRESHOLD_FLOW_STAGES/);
assert.match(shared, /OBSERVE/);
assert.match(shared, /AI_SUGGEST/);
assert.match(shared, /DRAFT_CR/);
assert.match(shared, /MAKER_CHECKER/);
assert.match(shared, /APPLY_M2/);
assert.match(shared, /AUDIT/);
assert.match(shared, /門檻調整全流程/);

const demo = read("src/components/ThresholdAdjustmentFlowDemo.tsx");
assert.match(demo, /threshold-flow-demo/);
assert.match(demo, /threshold-flow-auto/);
assert.match(demo, /THRESHOLD_FLOW_STAGES/);
assert.match(demo, /from \"@\/lib\/threshold-flow-shared\"/);
assert.doesNotMatch(demo, /from \"@\/lib\/db\"/);

const m2 = read("src/app/admin/monitor-2/page.tsx");
assert.match(m2, /ThresholdAdjustmentFlowDemo/);

const home = read("src/app/admin/page.tsx");
assert.match(home, /ThresholdAdjustmentFlowDemo/);

const editor = read("src/components/IndicatorThresholdEditor.tsx");
assert.match(editor, /threshold-flow-demo/);
assert.match(editor, /Step 5 of threshold flow|門檻流程第 5 步/);

const improve = read("src/components/AiImprovementPanel.tsx");
assert.match(improve, /imp-threshold-flow-link/);
assert.match(improve, /monitor-2#threshold-flow-demo/);

const api = read("src/app/api/monitor/route.ts");
assert.match(api, /update_thresholds/);
assert.match(api, /UPDATE_THRESHOLDS/);

for (const [rel, markers] of [
  ["docs/USER_GUIDE.md", [/threshold-flow-demo/, /Threshold adjustment full flow/]],
  ["docs/USER_GUIDE.zh-Hant.md", [/threshold-flow-demo/, /門檻調整全流程/]],
  ["docs/TSD.md", [/ThresholdAdjustmentFlowDemo/, /threshold-flow-shared/]],
  ["docs/TSD.zh-Hant.md", [/ThresholdAdjustmentFlowDemo/, /threshold-flow-shared/]],
  ["docs/PRD.md", [/Threshold adjustment flow/]],
  ["docs/PRD.zh-Hant.md", [/門檻調整/]],
  ["docs/CHANGELOG.md", [/threshold full-flow/]],
  ["docs/PROGRESS.md", [/threshold adjustment full-flow|threshold full-flow/]],
  ["docs/PROGRESS.zh-Hant.md", [/門檻調整全流程|門檻全流程/]],
] as Array<[string, RegExp[]]>) {
  const src = read(rel);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing ${m}`);
  }
}

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /threshold adjustment full-flow demo/);
assert.match(phrases, /門檻調整全流程演示/);
assert.match(phrases, /L1→L2 aggregation demo \+ threshold adjustment full-flow demo/);
assert.match(phrases, /L1→L2 聚合演示＋門檻調整全流程演示/);

console.log("ok: threshold adjustment full-flow demo");
