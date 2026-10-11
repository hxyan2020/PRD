/**
 * Runtime smoke on CRMP Admin: discover → analyse (mock) → approve validation / monitoring.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "vantage_risk.db");
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.unlinkSync(f);
  } catch {
    /* ok */
  }
}
process.env.CRMP_DB_PATH = dbPath;

async function main() {
  const { getDb } = await import("../src/lib/db");
  const {
    listDiscoveryCandidates,
    reviewDiscoveryCandidate,
    runDiscoveryParallel,
  } = await import("../src/lib/ai/discovery");
  const {
    analyseDiscoveryCandidate,
    disableDiscoveryOpenAi,
    getDiscoveryAiStatus,
  } = await import("../src/lib/ai/discovery-analyse");

  getDb();
  disableDiscoveryOpenAi();
  assert.equal(getDiscoveryAiStatus().mode, "MOCK");

  const scan = runDiscoveryParallel({ actor: "smoke", trigger: "SMOKE" });
  assert.ok((scan.candidates_new ?? 0) >= 1);

  const pending = listDiscoveryCandidates("PENDING_RO", 20) as Array<{
    candidate_id: string;
    method: string;
    scenario: string;
    proposed_indicator: string;
    proposed_dimension: string;
    score: number;
    evidence_json: string;
    window_start: string | null;
    window_end: string | null;
  }>;
  assert.ok(pending.length >= 1);
  const cand = pending[0];

  const suggestion = await analyseDiscoveryCandidate({
    candidate: cand,
    followup: "Need validation plan",
  });
  assert.equal(suggestion.analysis_source, "MOCK");
  assert.ok(suggestion.assessment);
  assert.ok(suggestion.proposed_indicator_formula);

  const ro = getDb()
    .prepare(`SELECT id, name, role_code FROM users WHERE email=?`)
    .get("risk.owner@vantagemarkets.com") as { id: number; name: string; role_code: string };
  assert.ok(ro);

  const validated = reviewDiscoveryCandidate({
    candidate_id: cand.candidate_id,
    action: "APPROVE_FOR_VALIDATION",
    comment: "Smoke validation gate",
    actor: ro,
  });
  assert.equal(validated.status, "APPROVED_FOR_VALIDATION");

  const pending2 = listDiscoveryCandidates("PENDING_RO", 20) as Array<{ candidate_id: string }>;
  const next = pending2[0];
  assert.ok(next);
  const promoted = reviewDiscoveryCandidate({
    candidate_id: next.candidate_id,
    action: "APPROVE_FOR_MONITORING",
    comment: "Smoke promote",
    actor: ro,
  });
  assert.equal(promoted.status, "IN_MONITORING");
  assert.ok(promoted.skill_code);
  assert.ok(promoted.monitor_id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        analysed: cand.candidate_id,
        suggestion_source: suggestion.analysis_source,
        validated: cand.candidate_id,
        promoted: next.candidate_id,
        skill_code: promoted.skill_code,
        monitor_id: promoted.monitor_id,
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
