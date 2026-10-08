import { useLanguage } from '../i18n/LanguageContext'
import { opsZh } from '../data/zh/staticPages'

const opsEn = {
  maintenance: [
    { cadence: 'Daily', items: 'Safety/quality alerts, sample trace review, Sev triage' },
    { cadence: 'Weekly', items: 'Golden set spot check, top failure themes → backlog, cost review' },
    { cadence: 'Monthly', items: 'Corpus coverage + skill audit, red-team slice, stale connector check' },
    { cadence: 'Quarterly', items: 'Model bake-off, architecture debt, build/buy revisit' },
  ],
  playbooks: [
    {
      title: 'Hallucination spike',
      steps: [
        'Contain: force grounded-only mode or feature flag off for high-risk intents',
        'Inspect traces: retrieval hit rate, empty context, prompt version drift',
        'Check corpus freshness and recent connector failures',
        'Run faithfulness eval on last 24h samples',
        'Ship fix (retrieval/prompt/guard) behind canary; write postmortem',
      ],
    },
    {
      title: 'Cost explosion',
      steps: [
        'Cap max agent steps and output tokens immediately',
        'Find top routes by token spend; look for loops and huge contexts',
        'Enable cache for repeated retrieval/embeddings where safe',
        'Route easy intents to smaller models',
        'Add budget alerts tied to cost per successful task',
      ],
    },
    {
      title: 'Possible data leak / ACL miss',
      steps: [
        'Disable retrieval feature or tighten to allowlisted corpora',
        'Audit metadata filters and tenant IDs on recent traces',
        'Rotate keys if provider logs may contain sensitive prompts',
        'Notify security/privacy; preserve evidence',
        'Add regression tests for cross-tenant retrieval before re-enable',
      ],
    },
    {
      title: 'Provider outage',
      steps: [
        'Failover to secondary model/vendor or degraded FAQ mode',
        'Communicate status to support and status page',
        'Queue non-critical async jobs',
        'Validate quality on failover model before full cutover',
        'Review multi-provider abstraction gaps in postmortem',
      ],
    },
  ],
  halluStack: [
    'Ground with RAG; answer only from evidence or abstain',
    'Require citations for factual/policy answers',
    'Verify critical fields with tools/deterministic checks',
    'Lower temperature; structured outputs; post-guards',
    'Human-in-the-loop for irreversible or regulated actions',
    'Eval faithfulness continuously — not only at launch',
  ],
}

export function OpsPlaybook() {
  const { lang, t } = useLanguage()
  const content = lang === 'zh' ? opsZh : opsEn

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('opsEyebrow')}</p>
        <h1>{t('opsTitle')}</h1>
        <p className="section-lede">{t('opsLede')}</p>
      </header>

      <section className="section">
        <h2>{t('maintenanceCalendar')}</h2>
        <div className="cadence-list">
          {content.maintenance.map((row) => (
            <div key={row.cadence} className="cadence-row">
              <strong>{row.cadence}</strong>
              <span>{row.items}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>{t('incidentPlaybooks')}</h2>
        <div className="playbook-grid">
          {content.playbooks.map((pb) => (
            <article key={pb.title} className="playbook">
              <h3>{pb.title}</h3>
              <ol>
                {pb.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="section callout">
        <h2>{t('hallucinationStack')}</h2>
        <ul>
          {content.halluStack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
