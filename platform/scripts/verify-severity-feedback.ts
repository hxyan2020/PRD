/**
 * Guardrails: P0–P3 severity re-recommend on Lark AI report + monthly weight pack.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const lib = read("src/lib/severity-feedback.ts");
assert.match(lib, /export function submitSeverityRecommendation/);
assert.match(lib, /export function getMonthlyWeightSuggestion/);
assert.match(lib, /export function applyMonthlyWeightSuggestion/);
assert.match(lib, /severity_feedback/);
assert.match(lib, /P0/);

const messenger = read("src/lib/messenger/demo.ts");
assert.match(messenger, /recommend_severity/);
assert.match(messenger, /submitSeverityRecommendation/);

const ui = read("src/components/DemoMessenger.tsx");
assert.match(ui, /msg-severity-recommend/);
assert.match(ui, /msg-sev-p\$\{lv\.p\}/);
assert.match(ui, /msg-sev-submit/);
assert.match(ui, /recommend_severity/);

const esc = read("src/components/EscalationManager.tsx");
assert.match(esc, /esc-severity-weight-pack/);
assert.match(esc, /esc-apply-severity-weights/);
assert.match(esc, /apply_severity_weights/);

const escApi = read("src/app/api/escalation/route.ts");
assert.match(escApi, /apply_severity_weights/);
assert.match(escApi, /getMonthlyWeightSuggestion/);

const aiPerf = read("src/components/AiPerformanceBoard.tsx");
assert.match(aiPerf, /ai-perf-severity-weights/);
assert.match(aiPerf, /severity_weight_pack/);

const admin = read("src/lib/ai/admin.ts");
assert.match(admin, /severity_weight_pack/);
assert.match(admin, /getMonthlyWeightSuggestion/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /msg\.severityRecommend/);
assert.match(i18n, /重新推薦嚴重度/);

const ug = read("docs/USER_GUIDE.md");
assert.match(ug, /Re-recommend severity \(P0–P3\)/);
assert.match(ug, /monthly severity weight pack/);
const ugZh = read("docs/USER_GUIDE.zh-Hant.md");
assert.match(ugZh, /重新推薦嚴重度（P0–P3）/);

const prd = read("docs/PRD.md");
assert.match(prd, /FR-39/);
const prdZh = read("docs/PRD.zh-Hant.md");
assert.match(prdZh, /FR-39/);

const tsd = read("docs/TSD.md");
assert.match(tsd, /recommend_severity/);
assert.match(tsd, /severity_feedback/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/severity-feedback-weights-28bc/);

console.log("ok: P0–P3 severity feedback + monthly escalation weight pack");
