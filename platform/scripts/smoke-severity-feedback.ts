/**
 * Runtime smoke: severity feedback → monthly weight suggestion → apply.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sev-fb-"));
process.env.CRMP_DB_PATH = path.join(tmp, "smoke.db");

async function main() {
  const { getDb } = await import("../src/lib/db");
  const {
    submitSeverityRecommendation,
    getMonthlyWeightSuggestion,
    applyMonthlyWeightSuggestion,
    seedSeverityFeedbackIfEmpty,
    listSeverityFeedback,
  } = await import("../src/lib/severity-feedback");

  const db = getDb();
  seedSeverityFeedbackIfEmpty(db);
  const seeded = listSeverityFeedback(20);
  assert.ok(seeded.length >= 3, "expected seed rows");

  const row = submitSeverityRecommendation({
    ai_severity: "WARN",
    recommended_p: 1,
    reason: "Smoke test: upgrade WARN to P1 for cohort stress.",
    actor: { id: 1, name: "Smoke Tester" },
    thread_code: "SMOKE-THREAD",
  });
  assert.equal(row.recommended_p, 1);
  assert.equal(row.recommended_ops, "BREACH");

  const pack = getMonthlyWeightSuggestion();
  assert.ok(pack.sample_count >= 1);
  assert.ok(pack.suggested_coefficients.severity > 0);

  const applied = applyMonthlyWeightSuggestion({ actor: { id: 1, name: "Smoke Tester" } });
  assert.equal(applied.applied, true);

  const route = db
    .prepare(
      `SELECT coefficients_json FROM escalation_routes WHERE route_code = 'ESC-DEFAULT' OR is_default = 1 LIMIT 1`
    )
    .get() as { coefficients_json: string } | undefined;
  assert.ok(route, "ESC-DEFAULT route exists");
  const coeffs = JSON.parse(route!.coefficients_json);
  assert.ok(typeof coeffs.severity === "number");

  console.log("ok: smoke severity feedback", {
    samples: pack.sample_count,
    severity: coeffs.severity,
    feedback_id: row.feedback_id,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
