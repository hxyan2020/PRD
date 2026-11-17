import { getDb, writeAudit } from "@/lib/db";
import { createAlarmAndAnalyze } from "@/lib/ai/analyze";
import { logSpineEvent } from "@/lib/ai/spine";
import { evaluateDetector, sampleDetectorValue } from "@/lib/ai/detectors";

export function runDetectors(opts: { raiseAlarms?: boolean; actor?: string } = {}) {
  const db = getDb();
  const raise = opts.raiseAlarms !== false;
  const detectors = db
    .prepare(
      `SELECT d.*
       FROM detectors d
       JOIN monitor_indicators i ON i.monitor_id = d.monitor_id
       WHERE d.enabled = 1 AND COALESCE(i.paused, 0) = 0
       ORDER BY d.code`
    )
    .all() as Array<{
    id: number;
    code: string;
    name: string;
    product: string;
    monitor_id: string;
    warn_threshold: number;
    breach_threshold: number;
    comparator: string;
  }>;

  const results: Array<Record<string, unknown>> = [];

  for (const det of detectors) {
    const ind = db
      .prepare(`SELECT * FROM monitor_indicators WHERE monitor_id = ?`)
      .get(det.monitor_id) as {
      id: number;
      last_value: number | null;
      name: string;
      paused?: number;
    } | undefined;
    if (!ind || ind.paused) continue;

    const observed = sampleDetectorValue(ind.last_value, det.monitor_id);
    const status = evaluateDetector(det.comparator, observed, det.warn_threshold, det.breach_threshold);

    db.prepare(
      `UPDATE detectors SET last_run_at = datetime('now'), last_status = ?, last_value = ? WHERE id = ?`
    ).run(status, observed, det.id);

    db.prepare(
      `UPDATE monitor_indicators SET last_value = ?, last_checked_at = datetime('now'), status = ? WHERE id = ?`
    ).run(observed, status === "HEALTHY" ? "HEALTHY" : status, ind.id);

    logSpineEvent({
      stage: "DETECT",
      title: `${det.code} → ${status} (${observed})`,
      product: det.product,
      ref_type: "detector",
      ref_id: det.code,
      severity: status === "HEALTHY" ? "INFO" : status,
      detail: { observed, warn: det.warn_threshold, breach: det.breach_threshold },
      actor: opts.actor ?? "detector-engine",
    });

    let alertDbId: number | null = null;
    let analysisId: number | null = null;

    if (raise && status !== "HEALTHY") {
      const recent = db
        .prepare(
          `SELECT id FROM monitor_alerts
           WHERE indicator_id = ? AND status IN ('OPEN','ACKNOWLEDGED','ESCALATED')
             AND created_at >= datetime('now', '-30 minutes')
           ORDER BY id DESC LIMIT 1`
        )
        .get(ind.id) as { id: number } | undefined;

      if (!recent) {
        const bundle = createAlarmAndAnalyze({
          monitor_id: det.monitor_id,
          severity: status,
          title: `${det.name} ${status}`,
          message: `Detector ${det.code} observed ${observed} (warn ${det.warn_threshold} / breach ${det.breach_threshold}).`,
          observed_value: observed,
        });
        const analysis = bundle.analysis as { id: number; analysis_id: string } | undefined;
        analysisId = analysis?.id ?? null;
        alertDbId = (db.prepare(`SELECT id FROM monitor_alerts ORDER BY id DESC LIMIT 1`).get() as { id: number }).id;

        logSpineEvent({
          stage: "ALARM",
          title: `Alarm from ${det.code}`,
          product: det.product,
          ref_type: "monitor_alert",
          ref_id: String(alertDbId),
          severity: status,
          detail: { detector: det.code, analysis_id: analysis?.analysis_id },
          actor: opts.actor ?? "detector-engine",
        });
      } else {
        alertDbId = recent.id;
      }
    }

    const runInfo = db
      .prepare(
        `INSERT INTO detector_runs (detector_id, observed_value, status, severity, alert_id, analysis_id, detail_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        det.id,
        observed,
        status,
        status === "HEALTHY" ? "INFO" : status,
        alertDbId,
        analysisId,
        JSON.stringify({ monitor_id: det.monitor_id })
      );

    results.push({
      detector: det.code,
      status,
      observed,
      run_id: Number(runInfo.lastInsertRowid),
      alert_id: alertDbId,
      analysis_id: analysisId,
    });
  }

  writeAudit({ name: opts.actor ?? "detector-engine" }, "RUN_DETECTORS", "detectors", "batch", {
    count: results.length,
    alarms: results.filter((r) => r.status !== "HEALTHY").length,
  });

  return results;
}
