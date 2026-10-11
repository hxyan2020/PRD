/**
 * Guardrails: CRMP Admin unknown-risk discovery page with notebook-parity AI card.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const board = read("src/components/DiscoverySuggestionBoard.tsx");
assert.match(board, /Analyse selected|分析所選/);
assert.match(board, /Approve for validation|核准進入驗證/);
assert.match(board, /Ask for more info|要求更多資訊/);
assert.match(board, /Disconnect \/ Mock|中斷／Mock/);
assert.match(board, /Connect OpenAI/);
assert.match(board, /discovery-suggestion-card/);
assert.match(board, /RISK_DISCOVERY_NOTEBOOK/);

const analyse = read("src/lib/ai/discovery-analyse.ts");
assert.match(analyse, /deterministicSuggestion/);
assert.match(analyse, /enableDiscoveryOpenAi/);
assert.match(analyse, /OPENAI_API_KEY/);

const nextCfg = read("next.config.ts");
assert.match(nextCfg, /crmp-admin/);
assert.doesNotMatch(nextCfg, /crmp-plus/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/discovery/);

const ug = read("docs/USER_GUIDE.md");
assert.match(ug, /Unknown Risk Discovery/);
assert.match(ug, /Isolation Forest/);
const ugZh = read("docs/USER_GUIDE.zh-Hant.md");
assert.match(ugZh, /未知風險探索/);
assert.match(ugZh, /孤立森林/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /crmp-admin/);
assert.match(wf, /cursor\/risk-discovery-admin-28bc|cursor\/crmp-admin-pages-a935/);

console.log("ok: CRMP Admin discovery AI suggestion card + notebook parity + docs EN/ZH");
