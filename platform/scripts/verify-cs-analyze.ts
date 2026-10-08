/**
 * After facts are collected: categorize, severity, AI solution, auto-reply vs POC.
 * Run: npx tsx scripts/verify-cs-analyze.ts
 */
import {
  analyzeCsRequest,
  isCollectedReply,
  scoreSensitivity,
  scoreSeverity,
} from "../src/lib/cs/analyze";
import { ingestCsRequest, recordClientReply, releasePocDraft } from "../src/lib/cs/desk";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(scoreSeverity({ subject: "Swap", body: "confirm swap rate UID 880214 overnight", category: "question", desk: "CS" }) === "LOW" || scoreSeverity({ subject: "Swap", body: "confirm swap rate UID 880214 overnight", category: "question", desk: "CS" }) === "MEDIUM", "FAQ severity low/medium");
assert(scoreSeverity({ subject: "Refund complaint", body: "I want a refund this is a complaint", category: "complaint", desk: "CS" }) === "HIGH", "complaint is HIGH");
assert(scoreSeverity({ subject: "Stolen account fraud", body: "wallet drain hack stolen account lawsuit", category: "complaint", desk: "CS" }) === "CRITICAL", "fraud is CRITICAL");
assert(
  scoreSensitivity({
    severity: "LOW",
    category: "question",
    skillCode: "SKILL-CS-ACCOUNT-FAQ",
    autoMax: "MEDIUM",
    sensitiveCategories: ["complaint", "kyc", "trading"],
  }) === "auto",
  "FAQ auto"
);
assert(
  scoreSensitivity({
    severity: "MEDIUM",
    category: "trading",
    skillCode: "SKILL-TR-EXECUTION",
    autoMax: "MEDIUM",
    sensitiveCategories: ["complaint", "kyc", "trading"],
  }) === "poc",
  "trading poc"
);
assert(
  isCollectedReply({
    previousStatus: "ID_VERIFY",
    inboundCount: 2,
    latest: "Here is my passport photo and UID last four 0088. Selfie attached to this reply.",
    clarity: "need_id",
  }),
  "ID reply with UID is collected"
);
assert(
  !isCollectedReply({
    previousStatus: "ID_VERIFY",
    inboundCount: 2,
    latest: "ok",
    clarity: "need_id",
  }),
  "thin ID reply is not collected"
);

const faq = ingestCsRequest({
  channel: "C1_LIVE_CHAT",
  client_name: "Analyze Faq",
  client_email: "analyze.faq@client.example",
  client_uid: "880777",
  subject: "Swap on XAUUSD overnight",
  body: "Hi CS, I held XAUUSD overnight on UID 880777. Can you confirm the swap rate that was charged on 5 Oct and whether weekends are triple? Thanks.",
  locale: "en",
  actor: "verify-cs-analyze",
});
assert(faq?.request.severity, `FAQ severity ${faq?.request.severity}`);
assert(faq?.request.sensitivity === "auto", `FAQ sensitivity ${faq?.request.sensitivity}`);
assert(faq?.request.status === "AI_REPLIED", `FAQ status ${faq?.request.status}`);
assert(faq?.request.ai_solution && /FAQ/i.test(faq.request.ai_solution), "FAQ solution");
assert((faq?.messages || []).some((m) => m.kind === "EMAIL_OUT" && /overnight swap/i.test(m.body)), "FAQ auto EMAIL_OUT");

const unclear = ingestCsRequest({
  channel: "C1_LIVE_CHAT",
  client_name: "Analyze Thin",
  client_email: "analyze.thin@client.example",
  subject: "help me ???",
  body: "idk",
  locale: "en",
  actor: "verify-cs-analyze",
});
assert(unclear?.request.status === "AWAITING_CLIENT", `thin stays waiting ${unclear?.request.status}`);
assert(!unclear?.request.ai_solution, "no solution while waiting");

const after = recordClientReply({
  request_id: unclear!.request.id,
  text: "Account UID 771902. I held XAUUSD overnight on 5 Oct and want the weekend swap rate confirmed. Screenshot attached.",
  locale: "en",
  actor: "verify-cs-analyze",
});
assert(after?.request.ai_clarity === "clear" || after?.request.status === "AI_REPLIED", `after reply ${after?.request.status}`);
assert(after?.request.severity, "severity after collected reply");
assert(after?.request.ai_draft, "draft after collected reply");

const idCase = ingestCsRequest({
  channel: "OFFICIAL_EMAIL",
  client_name: "Analyze Id",
  client_email: "analyze.id@client.example",
  subject: "Please verify my account — cannot withdraw",
  body: "I need you to verify my identity so I can withdraw. Passport scan to follow.",
  locale: "en",
  actor: "verify-cs-analyze",
});
assert(idCase?.request.status === "ID_VERIFY", `ID wait ${idCase?.request.status}`);
const idAfter = recordClientReply({
  request_id: idCase!.request.id,
  text: "Here is my passport photo and UID last four 0088. Selfie attached for the vault team.",
  locale: "en",
  actor: "verify-cs-analyze",
});
assert(idAfter?.request.category === "kyc", `ID category ${idAfter?.request.category}`);
assert(idAfter?.request.sensitivity === "poc", `ID poc ${idAfter?.request.sensitivity}`);
assert(idAfter?.request.status === "POC_REVIEW", `ID poc review ${idAfter?.request.status}`);
assert(idAfter?.request.poc_name, "ID named POC");
assert(!(idAfter?.messages || []).some((m) => m.kind === "EMAIL_OUT" && /KYC team will confirm/i.test(m.body)), "ID must not auto-send before POC");

const released = releasePocDraft({
  request_id: idAfter!.request.id,
  extra: "UID last-four matches. Status flag VERIFIED. Do not resend images.",
  user_name: "Nadia Okonkwo",
  locale: "en",
});
assert(released?.request.status === "AI_REPLIED", `after POC release ${released?.request.status}`);
assert(
  (released?.messages || []).some((m) => m.kind === "EMAIL_OUT" && /POC addendum/i.test(m.body)),
  "POC addendum on sent mail"
);

const tr = ingestCsRequest({
  channel: "WEB_FORM",
  client_name: "Analyze Slip",
  client_email: "analyze.slip@client.example",
  subject: "Slippage on EURUSD market order",
  body: "EURUSD market order on MT5 ticket 849201 filled 2.1 pips worse than the button. Please check LP fill vs our execution. Time 14:03 UTC 6 Oct.",
  locale: "en",
  actor: "verify-cs-analyze",
});
assert(tr?.request.desk === "TR", "TR desk");
assert(tr?.request.status === "ASSIGNED_TR", `TR status ${tr?.request.status}`);
assert(tr?.request.sensitivity === "poc", "TR poc");
assert(tr?.request.ai_draft && /tape/i.test(tr.request.ai_draft), "TR draft mentions tape");

const unit = analyzeCsRequest({
  requestId: "CSR-TEST1",
  clientName: "Unit",
  subject: "Swap",
  body: "UID 1 swap",
  latest: "Hi CS, I held XAUUSD overnight on UID 880214. Can you confirm the swap rate?",
  category: "question",
  desk: "CS",
  skillCode: "SKILL-CS-ACCOUNT-FAQ",
  locale: "en",
});
assert(unit.sensitivity === "auto", `unit auto ${unit.sensitivity} ${unit.severity}`);

console.log("verify-cs-analyze: ok");
console.log(
  JSON.stringify(
    {
      faqStatus: faq?.request.status,
      faqSeverity: faq?.request.severity,
      afterStatus: after?.request.status,
      idStatus: idAfter?.request.status,
      idPoc: idAfter?.request.poc_name,
      releasedStatus: released?.request.status,
      trStatus: tr?.request.status,
      trSensitivity: tr?.request.sensitivity,
    },
    null,
    2
  )
);
