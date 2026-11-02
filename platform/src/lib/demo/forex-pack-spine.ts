/**
 * Boot-time spine so Simulated Data / SQL and desk modules share one coherent
 * INC-1028 forex pack: detector history, AI RCA, messenger thread, aggregation.
 */
import type Database from "better-sqlite3";
import { FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";
import { ensureRiskLogHistory } from "@/lib/ai/risk-log-history";

const fx = FOREX_INCIDENT_1028;
const HISTORY_POINTS = 16;

/** Backfill detector_runs so Discovery can ground series on SQLite history. */
export function seedDetectorRunHistoryIfSparse(db: Database.Database) {
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM detector_runs`).get() as { c: number }).c;
  if (total >= HISTORY_POINTS * 8) return;

  const detectors = db
    .prepare(
      `SELECT d.id, d.monitor_id, d.warn_threshold, d.breach_threshold, d.comparator,
              i.last_value
       FROM detectors d
       JOIN monitor_indicators i ON i.monitor_id = d.monitor_id
       WHERE d.enabled = 1`
    )
    .all() as Array<{
    id: number;
    monitor_id: string;
    warn_threshold: number;
    breach_threshold: number;
    comparator: string;
    last_value: number | null;
  }>;

  const countFor = db.prepare(`SELECT COUNT(*) AS c FROM detector_runs WHERE detector_id = ?`);
  const insert = db.prepare(
    `INSERT INTO detector_runs
      (detector_id, observed_value, status, severity, alert_id, analysis_id, detail_json, created_at)
     VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)`
  );

  const pack = new Set<string>(fx.monitors as readonly string[]);
  const tx = db.transaction(() => {
    for (const det of detectors) {
      const have = (countFor.get(det.id) as { c: number }).c;
      if (have >= HISTORY_POINTS) continue;
      const base = det.last_value ?? det.warn_threshold ?? 1;
      const need = HISTORY_POINTS - have;
      for (let i = 0; i < need; i++) {
        const ageMin = (need - i) * 5;
        const t = new Date(Date.now() - ageMin * 60_000).toISOString().replace("T", " ").slice(0, 19);
        const spike =
          pack.has(det.monitor_id) && i >= need - 4
            ? Math.abs(base) * 0.22 + (det.warn_threshold || 1) * 0.15
            : 0;
        const jitter = Math.sin(i + det.id) * Math.max(0.2, Math.abs(base) * 0.03);
        const observed = Math.round((base + jitter + spike) * 1000) / 1000;
        let status = "HEALTHY";
        if (det.comparator === ">" || det.comparator === ">=") {
          if (observed >= det.breach_threshold) status = "BREACH";
          else if (observed >= det.warn_threshold) status = "WARN";
        } else if (det.comparator === "<" || det.comparator === "<=") {
          if (observed <= det.breach_threshold) status = "BREACH";
          else if (observed <= det.warn_threshold) status = "WARN";
        }
        insert.run(
          det.id,
          observed,
          status,
          status === "HEALTHY" ? "INFO" : status,
          JSON.stringify({ monitor_id: det.monitor_id, seed: "forex-pack-spine" }),
          t
        );
      }
    }
  });
  tx();
}

/** Ensure canonical AIA-INC-1028 RCA is linked to ALT-INC-1028. */
export function ensureInc1028Analysis(db: Database.Database) {
  const existing = db
    .prepare(`SELECT id FROM ai_analyses WHERE analysis_id = ?`)
    .get(fx.analysis_id) as { id: number } | undefined;
  const alert = db
    .prepare(
      `SELECT a.id, a.alert_id, a.severity, a.title, a.message, a.observed_value,
              i.monitor_id, i.name AS indicator_name, i.unit, i.threshold_warn, i.threshold_breach
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       WHERE a.alert_id = ?`
    )
    .get(fx.alert_id) as
    | {
        id: number;
        alert_id: string;
        severity: string;
        title: string;
        message: string;
        observed_value: number | null;
        monitor_id: string;
        indicator_name: string;
        unit: string | null;
        threshold_warn: number | null;
        threshold_breach: number | null;
      }
    | undefined;
  if (!alert) return;

  if (existing) {
    db.prepare(
      `UPDATE ai_analyses
       SET alert_id = ?, indicator_monitor_id = ?, summary = COALESCE(NULLIF(summary,''), ?)
       WHERE id = ?`
    ).run(alert.id, alert.monitor_id, `${fx.summary_en} Human review required.`, existing.id);
    return;
  }

  const skill = db
    .prepare(
      `SELECT id FROM ai_skills WHERE code IN (${fx.skill_codes.map(() => "?").join(",")}) AND status='ACTIVE' ORDER BY id LIMIT 1`
    )
    .get(...fx.skill_codes) as { id: number } | undefined;

  const explanations = [
    {
      hypothesis: `${fx.lp} ${fx.symbol} quote delay is propagating through final-quote publish lag`,
      likelihood: "HIGH",
      confidence: 0.82,
      rationale: fx.summary_en,
    },
    {
      hypothesis: "Fallback LP takeover and client impact still unverified — keep irreversible controls gated",
      likelihood: "MEDIUM",
      confidence: 0.58,
      rationale: "Evidence pack E-01…E-08 supports upstream LP anomaly; desk must confirm hedge/client slice.",
    },
  ];
  const actions = [
    {
      action: "lark_notify",
      status: "EXECUTED_MOCK",
      description: `Posted ${fx.incident_id} RCA draft to Incident Response messenger thread.`,
    },
    {
      action: "flag_for_human_review",
      status: "AWAITING_HUMAN",
      description: "Risk Owner must accept or challenge before live controls.",
    },
  ];

  const info = db
    .prepare(
      `INSERT INTO ai_analyses
        (analysis_id, alert_id, indicator_monitor_id, mode, confidence, skill_id, summary, explanations_json,
         actions_taken_json, status, needs_human, completed_at, challenged, challenge_verdict)
       VALUES (?, ?, ?, 'RAG_REASONING', 0.82, ?, ?, ?, ?, 'NEEDS_HUMAN', 1, datetime('now'), 1, 'PARTIAL')`
    )
    .run(
      fx.analysis_id,
      alert.id,
      alert.monitor_id,
      skill?.id ?? null,
      `${fx.title_en}: ${fx.summary_en} Primary RCA from Monitor 2.0 + forex pack playbook.`,
      JSON.stringify(explanations),
      JSON.stringify(actions)
    );
  const analysisDbId = Number(info.lastInsertRowid);

  const insertEvidence = db.prepare(
    `INSERT INTO ai_analysis_evidence (analysis_id, evidence_type, ref_id, title, excerpt, url, score)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertEvidence.run(
    analysisDbId,
    "MONITOR",
    alert.alert_id,
    `${alert.indicator_name} (${alert.monitor_id})`,
    `${alert.message} Observed=${alert.observed_value ?? "n/a"}${alert.unit ?? ""}`,
    null,
    1.0
  );
  insertEvidence.run(
    analysisDbId,
    "RAG",
    fx.chain_code,
    "Pricing feed propagation playbook",
    "LP quote delay → final quote staleness → hedge/client impact path for CFD metals.",
    fx.workspace_path,
    0.88
  );

  db.prepare(
    `INSERT INTO ai_analysis_challenges
      (analysis_id, challenge_id, model_name, verdict, confidence, summary, critique_json, improvements_json,
       alternatives_json, primary_mode, alert_severity)
     VALUES (?, ?, 'crmp-challenger-v0', 'PARTIAL', 0.7, ?, ?, ?, ?, 'RAG_REASONING', ?)`
  ).run(
    analysisDbId,
    "CHL-INC-1028",
    "Challenger agrees on LP feed anomaly but wants verified client/order impact before P2 close.",
    JSON.stringify([{ point: "Confirm fallback LP did not already absorb the book.", severity: "WARN" }]),
    JSON.stringify([
      {
        area: "EVIDENCE",
        recommendation: "Attach E-05 client fills + E-07 hedge coverage before severity downgrade.",
        priority: "HIGH",
      },
    ]),
    JSON.stringify([
      {
        hypothesis: "Hedge coverage gap is a companion, not the root",
        rationale: "ALT-LP-HEDGE-GAP may be correlated noise on the same book.",
        confidence: 0.41,
      },
    ]),
    alert.severity
  );

  if (skill) {
    db.prepare(
      `INSERT INTO ai_skill_runs (analysis_id, skill_id, step_index, action_code, status, detail_json)
       VALUES (?, ?, 0, 'lark_notify', 'EXECUTED_MOCK', ?)`
    ).run(
      analysisDbId,
      skill.id,
      JSON.stringify({ description: "Posted INC-1028 RCA to messenger", mock: true })
    );
    db.prepare(
      `INSERT INTO ai_skill_runs (analysis_id, skill_id, step_index, action_code, status, detail_json)
       VALUES (?, ?, 1, 'flag_for_human_review', 'AWAITING_HUMAN', ?)`
    ).run(
      analysisDbId,
      skill.id,
      JSON.stringify({ description: "Awaiting Risk Owner on INC-1028", mock: true })
    );
  }

  // Link messenger thread analysis_id when present.
  db.prepare(
    `UPDATE messenger_threads SET analysis_id = ? WHERE thread_id = ? OR title LIKE 'INC-1028 ·%'`
  ).run(analysisDbId, fx.thread_id);
}

/** Promote title-matched INC-1028 thread to canonical thread_id. */
export function ensureInc1028CanonicalThread(db: Database.Database) {
  // Lazy require — messenger/demo imports getDb.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ensureInc1028MessengerThread } =
    require("@/lib/messenger/demo") as typeof import("@/lib/messenger/demo");
  ensureInc1028MessengerThread(db);
  const row = db
    .prepare(
      `SELECT id, thread_id FROM messenger_threads
       WHERE thread_id = ?
          OR (
            title NOT LIKE 'DUMMY%'
            AND (
              title LIKE 'INC-1028 ·%'
              OR title LIKE '%LP Quote Delay & Final Quote Staleness%'
            )
          )
       ORDER BY CASE WHEN thread_id = ? THEN 0 ELSE 1 END, id
       LIMIT 1`
    )
    .get(fx.thread_id, fx.thread_id) as { id: number; thread_id: string } | undefined;
  if (!row) return;
  if (row.thread_id !== fx.thread_id) {
    // Avoid UNIQUE collisions if canonical id somehow exists elsewhere.
    const clash = db
      .prepare(`SELECT id FROM messenger_threads WHERE thread_id = ? AND id != ?`)
      .get(fx.thread_id, row.id) as { id: number } | undefined;
    if (!clash) {
      db.prepare(`UPDATE messenger_threads SET thread_id = ? WHERE id = ?`).run(fx.thread_id, row.id);
    }
  }
  const alert = db
    .prepare(`SELECT id FROM monitor_alerts WHERE alert_id = ?`)
    .get(fx.alert_id) as { id: number } | undefined;
  const analysis = db
    .prepare(`SELECT id FROM ai_analyses WHERE analysis_id = ?`)
    .get(fx.analysis_id) as { id: number } | undefined;
  if (alert) {
    db.prepare(
      `UPDATE messenger_threads
       SET alert_id = ?, analysis_id = COALESCE(?, analysis_id), severity = 'BREACH',
           status = CASE WHEN status = 'CLOSED' THEN 'OPEN' ELSE status END
       WHERE id = ?`
    ).run(alert.id, analysis?.id ?? null, row.id);
  }
}

/** Seed orphan monitor used by aggregation "no membership" demo path. */
function ensureOrphanMonitor(db: Database.Database) {
  const code = "M2-ORPHAN-999";
  const exists = db.prepare(`SELECT id FROM monitor_indicators WHERE monitor_id = ?`).get(code);
  if (exists) return;
  db.prepare(
    `INSERT INTO monitor_indicators
      (monitor_id, name, domain_code, product, unit, threshold_warn, threshold_breach,
       status, last_value, paused, ticket_open_count)
     VALUES (?, 'Orphan demo monitor (no aggregate)', 'OPS', 'CFD',
             'score', 10, 20, 'HEALTHY', 3, 0, 0)`
  ).run(code);
}

/**
 * One-shot boot wiring after core forex pack alerts exist.
 * Safe / idempotent on every getDb().
 */
export function ensureForexPackSimulationSpine(db: Database.Database) {
  seedDetectorRunHistoryIfSparse(db);
  ensureRiskLogHistory(db);
  ensureInc1028CanonicalThread(db);
  ensureInc1028Analysis(db);
  ensureOrphanMonitor(db);
  // Lazy require — indicator-aggregation imports getDb.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedAggregationDemosIfEmpty } =
    require("@/lib/indicator-aggregation") as typeof import("@/lib/indicator-aggregation");
  seedAggregationDemosIfEmpty(db);
}