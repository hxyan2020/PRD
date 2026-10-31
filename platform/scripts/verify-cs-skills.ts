/**
 * CS/TR dedicated skills, RAG map, and Knowledge Tree domains.
 * Run: npx tsx scripts/verify-cs-skills.ts
 */
import { CS_LINKED_SCENARIOS, CS_SKILL_SCENARIOS } from "../src/lib/ai/risk-scenarios-cs";
import { LINKED_SCENARIOS, SKILL_SCENARIOS } from "../src/lib/ai/risk-scenarios-catalog";
import { SKILL_RAG_DOCS, resolveDocsForSkill } from "../src/lib/ai/skill-rag-map";
import { SKILL_ESCALATION_ROUTE, escalationRouteForSkill } from "../src/lib/ai/skill-escalation-map";
import { SEED_RAG_DOCS } from "../src/lib/ai/rag-corpus";
import { SKILL_ZH, CHAIN_ZH } from "../src/lib/ai/skill-zh";
import { finalizeSkill } from "../src/lib/ai/skill-playbook";
import { EXTRA_RISK_DOMAINS, EXTRA_MONITOR_SEED_ROWS } from "../src/lib/ai/risk-domain-scenarios";
import { skillCodeForTriage } from "../src/lib/cs/skills";
import { PHRASES_ZH } from "../src/lib/i18n-extra";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const expected = [
  "SKILL-CS-CLARIFY",
  "SKILL-CS-ID-VERIFY",
  "SKILL-CS-ACCOUNT-FAQ",
  "SKILL-TR-EXECUTION",
  "SKILL-CS-ESCALATE-RISK",
];

for (const code of expected) {
  assert(SKILL_SCENARIOS.some((s) => s.code === code), `catalog missing ${code}`);
  assert(CS_SKILL_SCENARIOS.some((s) => s.code === code), `CS catalog missing ${code}`);
  assert(SKILL_ZH[code]?.name, `SKILL_ZH missing ${code}`);
  assert(SKILL_RAG_DOCS[code]?.length, `SKILL_RAG_DOCS missing ${code}`);
  assert(SKILL_ESCALATION_ROUTE[code], `escalation bind missing ${code}`);
  const pb = finalizeSkill(CS_SKILL_SCENARIOS.find((s) => s.code === code)!, "en");
  assert(pb.when_to_use.length && pb.prechecks.length && pb.success_criteria.length, `playbook thin ${code}`);
  const zh = finalizeSkill(CS_SKILL_SCENARIOS.find((s) => s.code === code)!, "zh-Hant");
  assert(zh.name !== pb.name, `zh overlay missing for ${code}`);
}

assert(
  LINKED_SCENARIOS.some((c) => c.code === "CHAIN-CS-TR-INTAKE"),
  "CHAIN-CS-TR-INTAKE not in LINKED_SCENARIOS"
);
assert(CHAIN_ZH["CHAIN-CS-TR-INTAKE"]?.name, "CHAIN_ZH missing CHAIN-CS-TR-INTAKE");

const ragKeys = [
  "cs-24-7-intake",
  "cs-id-verify-policy",
  "cs-swap-faq",
  "tr-dealing-handoff",
  "cs-escalate-to-risk",
  "cs-skill-playbooks",
];
for (const key of ragKeys) {
  assert(SEED_RAG_DOCS.some((d) => d.doc_key === key), `RAG missing ${key}`);
}

const docs = SEED_RAG_DOCS.map((d) => ({
  doc_key: d.doc_key,
  title: d.title,
  category: d.category,
  product_scope: d.product_scope,
  tags: d.tags,
}));
const faq = CS_SKILL_SCENARIOS.find((s) => s.code === "SKILL-CS-ACCOUNT-FAQ")!;
const leaves = resolveDocsForSkill(faq, docs, 6);
assert(
  leaves.some((d) => d.doc_key === "cs-swap-faq"),
  `FAQ skill should resolve cs-swap-faq, got ${leaves.map((d) => d.doc_key).join(",")}`
);

assert(escalationRouteForSkill("SKILL-CS-CLARIFY") === "ESC-CS-24-7", "clarify route");
assert(escalationRouteForSkill("SKILL-TR-EXECUTION") === "ESC-TR-DEAL", "tr route");
assert(escalationRouteForSkill("SKILL-CS-ESCALATE-RISK") === "ESC-CS-RISK", "esc route");
assert(escalationRouteForSkill("UNKNOWN", { domain: "CS_SERVICE" }) === "ESC-CS-24-7", "domain fallback");

assert(EXTRA_RISK_DOMAINS.some((d) => d.code === "CS_SERVICE"), "CS_SERVICE domain");
assert(EXTRA_RISK_DOMAINS.some((d) => d.code === "TRADING_EXEC"), "TRADING_EXEC domain");
for (const id of ["M2-CS-UNCLEAR", "M2-CS-ID", "M2-CS-FAQ", "M2-TR-EXEC", "M2-CS-ESC"]) {
  assert(
    EXTRA_MONITOR_SEED_ROWS.some((m) => m.monitor_id === id),
    `monitor missing ${id}`
  );
}

assert(skillCodeForTriage({ clarity: "unclear", desk: "CS", category: "question" }) === "SKILL-CS-CLARIFY", "unclear");
assert(skillCodeForTriage({ clarity: "need_id", desk: "CS", category: "kyc" }) === "SKILL-CS-ID-VERIFY", "id");
assert(
  skillCodeForTriage({
    clarity: "clear",
    desk: "CS",
    category: "question",
    subject: "Swap",
    body: "weekend triple on XAUUSD",
  }) === "SKILL-CS-ACCOUNT-FAQ",
  "faq"
);
assert(
  skillCodeForTriage({
    clarity: "clear",
    desk: "TR",
    category: "trading",
    subject: "Slippage",
    body: "MT5 fill",
  }) === "SKILL-TR-EXECUTION",
  "tr"
);
assert(PHRASES_ZH.CS_SERVICE === "客服 24/7", "phrase CS_SERVICE");
assert(PHRASES_ZH.TRADING_EXEC === "交易成交（TR）", "phrase TRADING_EXEC");

const domains = new Set(SKILL_SCENARIOS.map((s) => s.indicator.domain));
assert(domains.has("CS_SERVICE"), "tree domain CS_SERVICE");
assert(domains.has("TRADING_EXEC"), "tree domain TRADING_EXEC");

console.log("verify-cs-skills: ok");
console.log(
  JSON.stringify(
    {
      skills: expected.length,
      chain: "CHAIN-CS-TR-INTAKE",
      rag: ragKeys.length,
      faqLeaves: leaves.map((d) => d.doc_key),
      domains: ["CS_SERVICE", "TRADING_EXEC"],
    },
    null,
    2
  )
);
