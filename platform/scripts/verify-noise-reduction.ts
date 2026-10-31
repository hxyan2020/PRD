/**
 * Guardrails: bilingual Noise Reduction Lab (Monitor2 HTML prototype merge).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const html = read("public/prototypes/monitor2-noise-reduction.html");
assert.match(html, /SCENARIO_EN/);
assert.match(html, /STAGE_EN/);
assert.match(html, /cross:/);
assert.match(html, /critical:/);
assert.match(html, /P0/);
assert.match(html, /const UI=\{[\s\S]*zh:\{/);
assert.match(html, /en:\{/);
assert.match(html, /--brand:#0b6e6a/);
assert.match(html, /--vantage:#044855/);
assert.match(html, /Source Sans 3/);
assert.doesNotMatch(html, /font-family:Inter/);
assert.match(html, /html\.crmp-embed/);
assert.match(html, /繁中/);
assert.match(html, /降噪/);
assert.doesNotMatch(html, /报价/);
assert.match(html, /報價/);

const page = read("src/app/admin/noise-reduction/page.tsx");
assert.match(page, /NoiseReductionLab/);

const board = read("src/components/NoiseReductionLab.tsx");
assert.match(board, /noise-reduction-lab/);
assert.match(board, /monitor2-noise-reduction\.html/);
assert.match(board, /noise-reduction-iframe/);
assert.match(board, /embed=1/);
assert.match(board, /zh-Hant/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/monitor-labs/);
assert.doesNotMatch(nav, /href: \"\/admin\/noise-reduction\"/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /\/admin\/noise-reduction/);
assert.match(i18n, /降噪實驗室/);
assert.match(i18n, /"noise-reduction"/);

const links = read("src/lib/monitor-deep-links.ts");
assert.match(links, /noise_reduction/);
assert.match(links, /noise_labs_path|FOREX_INCIDENT_1028/);
const pack = read("src/lib/demo/forex-incident-1028.ts");
assert.match(pack, /noise_labs_path:.*noise-reduction/);

const urls = read("src/lib/docs/urls.ts");
assert.match(urls, /\/admin\/noise-reduction/);
assert.match(urls, /[Ss]ix scenarios/);

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /"Noise Reduction Lab": "降噪實驗室"/);
assert.match(phrases, /P0 bypass/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/noise-reduction-a935/);

const uatCases = read("src/lib/docs/uat-cases.ts");
assert.match(uatCases, /id: \"UAT-50\"/);
assert.match(uatCases, /Noise Reduction Lab/);
assert.match(uatCases, /降噪實驗室/);

const openIssues = read("src/lib/docs/open-issues.ts");
assert.match(openIssues, /Noise Reduction Lab/);
assert.match(openIssues, /降噪實驗室/);
assert.match(openIssues, /UAT-50/);

for (const [rel, markers] of [
  ["docs/USER_GUIDE.md", [/## 14D\. Noise Reduction Lab/, /\/admin\/noise-reduction/, /six scenarios|P0 bypass/]],
  ["docs/USER_GUIDE.zh-Hant.md", [/## 14D\. 降噪實驗室/, /\/admin\/noise-reduction/]],
  ["docs/PRD.md", [/### 6\.10 Noise Reduction Lab/, /UAT-50/, /\/admin\/noise-reduction/]],
  ["docs/PRD.zh-Hant.md", [/### 6\.10 降噪實驗室/, /UAT-50/, /\/admin\/noise-reduction/]],
  ["docs/TSD.md", [/### 11\.9 Noise Reduction Lab/, /\/admin\/noise-reduction/, /monitor2-noise-reduction\.html/]],
  ["docs/TSD.zh-Hant.md", [/### 11\.9 降噪實驗室/, /\/admin\/noise-reduction/, /monitor2-noise-reduction\.html/]],
  ["docs/UAT.md", [/UAT-50/, /Noise Reduction Lab/, /51 cases/]],
  ["docs/UAT.zh-Hant.md", [/UAT-50/, /降噪實驗室/, /51 案/]],
  ["docs/PROGRESS.md", [/Noise Reduction Lab/, /\/admin\/noise-reduction/, /UAT-50/]],
  ["docs/PROGRESS.zh-Hant.md", [/降噪實驗室/, /\/admin\/noise-reduction/, /UAT-50/]],
  ["docs/ROADMAP.md", [/Noise Reduction Lab/, /\/admin\/noise-reduction/]],
  ["docs/ROADMAP.zh-Hant.md", [/降噪實驗室/, /\/admin\/noise-reduction/]],
  ["docs/OPEN_ISSUES.md", [/Noise Reduction Lab/, /UAT-50/]],
  ["docs/OPEN_ISSUES.zh-Hant.md", [/降噪實驗室/, /UAT-50/]],
  ["docs/CHANGELOG.md", [/Noise Reduction|noise-reduction/, /UAT-50|§6\.10|§11\.9|§14D/]],
] as Array<[string, RegExp[]]>) {
  const src = read(rel);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing ${m}`);
  }
}

console.log("ok: Noise Reduction Lab (bilingual HTML prototype + docs EN/zh)");
