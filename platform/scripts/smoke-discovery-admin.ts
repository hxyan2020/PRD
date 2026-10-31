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
  assert.ok(scan.scan_seed);
  assert.ok(scan.data_source);
  assert.ok(Array.isArray(scan.thinking_steps) && scan.thinking_steps.length >= 4);
  assert.match(scan.thinking_steps[0], /scan_seed=/);
  assert.ok(
    ["detector_runs", "mixed", "simulated_from_monitor_indicators"].includes(
      String(scan.data_source)
    )
  );

  const scan2 = runDiscoveryParallel({ actor: "smoke", trigger: "SMOKE2" });
  assert.ok(scan2.scan_seed);
  assert.notEqual(scan.scan_seed, scan2.scan_seed, "each scan must use a fresh feature window seed");
  assert.ok(Array.isArray(scan2.thinking_steps) && scan2.thinking_steps.length >= 4);

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
  const evidence = JSON.parse(cand.evidence_json || "{}") as {
    scan_seed?: string;
    data_source?: string;
    thinking?: string[];
  };
  assert.ok(evidence.scan_seed, "candidate evidence must carry scan_seed from SQLite window");
  assert.ok(evidence.data_source);
  assert.ok(Array.isArray(evidence.thinking) && evidence.thinking.length >= 1);

  const suggestion = await analyseDiscoveryCandidate({
    candidate: cand,
    followup: "Need validation plan",
  });
  assert.equal(suggestion.analysis_source, "MOCK");
  assert.ok(suggestion.assessment);
  assert.ok(suggestion.proposed_indicator_formula);
  assert.ok(suggestion.thinking_steps?.length);
  assert.match(suggestion.thinking_steps![0], /Trigger ANL-|觸發 ANL-/);

  const suggestionAgain = await analyseDiscoveryCandidate({
    candidate: cand,
    followup: "Need validation plan",
  });
  assert.notEqual(
    suggestion.thinking_steps![0],
    suggestionAgain.thinking_steps![0],
    "Analyse must regenerate a fresh thinking trail each trigger"
  );

  const suggestionZh = await analyseDiscoveryCandidate({
    candidate: cand,
    followup: "需要驗證計畫",
    locale: "zh-Hant",
  });
  assert.match(suggestionZh.assessment, /MOCK 思考完成|MOCK 回應/);
  assert.ok(suggestionZh.thinking_steps?.length);
  assert.match(suggestionZh.thinking_steps![0], /觸發 ANL-/);
  assert.ok(
    suggestionZh.possible_root_causes.some((c) => /市場|流動性|行情|拒絕|對沖|報價/.test(c))
  );

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
        scan_seed: scan.scan_seed,
        scan_seed_2: scan2.scan_seed,
        data_source: scan.data_source,
        scan_thinking_steps: scan.thinking_steps?.length,
        analyse_thinking_steps: suggestion.thinking_steps?.length,
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
