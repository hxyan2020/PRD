import type { ProductionExample } from './types'

/** Real-life / documented production patterns keyed by curriculum day */
export const productionExamples: Record<number, ProductionExample> = {
  1: {
    source: 'Air Canada chatbot (2024 tribunal case)',
    setting: 'Airline support chatbot answering bereavement-fare policy',
    whatHappened:
      'The bot invented a refund policy the airline did not offer. The company argued the bot was a “separate legal entity”; the tribunal held the airline responsible for the advice.',
    poLesson:
      'You own the product outcome — not the model vendor, not “the bot.” Probabilistic answers need policy grounding, refusal, and escalation when money/policy is involved.',
    watchFor: ['Policy answers without citations', 'No human handoff for fare/refund claims', 'Legal ownership of AI advice unclear'],
  },
  2: {
    source: 'Fraud scoring vs LLM chat in fintech',
    setting: 'Card issuers (typical Stripe Radar / bank ML stacks) vs support copilots',
    whatHappened:
      'Production fraud systems still use classical ML on structured features. LLMs show up in dispute letters and agent assist — not as the primary fraud score.',
    poLesson:
      'Pick the simplest capable system. An LLM is wrong for many high-volume structured predictions; it is right when language and tools are the bottleneck.',
    watchFor: ['LLM proposed for scoring when labeled tabular data already exists', 'No non-LLM baseline in the PRD'],
  },
  3: {
    source: 'Intercom Fin / Zendesk AI answer configs',
    setting: 'SaaS support automation with tone and creativity settings',
    whatHappened:
      'Teams that leave “creative” sampling high on policy questions see fluent but inconsistent refund/shipping answers; production configs bias low temperature + knowledge grounding.',
    poLesson:
      'Temperature is a product policy per intent, not a global eng preference. Support ≠ brainstorming.',
    watchFor: ['One temperature for all intents', 'No max-token caps on verbose agent loops'],
  },
  4: {
    source: 'Enterprise search rollouts (Glean / Elastic / custom RAG)',
    setting: 'Internal “ask anything” over Confluence + Drive + tickets',
    whatHappened:
      'Semantic search returned HR docs for eng outage questions when keyword IDs (error codes, SKUs) were missing — hybrid search fixed recall on real tickets.',
    poLesson:
      'Embeddings are necessary but not sufficient. Production retrieval mixes vectors with keywords and metadata filters.',
    watchFor: ['Pure vector search on catalogs with SKUs/error codes', 'No gold Q→doc set before launch'],
  },
  5: {
    source: 'Indirect prompt injection via documents (Bing chat / enterprise RAG incidents)',
    setting: 'Retrieved webpages or PDFs containing “ignore previous instructions”',
    whatHappened:
      'Hostile or accidental instructions inside retrieved content tried to override system policy — exfiltrate data or change behavior.',
    poLesson:
      'Treat retrieved text as untrusted data. Prompts are a security surface; version and review them like production config.',
    watchFor: ['Docs concatenated into system prompt', 'Write-tools available without allowlists'],
  },
  6: {
    source: 'Multi-model routing at scale (e.g. Cursor, GitHub Copilot-class products)',
    setting: 'IDE / coding assistants choosing fast vs strong models',
    whatHappened:
      'Easy completions go to small/fast models; hard refactors escalate. Cost and latency explode if everything hits the frontier model.',
    poLesson:
      'Routing is a product feature with SLOs. Publish which tasks use which tier and the fallback when a provider degrades.',
    watchFor: ['Single-vendor, single-model hardcoding', 'No failover tested in staging'],
  },
  7: {
    source: 'Failed “chat with our PDF” MVPs in B2B sales eng',
    setting: 'Startup demos that never leave pilot',
    whatHappened:
      'Pretty demos shipped without error budgets, evals, or recovery UX — pilots stalled when the first wrong legal/compliance answer appeared.',
    poLesson:
      'Use a go/no-go checklist before funding. If you cannot measure failure, you cannot launch.',
    watchFor: ['Success = “demo wowed execs”', 'No escalation path in the pilot design'],
  },
  8: {
    source: 'OpenAI / Anthropic API gateway patterns in enterprises',
    setting: 'Central AI platform team fronting multiple business copilots',
    whatHappened:
      'Without a gateway, each squad logged PII prompts differently, blew budgets, and could not pin model versions during incidents.',
    poLesson:
      'Layers exist so you can attribute failures: UX vs gateway vs orchestrator vs model vs store.',
    watchFor: ['Direct browser→vendor API with keys', 'No shared trace IDs across services'],
  },
  9: {
    source: 'Notion AI / Help-center RAG (Intercom, Adept-style knowledge bots)',
    setting: 'Product Q&A over changing help docs',
    whatHappened:
      'Fine-tuning alone went stale when pricing pages changed; RAG with reindex on publish kept answers current without retraining.',
    poLesson:
      'Facts that change belong in retrieval. Fine-tune for style/behavior; RAG for truth.',
    watchFor: ['Weekly doc updates with monthly reindex', 'Answers without citations on policy'],
  },
  10: {
    source: 'Shopify-style merchant support RAG',
    setting: 'Tickets mixing “order #182773” and “where is my package” paraphrases',
    whatHappened:
      'Vector-only retrieval missed exact order IDs; hybrid BM25+vector and reranking lifted containment on real ticket distributions.',
    poLesson:
      'Chunking and retrieval design follow real question shapes — IDs, errors, and paraphrases.',
    watchFor: ['Fixed 500-char chunks across policy PDFs', 'No recall@k on production-like queries'],
  },
  11: {
    source: 'Salesforce Agentforce / ServiceNow agents / ops runbook agents',
    setting: 'Agents that create cases or change records',
    whatHappened:
      'Early agent pilots looped on tool errors and opened duplicate tickets until max-steps, idempotency keys, and write approvals were enforced.',
    poLesson:
      'Agents are workflows with a control plane: allowlists, budgets, stop conditions, audit trails.',
    watchFor: ['Write tools without confirmation UX', 'No max-step kill switch'],
  },
  12: {
    source: 'Production RAG platforms (Pinecone/Weaviate/pgvector + Redis + SQS patterns)',
    setting: 'Multi-tenant SaaS knowledge assistant',
    whatHappened:
      'MVP sync retrieve worked until ingest backfill blocked the API; moving ingest/evals to queues restored UX latency SLOs.',
    poLesson:
      'Infra follows load: sync for chat path, async for ingest and batch eval. Tenancy filters are product requirements.',
    watchFor: ['Shared index without tenant metadata', 'Embedding every request with no cache'],
  },
  13: {
    source: 'LLM-as-judge + human review at coding & support copilots',
    setting: 'Weekly quality boards at AI product teams',
    whatHappened:
      'Ships that only tracked thumbs hid retrieval regressions; teams that gated releases on faithfulness + recall caught bad prompt/index changes.',
    poLesson:
      'Evals are release criteria. Offline golden sets + online task metrics beat vibe checks.',
    watchFor: ['Prompt edits merged with no delta report', 'No owner for the golden set'],
  },
  14: {
    source: 'On-call debugging of a refund-bot regression',
    setting: 'E-commerce support automation after a pricing page redesign',
    whatHappened:
      'Model “hallucinated” new return windows; traces showed the gold policy chunk dropped out of top-k after chunker changes — retrieval bug, not model IQ.',
    poLesson:
      'PO-usable traces turn you into a force multiplier. Inspect evidence before requesting a model swap.',
    watchFor: ['Tickets that only say “AI is wrong”', 'No prompt/index/model version pins in logs'],
  },
  15: {
    source: 'Prompt registries & canaries (LangSmith / internal AI platforms)',
    setting: 'Regulated industry chatbot promotion path',
    whatHappened:
      'A Friday prompt edit in prod broke JSON tool calls; teams with staging→canary→rollback pins reverted in minutes.',
    poLesson:
      'LLMOps is promotion discipline for prompts, indexes, and models together.',
    watchFor: ['Editing prompts directly in prod UI', 'Index and prompt versions not coupled'],
  },
  16: {
    source: 'Chevrolet / dealership chatbot stunts & Air Canada-class policy inventions',
    setting: 'Public-facing brand chat with weak grounding',
    whatHappened:
      'Bots agreed to sell cars for $1 or invented policies because nothing forced evidence-backed answers or abstention.',
    poLesson:
      'Bound hallucinations with grounding, citations, schema checks, and severity-based human gates — you will not eliminate them.',
    watchFor: ['Open-domain chat on transactional sites', 'No “I don’t know” path'],
  },
  17: {
    source: 'Perplexity-style citations vs uncited enterprise bots',
    setting: 'Employee policy copilots in HR/IT',
    whatHappened:
      'Uncited answers got screenshotted into Slack as “official”; cited passage links cut escalation time and audit risk.',
    poLesson:
      'Trust UX is a feature: verified, draft-for-human, and refuse must look different.',
    watchFor: ['Citation to doc title only, not passage', 'Refusal copy that dead-ends users'],
  },
  18: {
    source: 'Cost/latency incidents from agent loops (common in 2024–2025 pilots)',
    setting: 'Internal research agent with web tools',
    whatHappened:
      'A stuck tool retry burned 5-figure token spend overnight; dashboards that only showed uptime missed it — $/task and step-count alerts caught the next one.',
    poLesson:
      'Monitor reliability, latency, economics, and quality as four planes with owners.',
    watchFor: ['No cost anomaly alerts', 'Quality only measured at launch'],
  },
  19: {
    source: 'Poisoned / outdated corpus after policy change',
    setting: 'Retail returns policy update mid-peak season',
    whatHappened:
      'CMS published 30-day returns; vector index still served 90-day PDF for 36 hours → mass wrong promises. Containment: force refuse on returns intent + reindex.',
    poLesson:
      'Incident playbooks need containment switches tied to intents, not only full outages.',
    watchFor: ['Reindex only on cron', 'No known-good prompt/index pin'],
  },
  20: {
    source: 'Samsung / workplace LLM paste incidents + enterprise DLP responses',
    setting: 'Engineers pasting secrets into public ChatGPT',
    whatHappened:
      'Sensitive code reached consumer LLM logs; companies banned public tools and stood up private gateways with redaction and retention controls.',
    poLesson:
      'Data path design is PO work: classification, egress, logging, and red-team exercises.',
    watchFor: ['Prompts logged forever in plaintext', 'Write-tools without security review'],
  },
  21: {
    source: 'Model deprecations (OpenAI GPT-3.5 turbo retirements, etc.)',
    setting: 'Products pinned to a model that sunset',
    whatHappened:
      'Silent quality shifts and forced migrations broke prompt assumptions; teams with quarterly bake-offs and canaries migrated with evidence.',
    poLesson:
      'Maintenance calendars beat heroics. Skills, indexes, and models rot on different clocks.',
    watchFor: ['No DRI for corpus freshness', 'Upgrades shipped Friday without shadow traffic'],
  },
  22: {
    source: 'Reasoning models & computer-use pilots (OpenAI o-series, Anthropic computer use)',
    setting: 'Enterprise RPA-meets-LLM experiments',
    whatHappened:
      'Demos looked magical; production blockers were auth, audit, and irreversible UI actions — not benchmark scores.',
    poLesson:
      'Track capabilities that change your control plane and liability — ignore launch-day theater.',
    watchFor: ['Roadmap driven only by vendor keynotes', 'No falsifiable pilot hypothesis'],
  },
  23: {
    source: 'AI platform PO roles at large tech & banks',
    setting: 'Central AI gateway + federated domain copilots',
    whatHappened:
      'Orgs that kept “project manager + eng throws prompts” stalled; ones with PO owning evals/error budgets shipped reusable platform capabilities.',
    poLesson:
      'Career moat = evaluation literacy + ops judgment + narrative under uncertainty.',
    watchFor: ['PO excluded from design reviews', 'No lane: copilot vs platform vs vertical'],
  },
  24: {
    source: 'Hiring loops for AI PMs at B2B AI companies',
    setting: 'Interview packets asking for AI PRDs and eval plans',
    whatHappened:
      'Candidates who only spoke frameworks lost to those who showed golden-set samples, incident notes, and cost/quality tradeoffs from real launches.',
    poLesson:
      'Build artifacts now — they are your portfolio and your operating system.',
    watchFor: ['Learning without shipping an internal pilot', 'No written bake-off memos'],
  },
  25: {
    source: 'Fin by Intercom, Zendesk AI agents, airline/telco IVR+chat',
    setting: 'Customer support deflection + agent assist',
    whatHappened:
      'Containment rose when Tier-1 FAQ was grounded; CSAT fell when bots looped on billing disputes without handoff. Winners set joint CSAT/containment targets.',
    poLesson:
      'Tier automation: self-serve → assist → bounded tools. Never jump to full autonomy on money intents.',
    watchFor: ['Deflection KPI without CSAT', 'Policy publish not wired to reindex'],
  },
  26: {
    source: 'Glean / Guru / custom Notion+Slack copilots',
    setting: 'Internal knowledge answers across ACLs',
    whatHappened:
      'Cross-team leakage and conflicting wikis killed trust faster than “wrong tone.” Successful pilots started with one owned corpus island.',
    poLesson:
      'Corpus ownership and ACLs are the product. Measure time-to-answer and expert correction rate.',
    watchFor: ['Whole-company crawl on day one', 'No doc owner for freshness'],
  },
  27: {
    source: 'PagerDuty / Datadog on-call assistants & change-management agents',
    setting: 'Agents proposing remediations with execute gates',
    whatHappened:
      'Read-only diagnose helped MTTR; auto-execute without approval caused scary near-misses. Production designs preview plans and require human execute.',
    poLesson:
      'Propose vs execute is the core permission UX for agentic workflows.',
    watchFor: ['Irreversible tools in the same bucket as search', 'No replayable audit trail'],
  },
  28: {
    source: 'Build-vs-buy for support AI (vendor suites vs in-house RAG)',
    setting: 'Mid-market SaaS evaluating Zendesk/Intercom vs custom stack',
    whatHappened:
      'Buy won for undifferentiated channel UX; build won for proprietary workflow+evals. Lock-in hurt teams without export/eval access in contracts.',
    poLesson:
      'Buy plumbing; build differentiation; negotiate exit and eval transparency.',
    watchFor: ['TCO that ignores integration + ops', 'No data deletion/export clauses'],
  },
  29: {
    source: 'Internal AI PRD templates at platform teams (Google/Meta/Microsoft-style AI reviews)',
    setting: 'Launch reviews requiring safety, eval, and rollout sections',
    whatHappened:
      'Features without eval gates or rollback pins were blocked — same bar as privacy reviews.',
    poLesson:
      'Your capstone PRD must read like a production launch packet, not a vision slide.',
    watchFor: ['Missing kill criteria', 'Ops annex left as “TBD with eng”'],
  },
  30: {
    source: 'Continuous improvement loops at mature AI products (Copilot, support AI)',
    setting: 'Weekly quality reviews fed by production traces',
    whatHappened:
      'Teams that kept growing golden sets from incidents compounded quality; course-only learning without cadence faded in a quarter.',
    poLesson:
      'Graduation = operating rhythm. Practice on real traffic beats more content.',
    watchFor: ['No recurring quality meeting', 'Golden set frozen at launch size'],
  },
}

export function getProductionExample(day: number): ProductionExample | undefined {
  return productionExamples[day]
}
