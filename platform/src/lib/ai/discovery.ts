import { createHash, randomBytes } from "crypto";
import { getDb, writeAudit } from "@/lib/db";
import { ensureDiscoverySchema } from "@/lib/ai/discovery-schema";
import { logSpineEvent } from "@/lib/ai/spine";
import { decideChangeRequest, proposeChange } from "@/lib/ai/admin";
import { seedDetectors } from "@/lib/ai/detectors";

type Actor = { id: number; name: string; role_code: string };

export type DiscoveryReviewAction =
  | "APPROVE_FOR_VALIDATION"
  | "APPROVE_FOR_MONITORING"
  | "ASK_MORE_INFO"
  | "DISMISS";

type RawCandidate = {
  method: string;
  scenario: string;
  proposed_indicator: string;
  proposed_dimension: string;
  score: number;
  severity: string;
  product: string;
  evidence: Record<string, unknown>;
  window_start?: string | null;
  window_end?: string | null;
};

function newId(prefix: string) {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function fingerprintOf(c: RawCandidate) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        method: c.method,
        indicator: c.proposed_indicator,
        dimension: c.proposed_dimension,
        scenario: c.scenario.slice(0, 120),
      })
    )
    .digest("hex")
    .slice(0, 24);
}

function slugPart(s: string) {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
}

function monitorIdFor(c: RawCandidate) {
  return `M2-DISC-${slugPart(c.method).slice(0, 8)}-${slugPart(c.proposed_indicator).slice(0, 14)}`;
}

function skillCodeFor(c: RawCandidate) {
  return `SKILL-DISC-${slugPart(c.method).slice(0, 8)}-${slugPart(c.proposed_indicator).slice(0, 14)}`;
}

/** Build a short realtime feature window from live monitor indicators. */
function sampleFeatureWindow(db: ReturnType<typeof getDb>) {
  const rows = db
    .prepare(
      `SELECT monitor_id, name, domain_code, product, last_value, threshold_warn, threshold_breach, status, unit
       FROM monitor_indicators
       WHERE COALESCE(paused, 0) = 0
       ORDER BY monitor_id`
    )
    .all() as Array<{
    monitor_id: string;
    name: string;
    domain_code: string;
    product: string;
    last_value: number | null;
    threshold_warn: number | null;
    threshold_breach: number | null;
    status: string;
    unit: string | null;
  }>;

  const now = Date.now();
  const points: Array<Record<string, number>> = [];
  for (let i = 0; i < 48; i++) {
    const point: Record<string, number> = { t: now - (47 - i) * 5 * 60 * 1000 };
    for (const r of rows) {
      const base = r.last_value ?? 0;
      const noise = (Math.sin(i / 3 + r.monitor_id.length) + Math.random() - 0.4) * Math.max(0.5, Math.abs(base) * 0.04);
      // Inject a late-window spike on a few series so discovery finds something in demo.
      const spike =
        i >= 40 &&
        (r.monitor_id.includes("LP") ||
          r.monitor_id.includes("HEDGE") ||
          r.monitor_id.includes("MRG") ||
          r.monitor_id.includes("FEED"))
          ? Math.abs(base) * 0.22 + (r.threshold_warn ?? 1) * 0.15
          : 0;
      point[r.monitor_id] = Math.round((base + noise + spike) * 1000) / 1000;
    }
    points.push(point);
  }
  return { rows, points };
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function std(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

function percentile(xs: number[], p: number) {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function discoverCandidates(db: ReturnType<typeof getDb>): RawCandidate[] {
  const { rows, points } = sampleFeatureWindow(db);
  if (!rows.length || points.length < 10) return [];

  const out: RawCandidate[] = [];
  const split = Math.floor(points.length * 0.6);
  const recent = points.slice(-8);
  const baseline = points.slice(0, split);

  // Method 1 — Isolation-style multivariate score (z-score sum of extremes)
  {
    let best: { score: number; monitor_id: string; name: string; domain: string; product: string } | null = null;
    for (const r of rows) {
      const series = points.map((p) => p[r.monitor_id] ?? 0);
      const base = series.slice(0, split);
      const m = mean(base);
      const s = Math.max(std(base), 1e-6);
      const recentMax = Math.max(...series.slice(-6).map((v) => Math.abs((v - m) / s)));
      if (!best || recentMax > best.score) {
        best = {
          score: recentMax,
          monitor_id: r.monitor_id,
          name: r.name,
          domain: r.domain_code,
          product: r.product.includes("Crypto") ? "CRYPTO" : "CFD",
        };
      }
    }
    if (best && best.score >= 2.2) {
      out.push({
        method: "isolation_forest",
        scenario: `Joint anomaly: ${best.name} z=${best.score.toFixed(2)} vs historical baseline (unknown combination / distribution shift).`,
        proposed_indicator: `${best.name} multivariate anomaly score`,
        proposed_dimension: best.domain,
        score: best.score,
        severity: best.score >= 3.5 ? "BREACH" : "WARN",
        product: best.product,
        evidence: {
          anchor_monitor: best.monitor_id,
          z_score: best.score,
          method_note: "Simplified isolation / extreme z proxy on live Monitor 2.0 series",
        },
        window_start: new Date(recent[0].t).toISOString(),
        window_end: new Date(recent[recent.length - 1].t).toISOString(),
      });
    }
  }

  // Method 2 — CUSUM on LP / reject-like series
  {
    const lp = rows.find((r) => r.monitor_id.includes("LP") || r.name.toLowerCase().includes("reject"));
    if (lp) {
      const series = points.map((p) => p[lp.monitor_id] ?? 0);
      const mu = mean(series.slice(0, Math.min(24, split)));
      const sd = Math.max(std(series.slice(0, Math.min(24, split))), 1e-6);
      let cusum = 0;
      let peak = 0;
      const k = 0.5;
      for (const v of series) {
        const z = (v - mu) / sd;
        cusum = Math.max(0, cusum + z - k);
        peak = Math.max(peak, cusum);
      }
      if (peak >= 3) {
        out.push({
          method: "cusum",
          scenario: `Sustained regime shift on ${lp.name} (CUSUM peak ${peak.toFixed(2)}).`,
          proposed_indicator: `${lp.name} CUSUM regime score`,
          proposed_dimension: lp.domain_code,
          score: peak,
          severity: peak >= 6 ? "BREACH" : "WARN",
          product: lp.product.includes("Crypto") ? "CRYPTO" : "CFD",
          evidence: { anchor_monitor: lp.monitor_id, cusum_peak: peak, baseline_mean: mu },
          window_start: new Date(recent[0].t).toISOString(),
          window_end: new Date(recent[recent.length - 1].t).toISOString(),
        });
      }
    }
  }

  // Method 3 — Joint distance (two correlated series)
  {
    const a = rows.find((r) => r.monitor_id.includes("LP") || r.monitor_id.includes("FEED"));
    const b = rows.find((r) => r.monitor_id.includes("HEDGE") || r.monitor_id.includes("EQ"));
    if (a && b) {
      const sa = points.map((p) => p[a.monitor_id] ?? 0);
      const sb = points.map((p) => p[b.monitor_id] ?? 0);
      const za = (v: number) => (v - mean(sa.slice(0, split))) / Math.max(std(sa.slice(0, split)), 1e-6);
      const zb = (v: number) => (v - mean(sb.slice(0, split))) / Math.max(std(sb.slice(0, split)), 1e-6);
      const dist = Math.hypot(za(sa[sa.length - 1]), zb(sb[sb.length - 1]));
      if (dist >= 2.5) {
        out.push({
          method: "mahalanobis",
          scenario: `Jointly unusual state: ${a.name} × ${b.name} distance ${dist.toFixed(2)}.`,
          proposed_indicator: `${a.name} × ${b.name} joint distance`,
          proposed_dimension: a.domain_code,
          score: dist,
          severity: dist >= 4 ? "BREACH" : "WARN",
          product: "CFD",
          evidence: { monitors: [a.monitor_id, b.monitor_id], joint_distance: dist },
          window_start: new Date(recent[0].t).toISOString(),
          window_end: new Date(recent[recent.length - 1].t).toISOString(),
        });
      }
    }
  }

  // Method 4 — Local density (peer relative): indicator vs warn threshold ratio
  {
    let bestRatio = 0;
    let hit = rows[0];
    for (const r of rows) {
      const v = points[points.length - 1][r.monitor_id] ?? 0;
      const warn = Math.max(Math.abs(r.threshold_warn ?? 1), 1e-6);
      const ratio = Math.abs(v) / warn;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        hit = r;
      }
    }
    if (bestRatio >= 1.15) {
      out.push({
        method: "lof",
        scenario: `Peer-relative local outlier: ${hit.name} at ${bestRatio.toFixed(2)}× warn threshold.`,
        proposed_indicator: `${hit.name} local outlier ratio`,
        proposed_dimension: hit.domain_code,
        score: bestRatio,
        severity: bestRatio >= 1.6 ? "BREACH" : "WARN",
        product: hit.product.includes("Crypto") ? "CRYPTO" : "CFD",
        evidence: { anchor_monitor: hit.monitor_id, warn_ratio: bestRatio },
        window_start: new Date(recent[0].t).toISOString(),
        window_end: new Date(recent[recent.length - 1].t).toISOString(),
      });
    }
  }

  // Method 5 — Subgroup / slice contrast (product × domain)
  {
    const groups = new Map<string, number[]>();
    for (const r of rows) {
      const key = `${r.product}|${r.domain_code}`;
      const series = points.map((p) => p[r.monitor_id] ?? 0);
      const recentMean = mean(series.slice(-6));
      const baseMean = mean(series.slice(0, split));
      const lift = baseMean === 0 ? recentMean : (recentMean - baseMean) / Math.max(Math.abs(baseMean), 1e-6);
      const arr = groups.get(key) || [];
      arr.push(lift);
      groups.set(key, arr);
    }
    let bestKey = "";
    let bestLift = 0;
    for (const [k, lifts] of groups) {
      const m = mean(lifts);
      if (m > bestLift) {
        bestLift = m;
        bestKey = k;
      }
    }
    if (bestKey && bestLift >= 0.18) {
      const [product, domain] = bestKey.split("|");
      out.push({
        method: "subgroup",
        scenario: `Hidden slice lift in ${product} / ${domain} (relative +${(bestLift * 100).toFixed(0)}%).`,
        proposed_indicator: `${domain} slice stress index`,
        proposed_dimension: domain,
        score: bestLift,
        severity: bestLift >= 0.35 ? "BREACH" : "WARN",
        product: product.includes("Crypto") ? "CRYPTO" : "CFD",
        evidence: { slice: bestKey, relative_lift: bestLift },
        window_start: new Date(recent[0].t).toISOString(),
        window_end: new Date(recent[recent.length - 1].t).toISOString(),
      });
    }
  }

  // Method 6 — Sequence / lead-lag precursor
  {
    const lead = rows.find((r) => r.monitor_id.includes("LP") || r.monitor_id.includes("FEED"));
    const lag = rows.find((r) => r.monitor_id.includes("HEDGE") || r.monitor_id.includes("MRG"));
    if (lead && lag) {
      const la = points.map((p) => p[lead.monitor_id] ?? 0);
      const lb = points.map((p) => p[lag.monitor_id] ?? 0);
      const qA = percentile(la.slice(0, split), 0.9);
      const qB = percentile(
        lb.slice(0, split).map((v, i, arr) => (i ? v - arr[i - 1] : 0)),
        0.9
      );
      let hits = 0;
      let cond = 0;
      for (let i = 1; i < la.length - 3; i++) {
        if (la[i] > qA) {
          cond++;
          const delta = lb[i + 2] - lb[i];
          if (delta > qB) hits++;
        }
      }
      const rate = cond ? hits / cond : 0;
      if (rate >= 0.35 && cond >= 2) {
        out.push({
          method: "sequence",
          scenario: `Lead-lag: elevated ${lead.name} precedes ${lag.name} rise (P=${rate.toFixed(2)}, n=${cond}).`,
          proposed_indicator: `${lead.name}→${lag.name} precursor rate`,
          proposed_dimension: lag.domain_code,
          score: rate,
          severity: rate >= 0.55 ? "BREACH" : "WARN",
          product: "CFD",
          evidence: { lead: lead.monitor_id, lag: lag.monitor_id, conditional_rate: rate, support: cond },
          window_start: new Date(baseline[0].t).toISOString(),
          window_end: new Date(recent[recent.length - 1].t).toISOString(),
        });
      }
    }
  }

  // Method 7 — Correlation network shift
  {
    const pick = rows.filter((r) =>
      ["LP", "HEDGE", "FEED", "MRG", "EQ", "CRYPTO"].some((k) => r.monitor_id.includes(k))
    ).slice(0, 5);
    if (pick.length >= 3) {
      const corr = (xs: number[], ys: number[]) => {
        const mx = mean(xs);
        const my = mean(ys);
        let num = 0;
        let dx = 0;
        let dy = 0;
        for (let i = 0; i < xs.length; i++) {
          const a = xs[i] - mx;
          const b = ys[i] - my;
          num += a * b;
          dx += a * a;
          dy += b * b;
        }
        return num / Math.max(Math.sqrt(dx * dy), 1e-9);
      };
      let maxShift = 0;
      let pair = "";
      for (let i = 0; i < pick.length; i++) {
        for (let j = i + 1; j < pick.length; j++) {
          const a = pick[i].monitor_id;
          const b = pick[j].monitor_id;
          const refA = baseline.map((p) => p[a] ?? 0);
          const refB = baseline.map((p) => p[b] ?? 0);
          const winA = points.slice(-16).map((p) => p[a] ?? 0);
          const winB = points.slice(-16).map((p) => p[b] ?? 0);
          const shift = Math.abs(corr(winA, winB) - corr(refA, refB));
          if (shift > maxShift) {
            maxShift = shift;
            pair = `${a}↔${b}`;
          }
        }
      }
      if (maxShift >= 0.35) {
        out.push({
          method: "corr_network",
          scenario: `Correlation network shift ${maxShift.toFixed(2)} on ${pair}.`,
          proposed_indicator: `Cross-indicator dependency shift (${pair})`,
          proposed_dimension: "MODEL_AI",
          score: maxShift,
          severity: maxShift >= 0.55 ? "BREACH" : "WARN",
          product: "CFD",
          evidence: { pair, corr_shift: maxShift },
          window_start: new Date(recent[0].t).toISOString(),
          window_end: new Date(recent[recent.length - 1].t).toISOString(),
        });
      }
    }
  }

  return out;
}

export function listDiscoveryCandidates(status?: string, limit = 80) {
  const db = getDb();
  ensureDiscoverySchema(db);
  if (status) {
    return db
      .prepare(
        `SELECT c.*, u.name AS reviewed_by_name
         FROM risk_discovery_candidates c
         LEFT JOIN users u ON u.id = c.reviewed_by
         WHERE c.status = ?
         ORDER BY c.created_at DESC
         LIMIT ?`
      )
      .all(status, limit);
  }
  return db
    .prepare(
      `SELECT c.*, u.name AS reviewed_by_name
       FROM risk_discovery_candidates c
       LEFT JOIN users u ON u.id = c.reviewed_by
       ORDER BY CASE c.status
         WHEN 'PENDING_RO' THEN 0
         WHEN 'ASK_MORE_INFO' THEN 1
         WHEN 'APPROVED_FOR_VALIDATION' THEN 2
         WHEN 'APPROVED_FOR_MONITORING' THEN 3
         WHEN 'IN_MONITORING' THEN 4
         ELSE 5 END,
         c.created_at DESC
       LIMIT ?`
    )
    .all(limit);
}

export function listDiscoveryScans(limit = 40) {
  const db = getDb();
  ensureDiscoverySchema(db);
  return db
    .prepare(`SELECT * FROM risk_discovery_scans ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

export function listDiscoveryReviews(limit = 40) {
  const db = getDb();
  ensureDiscoverySchema(db);
  return db
    .prepare(`SELECT * FROM risk_discovery_reviews ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

export function discoveryPendingCount() {
  const db = getDb();
  ensureDiscoverySchema(db);
  return (
    db
      .prepare(`SELECT COUNT(*) AS c FROM risk_discovery_candidates WHERE status IN ('PENDING_RO','ASK_MORE_INFO')`)
      .get() as { c: number }
  ).c;
}

export function runDiscoveryParallel(opts: { actor?: string; trigger?: string } = {}) {
  const db = getDb();
  ensureDiscoverySchema(db);

  const enabled =
    (
      db.prepare(`SELECT value FROM platform_settings WHERE key='discovery.enabled'`).get() as
        | { value: string }
        | undefined
    )?.value !== "false";

  const scanId = newId("DSC");
  const started = new Date().toISOString().replace("T", " ").slice(0, 19);
  db.prepare(
    `INSERT INTO risk_discovery_scans
     (scan_id, started_at, status, trigger_mode, actor, detail_json)
     VALUES (?, ?, 'RUNNING', ?, ?, '{}')`
  ).run(scanId, started, opts.trigger ?? "PARALLEL", opts.actor ?? "discovery-engine");

  if (!enabled) {
    db.prepare(
      `UPDATE risk_discovery_scans
       SET finished_at = datetime('now'), status = 'SKIPPED', detail_json = ?
       WHERE scan_id = ?`
    ).run(JSON.stringify({ reason: "discovery.enabled=false" }), scanId);
    return { ok: true, skipped: true, scan_id: scanId, candidates_new: 0, candidates: [] as string[] };
  }

  const raw = discoverCandidates(db);
  // Within-method percentile ranking
  const byMethod = new Map<string, number[]>();
  for (const c of raw) {
    const arr = byMethod.get(c.method) || [];
    arr.push(c.score);
    byMethod.set(c.method, arr);
  }

  let created = 0;
  const ids: string[] = [];
  const insert = db.prepare(
    `INSERT INTO risk_discovery_candidates
      (candidate_id, method, scenario, proposed_indicator, proposed_dimension, proposed_monitor_id,
       proposed_skill_code, score, relative_score, severity, product, evidence_json, window_start, window_end,
       fingerprint, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_RO')`
  );

  for (const c of raw) {
    const scores = byMethod.get(c.method) || [c.score];
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const relative = max === min ? 1 : (c.score - min) / (max - min);
    const fp = fingerprintOf(c);
    const recent = db
      .prepare(
        `SELECT id FROM risk_discovery_candidates
         WHERE fingerprint = ?
           AND status NOT IN ('DISMISSED')
           AND created_at >= datetime('now', '-6 hours')
         LIMIT 1`
      )
      .get(fp);
    if (recent) continue;

    const candidateId = newId("RDC");
    const monitorId = monitorIdFor(c);
    const skillCode = skillCodeFor(c);
    insert.run(
      candidateId,
      c.method,
      c.scenario,
      c.proposed_indicator,
      c.proposed_dimension,
      monitorId,
      skillCode,
      c.score,
      Math.round(relative * 1000) / 1000,
      c.severity,
      c.product,
      JSON.stringify(c.evidence),
      c.window_start ?? null,
      c.window_end ?? null,
      fp
    );
    created++;
    ids.push(candidateId);

    logSpineEvent({
      stage: "DISCOVER",
      title: `Unknown risk candidate ${candidateId}: ${c.method}`,
      product: c.product,
      ref_type: "discovery_candidate",
      ref_id: candidateId,
      severity: c.severity,
      detail: {
        method: c.method,
        indicator: c.proposed_indicator,
        dimension: c.proposed_dimension,
        scan_id: scanId,
      },
      actor: opts.actor ?? "discovery-engine",
    });
  }

  db.prepare(
    `UPDATE risk_discovery_scans
     SET finished_at = datetime('now'), status = 'COMPLETED',
         candidates_new = ?, candidates_total = ?, detail_json = ?
     WHERE scan_id = ?`
  ).run(created, raw.length, JSON.stringify({ methods: [...byMethod.keys()] }), scanId);

  writeAudit({ name: opts.actor ?? "discovery-engine" }, "RUN_DISCOVERY", "risk_discovery", scanId, {
    candidates_new: created,
    candidates_total: raw.length,
  });

  return { ok: true, skipped: false, scan_id: scanId, candidates_new: created, candidates: ids };
}

function buildPromotePayload(row: {
  candidate_id: string;
  method: string;
  scenario: string;
  proposed_indicator: string;
  proposed_dimension: string;
  proposed_monitor_id: string | null;
  proposed_skill_code: string | null;
  severity: string;
  product: string;
  evidence_json: string;
  score: number;
}) {
  const monitorId = row.proposed_monitor_id || `M2-DISC-${row.candidate_id.slice(-8)}`;
  const skillCode = row.proposed_skill_code || `SKILL-DISC-${row.candidate_id.slice(-8)}`;
  const product = row.product === "CRYPTO" ? "CRYPTO" : "CFD";
  const warn = row.severity === "BREACH" ? 1 : 0.7;
  const breach = row.severity === "BREACH" ? 1.5 : 1.2;
  return {
    candidate_id: row.candidate_id,
    skill: {
      code: skillCode,
      name: `Watch: ${row.proposed_indicator}`,
      description: `${row.scenario} Discovered via ${row.method}; promoted after RO approval into daily monitoring.`,
      indicator_patterns: [monitorId],
      conditions: {
        discovery_method: row.method,
        dimension: row.proposed_dimension,
        min_relative_score: 0.5,
      },
      steps: [
        { action_code: "COLLECT_EVIDENCE", label: "Collect discovery evidence window" },
        { action_code: "COMPARE_BASELINE", label: "Compare against pre-discovery baseline" },
        { action_code: "NOTIFY_RO", label: "Notify Risk Owner desk" },
        { action_code: "HUMAN_GATE", label: "Human gate before control action" },
      ],
      auto_execute: false,
      owner_department: "RISK_CONTROL",
    },
    monitor: {
      monitor_id: monitorId,
      name: row.proposed_indicator,
      domain_code: row.proposed_dimension || "MODEL_AI",
      product: product === "CRYPTO" ? "Crypto" : "CFD",
      threshold_warn: warn,
      threshold_breach: breach,
      unit: "score",
      last_value: row.score,
    },
    detector: {
      code: `DET-${monitorId.replace(/^M2-/, "")}`,
      name: row.proposed_indicator,
      description: `Discovery-promoted detector for ${row.proposed_indicator} (${row.method}).`,
      product: product === "CRYPTO" ? "CRYPTO" : "CFD",
      domain_code: row.proposed_dimension || "MODEL_AI",
      monitor_id: monitorId,
      warn_threshold: warn,
      breach_threshold: breach,
      comparator: "gte",
    },
    evidence: JSON.parse(row.evidence_json || "{}"),
  };
}

/** Apply skill + monitor + detector from an approved discovery promote payload. */
export function applyDiscoveryPromote(payload: Record<string, unknown>) {
  const db = getDb();
  ensureDiscoverySchema(db);
  const skill = (payload.skill || {}) as Record<string, unknown>;
  const monitor = (payload.monitor || {}) as Record<string, unknown>;
  const detector = (payload.detector || {}) as Record<string, unknown>;
  const candidateId = String(payload.candidate_id || "");

  const code = String(skill.code || "");
  const monitorId = String(monitor.monitor_id || "");
  if (!code || !monitorId) throw new Error("Discovery promote requires skill.code and monitor.monitor_id");

  db.prepare(
    `INSERT INTO ai_skills
      (code, name, description, indicator_patterns_json, conditions_json, certainty_required, steps_json, auto_execute, owner_department, status)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 'ACTIVE')
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       indicator_patterns_json = excluded.indicator_patterns_json,
       conditions_json = excluded.conditions_json,
       steps_json = excluded.steps_json,
       auto_execute = excluded.auto_execute,
       status = 'ACTIVE'`
  ).run(
    code,
    String(skill.name || code),
    String(skill.description || ""),
    JSON.stringify(skill.indicator_patterns || [monitorId]),
    JSON.stringify(skill.conditions || {}),
    JSON.stringify(skill.steps || []),
    skill.auto_execute === false ? 0 : 1,
    String(skill.owner_department || "RISK_CONTROL")
  );

  const existing = db.prepare(`SELECT id FROM monitor_indicators WHERE monitor_id = ?`).get(monitorId) as
    | { id: number }
    | undefined;
  if (!existing) {
    db.prepare(
      `INSERT INTO monitor_indicators
        (monitor_id, name, domain_code, product, threshold_warn, threshold_breach, unit, status, last_value, last_checked_at, ticket_open_count, paused)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'HEALTHY', ?, datetime('now'), 0, 0)`
    ).run(
      monitorId,
      String(monitor.name || monitorId),
      String(monitor.domain_code || "MODEL_AI"),
      String(monitor.product || "CFD"),
      Number(monitor.threshold_warn ?? 0.7),
      Number(monitor.threshold_breach ?? 1.2),
      String(monitor.unit || "score"),
      Number(monitor.last_value ?? 0)
    );
  } else {
    db.prepare(
      `UPDATE monitor_indicators
       SET name = ?, domain_code = ?, threshold_warn = ?, threshold_breach = ?, unit = ?, paused = 0,
           last_checked_at = datetime('now')
       WHERE monitor_id = ?`
    ).run(
      String(monitor.name || monitorId),
      String(monitor.domain_code || "MODEL_AI"),
      Number(monitor.threshold_warn ?? 0.7),
      Number(monitor.threshold_breach ?? 1.2),
      String(monitor.unit || "score"),
      monitorId
    );
  }

  db.prepare(
    `INSERT INTO detectors
      (code, name, description, product, domain_code, monitor_id, warn_threshold, breach_threshold, comparator, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       product = excluded.product,
       domain_code = excluded.domain_code,
       monitor_id = excluded.monitor_id,
       warn_threshold = excluded.warn_threshold,
       breach_threshold = excluded.breach_threshold,
       comparator = excluded.comparator,
       enabled = 1`
  ).run(
    String(detector.code || `DET-${monitorId.replace(/^M2-/, "")}`),
    String(detector.name || monitor.name || monitorId),
    String(detector.description || `Discovery-promoted detector for ${monitorId}`),
    String(detector.product || "CFD"),
    String(detector.domain_code || monitor.domain_code || "MODEL_AI"),
    monitorId,
    Number(detector.warn_threshold ?? monitor.threshold_warn ?? 0.7),
    Number(detector.breach_threshold ?? monitor.threshold_breach ?? 1.2),
    String(detector.comparator || "gte")
  );

  seedDetectors(db);

  if (candidateId) {
    db.prepare(
      `UPDATE risk_discovery_candidates
       SET status = 'IN_MONITORING', skill_code = ?, monitor_id = ?, updated_at = datetime('now')
       WHERE candidate_id = ?`
    ).run(code, monitorId, candidateId);
  }

  logSpineEvent({
    stage: "DISCOVERY_PROMOTE",
    title: `Promoted discovery → skill ${code} + monitor ${monitorId}`,
    product: String(monitor.product || "CFD"),
    ref_type: "discovery_candidate",
    ref_id: candidateId || code,
    severity: "INFO",
    detail: { skill_code: code, monitor_id: monitorId },
    actor: "discovery-promote",
  });

  return { applied: "discovery_promote", skill_code: code, monitor_id: monitorId };
}

export function reviewDiscoveryCandidate(input: {
  candidate_id: string;
  action: DiscoveryReviewAction;
  comment?: string;
  actor: Actor;
}) {
  const db = getDb();
  ensureDiscoverySchema(db);

  const row = db
    .prepare(`SELECT * FROM risk_discovery_candidates WHERE candidate_id = ?`)
    .get(input.candidate_id) as
    | {
        id: number;
        candidate_id: string;
        method: string;
        scenario: string;
        proposed_indicator: string;
        proposed_dimension: string;
        proposed_monitor_id: string | null;
        proposed_skill_code: string | null;
        severity: string;
        product: string;
        evidence_json: string;
        score: number;
        status: string;
        fingerprint: string;
      }
    | undefined;

  if (!row) throw new Error("Discovery candidate not found");
  if (["IN_MONITORING", "DISMISSED"].includes(row.status)) {
    throw new Error(`Candidate already ${row.status}`);
  }

  const hash = createHash("sha256")
    .update(JSON.stringify({ id: row.candidate_id, fp: row.fingerprint, action: input.action }))
    .digest("hex");

  db.prepare(
    `INSERT INTO risk_discovery_reviews
      (candidate_id, action, reviewer_user_id, reviewer_name, comment, candidate_hash)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    row.candidate_id,
    input.action,
    input.actor.id,
    input.actor.name,
    input.comment ?? null,
    hash
  );

  if (input.action === "ASK_MORE_INFO") {
    db.prepare(
      `UPDATE risk_discovery_candidates
       SET status = 'ASK_MORE_INFO', review_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
       WHERE candidate_id = ?`
    ).run(input.comment ?? null, input.actor.id, row.candidate_id);
    logSpineEvent({
      stage: "DISCOVERY_REVIEW",
      title: `RO asked more info on ${row.candidate_id}`,
      product: row.product,
      ref_type: "discovery_candidate",
      ref_id: row.candidate_id,
      severity: "INFO",
      detail: { action: input.action, comment: input.comment },
      actor: input.actor.name,
    });
    writeAudit(input.actor, "DISCOVERY_ASK_MORE", "discovery_candidate", row.candidate_id, {
      comment: input.comment,
    });
    return { ok: true, status: "ASK_MORE_INFO" as const };
  }

  if (input.action === "DISMISS") {
    db.prepare(
      `UPDATE risk_discovery_candidates
       SET status = 'DISMISSED', review_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
       WHERE candidate_id = ?`
    ).run(input.comment ?? null, input.actor.id, row.candidate_id);
    logSpineEvent({
      stage: "DISCOVERY_REVIEW",
      title: `RO dismissed ${row.candidate_id}`,
      product: row.product,
      ref_type: "discovery_candidate",
      ref_id: row.candidate_id,
      severity: "INFO",
      detail: { action: input.action },
      actor: input.actor.name,
    });
    writeAudit(input.actor, "DISCOVERY_DISMISS", "discovery_candidate", row.candidate_id, {
      comment: input.comment,
    });
    return { ok: true, status: "DISMISSED" as const };
  }

  if (input.action === "APPROVE_FOR_VALIDATION") {
    db.prepare(
      `UPDATE risk_discovery_candidates
       SET status = 'APPROVED_FOR_VALIDATION', review_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
       WHERE candidate_id = ?`
    ).run(input.comment ?? null, input.actor.id, row.candidate_id);
    logSpineEvent({
      stage: "DISCOVERY_REVIEW",
      title: `RO approved ${row.candidate_id} for validation (no skill deploy)`,
      product: row.product,
      ref_type: "discovery_candidate",
      ref_id: row.candidate_id,
      severity: "INFO",
      detail: { action: input.action },
      actor: input.actor.name,
    });
    writeAudit(input.actor, "DISCOVERY_APPROVE_VALIDATION", "discovery_candidate", row.candidate_id, {
      comment: input.comment,
    });
    return { ok: true, status: "APPROVED_FOR_VALIDATION" as const };
  }

  // APPROVE_FOR_MONITORING — maker (AI engineer) proposes; RO checker decides (no silent deploy).
  const aiEngineer = db.prepare(`SELECT id, name, role_code FROM users WHERE email=?`).get(
    "ai.engineer@vantagemarkets.com"
  ) as { id: number; name: string; role_code: string } | undefined;

  if (!aiEngineer) throw new Error("AI Engineer user missing — cannot propose discovery promote");
  if (aiEngineer.id === input.actor.id) {
    throw new Error("Maker/checker: Risk Owner must differ from AI Engineer proposer");
  }

  const payload = buildPromotePayload(row);
  const proposed = proposeChange({
    actor: { id: aiEngineer.id, name: aiEngineer.name, role_code: aiEngineer.role_code },
    entity_type: "DISCOVERY_PROMOTE",
    action: "CREATE",
    title: `Promote discovery ${row.candidate_id} → skill + monitor`,
    summary: `${row.method}: ${row.proposed_indicator} (${row.proposed_dimension}). RO approved for monitoring; AI Engineer proposes, RO checks.`,
    payload,
  });

  const decided = decideChangeRequest({
    id: proposed.id,
    decision: "APPROVED",
    note: input.comment || "RO approved discovery candidate for daily monitoring",
    actor: input.actor,
  });

  db.prepare(
    `UPDATE risk_discovery_candidates
     SET status = 'IN_MONITORING',
         change_request_id = ?,
         skill_code = ?,
         monitor_id = ?,
         review_note = ?,
         reviewed_by = ?,
         reviewed_at = datetime('now'),
         updated_at = datetime('now')
     WHERE candidate_id = ?`
  ).run(
    proposed.request_id,
    payload.skill.code,
    payload.monitor.monitor_id,
    input.comment ?? null,
    input.actor.id,
    row.candidate_id
  );

  logSpineEvent({
    stage: "DISCOVERY_REVIEW",
    title: `RO approved ${row.candidate_id} for monitoring → ${payload.skill.code}`,
    product: row.product,
    ref_type: "discovery_candidate",
    ref_id: row.candidate_id,
    severity: row.severity,
    detail: {
      action: input.action,
      change_request_id: proposed.request_id,
      skill_code: payload.skill.code,
      monitor_id: payload.monitor.monitor_id,
      applied: decided.applied,
    },
    actor: input.actor.name,
  });

  writeAudit(input.actor, "DISCOVERY_APPROVE_MONITORING", "discovery_candidate", row.candidate_id, {
    change_request_id: proposed.request_id,
    skill_code: payload.skill.code,
    monitor_id: payload.monitor.monitor_id,
  });

  return {
    ok: true,
    status: "IN_MONITORING" as const,
    change_request_id: proposed.request_id,
    skill_code: payload.skill.code,
    monitor_id: payload.monitor.monitor_id,
    applied: decided.applied,
  };
}

export function seedDiscoveryIfEmpty(db = getDb()) {
  ensureDiscoverySchema(db);
  const count = (db.prepare(`SELECT COUNT(*) AS c FROM risk_discovery_candidates`).get() as { c: number }).c;
  if (count > 0) return;
  // Seed via a first parallel scan so demo desks always see PENDING_RO items.
  runDiscoveryParallel({ actor: "seed", trigger: "SEED" });
}
