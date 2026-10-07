import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { usePaintingsStore } from '../data/PaintingsProvider'
import './StatsCounter.css'

export function StatsCounter({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const { stats } = usePaintingsStore()

  return (
    <div className={`stats-counter ${compact ? 'compact' : ''}`} aria-live="polite">
      <div className="stat" title={t('viewed')}>
        <span className="stat-label">{t('viewed')}</span>
        <strong className="stat-value">{stats.viewed}</strong>
      </div>
      <span className="stat-sep" aria-hidden="true">
        ·
      </span>
      <Link to="/collection" className="stat" title={t('collectedCount')} onClick={(e) => e.stopPropagation()}>
        <span className="stat-label">{t('collectedCount')}</span>
        <strong className="stat-value">{stats.collected}</strong>
      </Link>
    </div>
  )
}
