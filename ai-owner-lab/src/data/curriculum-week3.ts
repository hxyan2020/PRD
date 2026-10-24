import type { DayLesson } from './types'

export const week3: DayLesson[] = [
  {
    day: 15,
    phase: 'ops',
    title: 'AI DevOps / LLMOps lifecycle',
    subtitle: 'Ship, observe, improve — continuously.',
    minutes: 55,
    outcomes: [
      'Map LLMOps stages to PO responsibilities',
      'Define environments and promotion rules',
      'Connect feedback to backlog items',
    ],
    terms: ['LLMOps', 'prompt registry', 'canary', 'rollback', 'drift'],
    sections: [
      {
        heading: 'Lifecycle',
        body: 'Discover → prototype → evaluate → harden (guards, auth, cost) → canary → general availability → monitor → retrain/reindex/reprompt → retire. AI systems are never “done”; corpora and models move under you.',
      },
      {
        heading: 'Artifacts to version',
        body: 'Prompts, skills, tools schemas, retrieval configs, embedding models, indexes, guardrail policies, eval sets. If it’s not versioned, it’s folklore.',
      },
      {
        heading: 'Promotion rules',
        body: 'Dev sandbox with synthetic data → staging with prod-like corpus (scrubbed) → canary % of traffic → full release. Rollback must revert prompt+model+index together when coupled.',
      },
    ],
    poMoves: [
      'Write your environment promotion checklist.',
      'Name the owner of the prompt registry.',
    ],
    check: [
      'Can you roll back last week’s prompt change in <15 minutes?',
      'Where do user thumbs become tickets?',
    ],
  },
  {
    day: 16,
    phase: 'ops',
    title: 'Hallucinations — types, causes, prevention',
    subtitle: 'Make “sounds right” fail closed when it must.',
    minutes: 60,
    outcomes: [
      'Classify hallucination types',
      'Map each type to a prevention control',
      'Set product policies for uncertainty',
    ],
    terms: ['hallucination', 'confabulation', 'faithfulness', 'grounding', 'abstention'],
    sections: [
      {
        heading: 'Types you’ll see',
        body: 'Factual fabrication, attribution errors (wrong citation), overconfidence, outdated knowledge presented as current, tool-result misread, and “policy theater” (claiming a check that never ran).',
      },
      {
        heading: 'Prevention stack',
        body: 'Ground with RAG; require citations; constrain to schemas; lower temperature; verify with tools; abstain when evidence weak; post-validate critical claims; human-in-loop for high stakes.',
        bullets: [
          'Answer only from retrieved evidence',
          'Show sources inline',
          'Separate “model guess” UI from “verified” UI',
          'Use deterministic checkers for IDs, amounts, dates',
        ],
      },
      {
        heading: 'You cannot eliminate — you can bound',
        body: 'Set an error budget and severity taxonomy. A creative tagline hallucinating is different from inventing a medical dosage. Design UX accordingly.',
      },
    ],
    poMoves: [
      'Write refusal copy for “I don’t have evidence.”',
      'List top 10 claims that must be tool-verified, never free-text.',
    ],
    check: [
      'What’s your policy when retrieval returns nothing?',
      'Which hallucinations are Sev-1?',
    ],
  },
  {
    day: 17,
    phase: 'ops',
    title: 'Grounding, citations, refusal policies',
    subtitle: 'Trust UX is part of the product, not a polish pass.',
    minutes: 50,
    outcomes: [
      'Design citation and grounding UX',
      'Write refusal and escalation policies',
      'Align legal/compliance with product behavior',
    ],
    terms: ['citation', 'grounding score', 'escalation', 'safe completion'],
    sections: [
      {
        heading: 'Citations that users believe',
        body: 'Link to exact passages, not just doc titles. Prefer quote snippets. Detect citation hallucination (source doesn’t support claim) in evals.',
      },
      {
        heading: 'Refusal is a feature',
        body: 'Good products refuse out-of-scope, unsafe, or under-evidenced requests clearly — and offer next steps (file ticket, talk to human, refine query).',
      },
      {
        heading: 'Escalation paths',
        body: 'Define when the system must hand off: low confidence, conflicting sources, user distress, write-actions, regulated advice.',
      },
    ],
    poMoves: [
      'Mock one grounded answer and one refusal screen.',
      'Agree escalation SLAs with support/ops.',
    ],
    check: [
      'Can a user verify a claim in one click?',
      'Is refusal measurable (rate + false refusal)?',
    ],
  },
  {
    day: 18,
    phase: 'ops',
    title: 'Monitoring — quality, cost, latency, drift',
    subtitle: 'Dashboards that predict pain before users tweet.',
    minutes: 55,
    outcomes: [
      'Specify an AI observability dashboard',
      'Detect quality and data drift',
      'Tie alerts to owners',
    ],
    terms: ['p95 latency', 'cost per success', 'drift', 'alert', 'trace sampling'],
    sections: [
      {
        heading: 'Four health planes',
        body: 'Reliability (errors, timeouts), performance (latency), economics (tokens, $/task), quality (eval scores, thumbs, escalation). All four — or you’re flying blind.',
      },
      {
        heading: 'Drift',
        body: 'Input drift (new products, new slang), corpus drift (docs change), model drift (provider updates), prompt drift (unreviewed edits). Schedule evals on a fixed cadence and on every dependency change.',
      },
      {
        heading: 'Alerting without noise',
        body: 'Alert on sustained regressions and safety events; ticket the rest. Sample traces for human review daily.',
      },
    ],
    poMoves: [
      'Draft dashboard v1 with 8 widgets and owners.',
      'Define Sev definitions for AI quality incidents.',
    ],
    check: [
      'Who gets paged for a hallucination spike?',
      'What’s your weekly quality review ritual?',
    ],
  },
  {
    day: 19,
    phase: 'ops',
    title: 'Real production issues & playbooks',
    subtitle: 'Patterns from the field — and how to respond.',
    minutes: 65,
    outcomes: [
      'Recognize common production failure patterns',
      'Run an incident with clear PO moves',
      'Write postmortems that improve the system',
    ],
    terms: ['incident', 'mitigation', 'postmortem', 'feature flag', 'poisoned corpus'],
    sections: [
      {
        heading: 'Pattern library',
        body: 'Stale index after policy update; prompt change breaks tool JSON; provider outage; cost explosion from agent loops; prompt injection via PDF; multilingual embedding gap; ACL filter bug leaking tenants; “helpful” model inventing SLAs.',
      },
      {
        heading: 'Incident playbook',
        body: 'Detect → contain (flag off / force refuse / pin prior version) → communicate → diagnose via traces → fix → eval regression suite → postmortem with action items owned by role.',
        bullets: [
          'Containment beats root cause in the first 15 minutes',
          'Keep a known-good prompt+model+index pin',
          'Communicate uncertainty honestly to stakeholders',
        ],
      },
      {
        heading: 'Postmortems that matter',
        body: 'Blameless, specific, with prevention in evals/guards/process. If the only action is “be more careful,” you failed the postmortem.',
      },
    ],
    poMoves: [
      'Tabletop one incident with eng/support for 30 minutes.',
      'Create a “break glass” config: previous good versions.',
    ],
    check: [
      'What’s your containment switch?',
      'Do you have a poisoned-doc response plan?',
    ],
    debugTip: 'Cost spikes often mean an agent loop or unbounded tool retry — check max steps and timeouts first.',
  },
  {
    day: 20,
    phase: 'ops',
    title: 'Safety, PII, governance, red teaming',
    subtitle: 'Ship fast without gambling the company.',
    minutes: 55,
    outcomes: [
      'Map data classes and model exposure',
      'Plan red team exercises',
      'Align with governance stakeholders',
    ],
    terms: ['PII', 'red team', 'policy engine', 'audit log', 'data residency'],
    sections: [
      {
        heading: 'Data path discipline',
        body: 'Know what leaves your boundary. Scrub or tokenize PII before logs and third parties. Prefer VPC/private endpoints when required. Retention policies for prompts and outputs.',
      },
      {
        heading: 'Red teaming',
        body: 'Schedule attacks: jailbreaks, injection via docs, toxic content, competitor/brand abuse, privacy probes, tool abuse. Track findings like security vulns.',
      },
      {
        heading: 'Governance cadence',
        body: 'Model cards for internal features, DPIA when needed, approval for high-risk use cases, audit logs for tool writes.',
      },
    ],
    poMoves: [
      'Classify data: public / internal / confidential / restricted.',
      'Book a 90-minute red team with cross-functional partners.',
    ],
    check: [
      'Are prompts logged? Who can read them?',
      'What’s the approval path for a new write-tool?',
    ],
  },
  {
    day: 21,
    phase: 'ops',
    title: 'Maintenance — skills, RAG, models over time',
    subtitle: 'The quiet work that keeps AI products alive.',
    minutes: 55,
    outcomes: [
      'Build a maintenance calendar',
      'Own skill and corpus hygiene',
      'Plan model upgrades without drama',
    ],
    terms: ['reindex', 'skill drift', 'model upgrade', 'deprecation', 'canary eval'],
    sections: [
      {
        heading: 'Living assets',
        body: 'Skills rot when tools change. RAG rots when docs move. Models rot when providers ship silent updates. Maintenance is product work with a calendar and owners.',
      },
      {
        heading: 'Suggested cadence',
        body: 'Daily: safety/quality alerts. Weekly: golden set spot checks, top failure themes. Monthly: corpus coverage review, skill audit. Quarterly: model bake-off, architecture debt.',
        bullets: [
          'Reindex on source change events, not only cron',
          'Canary new models on shadow traffic',
          'Deprecate skills with usage metrics',
        ],
      },
      {
        heading: 'Upgrade playbook',
        body: 'Freeze eval suite → shadow → canary → compare cost/quality/latency → promote or revert. Never “swap Friday night.”',
      },
    ],
    poMoves: [
      'Publish a 90-day AI maintenance calendar.',
      'Assign DRI for corpus, prompts, evals, cost.',
    ],
    check: [
      'When did you last re-run the full golden set?',
      'What’s the process when a connector breaks?',
    ],
  },
]
