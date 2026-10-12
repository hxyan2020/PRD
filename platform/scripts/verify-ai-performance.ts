/**
 * Guardrails: AI Performance eval board wired (lib, page, API, nav, i18n, docs).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const admin = read("src/lib/ai/admin.ts");
assert.match(admin, /export function getAiPerformanceEval/);
assert.match(admin, /challenge_agree_rate/);
assert.match(admin, /training_avg_f1/);

const board = read("src/components/AiPerformanceBoard.tsx");
assert.match(board, /data-testid="ai-performance-board"/);
assert.match(board, /ai-perf-kpis/);
assert.match(board, /AI 績效評估/);
assert.match(board, /AI performance evaluation/);

const page = read("src/app/admin/ai-performance/page.tsx");
assert.match(page, /getAiPerformanceEval/);
assert.match(page, /AiPerformanceBoard/);
assert.match(page, /pageKey="ai-performance"/);

const api = read("src/app/api/ai-performance/route.ts");
assert.match(api, /getAiPerformanceEval/);

const aiAdminApi = read("src/app/api/ai-admin/route.ts");
assert.match(aiAdminApi, /tab === "performance"/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/ai-performance/);
assert.match(nav, /AI Performance/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /"\/admin\/ai-performance"/);
assert.match(i18n, /"ai-performance"/);
assert.match(i18n, /AI 績效/);

const urls = read("src/lib/docs/urls.ts");
assert.match(urls, /\/admin\/ai-performance/);
assert.match(urls, /\/api\/ai-performance/);

for (const [rel, markers] of [
  ["docs/USER_GUIDE.md", [/8\.2A AI Performance/, /\/admin\/ai-performance/, /test:audit/]],
  ["docs/USER_GUIDE.zh-Hant.md", [/8\.2A AI 績效/, /\/admin\/ai-performance/, /test:audit/]],
  ["docs/PRD.md", [/FR-38/, /### 6\.6 AI Performance/, /mutation coverage/]],
  ["docs/PRD.zh-Hant.md", [/FR-38/, /### 6\.6 AI 績效/, /變更覆蓋/]],
  ["docs/TSD.md", [/## 8A\. AI Performance/, /getAiPerformanceEval/, /test:audit/]],
  ["docs/TSD.zh-Hant.md", [/## 8A\. AI 績效/, /getAiPerformanceEval/, /test:audit/]],
  ["docs/UAT.md", [/AI Performance/, /\/admin\/ai-performance/, /LOGIN_FAILED/]],
  ["docs/UAT.zh-Hant.md", [/AI 績效/, /\/admin\/ai-performance/, /LOGIN_FAILED/]],
  ["docs/ROADMAP.md", [/AI Performance/, /audit mutation coverage/]],
  ["docs/ROADMAP.zh-Hant.md", [/AI 績效/, /稽核變更覆蓋/]],
  ["docs/OPEN_ISSUES.md", [/AI Performance evaluation board/, /Mutation coverage guards/]],
  ["docs/OPEN_ISSUES.zh-Hant.md", [/AI 績效評估看板/, /變更覆蓋守護/]],
  ["docs/ECOSYSTEM.md", [/AI Performance/, /mutation coverage/]],
  ["docs/ECOSYSTEM.zh-Hant.md", [/AI 績效/, /變更覆蓋/]],
  ["docs/PROGRESS.md", [/AI Performance/, /mutation coverage/]],
  ["docs/PROGRESS.zh-Hant.md", [/AI 績效/, /變更覆蓋/]],
  ["docs/CHANGELOG.md", [/AI Performance/, /Audit mutation coverage/]],
] as Array<[string, RegExp[]]>) {
  const src = read(rel);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing ${m}`);
  }
}

console.log("ok: AI Performance evaluation board wiring + docs");
