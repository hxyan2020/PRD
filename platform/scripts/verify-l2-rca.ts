/**
 * Guardrails: bilingual Discovery → L2 → AI RCA lab + natural handoff to AI Incident Workspace.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const html = read("public/prototypes/monitor2-discovery-l2-rca.html");
assert.match(html, /INC-1028/);
assert.match(html, /\/admin\/ai-incident/);
assert.match(html, /l2-open-ai-rca|openAiRca/);
assert.match(html, /crmp-embed/);
assert.match(html, /繁中/);
assert.match(html, /--brand:#0b6e6a/);
assert.match(html, /Source Sans 3/);
assert.doesNotMatch(html, /font-family:Inter/);
assert.match(html, /未知風險發現|Unknown-risk discovery/);
assert.doesNotMatch(html, /发现/);
assert.match(html, /報價|quote/i);

const page = read("src/app/admin/l2-rca/page.tsx");
assert.match(page, /DiscoveryL2RcaLab/);

const board = read("src/components/DiscoveryL2RcaLab.tsx");
assert.match(board, /discovery-l2-rca-lab/);
assert.match(board, /monitor2-discovery-l2-rca\.html/);
assert.match(board, /discovery-l2-rca-iframe/);
assert.match(board, /embed:\s*[\"']1[\"']/);
assert.match(board, /\/admin\/ai-incident/);

const agg = read("src/components/IndicatorAggregationBoard.tsx");
assert.match(agg, /indicator-agg-open-ai-rca/);
assert.match(agg, /\/admin\/ai-incident/);
assert.match(agg, /\/admin\/l2-rca/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/l2-rca/);
assert.match(nav, /GitMerge/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /\/admin\/l2-rca/);
assert.match(i18n, /L2 → AI RCA 實驗室/);
assert.match(i18n, /"l2-rca"/);

const links = read("src/lib/monitor-deep-links.ts");
assert.match(links, /l2_rca/);
assert.match(links, /\/admin\/l2-rca/);

const urls = read("src/lib/docs/urls.ts");
assert.match(urls, /\/admin\/l2-rca/);
assert.match(urls, /INC-1028/);

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /"L2 → AI RCA Lab": "L2 → AI RCA 實驗室"/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/l2-rca-a935/);

const uatCases = read("src/lib/docs/uat-cases.ts");
assert.match(uatCases, /id: \"UAT-51\"/);
assert.match(uatCases, /L2 → AI RCA Lab/);
assert.match(uatCases, /L2 → AI RCA 實驗室/);

const openIssues = read("src/lib/docs/open-issues.ts");
assert.match(openIssues, /L2 → AI RCA Lab/);
assert.match(openIssues, /UAT-51/);

for (const [rel, markers] of [
  ["docs/USER_GUIDE.md", [/## 14E\. L2 → AI RCA Lab/, /\/admin\/l2-rca/, /INC-1028/]],
  ["docs/USER_GUIDE.zh-Hant.md", [/## 14E\. L2 → AI RCA 實驗室/, /\/admin\/l2-rca/, /INC-1028/]],
  ["docs/PRD.md", [/### 6\.11 L2 → AI RCA Lab/, /UAT-51/, /\/admin\/l2-rca/]],
  ["docs/PRD.zh-Hant.md", [/### 6\.11 L2 → AI RCA 實驗室/, /UAT-51/, /\/admin\/l2-rca/]],
  ["docs/TSD.md", [/### 11\.10 L2 → AI RCA Lab/, /\/admin\/l2-rca/, /monitor2-discovery-l2-rca\.html/]],
  ["docs/TSD.zh-Hant.md", [/### 11\.10 L2 → AI RCA 實驗室/, /\/admin\/l2-rca/, /monitor2-discovery-l2-rca\.html/]],
  ["docs/UAT.md", [/UAT-51/, /L2 → AI RCA Lab/, /51 cases/]],
  ["docs/UAT.zh-Hant.md", [/UAT-51/, /L2 → AI RCA 實驗室/, /51 案/]],
  ["docs/PROGRESS.md", [/L2 → AI RCA Lab/, /\/admin\/l2-rca/, /UAT-51/]],
  ["docs/PROGRESS.zh-Hant.md", [/L2 → AI RCA 實驗室/, /\/admin\/l2-rca/, /UAT-51/]],
  ["docs/ROADMAP.md", [/L2 → AI RCA Lab/, /\/admin\/l2-rca/]],
  ["docs/ROADMAP.zh-Hant.md", [/L2 → AI RCA 實驗室/, /\/admin\/l2-rca/]],
  ["docs/OPEN_ISSUES.md", [/L2 → AI RCA Lab/, /UAT-51/]],
  ["docs/OPEN_ISSUES.zh-Hant.md", [/L2 → AI RCA 實驗室/, /UAT-51/]],
  ["docs/CHANGELOG.md", [/L2 → AI RCA|l2-rca|Discovery/, /UAT-51|§6\.11|§11\.10|§14E/]],
] as Array<[string, RegExp[]]>) {
  const src = read(rel);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing ${m}`);
  }
}

console.log("ok: L2 → AI RCA Lab (bilingual HTML + L2 handoff to INC-1028 + docs EN/zh)");
