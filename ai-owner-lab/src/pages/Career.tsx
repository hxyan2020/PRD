import { Link } from 'react-router-dom'
import { careerSkillsEn } from '../data/careerSkills'
import { careerSkillsZh } from '../data/zh/careerSkills'
import { careerZh } from '../data/zh/staticPages'
import { useLanguage } from '../i18n/LanguageContext'

const careerEn = {
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
  const skills = lang === 'zh' ? careerSkillsZh : careerSkillsEn

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('careerEyebrow')}</p>
        <h1>{t('careerTitle')}</h1>
        <p className="section-lede">{t('careerLede')}</p>
      </header>

      <section className="section">
        <h2>{t('skillsPortfolio')}</h2>
        <p className="section-lede">{t('skillsPortfolioLede')}</p>
        <div className="skills-grid">
          {skills.map((s) => (
            <details key={s.name} className="skill skill-expandable">
              <summary className="skill-summary">
                <span className="skill-summary-text">
                  <h3>{s.name}</h3>
                  <p>{s.proof}</p>
                </span>
                <span className="skill-chevron" aria-hidden="true" />
              </summary>
              <div className="skill-detail">
                <div className="skill-detail-block">
                  <h4>{t('whyItMatters')}</h4>
                  <p>{s.why}</p>
                </div>
                <div className="skill-detail-block">
                  <h4>{t('howToPractice')}</h4>
                  <ol>
                    {s.practice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
                <div className="skill-detail-block">
                  <h4>{t('evidenceArtifacts')}</h4>
                  <ul>
                    {s.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Link className="skill-related" to={`/day/${s.relatedDay}`}>
                  {t('relatedLesson')} ·{' '}
                  {lang === 'zh' ? `第 ${s.relatedDay} 天` : `Day ${s.relatedDay}`}
                </Link>
              </div>
            </details>
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
