import type { UseCase } from './types'

export const useCases: UseCase[] = [
  {
    id: 'support-copilot',
    title: 'Tiered customer support copilot',
    industry: 'SaaS / Retail',
    summary:
      'Deflect repetitive questions with grounded answers, draft replies for human agents, and automate only low-risk account actions.',
    modules: ['RAG over help center', 'Intent router', 'CRM tools', 'Citation UX', 'Handoff workflow'],
    poRisks: [
      'Hallucinated refunds or policy promises',
      'Stale index after pricing changes',
      'CSAT drop from endless bot loops',
    ],
    successMetrics: ['Containment rate', 'CSAT', 'Handle time', 'Citation coverage', 'Escalation quality'],
    whyInteresting:
      'Shows the full PO craft: error budgets, trust UX, ops freshness, and knowing when not to fully automate.',
  },
  {
    id: 'internal-rag',
    title: 'Internal knowledge copilot',
    industry: 'Enterprise',
    summary:
      'Answer employee questions from approved wikis and runbooks with strict ACLs and source hierarchy.',
    modules: ['Connector ingest', 'ACL-aware retrieval', 'Reranker', 'Owner escalation', 'Feedback loop'],
    poRisks: ['Cross-tenant or cross-team leakage', 'Conflicting docs', 'No corpus owners'],
    successMetrics: ['Time-to-answer', 'Expert correction rate', 'Repeat Slack questions', 'Faithfulness'],
    whyInteresting:
      'Most companies try this; winners treat corpus quality and permissions as the product.',
  },
  {
    id: 'claims-assist',
    title: 'Insurance claims assistant',
    industry: 'Insurance',
    summary:
      'Extract fields from FNOL documents, flag missing info, and draft adjuster summaries with mandatory citations to policy text.',
    modules: ['Document parsing', 'Structured extraction', 'Policy RAG', 'Human approval', 'Audit log'],
    poRisks: ['Incorrect coverage interpretation', 'PII exposure', 'Regulatory audit gaps'],
    successMetrics: ['Extraction F1', 'Cycle time', 'Rework rate', 'Audit pass rate'],
    whyInteresting:
      'High-stakes grounding: abstention and human gates are features, not compromises.',
  },
  {
    id: 'dev-oncall',
    title: 'On-call runbook agent',
    industry: 'Platform / DevOps',
    summary:
      'Diagnose alerts by retrieving runbooks, querying metrics tools, and proposing remediation steps with a human execute gate.',
    modules: ['Alert webhook', 'Runbook RAG', 'Read-only infra tools', 'Plan preview', 'Execute approval'],
    poRisks: ['Unsafe write actions', 'Agent loops burning cost', 'Stale runbooks'],
    successMetrics: ['MTTR', 'Correct first suggestion %', 'Unnecessary pages avoided', 'Cost per incident'],
    whyInteresting:
      'Agentic value with a clear control plane — perfect for learning tool permissions.',
  },
  {
    id: 'sales-research',
    title: 'Account research & personalization agent',
    industry: 'B2B Sales',
    summary:
      'Assemble account briefs from CRM + public web + approved case studies, then draft outreach for AE review.',
    modules: ['CRM read tools', 'Web research with allowlist', 'Brand voice skill', 'Draft studio', 'CRM write-back'],
    poRisks: ['Fabricated customer facts', 'Off-brand claims', 'Spammy personalization'],
    successMetrics: ['AE edit distance', 'Meeting rate', 'Factual error rate', 'Time saved per brief'],
    whyInteresting:
      'Creativity is allowed — but facts about customers are not. Dual UX for verified vs drafted.',
  },
  {
    id: 'learning-coach',
    title: 'Role-based learning coach',
    industry: 'L&D / EdTech',
    summary:
      'Personalized study plans with quizzes grounded in a curriculum corpus — like this academy, instrumented for mastery.',
    modules: ['Curriculum graph', 'Progress state', 'Quiz generator', 'Spaced practice', 'Coach persona skill'],
    poRisks: ['Teaching outdated content', 'False mastery signals', 'Accessibility gaps'],
    successMetrics: ['Skill checkout pass rate', 'Time-to-competency', 'Retention at 30 days'],
    whyInteresting:
      'Meta use case: AI that builds capability, with evals tied to human performance — not chat length.',
  },
]
