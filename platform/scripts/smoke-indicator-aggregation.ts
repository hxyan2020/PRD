/**
 * Smoke: seed demos + start / inject / timeout paths.
 */
import assert from "node:assert/strict";
import {
  closeWaitWindowAsSingle,
  continuePostL2Flow,
  forceAggregateIncomplete,
  getAggregationBoardPack,
  injectRelatedAlert,
  startAggregationSession,
} from "../src/lib/indicator-aggregation";
import { computeL2Severity } from "../src/lib/indicator-aggregation-shared";

{
  const calc = computeL2Severity({
    l1_severities: { "M2-A": "WARN", "M2-B": "BREACH" },
    severity_weight: 1.25,
  });
  assert.equal(calc.base, "BREACH");
  assert.ok(calc.final_rank >= calc.base_rank);
  assert.equal(calc.final, "CRITICAL", "weight + multi-L1 can upgrade one band");
  const floor = computeL2Severity({
    l1_severities: { "M2-A": "CRITICAL" },
    severity_weight: 0.5,
  });
  assert.equal(floor.final, "CRITICAL", "never below max(L1) even with low weight");
}

const pack = getAggregationBoardPack();
assert.ok(pack.definitions.length >= 1, "definitions");
assert.ok(pack.sessions.length >= 3, "seeded sessions");
assert.equal(pack.linear_steps.length, 8);

const outcomes = new Set(pack.sessions.map((s) => s.outcome));
assert.ok(outcomes.has("SINGLE_NO_MEMBERSHIP") || outcomes.has("AGGREGATED") || outcomes.has("SINGLE_WINDOW_TIMEOUT"));

const orphan = startAggregationSession({
  trigger_monitor: "M2-ORPHAN-SMOKE",
  trigger_severity: "WARN",
  actor: { id: null, name: "smoke" },
});
assert.equal(orphan.outcome, "SINGLE_NO_MEMBERSHIP");
assert.equal(orphan.step, "RO_SINGLE");

const def = pack.definitions.find((d) => d.member_monitors.length >= 2);
assert.ok(def, "chain with 2+ members");
const wait = startAggregationSession({
  trigger_monitor: def!.member_monitors[0],
  trigger_severity: "BREACH",
  actor: { id: null, name: "smoke" },
});
assert.equal(wait.step, "CORRELATED_WAIT");
assert.equal(wait.outcome, "PENDING");
assert.ok(wait.correlation_marked);

const related = def!.member_monitors.find((m) => m !== wait.trigger_monitor)!;
const agg = injectRelatedAlert({
  session_id: wait.session_id,
  related_monitor: related,
  severity: "CRITICAL",
  actor: { id: null, name: "smoke" },
});
assert.equal(agg.outcome, "AGGREGATED");
assert.equal(agg.step, "RO_AGGREGATE");
assert.ok(agg.l2_severity_calc, "L2 severity calc after natural aggregate");
assert.equal(agg.l2_severity_calc!.base, "CRITICAL", "base = max(L1)");
assert.equal(agg.l2_severity, agg.l2_severity_calc!.final);
assert.ok(
  (agg.l2_severity_calc!.final_rank ?? 0) >= (agg.l2_severity_calc!.base_rank ?? 0),
  "L2 never softer than max L1"
);

const wait2 = startAggregationSession({
  trigger_monitor: def!.member_monitors[0],
  trigger_severity: "BREACH",
  actor: { id: null, name: "smoke" },
});
const timed = closeWaitWindowAsSingle({
  session_id: wait2.session_id,
  actor: { id: null, name: "smoke" },
});
assert.equal(timed.outcome, "SINGLE_WINDOW_TIMEOUT");
assert.equal(timed.step, "RO_SINGLE");

const wait3 = startAggregationSession({
  trigger_monitor: def!.member_monitors[0],
  trigger_severity: "BREACH",
  actor: { id: null, name: "smoke" },
});
assert.equal(wait3.step, "CORRELATED_WAIT");
const forced = forceAggregateIncomplete({
  session_id: wait3.session_id,
  reason: "smoke force L2 while L1 incomplete",
  actor: { id: null, name: "smoke" },
});
assert.equal(forced.outcome, "FORCE_AGGREGATED");
assert.equal(forced.force_aggregated, true);
assert.ok((forced.missing_l1_at_force || []).length >= 1);
assert.ok(forced.l2_severity_calc, "L2 severity calc after force-aggregate");
assert.equal(forced.l2_severity_calc!.base, "BREACH", "force path base = trigger max");
assert.ok(
  (forced.l2_severity_calc!.final_rank ?? 0) >= (forced.l2_severity_calc!.base_rank ?? 0),
  "forced L2 never softer than max L1"
);
assert.ok((forced.post_flow || []).includes("L2_SEVERITY"));
const continued = continuePostL2Flow({
  session_id: forced.session_id,
  actor: { id: null, name: "smoke" },
});
assert.ok((continued.post_flow || []).length >= 3);

console.log("ok: smoke indicator aggregation", {
  defs: pack.definitions.length,
  orphan: orphan.session_id,
  aggregated: agg.session_id,
  agg_l2_sev: agg.l2_severity,
  timed: timed.session_id,
  forced: forced.session_id,
  forced_l2_sev: forced.l2_severity,
  missing: forced.missing_l1_at_force,
});
