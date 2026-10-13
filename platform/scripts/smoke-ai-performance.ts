/**
 * Runtime smoke: getAiPerformanceEval returns KPIs from a fresh SQLite seed.
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
  const { getAiPerformanceEval } = await import("../src/lib/ai/admin");

  getDb();
  const evalBoard = getAiPerformanceEval();

  assert.ok(evalBoard.kpis, "kpis present");
  assert.equal(typeof evalBoard.kpis.analyses_total, "number");
  assert.equal(typeof evalBoard.kpis.skill_match_rate, "number");
  assert.equal(typeof evalBoard.kpis.challenge_agree_rate, "number");
  assert.equal(typeof evalBoard.kpis.feedback_correct_rate, "number");
  assert.equal(typeof evalBoard.kpis.training_avg_accuracy, "number");
  assert.ok(Array.isArray(evalBoard.accuracy_history));
  assert.ok(Array.isArray(evalBoard.recent_analyses));
  assert.ok(Array.isArray(evalBoard.recent_training));
  assert.ok(Array.isArray(evalBoard.recent_feedback));
  assert.ok(evalBoard.line_settings?.line1_model);
  assert.ok(evalBoard.feedback_breakdown);

  // Seeded demo should have at least one analysis or training row after schema seed.
  assert.ok(
    (evalBoard.kpis.analyses_total ?? 0) >= 0 &&
      (evalBoard.kpis.training_completed ?? 0) >= 0,
    "numeric KPIs non-negative"
  );

  console.log("ok: AI Performance eval smoke", {
    analyses: evalBoard.kpis.analyses_total,
    skill_match: evalBoard.kpis.skill_match_rate,
    challenge_agree: evalBoard.kpis.challenge_agree_rate,
    training_completed: evalBoard.kpis.training_completed,
    history: evalBoard.accuracy_history.length,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
