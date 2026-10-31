import type Database from "better-sqlite3";
import { FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";

export type ForexPackLiveMonitor = {
  monitor_id: string;
  name: string;
  status: string;
  last_value: number | null;
  threshold_warn: number | null;
  threshold_breach: number | null;
  unit: string | null;
};

export type ForexPackLiveSpine = {
  monitors: ForexPackLiveMonitor[];
  analysis_id: string | null;
  thread_id: string | null;
  open_alert_id: string | null;
  discovery_candidates: number;
  aggregation_sessions: number;
  detector_runs: number;
  risk_log_days: number;
};

/** Live INC-1028 pack rows from vantage_risk.db for lab chrome / SQL coherence. */
export function loadForexPackLiveMonitors(db: Database.Database): ForexPackLiveMonitor[] {
  const monitors = FOREX_INCIDENT_1028.monitors;
  const placeholders = monitors.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT monitor_id, name, status, last_value, threshold_warn, threshold_breach, unit
       FROM monitor_indicators
       WHERE monitor_id IN (${placeholders})
       ORDER BY monitor_id`
    )
    .all(...monitors) as ForexPackLiveMonitor[];
}

export function loadForexPackLiveSpine(db: Database.Database): ForexPackLiveSpine {
  const fx = FOREX_INCIDENT_1028;
  const analysis = db
    .prepare(`SELECT analysis_id FROM ai_analyses WHERE analysis_id = ?`)
    .get(fx.analysis_id) as { analysis_id: string } | undefined;
  const thread = db
    .prepare(`SELECT thread_id FROM messenger_threads WHERE thread_id = ?`)
    .get(fx.thread_id) as { thread_id: string } | undefined;
  const alert = db
    .prepare(`SELECT alert_id FROM monitor_alerts WHERE alert_id = ?`)
    .get(fx.alert_id) as { alert_id: string } | undefined;
  const discovery_candidates = (
    db.prepare(`SELECT COUNT(*) AS c FROM risk_discovery_candidates`).get() as { c: number }
  ).c;
  const detector_runs = (db.prepare(`SELECT COUNT(*) AS c FROM detector_runs`).get() as { c: number }).c;
  const risk_log_days = (db.prepare(`SELECT COUNT(*) AS c FROM risk_log_daily`).get() as { c: number }).c;
  let aggregation_sessions = 0;
  try {
    const raw = (
      db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get("indicator.aggregation.sessions") as
        | { value: string }
        | undefined
    )?.value;
    if (raw) aggregation_sessions = (JSON.parse(raw) as unknown[]).length;
  } catch {
    aggregation_sessions = 0;
  }
  return {
    monitors: loadForexPackLiveMonitors(db),
    analysis_id: analysis?.analysis_id ?? null,
    thread_id: thread?.thread_id ?? null,
    open_alert_id: alert?.alert_id ?? null,
    discovery_candidates,
    aggregation_sessions,
    detector_runs,
    risk_log_days,
  };
}
