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
assert.match(ui, /msg-sev-confirm-accurate/);
assert.match(ui, /msg-monitor-surfaces/);
assert.match(ui, /SEVERITY_ACCURATE_CODE/);
assert.match(ui, /monitor2DeepLinks/);
assert.match(ui, /recommend_severity/);

const shared = read("src/lib/severity-formula-shared.ts");
assert.match(shared, /ai_accurate/);
assert.match(shared, /AI severity is accurate/);
assert.match(shared, /沒什麼不准/);

const deepLinks = read("src/lib/monitor-deep-links.ts");
assert.match(deepLinks, /export function monitor2DeepLinks/);
assert.match(deepLinks, /\/admin\/monitor-2/);
assert.match(deepLinks, /\/admin\/alerts/);
assert.match(deepLinks, /\/admin\/indicator-aggregation/);

assert.match(messenger, /monitor_links/);
assert.match(messenger, /monitor2DeepLinks/);
assert.match(messenger, /Monitor 2\.0 surfaces/);

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
assert.match(i18n, /嚴重度回饋/);
assert.match(i18n, /每月 P0–P3→因子權重組合/);
assert.match(i18n, /msg\.severityReasonCodes/);
assert.match(i18n, /msg\.severityAccurate/);
assert.match(i18n, /沒什麼不准/);
assert.match(i18n, /msg\.monitorSurfaces/);
assert.match(i18n, /Monitor 2\.0 可用介面/);
assert.match(i18n, /嚴重度公式迴路/);
assert.match(i18n, /公式迴路＋RO 核准/);

const m2page = read("src/app/admin/monitor-2/page.tsx");
assert.match(m2page, /monitor-2-focus-banner/);
assert.match(m2page, /focusMonitorId/);

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /P0–P3 嚴重度重推薦/);
assert.match(phrases, /每月 P0–P3→因子權重組合/);
assert.match(phrases, /確認 P0 — 權益回撤且 LP 報價過期/);
assert.match(phrases, /來自 Messenger AI_REPORT 卡的 P0–P3 重推薦/);
assert.match(phrases, /AI_REPORT Monitor 2\.0 surfaces \+ accurate severity confirm/);
assert.match(phrases, /AI_REPORT Monitor 2\.0 可用介面＋準確嚴重度確認/);
assert.match(phrases, /recommend_severity \(ai_accurate or P override/);
assert.match(phrases, /recommend_severity（ai_accurate 或 P 覆寫/);

const escUi = read("src/components/EscalationManager.tsx");
assert.match(escUi, /Phrase/);
assert.match(escUi, /每月嚴重度權重建議/);

const aiPerfUi = read("src/components/AiPerformanceBoard.tsx");
assert.match(aiPerfUi, /Phrase/);
assert.match(aiPerfUi, /P0–P3 嚴重度重推薦 → 每月因子權重/);

const ug = read("docs/USER_GUIDE.md");
assert.match(ug, /Severity feedback \(P0–P3\)/);
assert.match(ug, /Re-recommend severity/);
assert.match(ug, /AI severity is accurate/);
assert.match(ug, /ai_accurate/);
assert.match(ug, /Monitor 2\.0 surfaces/);
assert.match(ug, /monthly severity weight pack/);
assert.match(ug, /Severity formula loop \+ factor weights/);
const ugZh = read("docs/USER_GUIDE.zh-Hant.md");
assert.match(ugZh, /嚴重度回饋（P0–P3）/);
assert.match(ugZh, /重新推薦嚴重度/);
assert.match(ugZh, /沒什麼不准/);
assert.match(ugZh, /ai_accurate/);
assert.match(ugZh, /Monitor 2\.0 可用介面/);
assert.match(ugZh, /嚴重度公式迴路＋因子權重/);

const prd = read("docs/PRD.md");
assert.match(prd, /FR-39/);
assert.match(prd, /### 6\.7 Severity formula optimisation/);
assert.match(prd, /UAT-45/);
assert.match(prd, /UAT-47/);
const prdZh = read("docs/PRD.zh-Hant.md");
assert.match(prdZh, /FR-39/);
assert.match(prdZh, /### 6\.7 嚴重度公式優化/);

const tsd = read("docs/TSD.md");
assert.match(tsd, /recommend_severity/);
assert.match(tsd, /severity_feedback/);
assert.match(tsd, /### 11\.6 Severity formula optimisation loop/);
assert.match(tsd, /SEVERITY_FORMULA/);
const tsdZh = read("docs/TSD.zh-Hant.md");
assert.match(tsdZh, /### 11\.6 嚴重度公式優化迴路/);
assert.match(tsdZh, /SEVERITY_FORMULA/);

const uat = read("docs/UAT.md");
assert.match(uat, /UAT-45 — P0–P3 severity re-recommend/);
assert.match(uat, /Monitor 2\.0 surfaces/);
assert.match(uat, /AI severity is accurate/);
assert.match(uat, /UAT-47 — Severity formula loop/);
assert.match(uat, /UAT-46 — Risk Owner exit sign-off/);
const uatZh = read("docs/UAT.zh-Hant.md");
assert.match(uatZh, /UAT-45 — P0–P3 嚴重度重推薦/);
assert.match(uatZh, /Monitor 2\.0 可用介面/);
assert.match(uatZh, /AI 嚴重度準確/);
assert.match(uatZh, /UAT-47 — 嚴重度公式迴路/);
assert.match(uatZh, /UAT-46 — 風險負責人退出簽核/);
const uatCases = read("src/lib/docs/uat-cases.ts");
assert.match(uatCases, /id: "UAT-45"/);
assert.match(uatCases, /id: "UAT-46"/);
assert.match(uatCases, /id: "UAT-47"/);
assert.match(uatCases, /severity re-recommend feeds monthly factor-weight pack/);
assert.match(uatCases, /AI severity is accurate/);
assert.match(uatCases, /AI 嚴重度準確/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/severity-feedback-weights-28bc/);

console.log("ok: P0–P3 severity feedback + monthly escalation weight pack");
