/**
 * Templates for new Knowledge Tree nodes:
 * - RAG leaf (SEED_RAG_DOCS / rag_documents)
 * - Skill ↔ RAG bind (SKILL_RAG_DOCS) — creates edges on the Domains trunk
 * - Domain trunk checklist
 * - Chain node (already a LinkedScenario; listed for KT authors)
 */

export type KtTemplateKind = "rag_leaf" | "skill_rag_bind" | "domain_trunk" | "chain_node" | "full_pack";

export type KtTemplate = {
  id: string;
  kind: KtTemplateKind;
  title_en: string;
  title_zh: string;
  blurb_en: string;
  blurb_zh: string;
  files: string[];
  body_ts: string;
  checklist_en?: string[];
  checklist_zh?: string[];
};

export const KNOWLEDGE_TREE_TEMPLATES: KtTemplate[] = [
  {
    id: "TPL-KT-RAG-LEAF",
    kind: "rag_leaf",
    title_en: "RAG knowledge leaf (corpus document)",
    title_zh: "RAG 知識葉節點（語料文件）",
    blurb_en:
      "Adds a document that appears under Knowledge Tree → RAG trunk and /admin/rag. Link it from skills via SKILL_RAG_DOCS.",
    blurb_zh: "新增會出現在知識樹 RAG 主幹與 /admin/rag 的文件；經 SKILL_RAG_DOCS 掛到技能。",
    files: [
      "platform/src/lib/ai/rag-corpus.ts → SEED_RAG_DOCS",
      "Optional: seed into SQLite via seed-rag / app boot",
      "Optional Traditional Chinese tags in tags[]",
    ],
    body_ts: `import type { RagCorpusDoc } from "@/lib/ai/rag-corpus";

/** Paste into SEED_RAG_DOCS array in rag-corpus.ts */
export const YOUR_RAG_LEAF: RagCorpusDoc = {
  doc_key: "your-policy-leaf", // stable slug; used in ?doc= and SKILL_RAG_DOCS
  title: "YOUR Policy Leaf Title",
  category: "RISK_POLICY", // BUSINESS | PRODUCT | RISK_POLICY | OPS | TECH | REGULATORY | FRAUD | MARKET | CS_POLICY | …
  product_scope: "CFD", // CFD | CRYPTO | CFD+CRYPTO | PLATFORM
  source_ref: "internal://crmp/your-policy", // or https://… public URL
  tags: ["your-tag", "desk", "你的繁中標籤"],
  content: \`Write operator-facing facts the AI may cite.
Include: what the control is, warn/breach if any, who owns it, what AI must NOT do,
and links to Monitor ids (M2-*) or admin paths (/admin/…).
Keep under ~2k characters for retrieval quality.\`,
};
`,
    checklist_en: [
      "doc_key unique vs existing SEED_RAG_DOCS",
      "source_ref set (internal:// or https://)",
      "tags include EN + 繁中 search tokens",
      "Bind from at least one skill in SKILL_RAG_DOCS",
      "Verify on /admin/rag?doc=your-policy-leaf and Knowledge Tree → RAG",
    ],
    checklist_zh: [
      "doc_key 不與既有 SEED_RAG_DOCS 衝突",
      "設定 source_ref（internal:// 或 https://）",
      "tags 含英文與繁中搜尋詞",
      "至少一個技能在 SKILL_RAG_DOCS 綁定",
      "在 /admin/rag?doc=… 與知識樹 RAG 主幹驗證",
    ],
  },
  {
    id: "TPL-KT-SKILL-RAG-BIND",
    kind: "skill_rag_bind",
    title_en: "Skill → RAG edge (Knowledge Tree link)",
    title_zh: "技能 → RAG 邊（知識樹連線）",
    blurb_en: "Without this bind, the Domains trunk may only heuristic-match leaves. Explicit map wins.",
    blurb_zh: "無此綁定時 Domains 主幹可能只靠啟發式對葉；明確對照優先。",
    files: ["platform/src/lib/ai/skill-rag-map.ts → SKILL_RAG_DOCS"],
    body_ts: `import { SKILL_RAG_DOCS } from "@/lib/ai/skill-rag-map";

// Add one line (doc_keys must exist in SEED_RAG_DOCS / rag_documents):
// SKILL_RAG_DOCS["SKILL-YOUR-CODE"] = ["your-policy-leaf", "escalation-spine", "crmp-built-surface"];

export const YOUR_SKILL_RAG_BIND: Record<string, string[]> = {
  "SKILL-YOUR-CODE": [
    "your-policy-leaf", // primary leaf for this playbook
    "escalation-spine", // shared ops spine
    "ai-human-escalate", // if human gates apply
  ],
};

// Knowledge Tree uses resolveDocsForSkill() which scores explicit keys at +20.
`,
    checklist_en: [
      "Skill code already seeded in SKILL_SCENARIOS",
      "Every doc_key exists",
      "Open /admin/knowledge-tree → Domains → your domain → skill → see leaves",
      "Skill playbook page also lists linked RAG",
    ],
    checklist_zh: [
      "技能碼已在 SKILL_SCENARIOS 種子中",
      "每個 doc_key 皆存在",
      "開啟知識樹 Domains → 領域 → 技能 → 見葉節點",
      "技能劇本頁亦列出連結 RAG",
    ],
  },
  {
    id: "TPL-KT-DOMAIN",
    kind: "domain_trunk",
    title_en: "Domain trunk placement checklist",
    title_zh: "領域主幹掛載檢查清單",
    blurb_en:
      "Domains are derived from skill.indicator.domain — no separate domain table. New trunk = ship a skill with that domain.",
    blurb_zh: "領域由 skill.indicator.domain 衍生 — 無獨立領域表。新主幹＝上架帶該 domain 的技能。",
    files: [
      "SkillScenario.indicator.domain",
      "KnowledgeTreeBoard DOMAIN_COLOR (optional colour)",
      "i18n phrase() for domain label",
    ],
    body_ts: `// Knowledge Tree Domains trunk auto-groups by indicator.domain.
// Supported colours today (add if new):
// CREDIT_CLIENT, LP_HEDGE, MARKET_PRICING, CRYPTO_EXCHANGE, FRAUD_CONDUCT,
// PRODUCT_CONFIG, MODEL_AI, OPS_PROCESS, REG_CAPITAL, TECH_INFRA,
// CS_SERVICE, TRADING_EXEC

// To create / grow a trunk:
// 1) Set skill.indicator.domain = "YOUR_DOMAIN"
// 2) Optionally add DOMAIN_COLOR["YOUR_DOMAIN"] = "#hex" in KnowledgeTreeBoard.tsx
// 3) Add phrase("YOUR_DOMAIN", …) in i18n if you want a pretty label
// 4) Attach RAG leaves via SKILL_RAG_DOCS
// 5) Optional: LINKED_SCENARIOS with domain: "YOUR_DOMAIN" for Chains trunk

export const YOUR_DOMAIN_NOTES = {
  domain: "YOUR_DOMAIN",
  color_hex: "#10233a",
  first_skill: "SKILL-YOUR-CODE",
  rag_leaves: ["your-policy-leaf"],
};
`,
    checklist_en: [
      "At least one skill uses the domain",
      "Colour optional but recommended for map view",
      "CS_SERVICE / TRADING_EXEC are Plus-only (omit on classic Admin)",
      "Risk Domains page SCN-* catalogue is separate — link narratively if needed",
    ],
    checklist_zh: [
      "至少一個技能使用該 domain",
      "建議在地圖檢視為領域上色",
      "CS_SERVICE／TRADING_EXEC 僅 Plus（原版 Admin 勿加）",
      "風險領域 SCN-* 目錄是分開的 — 需要時敘事性連結",
    ],
  },
  {
    id: "TPL-KT-CHAIN-NODE",
    kind: "chain_node",
    title_en: "Chains trunk node (linked scenario)",
    title_zh: "Chains 主幹節點（連結情境）",
    blurb_en: "Same as the linked-chain skill template — appears under Knowledge Tree → Chains.",
    blurb_zh: "與連結鏈技能範本相同 — 出現在知識樹 → Chains。",
    files: ["LINKED_SCENARIOS export", "CHAIN_ZH"],
    body_ts: `// See skill template TPL-CHAIN (LinkedScenario).
// After export in LINKED_SCENARIOS:
// - Knowledge Tree → Chains trunk lists it
// - Docs → Risk scenarios shows kind=chain + correlation_pattern=multi_indicator_sequence
// - Monitor indicator meta combinations[] gains partners from the sequence

export const KT_CHAIN_REMINDER = {
  code: "CHAIN-YOUR-NAME",
  linked_skills: ["SKILL-YOUR-CODE"],
  sequence_monitors: ["M2-A", "M2-B", "M2-C"],
};
`,
    checklist_en: [
      "linked_skills codes exist",
      "sequence monitor_ids are real M2-* where possible",
      "CHAIN_ZH name/description for 繁中",
      "Visible under Knowledge Tree → Chains with product filter",
    ],
    checklist_zh: [
      "linked_skills 代碼存在",
      "時序 monitor_id 盡量為真實 M2-*",
      "CHAIN_ZH 有繁中名稱／描述",
      "在知識樹 → Chains 與商品篩選下可見",
    ],
  },
  {
    id: "TPL-KT-FULL-PACK",
    kind: "full_pack",
    title_en: "Full pack: skill + RAG leaf + bind + optional chain",
    title_zh: "完整包：技能＋RAG 葉＋綁定＋可選連結鏈",
    blurb_en: "End-to-end authoring order for a new Knowledge Tree branch.",
    blurb_zh: "新知識樹分枝的端到端撰寫順序。",
    files: [
      "rag-corpus.ts",
      "risk-scenarios-*.ts",
      "skill-zh.ts",
      "skill-escalation-map.ts",
      "skill-rag-map.ts",
      "optional LINKED_SCENARIOS",
    ],
    body_ts: `/**
 * Recommended order (copy each block from sibling templates):
 *
 * 1) RAG leaf     → SEED_RAG_DOCS (TPL-KT-RAG-LEAF)
 * 2) Skill        → SKILL_SCENARIOS (pick TPL-SKILL-* by domain)
 * 3) ZH overlay   → SKILL_ZH[code]
 * 4) Escalation   → SKILL_ESCALATION_ROUTE[code]
 * 5) RAG bind     → SKILL_RAG_DOCS[code] (TPL-KT-SKILL-RAG-BIND)
 * 6) Optional chain → LINKED_SCENARIOS + CHAIN_ZH (TPL-CHAIN)
 * 7) Restart / reseed → open /admin/skills/SKILL-… and /admin/knowledge-tree
 * 8) Docs Risk scenarios auto-projects the new skill/chain on next build
 *
 * Human gates: any halt / leverage / LP disable / WD pause → requires_human: true
 * AI must not write RAG directly — propose_rag maker/checker only.
 */

export const YOUR_FULL_PACK_MANIFEST = {
  rag_doc_key: "your-policy-leaf",
  skill_code: "SKILL-YOUR-CODE",
  route_code: "ESC-YOUR-ROUTE",
  domain: "CREDIT_CLIENT",
  chain_code: "CHAIN-YOUR-NAME", // or null
  editions: ["plus"], // add "classic" only if no CS/TR
};
`,
    checklist_en: [
      "Playbook opens at /admin/skills/SKILL-YOUR-CODE",
      "Leaves show under skill on Knowledge Tree",
      "Escalation route resolves (never empty)",
      "UAT: Ack path on Demo Messenger still human-gated for controls",
      "If CS/TR: only ship on CRMP Plus",
    ],
    checklist_zh: [
      "可開啟 /admin/skills/SKILL-YOUR-CODE 劇本",
      "知識樹上技能下可見葉節點",
      "升級路徑可解析（不可空白）",
      "UAT：示範 Messenger 控制項仍為人工關卡",
      "若為 CS／TR：僅上架 CRMP Plus",
    ],
  },
];
