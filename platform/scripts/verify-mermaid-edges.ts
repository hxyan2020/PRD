/**
 * Regression: first node with a labelled shape must link to the rest.
 * Run: npx tsx scripts/verify-mermaid-edges.ts
 */
import { mermaidToHtml } from "../src/lib/docs-mermaid";

const CASES: Array<{ name: string; src: string; minEdges: number; firstLabel: string }> = [
  {
    name: "scan-zh (PRD)",
    src: `graph TD
  Scan[立即掃描] --> Q{GitHub Pages?}
  Q -->|是| Demo[用戶端示範掃描]
  Q -->|否| Live[POST API 掃描]
  Demo --> Cards[發現加寄件匣]
  Live --> Cards`,
    minEdges: 5,
    firstLabel: "立即掃描",
  },
  {
    name: "tree-zh (PRD)",
    src: `graph TD
  Tree[知識樹] --> Filter[CFD 或 Crypto 篩選]
  Filter --> Dom[點領域]
  Dom --> Skill[點技能]
  Skill --> Enter[進入 SKILL.md]`,
    minEdges: 4,
    firstLabel: "知識樹",
  },
  {
    name: "badge-zh LR (PRD)",
    src: `graph LR
  Event[新工作] --> Extra[徽章加增量]
  Extra --> View[打開分頁]
  View --> Seen[已看等於總數]`,
    minEdges: 3,
    firstLabel: "新工作",
  },
  {
    name: "scan-en labelled diamond",
    src: `graph TD
  Scan[Scan now] --> Q{GitHub Pages?}
  Q -->|Yes| Demo[Client demo scan]
  Q -->|No| Live[POST API scan]
  Demo --> Cards[Findings plus outbox]
  Live --> Cards`,
    minEdges: 5,
    firstLabel: "Scan now",
  },
  {
    name: "chained hops",
    src: `flowchart TD
A[First] --> B[Second] --> C[Third]`,
    minEdges: 2,
    firstLabel: "First",
  },
  {
    name: "stadium start",
    src: `graph TD
  Start([Event]) --> Path{Match?}
  Path -->|hit| Desk[Risk Desk]
  Path -->|miss| Def[ESC-DEFAULT]`,
    minEdges: 3,
    firstLabel: "Event",
  },
  {
    name: "cs-intake-en (TSD §17)",
    src: `graph TD
  In[C1, form, email] --> API[POST /api/cs/intake]
  Portal[Client portal /cs] --> In
  Reply[Inbound reply CSR or channel_ref] --> API
  API --> Triage[AI triage]
  Triage -->|clear CS| Open[OPEN on CS]
  Triage -->|trading| TR[ASSIGNED_TR]
  Triage -->|unclear or need_id| Mail[Auto EMAIL_OUT]
  Mail --> Wait[AWAITING_CLIENT or ID_VERIFY]
  Wait -->|client reply| Triage
  Wait -->|cap 3| Lead[CS Lead human]
  Open --> Risk{Book risk?}
  TR --> Risk
  Risk -->|yes| Esc[ESCALATED_RISK to Messenger]
  Risk -->|no| Done[RESOLVED]`,
    minEdges: 10,
    firstLabel: "C1, form, email",
  },
  {
    name: "cs-intake-zh (TSD §17)",
    src: `graph TD
  In[C1／表單／官方信箱] --> API[POST /api/cs/intake]
  Portal[客戶入口 /cs] --> In
  Reply[進件回覆 CSR 或 channel_ref] --> API
  API --> Triage[AI 分流]
  Triage -->|清楚 CS| Open[CS 未結]
  Triage -->|交易| TR[已派 TR]
  Triage -->|不清楚或需核身| Mail[自動 EMAIL_OUT]
  Mail --> Wait[待客戶／身分驗證]
  Wait -->|客戶回覆| Triage
  Wait -->|上限 3| Lead[CS Lead 人工]
  Open --> Risk{帳簿風險?}
  TR --> Risk
  Risk -->|是| Esc[升級風控 → Messenger]
  Risk -->|否| Done[已結案]`,
    minEdges: 10,
    firstLabel: "C1／表單／官方信箱",
  },
  {
    name: "ug-wait-loop-en",
    src: `graph TD
  Thin[Unclear or need ID] --> Mail[Auto EMAIL_OUT]
  Mail --> Wait[WAITING follow-up]
  Wait -->|CSR or C1 reply| Again[AI re-triage]
  Wait -->|cap 3| Lead[CS Lead human]
  Again -->|still thin| Mail
  Again -->|clear enough| Open[OPEN or ASSIGNED_TR]`,
    minEdges: 5,
    firstLabel: "Unclear or need ID",
  },
  {
    name: "ug-wait-loop-zh",
    src: `graph TD
  Thin[不清楚或需核身] --> Mail[自動 EMAIL_OUT]
  Mail --> Wait[WAITING 追問]
  Wait -->|CSR 或 C1 回覆| Again[AI 重新分流]
  Wait -->|上限 3| Lead[CS Lead 人工]
  Again -->|仍過短| Mail
  Again -->|夠清楚| Open[未結或已派 TR]`,
    minEdges: 5,
    firstLabel: "不清楚或需核身",
  },
  {
    name: "prd-skill-stamp-en",
    src: `graph TD
  In[POST intake] --> Stamp[Stamp skill_code]
  Stamp -->|CLARIFY or ID| Mail[Auto email wait]
  Stamp -->|FAQ| Cs[CS auto-reply RAG]
  Stamp -->|TR-EXEC| Tr[Assign TR]
  Stamp -->|ESC-RISK| Msg[Messenger spine]`,
    minEdges: 5,
    firstLabel: "POST intake",
  },
  {
    name: "prd-skill-stamp-zh",
    src: `graph TD
  In[POST 進件] --> Stamp[蓋 skill_code]
  Stamp -->|釐清或核身| Mail[自動信件等待]
  Stamp -->|FAQ| Cs[CS 從 RAG 自動回]
  Stamp -->|TR 成交| Tr[指派 TR]
  Stamp -->|升級風控| Msg[Messenger 脊柱]`,
    minEdges: 5,
    firstLabel: "POST 進件",
  },
  {
    name: "tsd-wait-en",
    src: `graph TD
  New[New ingest] --> Triage[triageText plus skill stamp]
  Triage -->|clear FAQ| Open[OPEN]
  Triage -->|trading| TR[ASSIGNED_TR]
  Triage -->|unclear| Wait[AWAITING_CLIENT WAITING]
  Triage -->|need_id| Id[ID_VERIFY WAITING]
  Wait -->|CSR or channel_ref reply| Triage
  Id -->|CSR or channel_ref reply| Triage
  Wait -->|cap 3| Lead[CS Lead]
  Id -->|cap 3| Lead
  Open --> Hold{WAITING followup?}
  Hold -->|yes| Block[Resolve blocked]
  Hold -->|no| Done[RESOLVED]`,
    minEdges: 10,
    firstLabel: "New ingest",
  },
  {
    name: "tsd-wait-zh",
    src: `graph TD
  New[新進件] --> Triage[triageText 加技能蓋章]
  Triage -->|清楚 FAQ| Open[未結]
  Triage -->|交易| TR[已派 TR]
  Triage -->|不清楚| Wait[待客戶 WAITING]
  Triage -->|需核身| Id[身分驗證 WAITING]
  Wait -->|CSR 或 channel_ref 回覆| Triage
  Id -->|CSR 或 channel_ref 回覆| Triage
  Wait -->|上限 3| Lead[客服主管]
  Id -->|上限 3| Lead
  Open --> Hold{WAITING 追問?}
  Hold -->|是| Block[禁止結案]
  Hold -->|否| Done[已結案]`,
    minEdges: 10,
    firstLabel: "新進件",
  },
  {
    name: "ai-use-loop-en",
    src: `graph TD
  Human[Human decides] --> Prompt[Prompt plus context]
  Prompt --> Model[LLM or heuristic]
  Model --> Out[Draft answer]
  Out --> Check{Safe to send?}
  Check -->|No| Hold[Hold and retry]
  Check -->|Yes| Act[Show on desk]`,
    minEdges: 5,
    firstLabel: "Human decides",
  },
  {
    name: "ai-use-loop-zh",
    src: `graph TD
  Human[人類做決定] --> Prompt[提示加脈絡]
  Prompt --> Model[LLM 或啟發式]
  Model --> Out[草稿答案]
  Out --> Check{可安全送出?}
  Check -->|否| Hold[扣住再試]
  Check -->|是| Act[顯示在台面]`,
    minEdges: 5,
    firstLabel: "人類做決定",
  },
  {
    name: "ai-use-glossary-en",
    src: `graph LR
  Prompt[Prompt] --> Agent[Agent]
  Agent --> Skill[Skill playbook]
  Agent --> Rag[RAG retrieve]
  Agent --> Mcp[MCP tools]
  Skill --> Draft[Draft pack]
  Rag --> Draft
  Mcp --> Draft
  Draft --> Human[Human gate]`,
    minEdges: 8,
    firstLabel: "Prompt",
  },
];

function edgeCount(html: string) {
  return (html.match(/marker-end=/g) || []).length;
}

function hasLabel(html: string, label: string) {
  return html.includes(`>${label}<`) || html.includes(label);
}

/** Heuristic: first source box should not sit alone at rank 0 beside its destination.
 * With a parsed first edge, TD layout stacks them (same cx); broken layout places them side-by-side. */
function firstEdgeLooksLinked(html: string, firstLabel: string): boolean {
  const edges = [...html.matchAll(/<path d="(M [\d.]+) ([\d.]+) C[^"]+"[^>]*marker-end/g)];
  if (!edges.length) return false;
  // At least one vertical (TD) or horizontal (LR) connector must exist.
  return edgeCount(html) >= 1 && hasLabel(html, firstLabel);
}

let failed = 0;
for (const c of CASES) {
  const html = mermaidToHtml(c.src);
  const n = edgeCount(html);
  const okEdges = n >= c.minEdges;
  const okLabel = hasLabel(html, c.firstLabel);
  const okLink = firstEdgeLooksLinked(html, c.firstLabel);
  const pass = okEdges && okLabel && okLink;
  console.log(`${pass ? "PASS" : "FAIL"} ${c.name}: edges=${n} (need ≥${c.minEdges}) label=${okLabel}`);
  if (!pass) failed += 1;
}

if (failed) {
  console.error(`\n${failed} mermaid edge regression(s) failed`);
  process.exit(1);
}
console.log("\nAll mermaid first-edge regressions passed");
