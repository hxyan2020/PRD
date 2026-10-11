import { Link } from 'react-router-dom'
import { getCurriculum, getPhases } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ProgressBar'
import { useLanguage } from '../i18n/LanguageContext'

export function Curriculum() {
  const progress = useProgress()
  const { lang, t } = useLanguage()
  const phases = getPhases(lang)
  const curriculum = getCurriculum(lang)

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('curriculumEyebrow')}</p>
        <h1>{t('curriculumTitle')}</h1>
        <p className="section-lede">
          {t('curriculumLedePrefix')}{' '}
          <Link to="/tracker" className="inline-link">
            {t('progressTracker')}
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
              <span className="phase-week">
                {t('week')}
                {phase.week}
              </span>
              <h2>{phase.title}</h2>
              <p>
                {phase.subtitle} · {doneCount}/{days.length} {t('done')}
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
                      aria-label={
                        done
                          ? t('markDayIncomplete', { n: day.day })
                          : t('markDayComplete', { n: day.day })
                      }
                      onClick={() => progress.toggleComplete(day.day)}
                    >
                      {done ? '✓' : ''}
                    </button>
                    <Link to={`/day/${day.day}`} className="day-row-link">
                      <span className="day-num">
                        {t('day')}
                        {day.day}
                        {lang === 'zh' ? ' 天' : ''}
                      </span>
                      <span className="day-body">
                        <strong>{day.title}</strong>
                        <small>{day.subtitle}</small>
                      </span>
                      <span className="day-meta">
                        {day.minutes}
                        {t('min')}
                        {done ? <em>{t('done')}</em> : null}
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
          {t('openTrackerBtn')}
        </Link>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            if (window.confirm(t('resetConfirm'))) progress.reset()
          }}
        >
          {t('resetProgress')}
        </button>
      </div>
    </div>
  )
}
