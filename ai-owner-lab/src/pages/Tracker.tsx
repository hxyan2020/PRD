import { Link } from 'react-router-dom'
import { getCurriculum, getPhases } from '../data/content'
import { ProgressBar } from '../components/ProgressBar'
import { ProgressRing } from '../components/ProgressRing'
import { useProgress } from '../hooks/useProgress'
import { useLanguage } from '../i18n/LanguageContext'

export function Tracker() {
  const progress = useProgress()
  const { lang, t } = useLanguage()
  const curriculum = getCurriculum(lang)
  const phases = getPhases(lang)
  const remaining = progress.total - progress.completedCount
  const nextLesson = curriculum.find((d) => d.day === progress.nextDay)

  return (
    <div className="page tracker-page">
      <header className="page-header tracker-header">
        <div>
          <p className="eyebrow">{t('trackerEyebrow')}</p>
          <h1>{t('trackerTitle')}</h1>
          <p className="section-lede">{t('trackerLede')}</p>
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
          <span>{t('daysDone')}</span>
        </div>
        <div className="stat">
          <strong>{remaining}</strong>
          <span>{t('daysLeft')}</span>
        </div>
        <div className="stat">
          <strong>{progress.percent}%</strong>
          <span>{t('complete')}</span>
        </div>
        <div className="stat next-stat">
          <strong>
            {t('day')}
            {progress.nextDay}
            {lang === 'zh' ? ' 天' : ''}
          </strong>
          <span>{progress.completedCount === progress.total ? t('allDone') : t('upNext')}</span>
        </div>
      </section>

      <div className="cta-row">
        {progress.completedCount < progress.total ? (
          <Link className="btn primary" to={`/day/${progress.nextDay}`}>
            {t('continueDayBtn')} {progress.nextDay}
            {nextLesson ? `: ${nextLesson.title}` : ''}
          </Link>
        ) : (
          <Link className="btn primary" to="/day/30">
            {t('reviewGraduation')}
          </Link>
        )}
        <Link className="btn ghost" to="/curriculum">
          {t('openCurriculum')}
        </Link>
      </div>

      <section className="section">
        <h2>{t('dayBoard')}</h2>
        <p className="section-lede">{t('dayBoardLede')}</p>
        <div className="day-board" role="list">
          {curriculum.map((day) => {
            const done = progress.isComplete(day.day)
            return (
              <div key={day.day} className={`board-cell ${done ? 'done' : ''}`} role="listitem">
                <button
                  type="button"
                  className="board-check"
                  aria-pressed={done}
                  aria-label={
                    done
                      ? t('markDayIncomplete', { n: day.day })
                      : t('markDayComplete', { n: day.day })
                  }
                  onClick={() => progress.toggleComplete(day.day)}
                >
                  <span aria-hidden="true">{done ? '✓' : day.day}</span>
                </button>
                <Link to={`/day/${day.day}`} className="board-link">
                  <strong>
                    {t('day')}
                    {day.day}
                    {lang === 'zh' ? ' 天' : ''}
                  </strong>
                  <small>{day.title}</small>
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section">
        <h2>{t('byWeek')}</h2>
        <div className="week-progress-list">
          {phases.map((phase) => {
            const days = curriculum.filter((d) => d.phase === phase.id)
            const doneCount = days.filter((d) => progress.isComplete(d.day)).length
            const pct = Math.round((doneCount / days.length) * 100)
            return (
              <div key={phase.id} className="week-progress">
                <div className="week-progress-head">
                  <div>
                    <span className="phase-week">
                      {t('week')}
                      {phase.week}
                    </span>
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
            if (window.confirm(t('resetAllConfirm'))) progress.reset()
          }}
        >
          {t('resetAllProgress')}
        </button>
      </div>
    </div>
  )
}
