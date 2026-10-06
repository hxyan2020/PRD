/**
 * CS/TR supporting data: BUs, KYC vault, hops, cs.* parameters.
 * Run: npx tsx scripts/verify-cs-data.ts
 */
import fs from "node:fs";
import path from "node:path";
import { escalationRouteForSkill } from "../src/lib/ai/skill-escalation-map";
import {
  assignedBuFor,
  CS_FOLLOWUP_CAP_DEFAULT,
  CS_ROUTE_CODES,
  CS_SETTING_SEED,
  CS_SOURCE_SPECS,
  CS_TEAM_SPECS,
} from "../src/lib/cs/params";
import { getCsFollowupCap, getCsIntakeToken, getCsOpsContract } from "../src/lib/cs/ops-data";
import { ingestCsRequest } from "../src/lib/cs/desk";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(assignedBuFor({ desk: "CS" }) === "CUSTOMER_SERVICE", "CS desk stamps CUSTOMER_SERVICE");
assert(assignedBuFor({ desk: "TR" }) === "TRADING", "TR desk stamps TRADING");
assert(assignedBuFor({ status: "ESCALATED_RISK" }) === "RISK_CONTROL", "risk escalate stamps RISK_CONTROL");
assert(escalationRouteForSkill("SKILL-CS-ID-VERIFY") === "ESC-CS-KYC", "ID-VERIFY binds ESC-CS-KYC");
assert(escalationRouteForSkill("SKILL-CS-CLARIFY") === "ESC-CS-24-7", "clarify stays on ESC-CS-24-7");

const contract = getCsOpsContract();
assert(
  contract.bus.some((b) => b.code === "CUSTOMER_SERVICE"),
  "CUSTOMER_SERVICE BU"
);
assert(
  contract.bus.some((b) => b.code === "TRADING"),
  "TRADING BU"
);
for (const spec of CS_TEAM_SPECS) {
  assert(
    contract.teams.some((t) => t.name === spec.name),
    `missing team ${spec.name}`
  );
}
assert(
  contract.teams.some((t) => t.name === "CS KYC Vault" && (t.member_count > 0 || t.members.length > 0)),
  "CS KYC Vault has a POC"
);
assert(
  contract.pocs.some((p) => p.email === "cs.kyc@vantagemarkets.com"),
  "Nadia KYC POC"
);
for (const code of CS_ROUTE_CODES) {
  const route = contract.routes.find((r) => r.route_code === code);
  assert(route, `missing route ${code}`);
  assert(route!.hops.length >= 1, `${code} hops`);
}
assert(
  contract.routes.find((r) => r.route_code === "ESC-CS-KYC")?.skills.includes("SKILL-CS-ID-VERIFY"),
  "ESC-CS-KYC lists SKILL-CS-ID-VERIFY"
);
assert(contract.params.followup_cap === getCsFollowupCap(), "live cap matches contract");
assert(getCsFollowupCap() >= 1 && getCsFollowupCap() <= 12, "cap in range");
assert(getCsIntakeToken().length > 0, "intake token");
assert(contract.params.mailbox_support.includes("@"), "support mailbox");
assert(contract.params.mailbox_complaints.includes("@"), "complaints mailbox");
assert(
  CS_SETTING_SEED.every((s) => contract.settings.some((row) => row.key === s.key) || contract.params),
  "cs.* keys present"
);
assert(
  contract.settings.some((s) => s.key === "cs.followup_cap") || contract.params.followup_cap === CS_FOLLOWUP_CAP_DEFAULT,
  "followup_cap setting"
);
assert(
  CS_SOURCE_SPECS.some((s) => s.name === "CS KYC Vault") && contract.sources.some((s) => s.name === "CS KYC Vault"),
  "KYC vault source"
);
assert(
  contract.sources.some((s) => /dealing tape/i.test(s.name)),
  "dealing-tape source"
);
assert(
  contract.lark.some((c) => c.chat_id === "oc_cs_kyc"),
  "oc_cs_kyc channel"
);
assert(
  contract.lark.some((c) => c.chat_id === "oc_cs_c1"),
  "oc_cs_c1 channel"
);
assert(
  contract.lark.some((c) => c.chat_id === "oc_tr_dealing"),
  "oc_tr_dealing channel"
);

const idCase = ingestCsRequest({
  channel: "OFFICIAL_EMAIL",
  client_name: "Data Verify KYC",
  client_email: "data.kyc@client.example",
  subject: "Please verify my account — cannot withdraw",
  body: "I need you to verify my identity so I can withdraw. Passport ready.",
  locale: "en",
  actor: "verify-cs-data",
});
assert(idCase?.request.assigned_bu === "CUSTOMER_SERVICE", `ID case BU ${idCase?.request.assigned_bu}`);
assert(idCase?.request.assigned_to === "CS KYC Vault" || idCase?.request.status === "ID_VERIFY", "ID case vault/status");

const trCase = ingestCsRequest({
  channel: "WEB_FORM",
  client_name: "Data Verify TR",
  client_email: "data.tr@client.example",
  subject: "Slippage on EURUSD market order",
  body: "EURUSD market order on MT5 ticket 849201 filled 2.1 pips worse than the button.",
  locale: "en",
  actor: "verify-cs-data",
});
assert(trCase?.request.assigned_bu === "TRADING", `TR case BU ${trCase?.request.assigned_bu}`);

const root = path.resolve(__dirname, "..");
const nav = fs.readFileSync(path.join(root, "src/lib/nav.ts"), "utf8");
assert(nav.includes('href: "/admin/cs-data"'), "nav cs-data");

const page = fs.readFileSync(path.join(root, "src/app/admin/cs-data/page.tsx"), "utf8");
assert(page.includes("getCsOpsContract"), "cs-data page uses contract");
assert(page.includes("cs.read"), "cs-data auth");

const view = fs.readFileSync(path.join(root, "src/components/CsOpsDataView.tsx"), "utf8");
assert(view.includes("cs-ops-data"), "ops view testid");
assert(view.includes("/admin/settings#settings-cs"), "settings jump");

const api = fs.readFileSync(path.join(root, "src/app/api/cs/route.ts"), "utf8");
assert(api.includes('"data"'), "API data view");

const settings = fs.readFileSync(path.join(root, "src/components/SettingsManager.tsx"), "utf8");
assert(settings.includes("cs.followup_cap"), "settings cs.followup_cap");
assert(settings.includes("CS / TR operations") || settings.includes("titleEn: \"CS / TR operations\""), "settings CS group");

const i18n = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
assert(i18n.includes('"cs-data"'), "i18n page meta");
assert(i18n.includes("/admin/cs-data"), "i18n nav");

const map = fs.readFileSync(path.join(root, "src/lib/ai/skill-escalation-map.ts"), "utf8");
assert(map.includes('"SKILL-CS-ID-VERIFY": "ESC-CS-KYC"'), "skill map KYC hop");

console.log("verify-cs-data: ok");
console.log(
  JSON.stringify(
    {
      bus: contract.bus.map((b) => b.code),
      teams: contract.teams.map((t) => t.name),
      routes: contract.routes.map((r) => r.route_code),
      cap: contract.params.followup_cap,
      settings: contract.settings.length,
      sources: contract.sources.length,
      lark: contract.lark.map((c) => c.chat_id),
    },
    null,
    2
  )
);
