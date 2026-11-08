export interface CareerSkill {
  name: string
  proof: string
  why: string
  practice: string[]
  evidence: string[]
  relatedDay: number
}

export const careerSkillsEn: CareerSkill[] = [
  {
    name: 'AI problem framing',
    proof: 'Go/no-go one-pagers with error budgets',
    why: 'Most AI failures start as fuzzy goals (“make it smart”). POs who frame the job, user risk, and acceptable error rates ship systems that can be evaluated — and killed early when they shouldn’t exist.',
    practice: [
      'Write a one-pager: user job, deterministic vs probabilistic steps, success metric, and hard stop conditions.',
      'Set an error budget (e.g. “wrong policy answer < 0.5% of assisted tickets”).',
      'Force a go/no-go with explicit kill criteria before a pilot expands.',
    ],
    evidence: [
      'Problem one-pager with error budget',
      'Scope cut list (what AI must not own)',
      'Pilot exit criteria memo',
    ],
    relatedDay: 1,
  },
  {
    name: 'Eval literacy',
    proof: 'Golden sets, rubrics, release gates',
    why: 'Without evals, “quality” is opinion. AI POs need golden sets, rubrics, and release gates so model/prompt/index changes are product decisions — not vibes.',
    practice: [
      'Build a 30–50 example golden set from real failures and edge cases.',
      'Define a rubric (correctness, groundedness, tone, safety) with 1–5 scores.',
      'Refuse production promote unless gates pass on the golden set.',
    ],
    evidence: [
      'Golden set sample + labeling guide',
      'Release gate checklist',
      'Before/after scorecard for a model or prompt change',
    ],
    relatedDay: 14,
  },
  {
    name: 'Stack fluency',
    proof: 'Architecture sketches naming every layer',
    why: 'You don’t need to write production code, but you must name the layers — client, gateway, model, retrieval, tools, memory, evals, observability — so ownership and failure modes are clear in design reviews.',
    practice: [
      'Sketch your product’s stack and label owners for each layer.',
      'For every user-facing AI feature, point to the path a request takes.',
      'Ask “what breaks if this layer drifts?” in every design review.',
    ],
    evidence: [
      'One-page architecture sketch',
      'Layer ownership table',
      'Design-review question checklist',
    ],
    relatedDay: 8,
  },
  {
    name: 'RAG & agent design',
    proof: 'Module specs + tool permission matrices',
    why: 'RAG and agents are product modules with permissions, corpora, and stop conditions — not magic. Speccing retrieval chunks, tool allowlists, and human gates is core PO work.',
    practice: [
      'Write a module spec: corpus, chunking, ranking, citation UX, freshness SLA.',
      'Draw a tool permission matrix (read / draft / write) with approval rules.',
      'Define agent stop conditions and handoff UX before enabling loops.',
    ],
    evidence: [
      'RAG module spec',
      'Tool permission matrix',
      'Agent stop/handoff flow',
    ],
    relatedDay: 9,
  },
  {
    name: 'Debug independence',
    proof: 'Trace-based tickets and incident templates',
    why: 'When something fails, “the model is bad” is not a ticket. Independent POs read traces, isolate retrieval vs prompt vs tool vs policy, and file actionable bugs without waiting for an engineer to translate.',
    practice: [
      'Reproduce with request ID, inputs, retrieved chunks, and model output.',
      'Classify: retrieval miss, hallucination, tool error, UX, or policy gap.',
      'Keep a reusable incident template with severity and user impact.',
    ],
    evidence: [
      'Trace-based bug template',
      'Failure taxonomy cheat sheet',
      'Sample filled incident ticket',
    ],
    relatedDay: 15,
  },
  {
    name: 'LLMOps ownership',
    proof: 'Maintenance calendar + rollback pins',
    why: 'Prompts, skills, indexes, and models rot on different clocks. Ownership means versioning, canaries, rollback pins, and a maintenance calendar — not a launch party.',
    practice: [
      'Publish a monthly hygiene calendar (corpus, skills, connectors, evals).',
      'Pin versions for prompts/models/indexes and practice a rollback drill.',
      'Require canary + eval gates before any production promote.',
    ],
    evidence: [
      'Maintenance calendar',
      'Version pin / rollback runbook',
      'Canary promote checklist',
    ],
    relatedDay: 21,
  },
  {
    name: 'Safety & governance',
    proof: 'Data classes, red-team notes, refusal UX',
    why: 'AI products touch privacy, abuse, and legal risk. POs own data classes, refusal UX, and red-team coverage so “helpful” never becomes “liable.”',
    practice: [
      'Classify data (public / internal / sensitive) and map what the model may see.',
      'Write refusal + escalation UX for disallowed asks.',
      'Run a thin red-team slice every release train and log findings.',
    ],
    evidence: [
      'Data class map',
      'Refusal / escalation copy pack',
      'Red-team notes with remediations',
    ],
    relatedDay: 20,
  },
  {
    name: 'Portfolio storytelling',
    proof: 'AI PRD + postmortem + bake-off memo',
    why: 'Career impact comes from artifacts others can trust: an AI PRD with evals, a real postmortem, and a bake-off memo that shows judgment under uncertainty.',
    practice: [
      'Ship one public-quality internal artifact per month.',
      'Tell the story as problem → constraint → decision → metric → lesson.',
      'Keep a living portfolio index linking PRD, scorecard, and postmortem.',
    ],
    evidence: [
      'AI PRD with eval plan',
      'Incident postmortem',
      'Model/prompt bake-off memo',
    ],
    relatedDay: 29,
  },
]
