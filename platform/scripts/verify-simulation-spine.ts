/**
 * Prove the INC-1028 simulation spine is seeded and usable from SQL explorer
 * plus Discovery / L2 aggregation / RCA / Messenger / Risk Log / noise pack monitors.
 */
import assert from "node:assert/strict";
import { getDb } from "../src/lib/db";
import { ensureForexPackDeskSeed } from "../src/lib/demo/forex-pack-seed";
import { ensureForexPackSimulationSpine } from "../src/lib/demo/forex-pack-spine";
import { FOREX_INCIDENT_1028 } from "../src/lib/demo/forex-incident-1028";
import { loadForexPackLiveSpine } from "../src/lib/demo/forex-pack-live";
import { SAMPLE_QUERIES, assertReadOnlySql } from "../src/lib/sql-explorer-shared";
import { listSimulatedTables, runReadOnlySql } from "../src/lib/sql-explorer";
import { getAggregationBoardPack } from "../src/lib/indicator-aggregation";
import { listRiskLogHistory } from "../src/lib/ai/risk-log-history";
import { getAnalysisBundle } from "../src/lib/ai/analyze";
import { runDiscoveryParallel } from "../src/lib/ai/discovery";

const db = getDb();
ensureForexPackDeskSeed(db);
ensureForexPackSimulationSpine(db);

const tables = listSimulatedTables(db);
assert.ok(tables.length >= 40, `expected ≥40 tables, got ${tables.length}`);

const sampleRows: Record<string, number> = {};
for (const q of SAMPLE_QUERIES) {
  const result = runReadOnlySql(assertReadOnlySql(q.sql), db);
  sampleRows[q.id] = result.rowCount;
  assert.ok(result.rowCount > 0, `sample ${q.id} returned 0 rows`);
}

const live = loadForexPackLiveSpine(db);
assert.equal(live.monitors.length, FOREX_INCIDENT_1028.monitors.length);
assert.equal(live.analysis_id, FOREX_INCIDENT_1028.analysis_id);
assert.equal(live.thread_id, FOREX_INCIDENT_1028.thread_id);
assert.equal(live.open_alert_id, FOREX_INCIDENT_1028.alert_id);
assert.ok(live.detector_runs >= 100, `detector_runs=${live.detector_runs}`);
assert.ok(live.risk_log_days >= 30, `risk_log_days=${live.risk_log_days}`);
assert.ok(live.aggregation_sessions >= 3, `aggregation_sessions=${live.aggregation_sessions}`);

const pack = getAggregationBoardPack(db);
assert.ok(pack.definitions.some((d) => d.code === FOREX_INCIDENT_1028.chain_code));
assert.ok(pack.sessions.length >= 3);

const aia = db
  .prepare(`SELECT id FROM ai_analyses WHERE analysis_id = ?`)
  .get(FOREX_INCIDENT_1028.analysis_id) as { id: number };
const bundle = getAnalysisBundle(aia.id);
assert.ok(bundle.analysis);
assert.ok(Array.isArray((bundle as { evidence?: unknown[] }).evidence));
assert.ok((bundle as { evidence?: unknown[] }).evidence!.length >= 1);

const hist = listRiskLogHistory(db);
assert.ok(hist.length >= 30);

const scan = runDiscoveryParallel({ actor: "verify-simulation-spine", trigger: "VERIFY" });
assert.ok(scan.scan_id);
assert.ok((scan.candidates?.length || 0) >= 1 || live.discovery_candidates >= 1);

const lpRuns = (
  db
    .prepare(
      `SELECT COUNT(*) AS c FROM detector_runs r
       JOIN detectors d ON d.id = r.detector_id WHERE d.monitor_id = ?`
    )
    .get(FOREX_INCIDENT_1028.primary_monitor_id) as { c: number }
).c;
assert.ok(lpRuns >= 8, `LP detector_runs=${lpRuns}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      tables: tables.length,
      samples: sampleRows,
      live,
      discovery_scan: scan.scan_id,
      discovery_candidates: scan.candidates?.length ?? 0,
      aggregation_sessions: pack.sessions.length,
      risk_log_days: hist.length,
      lp_detector_runs: lpRuns,
    },
    null,
    2
  )
);
