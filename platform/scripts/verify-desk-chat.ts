import { answerDeskChat } from "../src/lib/ai/desk-chat";
import { retrieveDeskCorpus } from "../src/lib/ai/rag-corpus";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

const purpose = answerDeskChat({
  selection: "",
  question: "What is the purpose of this admin?",
  pagePath: "/admin",
  locale: "en",
});
assert(/Centralised Risk Management Platform/i.test(purpose.reply), "purpose names CRMP");
assert(/forex CFD/i.test(purpose.reply), "purpose mentions forex CFD");
assert(/crypto exchange/i.test(purpose.reply), "purpose mentions crypto exchange");
assert(!/I did not match a named indicator/i.test(purpose.reply), "purpose is not unmatched");
assert(purpose.suggestions.some((s) => /built/i.test(s)), "purpose suggests built follow-up");

const built = answerDeskChat({
  selection: "",
  question: "What has been built so far?",
  pagePath: "/admin",
  locale: "en",
});
assert(/Demo Messenger/i.test(built.reply), "built lists messenger");
assert(/Monitor 2\.0/i.test(built.reply), "built lists Monitor 2.0");
assert(/RM-09/i.test(built.reply), "built names live-write gap");

const cfd = answerDeskChat({
  selection: "margin utilisation",
  question: "How do you manage forex CFD broker risk?",
  pagePath: "/admin/risk-domains",
  locale: "en",
});
assert(/A-book|B-book|margin/i.test(cfd.reply), "CFD answer has book or margin");
assert(/stop-out|leverage|LP/i.test(cfd.reply), "CFD answer has stop-out/leverage/LP");

const crypto = answerDeskChat({
  selection: "",
  question: "What crypto exchange risks are covered? hot wallet and liquidation",
  pagePath: "/admin",
  locale: "en",
});
assert(/hot (wallet|float)|M2-CRYPTO-WALLET|liquidation|oracle|insurance fund|OI/i.test(crypto.reply), "crypto mentions exchange stack");
assert(!/\*\*A-book/.test(crypto.reply), "crypto question does not pull unrelated A-book card");
assert(!/\*\*Forex CFD broker risk/.test(crypto.reply), "crypto question does not pull generic CFD card");

const zh = answerDeskChat({
  selection: "",
  question: "這個後台的用途是什麼？",
  pagePath: "/admin",
  locale: "zh-Hant",
});
assert(/中央風險管理平台/.test(zh.reply), "zh purpose names CRMP");
assert(/外匯 CFD/.test(zh.reply), "zh purpose mentions FX CFD");

const unmatchedHint = answerDeskChat({
  selection: "zzzz-not-a-real-key",
  question: "zzzz-not-a-real-key",
  pagePath: "/admin/alerts",
  locale: "en",
});
assert(/purpose|built|CFD|risk corpus/i.test(unmatchedHint.reply), "unmatched still points at corpus");

const hits = retrieveDeskCorpus("hot wallet float crypto exchange", 3);
assert(hits.some((h) => /wallet/i.test(h.title) || /wallet/i.test(h.content)), "corpus retrieves wallet doc");
assert(hits.length > 0, "corpus returns hits");

// Drill-down must answer the clicked question — not repeat the first highlight match.
const highlight =
  "Purpose of CRMP Plus. CRMP is the control plane for a forex CFD broker and a crypto exchange risk desk.";
const firstTurn = answerDeskChat({
  selection: highlight,
  question: `Explain this: ${highlight}`,
  pagePath: "/admin",
  locale: "en",
});
assert(/Purpose of CRMP/i.test(firstTurn.reply), "first turn explains the highlight purpose");
assert(firstTurn.suggestions.some((s) => /built/i.test(s)), "first turn offers built drill-down");

const drillBuilt = answerDeskChat({
  selection: highlight,
  question: "What has been built in this admin?",
  pagePath: "/admin",
  locale: "en",
  history: [
    { role: "user", content: `Explain this: ${highlight}` },
    { role: "assistant", content: firstTurn.reply },
  ],
});
const builtTitles = [...drillBuilt.reply.matchAll(/\*\*([^*]+)\.\*\*/g)].map((m) => m[1]);
assert(/What has been built/i.test(builtTitles[0] || ""), "built drill-down leads with built card");
assert(/Demo Messenger|Monitor 2\.0/i.test(drillBuilt.reply), "built drill-down lists shipped surfaces");
assert(/Answering your follow-up/i.test(drillBuilt.reply), "follow-up names the new question");
assert(!/^You selected:/i.test(drillBuilt.reply), "follow-up does not reopen the highlight blurb");

const drillWallet = answerDeskChat({
  selection: highlight,
  question: "How is hot-wallet float controlled?",
  pagePath: "/admin",
  locale: "en",
  history: [
    { role: "user", content: `Explain this: ${highlight}` },
    { role: "assistant", content: firstTurn.reply },
  ],
});
const walletTitles = [...drillWallet.reply.matchAll(/\*\*([^*]+)\.\*\*/g)].map((m) => m[1]);
assert(/hot-wallet|Hot wallet|CRYPTO-WALLET/i.test(drillWallet.reply), "wallet drill-down answers float control");
assert(!/Purpose of CRMP/i.test(walletTitles[0] || ""), "wallet drill-down does not lead with purpose");

const zhDrill = answerDeskChat({
  selection: "CRMP 是外匯 CFD 與加密交易所風控的控制面",
  question: "目前後台建了什麼？",
  pagePath: "/admin",
  locale: "zh-Hant",
  history: [
    { role: "user", content: "請解釋這段：CRMP 是外匯 CFD 與加密交易所風控的控制面" },
    { role: "assistant", content: "先前用途說明" },
  ],
});
assert(/目前已建置|示範 Messenger|Monitor 2\.0/.test(zhDrill.reply), "zh drill-down answers built");
assert(/針對你的追問/.test(zhDrill.reply), "zh follow-up labels the new question");

if (process.exitCode) {
  console.error("desk-chat verification failed");
  process.exit(1);
}
console.log("desk-chat verification passed");
