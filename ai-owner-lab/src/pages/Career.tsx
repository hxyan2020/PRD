import { Link } from 'react-router-dom'

const skills = [
  { name: 'AI problem framing', proof: 'Go/no-go one-pagers with error budgets' },
  { name: 'Eval literacy', proof: 'Golden sets, rubrics, release gates' },
  { name: 'Stack fluency', proof: 'Architecture sketches naming every layer' },
  { name: 'RAG & agent design', proof: 'Module specs + tool permission matrices' },
  { name: 'Debug independence', proof: 'Trace-based tickets and incident templates' },
  { name: 'LLMOps ownership', proof: 'Maintenance calendar + rollback pins' },
  { name: 'Safety & governance', proof: 'Data classes, red-team notes, refusal UX' },
  { name: 'Portfolio storytelling', proof: 'AI PRD + postmortem + bake-off memo' },
]

const radar = [
  { label: 'Adopt', text: 'Eval harnesses, prompt registries, hybrid retrieval, citation UX' },
  { label: 'Pilot', text: 'Bounded agents with write approvals, model routing, skill packs' },
  { label: 'Watch', text: 'Computer-use agents, on-device SLMs, multimodal support flows' },
  { label: 'Ignore', text: 'Benchmark theater and “replace the PO” hype without metrics' },
]

export function Career() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Future of the role</p>
        <h1>Career impact & new skills</h1>
        <p className="section-lede">
          AI does not retire product owners — it raises the bar for technical judgment, ops literacy,
          and taste under uncertainty.
        </p>
      </header>

      <section className="section">
        <h2>Skills portfolio</h2>
        <div className="skills-grid">
          {skills.map((s) => (
            <div key={s.name} className="skill">
              <h3>{s.name}</h3>
              <p>{s.proof}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Personal technology radar</h2>
        <div className="radar-grid">
          {radar.map((r) => (
            <div key={r.label} className="radar-item">
              <h3>{r.label}</h3>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>90-day operating system</h2>
          <p className="section-lede">
            After Day 30, cadence beats content. Keep shipping artifacts that prove ownership.
          </p>
        </div>
        <ul className="promise-list">
          <li>Weekly: quality review + failure theme tickets</li>
          <li>Monthly: model/prompt bake-off note</li>
          <li>Quarterly: strategy memo — adopt / pilot / watch / ignore</li>
          <li>Ongoing: grow golden sets from real incidents</li>
        </ul>
      </section>

      <div className="cta-row">
        <Link className="btn primary" to="/day/29">
          Open capstone PRD day
        </Link>
        <Link className="btn ghost" to="/day/24">
          Skills portfolio day
        </Link>
      </div>
    </div>
  )
}
