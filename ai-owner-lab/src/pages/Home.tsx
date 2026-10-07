import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { phases } from '../data/phases'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ProgressBar'

export function Home() {
  const progress = useProgress()

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="brand-hero">OWNLAB</p>
          <h1>Become a true AI product owner in 30 days.</h1>
          <p className="lede">
            Not an engineer track — a fluency track. Learn the terms, modules, infra, debugging,
            AI DevOps, and the career skills that keep you in command.
          </p>
          <div className="cta-row">
            <Link className="btn primary" to={`/day/${progress.nextDay}`}>
              {progress.completedCount === 0 ? 'Start Day 1' : `Continue Day ${progress.nextDay}`}
            </Link>
            <Link className="btn ghost" to="/tracker">
              Open progress tracker
            </Link>
          </div>
          <ProgressBar
            percent={progress.percent}
            completed={progress.completedCount}
            total={progress.total}
          />
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="signal-grid">
            {Array.from({ length: 36 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 12) * 0.08}s` }} />
            ))}
          </div>
          <div className="hero-panel">
            <p>Week map</p>
            <ol>
              {phases.map((p) => (
                <li key={p.id}>
                  <em>W{p.week}</em> {p.title}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Four weeks. One composition of ownership.</h2>
        <p className="section-lede">
          Each week has one job — so you finish with judgment, not a pile of jargon.
        </p>
        <div className="phase-grid">
          {phases.map((phase) => (
            <Link key={phase.id} to="/curriculum" className="phase-link" style={{ '--phase': phase.color } as CSSProperties}>
              <span className="phase-week">Week {phase.week}</span>
              <h3>{phase.title}</h3>
              <p>{phase.subtitle}</p>
              <span className="phase-days">Days {phase.days[0]}–{phase.days[phase.days.length - 1]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>Built for product owners</h2>
          <p className="section-lede">
            Debug with traces. Prevent hallucinations. Maintain skills and RAG. Speak infra without
            writing production code.
          </p>
        </div>
        <ul className="promise-list">
          <li>Technical vocabulary that survives design reviews</li>
          <li>Module maps for RAG, agents, tools, and gateways</li>
          <li>Production playbooks for real failure modes</li>
          <li>Career radar for the next wave of AI work</li>
        </ul>
      </section>
    </div>
  )
}
