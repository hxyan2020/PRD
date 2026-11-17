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
    minEdges: 8,
    firstLabel: "C1, form, email",
  },
  {
    name: "cs-intake-zh (TSD §17)",
    src: `graph TD
  In[C1／表單／官方信箱] --> API[POST /api/cs/intake]
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
    minEdges: 8,
    firstLabel: "C1／表單／官方信箱",
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
