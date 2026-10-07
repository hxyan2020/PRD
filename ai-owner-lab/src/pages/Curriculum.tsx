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
          Foundations → architecture → AI DevOps → future & capstone. Toggle the checkbox to mark a
          day complete, or open the{' '}
          <Link to="/tracker" className="inline-link">
            progress tracker
          </Link>
          .
        </p>
        <ProgressBar
          percent={progress.percent}
          completed={progress.completedCount}
          total={progress.total}
        />
      </header>

      {phases.map((phase) => {
        const days = curriculum.filter((d) => d.phase === phase.id)
        const doneCount = days.filter((d) => progress.isComplete(d.day)).length
        return (
          <section key={phase.id} className="week-block">
            <div className="week-head">
              <span className="phase-week">Week {phase.week}</span>
              <h2>{phase.title}</h2>
              <p>
                {phase.subtitle} · {doneCount}/{days.length} done
              </p>
            </div>
            <div className="day-list">
              {days.map((day) => {
                const done = progress.isComplete(day.day)
                return (
                  <div key={day.day} className={`day-row ${done ? 'done' : ''}`}>
                    <button
                      type="button"
                      className={`day-check ${done ? 'checked' : ''}`}
                      aria-pressed={done}
                      aria-label={`Mark day ${day.day} ${done ? 'incomplete' : 'complete'}`}
                      onClick={() => progress.toggleComplete(day.day)}
                    >
                      {done ? '✓' : ''}
                    </button>
                    <Link to={`/day/${day.day}`} className="day-row-link">
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
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="danger-zone">
        <Link className="btn primary" to="/tracker">
          Open tracker
        </Link>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            if (window.confirm('Reset all progress and notes?')) progress.reset()
          }}
        >
          Reset progress
        </button>
      </div>
    </div>
  )
}
