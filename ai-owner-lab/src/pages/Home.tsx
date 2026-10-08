import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { getPhases } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ProgressBar'
import { useLanguage } from '../i18n/LanguageContext'

export function Home() {
  const progress = useProgress()
  const { lang, t } = useLanguage()
  const phases = getPhases(lang)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="brand-hero">OWNLAB</p>
          <h1>{t('heroTitle')}</h1>
          <p className="lede">{t('heroLede')}</p>
          <div className="cta-row">
            <Link className="btn primary" to={`/day/${progress.nextDay}`}>
              {progress.completedCount === 0
                ? t('startDay1')
                : `${t('continueDay')} ${progress.nextDay}`}
            </Link>
            <Link className="btn ghost" to="/tracker">
              {t('openTracker')}
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
            <p>{t('weekMap')}</p>
            <ol>
              {phases.map((p) => (
                <li key={p.id}>
                  <em>
                    {t('week')}
                    {p.week}
                  </em>{' '}
                  {p.title}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>{t('fourWeeks')}</h2>
        <p className="section-lede">{t('fourWeeksLede')}</p>
        <div className="phase-grid">
          {phases.map((phase) => (
            <Link
              key={phase.id}
              to="/curriculum"
              className="phase-link"
              style={{ '--phase': phase.color } as CSSProperties}
            >
              <span className="phase-week">
                {t('week')}
                {phase.week}
              </span>
              <h3>{phase.title}</h3>
              <p>{phase.subtitle}</p>
              <span className="phase-days">
                {t('days')} {phase.days[0]}–{phase.days[phase.days.length - 1]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>{t('builtFor')}</h2>
          <p className="section-lede">{t('builtForLede')}</p>
        </div>
        <ul className="promise-list">
          <li>{t('promise1')}</li>
          <li>{t('promise2')}</li>
          <li>{t('promise3')}</li>
          <li>{t('promise4')}</li>
        </ul>
      </section>
    </div>
  )
}
