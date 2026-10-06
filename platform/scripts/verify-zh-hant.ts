/**
 * Traditional Chinese (zh-Hant) is present on every admin page chrome and product doc.
 * Run: npx tsx scripts/verify-zh-hant.ts
 */
import fs from "node:fs";
import path from "node:path";
import { NAV_I18N } from "../src/lib/i18n";
import { NAV_ITEMS } from "../src/lib/nav";
import { PLATFORM_URLS } from "../src/lib/docs/urls";
import { PHRASES_ZH } from "../src/lib/i18n-extra";
import { OPEN_ISSUES } from "../src/lib/docs/open-issues";
import {
  CS_LARK_SPECS,
  CS_SETTING_SEED,
  CS_SOURCE_SPECS,
  CS_TEAM_SPECS,
} from "../src/lib/cs/params";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");

const DOC_IDS = ["TSD", "PRD", "USER_GUIDE", "UAT", "ECOSYSTEM", "ROADMAP", "OPEN_ISSUES", "PROGRESS"];
for (const id of DOC_IDS) {
  const en = path.join(root, "docs", `${id}.md`);
  const zh = path.join(root, "docs", `${id}.zh-Hant.md`);
  assert(fs.existsSync(en), `missing EN ${id}.md`);
  assert(fs.existsSync(zh), `missing zh-Hant ${id}.zh-Hant.md`);
  const zhBody = fs.readFileSync(zh, "utf8");
  assert(zhBody.length > 500, `${id}.zh-Hant.md too short`);
}
assert(fs.existsSync(path.join(root, "docs", "CHANGELOG.zh-Hant.md")), "CHANGELOG.zh-Hant.md twin");

const simpRe = /[们这过发对还时国开关门东车来头经会说为现从与无后边让种进给吗条样点将应该当么]/;
for (const file of fs.readdirSync(path.join(root, "docs")).filter((f) => f.endsWith(".zh-Hant.md"))) {
  const body = fs.readFileSync(path.join(root, "docs", file), "utf8");
  const hit = body.match(simpRe);
  assert(!hit, `${file} contains simplified character ${hit?.[0]}`);
}
const uatCases = fs.readFileSync(path.join(root, "src/lib/docs/uat-cases.ts"), "utf8");
assert(!uatCases.includes("交给"), "uat-cases.ts still has simplified 给");
assert(uatCases.includes("交給"), "uat-cases.ts uses Traditional 給");

for (const item of NAV_ITEMS) {
  const pair = NAV_I18N[item.href];
  assert(pair, `NAV_I18N missing ${item.href}`);
  assert(pair["zh-Hant"] && pair["zh-Hant"] !== pair.en || item.href.includes("monitor-2"), `NAV_I18N zh-Hant for ${item.href}`);
}
assert(NAV_I18N["/admin/messenger"]?.["zh-Hant"] === "示範 Messenger", "messenger nav is 繁中");
assert(NAV_I18N["/cs"]?.["zh-Hant"] === "CS 客戶入口", "/cs nav is 繁中");

let missingUrl = 0;
for (const u of PLATFORM_URLS) {
  if (!PHRASES_ZH[u.title]) {
    missingUrl += 1;
    assert(false, `URL title missing zh: ${u.path} | ${u.title}`);
  }
  if (!PHRASES_ZH[u.description]) {
    missingUrl += 1;
    assert(false, `URL description missing zh: ${u.path} | ${u.description.slice(0, 80)}`);
  }
}
assert(missingUrl === 0, "all URL catalog rows have zh phrases");

const i18n = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
assert(i18n.includes('"/admin/messenger"'), "i18n.ts ships messenger nav");
assert(i18n.includes('"cs.portal.title"'), "i18n.ts ships /cs portal chrome");
assert(i18n.includes('"cs-dashboard"'), "i18n.ts ships CS dashboard page meta");
assert(i18n.includes('"cs-log"'), "i18n.ts ships CS log page meta");
assert(i18n.includes('"cs-data"'), "i18n.ts ships CS data page meta");

const ugPage = fs.readFileSync(path.join(root, "src/app/admin/docs/user-guide/page.tsx"), "utf8");
assert(ugPage.includes('zh: "示範 Messenger"'), "user-guide quick link messenger 繁中");

const uatPage = fs.readFileSync(path.join(root, "src/app/admin/docs/uat/page.tsx"), "utf8");
assert(uatPage.includes("示範 Messenger"), "uat page messenger 繁中");

const catalogBoard = fs.readFileSync(path.join(root, "src/components/UrlCatalogBoard.tsx"), "utf8");
assert(catalogBoard.includes('Messenger: "即時通訊"'), "URL catalog category Messenger is 繁中");

const ugEn = fs.readFileSync(path.join(root, "docs/USER_GUIDE.md"), "utf8");
const ugZh = fs.readFileSync(path.join(root, "docs/USER_GUIDE.zh-Hant.md"), "utf8");
assert(ugEn.includes("URL Catalog row"), "UG EN mentions catalog bilingual");
assert(ugZh.includes("網址目錄列"), "UG zh mentions catalog bilingual");
assert(ugZh.includes("設定 `cs.*` 說明"), "UG zh mentions settings cs.* copy");
assert(ugZh.includes("公開 `/cs` 介面同樣是繁體中文"), "UG zh mentions /cs chrome");

const prdZh = fs.readFileSync(path.join(root, "docs/PRD.zh-Hant.md"), "utf8");
assert(prdZh.includes("設定 cs.* 文案"), "PRD NFR-06 mentions settings copy");

function needPhrase(label: string, text: string) {
  assert(PHRASES_ZH[text], `phrase missing zh: ${label} | ${text.slice(0, 80)}`);
}
for (const s of CS_SETTING_SEED) needPhrase(s.key, s.description);
for (const t of CS_TEAM_SPECS) {
  needPhrase(`team ${t.name}`, t.name);
  needPhrase(`mission ${t.name}`, t.mission);
  needPhrase(`rota ${t.name}`, t.on_call_rotation);
}
for (const l of CS_LARK_SPECS) {
  needPhrase(`lark ${l.name}`, l.name);
  needPhrase(`purpose ${l.name}`, l.purpose);
}
for (const s of CS_SOURCE_SPECS) {
  needPhrase(`src ${s.name}`, s.name);
  needPhrase(`src desc ${s.name}`, s.description);
  needPhrase(`src notes ${s.name}`, s.notes);
}

const dataView = fs.readFileSync(path.join(root, "src/components/CsOpsDataView.tsx"), "utf8");
assert(dataView.includes("phrase(team.on_call_rotation"), "CS data rotations go through phrase()");
const localeHook = fs.readFileSync(path.join(root, "src/hooks/useUiLocale.ts"), "utf8");
assert(localeHook.includes("document.documentElement.lang"), "html lang follows UI locale");

const oi15 = OPEN_ISSUES.find((i) => i.id === "OI-15");
assert(oi15?.checklist.some((c) => c.done && c.en.includes("EN + zh-Hant parity")), "OI-15 docs parity ticked");

const stamp = fs.readFileSync(path.join(root, "src/lib/build-stamp.ts"), "utf8");
assert(stamp.includes("2026-10-07T00:00:00.000Z"), "FINISHED_AT 00:00");

console.log("verify-zh-hant: ok");
console.log(
  JSON.stringify(
    {
      docs: DOC_IDS.length,
      nav: NAV_ITEMS.length,
      urls: PLATFORM_URLS.length,
      phrases: Object.keys(PHRASES_ZH).length,
    },
    null,
    2
  )
);
