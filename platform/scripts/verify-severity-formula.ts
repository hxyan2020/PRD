/**
 * Guardrails: severity formula loop — reason codes, weekly AI recommend, RO approve.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const formula = read("src/lib/severity-formula.ts");
assert.match(formula, /export function getLiveSeverityFormula/);
assert.match(formula, /export function getWeeklyFormulaSuggestion/);
assert.match(formula, /export function proposeWeeklyFormulaChange/);
assert.match(formula, /SEVERITY_REASON_CODES/);
assert.match(formula, /scoreSeverityFormula/);
assert.match(formula, /seedSeverityFormulaLoop/);

const feedback = read("src/lib/severity-feedback.ts");
assert.match(feedback, /reason_codes_json/);
assert.match(feedback, /week_key/);

const admin = read("src/lib/ai/admin.ts");
assert.match(admin, /SEVERITY_FORMULA/);
assert.match(admin, /severity_formula_weekly/);

const escApi = read("src/app/api/escalation/route.ts");
assert.match(escApi, /propose_severity_formula/);
assert.match(escApi, /severity_formula/);

const board = read("src/components/SeverityFormulaBoard.tsx");
assert.match(board, /sev-formula-loop/);
assert.match(board, /sev-formula-ro-approve/);
assert.match(board, /sev-formula-propose/);

const msg = read("src/components/DemoMessenger.tsx");
assert.match(msg, /msg-sev-reason-codes/);
assert.match(msg, /SEVERITY_REASON_CODES/);
assert.match(msg, /reason_codes/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /msg\.severityReasonCodes/);
assert.match(i18n, /嚴重度為何不準/);
assert.match(i18n, /公式迴路＋RO 核准/);

const aiPerf = read("src/components/AiPerformanceBoard.tsx");
assert.match(aiPerf, /ai-perf-severity-formula/);

const escPage = read("src/app/admin/escalation/page.tsx");
assert.match(escPage, /SeverityFormulaBoard/);
assert.match(escPage, /seedSeverityFormulaLoop/);

const prd = read("docs/PRD.md");
assert.match(prd, /Severity formula optimisation/);
assert.match(prd, /sev-formula-loop/);
const prdZh = read("docs/PRD.zh-Hant.md");
assert.match(prdZh, /嚴重度公式優化/);
assert.match(prdZh, /sev-formula-loop/);

const uat = read("src/lib/docs/uat-cases.ts");
assert.match(uat, /id: "UAT-47"/);
assert.match(uat, /Severity formula loop/);

const wf = fs.readFileSync(path.join(root, "..", ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/severity-formula-ro-approve-28bc/);

console.log("ok: severity formula loop (reason codes → weekly recommend → RO approve)");
