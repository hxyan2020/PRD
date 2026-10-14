/**
 * Runtime smoke: live formula scores P1 on demo alert; weekly pack + CR propose path.
 */
import assert from "node:assert/strict";
import {
  DEMO_ALERT_OBSERVATIONS,
  getLiveSeverityFormula,
  getWeeklyFormulaSuggestion,
  proposeWeeklyFormulaChange,
  scoreSeverityFormula,
  seedSeverityFormulaLoop,
  weekKey,
} from "../src/lib/severity-formula";
import { seedSeverityFeedbackIfEmpty } from "../src/lib/severity-feedback";
import { getDb } from "../src/lib/db";

const db = getDb();
seedSeverityFeedbackIfEmpty(db);
seedSeverityFormulaLoop(db);

const live = getLiveSeverityFormula();
const scored = scoreSeverityFormula(live, DEMO_ALERT_OBSERVATIONS);
assert.ok([0, 1, 2, 3].includes(scored.p), "score yields P0–P3");
assert.equal(scored.p, 1, `demo alert should land P1 under default formula, got P${scored.p}`);

const weekly = getWeeklyFormulaSuggestion();
assert.ok(weekly.sample_count > 0, "weekly pack has samples after seed");
assert.ok(weekly.factor_changes.some((c) => c.change !== "unchanged"), "AI suggests factor diffs");

if (weekly.pending_status !== "PENDING") {
  const again = proposeWeeklyFormulaChange({ week: weekKey() });
  assert.ok(again.pending_cr_id, "propose creates pending CR");
  assert.equal(again.pending_status, "PENDING");
} else {
  assert.ok(weekly.pending_cr_id, "seed left a pending CR for RO");
}

console.log("ok: smoke severity formula", {
  version: live.version,
  score: scored.score,
  p: scored.p,
  week: weekly.week_key,
  samples: weekly.sample_count,
  cr: weekly.pending_request_id,
  status: weekly.pending_status,
});
