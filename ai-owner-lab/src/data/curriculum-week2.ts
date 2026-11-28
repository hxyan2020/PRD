import type { DayLesson } from './types'

export const week2: DayLesson[] = [
  {
    day: 8,
    phase: 'architecture',
    title: 'The AI application stack',
    subtitle: 'From client to model — name every layer and why it exists.',
    minutes: 55,
    outcomes: [
      'Draw a reference architecture for an AI feature',
      'Know what each layer owns (and fails like)',
      'Ask architecture questions that unblock decisions',
    ],
    terms: ['orchestration', 'gateway', 'inference API', 'guardrails', 'observability'],
    sections: [
      {
        heading: 'A practical stack',
        body: 'Client → API/BFF → orchestration (prompt assembly, tools, RAG) → model provider → data stores (vector, SQL, object) → eval/logging. Guardrails sit before and after the model. Caching and queues sit beside for cost and reliability.',
      },
      {
        heading: 'Why layers matter to POs',
        body: 'Bugs are misdiagnosed when layers are blurred. “The model hallucinated” is often “retrieval missed,” “tool timed out,” “prompt truncated,” or “cache served stale policy.”',
        bullets: [
          'Gateway: auth, rate limits, tenancy, PII scrubbing',
          'Orchestrator: decides retrieve / tool / answer path',
          'Model: generates; does not own truth',
          'Stores: source of truth and memory',
        ],
      },
    ],
    poMoves: [
      'Sketch your product’s stack on one page; label owners.',
      'For each layer, write one failure mode and user-visible symptom.',
    ],
    check: [
      'Where do guardrails live in your design?',
      'Who owns the orchestrator prompts?',
    ],
  },
  {
    day: 9,
    phase: 'architecture',
    title: 'RAG — why, when, and the module map',
    subtitle: 'Retrieval-Augmented Generation without the mystique.',
    minutes: 60,
    outcomes: [
      'Explain RAG end-to-end in product language',
      'Decide when RAG beats fine-tuning',
      'List the modules you must specify in a PRD',
    ],
    terms: ['RAG', 'retriever', 'generator', 'corpus', 'grounding', 'index'],
    sections: [
      {
        heading: 'The idea',
        body: 'Before answering, fetch relevant private/current knowledge and put it in context so the model grounds its response. RAG reduces hallucinations on factual/enterprise questions and keeps knowledge updateable without retraining.',
      },
      {
        heading: 'Core modules',
        body: 'Ingest → chunk → embed → index → retrieve → (rerank) → prompt assemble → generate → cite. Each module has quality knobs. Skipping citation and ACL filters is how demos become incidents.',
        bullets: [
          'Ingest: connectors, freshness, permissions',
          'Chunk: size/overlap aligned to question types',
          'Retrieve: top-k, filters, hybrid keyword+vector',
          'Generate: answer only from evidence or abstain',
        ],
      },
      {
        heading: 'RAG vs fine-tuning',
        body: 'Fine-tuning shapes style/format/behavior; RAG supplies facts. Prefer RAG for changing knowledge. Fine-tune (or use adapters) when you need consistent behavior cheaply at scale — still keep retrieval for truths.',
      },
    ],
    poMoves: [
      'Write “source systems of truth” for your domain.',
      'Define: must cite / may paraphrase / must refuse.',
    ],
    check: [
      'What freshness SLA does your corpus need?',
      'Who owns index rebuild after a doc update?',
    ],
  },
  {
    day: 10,
    phase: 'architecture',
    title: 'Chunking, retrieval, reranking',
    subtitle: 'Where most RAG quality is won or lost.',
    minutes: 55,
    outcomes: [
      'Specify chunking strategy tradeoffs',
      'Understand hybrid search and rerankers',
      'Design a retrieval eval set',
    ],
    terms: ['chunking', 'overlap', 'hybrid search', 'reranker', 'recall@k', 'MRR'],
    sections: [
      {
        heading: 'Chunking is product design',
        body: 'Too small → missing context. Too large → noisy retrieval and wasted tokens. Structure-aware chunks (by heading, section, ticket) beat blind character splits for most enterprise docs.',
      },
      {
        heading: 'Retrieve, then rerank',
        body: 'First-stage retrieval maximizes recall (don’t miss the right doc). Rerankers reorder for precision. Hybrid search (BM25 + vectors) catches exact IDs, error codes, and rare proper nouns that pure vectors miss.',
      },
      {
        heading: 'Metrics POs should demand',
        body: 'Retrieval recall@k on a labeled question set. Answer faithfulness. Citation accuracy. Don’t only measure “users liked the chat.”',
      },
    ],
    poMoves: [
      'Create 25 gold Q→doc pairs from real tickets/docs.',
      'Require a weekly retrieval score in the AI quality dashboard.',
    ],
    check: [
      'What’s your top-k and why?',
      'Do error codes/IDs need keyword search?',
    ],
    debugTip: 'Wrong answers with confident tone: inspect retrieved chunks first. If gold doc isn’t in top-k, fix retrieval before the prompt.',
  },
  {
    day: 11,
    phase: 'architecture',
    title: 'Agents, tools, skills, and MCP',
    subtitle: 'From single-shot answers to systems that take actions.',
    minutes: 60,
    outcomes: [
      'Differentiate chatbot, tool-using LLM, and agent',
      'Specify tools/skills safely',
      'Understand MCP-style connections as a product surface',
    ],
    terms: ['agent', 'tool calling', 'skill', 'MCP', 'planner', 'loop'],
    sections: [
      {
        heading: 'Definitions that prevent hype',
        body: 'A chatbot responds in language. Tool calling lets a model invoke functions (search, CRM, calendar). An agent loops: plan → act → observe → decide until a stop condition. Skills are packaged capabilities (prompts + tools + policies) the agent can load.',
      },
      {
        heading: 'Skills as product modules',
        body: 'Treat skills like micro-features: owner, version, inputs/outputs, permissions, evals, rollback. “Add a skill” should feel like shipping a capability with a contract — not pasting a prompt into a folder.',
      },
      {
        heading: 'MCP & integrations',
        body: 'Model Context Protocol-style servers expose tools/resources to hosts. As a PO you care about: auth boundaries, which tools are write-capable, audit logs, and user consent for actions.',
        bullets: [
          'Read tools vs write tools — separate approval UX',
          'Idempotency for retries',
          'Human confirmation for irreversible actions',
        ],
      },
    ],
    poMoves: [
      'List tools for one agent: name, side effects, required scopes.',
      'Define stop conditions and max steps before human handoff.',
    ],
    check: [
      'What’s the blast radius if a tool is mis-called?',
      'How do users see what the agent did?',
    ],
  },
  {
    day: 12,
    phase: 'architecture',
    title: 'Infra components — what each is for',
    subtitle: 'Vector DBs, caches, queues, gateways, feature stores — PO edition.',
    minutes: 55,
    outcomes: [
      'Match infra components to jobs-to-be-done',
      'Ask capacity and cost questions that matter',
      'Avoid overbuilding for an MVP',
    ],
    terms: ['vector database', 'cache', 'queue', 'API gateway', 'feature store', 'object store'],
    sections: [
      {
        heading: 'Component cheat sheet',
        body: 'Vector DB: store embeddings + metadata for retrieval. Object store: raw files. SQL/OLTP: transactions, users, tickets. Cache: repeated prompts/answers, embedding reuse. Queue/workers: async ingest, batch evals, long agent jobs. Gateway: auth, routing, budgets. Feature store: classical ML features (still relevant in hybrid systems).',
      },
      {
        heading: 'MVP vs scale',
        body: 'MVP can start with a managed vector index and synchronous API. Add queues when ingest or agents exceed request timeouts. Add caches when you see repeated queries or expensive embeddings.',
      },
      {
        heading: 'Tenancy & ACLs',
        body: 'Infra must enforce who can retrieve what. Metadata filters are not optional in multi-tenant products — they are the product.',
      },
    ],
    poMoves: [
      'For your architecture sketch, mark MVP vs phase-2 components.',
      'Ask: “How do we prevent tenant A retrieving tenant B chunks?”',
    ],
    check: [
      'Which component owns permissions?',
      'What runs async vs sync in your UX?',
    ],
  },
  {
    day: 13,
    phase: 'architecture',
    title: 'Evaluation frameworks for product owners',
    subtitle: 'If you can’t measure it, you can’t ship it.',
    minutes: 60,
    outcomes: [
      'Design offline + online evals',
      'Choose metrics beyond “accuracy”',
      'Make evals a release gate',
    ],
    terms: ['offline eval', 'online eval', 'faithfulness', 'relevance', 'rubric', 'A/B test'],
    sections: [
      {
        heading: 'Offline first',
        body: 'Curated golden sets, LLM-as-judge with rubrics, human review samples. Track answer quality, faithfulness to sources, retrieval hit rate, safety refusals, schema validity, latency, cost.',
      },
      {
        heading: 'Online next',
        body: 'Thumbs, edit distance when users correct, task completion, escalation rate, deflection rate, re-ask rate, incident rate. Pair qualitative review with quantitative funnels.',
      },
      {
        heading: 'Release gates',
        body: 'No prompt/model/index change ships without a delta report vs last baseline. POs own the gate definition; eng owns automation.',
      },
    ],
    poMoves: [
      'Write a rubric for “good answer” in your domain (5 criteria).',
      'Define go/no-go thresholds for the next release.',
    ],
    check: [
      'What’s your golden set size and who maintains it?',
      'Which metric would freeze a release?',
    ],
  },
  {
    day: 14,
    phase: 'architecture',
    title: 'Debug independently — symptom to cause',
    subtitle: 'A PO playbook for finding the broken layer fast.',
    minutes: 65,
    outcomes: [
      'Use a systematic debug tree',
      'Read traces well enough to file great tickets',
      'Separate model bugs from product bugs',
    ],
    terms: ['trace', 'span', 'groundedness', 'regression', 'repro'],
    sections: [
      {
        heading: 'The debug tree',
        body: '1) Reproduce with inputs. 2) Inspect retrieved context. 3) Inspect tool calls/results. 4) Inspect final prompt assembly. 5) Inspect model output + post-guards. 6) Check version pins (prompt, index, model). Most issues resolve before step 5.',
      },
      {
        heading: 'What “good tickets” look like',
        body: 'Include: user intent, expected behavior, actual behavior, request ID/trace, retrieved doc IDs, model+prompt versions, severity, frequency. This makes you a force multiplier for eng.',
        bullets: [
          'Wrong fact → retrieval / stale corpus / missing citation rule',
          'Ignores policy → prompt conflict / injection / guard bypass',
          'Slow → cold start, huge context, tool timeouts, sequential agent steps',
          'Expensive → verbose prompts, no cache, oversized models',
        ],
      },
    ],
    poMoves: [
      'Practice on 3 failing examples using the debug tree.',
      'Create a shared “AI incident template” for your team.',
    ],
    check: [
      'Can you tell if a failure is retrieval vs generation?',
      'Do you know where to find traces in your stack?',
    ],
    debugTip: 'Never start with “change the model.” Start with evidence in the trace.',
  },
]
