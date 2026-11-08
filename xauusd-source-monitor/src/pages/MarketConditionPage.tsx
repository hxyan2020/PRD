import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ArchivedBriefingsPage, BriefingArchive } from '../components/BriefingArchive'
import { HealthDashboard } from '../components/HealthDashboard'
import { RulesPanel } from '../components/RulesPanel'
import { useLocale } from '../i18n/locale'
import type { useMonitor } from '../hooks/useMonitor'

type MonitorApi = ReturnType<typeof useMonitor>

export function MarketConditionPage({ mon }: { mon: MonitorApi }) {
  const { t } = useLocale()

  return (
    <div className="market-condition">
      <div className="subnav" role="tablist" aria-label={t('navMarket')}>
        <NavLink to="/market" end>
          {t('navBriefings')}
        </NavLink>
        <NavLink to="/market/health">{t('navHealth')}</NavLink>
        <NavLink to="/market/rules">{t('navRules')}</NavLink>
        <NavLink to="/market/archive">{t('navArchive')}</NavLink>
      </div>

      <Routes>
        <Route
          index
          element={
            <BriefingArchive briefings={mon.briefings} onArchive={mon.archiveBriefing} />
          }
        />
        <Route
          path="health"
          element={
            <HealthDashboard
              health={mon.health}
              composite={mon.composite}
              spot={mon.spot}
              tickAt={mon.tickAt}
              compositeMoveBps5m={mon.compositeMoveBps5m}
              lastTriggerReason={mon.lastTriggerReason}
              anchorsLive={mon.anchorsLive}
              polling={mon.polling}
              setPolling={mon.setPolling}
              forceStress={mon.forceStress}
              setForceStress={mon.setForceStress}
              refresh={mon.refresh}
              error={mon.error}
              priceHistory={mon.priceHistory}
              briefings={mon.briefings}
            />
          }
        />
        <Route path="rules" element={<RulesPanel rules={mon.rules} setRules={mon.setRules} />} />
        <Route
          path="archive"
          element={
            <ArchivedBriefingsPage
              briefings={mon.briefings}
              onUnarchive={mon.unarchiveBriefing}
            />
          }
        />
        <Route path="*" element={<Navigate to="/market" replace />} />
      </Routes>
    </div>
  )
}
