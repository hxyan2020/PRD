/**
 * Public C1 / form / mailbox connectors + inbound reply matching.
 * Run: npx tsx scripts/verify-cs-intake.ts
 */
import {
  extractCsPublicId,
  findCsRequestMatch,
  ingestCsRequest,
} from "../src/lib/cs/desk";
import {
  ingestOrContinue,
  intakeConnectorCatalog,
  parseIntakePayload,
} from "../src/lib/cs/intake";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(extractCsPublicId("Re: Please verify — request CSR-A1B2C3") === "CSR-A1B2C3", "extract from subject");
assert(extractCsPublicId("csr-dead01 extra") === "CSR-DEAD01", "extract case-insensitive");
assert(extractCsPublicId("no ticket here") === null, "no false match");

const c1 = parseIntakePayload({
  c1_id: "C1-SESSION-1",
  from_name: "Portal Chat",
  from_email: "portal.chat@client.example",
  text: "help me ???",
});
assert(c1.channel === "C1_LIVE_CHAT", `c1 channel ${c1.channel}`);
assert(c1.channel_ref === "C1-SESSION-1", "c1 channel_ref");
assert(c1.body === "help me ???", "c1 body");

const form = parseIntakePayload({
  form_id: "contact",
  name: "Form User",
  email: "form.user@client.example",
  uid: "900002",
  subject: "Cannot login to verify my account",
  message: "Please verify my account — cannot login, passport scan ready.",
});
assert(form.channel === "WEB_FORM", `form channel ${form.channel}`);
assert(form.client_uid === "900002", "form uid");

const mail = parseIntakePayload({
  from_name: "Mail User",
  from_email: "mail.user@client.example",
  subject: "Re: We need a bit more detail — request CSR-ABCDEF",
  text: "Account UID 771902. I cannot log in since yesterday 22:00 UTC. Screenshot attached.",
  headers: { "In-Reply-To": "CSM-OLD01" },
});
assert(mail.channel === "OFFICIAL_EMAIL", `mail channel ${mail.channel}`);
assert(mail.request_id === "CSR-ABCDEF", `mail request_id ${mail.request_id}`);
assert(mail.in_reply_to === "CSM-OLD01", `mail in_reply_to ${mail.in_reply_to}`);

const catalog = intakeConnectorCatalog();
assert(catalog.connectors.length === 3, "three connectors");
assert(catalog.connectors.some((c) => c.code === "C1_LIVE_CHAT"), "C1 connector");
assert(catalog.connectors.some((c) => c.code === "WEB_FORM"), "form connector");
assert(catalog.connectors.some((c) => c.code === "OFFICIAL_EMAIL"), "email connector");
assert(catalog.demo_token === "demo-c1", "demo token");
assert(catalog.portal === "/cs", "portal path");

const loopRef = `C1-INTAKE-${Date.now().toString(36).toUpperCase()}`;
const first = ingestOrContinue(
  parseIntakePayload({
    channel: "C1_LIVE_CHAT",
    client_name: "Intake Loop",
    client_email: "intake.loop@client.example",
    c1_id: loopRef,
    text: "help me something wrong ???",
  })
);
assert(first.mode === "new", "first ingest is new");
assert(first.request?.status === "AWAITING_CLIENT", `awaiting, got ${first.request?.status}`);
assert((first.followups || []).some((f) => f.status === "WAITING"), "WAITING auto-email");
const ticket = first.request!.request_id;
const ref = first.request!.channel_ref;

const sameChat = ingestOrContinue(
  parseIntakePayload({
    channel: "C1_LIVE_CHAT",
    client_name: "Intake Loop",
    client_email: "intake.loop@client.example",
    c1_id: loopRef,
    text: "Account UID 771902. I held XAUUSD overnight on 5 Oct and want the weekend swap rate confirmed. Screenshot attached.",
  })
);
assert(sameChat.mode === "continue", "same C1 channel_ref continues");
assert(sameChat.closed_wait === true, "C1 continuation closes WAITING");
assert(sameChat.request?.request_id === ticket, "same ticket");
assert(sameChat.request?.id === first.request?.id, "same db id");
assert(!(sameChat.followups || []).some((f) => f.status === "WAITING"), "no WAITING after clear C1 reply");

const idMail = ingestCsRequest({
  channel: "OFFICIAL_EMAIL",
  client_name: "Mailbox Reply",
  client_email: "mailbox.reply@client.example",
  subject: "Please verify my account — cannot withdraw",
  body: "I need you to verify my identity so I can withdraw. Passport scan to follow.",
  locale: "en",
  actor: "verify-cs-intake",
});
assert(idMail?.request.status === "ID_VERIFY", `ID_VERIFY got ${idMail?.request.status}`);
assert((idMail?.followups || []).some((f) => f.status === "WAITING"), "ID mail WAITING");

const inbound = ingestOrContinue(
  parseIntakePayload({
    from_email: "mailbox.reply@client.example",
    from_name: "Mailbox Reply",
    subject: `Re: Please verify your identity — request ${idMail!.request.request_id}`,
    text: "Here is my passport photo and UID last four 0088. Selfie attached.",
  })
);
assert(inbound.mode === "continue", "email subject CSR continues");
assert(inbound.closed_wait === true, "email reply closes WAITING");
assert(inbound.request?.id === idMail!.request.id, "matched ID ticket");

const matched = findCsRequestMatch({ channel_ref: ref || undefined, channel: "C1_LIVE_CHAT" });
assert(matched?.request_id === ticket, "find by channel_ref");

const bySubject = findCsRequestMatch({
  subject: `Re: We need a bit more detail — request ${ticket}`,
});
assert(bySubject?.request_id === ticket, "find by subject CSR");

console.log("verify-cs-intake: ok");
console.log(
  JSON.stringify(
    {
      ticket,
      c1Status: sameChat.request?.status,
      c1Clarity: sameChat.request?.ai_clarity,
      idTicket: idMail!.request.request_id,
      idAfter: inbound.request?.status,
      catalog: catalog.connectors.map((c) => c.code),
    },
    null,
    2
  )
);
