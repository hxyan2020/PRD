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
assert(/hot (wallet|float)|M2-CRYPTO-WALLET/i.test(crypto.reply), "crypto mentions hot wallet");
assert(/liquidation|oracle|insurance fund|OI/i.test(crypto.reply), "crypto mentions liq/oracle/fund");

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

if (process.exitCode) {
  console.error("desk-chat verification failed");
  process.exit(1);
}
console.log("desk-chat verification passed");
