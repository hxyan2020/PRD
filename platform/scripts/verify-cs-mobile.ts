/**
 * CS/TR + remaining dense boards are usable at phone width (~390px).
 * Run: npx tsx scripts/verify-cs-mobile.ts
 */
import fs from "node:fs";
import path from "node:path";
import { OPEN_ISSUES, CS_TR_OPEN_ISSUE_CATALOGUE } from "../src/lib/docs/open-issues";
import { UAT_CASES } from "../src/lib/docs/uat-cases";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const desk = read("src/components/CsTrDesk.tsx");
assert(desk.includes('data-testid="cs-desk-mobile"'), "desk mobile shell");
assert(desk.includes('data-testid="cs-desk-inbox"'), "desk inbox pane");
assert(desk.includes('data-testid="cs-desk-thread"'), "desk thread pane");
assert(desk.includes('data-testid="cs-inbox-back"'), "desk inbox back");
assert(desk.includes('t("cs.inboxBack"'), "desk uses cs.inboxBack");
assert(desk.includes("messenger-shell"), "desk messenger-shell");
assert(desk.includes('mobilePane === "thread" ? "hidden lg:flex" : "flex"'), "desk list hidden on thread");
assert(desk.includes('mobilePane === "list" ? "hidden lg:flex" : "flex"'), "desk thread hidden on list");
assert(desk.includes("action-row"), "desk action-row");
assert((desk.match(/data-testid="cs-sim-c1"/g) || []).length === 1, "simulate C1 once (inbox pane only)");

const dash = read("src/components/CsDashboardView.tsx");
assert(dash.includes('testId="cs-dash-waiting-mobile"'), "dashboard waiting cards");
assert(dash.includes('testId="cs-dash-recent-mobile"'), "dashboard recent cards");
assert(dash.includes("action-row"), "dashboard action-row");
assert(dash.includes("sm:hidden"), "dashboard mobile twin");
assert(dash.includes("hidden sm:block"), "dashboard table desktop-only");

const log = read("src/components/CsLogView.tsx");
assert(log.includes('data-testid="cs-log-resolved-mobile"'), "log resolved cards");
assert(log.includes("action-row"), "log action-row");
assert(log.includes("chip-scroller"), "log chip-scroller");

const data = read("src/components/CsOpsDataView.tsx");
assert(data.includes('data-testid="cs-data-teams-mobile"'), "data teams cards");
assert(data.includes("action-row"), "data action-row");

const portal = read("src/components/CsClientPortal.tsx");
assert(portal.includes("grid grid-cols-1 sm:flex sm:flex-wrap"), "/cs tabs stack on phone");

const rag = read("src/components/RagAiHumanGatePanel.tsx");
assert(rag.includes('data-testid="rag-gate-mobile"'), "RAG gate mobile cards");
assert(!rag.includes('data-testid={`rag-block-${i.id}`}') || rag.indexOf("rag-gate-mobile") < rag.indexOf("rag-block-"), "rag-block testid stays on table");
assert((rag.match(/rag-block-\$\{i\.id\}/g) || []).length === 1, "rag-block testid only on table rows");

const pt = read("src/components/ProgressTrackerBoard.tsx");
assert(pt.includes('data-testid="pt-cs-functions-mobile"'), "progress functions mobile");
assert(pt.includes('data-testid="pt-cs-catalogue-mobile"'), "progress catalogue mobile");

const oi = read("src/components/OpenIssuesBoard.tsx");
assert(oi.includes('data-testid="oi-cs-catalogue-mobile"'), "open-issues catalogue mobile");

const uat = read("src/components/UatChecklistBoard.tsx");
assert(uat.includes('data-testid="uat-cs-catalogue-mobile"'), "uat catalogue mobile");

const i18n = read("src/lib/i18n.ts");
assert(i18n.includes('"cs.inboxBack"'), "i18n cs.inboxBack");
assert(i18n.includes("收件匣"), "i18n inbox back zh-Hant");

const oi11 = OPEN_ISSUES.find((i) => i.id === "OI-11");
assert(oi11?.status === "wip", "OI-11 stays WIP (docs parity BAU open)");
assert(
  oi11?.checklist.some((c) => c.done && c.en.includes("CS/TR desk, dashboard, log and data usable at ~390px")),
  "OI-11 CS/TR phone-width ticked"
);
assert(oi11?.checklist.some((c) => !c.done && c.en.includes("Docs parity BAU")), "OI-11 docs BAU still open");

const cat11 = CS_TR_OPEN_ISSUE_CATALOGUE.find((r) => r.id === "OI-11");
assert(cat11?.shippedEn.includes("List→thread"), "OI-11 catalogue shipped list→thread");
assert(cat11?.remainingEn.includes("Native phone apps"), "OI-11 remaining native apps");

const uat18 = UAT_CASES.find((c) => c.id === "UAT-18");
assert(uat18?.covers.includes("CS / TR Dashboard"), "UAT-18 covers dashboard");
assert(uat18?.covers.includes("CS / TR Log"), "UAT-18 covers log");
assert(uat18?.covers.includes("CS / TR Data"), "UAT-18 covers data");
assert(uat18?.covers.includes("CS client portal"), "UAT-18 covers /cs");
assert(uat18?.en.steps.some((s) => s.includes("Inbox back")), "UAT-18 EN desk list→thread");
assert(uat18?.zh.steps.some((s) => s.includes("收件匣返回")), "UAT-18 zh desk list→thread");

const docs: [string, string[]][] = [
  ["docs/UAT.md", ["CS / TR Dashboard", "Inbox list first", "waiting/recent/resolved show as cards"]],
  ["docs/UAT.zh-Hant.md", ["CS / TR Dashboard", "先收件匣列表", "等待／最近／已結以卡片顯示"]],
  ["docs/OPEN_ISSUES.md", ["- [x] CS/TR desk, dashboard, log and data usable at ~390px", "List→thread desk"]],
  ["docs/OPEN_ISSUES.zh-Hant.md", ["- [x] CS／TR 台、儀表板、日誌與資料在約 390px 可用", "台面列表→案件"]],
  ["docs/PROGRESS.md", ["| Phone-width CS/TR | OI-11 | UAT | UAT-18 |", "List→thread desk"]],
  ["docs/PROGRESS.zh-Hant.md", ["| CS／TR 手機寬 | OI-11 | UAT | UAT-18 |", "台面列表→案件"]],
  ["docs/USER_GUIDE.md", ["CS / TR Desk works the same", "inbox cards first"]],
  ["docs/USER_GUIDE.zh-Hant.md", ["先收件匣卡片", "再按 **收件匣** 返回"]],
  ["docs/PRD.md", ["CS/TR desk list→thread"]],
  ["docs/PRD.zh-Hant.md", ["CS／TR 台列表→案件"]],
  ["docs/TSD.md", ["CS/TR desk list→thread"]],
  ["docs/TSD.zh-Hant.md", ["CS／TR 台列表→案件"]],
  ["docs/CHANGELOG.md", ["2026-10-07T00:00:00.000Z"]],
  ["docs/CHANGELOG.zh-Hant.md", ["2026-10-07T00:00:00.000Z"]],
];

for (const [file, needles] of docs) {
  const body = read(file);
  for (const needle of needles) {
    assert(body.includes(needle), `${file} missing ${needle}`);
  }
}

const stamp = read("src/lib/build-stamp.ts");
assert(stamp.includes("2026-10-07T00:00:00.000Z"), "FINISHED_AT 00:00");

console.log("verify-cs-mobile: ok");
console.log(
  JSON.stringify(
    {
      oi11Status: oi11?.status,
      uat18Covers: uat18?.covers.length,
      shipped: cat11?.shippedEn,
    },
    null,
    2
  )
);
