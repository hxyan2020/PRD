import type Database from "better-sqlite3";

export type NavEventSnapshot = Record<string, { count: number; latestAt: string | null }>;

function scalar(db: Database.Database, sql: string): { c: number; ts: string | null } {
  try {
    const row = db.prepare(sql).get() as { c?: number; ts?: string | null } | undefined;
    return { c: Number(row?.c || 0), ts: row?.ts ?? null };
  } catch {
    return { c: 0, ts: null };
  }
}

/** Open / recent event counts used as unread badges on the left nav. */
export function collectNavEvents(db: Database.Database): NavEventSnapshot {
  const alerts = scalar(
    db,
    `SELECT COUNT(*) AS c, MAX(created_at) AS ts FROM monitor_alerts WHERE status IN ('OPEN','ACKNOWLEDGED','ESCALATED')`
  );
  const analyses = scalar(db, `SELECT COUNT(*) AS c, MAX(created_at) AS ts FROM ai_analyses`);
  const messenger = scalar(
    db,
    `SELECT COUNT(*) AS c, MAX(updated_at) AS ts FROM messenger_threads WHERE status IN ('OPEN','ESCALATED')`
  );
  const intel = scalar(
    db,
    `SELECT COUNT(*) AS c, MAX(scanned_at) AS ts FROM market_intel_findings WHERE scanned_at >= datetime('now','-1 day')`
  );
  const interventions = scalar(
    db,
    `SELECT COUNT(*) AS c, MAX(requested_at) AS ts FROM interventions WHERE status IN ('PENDING','AWAITING_CHECKER','AWAITING_HUMAN')`
  );
  const spine = scalar(db, `SELECT COUNT(*) AS c, MAX(created_at) AS ts FROM spine_events WHERE created_at >= datetime('now','-1 day')`);
  const audit = scalar(db, `SELECT COUNT(*) AS c, MAX(created_at) AS ts FROM audit_logs WHERE created_at >= datetime('now','-1 day')`);
  const tickets = scalar(
    db,
    `SELECT COUNT(*) AS c, MAX(updated_at) AS ts FROM monitor_tickets WHERE status NOT IN ('RESOLVED','CLOSED')`
  );

  return {
    "/admin/alerts": { count: alerts.c, latestAt: alerts.ts },
    "/admin/ai-analyses": { count: analyses.c, latestAt: analyses.ts },
    "/admin/messenger": { count: messenger.c, latestAt: messenger.ts },
    "/admin/market-intel": { count: intel.c, latestAt: intel.ts },
    "/admin/interventions": { count: interventions.c, latestAt: interventions.ts },
    "/admin/spine": { count: spine.c, latestAt: spine.ts },
    "/admin/audit": { count: audit.c, latestAt: audit.ts },
    "/admin/monitor-2": { count: tickets.c, latestAt: tickets.ts },
  };
}
