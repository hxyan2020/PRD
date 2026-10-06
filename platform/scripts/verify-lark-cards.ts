/**
 * Monitor alerts and CS/TR risk hops post interactive cards on Lark Integration.
 * Run: npx tsx scripts/verify-lark-cards.ts
 */
import fs from "node:fs";
import path from "node:path";
import { OPEN_ISSUES, CS_TR_OPEN_ISSUE_CATALOGUE, CS_TR_PROGRESS_FUNCTIONS } from "../src/lib/docs/open-issues";
import { UAT_CASES } from "../src/lib/docs/uat-cases";
import { applyLarkCardAction } from "../src/lib/lark/actions";
import { listLarkCards, postLarkCard, syncLarkCardsFromThreads } from "../src/lib/lark/cards";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const root = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const cards = read("src/lib/lark/cards.ts");
assert(cards.includes("kind: LarkCardKind"), "cards kinds");
assert(cards.includes("ALERT"), "ALERT kind");
assert(cards.includes("ESCALATION"), "ESCALATION kind");
assert(cards.includes("CS_ESCALATION"), "CS_ESCALATION kind");
assert(cards.includes("export function postLarkCard"), "postLarkCard");
assert(cards.includes("export function syncLarkCardsFromThreads"), "sync from threads");
assert(cards.includes("oc_risk_control_desk"), "risk desk fallback");

const actions = read("src/lib/lark/actions.ts");
assert(actions.includes("messengerAction"), "card actions call messenger APIs");
assert(actions.includes('"ack"'), "ack");
assert(actions.includes('"escalate"'), "escalate");
assert(actions.includes('"dismiss"'), "dismiss");
assert(actions.includes('"close"'), "close");
assert(actions.includes("LARK_CARD_ACK"), "ack audit");
assert(actions.includes("LARK_CARD_ESCALATE"), "escalate audit");

const api = read("src/app/api/lark/route.ts");
assert(api.includes("card_ack"), "API card_ack");
assert(api.includes("card_escalate"), "API card_escalate");
assert(api.includes("card_dismiss"), "API card_dismiss");
assert(api.includes("card_close"), "API card_close");
assert(api.includes("applyLarkCardAction"), "API uses applyLarkCardAction");
assert(api.includes("lark.read"), "card actions gated like messenger read");

const ui = read("src/components/LarkManager.tsx");
assert(ui.includes('data-testid="lark-messenger"'), "messenger pane");
assert(ui.includes("lark-ack-"), "ack testid");
assert(ui.includes("lark-escalate-"), "escalate testid");
assert(ui.includes("lark-dismiss-"), "dismiss testid");
assert(ui.includes("lark-close-"), "close testid");
assert(ui.includes("card_"), "posts card_*");

const demo = read("src/lib/messenger/demo.ts");
assert(demo.includes("postThreadAlertCard"), "messenger posts alert cards");
assert(demo.includes("postThreadEscalationCard"), "messenger posts escalation cards");
assert(demo.includes("openCsRiskOnMessenger"), "CS risk hop opens messenger");

const desk = read("src/lib/cs/desk.ts");
assert(desk.includes("openCsRiskOnMessenger"), "CS escalate opens messenger");
assert(desk.includes("CS_ESCALATION"), "CS escalate posts Lark card");
assert(desk.includes("oc_cs_c1"), "CS card lands on oc_cs_c1");

const db = read("src/lib/db.ts");
assert(db.includes("CREATE TABLE IF NOT EXISTS lark_cards"), "schema in db.ts");

const audit = read("src/lib/audit.ts");
assert(audit.includes("LARK_CARD_POST"), "CRMP plane LARK_CARD_POST");
assert(audit.includes("LARK_CARD_ACK"), "CRMP plane LARK_CARD_ACK");

const oi08 = OPEN_ISSUES.find((i) => i.id === "OI-08");
assert(oi08?.status === "started", "OI-08 started (production Lark still open)");
assert(
  oi08?.checklist.some((c) => c.done && c.en.includes("Prototype Lark messenger cards")),
  "OI-08 prototype cards ticked"
);
assert(oi08?.checklist.some((c) => !c.done && c.en.includes("Production webhook")), "OI-08 production still open");
assert(oi08?.checklist.some((c) => c.done && c.en.includes("Keep Demo Messenger")), "OI-08 messenger fallback ticked");

const cat08 = CS_TR_OPEN_ISSUE_CATALOGUE.find((r) => r.id === "OI-08");
assert(cat08?.shippedEn.includes("Mock Lark messenger cards"), "OI-08 catalogue shipped cards");
assert(cat08?.remainingEn.includes("Live Lark app"), "OI-08 remaining live app");

const fnLark = CS_TR_PROGRESS_FUNCTIONS.find((r) => r.id === "fn-lark");
assert(fnLark?.proofEn.includes("UAT-36"), "fn-lark proof UAT-36");
assert(fnLark?.functionEn.includes("messenger cards"), "fn-lark names cards");

const uat36 = UAT_CASES.find((c) => c.id === "UAT-36");
assert(uat36?.covers.includes("Lark messenger cards"), "UAT-36 covers cards");
assert(uat36?.en.steps.some((s) => s.includes("Ack / Escalate")), "UAT-36 EN Ack/Escalate");
assert(uat36?.zh.steps.some((s) => s.includes("確認／升級")), "UAT-36 zh Ack/Escalate");

const docs: [string, string[]][] = [
  ["docs/UAT.md", ["Lark messenger cards", "data-testid=lark-messenger", "FR-47"]],
  ["docs/UAT.zh-Hant.md", ["即時通訊卡片", "data-testid=lark-messenger", "FR-47"]],
  ["docs/OPEN_ISSUES.md", ["**Status:** Started", "Prototype Lark messenger cards", "Ack/Escalate/Dismiss/Close"]],
  ["docs/OPEN_ISSUES.zh-Hant.md", ["**狀態：** 已啟動", "原型 Lark 即時通訊卡片", "確認／升級／排除／結案"]],
  ["docs/PROGRESS.md", ["| Lark messenger cards + CS/TR seeds | OI-08 | Started | UAT-36 · Ack/Escalate · `oc_cs_c1` |"]],
  ["docs/PROGRESS.zh-Hant.md", ["| Lark 即時通訊卡片＋CS／TR 種子 | OI-08 | 已啟動 | UAT-36 · 確認／升級 · `oc_cs_c1` |"]],
  ["docs/USER_GUIDE.md", ["§9.4", "lark-messenger", "interactive cards"]],
  ["docs/USER_GUIDE.zh-Hant.md", ["互動卡片", "lark-messenger", "確認／升級／排除／結案"]],
  ["docs/PRD.md", ["FR-47", "Lark messenger alert + escalation cards"]],
  ["docs/PRD.zh-Hant.md", ["FR-47", "Lark 即時通訊警報＋升級卡片"]],
  ["docs/TSD.md", ["lark_cards", "card_*", "LARK_CARD_*"]],
  ["docs/TSD.zh-Hant.md", ["lark_cards", "card_*", "LARK_CARD_*"]],
  ["docs/ROADMAP.md", ["mock interactive cards", "card_ack"]],
  ["docs/ROADMAP.zh-Hant.md", ["模擬互動卡片", "card_ack"]],
  ["docs/CHANGELOG.md", ["2026-10-07T01:00:00.000Z"]],
  ["docs/CHANGELOG.zh-Hant.md", ["2026-10-07T01:00:00.000Z"]],
];

for (const [file, needles] of docs) {
  const body = read(file);
  for (const needle of needles) {
    assert(body.includes(needle), `${file} missing ${needle}`);
  }
}

const stamp = read("src/lib/build-stamp.ts");
assert(stamp.includes("2026-10-07T01:00:00.000Z"), "FINISHED_AT 01:00");

const pkg = read("package.json");
assert(pkg.includes("test:lark-cards"), "package.json test:lark-cards");

syncLarkCardsFromThreads();
const posted = postLarkCard({
  chat_id: "oc_risk_control_desk",
  kind: "ALERT",
  title: "verify-lark-cards probe",
  body: "Runtime probe for Lark messenger Ack/Escalate.",
  severity: "WARN",
  actor: "verify-lark-cards",
  dedupe: false,
});
assert(posted.status === "OPEN", "posted OPEN");
assert(posted.chat_id === "oc_risk_control_desk", "posted onto risk desk");

const acked = applyLarkCardAction({
  card_id: posted.id,
  action: "ack",
  user_name: "verify-lark-cards",
});
assert(acked.ok && acked.card.status === "ACKED", "ack → ACKED");

const escSrc = postLarkCard({
  chat_id: "oc_cs_c1",
  kind: "CS_ESCALATION",
  title: "verify CS hop",
  body: "CS escalate probe",
  severity: "HIGH",
  cs_request_id: "CSR-VERIFY",
  actor: "verify-lark-cards",
  dedupe: false,
});
const escalated = applyLarkCardAction({
  card_id: escSrc.id,
  action: "escalate",
  user_name: "verify-lark-cards",
});
assert(escalated.ok && escalated.card.status === "ESCALATED", "escalate → ESCALATED");
const deskCard = listLarkCards().find(
  (c) => c.kind === "ESCALATION" && c.chat_id === "oc_risk_control_desk" && c.body.includes("oc_cs_c1")
);
assert(deskCard, "CS hop without thread posts ESCALATION on risk desk");

const listed = listLarkCards();
assert(listed.some((c) => c.id === posted.id), "list includes probe card");

console.log("verify-lark-cards: ok");
console.log(
  JSON.stringify(
    {
      oi08Status: oi08?.status,
      uat36Covers: uat36?.covers,
      posted: posted.card_id,
      acked: acked.card.status,
      escalated: escalated.card.status,
      listed: listed.length,
    },
    null,
    2
  )
);
