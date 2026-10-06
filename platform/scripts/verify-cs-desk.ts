/**
 * CS/TR desk: triage, auto-email wait loop, TR routing, resolve-while-waiting.
 * Run: npx tsx scripts/verify-cs-desk.ts
 */
import {
  applyTriage,
  ingestCsRequest,
  recordClientReply,
  resolveRequest,
  sendFollowupEmail,
  triageText,
} from "../src/lib/cs/desk";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const clear = triageText(
  "Swap on XAUUSD overnight",
  "Hi CS, I held XAUUSD overnight on UID 880214. Can you confirm the swap rate that was charged on 5 Oct and whether weekends are triple? Thanks."
);
assert(clear.clarity === "clear" && clear.desk === "CS", `expected clear CS, got ${JSON.stringify(clear)}`);

const unclear = triageText("Something wrong", "help me something wrong ???");
assert(unclear.clarity === "unclear", `expected unclear, got ${JSON.stringify(unclear)}`);

const needId = triageText("Please verify my account — cannot withdraw", "I need you to verify my identity so I can withdraw.");
assert(needId.clarity === "need_id", `expected need_id, got ${JSON.stringify(needId)}`);

const trading = triageText(
  "Slippage on EURUSD market order",
  "EURUSD market order on MT5 ticket 849201 filled 2.1 pips worse than the button."
);
assert(trading.desk === "TR" && trading.category === "trading", `expected TR trading, got ${JSON.stringify(trading)}`);

const packed = ingestCsRequest({
  channel: "C1_LIVE_CHAT",
  client_name: "Verify Loop",
  client_email: "verify.loop@client.example",
  subject: "help me ???",
  body: "idk",
  locale: "en",
  actor: "verify-cs-desk",
});
assert(packed?.request.status === "AWAITING_CLIENT", `expected AWAITING_CLIENT, got ${packed?.request.status}`);
assert((packed?.followups || []).some((f) => f.status === "WAITING"), "expected WAITING follow-up");

let blocked = false;
try {
  resolveRequest(packed!.request.id, "Verify Loop", "en");
} catch (e) {
  blocked = e instanceof Error && /waiting for the client|automatic follow-up/i.test(e.message);
}
assert(blocked, "resolve must be blocked while follow-up is WAITING");

const after = recordClientReply({
  request_id: packed!.request.id,
  text: "Account UID 771902. I held XAUUSD overnight on 5 Oct and want the weekend swap rate confirmed. Screenshot attached.",
  locale: "en",
  actor: "verify-cs-desk",
});
assert(after?.request, "re-triage after reply");
assert(
  !(after!.followups || []).some((f) => f.status === "WAITING"),
  "no WAITING follow-up after a clear-enough reply (or ID loop continued — check clarity)"
);

const idCase = ingestCsRequest({
  channel: "OFFICIAL_EMAIL",
  client_name: "Id Cap",
  client_email: "id.cap@client.example",
  subject: "Please verify my account",
  body: "verify my account cannot login need passport",
  locale: "en",
  actor: "verify-cs-desk",
});
assert(idCase?.request.status === "ID_VERIFY", `expected ID_VERIFY, got ${idCase?.request.status}`);
sendFollowupEmail(idCase!.request.id, "need_id", "en");
sendFollowupEmail(idCase!.request.id, "need_id", "en");
const capped = sendFollowupEmail(idCase!.request.id, "need_id", "en");
assert(
  (capped?.request.followup_count || 0) <= 3,
  `followup_count should cap at 3, got ${capped?.request.followup_count}`
);
assert(
  (capped?.messages || []).some((m) => /3-mail automatic follow-up cap|3 封/i.test(m.body)),
  "cap-3 system note missing"
);

const trCase = ingestCsRequest({
  channel: "WEB_FORM",
  client_name: "Slippage Client",
  client_email: "slip@client.example",
  subject: "Slippage on EURUSD market order",
  body: "EURUSD market order on MT5 ticket 849201 filled 2.1 pips worse than the button. Please check LP fill vs our execution. Time 14:03 UTC 6 Oct.",
  locale: "en",
  actor: "verify-cs-desk",
});
assert(trCase?.request.desk === "TR", `expected desk TR, got ${trCase?.request.desk}`);
assert(trCase?.request.status === "ASSIGNED_TR", `expected ASSIGNED_TR, got ${trCase?.request.status}`);

applyTriage(trCase!.request.id, "en");

console.log("verify-cs-desk: ok");
console.log(
  JSON.stringify(
    {
      clear,
      unclear,
      needId,
      trading,
      awaitStatus: packed?.request.status,
      afterStatus: after?.request.status,
      afterClarity: after?.request.ai_clarity,
      idStatus: idCase?.request.status,
      followupCount: capped?.request.followup_count,
      trStatus: trCase?.request.status,
    },
    null,
    2
  )
);
