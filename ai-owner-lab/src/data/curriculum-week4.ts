import type { DayLesson } from './types'

export const week4: DayLesson[] = [
  {
    day: 22,
    phase: 'future',
    title: 'Latest AI developments to track',
    subtitle: 'Reasoning models, agents, multimodal, and what actually matters.',
    minutes: 55,
    outcomes: [
      'Separate signal from launch hype',
      'Know which shifts change product roadmaps',
      'Build a personal radar habit',
    ],
    terms: ['reasoning model', 'multimodal', 'computer use', 'distillation', 'on-device'],
    sections: [
      {
        heading: 'Shifts that change roadmaps',
        body: 'Stronger reasoning models change eval strategies and cost curves. Reliable tool use unlocks agents in production. Multimodal inputs change UX (screenshot in, voice in). Smaller distilled models enable edge/private deployments. Computer-use agents expand automation — and risk.',
      },
      {
        heading: 'What to ignore (for now)',
        body: 'Benchmark theater without your task transfer. Feature names that don’t change user outcomes. “AGI next quarter” narratives that skip evals and ops.',
      },
      {
        heading: 'Your radar',
        body: 'Weekly: provider changelogs + one paper/post in your domain. Monthly: bake-off note. Quarterly: strategy memo to leadership on what to adopt, watch, or ignore.',
      },
    ],
    poMoves: [
      'Start a living doc: Adopt / Pilot / Watch / Ignore.',
      'Pick one emerging capability and write a falsifiable hypothesis for your product.',
    ],
    check: [
      'Which 2024–2026 shifts affect your roadmap this quarter?',
      'Where do you get non-hype signal?',
    ],
  },
  {
    day: 23,
    phase: 'future',
    title: 'Career impact — the AI-era product owner',
    subtitle: 'How the role is changing inside real organizations.',
    minutes: 50,
    outcomes: [
      'Describe the evolving PO skill profile',
      'Spot org models that succeed with AI products',
      'Position yourself for AI product leadership',
    ],
    terms: ['AI product triad', 'evaluation literacy', 'platform PO', 'copilot PO'],
    sections: [
      {
        heading: 'The new triad',
        body: 'Modern AI products need product + applied science/eng + domain ops working as one. POs who only manage backlog tickets lose. POs who own outcomes, evals, and narrative gain leverage.',
      },
      {
        heading: 'Role flavors',
        body: 'Copilot PO (assist users in workflows), Platform PO (shared AI gateway, eval, RAG platform), Vertical AI PO (domain-specific agents). Know which lane you’re in.',
      },
      {
        heading: 'Career moat',
        body: 'Technical literacy without needing to be the engineer. Taste for evals. Incident calm. Ability to say no to demos. Storytelling that earns trust for probabilistic systems.',
      },
    ],
    poMoves: [
      'Write your target lane and 3 proof points you’ll build this month.',
      'Identify a mentor in eng/data who will review your PRDs.',
    ],
    check: [
      'Can you lead an AI design review without deferring every technical question?',
      'What’s your narrative for promotion/impact?',
    ],
  },
  {
    day: 24,
    phase: 'future',
    title: 'Skills portfolio for AI product owners',
    subtitle: 'Concrete skills to practice — not buzzwords.',
    minutes: 55,
    outcomes: [
      'Build a skills matrix with evidence',
      'Prioritize learning for the next 90 days',
      'Translate skills into interview/portfolio artifacts',
    ],
    terms: ['skills matrix', 'artifact', 'technical fluency', 'ops literacy'],
    sections: [
      {
        heading: 'Must-have skills',
        body: 'Problem framing for AI, metrics/evals, RAG & agent literacy, prompt/skill versioning, cost/latency tradeoffs, safety & privacy, debugging with traces, stakeholder education, vendor management.',
      },
      {
        heading: 'Artifacts that prove skill',
        body: 'AI PRD with eval plan, architecture one-pager, incident postmortem, model scorecard, golden set sample, maintenance calendar, refusal policy, use-case ROI model.',
      },
      {
        heading: 'Practice loops',
        body: 'Ship tiny: weekly eval review, monthly bake-off note, one red-team session, one user interview on trust.',
      },
    ],
    poMoves: [
      'Score yourself 1–5 on the must-have list; pick 2 to raise.',
      'Publish one artifact this week (even internal).',
    ],
    check: [
      'Which artifact would you show in an interview tomorrow?',
      'What’s your weakest ops skill?',
    ],
  },
  {
    day: 25,
    phase: 'future',
    title: 'Use case lab — customer support AI',
    subtitle: 'Deflection, assist, and automate without wrecking trust.',
    minutes: 60,
    outcomes: [
      'Design a tiered support AI strategy',
      'Pick metrics that finance and CX both accept',
      'Avoid the “bot that angers customers” trap',
    ],
    terms: ['deflection', 'agent assist', 'containment', 'CSAT', 'handoff'],
    sections: [
      {
        heading: 'Three tiers',
        body: 'Self-serve answers with citations → agent-assist drafts for humans → bounded automation (password reset, order status) with tools. Don’t jump to full autonomy.',
      },
      {
        heading: 'Modules',
        body: 'RAG over help center + tickets policies, intent routing, CRM tools, escalation, tone controls, multilingual, analytics on containment vs CSAT.',
      },
      {
        heading: 'Failure modes',
        body: 'Wrong policy after a price change; hallucinated refund promises; endless loops; rude brevity; leaking other customers’ data.',
      },
    ],
    poMoves: [
      'Define which intents are automatable vs assist-only.',
      'Set a joint CSAT/containment target with CX leadership.',
    ],
    check: [
      'What’s the handoff UX when the bot is stuck?',
      'How fast do policy doc updates hit the index?',
    ],
  },
  {
    day: 26,
    phase: 'future',
    title: 'Use case lab — internal knowledge copilots',
    subtitle: 'The enterprise RAG problem everyone underestimates.',
    minutes: 55,
    outcomes: [
      'Scope an internal copilot that can win',
      'Handle permissions and messy corpora',
      'Measure knowledge work productivity honestly',
    ],
    terms: ['ACL', 'corpus quality', 'time-to-answer', 'source of truth'],
    sections: [
      {
        heading: 'Why internals fail',
        body: 'Garbage corpus, conflicting wikis, missing ACLs, no owners for spaces, and success measured as “people chatted” instead of “task completed faster with fewer pings.”',
      },
      {
        heading: 'Design for truth',
        body: 'Start with one domain (e.g., HR policies or eng runbooks). Enforce source hierarchy. Show citations. Allow “ask the owner” escalation.',
      },
      {
        heading: 'Metrics',
        body: 'Time-to-answer, search abandonment, % answers with citations, expert correction rate, repeat questions to Slack humans.',
      },
    ],
    poMoves: [
      'Pick one corpus island with a clear owner.',
      'Run a 2-week pilot with 20 users and a golden set.',
    ],
    check: [
      'Who is accountable for doc freshness?',
      'What must never be retrievable across teams?',
    ],
  },
  {
    day: 27,
    phase: 'future',
    title: 'Use case lab — agentic workflows',
    subtitle: 'Multi-step work with tools — where value and risk concentrate.',
    minutes: 60,
    outcomes: [
      'Design an agent with clear stop conditions',
      'Separate propose vs execute permissions',
      'Price the ROI against failure cost',
    ],
    terms: ['workflow agent', 'approval gate', 'idempotency', 'audit trail'],
    sections: [
      {
        heading: 'Good agent candidates',
        body: 'Research + draft + file ticket; reconcile data across systems; onboard vendor with checklist; generate change requests with evidence. Avoid open-ended “do my job” agents first.',
      },
      {
        heading: 'Control plane',
        body: 'Max steps, allowlisted tools, approval for writes, full audit trail, simulation mode, budget caps. UX must show the plan before irreversible actions.',
      },
      {
        heading: 'Economics',
        body: 'Agents can burn tokens via loops. Measure cost per completed workflow, not per message. Compare to human baseline including rework.',
      },
    ],
    poMoves: [
      'Storyboard one agent: triggers, tools, approvals, outputs.',
      'Define kill switch and daily spend cap.',
    ],
    check: [
      'What’s irreversible in your workflow?',
      'How do you replay an agent run for audit?',
    ],
  },
  {
    day: 28,
    phase: 'future',
    title: 'Build vs buy vs partner',
    subtitle: 'Portfolio decisions with eyes open.',
    minutes: 50,
    outcomes: [
      'Run a build/buy/partner analysis',
      'Spot false savings in “just use a vendor”',
      'Negotiate evaluation and exit terms',
    ],
    terms: ['TCO', 'lock-in', 'data gravity', 'time-to-learning'],
    sections: [
      {
        heading: 'Decision drivers',
        body: 'Differentiation (is this your moat?), data sensitivity, speed, internal platform maturity, talent, compliance, TCO over 24 months — not demo polish.',
      },
      {
        heading: 'Hidden costs of buy',
        body: 'Integration, prompt/policy customization limits, eval opacity, price changes, weak export, support quality. Hidden costs of build: ops burden, talent, slower iteration.',
      },
      {
        heading: 'Partner patterns',
        body: 'Buy undifferentiated plumbing (gateway, observability); build workflow + eval + domain skills; partner for specialized models/data.',
      },
    ],
    poMoves: [
      'Score one initiative on the build/buy matrix.',
      'List must-have contract clauses: data deletion, eval access, exit export.',
    ],
    check: [
      'What’s your exit plan if the vendor doubles price?',
      'Which part is actually differentiating?',
    ],
  },
  {
    day: 29,
    phase: 'future',
    title: 'Capstone — AI PRD + ops plan',
    subtitle: 'Put it all together in one shippable document.',
    minutes: 90,
    outcomes: [
      'Write a complete AI PRD',
      'Attach eval, safety, and ops plans',
      'Present tradeoffs like a true owner',
    ],
    terms: ['AI PRD', 'ops plan', 'launch checklist', 'north-star metric'],
    sections: [
      {
        heading: 'PRD skeleton',
        body: 'Problem, users, jobs, non-goals, UX flows, architecture modules, data sources & ACLs, model strategy, eval plan & gates, safety/refusals, cost envelope, analytics, rollout, open questions.',
      },
      {
        heading: 'Ops annex',
        body: 'Monitoring, on-call, incident playbook, maintenance calendar, ownership RACI, rollback pins.',
      },
      {
        heading: 'Presentation bar',
        body: 'You should answer: why AI, why now, what success looks like in 30/90 days, what you’ll turn off if quality fails.',
      },
    ],
    poMoves: [
      'Draft the PRD for your real initiative (or a portfolio project).',
      'Get one eng + one domain expert to redline it.',
    ],
    check: [
      'Does your PRD include eval gates?',
      'Is rollback specified?',
    ],
  },
  {
    day: 30,
    phase: 'future',
    title: 'Graduation — checklist & continuous learning',
    subtitle: 'You’re not done. You’re dangerous in the right way.',
    minutes: 60,
    outcomes: [
      'Self-certify against the OWNLAB checklist',
      'Set a 90-day practice plan',
      'Leave with a personal operating system',
    ],
    terms: ['operating cadence', 'portfolio', 'continuous eval'],
    sections: [
      {
        heading: 'True AI PO checklist',
        body: 'You can explain the stack; specify RAG/agent modules; prevent and triage hallucinations; read a trace; define evals; run an incident tabletop; maintain skills/indexes; make build/buy calls; write an AI PRD; teach a stakeholder the basics.',
      },
      {
        heading: '90-day OS',
        body: 'Weekly quality review, monthly bake-off memo, quarterly strategy note, ongoing golden set growth, one public or internal teach-back.',
      },
      {
        heading: 'Keep learning',
        body: 'Follow provider changelogs, one domain community, and postmortems from other companies. Practice beats courses after Day 30.',
      },
    ],
    poMoves: [
      'Score the graduation checklist honestly; schedule gaps.',
      'Ship or present your Day 29 PRD to a real stakeholder.',
    ],
    check: [
      'Would you trust yourself to own an AI feature launch next month?',
      'What’s your first calendar invite to create?',
    ],
  },
]
