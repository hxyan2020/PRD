import { Link, useParams } from 'react-router-dom'
import { getDayLesson, getPhaseForDayLang, getVisualLang, TOTAL_DAYS } from '../data/content'
import { LessonVisual } from '../components/LessonVisual'
import { useProgress } from '../hooks/useProgress'
import { useLanguage } from '../i18n/LanguageContext'

export function DayLessonPage() {
  const { day: dayParam } = useParams()
  const dayNum = Number(dayParam)
  const { lang, t } = useLanguage()
  const lesson = getDayLesson(lang, dayNum)
  const phase = getPhaseForDayLang(lang, dayNum)
  const progress = useProgress()
  const visual = getVisualLang(lang, dayNum)

  if (!lesson || Number.isNaN(dayNum)) {
    return (
      <div className="page">
        <h1>{t('dayNotFound')}</h1>
        <Link to="/curriculum">{t('backCurriculum')}</Link>
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
          {t('day')}
          {lesson.day}
          {lang === 'zh' ? ' 天' : ''} · {t('week')}
          {phase?.week} · {phase?.title} · {lesson.minutes} {t('min')}
        </p>
        <h1>{lesson.title}</h1>
        <p className="section-lede">{lesson.subtitle}</p>
        <div className="lesson-actions">
          <button
            type="button"
            className={`btn ${done ? 'ghost' : 'primary'}`}
            onClick={() => progress.toggleComplete(lesson.day)}
          >
            {done ? t('markIncomplete') : t('markComplete')}
          </button>
          {next ? (
            <Link className="btn ghost" to={`/day/${next}`}>
              {t('nextDay')}
            </Link>
          ) : null}
          <Link className="btn ghost" to="/tracker">
            {t('tracker')} ({progress.completedCount}/30)
          </Link>
        </div>
      </header>

      <section className="lesson-grid">
        <div className="lesson-main">
          <div className="callout">
            <h2>{t('todayYouWill')}</h2>
            <ul>
              {lesson.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>

          {lesson.production ? (
            <aside className="production-example">
              <p className="eyebrow">{t('fromProduction')}</p>
              <h2>{lesson.production.source}</h2>
              <p className="production-setting">{lesson.production.setting}</p>
              <p>
                <strong>{t('whatHappened')}</strong> {lesson.production.whatHappened}
              </p>
              <p>
                <strong>{t('poLesson')}</strong> {lesson.production.poLesson}
              </p>
              <ul>
                {lesson.production.watchFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          ) : null}

          {visual ? <LessonVisual visual={visual} /> : null}

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
              <strong>{t('debugTip')}</strong>
              <p>{lesson.debugTip}</p>
            </aside>
          ) : null}
        </div>

        <aside className="lesson-side">
          <div className="side-card">
            <h3>{t('terms')}</h3>
            <ul className="term-chips">
              {lesson.terms.map((term) => (
                <li key={term}>
                  <Link to={`/glossary?q=${encodeURIComponent(term)}`}>{term}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="side-card">
            <h3>{t('poMoves')}</h3>
            <ol>
              {lesson.poMoves.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </div>
          <div className="side-card">
            <h3>{t('selfCheck')}</h3>
            <ul>
              {lesson.check.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="side-card">
            <h3>{t('yourNotes')}</h3>
            <textarea
              value={note}
              onChange={(e) => progress.setNote(lesson.day, e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={5}
            />
          </div>
        </aside>
      </section>

      <nav className="lesson-nav">
        {prev ? (
          <Link to={`/day/${prev}`}>
            ← {t('day')}
            {prev}
            {lang === 'zh' ? ' 天' : ''}
          </Link>
        ) : (
          <span />
        )}
        <Link to="/curriculum">{t('allDays')}</Link>
        {next ? (
          <Link to={`/day/${next}`}>
            {t('day')}
            {next}
            {lang === 'zh' ? ' 天' : ''} →
          </Link>
        ) : (
          <span>{t('capstoneComplete')}</span>
        )}
      </nav>
    </article>
  )
}
