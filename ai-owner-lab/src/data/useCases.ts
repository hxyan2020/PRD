import type { UseCase } from './types'

export const useCases: UseCase[] = [
  {
    id: 'support-copilot',
    title: 'Tiered customer support copilot',
    industry: 'SaaS / Retail (Intercom Fin, Zendesk AI, airline chat)',
    summary:
      'Real stacks deflect FAQ with grounded help-center RAG, draft replies for human agents, and automate only low-risk account actions (order status, password reset) with tools.',
    modules: ['RAG over help center', 'Intent router', 'CRM tools', 'Citation UX', 'Handoff workflow'],
    poRisks: [
      'Hallucinated refunds (Air Canada–class liability)',
      'Stale index after pricing/returns policy changes',
      'CSAT drop from endless bot loops on billing disputes',
    ],
    successMetrics: ['Containment rate', 'CSAT', 'Handle time', 'Citation coverage', 'Escalation quality'],
    whyInteresting:
      'The most common production AI product — error budgets, trust UX, and reindex SLAs decide winners.',
  },
  {
    id: 'internal-rag',
    title: 'Internal knowledge copilot',
    industry: 'Enterprise (Glean, Guru, Notion AI over Confluence)',
    summary:
      'Answer employee questions from approved wikis and runbooks with strict ACLs — the failure mode is almost always permissions and conflicting sources, not “model IQ.”',
    modules: ['Connector ingest', 'ACL-aware retrieval', 'Reranker', 'Owner escalation', 'Feedback loop'],
    poRisks: ['Cross-team leakage', 'Conflicting wikis treated as equal truth', 'No corpus owners'],
    successMetrics: ['Time-to-answer', 'Expert correction rate', 'Repeat Slack questions', 'Faithfulness'],
    whyInteresting:
      'Production truth: start with one owned corpus island, not a whole-company crawl on day one.',
  },
  {
    id: 'claims-assist',
    title: 'Insurance claims assistant',
    industry: 'Insurance / FNOL ops',
    summary:
      'Extract fields from first-notice-of-loss docs, flag missing info, draft adjuster summaries with mandatory citations to policy text — human approval before customer-facing decisions.',
    modules: ['Document parsing', 'Structured extraction', 'Policy RAG', 'Human approval', 'Audit log'],
    poRisks: ['Incorrect coverage interpretation', 'PII exposure in logs/vendors', 'Audit gaps'],
    successMetrics: ['Extraction F1', 'Cycle time', 'Rework rate', 'Audit pass rate'],
    whyInteresting:
      'High-stakes grounding in production: abstention and human gates are launch requirements.',
  },
  {
    id: 'dev-oncall',
    title: 'On-call runbook agent',
    industry: 'Platform / DevOps (PagerDuty + Datadog + runbooks)',
    summary:
      'Diagnose alerts by retrieving runbooks and querying metrics tools, then propose remediation with a human execute gate — never silent infra mutation.',
    modules: ['Alert webhook', 'Runbook RAG', 'Read-only infra tools', 'Plan preview', 'Execute approval'],
    poRisks: ['Unsafe write actions', 'Agent loops burning token budget', 'Stale runbooks'],
    successMetrics: ['MTTR', 'Correct first suggestion %', 'Unnecessary pages avoided', 'Cost per incident'],
    whyInteresting:
      'Agentic value with a real control plane — propose vs execute is the product.',
  },
  {
    id: 'sales-research',
    title: 'Account research & personalization agent',
    industry: 'B2B sales (CRM + web research copilots)',
    summary:
      'Assemble account briefs from Salesforce/HubSpot + allowlisted web + case studies, draft outreach for AE review — customer facts must be verified, creativity stays in messaging.',
    modules: ['CRM read tools', 'Web research allowlist', 'Brand voice skill', 'Draft studio', 'CRM write-back'],
    poRisks: ['Fabricated customer facts', 'Off-brand claims', 'Spammy personalization at scale'],
    successMetrics: ['AE edit distance', 'Meeting rate', 'Factual error rate', 'Time saved per brief'],
    whyInteresting:
      'Production UX splits verified fields from drafted prose — same pattern as support assist.',
  },
  {
    id: 'learning-coach',
    title: 'Role-based learning coach',
    industry: 'L&D / EdTech (corporate academies, OWNLAB-style)',
    summary:
      'Personalized study plans and quizzes grounded in a versioned curriculum corpus, with mastery measured by human checkouts — not chat length.',
    modules: ['Curriculum graph', 'Progress state', 'Quiz generator', 'Spaced practice', 'Coach persona skill'],
    poRisks: ['Teaching outdated content after process changes', 'False mastery signals', 'Accessibility gaps'],
    successMetrics: ['Skill checkout pass rate', 'Time-to-competency', 'Retention at 30 days'],
    whyInteresting:
      'Production learning products tie evals to on-the-job performance, matching how AI POs should learn.',
  },
]
