import { SKILL_TEMPLATES } from "../src/lib/docs/skill-templates";
import { KNOWLEDGE_TREE_TEMPLATES } from "../src/lib/docs/knowledge-tree-templates";
import { PLATFORM_URLS } from "../src/lib/docs/urls";
import { NAV_ITEMS } from "../src/lib/nav";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

assert(SKILL_TEMPLATES.length >= 10, "≥10 skill templates");
assert(KNOWLEDGE_TREE_TEMPLATES.length >= 4, "≥4 KT templates");

const kinds = new Set(SKILL_TEMPLATES.map((t) => t.kind));
for (const k of [
  "skeleton",
  "credit",
  "lp_hedge",
  "crypto",
  "pricing_feed",
  "fraud",
  "admin_model",
  "ops_funding",
  "cs_intake",
  "tr_execution",
  "linked_chain",
] as const) {
  assert(kinds.has(k), `skill kind ${k}`);
}

for (const t of SKILL_TEMPLATES) {
  assert(t.body_ts.includes("YOUR_") || t.body_ts.includes("SKILL-YOUR") || t.body_ts.includes("CHAIN-YOUR"), `${t.id} has placeholders`);
  assert(t.title_zh.length > 0 && t.blurb_zh.length > 0, `${t.id} bilingual titles`);
}

for (const k of ["rag_leaf", "skill_rag_bind", "domain_trunk", "chain_node", "full_pack"] as const) {
  assert(
    KNOWLEDGE_TREE_TEMPLATES.some((t) => t.kind === k),
    `KT kind ${k}`
  );
}

for (const t of KNOWLEDGE_TREE_TEMPLATES) {
  assert(t.body_ts.length > 40, `${t.id} has body`);
  assert(/rag-corpus|SKILL_RAG|SEED_RAG|LINKED|domain|YOUR_/i.test(t.body_ts + t.files.join(" ")), `${t.id} points at wiring`);
}

assert(
  NAV_ITEMS.some((n) => n.href === "/admin/docs/templates"),
  "nav has templates"
);
assert(
  PLATFORM_URLS.some((u) => u.path === "/admin/docs/templates"),
  "URL catalog has templates"
);

if (process.exitCode) {
  console.error("templates doc verification failed");
  process.exit(1);
}
console.log("templates doc verification passed", {
  skills: SKILL_TEMPLATES.length,
  kt: KNOWLEDGE_TREE_TEMPLATES.length,
});
