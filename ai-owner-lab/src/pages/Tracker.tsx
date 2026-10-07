import { Link } from 'react-router-dom'
import { curriculum } from '../data/curriculum'
import { phases } from '../data/phases'
import { ProgressBar } from '../components/ProgressBar'
import { ProgressRing } from '../components/ProgressRing'
import { useProgress } from '../hooks/useProgress'

export function Tracker() {
  const progress = useProgress()
  const remaining = progress.total - progress.completedCount
  const nextLesson = curriculum.find((d) => d.day === progress.nextDay)

  return (
    <div className="page tracker-page">
      <header className="page-header tracker-header">
        <div>
          <p className="eyebrow">Your journey</p>
          <h1>Progress tracker</h1>
          <p className="section-lede">
            Mark any day complete. Progress is saved in this browser and updates across Home,
            Curriculum, and lesson pages.
          </p>
        </div>
        <ProgressRing
          percent={progress.percent}
          completed={progress.completedCount}
          total={progress.total}
        />
      </header>

      <section className="tracker-stats">
        <div className="stat">
          <strong>{progress.completedCount}</strong>
          <span>Days done</span>
        </div>
        <div className="stat">
          <strong>{remaining}</strong>
          <span>Days left</span>
        </div>
        <div className="stat">
          <strong>{progress.percent}%</strong>
          <span>Complete</span>
        </div>
        <div className="stat next-stat">
          <strong>Day {progress.nextDay}</strong>
          <span>{progress.completedCount === progress.total ? 'All done' : 'Up next'}</span>
        </div>
      </section>

      <div className="cta-row">
        {progress.completedCount < progress.total ? (
          <Link className="btn primary" to={`/day/${progress.nextDay}`}>
            Continue Day {progress.nextDay}
            {nextLesson ? `: ${nextLesson.title}` : ''}
          </Link>
        ) : (
          <Link className="btn primary" to="/day/30">
            Review graduation day
          </Link>
        )}
        <Link className="btn ghost" to="/curriculum">
          Open curriculum
        </Link>
      </div>

      <section className="section">
        <h2>30-day board</h2>
        <p className="section-lede">Click a day to toggle complete. Open the lesson from the title.</p>
        <div className="day-board" role="list">
          {curriculum.map((day) => {
            const done = progress.isComplete(day.day)
            return (
              <div key={day.day} className={`board-cell ${done ? 'done' : ''}`} role="listitem">
                <button
                  type="button"
                  className="board-check"
                  aria-pressed={done}
                  aria-label={`Mark day ${day.day} ${done ? 'incomplete' : 'complete'}`}
                  onClick={() => progress.toggleComplete(day.day)}
                >
                  <span aria-hidden="true">{done ? '✓' : day.day}</span>
                </button>
                <Link to={`/day/${day.day}`} className="board-link">
                  <strong>Day {day.day}</strong>
                  <small>{day.title}</small>
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section">
        <h2>By week</h2>
        <div className="week-progress-list">
          {phases.map((phase) => {
            const days = curriculum.filter((d) => d.phase === phase.id)
            const doneCount = days.filter((d) => progress.isComplete(d.day)).length
            const pct = Math.round((doneCount / days.length) * 100)
            return (
              <div key={phase.id} className="week-progress">
                <div className="week-progress-head">
                  <div>
                    <span className="phase-week">Week {phase.week}</span>
                    <h3>{phase.title}</h3>
                  </div>
                  <span className="week-count">
                    {doneCount}/{days.length}
                  </span>
                </div>
                <ProgressBar percent={pct} completed={doneCount} total={days.length} />
                <div className="week-toggle-row">
                  {days.map((day) => {
                    const done = progress.isComplete(day.day)
                    return (
                      <button
                        key={day.day}
                        type="button"
                        className={`week-day-toggle ${done ? 'done' : ''}`}
                        aria-pressed={done}
                        title={day.title}
                        onClick={() => progress.toggleComplete(day.day)}
                      >
                        {done ? '✓' : day.day}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="danger-zone">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            if (window.confirm('Reset all progress and notes? This cannot be undone.')) {
              progress.reset()
            }
          }}
        >
          Reset all progress
        </button>
      </div>
    </div>
  )
}
