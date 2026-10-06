/**
 * Explicit skill → RAG document links for the Knowledge Tree.
 * Used before token-overlap heuristics so playbooks always surface the right corpus.
 */
export const SKILL_RAG_DOCS: Record<string, string[]> = {
  "SKILL-MARGIN-SPIKE": ["margin-stopout", "copy-trading", "macro-event-risk", "cfd-nbp-gap", "escalation-spine"],
  "SKILL-COPY-CONCENTRATION": ["copy-trading", "margin-stopout", "promos-abuse", "cfd-broker-rm"],
  "SKILL-LP-REJECT": ["lp-hedge", "cfd-broker-rm", "escalation-spine"],
  "SKILL-HEDGE-GAP": ["lp-hedge", "cfd-broker-rm", "macro-event-risk"],
  "SKILL-XAU-LIMIT": ["xauusd247", "macro-event-risk", "cfd-nbp-gap"],
  "SKILL-CRYPTO-WALLET": ["crypto-wallet", "crypto-exchange-rm", "crypto-liquidation"],
  "SKILL-CRYPTO-LIQ": ["crypto-liquidation", "crypto-exchange-rm", "crypto-wallet"],
  "SKILL-FRAUD-CLUSTER": ["promos-abuse", "accounts-pricing", "cfd-broker-rm"],
  "SKILL-FEED-STALE": ["lp-hedge", "macro-event-risk", "crmp-built-surface"],
  "SKILL-STOP-CASCADE": ["margin-stopout", "cfd-nbp-gap", "copy-trading"],
  "SKILL-NBP-SPIKE": ["cfd-nbp-gap", "margin-stopout", "macro-event-risk"],
  "SKILL-BONUS-ABUSE": ["promos-abuse", "accounts-pricing"],
  "SKILL-WD-SURGE": ["crypto-wallet", "crmp-org-raci", "escalation-spine"],
  "SKILL-MODEL-DRIFT": ["crmp-admin-purpose", "crmp-built-surface", "ai-human-escalate"],
  "SKILL-CS-CLARIFY": ["cs-24-7-intake", "cs-skill-playbooks", "crmp-built-surface"],
  "SKILL-CS-ID-VERIFY": ["cs-id-verify-policy", "cs-24-7-intake", "cs-skill-playbooks"],
  "SKILL-CS-ACCOUNT-FAQ": ["cs-swap-faq", "accounts-pricing", "xauusd247", "cs-24-7-intake"],
  "SKILL-TR-EXECUTION": ["tr-dealing-handoff", "lp-hedge", "cs-24-7-intake", "cs-skill-playbooks"],
  "SKILL-CS-ESCALATE-RISK": ["cs-escalate-to-risk", "escalation-spine", "ai-human-escalate", "cs-24-7-intake"],
};

type DocLike = {
  doc_key: string;
  title: string;
  category: string;
  product_scope: string;
  tags: string[];
};

/** Resolve RAG docs for a skill: explicit map → monitor tags → token overlap. */
export function resolveDocsForSkill<T extends DocLike>(
  skill: {
    code: string;
    name: string;
    description: string;
    indicator: { domain: string; product: string; name: string; monitor_id: string };
  },
  docs: T[],
  limit = 6
): T[] {
  const byKey = new Map(docs.map((d) => [d.doc_key, d]));
  const scored = new Map<string, number>();

  const bump = (key: string, n: number) => {
    if (!byKey.has(key)) return;
    scored.set(key, (scored.get(key) || 0) + n);
  };

  for (const key of SKILL_RAG_DOCS[skill.code] || []) bump(key, 20);

  const mid = skill.indicator.monitor_id.toUpperCase();
  for (const d of docs) {
    const hay = `${d.title} ${d.tags.join(" ")}`.toUpperCase();
    if (mid && hay.includes(mid)) bump(d.doc_key, 12);
  }

  const blob = `${skill.code} ${skill.name} ${skill.description} ${skill.indicator.domain} ${skill.indicator.product} ${skill.indicator.name}`.toLowerCase();
  const tokens = new Set(blob.split(/[^a-z0-9]+/).filter((t) => t.length > 3));
  if (/MARGIN|COPY|CREDIT/.test(skill.code)) {
    tokens.add("margin");
    tokens.add("copy");
  }
  if (/LP|HEDGE|ABOOK/.test(skill.code)) {
    tokens.add("hedge");
    tokens.add("lp");
  }
  if (/CRYPTO|WALLET|LIQ/.test(skill.code)) {
    tokens.add("crypto");
    tokens.add("wallet");
    tokens.add("liquidation");
  }
  if (/XAU|GOLD/.test(skill.code)) tokens.add("gold");
  if (/FRAUD|BONUS|WASH/.test(skill.code)) tokens.add("fraud");
  if (/CS-|TR-EXEC/.test(skill.code) || /CS_SERVICE|TRADING_EXEC/.test(skill.indicator.domain)) {
    tokens.add("customer");
    tokens.add("intake");
    tokens.add("kyc");
    tokens.add("swap");
    tokens.add("slippage");
    tokens.add("dealing");
  }
  for (const d of docs) {
    const hay = `${d.title} ${d.category} ${d.product_scope} ${d.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const tok of tokens) if (hay.includes(tok)) score += 1;
    if (score > 0) bump(d.doc_key, score);
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => byKey.get(k)!)
    .filter(Boolean);
}
