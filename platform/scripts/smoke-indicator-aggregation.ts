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
  actor: { id: null, name: "smoke" },
});
assert.equal(agg.outcome, "AGGREGATED");
assert.equal(agg.step, "RO_AGGREGATE");

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
const continued = continuePostL2Flow({
  session_id: forced.session_id,
  actor: { id: null, name: "smoke" },
});
assert.ok((continued.post_flow || []).length >= 3);

console.log("ok: smoke indicator aggregation", {
  defs: pack.definitions.length,
  orphan: orphan.session_id,
  aggregated: agg.session_id,
  timed: timed.session_id,
  forced: forced.session_id,
  missing: forced.missing_l1_at_force,
});
