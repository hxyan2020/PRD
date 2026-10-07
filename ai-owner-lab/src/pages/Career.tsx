import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { careerZh } from '../data/zh/staticPages'

const careerEn = {
  skills: [
    { name: 'AI problem framing', proof: 'Go/no-go one-pagers with error budgets' },
    { name: 'Eval literacy', proof: 'Golden sets, rubrics, release gates' },
    { name: 'Stack fluency', proof: 'Architecture sketches naming every layer' },
    { name: 'RAG & agent design', proof: 'Module specs + tool permission matrices' },
    { name: 'Debug independence', proof: 'Trace-based tickets and incident templates' },
    { name: 'LLMOps ownership', proof: 'Maintenance calendar + rollback pins' },
    { name: 'Safety & governance', proof: 'Data classes, red-team notes, refusal UX' },
    { name: 'Portfolio storytelling', proof: 'AI PRD + postmortem + bake-off memo' },
  ],
  radar: [
    { label: 'Adopt', text: 'Eval harnesses, prompt registries, hybrid retrieval, citation UX' },
    { label: 'Pilot', text: 'Bounded agents with write approvals, model routing, skill packs' },
    { label: 'Watch', text: 'Computer-use agents, on-device SLMs, multimodal support flows' },
    { label: 'Ignore', text: 'Benchmark theater and “replace the PO” hype without metrics' },
  ],
  os: [
    'Weekly: quality review + failure theme tickets',
    'Monthly: model/prompt bake-off note',
    'Quarterly: strategy memo — adopt / pilot / watch / ignore',
    'Ongoing: grow golden sets from real incidents',
  ],
}

export function Career() {
  const { lang, t } = useLanguage()
  const content = lang === 'zh' ? careerZh : careerEn

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('careerEyebrow')}</p>
        <h1>{t('careerTitle')}</h1>
        <p className="section-lede">{t('careerLede')}</p>
      </header>

      <section className="section">
        <h2>{t('skillsPortfolio')}</h2>
        <div className="skills-grid">
          {content.skills.map((s) => (
            <div key={s.name} className="skill">
              <h3>{s.name}</h3>
              <p>{s.proof}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>{t('techRadar')}</h2>
        <div className="radar-grid">
          {content.radar.map((r) => (
            <div key={r.label} className="radar-item">
              <h3>{r.label}</h3>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>{t('os90')}</h2>
          <p className="section-lede">{t('os90Lede')}</p>
        </div>
        <ul className="promise-list">
          {content.os.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="cta-row">
        <Link className="btn primary" to="/day/29">
          {t('openCapstone')}
        </Link>
        <Link className="btn ghost" to="/day/24">
          {t('skillsDay')}
        </Link>
      </div>
    </div>
  )
}
