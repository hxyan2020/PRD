import { Link } from 'react-router-dom'
import { curriculum } from '../data/curriculum'
import { phases } from '../data/phases'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ProgressBar'

export function Curriculum() {
  const progress = useProgress()

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">30-day path</p>
        <h1>Full curriculum</h1>
        <p className="section-lede">
          Foundations → architecture → AI DevOps → future & capstone. Mark days complete as you go —
          progress stays in this browser.
        </p>
        <ProgressBar
          percent={progress.percent}
          completed={progress.completedCount}
          total={progress.total}
        />
      </header>

      {phases.map((phase) => {
        const days = curriculum.filter((d) => d.phase === phase.id)
        return (
          <section key={phase.id} className="week-block">
            <div className="week-head">
              <span className="phase-week">Week {phase.week}</span>
              <h2>{phase.title}</h2>
              <p>{phase.subtitle}</p>
            </div>
            <div className="day-list">
              {days.map((day) => {
                const done = progress.isComplete(day.day)
                return (
                  <Link
                    key={day.day}
                    to={`/day/${day.day}`}
                    className={`day-row ${done ? 'done' : ''}`}
                  >
                    <span className="day-num">Day {day.day}</span>
                    <span className="day-body">
                      <strong>{day.title}</strong>
                      <small>{day.subtitle}</small>
                    </span>
                    <span className="day-meta">
                      {day.minutes}m
                      {done ? <em>Done</em> : null}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="danger-zone">
        <button type="button" className="btn ghost" onClick={() => progress.reset()}>
          Reset progress
        </button>
      </div>
    </div>
  )
}
