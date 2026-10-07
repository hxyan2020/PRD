import { Link, useParams } from 'react-router-dom'
import { getDay, getPhaseForDay, TOTAL_DAYS } from '../data/curriculum'
import { useProgress } from '../hooks/useProgress'

export function DayLessonPage() {
  const { day: dayParam } = useParams()
  const dayNum = Number(dayParam)
  const lesson = getDay(dayNum)
  const phase = getPhaseForDay(dayNum)
  const progress = useProgress()

  if (!lesson || Number.isNaN(dayNum)) {
    return (
      <div className="page">
        <h1>Day not found</h1>
        <Link to="/curriculum">Back to curriculum</Link>
      </div>
    )
  }

  const done = progress.isComplete(lesson.day)
  const note = progress.notes[lesson.day] ?? ''
  const prev = lesson.day > 1 ? lesson.day - 1 : null
  const next = lesson.day < TOTAL_DAYS ? lesson.day + 1 : null

  return (
    <article className="page lesson">
      <header className="lesson-header">
        <p className="eyebrow">
          Day {lesson.day} · Week {phase?.week} · {phase?.title} · {lesson.minutes} min
        </p>
        <h1>{lesson.title}</h1>
        <p className="section-lede">{lesson.subtitle}</p>
        <div className="lesson-actions">
          <button
            type="button"
            className={`btn ${done ? 'ghost' : 'primary'}`}
            onClick={() => progress.toggleComplete(lesson.day)}
          >
            {done ? 'Mark incomplete' : 'Mark day complete'}
          </button>
          {next ? (
            <Link className="btn ghost" to={`/day/${next}`}>
              Next day
            </Link>
          ) : null}
          <Link className="btn ghost" to="/tracker">
            Tracker ({progress.completedCount}/30)
          </Link>
        </div>
      </header>

      <section className="lesson-grid">
        <div className="lesson-main">
          <div className="callout">
            <h2>Today you will</h2>
            <ul>
              {lesson.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>

          {lesson.sections.map((section) => (
            <section key={section.heading} className="content-block">
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {section.bullets ? (
                <ul>
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          {lesson.debugTip ? (
            <aside className="debug-tip">
              <strong>Debug tip</strong>
              <p>{lesson.debugTip}</p>
            </aside>
          ) : null}
        </div>

        <aside className="lesson-side">
          <div className="side-card">
            <h3>Terms</h3>
            <ul className="term-chips">
              {lesson.terms.map((t) => (
                <li key={t}>
                  <Link to={`/glossary?q=${encodeURIComponent(t)}`}>{t}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="side-card">
            <h3>PO moves</h3>
            <ol>
              {lesson.poMoves.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </div>
          <div className="side-card">
            <h3>Self-check</h3>
            <ul>
              {lesson.check.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="side-card">
            <h3>Your notes</h3>
            <textarea
              value={note}
              onChange={(e) => progress.setNote(lesson.day, e.target.value)}
              placeholder="Capture decisions, questions, tickets…"
              rows={5}
            />
          </div>
        </aside>
      </section>

      <nav className="lesson-nav">
        {prev ? <Link to={`/day/${prev}`}>← Day {prev}</Link> : <span />}
        <Link to="/curriculum">All days</Link>
        {next ? <Link to={`/day/${next}`}>Day {next} →</Link> : <span>Capstone complete</span>}
      </nav>
    </article>
  )
}
