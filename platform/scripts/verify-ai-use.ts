/**
 * AI Use Manual (EN + zh-Hant) literacy handbook for Risk + CS/TR.
 * Run: npx tsx scripts/verify-ai-use.ts
 */
import fs from "node:fs";
import path from "node:path";
import { NAV_I18N } from "../src/lib/i18n";
import { NAV_ITEMS } from "../src/lib/nav";
import { PLATFORM_URLS } from "../src/lib/docs/urls";
import { OPEN_ISSUES, CS_TR_OPEN_ISSUE_CATALOGUE, CS_TR_PROGRESS_FUNCTIONS } from "../src/lib/docs/open-issues";
import { UAT_CASES } from "../src/lib/docs/uat-cases";
import { mermaidToHtml } from "../src/lib/docs-mermaid";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const en = read("docs/AI_USE.md");
const zh = read("docs/AI_USE.zh-Hant.md");
assert(en.length > 4000, "AI_USE.md too short");
assert(zh.length > 4000, "AI_USE.zh-Hant.md too short");
assert(en.includes("CRMP-AIU-001"), "EN doc id");
assert(zh.includes("CRMP-AIU-001"), "zh doc id");

const both = [
  "LLM",
  "MCP",
  "RAG",
  "EXECUTED_MOCK",
  "hallucination",
  "challenger",
  "maker",
  "SKILL-CS-CLARIFY",
  "SKILL-TR-EXECUTION",
  "RM-03",
  "RM-04",
  "/admin/docs/ai-use",
  "/PRD/crmp-plus/",
  "/PRD/crmp-admin/",
  "```mermaid",
  "get_client_exposure",
  "Gateway",
  "Production DB",
];
for (const needle of both) {
  assert(en.includes(needle), `EN missing ${needle}`);
  assert(zh.includes(needle) || needle === "hallucination" || needle === "challenger" || needle === "maker", `zh missing ${needle}`);
}
assert(zh.includes("幻覺"), "zh hallucination");
assert(zh.includes("挑戰者"), "zh challenger");
assert(zh.includes("代理"), "zh agent");
assert(zh.includes("技能"), "zh skill");
assert(zh.includes("模型上下文協定") || zh.includes("MCP"), "zh MCP");
assert(zh.includes("具名函式"), "zh named function");
assert(zh.includes("閘道"), "zh gateway");
assert(en.includes("LLM → SQL → Production DB"), "EN forbidden SQL path");
assert(zh.includes("LLM → SQL → Production DB"), "zh forbidden SQL path");
assert(en.includes("Gateway checks permission"), "EN gateway permission path");
assert(zh.includes("Gateway 檢查 permission"), "zh gateway permission path");
assert(en.includes("## 6. How AI talks to the database"), "EN DB gateway how-to");
assert(zh.includes("## 6. AI 怎麼問資料庫"), "zh DB gateway how-to");
assert(en.includes("## 7. How to use AI — Risk Management"), "EN risk how-to");
assert(zh.includes("## 7. 怎麼用 AI — 風險管理"), "zh risk how-to");
assert(en.includes("## 8. How to use AI — CS / TR"), "EN CS how-to");
assert(zh.includes("## 8. 怎麼用 AI — CS／TR"), "zh CS how-to");
assert(en.includes("## 11. Where AI goes wrong"), "EN failure modes");
assert(zh.includes("## 11. AI 會在哪裡出錯"), "zh failure modes");
assert(en.includes("## 12. Detect, correct, prevent"), "EN detect");
assert(zh.includes("## 12. 偵測、改正、預防"), "zh detect");
assert((en.match(/```mermaid/g) || []).length >= 11, "EN mermaid count");
assert((zh.match(/```mermaid/g) || []).length >= 11, "zh mermaid count");

const mermaidBlocks = [...en.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
assert(mermaidBlocks.length >= 11, "parsed EN mermaid");
for (const [i, src] of mermaidBlocks.entries()) {
  const html = mermaidToHtml(src);
  assert(html.includes("<svg"), `EN mermaid ${i} renders svg`);
  assert(!html.includes("Empty"), `EN mermaid ${i} not empty`);
}
const zhBlocks = [...zh.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
for (const [i, src] of zhBlocks.entries()) {
  const html = mermaidToHtml(src);
  assert(html.includes("<svg"), `zh mermaid ${i} renders svg`);
}

const docsTs = read("src/lib/docs.ts");
assert(docsTs.includes('"AI_USE"') || docsTs.includes("| \"AI_USE\"") || docsTs.includes("| \"AI_USE\""), "DocId AI_USE");
assert(docsTs.includes("AI_USE.md"), "DOC_FILES AI_USE");

const nav = NAV_ITEMS.find((i) => i.href === "/admin/docs/ai-use");
assert(nav, "NAV_ITEMS ai-use");
assert(nav.group === "docs", "AI Use Manual sits in the Docs left-nav group");
assert(NAV_I18N["/admin/docs/ai-use"]?.["zh-Hant"] === "AI 使用手冊", "NAV_I18N zh");

assert(PLATFORM_URLS.some((u) => u.path === "/admin/docs/ai-use"), "URL catalog row");

const page = read("src/app/admin/docs/ai-use/page.tsx");
assert(page.includes('docId="AI_USE"'), "page DocArticlePage");
assert(page.includes("CRMP-AIU-001"), "page badge");

const view = read("src/components/DocArticleView.tsx");
assert(view.includes("AI_USE:"), "DocArticleView META");

const store = read("src/lib/docs/edit-store.ts");
assert(store.includes('"AI_USE"'), "edit-store key");
const client = read("src/lib/docs/edit-client.ts");
assert(client.includes("| \"AI_USE\"") || client.includes('"AI_USE"'), "edit-client key");

const home = read("src/app/admin/page.tsx");
assert(home.includes('href="/admin/docs/ai-use"'), "home CTA");

const desk = read("src/components/CsTrDesk.tsx");
assert(desk.includes("/admin/docs/ai-use"), "CS desk handbook link");

const aiAdmin = read("src/app/admin/ai-admin/page.tsx");
assert(aiAdmin.includes("/admin/docs/ai-use"), "AI Admin handbook link");

const uat17 = UAT_CASES.find((c) => c.id === "UAT-17");
assert(uat17?.covers.includes("AI Use Manual"), "UAT-17 covers AI Use Manual");
assert(uat17?.en.steps.some((s) => s.includes("/admin/docs/ai-use")), "UAT-17 EN step");
assert(uat17?.zh.steps.some((s) => s.includes("/admin/docs/ai-use")), "UAT-17 zh step");

const oi15 = OPEN_ISSUES.find((i) => i.id === "OI-15");
assert(oi15?.checklist.some((c) => c.done && c.en.includes("AI Use Manual")), "OI-15 AI Use ticked");

const cat15 = CS_TR_OPEN_ISSUE_CATALOGUE.find((r) => r.id === "OI-15");
assert(cat15?.shippedEn.includes("CRMP-AIU-001"), "OI-15 catalogue shipped handbook");

const fnDocs = CS_TR_PROGRESS_FUNCTIONS.find((r) => r.id === "fn-docs");
assert(fnDocs?.proofEn.includes("CRMP-AIU-001"), "fn-docs proof handbook");

const docs: [string, string[]][] = [
  ["docs/USER_GUIDE.md", ["/admin/docs/ai-use", "AI Use Manual", "CRMP-AIU-001"]],
  ["docs/USER_GUIDE.zh-Hant.md", ["/admin/docs/ai-use", "AI 使用手冊", "CRMP-AIU-001"]],
  ["docs/PRD.md", ["FR-48", "AI Use Manual"]],
  ["docs/PRD.zh-Hant.md", ["FR-48", "AI 使用手冊"]],
  ["docs/TSD.md", ["ai-use", "CRMP-AIU-001"]],
  ["docs/TSD.zh-Hant.md", ["ai-use", "CRMP-AIU-001"]],
  ["docs/UAT.md", ["AI Use Manual", "/admin/docs/ai-use"]],
  ["docs/UAT.zh-Hant.md", ["AI 使用手冊", "/admin/docs/ai-use"]],
  ["docs/OPEN_ISSUES.md", ["CRMP-AIU-001", "AI Use Manual"]],
  ["docs/OPEN_ISSUES.zh-Hant.md", ["CRMP-AIU-001", "AI 使用手冊"]],
  ["docs/PROGRESS.md", ["CRMP-AIU-001"]],
  ["docs/PROGRESS.zh-Hant.md", ["CRMP-AIU-001"]],
  ["docs/CHANGELOG.md", ["2026-10-07T03:00:00.000Z"]],
  ["docs/CHANGELOG.zh-Hant.md", ["2026-10-07T03:00:00.000Z"]],
];
for (const [file, needles] of docs) {
  const body = read(file);
  for (const needle of needles) {
    assert(body.includes(needle), `${file} missing ${needle}`);
  }
}

const stamp = read("src/lib/build-stamp.ts");
assert(stamp.includes("2026-10-07T03:00:00.000Z"), "FINISHED_AT 03:00");

const pkg = read("package.json");
assert(pkg.includes("test:ai-use"), "package.json test:ai-use");

console.log("verify-ai-use: ok");
console.log(
  JSON.stringify(
    {
      enChars: en.length,
      zhChars: zh.length,
      mermaidEn: mermaidBlocks.length,
      mermaidZh: zhBlocks.length,
    },
    null,
    2
  )
);
