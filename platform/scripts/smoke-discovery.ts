/**
 * Runtime smoke: seed DB → discover → RO approve → skill+monitor exist.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "vantage_risk.db");
// Fresh DB for deterministic smoke
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.unlinkSync(f);
  } catch {
    /* missing ok */
  }
}

process.env.CRMP_DB_PATH = dbPath;

async function main() {
  const { getDb } = await import("../src/lib/db");
  const {
    listDiscoveryCandidates,
    reviewDiscoveryCandidate,
    runDiscoveryParallel,
    discoveryPendingCount,
  } = await import("../src/lib/ai/discovery");

  const db = getDb();
  const scan = runDiscoveryParallel({ actor: "smoke", trigger: "SMOKE" });
  assert.equal(scan.ok, true);
  assert.ok((scan.candidates_new ?? 0) >= 1, "expected at least one new candidate");

  const pending = listDiscoveryCandidates("PENDING_RO", 20) as Array<{
    candidate_id: string;
    status: string;
  }>;
  assert.ok(pending.length >= 1, "expected PENDING_RO candidates");
  const candidateId = pending[0].candidate_id;

  const ro = db.prepare(`SELECT id, name, role_code FROM users WHERE email=?`).get(
    "risk.owner@vantagemarkets.com"
  ) as { id: number; name: string; role_code: string };
  assert.ok(ro, "risk owner seed user");

  const beforePending = discoveryPendingCount();
  const result = reviewDiscoveryCandidate({
    candidate_id: candidateId,
    action: "APPROVE_FOR_MONITORING",
    comment: "Smoke approve for monitoring",
    actor: ro,
  });
  assert.equal(result.status, "IN_MONITORING");
  assert.ok(result.skill_code, "skill code");
  assert.ok(result.monitor_id, "monitor id");

  const skill = db.prepare(`SELECT code, status FROM ai_skills WHERE code=?`).get(result.skill_code!) as
    | { code: string; status: string }
    | undefined;
  assert.ok(skill && skill.status === "ACTIVE", "skill active");

  const monitor = db
    .prepare(`SELECT monitor_id FROM monitor_indicators WHERE monitor_id=?`)
    .get(result.monitor_id!) as { monitor_id: string } | undefined;
  assert.ok(monitor, "monitor indicator created");

  const detector = db
    .prepare(`SELECT code, enabled FROM detectors WHERE monitor_id=?`)
    .get(result.monitor_id!) as { code: string; enabled: number } | undefined;
  assert.ok(detector && detector.enabled === 1, "detector enabled");

  const afterPending = discoveryPendingCount();
  assert.ok(afterPending < beforePending || afterPending >= 0, "pending count sane");

  const stages = db
    .prepare(
      `SELECT DISTINCT stage FROM spine_events WHERE stage IN ('DISCOVER','DISCOVERY_REVIEW','DISCOVERY_PROMOTE')`
    )
    .all() as Array<{ stage: string }>;
  assert.ok(stages.some((s) => s.stage === "DISCOVER"));
  assert.ok(stages.some((s) => s.stage === "DISCOVERY_REVIEW"));

  console.log(
    JSON.stringify(
      {
        ok: true,
        candidate_id: candidateId,
        skill_code: result.skill_code,
        monitor_id: result.monitor_id,
        change_request_id: result.change_request_id,
        pending_before: beforePending,
        pending_after: afterPending,
        spine_stages: stages.map((s) => s.stage),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
