import type { DayLesson } from './types'

export const week1: DayLesson[] = [
  {
    day: 1,
    phase: 'foundations',
    title: 'What an AI product really is',
    subtitle: 'Stop shipping “chatbots.” Start owning probabilistic systems.',
    minutes: 45,
    outcomes: [
      'Distinguish deterministic software from AI-powered products',
      'Name the PO’s job in an AI product lifecycle',
      'Write a one-sentence AI product thesis for a real problem',
    ],
    terms: ['AI product', 'probabilistic system', 'human-in-the-loop', 'model vs product'],
    sections: [
      {
        heading: 'The shift from rules to probability',
        body: 'Traditional software fails loudly and predictably. AI products fail softly and creatively. Your job as an AI Product Owner is not to eliminate uncertainty — it is to design for it: define acceptable error, recovery paths, and trust signals.',
        bullets: [
          'Deterministic: same input → same output (checkout, CRUD, permissions)',
          'Probabilistic: same input → distribution of outputs (summaries, recommendations, agents)',
          'Hybrid: AI proposes, rules constrain, humans approve critical paths',
        ],
      },
      {
        heading: 'Model ≠ product',
        body: 'A foundation model is a capability. The product is the workflow, UX, data contracts, evaluation, cost envelope, and ops plan wrapped around that capability. Vendors sell models; you own outcomes.',
      },
      {
        heading: 'Your ownership surface',
        body: 'You own problem framing, success metrics, safety boundaries, release criteria, and the feedback loop back into prompts, retrieval, and skills — even when engineers own the plumbing.',
      },
    ],
    poMoves: [
      'Pick one workflow at work. Label each step: rule / AI / human.',
      'Write: “We will accept X% imperfect answers if users can recover in under Y seconds.”',
      'List three trust signals your UI must show (source, confidence, undo).',
    ],
    check: [
      'Can you explain why AI products need different acceptance criteria than APIs?',
      'Can you state what you own vs what engineering owns?',
    ],
  },
  {
    day: 2,
    phase: 'foundations',
    title: 'ML, LLMs, and generative AI — the map',
    subtitle: 'A mental model so jargon never boxes you in again.',
    minutes: 50,
    outcomes: [
      'Place classical ML, deep learning, LLMs, and gen AI on one map',
      'Know when not to use an LLM',
      'Ask sharper discovery questions in design reviews',
    ],
    terms: ['supervised learning', 'LLM', 'foundation model', 'fine-tuning', 'inference'],
    sections: [
      {
        heading: 'The stack of ideas',
        body: 'Machine learning finds patterns from data. Deep learning uses neural nets for complex signals (vision, speech, language). Generative AI produces new content. LLMs are large language models — a dominant class of generative models for text (and increasingly multimodal inputs).',
      },
      {
        heading: 'When classical ML wins',
        body: 'Fraud scores, churn prediction, demand forecasting, ranking with structured features — often cheaper, more controllable, and easier to explain than an LLM. Use LLMs when language understanding, synthesis, or flexible tool use is the bottleneck.',
        bullets: [
          'Structured prediction → classical ML / ranking models',
          'Language + documents + tools → LLM + retrieval / agents',
          'Images/video → vision models or multimodal LLMs',
        ],
      },
      {
        heading: 'Training vs inference',
        body: 'Training (or fine-tuning) updates model weights. Inference is running the model to generate an answer. Most product cost and latency live in inference. Most product risk lives in how you constrain and evaluate inference.',
      },
    ],
    poMoves: [
      'For your product idea, say aloud: “This is / is not an LLM problem because…”',
      'Ask eng: “What is the simplest non-LLM baseline we should beat?”',
    ],
    check: [
      'Can you give one example where an LLM is the wrong tool?',
      'Do you know what “inference” means in a roadmap conversation?',
    ],
  },
  {
    day: 3,
    phase: 'foundations',
    title: 'Tokens, context, temperature',
    subtitle: 'The knobs that drive cost, quality, and weird failures.',
    minutes: 55,
    outcomes: [
      'Explain tokens, context window, and why truncation breaks products',
      'Reason about temperature and sampling as product tradeoffs',
      'Estimate rough cost drivers without writing code',
    ],
    terms: ['token', 'context window', 'temperature', 'top-p', 'max tokens', 'latency'],
    sections: [
      {
        heading: 'Tokens are the currency',
        body: 'Models don’t read “words”; they read tokens (chunks of text). Pricing, rate limits, and context limits are token-based. Long prompts + long answers = higher cost and slower responses.',
      },
      {
        heading: 'Context window = working memory',
        body: 'Everything the model can see at once: system instructions, conversation history, retrieved docs, tool outputs. Overflow is silently truncated or rejected. Many “random” bugs are context overflows or wrong ordering of instructions vs evidence.',
      },
      {
        heading: 'Temperature & sampling',
        body: 'Higher temperature → more varied, creative, sometimes wrong. Lower → more deterministic. For support, compliance, and ops copilots, bias low. For ideation, allow higher — but keep a review step.',
        bullets: [
          'Support / RAG Q&A: low temperature + grounded retrieval',
          'Brainstorming: higher temperature + human curation',
          'Always set max output tokens for cost and UX control',
        ],
      },
    ],
    poMoves: [
      'Ask: “What’s our p95 prompt+completion token budget per request?”',
      'Decide default temperature policy per use case (not one global setting).',
    ],
    check: [
      'What breaks when the context window fills up?',
      'Why is “just raise temperature” rarely a product fix?',
    ],
    debugTip: 'If answers ignore instructions, check instruction order, length, and whether retrieved text is crowding out the system policy.',
  },
  {
    day: 4,
    phase: 'foundations',
    title: 'Embeddings & vector intuition',
    subtitle: 'Why “similar meaning” is a search problem — and a product one.',
    minutes: 50,
    outcomes: [
      'Explain embeddings in plain language',
      'Connect embeddings to search, clustering, and RAG',
      'Spot bad retrieval before blaming the model',
    ],
    terms: ['embedding', 'vector', 'similarity', 'cosine distance', 'semantic search'],
    sections: [
      {
        heading: 'Meaning as geometry',
        body: 'An embedding model turns text into a list of numbers (a vector) so that similar meanings sit near each other. “Reset password” and “can’t log in” can be close even if keywords differ.',
      },
      {
        heading: 'Why POs care',
        body: 'If retrieval brings the wrong docs, the smartest model still answers wrong — confidently. Embedding quality, chunk design, and metadata filters are product quality levers, not engineering trivia.',
      },
      {
        heading: 'Similarity is not truth',
        body: 'Nearest neighbor ≠ correct answer. You still need ranking, filters (tenant, date, ACL), and evaluation. Semantic search finds candidates; product logic decides what is allowed and trustworthy.',
      },
    ],
    poMoves: [
      'Write 10 user questions and the “gold” doc each should retrieve.',
      'Ask eng which embedding model and why — tradeoffs: quality vs cost vs multilingual.',
    ],
    check: [
      'Can you explain embeddings without saying “neural network”?',
      'What’s one failure mode of pure semantic search?',
    ],
  },
  {
    day: 5,
    phase: 'foundations',
    title: 'Prompting as product design',
    subtitle: 'Prompts are UX + policy + API contract — version them.',
    minutes: 55,
    outcomes: [
      'Structure system, developer, and user prompts deliberately',
      'Treat prompts as versioned product assets',
      'Design for tool use and refusal, not just “nice tone”',
    ],
    terms: ['system prompt', 'few-shot', 'chain-of-thought', 'tool calling', 'prompt injection'],
    sections: [
      {
        heading: 'Layers of instruction',
        body: 'System prompt = product constitution (role, boundaries, format). Tools/schemas = capabilities. User message = the request. Retrieved context = evidence. Mixing these carelessly creates policy collisions.',
      },
      {
        heading: 'Patterns that work for products',
        body: 'Be explicit about audience, output schema, citation rules, and what to do when uncertain. Prefer structured outputs (JSON / forms) for downstream systems. Few-shots beat vague adjectives.',
        bullets: [
          'Define: goal, constraints, format, escalation',
          'Separate “style” from “safety” from “task”',
          'Never paste untrusted user text into privileged instruction slots without delimiters/guards',
        ],
      },
      {
        heading: 'Prompt injection is a product risk',
        body: 'Users (or documents) can try to override your instructions. Design like security: least privilege tools, never follow doc instructions blindly, and log suspicious patterns.',
      },
    ],
    poMoves: [
      'Draft a system prompt for one feature with sections: Role / Must / Must not / Format / When unsure.',
      'Create a prompt changelog entry format: version, owner, change reason, eval delta.',
    ],
    check: [
      'Where do prompts live in your release process?',
      'What’s your refusal behavior when evidence is missing?',
    ],
  },
  {
    day: 6,
    phase: 'foundations',
    title: 'Choosing models & vendors',
    subtitle: 'Open vs closed, small vs large, build vs buy — with PO criteria.',
    minutes: 50,
    outcomes: [
      'Build a model selection scorecard',
      'Balance quality, cost, latency, data residency, and lock-in',
      'Plan multi-model routing as a product strategy',
    ],
    terms: ['frontier model', 'open weights', 'routing', 'distillation', 'SLA'],
    sections: [
      {
        heading: 'Selection dimensions',
        body: 'Quality on your tasks, latency, cost per successful outcome, context size, tool-calling reliability, multimodal needs, data retention terms, region availability, and eval harness fit.',
      },
      {
        heading: 'Routing is a feature',
        body: 'Send easy tasks to small/cheap models; escalate hard ones. Classification → small model; complex reasoning → stronger model. This is product architecture, not a one-off eng hack.',
      },
      {
        heading: 'Vendor risk',
        body: 'Price changes, deprecations, and quality regressions happen. Keep an abstraction layer, store prompts/evals independently, and know your migration path.',
      },
    ],
    poMoves: [
      'Fill a 2×2: task difficulty vs sensitivity. Map model tiers.',
      'Write “must retain / never send” data classes for your domain.',
    ],
    check: [
      'What’s your fallback if the primary model API is down?',
      'Which metric decides a model upgrade — vibes or evals?',
    ],
  },
  {
    day: 7,
    phase: 'foundations',
    title: 'Week 1 synthesis — PO decision framework',
    subtitle: 'Lock a repeatable way to greenlight AI work.',
    minutes: 60,
    outcomes: [
      'Apply a go / no-go framework to AI features',
      'Define MVP scope that is evaluable',
      'Present a Week-1 readout like a product owner',
    ],
    terms: ['AI MVP', 'success metric', 'error budget', 'baseline'],
    sections: [
      {
        heading: 'The OWNLAB go/no-go checklist',
        body: 'Only greenlight if you can answer: problem, user, workflow step, baseline, acceptable failure, eval method, cost envelope, human escalation, and data permissions.',
        bullets: [
          'Problem is language/judgment-heavy OR pattern-heavy with labeled data',
          'Users have a recovery path',
          'You can measure quality weekly',
          'Compliance path is clear',
        ],
      },
      {
        heading: 'Error budgets for AI',
        body: 'Borrow from SRE: define how much wrongness you can ship. Example: <2% harmful answers, <10% incomplete, citation required on 100% of policy answers.',
      },
    ],
    poMoves: [
      'Write a one-pager for an AI feature using the checklist.',
      'Define three metrics: task success, user trust, unit economics.',
    ],
    check: [
      'Can you reject a shiny AI demo that fails the checklist?',
      'Do you have a Week-1 personal glossary of 15 terms?',
    ],
  },
]
