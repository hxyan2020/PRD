/**
 * Guardrails: bilingual AI Incident Workspace (Monitor2 HTML prototype merge).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const html = read("public/prototypes/monitor2-ai-report.html");
assert.match(html, /INC-1028/);
assert.match(html, /XAUUSD/);
assert.match(html, /evidenceCatalog/);
assert.match(html, /mode:'static'/);
assert.match(html, /surface:DEFAULT_SURFACE/);
assert.match(html, /dict=\{[\s\S]*zh:\{/);
assert.match(html, /en:\{/);

const page = read("src/app/admin/ai-incident/page.tsx");
assert.match(page, /AiIncidentWorkspace/);

const board = read("src/components/AiIncidentWorkspace.tsx");
assert.match(board, /ai-incident-workspace/);
assert.match(board, /monitor2-ai-report\.html/);
assert.match(board, /ai-incident-iframe/);

const nav = read("src/lib/nav.ts");
assert.match(nav, /\/admin\/ai-incident/);

const i18n = read("src/lib/i18n.ts");
assert.match(i18n, /\/admin\/ai-incident/);
assert.match(i18n, /AI 事故工作台/);
assert.match(i18n, /"ai-incident"/);

const links = read("src/lib/monitor-deep-links.ts");
assert.match(links, /ai_incident/);
assert.match(links, /\/admin\/ai-incident/);

const messenger = read("src/lib/messenger/demo.ts");
assert.match(messenger, /ensureInc1028MessengerThread/);
assert.match(messenger, /THR-INC-1028/);
assert.match(messenger, /INC-1028/);

const urls = read("src/lib/docs/urls.ts");
assert.match(urls, /\/admin\/ai-incident/);
assert.match(urls, /E-01/);

const phrases = read("src/lib/i18n-phrases.ts");
assert.match(phrases, /"AI Incident Workspace": "AI 事故工作台"/);
assert.match(phrases, /INC-1028 LP-A XAUUSD/);

const wf = fs.readFileSync(path.join(repo, ".github/workflows/crmp-pages.yml"), "utf8");
assert.match(wf, /cursor\/ai-incident-workspace-a935/);

for (const [rel, markers] of [
  ["docs/USER_GUIDE.md", [/AI Incident Workspace/, /INC-1028/, /\/admin\/ai-incident/]],
  ["docs/USER_GUIDE.zh-Hant.md", [/AI 事故工作台/, /INC-1028/, /\/admin\/ai-incident/]],
  ["docs/CHANGELOG.md", [/AI Incident Workspace|ai-incident|INC-1028/]],
] as Array<[string, RegExp[]]>) {
  const src = read(rel);
  for (const m of markers) {
    assert.match(src, m, `${rel} missing ${m}`);
  }
}

console.log("ok: AI Incident Workspace (bilingual HTML prototype + INC-1028 demo)");
