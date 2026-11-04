import type { GlossaryTerm } from './types'

export const glossary: GlossaryTerm[] = [
  {
    term: 'Token',
    short: 'Chunk of text the model reads/writes; basis for cost and limits.',
    detail:
      'Roughly ~0.75 words in English on average, but varies. Context windows, pricing, and rate limits are measured in tokens. Long RAG contexts can dominate cost.',
    related: ['Context window', 'Inference'],
    phase: 'foundations',
  },
  {
    term: 'Context window',
    short: 'Maximum tokens a model can consider at once.',
    detail:
      'Includes system prompts, history, retrieved docs, and tool outputs. Overflow causes truncation or errors — a common root of “ignored instructions.”',
    related: ['Token', 'RAG'],
    phase: 'foundations',
  },
  {
    term: 'Embedding',
    short: 'Numeric vector representing meaning for similarity search.',
    detail:
      'Powers semantic search and RAG retrieval. Quality depends on the embedding model, chunking, and metadata filters — not only the LLM.',
    related: ['Vector database', 'RAG'],
    phase: 'foundations',
  },
  {
    term: 'RAG',
    short: 'Retrieve relevant docs, then generate an answer grounded in them.',
    detail:
      'Modules: ingest, chunk, embed, index, retrieve, rerank, prompt, generate, cite. Best for changing or private knowledge versus baking facts into weights.',
    related: ['Embedding', 'Hallucination', 'Citation'],
    phase: 'architecture',
  },
  {
    term: 'Hallucination',
    short: 'Plausible but incorrect or unsupported model output.',
    detail:
      'Mitigate with grounding, citations, lower temperature, tool verification, abstention policies, and evals for faithfulness — not vibes alone.',
    related: ['RAG', 'Faithfulness', 'Abstention'],
    phase: 'ops',
  },
  {
    term: 'Faithfulness',
    short: 'Whether the answer sticks to provided evidence.',
    detail:
      'A core RAG metric. An answer can be fluent and still unfaithful. Track separately from “helpfulness.”',
    related: ['Hallucination', 'Citation'],
    phase: 'ops',
  },
  {
    term: 'Agent',
    short: 'Looping system that plans, uses tools, and observes results.',
    detail:
      'Needs stop conditions, allowlisted tools, budgets, and approvals for side effects. More power means more ops and safety burden.',
    related: ['Tool calling', 'Skill', 'MCP'],
    phase: 'architecture',
  },
  {
    term: 'Tool calling',
    short: 'Model invokes structured functions (APIs) during a turn.',
    detail:
      'Enables real actions and verified data. Define schemas, timeouts, idempotency, and whether tools are read or write.',
    related: ['Agent', 'Skill'],
    phase: 'architecture',
  },
  {
    term: 'Skill',
    short: 'Packaged capability: prompts + tools + policies + version.',
    detail:
      'Treat as a product module with owner, evals, and rollback. Skills drift when underlying tools or business rules change.',
    related: ['Agent', 'LLMOps'],
    phase: 'ops',
  },
  {
    term: 'MCP',
    short: 'Protocol pattern for exposing tools/resources to AI hosts.',
    detail:
      'As a PO, focus on auth boundaries, consent for actions, auditability, and which servers are trusted in your environment.',
    related: ['Tool calling', 'Agent'],
    phase: 'architecture',
  },
  {
    term: 'Vector database',
    short: 'Store for embeddings + metadata used in retrieval.',
    detail:
      'Supports nearest-neighbor search with filters. Enforcing tenant ACLs in metadata is a product requirement, not an afterthought.',
    related: ['Embedding', 'RAG'],
    phase: 'architecture',
  },
  {
    term: 'LLMOps',
    short: 'Practices to ship, monitor, and improve LLM systems.',
    detail:
      'Version prompts/models/indexes, evaluate before promote, observe in prod, roll back safely, and maintain corpora and skills over time.',
    related: ['Drift', 'Canary', 'Eval'],
    phase: 'ops',
  },
  {
    term: 'Drift',
    short: 'Behavior or data changes that degrade quality over time.',
    detail:
      'Includes input drift, corpus drift, model/provider changes, and unreviewed prompt edits. Schedule evals on cadence and on dependency changes.',
    related: ['LLMOps', 'Eval'],
    phase: 'ops',
  },
  {
    term: 'Eval',
    short: 'Systematic measurement of AI quality offline and online.',
    detail:
      'Golden sets, rubrics, LLM-as-judge, human review, and production metrics (thumbs, escalation, task success). Release gates depend on evals.',
    related: ['Faithfulness', 'LLMOps'],
    phase: 'architecture',
  },
  {
    term: 'Temperature',
    short: 'Sampling randomness control for generations.',
    detail:
      'Higher = more varied; lower = more deterministic. Production factual systems usually prefer lower temperature plus grounding.',
    related: ['Token', 'Hallucination'],
    phase: 'foundations',
  },
  {
    term: 'Prompt injection',
    short: 'Attack where untrusted text tries to override instructions.',
    detail:
      'Can arrive via user input or retrieved documents. Mitigate with least-privilege tools, delimiters, ignore-instruction policies for docs, and monitoring.',
    related: ['RAG', 'Guardrails'],
    phase: 'foundations',
  },
  {
    term: 'Guardrails',
    short: 'Checks before/after the model to enforce policy.',
    detail:
      'Include PII scrubbing, topic allowlists, toxicity filters, schema validation, and citation requirements. Layered defense beats one magic filter.',
    related: ['Hallucination', 'PII'],
    phase: 'ops',
  },
  {
    term: 'Inference',
    short: 'Running a model to produce an output.',
    detail:
      'Where latency and most variable cost appear. Distinct from training/fine-tuning. Optimize with routing, caching, and smaller models when possible.',
    related: ['Token', 'Routing'],
    phase: 'foundations',
  },
  {
    term: 'Routing',
    short: 'Sending requests to different models/paths by difficulty or risk.',
    detail:
      'A product strategy: cheap model for classification, strong model for hard reasoning, refuse path for disallowed topics.',
    related: ['Inference', 'LLMOps'],
    phase: 'foundations',
  },
  {
    term: 'Citation',
    short: 'Linking claims to source passages users can verify.',
    detail:
      'Citations must be faithful — wrong citations are a special hallucination. Prefer passage-level links over vague document titles.',
    related: ['RAG', 'Faithfulness'],
    phase: 'ops',
  },
  {
    term: 'Abstention',
    short: 'Deliberately refusing or saying “not enough evidence.”',
    detail:
      'A first-class product behavior. Measure false abstention (too timid) and failed abstention (should have refused).',
    related: ['Hallucination', 'Guardrails'],
    phase: 'ops',
  },
  {
    term: 'Canary',
    short: 'Release to a small traffic slice before full rollout.',
    detail:
      'Compare quality/cost/latency against control. Essential for model and prompt changes that look fine offline but shift online.',
    related: ['LLMOps', 'Eval'],
    phase: 'ops',
  },
  {
    term: 'Fine-tuning',
    short: 'Updating model weights on task-specific data.',
    detail:
      'Good for style/format/behavior; weak alone for fresh facts. Often combined with RAG. Costs data prep and ongoing evals.',
    related: ['RAG', 'Inference'],
    phase: 'foundations',
  },
  {
    term: 'Orchestration',
    short: 'Code that assembles prompts, calls tools/RAG, and routes steps.',
    detail:
      'The brain of the product outside the model. Most “AI bugs” are orchestration bugs. Own its configs as product artifacts.',
    related: ['Agent', 'RAG'],
    phase: 'architecture',
  },
  {
    term: 'PII',
    short: 'Personally identifiable information needing protection.',
    detail:
      'Decide what can be sent to model providers, what is logged, retention, and redaction. Governance is part of AI product design.',
    related: ['Guardrails', 'LLMOps'],
    phase: 'ops',
  },
]

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.trim().toLowerCase()
  if (!q) return glossary
  return glossary.filter(
    (g) =>
      g.term.toLowerCase().includes(q) ||
      g.short.toLowerCase().includes(q) ||
      g.detail.toLowerCase().includes(q),
  )
}
