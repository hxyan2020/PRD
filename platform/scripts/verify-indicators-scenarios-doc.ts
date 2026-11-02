/**
 * Guardrails: full Admin/Pricing/Dealing indicators + scenarios handbook EN/ZH.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const en = read("docs/INDICATORS_SCENARIOS.md");
assert.match(en, /Full operator catalogue/);
assert.match(en, /## All indicators \(\d+\)/);
assert.match(en, /### Pricing lens/);
assert.match(en, /### Dealing lens/);
assert.match(en, /## Domain scenarios \(\d+\)/);
assert.match(en, /## Skill playbooks \(\d+\)/);
assert.match(en, /M2-LP-022/);
assert.match(en, /INC-1028/);
assert.match(en, /Audience map/);

const zh = read("docs/INDICATORS_SCENARIOS.zh-Hant.md");
assert.match(zh, /完整目錄/);
assert.match(zh, /## 全部指標（\d+）/);
assert.match(zh, /### 定價視角/);
assert.match(zh, /### 交易視角/);
assert.match(zh, /## 領域情境（\d+）/);
assert.match(zh, /## 技能劇本（\d+）/);
assert.match(zh, /受眾對照/);
assert.match(zh, /M2-LP-022/);

const docsTs = read("src/lib/docs.ts");
assert.match(docsTs, /INDICATORS_SCENARIOS/);
assert.match(docsTs, /INDICATORS_SCENARIOS\.md/);

const board = read("src/components/IndicatorsScenariosBoard.tsx");
assert.match(board, /handbook/);
assert.match(board, /indicators-scenarios-handbook/);
assert.match(board, /Full handbook|完整手冊/);

const page = read("src/app/admin/docs/indicators-scenarios/page.tsx");
assert.match(page, /readDocMarkdown\("INDICATORS_SCENARIOS"/);
assert.match(page, /handbookHtmlEn/);

const gen = read("scripts/gen-indicators-scenarios-doc.ts");
assert.match(gen, /listIndicatorCatalog/);
assert.match(gen, /INDICATORS_SCENARIOS\.zh-Hant\.md/);

console.log("ok: indicators & scenarios handbook EN/ZH + board Full handbook tab");
